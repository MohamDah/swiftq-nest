import { ApiProperty } from '@nestjs/swagger';

class PeakHourDto {
  @ApiProperty({ example: 14, description: 'Hour of the day (0–23)' })
  hour: number;

  @ApiProperty({
    example: 20,
    description: 'Number of entries during that hour',
  })
  count: number;
}

export class AnalyticsDto {
  @ApiProperty({ type: PeakHourDto })
  peakHour: PeakHourDto;

  @ApiProperty({ example: 7.5, description: 'Average wait time in minutes' })
  averageWaitTime: number;

  @ApiProperty({
    example: 15,
    description: 'Average number of customers per queue session',
  })
  averageCustomers: number;

  @ApiProperty({
    example: 120,
    description: 'Total number of customers served',
  })
  totalCustomers: number;

  @ApiProperty({ example: 5, description: 'Total number of queues' })
  totalQueues: number;
}
