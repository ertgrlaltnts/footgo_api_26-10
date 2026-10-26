import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PushDeviceDocument = PushDevice & Document;

@Schema({ timestamps: true })
export class PushDevice {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ type: String, default: 'tr' })
  locale: string;

  @Prop({ type: String, required: false })
  platform?: string;
}

export const PushDeviceSchema = SchemaFactory.createForClass(PushDevice);
