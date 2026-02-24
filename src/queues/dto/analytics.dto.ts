export class AnalyticsDto {
  peakHour: {
    hour: number;
    count: number;
  };
  averageWaitTime: number;
  averageCustomers: number;
  totalCustomers: number;
  totalQueues: number;
}
