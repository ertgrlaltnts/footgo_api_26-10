export class CreateCouponDto {
  predictions: Array<{
    id: number;
    date: string;
    time: string;
    homeTeam: {
      _id: string;
      teamId: number;
      name: string;
      logo: string;
      __v: number;
    };
    awayTeam: {
      _id: string;
      teamId: number;
      name: string;
      logo: string;
      __v: number;
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
    predictions: {
      tr: string;
      en: string;
      fr: string;
    };
    status: string;
  }>;
  price: number;
  totalOdds: string;
  status: string;
}
