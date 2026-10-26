import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Purchase,
  PurchaseDocument,
  PurchaseStatus,
} from './schemas/purchase.schema';

interface CachedStats {
  data: {
    totalUsers: number;
    registeredToday: number;
    premiumUsers: number;
    activeUsersToday: number;
  };
  timestamp: number;
}

interface CachedDailyPurchases {
  data: {
    dailyData: Array<{ date: string; count: number }>;
    totalPurchases: number;
  };
  timestamp: number;
}

interface CachedDailyActiveUsers {
  data: {
    dailyData: Array<{ date: string; count: number }>;
    today: number;
    yesterday: number;
    average30Days: number;
  };
  timestamp: number;
}

@Injectable()
export class StatisticsService {
  // Cache: 5 dakika (300000 ms) - istatistikler sık değişmediği için
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 dakika
  private cache: CachedStats | null = null;
  private dailyPurchasesCache: CachedDailyPurchases | null = null;
  private dailyActiveUsersCache: CachedDailyActiveUsers | null = null;
  // Satın alımlar için daha kısa cache - 2 dakika (daha sık güncelleniyor)
  private readonly PURCHASES_CACHE_TTL = 2 * 60 * 1000;
  // Aktif kullanıcılar için cache - 5 dakika
  private readonly ACTIVE_USERS_CACHE_TTL = 5 * 60 * 1000;

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Purchase.name)
    private purchaseModel: Model<PurchaseDocument>,
  ) {}

  async getDashboardStatistics(): Promise<{
    totalUsers: number;
    registeredToday: number;
    premiumUsers: number;
    activeUsersToday: number;
  }> {
    try {
      // Cache kontrolü - eğer cache geçerliyse direkt dön
      const now = Date.now();
      if (this.cache && now - this.cache.timestamp < this.CACHE_TTL) {
        return this.cache.data;
      }

      // Bugünün başlangıcı ve sonu
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Tek bir aggregation pipeline ile tüm istatistikleri al
      const stats = await this.userModel.aggregate([
        {
          $facet: {
            // Toplam kullanıcı sayısı
            totalUsers: [{ $count: 'count' }],

            // Bugün kayıt olanlar
            registeredToday: [
              {
                $match: {
                  createdAt: {
                    $gte: todayStart,
                    $lte: todayEnd,
                  },
                },
              },
              { $count: 'count' },
            ],

            // Premium kullanıcılar
            premiumUsers: [
              {
                $match: {
                  'premium.isPremium': true,
                },
              },
              { $count: 'count' },
            ],

            // Bugün aktif olan kullanıcılar (bugün giriş yapanlar)
            activeUsersToday: [
              {
                $match: {
                  lastLoginDate: {
                    $gte: todayStart,
                    $lte: todayEnd,
                  },
                },
              },
              { $count: 'count' },
            ],
          },
        },
      ]);

      // Sonuçları düzenle
      if (!stats || stats.length === 0) {
        return {
          totalUsers: 0,
          registeredToday: 0,
          premiumUsers: 0,
          activeUsersToday: 0,
        };
      }

      const result = stats[0] as {
        totalUsers?: Array<{ count: number }>;
        registeredToday?: Array<{ count: number }>;
        premiumUsers?: Array<{ count: number }>;
        activeUsersToday?: Array<{ count: number }>;
      };

      const statsData = {
        totalUsers: result.totalUsers?.[0]?.count ?? 0,
        registeredToday: result.registeredToday?.[0]?.count ?? 0,
        premiumUsers: result.premiumUsers?.[0]?.count ?? 0,
        activeUsersToday: result.activeUsersToday?.[0]?.count ?? 0,
      };

      // Cache'e kaydet
      this.cache = {
        data: statsData,
        timestamp: Date.now(),
      };

      return statsData;
    } catch (error) {
      throw new Error(
        `İstatistikler alınırken bir hata oluştu: ${
          error instanceof Error ? error.message : 'Bilinmeyen hata'
        }`,
      );
    }
  }

  /**
   * Son 30 günlük günlük satın alım istatistikleri
   * Grafik için günlük bazda satın alım sayılarını döner
   */
  async getDailyPurchases(): Promise<{
    dailyData: Array<{ date: string; count: number }>;
    totalPurchases: number;
  }> {
    try {
      // Cache kontrolü
      const now = Date.now();
      if (
        this.dailyPurchasesCache &&
        now - this.dailyPurchasesCache.timestamp < this.PURCHASES_CACHE_TTL
      ) {
        return this.dailyPurchasesCache.data;
      }

      // Son 30 günün başlangıç ve bitiş tarihleri
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);

      // Günlük bazda satın alım sayılarını hesapla
      const dailyStats = await this.purchaseModel.aggregate([
        {
          $match: {
            purchaseDate: {
              $gte: startDate,
              $lte: endDate,
            },
            status: PurchaseStatus.COMPLETED, // Sadece tamamlanan satın alımlar
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$purchaseDate',
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 }, // Tarihe göre sırala
        },
      ]);

      // Toplam satın alım sayısı (son 30 gün)
      const totalResult = await this.purchaseModel.countDocuments({
        purchaseDate: {
          $gte: startDate,
          $lte: endDate,
        },
        status: PurchaseStatus.COMPLETED,
      });

      // Tüm tarihleri doldur (0 olan günler için)
      const dailyDataMap = new Map<string, number>();
      dailyStats.forEach((item: { _id: string; count: number }) => {
        dailyDataMap.set(String(item._id), Number(item.count));
      });

      // Son 30 günün tüm tarihlerini oluştur
      const allDates: Array<{ date: string; count: number }> = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        allDates.push({
          date: dateStr,
          count: dailyDataMap.get(dateStr) || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const result = {
        dailyData: allDates,
        totalPurchases: totalResult,
      };

      // Cache'e kaydet
      this.dailyPurchasesCache = {
        data: result,
        timestamp: Date.now(),
      };

      return result;
    } catch (error) {
      throw new Error(
        `Günlük satın alım istatistikleri alınırken bir hata oluştu: ${
          error instanceof Error ? error.message : 'Bilinmeyen hata'
        }`,
      );
    }
  }

  /**
   * Son satın alımları getir (sayfalama ile)
   * Kullanıcı bilgileri ile birlikte detaylı satın alım listesi
   */
  async getRecentPurchases(
    page: number = 1,
    limit: number = 5,
    hours?: number, // Son X saat (opsiyonel, varsayılan: tümü)
  ): Promise<{
    purchases: Array<{
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
        profilePhoto: string;
      };
      product: string;
      amount: number;
      currency: string;
      date: Date;
      status: PurchaseStatus;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Tarih filtresi
      let dateFilter: Record<string, unknown> = {};
      if (hours && hours > 0) {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - hours);
        dateFilter = {
          purchaseDate: {
            $gte: startDate,
          },
        };
      }

      // Skip ve limit hesapla
      const skip = (page - 1) * limit;

      // Toplam sayı (filtreli)
      const total = await this.purchaseModel.countDocuments(dateFilter);

      // Satın alımları getir (kullanıcı bilgileri ile)
      const purchases = await this.purchaseModel
        .find(dateFilter)
        .populate('userId', 'name email profilePhoto')
        .sort({ purchaseDate: -1 }) // En yeni önce
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      // Sonuçları formatla
      type PopulatedPurchase = {
        _id: string;
        userId: {
          _id: string;
          name: string;
          email: string;
          profilePhoto: string;
        };
        productName: string;
        amount: number;
        currency: string;
        purchaseDate: Date;
        status: PurchaseStatus;
      };

      const formattedPurchases = (
        purchases as unknown as PopulatedPurchase[]
      ).map((purchase) => ({
        id: purchase._id,
        user: {
          id: purchase.userId._id,
          name: purchase.userId.name,
          email: purchase.userId.email,
          profilePhoto: purchase.userId.profilePhoto,
        },
        product: purchase.productName,
        amount: purchase.amount,
        currency: purchase.currency,
        date: purchase.purchaseDate,
        status: purchase.status,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        purchases: formattedPurchases,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new Error(
        `Son satın alımlar alınırken bir hata oluştu: ${
          error instanceof Error ? error.message : 'Bilinmeyen hata'
        }`,
      );
    }
  }

  /**
   * Son 30 günlük günlük aktif kullanıcı istatistikleri
   * Grafik için günlük bazda aktif kullanıcı sayılarını döner
   * Performans için MongoDB aggregation pipeline kullanır ve cache mekanizması içerir
   */
  async getDailyActiveUsers(): Promise<{
    dailyData: Array<{ date: string; count: number }>;
    today: number;
    yesterday: number;
    average30Days: number;
  }> {
    try {
      // Cache kontrolü
      const now = Date.now();
      if (
        this.dailyActiveUsersCache &&
        now - this.dailyActiveUsersCache.timestamp < this.ACTIVE_USERS_CACHE_TTL
      ) {
        return this.dailyActiveUsersCache.data;
      }

      // Son 30 günün başlangıç ve bitiş tarihleri
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);

      // Bugün ve dün için tarih aralıkları
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

      // Günlük bazda aktif kullanıcı sayılarını hesapla (aggregation pipeline)
      const dailyStats = await this.userModel.aggregate([
        {
          $match: {
            lastLoginDate: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$lastLoginDate',
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 }, // Tarihe göre sırala
        },
      ]);

      // Bugün aktif kullanıcı sayısı
      const todayCount = await this.userModel.countDocuments({
        lastLoginDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      });

      // Dün aktif kullanıcı sayısı
      const yesterdayCount = await this.userModel.countDocuments({
        lastLoginDate: {
          $gte: yesterdayStart,
          $lte: yesterdayEnd,
        },
      });

      // Tüm tarihleri doldur (0 olan günler için)
      const dailyDataMap = new Map<string, number>();
      dailyStats.forEach((item: { _id: string; count: number }) => {
        dailyDataMap.set(String(item._id), Number(item.count));
      });

      // Bugünün tarihini string formatında al
      const todayDateStr = todayStart.toISOString().split('T')[0];
      // Bugünün count'unu Map'e ekle (aggregation'dan gelmemiş olabilir)
      dailyDataMap.set(todayDateStr, todayCount);

      // Son 30 günün tüm tarihlerini oluştur
      const allDates: Array<{ date: string; count: number }> = [];
      const currentDate = new Date(startDate);
      let totalActiveUsers = 0;

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = dailyDataMap.get(dateStr) || 0;
        totalActiveUsers += count;
        allDates.push({
          date: dateStr,
          count,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 30 günlük ortalama hesapla
      const average30Days = Math.round(totalActiveUsers / 30);

      const result = {
        dailyData: allDates,
        today: todayCount,
        yesterday: yesterdayCount,
        average30Days,
      };

      // Cache'e kaydet
      this.dailyActiveUsersCache = {
        data: result,
        timestamp: Date.now(),
      };

      return result;
    } catch (error) {
      throw new Error(
        `Günlük aktif kullanıcı istatistikleri alınırken bir hata oluştu: ${
          error instanceof Error ? error.message : 'Bilinmeyen hata'
        }`,
      );
    }
  }

  /**
   * Cache'leri temizle (test veya manuel yenileme için)
   */
  clearCache(): void {
    this.cache = null;
    this.dailyPurchasesCache = null;
    this.dailyActiveUsersCache = null;
  }
}
