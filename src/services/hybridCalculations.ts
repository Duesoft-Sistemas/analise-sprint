import { TaskItem, WorklogEntry, SprintPeriod } from '../types';

/**
 * Check if a date is within a sprint period
 */
export function isDateInSprint(date: Date, sprintStart: Date, sprintEnd: Date): boolean {
  const time = date.getTime();
  return time >= sprintStart.getTime() && time <= sprintEnd.getTime();
}

/**
 * Sum hours from worklog entries
 */
function sumWorklogHours(worklogs: WorklogEntry[]): number {
  return worklogs.reduce((sum, log) => sum + log.tempoGasto, 0);
}

/**
 * Calculate hybrid metrics for a single task based on worklogs and sprint period
 * IMPORTANT: Time spent is ALWAYS from worklog, never from sprint spreadsheet
 */
export function calculateTaskHybridMetrics(
  task: TaskItem,
  worklogs: WorklogEntry[],
  sprintPeriod: SprintPeriod | null
): TaskItem {
  // If no worklogs provided, time spent is 0 (NEVER use task.tempoGasto)
  if (!worklogs || worklogs.length === 0) {
    return {
      ...task,
      tempoGastoTotal: 0,
      tempoGastoNoSprint: 0,
      tempoGastoOutrosSprints: 0,
      estimativaRestante: task.estimativa,
    };
  }

  // Filter worklogs for this task (match by ID or key)
  const taskWorklogs = worklogs.filter(
    (w) => w.taskId === task.id || w.taskId === task.chave
  );

  // If no worklogs for this task, time spent is 0 (NEVER use task.tempoGasto)
  if (taskWorklogs.length === 0) {
    return {
      ...task,
      tempoGastoTotal: 0,
      tempoGastoNoSprint: 0,
      tempoGastoOutrosSprints: 0,
      estimativaRestante: task.estimativa,
    };
  }

  let tempoGastoNoSprint = 0;
  let tempoGastoOutrosSprints = 0;

  if (sprintPeriod) {
    // Separate worklogs: current sprint vs other sprints
    const currentSprintLogs = taskWorklogs.filter((w) =>
      isDateInSprint(w.data, sprintPeriod.startDate, sprintPeriod.endDate)
    );
    const otherSprintsLogs = taskWorklogs.filter(
      (w) => !isDateInSprint(w.data, sprintPeriod.startDate, sprintPeriod.endDate)
    );

    tempoGastoNoSprint = sumWorklogHours(currentSprintLogs);
    tempoGastoOutrosSprints = sumWorklogHours(otherSprintsLogs);
  } else {
    // If no sprint period defined, consider all worklogs as current sprint
    tempoGastoNoSprint = sumWorklogHours(taskWorklogs);
    tempoGastoOutrosSprints = 0;
  }

  const tempoGastoTotal = tempoGastoNoSprint + tempoGastoOutrosSprints;

  // Calculate remaining estimate: original estimate minus time spent in other sprints
  // This represents how much work is "left" for the current sprint
  const estimativaRestante = Math.max(0, task.estimativa - tempoGastoOutrosSprints);

  return {
    ...task,
    estimativaRestante,
    tempoGastoTotal,
    tempoGastoNoSprint,
    tempoGastoOutrosSprints,
  };
}

/**
 * Calculate hybrid metrics for all tasks based on worklogs and sprint period
 */
export function calculateAllTasksHybridMetrics(
  tasks: TaskItem[],
  worklogs: WorklogEntry[],
  sprintPeriod: SprintPeriod | null
): TaskItem[] {
  return tasks.map((task) => calculateTaskHybridMetrics(task, worklogs, sprintPeriod));
}

/**
 * Parse sprint period from dates
 */
export function parseSprintPeriod(
  sprintName: string,
  startDate: string | Date,
  endDate: string | Date
): SprintPeriod {
  // Helper function to parse date string as local timezone (not UTC)
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Month is 0-indexed in JavaScript Date
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };
  
  // Parse start date at beginning of day (00:00:00)
  const parsedStartDate = typeof startDate === 'string' ? parseLocalDate(startDate) : startDate;
  parsedStartDate.setHours(0, 0, 0, 0);
  
  // Parse end date at end of day (23:59:59.999) to include the entire last day
  const parsedEndDate = typeof endDate === 'string' ? parseLocalDate(endDate) : endDate;
  parsedEndDate.setHours(23, 59, 59, 999);
  
  return {
    sprintName,
    startDate: parsedStartDate,
    endDate: parsedEndDate,
  };
}

/**
 * Get default sprint period (current week: Monday to Friday)
 */
export function getDefaultSprintPeriod(sprintName: string): SprintPeriod {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate start of week (Monday)
  const startOfWeek = new Date(now);
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(now.getDate() + daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Calculate end of week (Friday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4); // Monday + 4 days = Friday
  endOfWeek.setHours(23, 59, 59, 999);
  
  return {
    sprintName,
    startDate: startOfWeek,
    endDate: endOfWeek,
  };
}

/**
 * Format date to YYYY-MM-DD for input fields
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

