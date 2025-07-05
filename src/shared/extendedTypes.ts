import type { Schedule, ScheduleLog } from './types';

// Extended Schedule type with runtime properties that aren't in the database schema
export interface ExtendedSchedule extends Schedule {
  lastExecution?: Date;
  lastExecutionStatus?: 'success' | 'error' | 'timeout';
  nextRun?: Date;
}

// Type guard to check if a schedule is an extended schedule
export function isExtendedSchedule(schedule: Schedule): schedule is ExtendedSchedule {
  return 'lastExecution' in schedule || 'lastExecutionStatus' in schedule || 'nextRun' in schedule;
}
