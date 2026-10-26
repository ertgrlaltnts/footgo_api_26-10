import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { RecentPurchasesQueryDto } from './dto/recent-purchases-query.dto';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  async getDashboardStatistics() {
    return this.statisticsService.getDashboardStatistics();
  }

  @Get('purchases/daily')
  async getDailyPurchases() {
    return this.statisticsService.getDailyPurchases();
  }

  @Get('purchases/recent')
  async getRecentPurchases(@Query() query: RecentPurchasesQueryDto) {
    const { page = 1, limit = 5, hours } = query;
    return this.statisticsService.getRecentPurchases(page, limit, hours);
  }

  @Get('users/active/daily')
  async getDailyActiveUsers() {
    return this.statisticsService.getDailyActiveUsers();
  }
}
