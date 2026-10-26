import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: Object })
  headings: {
    en?: string;
    tr?: string;
    fr?: string;
    es?: string;
  };

  @Prop({ required: true, type: Object })
  contents: {
    en?: string;
    tr?: string;
    fr?: string;
    es?: string;
  };

  @Prop({ type: [String], default: [] })
  includedSegments?: string[];

  @Prop({ type: String, required: false })
  smallIcon?: string;

  @Prop({ type: Object, required: false })
  data?: Record<string, unknown>;

  @Prop({ type: String, required: false })
  url?: string;

  @Prop({ type: Boolean, default: false })
  saved: boolean;

  @Prop({ type: String, default: 'expo' })
  provider?: string;

  /** Eski OneSignal kayıtları için tutulur. Yeni gönderimler bu alanı doldurmaz. */
  @Prop({ type: String, required: false })
  onesignalId?: string;

  @Prop({ type: Number, required: false })
  recipientsCount?: number;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
