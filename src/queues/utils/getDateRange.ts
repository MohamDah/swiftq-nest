import { TimeRangeFilter } from '../dto/analytics-query.dto';

const getDateRange = (
  filter: TimeRangeFilter,
): { startDate: Date | null; endDate: Date | null } => {
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  switch (filter) {
    case TimeRangeFilter.TODAY:
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;

    case TimeRangeFilter.YESTERDAY:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;

    case TimeRangeFilter.WEEK:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;

    case TimeRangeFilter.MONTH:
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;

    case TimeRangeFilter.ALL:
    default:
      startDate = null;
      endDate = null;
      break;
  }

  return { startDate, endDate };
};

export default getDateRange;
