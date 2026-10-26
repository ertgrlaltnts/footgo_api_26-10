import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './schemas/team.schema';
import { FootballApiService } from './api.service';
import { MatchResponse } from './interfaces/api-response.interface';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    private footballApiService: FootballApiService,
  ) {}

  async syncTeams(): Promise<void> {
    this.logger.log('Ligler çekiliyor...');
    const leagues = await this.footballApiService.getLeagues();

    for (const league of leagues) {
      const season = league.seasons.find((s) => s.current)?.year;
      if (!season) continue;

      this.logger.log(
        `${league.league.name} (${season}) takımları çekiliyor...`,
      );

      const teams = await this.footballApiService.getTeamsByLeague(
        league.league.id,
        season,
      );

      for (const item of teams) {
        const existing = await this.teamModel.findOne({
          teamId: item.team.id,
        });
        if (!existing) {
          await this.teamModel.create({
            teamId: item.team.id,
            name: item.team.name,
            logo: item.team.logo,
          });
        }
      }
    }

    this.logger.log('Tüm takımlar senkronize edildi.');
  }

  async getAllTeams(): Promise<Team[]> {
    return this.teamModel.find();
  }

  async searchTeams(name: string): Promise<Team[]> {
    return this.teamModel.find({ name: { $regex: name, $options: 'i' } });
  }

  async getMatchForPanel(
    teamId: string,
    season: string,
    date: string,
  ): Promise<MatchResponse> {
    return this.footballApiService.getMatchForPanel(teamId, season, date);
  }
}
