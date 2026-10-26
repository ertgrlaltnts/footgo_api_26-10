import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import moment from 'moment';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { GroupedCouponsQueryDto } from './dto/grouped-coupons-query.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Coupon, CouponDocument } from './schemas/coupon.schema';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private couponModel: Model<CouponDocument>,
  ) {}

  async findOnlyWaiting(): Promise<Coupon[]> {
    try {
      const coupons = await this.couponModel
        .find({ status: 'wait' })
        .sort({ createdAt: -1 })
        .exec();
      if (!coupons) {
        throw new NotFoundException(`Kuponlar bulunamadı`);
      }
      return coupons;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Kuponlar bulunamadı');
    }
  }

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

  private getFirstMatchDate(coupon: Coupon): string {
    if (!coupon.predictions?.length) {
      return '';
    }
    return String(coupon.predictions[0].date ?? '');
  }

  private getFirstMatchTime(coupon: Coupon): string {
    if (!coupon.predictions?.length) {
      return '00:00';
    }
    return String(coupon.predictions[0].time ?? '00:00');
  }

  private sortCoupons(coupons: Coupon[], sortByDateDesc = false): void {
    coupons.sort((a, b) => {
      if (sortByDateDesc) {
        const dateA = this.parseClientDate(this.getFirstMatchDate(a));
        const dateB = this.parseClientDate(this.getFirstMatchDate(b));
        const dateDiff = dateB.valueOf() - dateA.valueOf();
        if (dateDiff !== 0) {
          return dateDiff;
        }
      }
      const timeA = this.getFirstMatchTime(a);
      const timeB = this.getFirstMatchTime(b);
      return timeA.localeCompare(timeB);
    });
  }

  async findByDateRange(
    query: GroupedCouponsQueryDto = {},
  ): Promise<{
    yesterday: Coupon[];
    today: Coupon[];
    tomorrow: Coupon[];
  }> {
    try {
      const baseDate = query.date
        ? this.parseClientDate(query.date)
        : moment();

      const today = this.formatDate(baseDate);
      const tomorrow = this.formatDate(baseDate.clone().add(1, 'days'));

      const pastFiveDays: string[] = [];
      for (let i = 10; i >= 1; i--) {
        pastFiveDays.push(
          this.formatDate(baseDate.clone().subtract(i, 'days')),
        );
      }

      const pastFiveDaysSet = new Set(pastFiveDays);
      const dateRange = [...pastFiveDays, today, tomorrow];

      const coupons = await this.couponModel
        .find({ 'predictions.0.date': { $in: dateRange } })
        .sort({ createdAt: -1 })
        .exec();

      const yesterdayCoupons: Coupon[] = [];
      const todayCoupons: Coupon[] = [];
      const tomorrowCoupons: Coupon[] = [];

      for (const coupon of coupons) {
        const firstMatchDate = this.getFirstMatchDate(coupon);
        if (!firstMatchDate) {
          continue;
        }

        if (pastFiveDaysSet.has(firstMatchDate)) {
          yesterdayCoupons.push(coupon);
        } else if (firstMatchDate === today) {
          todayCoupons.push(coupon);
        } else if (firstMatchDate === tomorrow) {
          tomorrowCoupons.push(coupon);
        }
      }

      this.sortCoupons(yesterdayCoupons, true);
      this.sortCoupons(todayCoupons);
      this.sortCoupons(tomorrowCoupons);

      return {
        yesterday: yesterdayCoupons,
        today: todayCoupons,
        tomorrow: tomorrowCoupons,
      };
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Tarih aralığına göre kuponlar getirilemedi',
      );
    }
  }

  async findAll(paginationQuery: PaginationQueryDto): Promise<{
    data: Coupon[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20 } = paginationQuery;
      const skip = (page - 1) * limit;

      const data = await this.couponModel
        .find()
        .sort({ createdAt: -1 }) // En son eklenenler önce
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.couponModel.countDocuments().exec();
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Coupons not found');
    }
  }

  async findOne(id: string): Promise<Coupon> {
    try {
      const coupon = await this.couponModel.findById(id).exec();
      if (!coupon) {
        throw new NotFoundException(`Coupon not found`);
      }
      return coupon;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Coupon not found');
    }
  }

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    try {
      const createdCoupon = new this.couponModel(createCouponDto);
      return createdCoupon.save();
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Coupon not created');
    }
  }

  async update(id: string, updateCouponDto: CreateCouponDto): Promise<Coupon> {
    try {
      const updatedCoupon = await this.couponModel
        .findByIdAndUpdate(id, updateCouponDto, { new: true })
        .exec();
      if (!updatedCoupon) {
        throw new NotFoundException(`Coupon not found`);
      }
      return updatedCoupon;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Coupon not updated');
    }
  }

  async remove(id: string): Promise<Coupon> {
    try {
      const coupon = await this.couponModel.findByIdAndDelete(id).exec();
      if (!coupon) {
        throw new NotFoundException(`Coupon not found`);
      }
      return coupon;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Coupon not deleted');
    }
  }
}

