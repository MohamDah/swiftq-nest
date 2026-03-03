import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TimeRangeFilter {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  WEEK = 'week',
  MONTH = 'month',
  ALL = 'all',
}

export class AnalyticsQueryDto {
  @ApiProperty({
    enum: TimeRangeFilter,
    description: 'Time range for analytics data',
  })
  @IsEnum(TimeRangeFilter)
  filter: TimeRangeFilter;
}
