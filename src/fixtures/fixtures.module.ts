import { Module } from '@nestjs/common';
import { FixturesController } from './fixtures.controller';
import { FixturesService } from './fixtures.service';
import { FixturesApiService } from './api.service';

@Module({
  controllers: [FixturesController],
  providers: [FixturesService, FixturesApiService],
  exports: [FixturesService, FixturesApiService],
})
export class FixturesModule {}

