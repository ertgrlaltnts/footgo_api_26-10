import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    try {
      // Kullanıcı ID'sinin geçerli bir ObjectId olup olmadığını kontrol et
      if (!isValidObjectId(createPaymentDto.userId)) {
        throw new BadRequestException('Geçersiz kullanıcı ID formatı');
      }

      // Yeni ödeme kaydı oluştur
      const payment = new this.paymentModel({
        userId: new Types.ObjectId(createPaymentDto.userId),
        userPhoto: createPaymentDto.userPhoto,
        userEmail: createPaymentDto.userEmail,
        userName: createPaymentDto.userName,
        product: createPaymentDto.product,
        price: createPaymentDto.price,
      });

      const savedPayment = await payment.save();

      return savedPayment;
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // MongoDB duplicate key hatası (11000)
      if (this.isMongoError(error) && error.code === 11000) {
        throw new BadRequestException('Bu ödeme kaydı zaten mevcut');
      }

      // Validasyon hataları
      if (this.isValidationError(error)) {
        const messages = Object.values(error.errors)
          .map((err) => err.message)
          .join(', ');
        throw new BadRequestException(`Validasyon hatası: ${messages}`);
      }

      throw new BadRequestException(
        'Ödeme kaydı oluşturulurken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async findAll(page: number = 1, limit: number = 20) {
    try {
      // Sayfa ve limit validasyonu
      const pageNumber = Math.max(1, Math.floor(page));
      const limitNumber = Math.max(1, Math.min(100, Math.floor(limit))); // Maksimum 100 kayıt

      const skip = (pageNumber - 1) * limitNumber;

      // Toplam kayıt sayısını al
      const total = await this.paymentModel.countDocuments();

      // Ödemeleri getir (en yeni önce)
      const payments = await this.paymentModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .exec();

      const totalPages = Math.ceil(total / limitNumber);

      return {
        data: payments,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNumber,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        },
      };
    } catch (error: unknown) {
      throw new BadRequestException(
        'Ödemeler getirilirken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async findByEmail(email: string, page: number = 1, limit: number = 20) {
    try {
      // Email validasyonu
      if (!email || typeof email !== 'string' || email.trim() === '') {
        throw new BadRequestException('Geçerli bir email adresi giriniz');
      }

      // Sayfa ve limit validasyonu
      const pageNumber = Math.max(1, Math.floor(page));
      const limitNumber = Math.max(1, Math.min(100, Math.floor(limit))); // Maksimum 100 kayıt

      const skip = (pageNumber - 1) * limitNumber;

      // Email ile filtreleme (case-insensitive)
      const emailRegex = new RegExp(email.trim(), 'i');

      // Toplam kayıt sayısını al
      const total = await this.paymentModel.countDocuments({
        userEmail: emailRegex,
      });

      // Ödemeleri getir (en yeni önce)
      const payments = await this.paymentModel
        .find({ userEmail: emailRegex })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .exec();

      const totalPages = Math.ceil(total / limitNumber);

      return {
        data: payments,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNumber,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        },
        filter: {
          email: email.trim(),
        },
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Ödemeler getirilirken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  // Helper metodlar - Tip güvenliği için
  private isMongoError(
    error: unknown,
  ): error is { code: number; keyPattern: Record<string, unknown> } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'keyPattern' in error
    );
  }

  private isValidationError(
    error: unknown,
  ): error is { name: string; errors: Record<string, { message: string }> } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'ValidationError' &&
      'errors' in error
    );
  }
}
