import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { RegisterPushDeviceDto } from './dto/register-push-device.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    return await this.notificationsService.sendNotification(
      sendNotificationDto,
    );
  }

  @Post('devices')
  @HttpCode(HttpStatus.OK)
  async registerDevice(@Body() registerPushDeviceDto: RegisterPushDeviceDto) {
    return await this.notificationsService.registerDevice(
      registerPushDeviceDto,
    );
  }

  @Get('devices/count')
  async countDevices() {
    return await this.notificationsService.countDevices();
  }

  @Get()
  async getNotifications(@Query() query: GetNotificationsDto) {
    const { page = 1, limit = 20 } = query;
    return await this.notificationsService.getNotifications(page, limit);
  }

  @Get(':id')
  async getNotificationById(@Param('id') id: string) {
    return await this.notificationsService.getNotificationById(id);
  }

  @Post(':id/resend')
  @HttpCode(HttpStatus.OK)
  async resendNotification(@Param('id') id: string) {
    return await this.notificationsService.resendNotification(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Param('id') id: string) {
    return await this.notificationsService.deleteNotification(id);
  }
}
