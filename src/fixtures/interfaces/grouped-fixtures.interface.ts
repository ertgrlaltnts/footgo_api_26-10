import { FixtureResponse } from './fixture-response.interface';

export interface LeagueGroup {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
  };
  fixtures: FixtureResponse[];
}

export interface GroupedFixturesResponse {
  results: number;
  leagues: LeagueGroup[];
}

