import {
  TaskItem,
  WorklogEntry,
  SprintMetadata,
  CostData,
  CostAnalytics,
  CostByClient,
  CostByFeature,
  CostByDeveloper,
  CostBySprint,
  CostMetrics,
} from '../types';
import { isBacklogSprintValue, isFullyCompletedStatus } from '../utils/calculations';

/**
 * Helper function to check if a date is within a period (date only, no time)
 */
function isDateInPeriod(date: Date, startDate: Date, endDate: Date): boolean {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return dateOnly.getTime() >= startOnly.getTime() && dateOnly.getTime() <= endOnly.getTime();
}

/**
 * Get hourly rate for a developer from cost data
 */
function getHourlyRate(developer: string, costData: CostData[]): number {
  const cost = costData.find(c => c.responsavel === developer);
  return cost?.valorHora || 0;
}

/**
 * Filter tasks by date range based on sprint metadata
 */
function filterTasksByPeriod(
  tasks: TaskItem[],
  worklogs: WorklogEntry[],
  sprintMetadata: SprintMetadata[],
  selectedSprints: string[]
): {
  tasksInPeriod: TaskItem[];
  worklogsInPeriod: WorklogEntry[];
  startDate: Date;
  endDate: Date;
} {
  // First, filter only completed sprints
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completedSprints = sprintMetadata.filter(meta => {
    const sprintEnd = new Date(meta.dataFim);
    sprintEnd.setHours(23, 59, 59, 999);
    return sprintEnd < today; // Only completed sprints
  });
  
  const completedSprintNames = new Set(completedSprints.map(m => m.sprint));

  if (selectedSprints.length === 0 || sprintMetadata.length === 0) {
    // If no sprints selected, return all tasks from COMPLETED sprints only (exclude backlog)
    // IMPORTANT: Only include tasks from completed sprints and fully completed
    const validTasks = tasks.filter(t => {
      // Exclude backlog tasks - only tasks from valid sprints
      if (!t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint)) {
        return false;
      }
      // Only include tasks from completed sprints
      if (!completedSprintNames.has(t.sprint)) {
        return false;
      }
      // Only include fully completed tasks
      return isFullyCompletedStatus(t.status);
    });
    
    // Use date range from all completed sprints
    if (completedSprints.length === 0) {
      const today = new Date();
      return {
        tasksInPeriod: validTasks,
        worklogsInPeriod: worklogs,
        startDate: today,
        endDate: today,
      };
    }
    
    const startDate = new Date(Math.min(...completedSprints.map(m => m.dataInicio.getTime())));
    const endDate = new Date(Math.max(...completedSprints.map(m => m.dataFim.getTime())));
    
    // Filter worklogs by date range
    const worklogsInPeriod = worklogs.filter(w => isDateInPeriod(w.data, startDate, endDate));
    
    return {
      tasksInPeriod: validTasks,
      worklogsInPeriod: worklogsInPeriod,
      startDate,
      endDate,
    };
  }

  // Get date range from selected sprints (which are already filtered to completed sprints in the UI)
  const selectedMetadata = sprintMetadata.filter(m => selectedSprints.includes(m.sprint));
  if (selectedMetadata.length === 0) {
    const today = new Date();
    return {
      tasksInPeriod: [],
      worklogsInPeriod: [],
      startDate: today,
      endDate: today,
    };
  }

  const startDate = new Date(Math.min(...selectedMetadata.map(m => m.dataInicio.getTime())));
  const endDate = new Date(Math.max(...selectedMetadata.map(m => m.dataFim.getTime())));

  // Filter worklogs by date range
  const worklogsInPeriod = worklogs.filter(w => isDateInPeriod(w.data, startDate, endDate));

  // Filter tasks that have worklogs in period or are in selected sprints
  // IMPORTANT: Only include tasks from valid sprints (exclude backlog) and fully completed tasks
  const tasksInPeriod = tasks.filter(t => {
    // Exclude backlog tasks - only tasks from valid sprints
    if (!t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint)) {
      return false;
    }
    
    // Only include fully completed tasks
    if (!isFullyCompletedStatus(t.status)) {
      return false;
    }
    
    // Include tasks from selected sprints
    if (selectedSprints.length > 0 && selectedSprints.includes(t.sprint)) {
      return true;
    }
    
    return false;
  });

  return {
    tasksInPeriod,
    worklogsInPeriod,
    startDate,
    endDate,
  };
}

/**
 * Calculate cost for completed tasks (real cost based on worklogs)
 */
function calculateRealCost(
  tasks: TaskItem[],
  worklogs: WorklogEntry[],
  costData: CostData[]
): { cost: number; hours: number; taskCount: number } {
  let totalCost = 0;
  let totalHours = 0;
  let completedTaskCount = 0;

  for (const task of tasks) {
    // Only count tasks that are fully completed (not in testing, compiling, etc.)
    if (!isFullyCompletedStatus(task.status)) {
      continue;
    }

    // Get worklogs for this task
    const taskWorklogs = worklogs.filter(w => w.taskId === task.id || w.taskId === task.chave);
    
    // Calculate cost based on each worklog's responsible person (or task's responsible as fallback)
    let taskCost = 0;
    let taskHours = 0;
    
    for (const worklog of taskWorklogs) {
      const worklogHours = worklog.tempoGasto;
      if (worklogHours > 0) {
        // Use worklog's responsible if available, otherwise use task's responsible
        const responsible = worklog.responsavel?.trim() || task.responsavel;
        const hourlyRate = getHourlyRate(responsible, costData);
        taskCost += worklogHours * hourlyRate;
        taskHours += worklogHours;
      }
    }

    if (taskHours > 0) {
      totalCost += taskCost;
      totalHours += taskHours;
      completedTaskCount++;
    }
  }

  return { cost: totalCost, hours: totalHours, taskCount: completedTaskCount };
}


/**
 * Calculate costs by client
 */
function calculateCostsByClient(
  tasks: TaskItem[],
  worklogs: WorklogEntry[],
  costData: CostData[]
): CostByClient[] {
  const clientMap = new Map<string, {
    realCost: number;
    estimatedCost: number;
    realHours: number;
    estimatedHours: number;
    taskCount: number;
    completedTaskCount: number;
    backlogTaskCount: number;
  }>();

  // Process completed tasks (real costs) - only fully completed, not in testing/compiling
  // IMPORTANT: Only process tasks from valid sprints (exclude backlog)
  for (const task of tasks) {
    // Exclude backlog tasks - only tasks from valid sprints
    if (!task.sprint || task.sprint.trim() === '' || isBacklogSprintValue(task.sprint)) {
      continue;
    }
    
    if (isFullyCompletedStatus(task.status)) {
      const taskWorklogs = worklogs.filter(w => w.taskId === task.id || w.taskId === task.chave);
      
      // Calculate cost based on each worklog's responsible person (or task's responsible as fallback)
      let taskCost = 0;
      let taskHours = 0;
      
      for (const worklog of taskWorklogs) {
        const worklogHours = worklog.tempoGasto;
        if (worklogHours > 0) {
          // Use worklog's responsible if available, otherwise use task's responsible
          const responsible = worklog.responsavel?.trim() || task.responsavel;
          const hourlyRate = getHourlyRate(responsible, costData);
          taskCost += worklogHours * hourlyRate;
          taskHours += worklogHours;
        }
      }
      
      if (taskHours > 0) {
        const clients = task.categorias.length > 0 ? task.categorias : ['(Sem Cliente)'];
        for (const client of clients) {
          if (!clientMap.has(client)) {
            clientMap.set(client, {
              realCost: 0,
              estimatedCost: 0,
              realHours: 0,
              estimatedHours: 0,
              taskCount: 0,
              completedTaskCount: 0,
              backlogTaskCount: 0,
            });
          }
          
          const clientData = clientMap.get(client)!;
          clientData.realCost += taskCost;
          clientData.realHours += taskHours;
          clientData.taskCount++;
          clientData.completedTaskCount++;
        }
      }
    }
  }

  return Array.from(clientMap.entries())
    .map(([client, data]) => ({
      client,
      realCost: data.realCost,
      estimatedCost: 0,
      realHours: data.realHours,
      estimatedHours: 0,
      taskCount: data.taskCount,
      completedTaskCount: data.completedTaskCount,
      backlogTaskCount: 0,
    }))
    .sort((a, b) => b.realCost - a.realCost);
}

/**
 * Calculate costs by feature
 */
function calculateCostsByFeature(
  tasks: TaskItem[],
  worklogs: WorklogEntry[],
  costData: CostData[]
): CostByFeature[] {
  const featureMap = new Map<string, {
    realCost: number;
    estimatedCost: number;
    realHours: number;
    estimatedHours: number;
    taskCount: number;
    completedTaskCount: number;
    backlogTaskCount: number;
  }>();

  // Process completed tasks (real costs) - only fully completed, not in testing/compiling
  // IMPORTANT: Only process tasks from valid sprints (exclude backlog)
  for (const task of tasks) {
    // Exclude backlog tasks - only tasks from valid sprints
    if (!task.sprint || task.sprint.trim() === '' || isBacklogSprintValue(task.sprint)) {
      continue;
    }
    
    if (isFullyCompletedStatus(task.status)) {
      const taskWorklogs = worklogs.filter(w => w.taskId === task.id || w.taskId === task.chave);
      
      // Calculate cost based on each worklog's responsible person (or task's responsible as fallback)
      let taskCost = 0;
      let taskHours = 0;
      
      for (const worklog of taskWorklogs) {
        const worklogHours = worklog.tempoGasto;
        if (worklogHours > 0) {
          // Use worklog's responsible if available, otherwise use task's responsible
          const responsible = worklog.responsavel?.trim() || task.responsavel;
          const hourlyRate = getHourlyRate(responsible, costData);
          taskCost += worklogHours * hourlyRate;
          taskHours += worklogHours;
        }
      }
      
      if (taskHours > 0) {
        const features = task.feature.length > 0 ? task.feature : ['(Sem Feature)'];
        for (const feature of features) {
          if (!featureMap.has(feature)) {
            featureMap.set(feature, {
              realCost: 0,
              estimatedCost: 0,
              realHours: 0,
              estimatedHours: 0,
              taskCount: 0,
              completedTaskCount: 0,
              backlogTaskCount: 0,
            });
          }
          
          const featureData = featureMap.get(feature)!;
          featureData.realCost += taskCost;
          featureData.realHours += taskHours;
          featureData.taskCount++;
          featureData.completedTaskCount++;
        }
      }
    }
  }

  return Array.from(featureMap.entries())
    .map(([feature, data]) => ({
      feature,
      realCost: data.realCost,
      estimatedCost: 0,
      realHours: data.realHours,
      estimatedHours: 0,
      taskCount: data.taskCount,
      completedTaskCount: data.completedTaskCount,
      backlogTaskCount: 0,
    }))
    .sort((a, b) => b.realCost - a.realCost);
}

/**
 * Calculate costs by developer
 */
function calculateCostsByDeveloper(
  tasks: TaskItem[],
  worklogs: WorklogEntry[],
  costData: CostData[]
): CostByDeveloper[] {
  const developerMap = new Map<string, {
    totalCost: number;
    totalHours: number;
    taskCount: number;
  }>();

  // Process all tasks - aggregate by worklog responsible person
  // IMPORTANT: Only process tasks from valid sprints (exclude backlog)
  for (const task of tasks) {
    // Exclude backlog tasks - only tasks from valid sprints
    if (!task.sprint || task.sprint.trim() === '' || isBacklogSprintValue(task.sprint)) {
      continue;
    }
    
    // Only count real costs from worklogs - only fully completed tasks
    if (isFullyCompletedStatus(task.status)) {
      const taskWorklogs = worklogs.filter(w => w.taskId === task.id || w.taskId === task.chave);
      
      // Group worklogs by responsible person
      const worklogsByDeveloper = new Map<string, number>();
      
      for (const worklog of taskWorklogs) {
        const worklogHours = worklog.tempoGasto;
        if (worklogHours > 0) {
          // Use worklog's responsible if available, otherwise use task's responsible
          const worklogResponsible = worklog.responsavel?.trim() || task.responsavel;
          if (worklogResponsible) {
            const currentHours = worklogsByDeveloper.get(worklogResponsible) || 0;
            worklogsByDeveloper.set(worklogResponsible, currentHours + worklogHours);
          }
        }
      }
      
      // Add costs and hours for each developer
      for (const [devName, hours] of worklogsByDeveloper.entries()) {
        if (!developerMap.has(devName)) {
          developerMap.set(devName, {
            totalCost: 0,
            totalHours: 0,
            taskCount: 0,
          });
        }
        
        const devData = developerMap.get(devName)!;
        const hourlyRate = getHourlyRate(devName, costData);
        devData.totalCost += hours * hourlyRate;
        devData.totalHours += hours;
        devData.taskCount++;
      }
    }
  }

  return Array.from(developerMap.entries())
    .map(([developer, data]) => ({
      developer,
      ...data,
      averageCostPerHour: data.totalHours > 0 ? data.totalCost / data.totalHours : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

/**
 * Calculate costs by sprint
 */
function calculateCostsBySprint(
  tasks: TaskItem[],
  worklogs: WorklogEntry[],
  sprintMetadata: SprintMetadata[],
  costData: CostData[]
): CostBySprint[] {
  const sprintMap = new Map<string, {
    totalCost: number;
    totalHours: number;
    taskCount: number;
    startDate: Date;
    endDate: Date;
  }>();

  // Initialize with sprint metadata
  for (const sprint of sprintMetadata) {
    sprintMap.set(sprint.sprint, {
      totalCost: 0,
      totalHours: 0,
      taskCount: 0,
      startDate: sprint.dataInicio,
      endDate: sprint.dataFim,
    });
  }

  // Process tasks
  for (const task of tasks) {
    if (!task.sprint || isBacklogSprintValue(task.sprint)) {
      continue;
    }

    const sprintData = sprintMap.get(task.sprint);
    if (!sprintData) continue;

    if (isFullyCompletedStatus(task.status)) {
      // Real cost from worklogs - only fully completed tasks
      const taskWorklogs = worklogs.filter(w => {
        if (w.taskId !== task.id && w.taskId !== task.chave) return false;
        return isDateInPeriod(w.data, sprintData.startDate, sprintData.endDate);
      });
      
      // Calculate cost based on each worklog's responsible person (or task's responsible as fallback)
      let taskCost = 0;
      let taskHours = 0;
      
      for (const worklog of taskWorklogs) {
        const worklogHours = worklog.tempoGasto;
        if (worklogHours > 0) {
          // Use worklog's responsible if available, otherwise use task's responsible
          const responsible = worklog.responsavel?.trim() || task.responsavel;
          const hourlyRate = getHourlyRate(responsible, costData);
          taskCost += worklogHours * hourlyRate;
          taskHours += worklogHours;
        }
      }
      
      if (taskHours > 0) {
        sprintData.totalCost += taskCost;
        sprintData.totalHours += taskHours;
        sprintData.taskCount++;
      }
    }
  }

  return Array.from(sprintMap.entries())
    .map(([sprintName, data]) => ({
      sprintName,
      ...data,
    }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/**
 * Main function to calculate cost analytics
 */
export function calculateCostAnalytics(
  tasks: TaskItem[],
  worklogs: WorklogEntry[],
  sprintMetadata: SprintMetadata[],
  costData: CostData[],
  selectedSprints: string[] = []
): CostAnalytics {
  // Filter tasks and worklogs by period
  const { tasksInPeriod, worklogsInPeriod, startDate, endDate } = filterTasksByPeriod(
    tasks,
    worklogs,
    sprintMetadata,
    selectedSprints
  );

  // Calculate overall metrics (only real costs)
  const realMetrics = calculateRealCost(tasksInPeriod, worklogsInPeriod, costData);
  
  const overall: CostMetrics = {
    totalCost: realMetrics.cost,
    totalHours: realMetrics.hours,
    averageCostPerHour: realMetrics.hours > 0
      ? realMetrics.cost / realMetrics.hours
      : 0,
    taskCount: realMetrics.taskCount,
  };

  // Calculate breakdowns
  const byClient = calculateCostsByClient(tasksInPeriod, worklogsInPeriod, costData);
  const byFeature = calculateCostsByFeature(tasksInPeriod, worklogsInPeriod, costData);
  const byDeveloper = calculateCostsByDeveloper(tasksInPeriod, worklogsInPeriod, costData);
  const bySprint = calculateCostsBySprint(tasksInPeriod, worklogsInPeriod, sprintMetadata, costData);

  return {
    overall,
    byClient,
    byFeature,
    byDeveloper,
    bySprint,
    period: {
      startDate,
      endDate,
      selectedSprints,
    },
  };
}

