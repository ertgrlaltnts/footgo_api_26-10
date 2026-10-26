import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  LeagueResponse,
  MatchDetails,
  TeamResponse,
  MatchResponse,
  MatchPredictions,
  TeamStatisticsData,
  Standings,
} from './interfaces/api-response.interface';
import moment from 'moment';

@Injectable()
export class FootballApiService {
  private readonly logger = new Logger(FootballApiService.name);
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly apiKey = 'd5c241c97a8469aaa8e510cb20d39c0b';

  private get headers() {
    return { 'x-apisports-key': this.apiKey };
  }

  async getLeagues(): Promise<LeagueResponse[]> {
    const response = await axios.get<{ response: LeagueResponse[] }>(
      `${this.baseUrl}/leagues`,
      {
        headers: this.headers,
      },
    );
    return response.data.response;
  }

  async getTeamsByLeague(
    leagueId: number,
    season: number,
  ): Promise<TeamResponse[]> {
    const response = await axios.get<{ response: TeamResponse[] }>(
      `${this.baseUrl}/teams`,
      {
        headers: this.headers,
        params: { league: leagueId, season },
      },
    );
    return response.data.response;
  }

  async getMatchForPanel(
    teamId: string,
    season: string,
    date: string,
  ): Promise<MatchResponse> {
    const getFixture = await axios.get<{ response: MatchDetails[] }>(
      `${this.baseUrl}/fixtures?season=${season}&team=${teamId}&date=${date}`,
      {
        headers: this.headers,
      },
    );

    const getPredictions = await axios.get<{ response: MatchPredictions[] }>(
      `${this.baseUrl}/predictions?fixture=${getFixture.data.response[0].fixture.id}`,
      {
        headers: this.headers,
      },
    );

    const getHomeStatistics = await axios.get<{
      response: TeamStatisticsData;
    }>(
      `${this.baseUrl}/teams/statistics?league=${getFixture.data.response[0].league.id}&season=${season}&team=${getFixture.data.response[0].teams.home.id}`,
      {
        headers: this.headers,
      },
    );

    const getAwayStatistics = await axios.get<{
      response: TeamStatisticsData;
    }>(
      `${this.baseUrl}/teams/statistics?league=${getFixture.data.response[0].league.id}&season=${season}&team=${getFixture.data.response[0].teams.away.id}`,
      {
        headers: this.headers,
      },
    );

    const getStandings = await axios.get<{ response: Standings[] }>(
      `${this.baseUrl}/standings?league=${getFixture.data.response[0].league.id}&season=${season}`,
      {
        headers: this.headers,
      },
    );

    return {
      isFree: false,
      time: {
        date: moment(getFixture.data.response[0].fixture.date).format(
          'DD.MM.YYYY',
        ),
        time: moment(getFixture.data.response[0].fixture.date).format('HH:mm'),
      },
      league: {
        id: getFixture.data.response[0].league.id,
        name: getFixture.data.response[0].league.name,
        country: getFixture.data.response[0].league.country,
        logo: getFixture.data.response[0].league.logo,
        flag: getFixture.data.response[0].league.flag,
        season: getFixture.data.response[0].league.season,
      },

      homeTeam: {
        id: getPredictions.data.response[0].teams.home.id,
        name: getPredictions.data.response[0].teams.home.name,
        logo: getPredictions.data.response[0].teams.home.logo,
        last_5: getPredictions.data.response[0].teams.home.last_5,
        league: getPredictions.data.response[0].teams.home.league,
      },
      awayTeam: {
        id: getPredictions.data.response[0].teams.away.id,
        name: getPredictions.data.response[0].teams.away.name,
        logo: getPredictions.data.response[0].teams.away.logo,
        last_5: getPredictions.data.response[0].teams.away.last_5,
        league: getPredictions.data.response[0].teams.away.league,
      },

      comparison: getPredictions.data.response[0].comparison,
      h2h: getPredictions.data.response[0].h2h,

      statistics: {
        home: getHomeStatistics.data.response,
        away: getAwayStatistics.data.response,
      },

      standings: getStandings.data.response[0],
      predictions: {
        tr: {
          long: ' ',
          short: ' ',
        },
        en: {
          long: ' ',
          short: ' ',
        },
        fr: {
          long: ' ',
          short: ' ',
        },
      },
      score: {
        ht: {
          home: 0,
          away: 0,
        },
        ft: {
          home: 0,
          away: 0,
        },
      },

      status: 'wait',
    };
  }
}
