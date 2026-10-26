import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { SendNotificationDto } from './dto/send-notification.dto';
import { RegisterPushDeviceDto } from './dto/register-push-device.dto';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { PushDevice, PushDeviceDocument } from './schemas/push-device.schema';

type LocalizedText = {
  en?: string;
  tr?: string;
  fr?: string;
  es?: string;
};

const PUSH_CHANNEL_ID = 'default';

@Injectable()
export class NotificationsService {
  private readonly expo: Expo;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(PushDevice.name)
    private pushDeviceModel: Model<PushDeviceDocument>,
  ) {
    const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
    this.expo = new Expo(accessToken ? { accessToken } : undefined);
  }

  async registerDevice(dto: RegisterPushDeviceDto): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!Expo.isExpoPushToken(dto.token)) {
      throw new BadRequestException('Geçersiz Expo push token');
    }

    const locale = (dto.locale || 'tr').slice(0, 2).toLowerCase();

    await this.pushDeviceModel
      .findOneAndUpdate(
        { token: dto.token },
        {
          token: dto.token,
          locale,
          platform: dto.platform,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    return {
      success: true,
      message: 'Cihaz bildirim kaydı güncellendi',
    };
  }

  async countDevices(): Promise<{ count: number }> {
    const count = await this.pushDeviceModel.countDocuments().exec();
    return { count };
  }

  async sendNotification(sendNotificationDto: SendNotificationDto): Promise<{
    success: boolean;
    recipients: number;
    notification?: NotificationDocument | null;
    message: string;
  }> {
    try {
      const devices = await this.pushDeviceModel
        .find()
        .select('token locale')
        .lean()
        .exec();

      if (devices.length === 0) {
        return {
          success: false,
          recipients: 0,
          message:
            'Kayıtlı bildirim cihazı bulunamadı. Uygulama bildirim izni verip açıldıktan sonra tekrar deneyin.',
        };
      }

      const messages: ExpoPushMessage[] = [];
      const tokensInOrder: string[] = [];
      const invalidTokens: string[] = [];

      for (const device of devices) {
        if (!Expo.isExpoPushToken(device.token)) {
          invalidTokens.push(device.token);
          continue;
        }

        const title = this.pickLocalized(
          sendNotificationDto.headings,
          device.locale,
        );
        const body = this.pickLocalized(
          sendNotificationDto.contents,
          device.locale,
        );

        if (!title && !body) {
          continue;
        }

        const data: Record<string, unknown> = {
          ...(sendNotificationDto.data ?? {}),
        };
        if (sendNotificationDto.url) {
          data.url = sendNotificationDto.url;
        }

        messages.push({
          to: device.token,
          title,
          body,
          sound: 'default',
          priority: 'high',
          channelId: PUSH_CHANNEL_ID,
          ...(Object.keys(data).length > 0 ? { data } : {}),
        });
        tokensInOrder.push(device.token);
      }

      if (messages.length === 0) {
        if (invalidTokens.length > 0) {
          await this.pushDeviceModel
            .deleteMany({ token: { $in: invalidTokens } })
            .exec();
        }

        return {
          success: false,
          recipients: 0,
          message: 'Gönderilecek geçerli cihaz bulunamadı.',
        };
      }

      const { recipients, tokensToRemove } = await this.dispatchMessages(
        messages,
        tokensInOrder,
      );
      tokensToRemove.push(...invalidTokens);

      if (tokensToRemove.length > 0) {
        await this.pushDeviceModel
          .deleteMany({ token: { $in: tokensToRemove } })
          .exec();
      }

      const success = recipients > 0;
      let savedNotification: NotificationDocument | null = null;

      if (sendNotificationDto.saveToDatabase && success) {
        const newNotification = new this.notificationModel({
          headings: sendNotificationDto.headings,
          contents: sendNotificationDto.contents,
          includedSegments: ['all'],
          data: sendNotificationDto.data,
          url: sendNotificationDto.url,
          saved: true,
          provider: 'expo',
          recipientsCount: recipients,
        });
        savedNotification = await newNotification.save();
      }

      const failed = messages.length - recipients;
      let message = `Bildirim ${recipients} cihaza gönderildi`;
      if (!success) {
        message = 'Bildirim hiçbir cihaza ulaşmadı';
      } else if (failed > 0) {
        message = `Bildirim ${recipients} cihaza gönderildi, ${failed} cihaz başarısız oldu`;
      }

      return {
        success,
        recipients,
        notification: savedNotification ?? undefined,
        message,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Bildirim gönderilirken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async getNotifications(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const data = await this.notificationModel
        .find({ saved: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.notificationModel
        .countDocuments({ saved: true })
        .exec();

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Bildirimler getirilirken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async getNotificationById(id: string): Promise<Notification> {
    try {
      const notification = await this.notificationModel.findById(id).exec();

      if (!notification) {
        throw new BadRequestException('Bildirim bulunamadı');
      }

      return notification;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Bildirim getirilirken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async resendNotification(id: string): Promise<{
    success: boolean;
    recipients: number;
    message: string;
  }> {
    try {
      const notification = await this.notificationModel.findById(id).exec();

      if (!notification) {
        throw new BadRequestException('Bildirim bulunamadı');
      }

      const result = await this.sendNotification({
        headings: notification.headings,
        contents: notification.contents,
        data: notification.data as Record<string, unknown>,
        url: notification.url,
        saveToDatabase: false,
      });

      return {
        success: result.success,
        recipients: result.recipients,
        message: result.success
          ? 'Bildirim başarıyla yeniden gönderildi'
          : result.message,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Bildirim yeniden gönderilirken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async deleteNotification(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const notification = await this.notificationModel.findById(id).exec();

      if (!notification) {
        throw new BadRequestException('Bildirim bulunamadı');
      }

      await this.notificationModel.findByIdAndDelete(id).exec();

      return {
        success: true,
        message: 'Bildirim başarıyla silindi',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Bildirim silinirken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  private async dispatchMessages(
    messages: ExpoPushMessage[],
    tokensInOrder: string[],
  ): Promise<{ recipients: number; tokensToRemove: string[] }> {
    const chunks = this.expo.chunkPushNotifications(messages);
    let offset = 0;
    let recipients = 0;
    const tokensToRemove: string[] = [];

    for (const chunk of chunks) {
      let tickets: ExpoPushTicket[];

      try {
        tickets = await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Expo Push API hatası:', error);
        throw new InternalServerErrorException(
          'Bildirim gönderilirken bir hata oluştu: ' +
            (error instanceof Error ? error.message : 'Bilinmeyen hata'),
        );
      }

      tickets.forEach((ticket, index) => {
        const token = tokensInOrder[offset + index];
        if (ticket.status === 'ok') {
          recipients += 1;
          return;
        }

        console.error('Expo push bileti hatası:', ticket.message);
        if (ticket.details?.error === 'DeviceNotRegistered' && token) {
          tokensToRemove.push(token);
        }
      });

      offset += chunk.length;
    }

    return { recipients, tokensToRemove };
  }

  private pickLocalized(content: LocalizedText, locale?: string): string {
    const normalized = (locale || '').slice(0, 2).toLowerCase();
    const order = [normalized, 'tr', 'en', 'fr', 'es'];

    for (const key of order) {
      const value = content[key as keyof LocalizedText];
      if (value?.trim()) {
        return value;
      }
    }

    return '';
  }
}
