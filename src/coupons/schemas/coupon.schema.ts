import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, type: [Object] })
  predictions: Array<{
    id: number;
    date: string;
    time: string;
    homeTeam: {
      _id: string;
      teamId: number;
      name: string;
      logo: string;
      __v: number;
    };
    awayTeam: {
      _id: string;
      teamId: number;
      name: string;
      logo: string;
      __v: number;
    };
    score: {
      ht: {
        home: number;
        away: number;
      };
      ft: {
        home: number;
        away: number;
      };
    };
    predictions: {
      tr: string;
      en: string;
      fr: string;
    };
    status: string;
  }>;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  totalOdds: string;

  @Prop({ required: true, enum: ['wait', 'true', 'false'], default: 'wait' })
  status: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
