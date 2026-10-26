import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PredictionsModule } from './predictions/predictions.module';
import { CouponsModule } from './coupons/coupons.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { mongoConfig } from './config/mongo.config';
import { TeamsModule } from './teams/teams.module';
import { FixturesModule } from './fixtures/fixtures.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatisticsModule } from './statistics/statistics.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    MongooseModule.forRoot(mongoConfig.uri),
    PredictionsModule,
    CouponsModule,
    UsersModule,
    AdminModule,
    TeamsModule,
    FixturesModule,
    NotificationsModule,
    StatisticsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
