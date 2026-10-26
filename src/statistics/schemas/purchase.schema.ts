import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PurchaseDocument = Purchase & Document;

export enum PurchaseStatus {
  COMPLETED = 'completed', // Tamamlandı
  PENDING = 'pending', // Beklemede
  FAILED = 'failed', // Başarısız
  REFUNDED = 'refunded', // İade edildi
}

@Schema({ timestamps: true })
export class Purchase {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productId: string; // RevenueCat product identifier

  @Prop({ required: true })
  amount: number; // Tutar

  @Prop({ required: true, default: 'TRY' })
  currency: string;

  @Prop({
    required: true,
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
  })
  status: PurchaseStatus;

  @Prop({ required: false })
  revenueCatTransactionId?: string; // RevenueCat transaction ID

  @Prop({ required: false })
  platform?: string; // 'ios' | 'android'

  @Prop({ type: Date, required: true })
  purchaseDate: Date; // Satın alma tarihi
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);

// Performans için kritik index'ler
PurchaseSchema.index({ userId: 1 }); // Kullanıcı bazlı sorgular için
PurchaseSchema.index({ purchaseDate: -1 }); // Tarih bazlı sıralama için
PurchaseSchema.index({ status: 1 }); // Durum bazlı filtreleme için
PurchaseSchema.index({ purchaseDate: -1, status: 1 }); // Compound index: tarih ve durum birlikte
// Günlük istatistikler için tarih bazlı index
PurchaseSchema.index({ purchaseDate: 1, status: 1 }); // Günlük aggregate sorguları için

