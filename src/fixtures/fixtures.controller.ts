import { Controller, Get, Param, Query } from '@nestjs/common';
import { FixturesService } from './fixtures.service';

@Controller('fixtures')
export class FixturesController {
  constructor(private readonly fixturesService: FixturesService) {}

  @Get('date/:date')
  async getFixturesByDate(
    @Param('date') date: string,
    @Query('status') status?: string,
  ) {
    return this.fixturesService.getFixturesByDate(date, status);
  }

  @Get('id/:fixtureId')
  async getFixtureById(@Param('fixtureId') fixtureId: string) {
    return this.fixturesService.getFixtureById(Number(fixtureId));
  }

  @Get('league/:leagueId/season/:season')
  async getFixturesByLeague(
    @Param('leagueId') leagueId: string,
    @Param('season') season: string,
    @Query('date') date?: string,
  ) {
    return this.fixturesService.getFixturesByLeague(
      Number(leagueId),
      Number(season),
      date,
    );
  }

  @Get('team/:teamId/season/:season')
  async getFixturesByTeam(
    @Param('teamId') teamId: string,
    @Param('season') season: string,
    @Query('date') date?: string,
  ) {
    return this.fixturesService.getFixturesByTeam(
      Number(teamId),
      Number(season),
      date,
    );
  }
}
