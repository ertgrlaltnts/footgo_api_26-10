import { Controller, Get, Param } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('sync')
  async syncTeams() {
    await this.teamsService.syncTeams();
    return { message: 'Takımlar başarıyla senkronize edildi.' };
  }

  @Get()
  async getAll() {
    return this.teamsService.getAllTeams();
  }

  @Get(':name')
  searchTeams(@Param('name') name: string) {
    return this.teamsService.searchTeams(name);
  }

  @Get(':teamId/match/:season/:date')
  getMatchForPanel(
    @Param('teamId') teamId: string,
    @Param('season') season: string,
    @Param('date') date: string,
  ) {
    return this.teamsService.getMatchForPanel(teamId, season, date);
  }
}
