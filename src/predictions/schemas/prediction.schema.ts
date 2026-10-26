import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PredictionDocument = Prediction & Document;

@Schema({ timestamps: true })
export class Prediction {
  @Prop({ required: true, type: Boolean, default: false })
  isFree: boolean;

  @Prop({ required: true, type: Object })
  time: {
    date: { type: string; required: true };
    time: { type: string; required: true };
  };

  @Prop({ required: true, type: Object })
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };

  @Prop({ required: true, type: Object })
  homeTeam: {
    id: number;
    name: string;
    logo: string;
    last_5: object;
    league: object;
  };

  @Prop({ required: true, type: Object })
  awayTeam: {
    id: number;
    name: string;
    logo: string;
    last_5: object;
    league: object;
  };

  @Prop({ type: Object })
  comparison: object;

  @Prop({ type: [Object] })
  h2h: object[];

  @Prop({ required: true, type: Object })
  predictions: {
    tr: {
      long: string;
      short: string;
    };
    en: {
      long: string;
      short: string;
    };
    fr: {
      long: string;
      short: string;
    };
  };

  @Prop({ type: Object })
  statistics: {
    home: object;
    away: object;
  };

  @Prop({ type: Object })
  standings: object;

  @Prop({ type: String })
  odds: string;

  @Prop({ required: true, type: Object })
  score: {
    ht: {
      home: { type: number; default: 0 };
      away: { type: number; default: 0 };
    };
    ft: {
      home: { type: number; default: 0 };
      away: { type: number; default: 0 };
    };
  };

  @Prop({
    required: true,
    type: String,
    enum: ['wait', 'true', 'false', 'canceled'],
    default: 'wait',
  })
  status: string;
}

export const PredictionSchema = SchemaFactory.createForClass(Prediction);
