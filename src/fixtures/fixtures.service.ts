import { Injectable, Logger } from '@nestjs/common';
import { FixturesApiService } from './api.service';
import { FixturesApiResponse } from './interfaces/fixture-response.interface';
import {
  GroupedFixturesResponse,
  LeagueGroup,
} from './interfaces/grouped-fixtures.interface';

@Injectable()
export class FixturesService {
  private readonly logger = new Logger(FixturesService.name);

  constructor(private readonly fixturesApiService: FixturesApiService) {}

  async getFixturesByDate(
    date: string,
    status?: string,
  ): Promise<GroupedFixturesResponse> {
    this.logger.log(`Maçlar isteniyor: ${date} - Status: ${status || 'ALL'}`);
    const apiResponse = await this.fixturesApiService.getFixturesByDate(
      date,
      status,
    );

    // Maçları lig bazında grupla
    const leagueMap = new Map<number, LeagueGroup>();

    apiResponse.response.forEach((fixture) => {
      const leagueId = fixture.league.id;

      if (!leagueMap.has(leagueId)) {
        leagueMap.set(leagueId, {
          league: {
            id: fixture.league.id,
            name: fixture.league.name,
            country: fixture.league.country,
            logo: fixture.league.logo,
            flag: fixture.league.flag,
            season: fixture.league.season,
          },
          fixtures: [],
        });
      }

      leagueMap.get(leagueId)!.fixtures.push(fixture);
    });

    // Map'i array'e çevir
    const leagues = Array.from(leagueMap.values());

    this.logger.log(
      `${apiResponse.results} maç bulundu ve ${leagues.length} lige göre gruplandı`,
    );

    return {
      results: apiResponse.results,
      leagues,
    };
  }

  async getFixtureById(fixtureId: number): Promise<FixturesApiResponse> {
    this.logger.log(`Maç detayı isteniyor: ${fixtureId}`);
    return this.fixturesApiService.getFixtureById(fixtureId);
  }

  async getFixturesByLeague(
    leagueId: number,
    season: number,
    date?: string,
  ): Promise<FixturesApiResponse> {
    this.logger.log(
      `Lig maçları isteniyor: League ${leagueId} - Season ${season}`,
    );
    return this.fixturesApiService.getFixturesByLeague(leagueId, season, date);
  }

  async getFixturesByTeam(
    teamId: number,
    season: number,
    date?: string,
  ): Promise<FixturesApiResponse> {
    this.logger.log(
      `Takım maçları isteniyor: Team ${teamId} - Season ${season}`,
    );
    return this.fixturesApiService.getFixturesByTeam(teamId, season, date);
  }
}
