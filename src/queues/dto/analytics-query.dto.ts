import { IsEnum } from 'class-validator';

export enum TimeRangeFilter {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  WEEK = 'week',
  MONTH = 'month',
  ALL = 'all',
}

export class AnalyticsQuery {
  @IsEnum(TimeRangeFilter)
  filter: TimeRangeFilter;
}
