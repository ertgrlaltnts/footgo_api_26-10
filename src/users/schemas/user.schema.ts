import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  password?: string;

  @Prop({ required: true, enum: ['google', 'local'], default: 'google' })
  authProvider: 'google' | 'local';

  @Prop({ required: true })
  profilePhoto: string;

  @Prop({ required: true, default: 0 })
  coin: number;

  @Prop({
    required: true,
    type: Object,
    default: { isPremium: false, premiumStartDate: '', premiumEndDate: '' },
  })
  premium: {
    isPremium: boolean;
    premiumStartDate: string;
    premiumEndDate: string;
  };

  @Prop({ required: true, type: [Object], default: [] })
  coupons: object[];

  @Prop({ type: Date })
  lastLoginDate?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Performans için kritik index'ler
UserSchema.index({ createdAt: 1 }); // Bugün kayıt olanlar için
UserSchema.index({ lastLoginDate: 1 }); // Aktif kullanıcılar için
UserSchema.index({ 'premium.isPremium': 1 }); // Premium kullanıcılar için
// Compound index: lastLoginDate ve createdAt birlikte sorgulanabilir
UserSchema.index({ lastLoginDate: 1, createdAt: 1 });

