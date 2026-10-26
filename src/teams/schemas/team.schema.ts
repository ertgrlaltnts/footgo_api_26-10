import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Team extends Document {
  @Prop({ required: true, unique: true })
  teamId: number;

  @Prop()
  name: string;

  @Prop()
  logo: string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
