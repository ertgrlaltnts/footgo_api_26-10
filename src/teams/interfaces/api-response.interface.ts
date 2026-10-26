export interface LeagueResponse {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: Season[];
}

export interface Season {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage: {
    fixtures: {
      events: boolean;
      lineups: boolean;
      statistics_fixtures: boolean;
      statistics_players: boolean;
    };
    standings: boolean;
    players: boolean;
    top_scorers: boolean;
    top_assists: boolean;
    top_cards: boolean;
    injuries: boolean;
    predictions: boolean;
    odds: boolean;
  };
}

export interface TeamResponse {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  };
}

export interface MatchDetails {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number;
      name: string;
      city: string;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
      extra: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
    standings: boolean;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

export interface MatchPredictions {
  predictions: {
    winner: {
      id: number;
      name: string;
      comment: string;
    };
    win_or_draw: boolean;
    under_over: string | null;
    goals: {
      home: string;
      away: string;
    };
    advice: string;
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
  };
  teams: {
    home: TeamPredictionData;
    away: TeamPredictionData;
  };
  comparison: {
    form: {
      home: string;
      away: string;
    };
    att: {
      home: string;
      away: string;
    };
    def: {
      home: string;
      away: string;
    };
    poisson_distribution: {
      home: string;
      away: string;
    };
    h2h: {
      home: string;
      away: string;
    };
    goals: {
      home: string;
      away: string;
    };
    total: {
      home: string;
      away: string;
    };
  };
  h2h: MatchDetails[];
}

export interface TeamPredictionData {
  id: number;
  name: string;
  logo: string;
  last_5: {
    played: number;
    form: string;
    att: string;
    def: string;
    goals: {
      for: {
        total: number;
        average: string;
      };
      against: {
        total: number;
        average: string;
      };
    };
  };
  league: {
    form: string;
    fixtures: {
      played: {
        home: number;
        away: number;
        total: number;
      };
      wins: {
        home: number;
        away: number;
        total: number;
      };
      draws: {
        home: number;
        away: number;
        total: number;
      };
      loses: {
        home: number;
        away: number;
        total: number;
      };
    };
    goals: {
      for: TeamGoals;
      against: TeamGoals;
    };
    biggest: {
      streak: {
        wins: number;
        draws: number;
        loses: number;
      };
      wins: {
        home: string | null;
        away: string | null;
      };
      loses: {
        home: string | null;
        away: string | null;
      };
      goals: {
        for: {
          home: number | null;
          away: number | null;
        };
        against: {
          home: number | null;
          away: number | null;
        };
      };
    };
    clean_sheet: {
      home: number;
      away: number;
      total: number;
    };
    failed_to_score: {
      home: number;
      away: number;
      total: number;
    };
    penalty: {
      scored: {
        total: number;
        percentage: string;
      };
      missed: {
        total: number;
        percentage: string;
      };
      total: number;
    };
    lineups: Array<{
      formation: string;
      played: number;
    }>;
    cards: {
      yellow: TimeBasedStats;
      red: TimeBasedStats;
    };
  };
}

export interface TeamGoals {
  total: {
    home: number;
    away: number;
    total: number;
  };
  average: {
    home: string;
    away: string;
    total: string;
  };
  minute: TimeBasedStats;
  under_over: {
    '0.5': {
      over: number;
      under: number;
    };
    '1.5': {
      over: number;
      under: number;
    };
    '2.5': {
      over: number;
      under: number;
    };
    '3.5': {
      over: number;
      under: number;
    };
    '4.5': {
      over: number;
      under: number;
    };
  };
}

export interface TimeBasedStats {
  '0-15': {
    total: number | null;
    percentage: string | null;
  };
  '16-30': {
    total: number | null;
    percentage: string | null;
  };
  '31-45': {
    total: number | null;
    percentage: string | null;
  };
  '46-60': {
    total: number | null;
    percentage: string | null;
  };
  '61-75': {
    total: number | null;
    percentage: string | null;
  };
  '76-90': {
    total: number | null;
    percentage: string | null;
  };
  '91-105': {
    total: number | null;
    percentage: string | null;
  };
  '106-120': {
    total: number | null;
    percentage: string | null;
  };
}

export interface TeamStatisticsData {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  form: string;
  fixtures: {
    played: {
      home: number;
      away: number;
      total: number;
    };
    wins: {
      home: number;
      away: number;
      total: number;
    };
    draws: {
      home: number;
      away: number;
      total: number;
    };
    loses: {
      home: number;
      away: number;
      total: number;
    };
  };
  goals: {
    for: TeamGoals;
    against: TeamGoals;
  };
  biggest: {
    streak: {
      wins: number;
      draws: number;
      loses: number;
    };
    wins: {
      home: string | null;
      away: string | null;
    };
    loses: {
      home: string | null;
      away: string | null;
    };
    goals: {
      for: {
        home: number | null;
        away: number | null;
      };
      against: {
        home: number | null;
        away: number | null;
      };
    };
  };
  clean_sheet: {
    home: number;
    away: number;
    total: number;
  };
  failed_to_score: {
    home: number;
    away: number;
    total: number;
  };
  penalty: {
    scored: {
      total: number;
      percentage: string;
    };
    missed: {
      total: number;
      percentage: string;
    };
    total: number;
  };
  lineups: Array<{
    formation: string;
    played: number;
  }>;
  cards: {
    yellow: TimeBasedStats;
    red: TimeBasedStats;
  };
}

export interface TeamStatistics {
  home: TeamStatisticsData;
  away: TeamStatisticsData;
}

export interface StandingTeam {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

export interface Standings {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    standings: StandingTeam[][];
  };
}

export interface MatchResponse {
  isFree: boolean;
  time: {
    date: string;
    time: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
  };

  homeTeam: {
    id: number;
    name: string;
    logo: string;
    last_5: object;
    league: object;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
    last_5: object;
    league: object;
  };
  comparison: object;
  h2h: object[];

  statistics: {
    home: TeamStatisticsData;
    away: TeamStatisticsData;
  };

  standings: Standings;

  predictions: {
    tr: {
      long: string;
      short: string;
    };
    en: {
      long: string;
      short: string;
    };
    fr: {
      long: string;
      short: string;
    };
  };

  score: {
    ht: {
      home: number;
      away: number;
    };
    ft: {
      home: number;
      away: number;
    };
  };

  status: string;
}
