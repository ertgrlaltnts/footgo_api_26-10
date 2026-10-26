import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamsService } from './teams.service';
import { Team, TeamSchema } from './schemas/team.schema';
import { FootballApiService } from './api.service';
import { TeamsController } from './teams.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }]),
  ],
  controllers: [TeamsController],
  providers: [TeamsService, FootballApiService],
})
export class TeamsModule {}
