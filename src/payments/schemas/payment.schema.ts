import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userPhoto: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  product: string;

  @Prop({ required: true })
  price: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Performans için index'ler
PaymentSchema.index({ userId: 1 });
