import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { FixturesApiResponse } from './interfaces/fixture-response.interface';

@Injectable()
export class FixturesApiService {
  private readonly logger = new Logger(FixturesApiService.name);
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly apiKey = 'd5c241c97a8469aaa8e510cb20d39c0b';

  private get headers() {
    return { 'x-apisports-key': this.apiKey };
  }

  async getFixturesByDate(
    date: string,
    status?: string,
  ): Promise<FixturesApiResponse> {
    try {
      this.logger.log(
        `Maçlar getiriliyor: date=${date}, status=${status || 'ALL'}`,
      );

      const params: { date?: string; status?: string } = { date };
      if (status) {
        params.status = status;
      }

      const response = await axios.get<FixturesApiResponse>(
        `${this.baseUrl}/fixtures`,
        {
          headers: this.headers,
          params,
        },
      );

      this.logger.log(`${response.data.results} maç bulundu.`);
      return response.data;
    } catch (error) {
      this.logger.error('Maçlar getirilirken hata oluştu:', error.message);
      throw error;
    }
  }

  async getFixtureById(fixtureId: number): Promise<FixturesApiResponse> {
    try {
      this.logger.log(`Maç detayı getiriliyor: fixtureId=${fixtureId}`);

      const response = await axios.get<FixturesApiResponse>(
        `${this.baseUrl}/fixtures?id=${fixtureId}`,
        {
          headers: this.headers,
          params: { id: fixtureId },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Maç detayı getirilirken hata oluştu:', error.message);
      throw error;
    }
  }

  async getFixturesByLeague(
    leagueId: number,
    season: number,
    date?: string,
  ): Promise<FixturesApiResponse> {
    try {
      this.logger.log(
        `Lig maçları getiriliyor: league=${leagueId}, season=${season}`,
      );

      const params: any = {
        league: leagueId,
        season,
      };

      if (date) {
        params.date = date;
      }

      const response = await axios.get<FixturesApiResponse>(
        `${this.baseUrl}/fixtures`,
        {
          headers: this.headers,
          params: params as { league: number; season: number; date?: string },
        },
      );

      this.logger.log(`${response.data.results} maç bulundu.`);
      return response.data;
    } catch (error) {
      this.logger.error('Lig maçları getirilirken hata oluştu:', error.message);
      throw error;
    }
  }

  async getFixturesByTeam(
    teamId: number,
    season: number,
    date?: string,
  ): Promise<FixturesApiResponse> {
    try {
      this.logger.log(
        `Takım maçları getiriliyor: team=${teamId}, season=${season}`,
      );

      const params: any = {
        team: teamId,
        season,
      };

      if (date) {
        params.date = date;
      }

      const response = await axios.get<FixturesApiResponse>(
        `${this.baseUrl}/fixtures`,
        {
          headers: this.headers,
          params: params as { team: number; season: number; date?: string },
        },
      );

      this.logger.log(`${response.data.results} maç bulundu.`);
      return response.data;
    } catch (error) {
      this.logger.error(
        'Takım maçları getirilirken hata oluştu:',
        error.message,
      );
      throw error;
    }
  }
}
