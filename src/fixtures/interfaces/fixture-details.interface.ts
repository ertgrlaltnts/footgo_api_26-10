import { FixtureResponse } from './fixture-response.interface';
import { FixtureEvent } from './fixture-events.interface';
import { FixtureStatistic } from './fixture-statistics.interface';

export interface FixtureDetailsResponse {
  fixture: FixtureResponse;
  events: FixtureEvent[];
  statistics: FixtureStatistic[];
}

