import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import moment from 'moment';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { GroupedPredictionsQueryDto } from './dto/grouped-predictions-query.dto';
import { PaginationDto, PaginatedResponse } from './dto/pagination.dto';
import { Prediction, PredictionDocument } from './schemas/prediction.schema';

export interface GroupedPredictions {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  predictions: Prediction[];
}

export interface DayPredictions {
  freePredictions: Prediction[];
  groupedPredictions: GroupedPredictions[];
}

export interface GroupedPredictionsResponse {
  yesterday: Prediction[];
  today: DayPredictions;
  tomorrow: DayPredictions;
}

@Injectable()
export class PredictionsService {
  constructor(
    @InjectModel(Prediction.name)
    private predictionModel: Model<PredictionDocument>,
  ) {}

  private parseClientDate(dateStr: string): moment.Moment {
    const parsed = moment(dateStr, 'DD.MM.YYYY', true);
    if (!parsed.isValid()) {
      throw new BadRequestException(
        'Geçersiz tarih formatı. DD.MM.YYYY kullanın (örn: 29.05.2026)',
      );
    }
    return parsed;
  }

  private formatDate(m: moment.Moment): string {
    return m.format('DD.MM.YYYY');
  }

  private getPredictionDate(prediction: Prediction): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const predictionTime = prediction.time as { date?: unknown };
    return String(predictionTime.date ?? '');
  }

  private getPredictionTime(prediction: Prediction): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const predictionTime = prediction.time as { time?: unknown };
    return String(predictionTime.time ?? '00:00');
  }

  private sortPredictionsChronologically(
    predictions: Prediction[],
  ): Prediction[] {
    return [...predictions].sort((a, b) => {
      const dateA = this.parseClientDate(this.getPredictionDate(a));
      const dateB = this.parseClientDate(this.getPredictionDate(b));
      const dateDiff = dateA.valueOf() - dateB.valueOf();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return this.getPredictionTime(a).localeCompare(this.getPredictionTime(b));
    });
  }

  async findGroupedPredictions(
    query: GroupedPredictionsQueryDto = {},
  ): Promise<GroupedPredictionsResponse> {
    try {
      // Mobil uygulamadan gelen yerel tarih; yoksa sunucu tarihi (geriye uyumluluk)
      const baseDate = query.date
        ? this.parseClientDate(query.date)
        : moment();

      const today = this.formatDate(baseDate);
      const tomorrow = this.formatDate(baseDate.clone().add(1, 'days'));

      // Son 5 gün (bugün hariç): bugün-5 ... bugün-1
      const pastFiveDays: string[] = [];
      for (let i = 10; i >= 1; i--) {
        pastFiveDays.push(
          this.formatDate(baseDate.clone().subtract(i, 'days')),
        );
      }

      const pastFiveDaysSet = new Set(pastFiveDays);
      const dateRange = [...pastFiveDays, today, tomorrow];

      const predictions = await this.predictionModel
        .find({
          'time.date': { $in: dateRange },
        })
        .select('-comparison -h2h -standings -statistics')
        .exec();

      const yesterdayPredictions: Prediction[] = [];
      const todayPredictions: Prediction[] = [];
      const tomorrowPredictions: Prediction[] = [];

      for (const prediction of predictions) {
        const predictionDate = this.getPredictionDate(prediction);

        if (pastFiveDaysSet.has(predictionDate)) {
          yesterdayPredictions.push(prediction);
        } else if (predictionDate === today) {
          todayPredictions.push(prediction);
        } else if (predictionDate === tomorrow) {
          tomorrowPredictions.push(prediction);
        }
      }

      const processDay = (dayPredictions: Prediction[]): DayPredictions => {
        dayPredictions.sort((a, b) =>
          this.getPredictionTime(a).localeCompare(this.getPredictionTime(b)),
        );

        // Ücretsiz tahminleri ayır
        const freePredictions: Prediction[] = [];
        const remainingPredictions: Prediction[] = [];

        for (const prediction of dayPredictions) {
          if (prediction.isFree) {
            freePredictions.push(prediction);
          } else {
            remainingPredictions.push(prediction);
          }
        }

        // Kalan tahminleri liglere göre grupla
        const leagueMap = new Map<number, GroupedPredictions>();

        for (const prediction of remainingPredictions) {
          const leagueId = prediction.league.id;

          if (!leagueMap.has(leagueId)) {
            leagueMap.set(leagueId, {
              league: prediction.league,
              predictions: [],
            });
          }

          leagueMap.get(leagueId)!.predictions.push(prediction);
        }

        const groupedPredictions = Array.from(leagueMap.values());

        return {
          freePredictions,
          groupedPredictions,
        };
      };

      return {
        yesterday: this.sortPredictionsChronologically(yesterdayPredictions),
        today: processDay(todayPredictions),
        tomorrow: processDay(tomorrowPredictions),
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Tahminler bulunamadı');
    }
  }

  async findOnlyWaiting(): Promise<Prediction[]> {
    try {
      const predictions = await this.predictionModel
        .find({ status: 'wait' })
        .sort({ createdAt: -1 })
        .exec();
      if (!predictions) {
        throw new NotFoundException(`Tahminler bulunamadı`);
      }
      return predictions;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Tahminler bulunamadı');
    }
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Prediction>> {
    try {
      const { page = 1, limit = 20 } = paginationDto;
      const skip = (page - 1) * limit;

      const data = await this.predictionModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
      const totalItems = await this.predictionModel.countDocuments().exec();

      const totalPages = Math.ceil(totalItems / limit);

      return {
        data,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Tahminler bulunamadı');
    }
  }

  async findOne(id: string): Promise<Prediction> {
    try {
      const prediction = await this.predictionModel.findById(id).exec();
      if (!prediction) {
        throw new NotFoundException(`Tahmin bulunamadı`);
      }
      return prediction;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Tahmin bulunamadı');
    }
  }

  async create(createPredictionDto: CreatePredictionDto): Promise<Prediction> {
    try {
      const createdPrediction = new this.predictionModel(createPredictionDto);
      await createdPrediction.save();
      return createdPrediction;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Prediction not created');
    }
  }

  async update(
    id: string,
    updatePredictionDto: CreatePredictionDto,
  ): Promise<Prediction> {
    try {
      const updatedPrediction = await this.predictionModel
        .findByIdAndUpdate(id, updatePredictionDto, { new: true })
        .exec();
      if (!updatedPrediction) {
        throw new NotFoundException(`Tahmin bulunamadı`);
      }
      return updatedPrediction;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Tahmin güncellenemedi');
    }
  }

  async remove(id: string): Promise<Prediction> {
    try {
      const prediction = await this.predictionModel
        .findByIdAndDelete(id)
        .exec();
      if (!prediction) {
        throw new NotFoundException(`Tahmin bulunamadı`);
      }
      return prediction;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Tahmin silinemedi');
    }
  }
}

