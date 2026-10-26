export interface FixtureStatistic {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: string | number | null;
  }>;
}

export interface FixtureStatisticsResponse {
  get: string;
  parameters: {
    fixture: string;
  };
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: FixtureStatistic[];
}
