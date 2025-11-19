import {
  TaskItem,
  SprintAnalytics,
  DeveloperMetrics,
  Totalizer,
  CrossSprintAnalytics,
  RiskAlert,
  ProblemAnalysis,
  WorklogEntry,
} from '../types';
import { SprintMetadata } from '../types';
import {
  isCompletedStatus,
  calculateRiskLevel,
  calculatePercentage,
  normalizeForComparison,
  isNeutralTask,
  isAuxilioTask,
  isImpedimentoTrabalhoTask,
} from '../utils/calculations';
import { isBacklogSprintValue } from '../utils/calculations';

// Helper function to compare dates without time (only date part)
function compareDateOnly(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1.getTime() - d2.getTime();
}

// Helper function to check if a date is within a period (date only, no time)
function isDateInPeriod(date: Date, startDate: Date, endDate: Date): boolean {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return dateOnly.getTime() >= startOnly.getTime() && dateOnly.getTime() <= endOnly.getTime();
}

// Helper to check if task has DuvidaOculta in detalhesOcultos array
function isDuvidaOcultaTask(task: TaskItem): boolean {
  if (!task.detalhesOcultos || task.detalhesOcultos.length === 0) return false;
  return task.detalhesOcultos.some(d => {
    const normalized = normalizeForComparison(d);
    return normalized === 'duvidaoculta' || normalized === 'duvida oculta';
  });
}

// Calculate analytics for a specific sprint
// IMPORTANT: Time spent is ALWAYS from worklog (tempoGastoNoSprint), never from sprint spreadsheet
export function calculateSprintAnalytics(
  tasks: TaskItem[],
  sprintName: string
): SprintAnalytics {
  // IMPORTANT: Explicitly exclude tasks without sprint (backlog) - they don't interfere in sprint analytics
  const sprintTasks = tasks.filter(
    (t) => t.sprint === sprintName && t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint)
  );

  const completedTasks = sprintTasks.filter((t) => isCompletedStatus(t.status));
  
  // Use hybrid fields for current sprint analysis - ALWAYS from worklog
  const totalHours = sprintTasks.reduce(
    (sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 
    0
  );
  const totalEstimatedHours = sprintTasks.reduce(
    (sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 
    0
  );
  const completedHours = completedTasks.reduce(
    (sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 
    0
  );

  return {
    sprintName,
    totalTasks: sprintTasks.length,
    totalHours,
    totalEstimatedHours,
    completedTasks: completedTasks.length,
    completedHours,
    developers: calculateDeveloperMetrics(sprintTasks),
    byType: calculateTypeMetrics(sprintTasks),
    byFeature: calculateDimensionMetrics(sprintTasks, 'feature'),
    byModule: calculateDimensionMetrics(sprintTasks, 'modulo'),
    byClient: calculateClientMetrics(sprintTasks),
  };
}

// Calculate metrics per developer
function calculateDeveloperMetrics(tasks: TaskItem[]): DeveloperMetrics[] {
  const devMap = new Map<string, TaskItem[]>();

  for (const task of tasks) {
    if (!task.responsavel) continue;
    
    if (!devMap.has(task.responsavel)) {
      devMap.set(task.responsavel, []);
    }
    devMap.get(task.responsavel)!.push(task);
  }

  const developers: DeveloperMetrics[] = [];

  for (const [name, devTasks] of devMap.entries()) {
    // HYBRID APPROACH:
    // - For capacity allocation: use estimativaRestante (what's left for THIS sprint)
    // - For time spent in sprint: use tempoGastoNoSprint (time logged in THIS sprint) - ALWAYS from worklog
    // Note: This function receives tasks already filtered by sprint (from calculateSprintAnalytics)
    
    // Capacity/Allocation metrics (for "can they finish the sprint?")
    const totalAllocatedHours = devTasks.reduce(
      (sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 
      0
    );
    const totalSpentHours = devTasks.reduce(
      (sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 
      0
    );
    
    // Available hours calculation: use the MAXIMUM between estimated and spent for each task
    // This ensures that if a task goes over estimate, it consumes the actual hours spent
    const totalConsumedHours = devTasks.reduce((sum, t) => {
      if (isCompletedStatus(t.status)) {
        return sum + (t.tempoGastoNoSprint ?? 0);
      }

      return sum + Math.max(
        t.estimativaRestante ?? t.estimativa,
        t.tempoGastoNoSprint ?? 0
      );
    }, 0);
    const availableHours = 40 - totalConsumedHours;
    
    // Performance metrics (for accuracy analysis)
    const estimatedHours = devTasks.reduce((sum, t) => sum + t.estimativa, 0);
    
    // Utilization based on current sprint allocation
    const utilizationPercent = calculatePercentage(totalAllocatedHours, 40); // 40h work week

    developers.push({
      name,
      id: devTasks[0]?.idResponsavel || '',
      totalAllocatedHours, // Hours allocated in THIS sprint (remaining work)
      totalAvailableHours: availableHours, // Remaining capacity
      totalSpentHours, // Hours spent in THIS sprint
      estimatedHours, // Original estimates (for performance analysis)
      tasks: devTasks,
      riskLevel: calculateRiskLevel(utilizationPercent),
      utilizationPercent,
    });
  }

  return developers.sort((a, b) => b.totalAllocatedHours - a.totalAllocatedHours);
}

// Calculate metrics by type (bugs, tarefas, histórias)
function calculateTypeMetrics(tasks: TaskItem[]): SprintAnalytics['byType'] {
  const bugs = tasks.filter((t) => t.tipo === 'Bug');
  const realBugs = bugs.filter((t) => !isDuvidaOcultaTask(t));
  const dubidasOcultas = bugs.filter((t) => isDuvidaOcultaTask(t));
  const tarefas = tasks.filter((t) => t.tipo === 'Tarefa');
  const historias = tasks.filter((t) => t.tipo === 'História');
  const outros = tasks.filter((t) => t.tipo === 'Outro');

  return {
    bugs: {
      realBugs: createTotalizer('Bugs Reais', realBugs),
      dubidasOcultas: createTotalizer('Dúvidas Ocultas', dubidasOcultas),
      total: createTotalizer('Total Bugs', bugs),
    },
    tarefas: createTotalizer('Tarefas', tarefas),
    historias: createTotalizer('Histórias', historias),
    outros: createTotalizer('Outros', outros),
  };
}

// Calculate metrics by dimension (feature, module)
function calculateDimensionMetrics(
  tasks: TaskItem[],
  dimension: 'feature' | 'modulo'
): Totalizer[] {
  const map = new Map<string, TaskItem[]>();

  for (const task of tasks) {
    if (dimension === 'feature') {
      // Features é um array - cada feature deve criar uma entrada separada
      // Filtrar features vazias e criar entrada para cada feature válida
      const validFeatures = task.feature.filter(f => f && f.trim() !== '');
      if (validFeatures.length > 0) {
        for (const feature of validFeatures) {
          const key = feature.trim();
          if (!map.has(key)) {
            map.set(key, []);
          }
          map.get(key)!.push(task);
        }
      } else {
        // Sem features válidas
        const key = '(Sem Feature)';
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(task);
      }
    } else {
      // Módulo continua sendo string
      const value = task.modulo;
      const key = value || '(Sem Módulo)';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    }
  }

  const totalizers: Totalizer[] = [];
  for (const [label, groupTasks] of map.entries()) {
    totalizers.push(createTotalizer(label, groupTasks));
  }

  return totalizers.sort((a, b) => {
    if (b.hours !== a.hours) {
      return b.hours - a.hours;
    }
    return b.count - a.count;
  });
}

// Calculate metrics by client (categorias)
function calculateClientMetrics(tasks: TaskItem[]): Totalizer[] {
  const map = new Map<string, TaskItem[]>();

  for (const task of tasks) {
    // Filtrar categorias vazias e criar entrada para cada categoria válida
    const validClients = task.categorias.filter(c => c && c.trim() !== '');
    const clients = validClients.length > 0 ? validClients : ['(Sem Cliente)'];
    
    for (const client of clients) {
      const key = client.trim();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    }
  }

  const totalizers: Totalizer[] = [];
  for (const [label, groupTasks] of map.entries()) {
    totalizers.push(createTotalizer(label, groupTasks));
  }

  return totalizers.sort((a, b) => {
    if (b.hours !== a.hours) {
      return b.hours - a.hours;
    }
    return b.count - a.count;
  });
}

// Helper to create totalizer object
// IMPORTANT: Time spent is ALWAYS from worklog (tempoGastoNoSprint)
function createTotalizer(label: string, tasks: TaskItem[]): Totalizer {
  return {
    label,
    count: tasks.length,
    // Use hybrid fields: tempoGastoNoSprint for current sprint hours - ALWAYS from worklog
    hours: tasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0),
    // Use estimativaRestante for remaining work in current sprint
    estimatedHours: tasks.reduce((sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 0),
  };
}

// Calculate cross-sprint analytics
export function calculateCrossSprintAnalytics(
  tasks: TaskItem[]
): CrossSprintAnalytics {
  const backlogTasks = tasks.filter((t) => !t.sprint || isBacklogSprintValue(t.sprint) || t.sprint.trim() === '');
  const tasksWithSprint = tasks.filter((t) => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));

  // Sprint distribution
  const sprintMap = new Map<string, TaskItem[]>();
  for (const task of tasksWithSprint) {
    if (!sprintMap.has(task.sprint)) {
      sprintMap.set(task.sprint, []);
    }
    sprintMap.get(task.sprint)!.push(task);
  }

  const sprintDistribution = Array.from(sprintMap.entries()).map(
    ([sprintName, sprintTasks]) => ({
      sprintName,
      tasks: sprintTasks.length,
      hours: sprintTasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0),
      estimatedHours: sprintTasks.reduce((sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 0),
    })
  );

  // Developer allocation across all sprints
  const devSprintMap = new Map<string, Map<string, TaskItem[]>>();
  for (const task of tasksWithSprint) {
    if (!task.responsavel) continue;
    
    if (!devSprintMap.has(task.responsavel)) {
      devSprintMap.set(task.responsavel, new Map());
    }
    const devSprints = devSprintMap.get(task.responsavel)!;
    
    if (!devSprints.has(task.sprint)) {
      devSprints.set(task.sprint, []);
    }
    devSprints.get(task.sprint)!.push(task);
  }

  const developerAllocation = Array.from(devSprintMap.entries()).map(
    ([name, sprints]) => {
      const sprintsData = Array.from(sprints.entries()).map(
        ([sprintName, tasks]) => ({
          sprintName,
          hours: tasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0),
          estimatedHours: tasks.reduce((sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 0),
        })
      );

      return {
        name,
        sprints: sprintsData,
        totalHours: sprintsData.reduce((sum, s) => sum + s.hours, 0),
        totalEstimatedHours: sprintsData.reduce((sum, s) => sum + s.estimatedHours, 0),
      };
    }
  );

  // Client allocation across all sprints
  const clientSprintMap = new Map<string, Map<string, TaskItem[]>>();
  for (const task of tasksWithSprint) {
    const clients = task.categorias.length > 0 ? task.categorias : ['(Sem Cliente)'];
    
    for (const client of clients) {
      if (!clientSprintMap.has(client)) {
        clientSprintMap.set(client, new Map());
      }
      const clientSprints = clientSprintMap.get(client)!;
      
      if (!clientSprints.has(task.sprint)) {
        clientSprints.set(task.sprint, []);
      }
      clientSprints.get(task.sprint)!.push(task);
    }
  }

  const clientAllocation = Array.from(clientSprintMap.entries()).map(
    ([client, sprints]) => {
      const sprintsData = Array.from(sprints.entries()).map(
        ([sprintName, tasks]) => ({
          sprintName,
          hours: tasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0),
          estimatedHours: tasks.reduce((sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 0),
        })
      );

      return {
        client,
        sprints: sprintsData,
        totalHours: sprintsData.reduce((sum, s) => sum + s.hours, 0),
      };
    }
  );

  return {
    backlogTasks: backlogTasks.length,
    backlogHours: backlogTasks.reduce((sum, t) => sum + t.estimativa, 0),
    backlogByFeature: calculateBacklogAnalysisByFeature(backlogTasks),
    backlogByClient: calculateBacklogAnalysisByClient(backlogTasks),
    sprintDistribution,
    developerAllocation,
    clientAllocation,
    byFeature: calculateProblemAnalysisByFeature(tasksWithSprint),
    byClient: calculateProblemAnalysisByClient(tasksWithSprint),
  };
}

// Calculate risk alerts
export function calculateRiskAlerts(
  tasks: TaskItem[],
  sprintName: string
): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const sprintTasks = tasks.filter((t) => t.sprint === sprintName);

  // Tasks with high time variance
  // IMPORTANT: Time spent is ALWAYS from worklog (tempoGastoNoSprint)
  for (const task of sprintTasks) {
    if (isCompletedStatus(task.status)) continue;
    
    // Use hybrid fields for current sprint analysis - ALWAYS from worklog
    const tempoGasto = task.tempoGastoNoSprint ?? 0;
    const estimativaRestante = task.estimativaRestante ?? task.estimativa;
    
    if (estimativaRestante > 0 && tempoGasto / estimativaRestante > 0.8) {
      alerts.push({
        type: 'overTime',
        severity: tempoGasto > estimativaRestante ? 'high' : 'medium',
        title: `${task.chave} - Tarefa próxima ou acima do tempo estimado`,
        description: `${task.chave}: ${tempoGasto.toFixed(1)}h gastas de ${estimativaRestante.toFixed(1)}h restantes`,
        taskOrDeveloper: `${task.chave} - ${task.resumo}`,
        relatedTask: task,
      });
    }

    // Tarefas sem estimativa (e que não sejam de auxílio/reunião/impedimento)
    if ((!task.estimativa || task.estimativa === 0) && !isNeutralTask(task) && !isAuxilioTask(task) && !isImpedimentoTrabalhoTask(task)) {
      alerts.push({
        type: 'missingEstimate',
        severity: 'medium',
        title: `${task.chave} - Tarefa sem estimativa`,
        description: `A tarefa "${task.chave} - ${task.resumo}" não tem estimativa de horas.`,
        taskOrDeveloper: `${task.chave} - ${task.resumo}`,
        relatedTask: task,
      });
    }
  }

  // Over-allocated developers
  const devMetrics = calculateDeveloperMetrics(sprintTasks);
  for (const dev of devMetrics) {
    if (dev.utilizationPercent > 100) {
      alerts.push({
        type: 'overAllocated',
        severity: 'high',
        title: 'Desenvolvedor com sobrecarga',
        description: `${dev.totalAllocatedHours.toFixed(1)}h alocadas (${dev.utilizationPercent}% de 40h)`,
        taskOrDeveloper: dev.name,
      });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

// Get all unique sprints from tasks
export function getAllSprints(tasks: TaskItem[]): string[] {
  const sprints = new Set<string>();
  
  for (const task of tasks) {
    if (task.sprint && task.sprint.trim() !== '') {
      sprints.add(task.sprint);
    }
  }
  
  return Array.from(sprints).sort();
}

// Calculate problem analysis by feature (bugs reais e dúvidas ocultas)
export function calculateProblemAnalysisByFeature(tasks: TaskItem[]): ProblemAnalysis[] {
  const featureMap = new Map<string, TaskItem[]>();

  // Agrupar tarefas por feature
  // Como features é um array, cada feature deve criar uma entrada separada
  // Uma tarefa com múltiplas features aparece em múltiplos grupos (correto!)
  for (const task of tasks) {
    const validFeatures = task.feature.filter(f => f && f.trim() !== '');
    if (validFeatures.length > 0) {
      for (const feature of validFeatures) {
        const key = feature.trim();
        if (!featureMap.has(key)) {
          featureMap.set(key, []);
        }
        featureMap.get(key)!.push(task);
      }
    } else {
      // Sem features válidas
      const key = '(Sem Feature)';
      if (!featureMap.has(key)) {
        featureMap.set(key, []);
      }
      featureMap.get(key)!.push(task);
    }
  }

  const analyses: ProblemAnalysis[] = [];
  
  for (const [feature, featureTasks] of featureMap.entries()) {
    // Separar bugs reais e dúvidas ocultas
    const realBugs = featureTasks.filter(
      (t) => t.tipo === 'Bug' && !isDuvidaOcultaTask(t)
    );
    const dubidasOcultas = featureTasks.filter(
      (t) => t.tipo === 'Bug' && isDuvidaOcultaTask(t)
    );
    const tarefas = featureTasks.filter(
      (t) => t.tipo === 'Tarefa'
    );
    
    // Calcular horas totais (usando tempoGastoTotal de todos os sprints)
    // This is cross-sprint analysis, so we need total hours across all sprints
    const totalHours = featureTasks.reduce(
      (sum, t) => sum + (t.tempoGastoTotal ?? 0),
      0
    );

    analyses.push({
      label: feature,
      totalTasks: featureTasks.length,
      totalTarefas: tarefas.length,
      realBugs: realBugs.length,
      dubidasOcultas: dubidasOcultas.length,
      totalHours,
    });
  }

  // Ordenar por quantidade de problemas (bugs reais + dúvidas ocultas)
  return analyses.sort((a, b) => {
    const aProblems = a.realBugs + a.dubidasOcultas;
    const bProblems = b.realBugs + b.dubidasOcultas;
    // Se a quantidade de problemas for igual, ordenar por total de tarefas
    if (aProblems === bProblems) {
      return b.totalTasks - a.totalTasks;
    }
    return bProblems - aProblems;
  });
}

// Calculate backlog analysis by feature
// IMPORTANT: Backlog tasks are NOT processed for hybrid metrics, so we use only estimativa
export function calculateBacklogAnalysisByFeature(backlogTasks: TaskItem[]): Totalizer[] {
  const featureMap = new Map<string, TaskItem[]>();

  // Agrupar tarefas de backlog por feature
  // Como features é um array, cada feature deve criar uma entrada separada
  // Uma tarefa com múltiplas features aparece em múltiplos grupos (correto!)
  for (const task of backlogTasks) {
    const validFeatures = task.feature.filter(f => f && f.trim() !== '');
    if (validFeatures.length > 0) {
      for (const feature of validFeatures) {
        const key = feature.trim();
        if (!featureMap.has(key)) {
          featureMap.set(key, []);
        }
        featureMap.get(key)!.push(task);
      }
    } else {
      // Sem features válidas
      const key = '(Sem Feature)';
      if (!featureMap.has(key)) {
        featureMap.set(key, []);
      }
      featureMap.get(key)!.push(task);
    }
  }

  const totalizers: Totalizer[] = [];

  // Helper function to calculate breakdown by type
  const calculateBreakdownByType = (taskList: TaskItem[]) => {
    const bugs = taskList.filter(t => t.tipo === 'Bug' && !isDuvidaOcultaTask(t));
    const duvidasOcultas = taskList.filter(t => t.tipo === 'Bug' && isDuvidaOcultaTask(t));
    const tarefas = taskList.filter(t => t.tipo !== 'Bug');
    
    return {
      bugs: bugs.length,
      duvidasOcultas: duvidasOcultas.length,
      tarefas: tarefas.length,
      bugsHours: bugs.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      duvidasOcultasHours: duvidasOcultas.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      tarefasHours: tarefas.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    };
  };

  for (const [feature, featureTasks] of featureMap.entries()) {
    // Backlog usa apenas estimativa (não tem tempo gasto processado)
    const breakdown = calculateBreakdownByType(featureTasks);
    totalizers.push({
      label: feature,
      count: featureTasks.length,
      hours: 0, // Backlog não tem horas trabalhadas
      estimatedHours: featureTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      byType: breakdown,
    });
  }

  // Ordenar por horas estimadas (demanda futura)
  return totalizers.sort((a, b) => b.estimatedHours - a.estimatedHours);
}

// Calculate backlog analysis by client
// IMPORTANT: Backlog tasks are NOT processed for hybrid metrics, so we use only estimativa
export function calculateBacklogAnalysisByClient(backlogTasks: TaskItem[]): Totalizer[] {
  const clientMap = new Map<string, TaskItem[]>();

  // Agrupar tarefas de backlog por cliente (categoria)
  // Como categorias é um array, cada categoria deve criar uma entrada separada
  // Uma tarefa com múltiplas categorias aparece em múltiplos grupos (correto!)
  for (const task of backlogTasks) {
    // Filtrar categorias vazias e criar entrada para cada categoria válida
    const validClients = task.categorias.filter(c => c && c.trim() !== '');
    const clients = validClients.length > 0 ? validClients : ['(Sem Cliente)'];
    
    for (const client of clients) {
      const key = client.trim();
      if (!clientMap.has(key)) {
        clientMap.set(key, []);
      }
      clientMap.get(key)!.push(task);
    }
  }

  const totalizers: Totalizer[] = [];

  // Helper function to calculate breakdown by type
  const calculateBreakdownByType = (taskList: TaskItem[]) => {
    const bugs = taskList.filter(t => t.tipo === 'Bug' && !isDuvidaOcultaTask(t));
    const duvidasOcultas = taskList.filter(t => t.tipo === 'Bug' && isDuvidaOcultaTask(t));
    const tarefas = taskList.filter(t => t.tipo !== 'Bug');
    
    return {
      bugs: bugs.length,
      duvidasOcultas: duvidasOcultas.length,
      tarefas: tarefas.length,
      bugsHours: bugs.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      duvidasOcultasHours: duvidasOcultas.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      tarefasHours: tarefas.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    };
  };

  for (const [client, clientTasks] of clientMap.entries()) {
    // Backlog usa apenas estimativa (não tem tempo gasto processado)
    const breakdown = calculateBreakdownByType(clientTasks);
    totalizers.push({
      label: client,
      count: clientTasks.length,
      hours: 0, // Backlog não tem horas trabalhadas
      estimatedHours: clientTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      byType: breakdown,
    });
  }

  // Ordenar por horas estimadas (demanda futura)
  return totalizers.sort((a, b) => b.estimatedHours - a.estimatedHours);
}

// =============================================================================
// BACKLOG ANALYTICS - Complete backlog analysis for sprint allocation
// =============================================================================

// Age analysis for backlog tasks
export interface BacklogAgeAnalysis {
  averageAgeDays: number; // Average age in days
  ageDistribution: {
    label: string; // Age range label
    count: number;
    estimatedHours: number;
    tasks: TaskItem[];
  }[];
  oldestTasks: TaskItem[]; // Top 10 oldest tasks
}

// Estimate analysis for backlog tasks
export interface BacklogEstimateAnalysis {
  tasksWithoutEstimate: {
    count: number;
    tasks: TaskItem[];
  };
  estimateDistribution: {
    label: string; // Estimate range label
    count: number;
    estimatedHours: number;
    tasks: TaskItem[];
  }[];
  averageEstimate: number;
  averageEstimateByType: {
    bugs: number;
    dubidasOcultas: number;
    folha: number;
    tarefas: number;
  };
}

// Risk analysis for backlog tasks
export interface BacklogRiskAnalysis {
  highRiskTasks: {
    task: TaskItem;
    riskScore: number; // 0-100, higher = more risk
    riskFactors: string[]; // List of risk factors
  }[];
  riskDistribution: {
    label: string; // Risk level (Baixo, Médio, Alto, Crítico)
    count: number;
    estimatedHours: number;
  }[];
}

export interface BacklogAnalytics {
  summary: {
    totalTasks: number;
    totalEstimatedHours: number;
    bugs: number;
    dubidasOcultas: number;
    folha: number;
    tarefas: number; // Inclui histórias, outros e qualquer coisa que não seja bug/dúvida oculta
  };
  byType: {
    bugs: Totalizer;
    dubidasOcultas: Totalizer;
    folha: Totalizer;
    tarefas: Totalizer; // Consolidado: histórias, outros e tudo que não é bug/dúvida oculta
  };
  byComplexity: Totalizer[];
  byFeature: Totalizer[];
  byClient: Totalizer[];
  byModule: Totalizer[]; // NEW: Analysis by module
  byStatus: Totalizer[];
  byResponsible: Totalizer[]; // NEW: Analysis by responsible
  ageAnalysis: BacklogAgeAnalysis; // NEW: Temporal/age analysis
  estimateAnalysis: BacklogEstimateAnalysis; // NEW: Estimate analysis
  riskAnalysis: BacklogRiskAnalysis; // NEW: Risk analysis
  tasks: TaskItem[]; // All backlog tasks
}

/**
 * Helper to create totalizer for backlog (uses only estimativa)
 */
function createBacklogTotalizer(label: string, tasks: TaskItem[]): Totalizer {
  return {
    label,
    count: tasks.length,
    hours: 0, // Backlog não tem horas trabalhadas
    estimatedHours: tasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
  };
}

/**
 * Calculate age in days from creation date to today
 */
function calculateTaskAgeDays(task: TaskItem): number | null {
  if (!task.criado || isNaN(task.criado.getTime())) {
    return null; // Invalid or missing date
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const createdDate = new Date(task.criado);
  createdDate.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // Ensure non-negative
}

/**
 * Calculate backlog age analysis
 */
function calculateBacklogAgeAnalysis(tasks: TaskItem[]): BacklogAgeAnalysis {
  const tasksWithAge = tasks
    .map(task => ({ task, ageDays: calculateTaskAgeDays(task) }))
    .filter(item => item.ageDays !== null) as { task: TaskItem; ageDays: number }[];

  // Calculate average age
  const averageAgeDays = tasksWithAge.length > 0
    ? tasksWithAge.reduce((sum, item) => sum + item.ageDays, 0) / tasksWithAge.length
    : 0;

  // Age distribution: 0-7, 8-30, 31-90, 90+
  const ageRanges = [
    { label: '0-7 dias', min: 0, max: 7 },
    { label: '8-30 dias', min: 8, max: 30 },
    { label: '31-90 dias', min: 31, max: 90 },
    { label: '90+ dias', min: 91, max: Infinity },
  ];

  const ageDistribution = ageRanges.map(range => {
    const tasksInRange = tasksWithAge.filter(
      item => item.ageDays >= range.min && item.ageDays <= range.max
    );
    return {
      label: range.label,
      count: tasksInRange.length,
      estimatedHours: tasksInRange.reduce((sum, item) => sum + (item.task.estimativa || 0), 0),
      tasks: tasksInRange.map(item => item.task),
    };
  });

  // Oldest tasks (top 10)
  const oldestTasks = tasksWithAge
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 10)
    .map(item => item.task);

  return {
    averageAgeDays: Math.round(averageAgeDays * 10) / 10, // Round to 1 decimal
    ageDistribution,
    oldestTasks,
  };
}

/**
 * Calculate backlog estimate analysis
 */
function calculateBacklogEstimateAnalysis(
  tasks: TaskItem[],
  bugs: TaskItem[],
  dubidasOcultas: TaskItem[],
  folha: TaskItem[],
  tarefas: TaskItem[]
): BacklogEstimateAnalysis {
  // Tasks without estimate
  const tasksWithoutEstimate = tasks.filter(t => !t.estimativa || t.estimativa === 0);

  // Estimate distribution: 0-2h, 2-4h, 4-8h, 8-16h, 16h+
  const estimateRanges = [
    { label: '0-2h', min: 0, max: 2 },
    { label: '2-4h', min: 2, max: 4 },
    { label: '4-8h', min: 4, max: 8 },
    { label: '8-16h', min: 8, max: 16 },
    { label: '16h+', min: 16, max: Infinity },
  ];

  const estimateDistribution = estimateRanges.map(range => {
    const tasksInRange = tasks.filter(
      t => t.estimativa && t.estimativa > range.min && t.estimativa <= range.max
    );
    return {
      label: range.label,
      count: tasksInRange.length,
      estimatedHours: tasksInRange.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      tasks: tasksInRange,
    };
  });

  // Average estimate
  const tasksWithEstimate = tasks.filter(t => t.estimativa && t.estimativa > 0);
  const averageEstimate = tasksWithEstimate.length > 0
    ? tasksWithEstimate.reduce((sum, t) => sum + (t.estimativa || 0), 0) / tasksWithEstimate.length
    : 0;

  // Average estimate by type
  const calculateAverage = (taskList: TaskItem[]) => {
    const withEstimate = taskList.filter(t => t.estimativa && t.estimativa > 0);
    return withEstimate.length > 0
      ? withEstimate.reduce((sum, t) => sum + (t.estimativa || 0), 0) / withEstimate.length
      : 0;
  };

  return {
    tasksWithoutEstimate: {
      count: tasksWithoutEstimate.length,
      tasks: tasksWithoutEstimate,
    },
    estimateDistribution,
    averageEstimate: Math.round(averageEstimate * 10) / 10,
    averageEstimateByType: {
      bugs: Math.round(calculateAverage(bugs) * 10) / 10,
      dubidasOcultas: Math.round(calculateAverage(dubidasOcultas) * 10) / 10,
      folha: Math.round(calculateAverage(folha) * 10) / 10,
      tarefas: Math.round(calculateAverage(tarefas) * 10) / 10,
    },
  };
}

/**
 * Calculate backlog risk analysis
 * Risk factors:
 * - Old age (>30 days): +30 points
 * - Very old age (>90 days): +50 points
 * - No estimate: +20 points
 * - High complexity (4-5): +20 points
 * - Very high complexity (5): +30 points
 * - Real bug (vs dúvida oculta): +10 points
 */
function calculateBacklogRiskAnalysis(
  tasks: TaskItem[],
  bugs: TaskItem[]
): BacklogRiskAnalysis {
  const calculateRiskScore = (task: TaskItem): { score: number; factors: string[] } => {
    let score = 0;
    const factors: string[] = [];

    // Age risk
    const ageDays = calculateTaskAgeDays(task);
    if (ageDays !== null) {
      if (ageDays > 90) {
        score += 50;
        factors.push(`Muito antiga (${ageDays} dias)`);
      } else if (ageDays > 30) {
        score += 30;
        factors.push(`Antiga (${ageDays} dias)`);
      }
    }

    // Estimate risk
    if (!task.estimativa || task.estimativa === 0) {
      score += 20;
      factors.push('Sem estimativa');
    }

    // Complexity risk
    const complexity = task.complexidade || 1;
    if (complexity === 5) {
      score += 30;
      factors.push('Complexidade muito alta (5)');
    } else if (complexity >= 4) {
      score += 20;
      factors.push(`Complexidade alta (${complexity})`);
    }

    // Bug risk (real bugs are more urgent than dúvidas ocultas)
    if (task.tipo === 'Bug' && !isDuvidaOcultaTask(task)) {
      score += 10;
      factors.push('Bug real');
    }

    return { score: Math.min(100, score), factors };
  };

  // Calculate risk for all tasks
  const tasksWithRisk = tasks.map(task => {
    const { score, factors } = calculateRiskScore(task);
    return { task, riskScore: score, riskFactors: factors };
  });

  // High risk tasks (score >= 40)
  const highRiskTasks = tasksWithRisk
    .filter(item => item.riskScore >= 40)
    .sort((a, b) => b.riskScore - a.riskScore);

  // Risk distribution
  const riskLevels = [
    { label: 'Baixo', min: 0, max: 19 },
    { label: 'Médio', min: 20, max: 39 },
    { label: 'Alto', min: 40, max: 69 },
    { label: 'Crítico', min: 70, max: 100 },
  ];

  const riskDistribution = riskLevels.map(level => {
    const tasksInLevel = tasksWithRisk.filter(
      item => item.riskScore >= level.min && item.riskScore <= level.max
    );
    return {
      label: level.label,
      count: tasksInLevel.length,
      estimatedHours: tasksInLevel.reduce((sum, item) => sum + (item.task.estimativa || 0), 0),
    };
  });

  return {
    highRiskTasks,
    riskDistribution,
  };
}

/**
 * Calculate complete backlog analytics for sprint allocation planning
 * IMPORTANT: Backlog tasks are NOT processed for hybrid metrics
 */
export function calculateBacklogAnalytics(tasks: TaskItem[]): BacklogAnalytics {
  // Filter only backlog tasks (without sprint)
  const backlogTasks = tasks.filter((t) => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
  // Exclude neutral (meeting/training) and auxilio tasks from backlog analysis
  const backlogFiltered = backlogTasks.filter((t) => !isNeutralTask(t) && !isAuxilioTask(t));

  // Summary
  const isFolha = (t: TaskItem) => t.modulo === 'DSFolha' || (t.feature || []).includes('DSFolha');
  const folhaTasks = backlogFiltered.filter((t) => isFolha(t)); // Folha é um TIPO independente (tarefa ou bug)
  const bugs = backlogFiltered.filter((t) => t.tipo === 'Bug' && !isDuvidaOcultaTask(t) && !isFolha(t));
  const dubidasOcultas = backlogFiltered.filter((t) => t.tipo === 'Bug' && isDuvidaOcultaTask(t) && !isFolha(t));
  // Tarefas: tudo que não é bug ou dúvida oculta (inclui Tarefa, História, Outro, etc.)
  const tarefas = backlogFiltered.filter(
    (t) => !(t.tipo === 'Bug' && !isDuvidaOcultaTask(t) && !isFolha(t)) && 
           !(t.tipo === 'Bug' && isDuvidaOcultaTask(t)) &&
           !isFolha(t)
  );

  const summary = {
    totalTasks: backlogFiltered.length,
    totalEstimatedHours: backlogFiltered.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    bugs: bugs.length,
    dubidasOcultas: dubidasOcultas.length,
    folha: folhaTasks.length,
    tarefas: tarefas.length,
  };

  // By Type - 4 tipos: Bugs Reais, Dúvidas Ocultas, Folha e Tarefas
  const byType = {
    bugs: createBacklogTotalizer('Bugs Reais', bugs),
    dubidasOcultas: createBacklogTotalizer('Dúvidas Ocultas', dubidasOcultas),
    folha: createBacklogTotalizer('Folha', folhaTasks),
    tarefas: createBacklogTotalizer('Tarefas', tarefas),
  };

  // By Complexity
  const complexityMap = new Map<number, TaskItem[]>();
  backlogFiltered.forEach((task) => {
    const complexity = task.complexidade || 1;
    if (!complexityMap.has(complexity)) {
      complexityMap.set(complexity, []);
    }
    complexityMap.get(complexity)!.push(task);
  });

  const byComplexity: Totalizer[] = [];
  for (let level = 1; level <= 5; level++) {
    const tasksAtLevel = complexityMap.get(level) || [];
    byComplexity.push(createBacklogTotalizer(`Complexidade ${level}`, tasksAtLevel));
  }

  // By Feature
  const byFeature = calculateBacklogAnalysisByFeature(backlogFiltered);

  // By Client
  const byClient = calculateBacklogAnalysisByClient(backlogFiltered);

  // By Module
  const moduleMap = new Map<string, TaskItem[]>();
  backlogFiltered.forEach((task) => {
    const module = task.modulo || '(Sem Módulo)';
    if (!moduleMap.has(module)) {
      moduleMap.set(module, []);
    }
    moduleMap.get(module)!.push(task);
  });

  const byModule: Totalizer[] = [];
  moduleMap.forEach((tasks, module) => {
    byModule.push(createBacklogTotalizer(module, tasks));
  });
  byModule.sort((a, b) => b.estimatedHours - a.estimatedHours);

  // By Responsible
  const responsibleMap = new Map<string, TaskItem[]>();
  backlogFiltered.forEach((task) => {
    const responsible = task.responsavel || '(Sem Responsável)';
    if (!responsibleMap.has(responsible)) {
      responsibleMap.set(responsible, []);
    }
    responsibleMap.get(responsible)!.push(task);
  });

  const byResponsible: Totalizer[] = [];
  responsibleMap.forEach((tasks, responsible) => {
    byResponsible.push(createBacklogTotalizer(responsible, tasks));
  });
  byResponsible.sort((a, b) => b.estimatedHours - a.estimatedHours);

  // By Status
  const statusMap = new Map<string, TaskItem[]>();
  backlogFiltered.forEach((task) => {
    const status = task.status || '(Sem Status)';
    if (!statusMap.has(status)) {
      statusMap.set(status, []);
    }
    statusMap.get(status)!.push(task);
  });

  const byStatus: Totalizer[] = [];
  statusMap.forEach((tasks, status) => {
    byStatus.push(createBacklogTotalizer(status, tasks));
  });
  byStatus.sort((a, b) => b.count - a.count);

  // NEW: Age Analysis
  const ageAnalysis = calculateBacklogAgeAnalysis(backlogFiltered);

  // NEW: Estimate Analysis
  const estimateAnalysis = calculateBacklogEstimateAnalysis(
    backlogFiltered,
    bugs,
    dubidasOcultas,
    folhaTasks,
    tarefas
  );

  // NEW: Risk Analysis
  const riskAnalysis = calculateBacklogRiskAnalysis(backlogFiltered, bugs);

  return {
    summary,
    byType,
    byComplexity,
    byFeature,
    byClient,
    byModule,
    byStatus,
    byResponsible,
    ageAnalysis,
    estimateAnalysis,
    riskAnalysis,
    tasks: backlogFiltered,
  };
}

// Calculate problem analysis by client (bugs reais e dúvidas ocultas)
export function calculateProblemAnalysisByClient(tasks: TaskItem[]): ProblemAnalysis[] {
  const clientMap = new Map<string, TaskItem[]>();

  // Agrupar tarefas por cliente (categoria)
  // Como categorias é um array, cada categoria deve criar uma entrada separada
  // Uma tarefa com múltiplas categorias aparece em múltiplos grupos (correto!)
  for (const task of tasks) {
    // Filtrar categorias vazias e criar entrada para cada categoria válida
    const validClients = task.categorias.filter(c => c && c.trim() !== '');
    const clients = validClients.length > 0 ? validClients : ['(Sem Cliente)'];
    
    for (const client of clients) {
      const key = client.trim();
      if (!clientMap.has(key)) {
        clientMap.set(key, []);
      }
      clientMap.get(key)!.push(task);
    }
  }

  const analyses: ProblemAnalysis[] = [];
  
  for (const [client, clientTasks] of clientMap.entries()) {
    // Separar bugs reais e dúvidas ocultas
    const realBugs = clientTasks.filter(
      (t) => t.tipo === 'Bug' && !isDuvidaOcultaTask(t)
    );
    const dubidasOcultas = clientTasks.filter(
      (t) => t.tipo === 'Bug' && isDuvidaOcultaTask(t)
    );
    const tarefas = clientTasks.filter(
      (t) => t.tipo === 'Tarefa'
    );
    
    // Calcular horas totais (usando tempoGastoTotal de todos os sprints)
    // This is cross-sprint analysis, so we need total hours across all sprints
    const totalHours = clientTasks.reduce(
      (sum, t) => sum + (t.tempoGastoTotal ?? 0),
      0
    );

    analyses.push({
      label: client,
      totalTasks: clientTasks.length,
      totalTarefas: tarefas.length,
      realBugs: realBugs.length,
      dubidasOcultas: dubidasOcultas.length,
      totalHours,
    });
  }

  return analyses.sort((a, b) => b.totalTasks - a.totalTasks);
}

// =============================================================================
// BACKLOG FLOW (Inflow/Outflow) BY SPRINT + CAPACITY RECOMMENDATION
// =============================================================================

export interface BacklogFlowSprintItem {
  sprintName: string;
  inflow: number; // tasks created within sprint period and assigned to this sprint
  inflowTasks: TaskItem[]; // actual tasks for inflow
  inflowHours: number; // sum of estimated hours for inflow tasks
  // Breakdown by type for inflow
  inflowByType: {
    bugs: number;
    duvidasOcultas: number;
    tarefas: number;
    bugsHours: number;
    duvidasOcultasHours: number;
    tarefasHours: number;
  };
  legacyInflow: number; // tasks without sprint that have no creation date or were created before first sprint (only in first sprint)
  outflow: number; // completed tasks allocated to the sprint period
  outflowTasks: TaskItem[]; // actual tasks for outflow
  outflowHours: number; // sum of estimated hours for outflow tasks
  // Breakdown by type for outflow
  outflowByType: {
    bugs: number;
    duvidasOcultas: number;
    tarefas: number;
    bugsHours: number;
    duvidasOcultasHours: number;
    tarefasHours: number;
  };
  netFlow: number; // outflow - inflow
  netFlowHours: number; // outflowHours - inflowHours
  exitRatio: number; // outflow / inflow (0 if inflow = 0; Infinity if inflow=0 and outflow>0)
  exitRatioHours: number; // outflowHours / inflowHours (0 if inflowHours = 0; Infinity if inflowHours=0 and outflowHours>0)
  carriedIn: number; // tasks in this sprint created before sprint start
  carriedInTasks: TaskItem[]; // actual tasks for carried-in
  backlogAtStart: number; // backlog size (tasks without sprint) existing before sprint start
}

export interface BacklogFlowAnalytics {
  legacyInflow: {
    tasks: number;
    estimatedHours: number;
    taskList: TaskItem[]; // actual tasks for legacy inflow
    byType: {
      bugs: number;
      duvidasOcultas: number;
      tarefas: number;
      bugsHours: number;
      duvidasOcultasHours: number;
      tarefasHours: number;
    };
  } | null; // Tasks without sprint that have no creation date or were created before first sprint (shown as "Anterior" column before first sprint)
  series: BacklogFlowSprintItem[];
  completedWithoutSprint: {
    tasks: number;
    estimatedHours: number;
    taskList: TaskItem[]; // actual tasks completed without sprint
  } | null; // Tasks without sprint that are completed (shown as special column in chart)
  averages: {
    avgInflow: number;
    avgOutflow: number;
    avgNetFlow: number;
    avgExitRatio: number;
    avgInflowHours: number;
    avgOutflowHours: number;
    avgNetFlowHours: number;
    avgExitRatioHours: number;
    // Breakdown by type for averages
    avgInflowByType: {
      bugs: number;
      duvidasOcultas: number;
      tarefas: number;
      bugsHours: number;
      duvidasOcultasHours: number;
      tarefasHours: number;
    };
    avgOutflowByType: {
      bugs: number;
      duvidasOcultas: number;
      tarefas: number;
      bugsHours: number;
      duvidasOcultasHours: number;
      tarefasHours: number;
    };
  };
  currentBacklog: {
    tasks: number;
    estimatedHours: number;
  };
  allocation: {
    currentSprint: {
      tasks: number;
      estimatedHours: number;
    };
    futureSprints: {
      tasks: number;
      estimatedHours: number;
    };
    totalAllocated: {
      tasks: number;
      estimatedHours: number;
    };
  };
}

/**
 * Calculate inflow/outflow per period and backlog size evolution using sprint metadata windows.
 * - inflow: ALL tasks created within [startDate,endDate] (independent of sprint assignment)
 * - outflow: Completed tasks allocated to the sprint period (t.sprint === sprint)
 *   If a task is completed and allocated to the sprint, it counts as an outflow for that period
 *   This aligns with Sprint Ativo metrics and doesn't require worklog verification
 * - carriedIn: tasks with sprint == sprintName and criado < startDate
 * - backlogAtStart: count of tasks without sprint created strictly before startDate
 */
export function calculateBacklogFlowBySprint(
  tasks: TaskItem[],
  sprintMetadata: SprintMetadata[],
  _worklogs: WorklogEntry[] = [] // Not used for outflow calculation anymore, kept for API compatibility
): BacklogFlowAnalytics {
  // Incluir todas as tarefas na análise de fluxo (reunião, auxílio e treinamento também contam)
  // Separate tasks for reference
  const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
  const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));

  // Order sprints by start date
  const ordered = [...sprintMetadata].sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime());

  // Find first sprint start date
  const firstSprintStart = ordered.length > 0 ? ordered[0].dataInicio : null;

  // Helper function to calculate breakdown by type
  const calculateBreakdownByType = (taskList: TaskItem[]) => {
    const bugs = taskList.filter(t => t.tipo === 'Bug' && !isDuvidaOcultaTask(t));
    const duvidasOcultas = taskList.filter(t => t.tipo === 'Bug' && isDuvidaOcultaTask(t));
    // Tarefas = all tasks that are NOT bugs (dúvidas ocultas are bugs but counted separately)
    const tarefas = taskList.filter(t => t.tipo !== 'Bug');
    
    return {
      bugs: bugs.length,
      duvidasOcultas: duvidasOcultas.length,
      tarefas: tarefas.length,
      bugsHours: bugs.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      duvidasOcultasHours: duvidasOcultas.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      tarefasHours: tarefas.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    };
  };

  // Calculate legacy inflow (tasks without sprint that have no creation date OR were created before first period)
  // This will be shown as a separate "Anterior" column before the first period
  const legacyTasks = firstSprintStart
    ? backlogTasks.filter(t =>
        !t.criado || // no creation date
        isNaN(t.criado.getTime()) || // invalid date
        compareDateOnly(t.criado, firstSprintStart) < 0 // created before first period (date only)
      )
    : [];
  const legacyInflow = legacyTasks.length > 0 ? {
    tasks: legacyTasks.length,
    estimatedHours: legacyTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    taskList: legacyTasks,
    byType: calculateBreakdownByType(legacyTasks),
  } : null;

  const series: BacklogFlowSprintItem[] = ordered.map((meta) => {
    const { sprint, dataInicio, dataFim } = meta;

    // INFLOW: ALL tasks created within [start, end] period (independent of status or sprint assignment)
    // Entradas são baseadas APENAS na data de criação da tarefa (sem considerar horário)
    // IMPORTANTE: Inclui TODAS as tarefas criadas no período, mesmo que associadas a sprints futuros
    const inflowTasks = tasks.filter(t =>
      t.criado &&
      !isNaN(t.criado.getTime()) &&
      isDateInPeriod(t.criado, dataInicio, dataFim)
    );
    const inflow = inflowTasks.length;
    const inflowHours = inflowTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0);
    const inflowByType = calculateBreakdownByType(inflowTasks);

    // carried-in (optional diagnostic): tasks that belong to this sprint and were created BEFORE period start
    const carriedInTasks = tasksWithSprint.filter(t =>
      t.sprint === sprint &&
      t.criado &&
      !isNaN(t.criado.getTime()) &&
      compareDateOnly(t.criado, dataInicio) < 0
    );
    const carriedIn = carriedInTasks.length;

    // OUTFLOW: Tarefas concluídas alocadas ao sprint do período
    // Saídas são baseadas em tarefas concluídas que:
    // 1. Estão com status concluído
    // 2. Estão alocadas ao sprint do período (t.sprint === sprint)
    // 3. Não são backlog
    // Se está concluída e no sprint, conta como saída do período (independente de worklog)
    const outflowTasks = tasks.filter(t => {
      // Apenas tarefas concluídas
      if (!isCompletedStatus(t.status)) return false;
      
      // Apenas tarefas vinculadas ao sprint do período
      if (!t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint)) return false;
      if (t.sprint !== sprint) return false;
      
      return true;
    });
    const outflow = outflowTasks.length;
    const outflowHours = outflowTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0);
    const outflowByType = calculateBreakdownByType(outflowTasks);

    // backlog at start: backlog tasks created before period start (excluding legacy)
    const backlogAtStart = backlogTasks.filter(t =>
      t.criado && !isNaN(t.criado.getTime()) && compareDateOnly(t.criado, dataInicio) < 0
    ).length;

    // Exit ratio and net flow
    const exitRatio = inflow > 0 ? outflow / inflow : (outflow > 0 ? Infinity : 0);
    const netFlow = outflow - inflow;
    const netFlowHours = outflowHours - inflowHours;
    const exitRatioHours = inflowHours > 0 ? outflowHours / inflowHours : (outflowHours > 0 ? Infinity : 0);

    return {
      sprintName: sprint,
      inflow,
      inflowTasks,
      inflowHours,
      inflowByType,
      legacyInflow: 0, // No longer used in sprint items, kept for type compatibility
      outflow,
      outflowTasks,
      outflowHours,
      outflowByType,
      netFlow,
      netFlowHours,
      exitRatio,
      exitRatioHours,
      carriedIn,
      carriedInTasks,
      backlogAtStart,
    };
  });

  // Calculate completed tasks without sprint (for flow analysis - shown as special column)
  const completedBacklogTasks = backlogTasks.filter(t => isCompletedStatus(t.status));
  const completedWithoutSprint = completedBacklogTasks.length > 0 ? {
    tasks: completedBacklogTasks.length,
    estimatedHours: completedBacklogTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    taskList: completedBacklogTasks,
  } : null;

  // Calcular médias apenas com sprints COMPLETAMENTE FINALIZADOS (data de fim no passado)
  // Excluindo sprint atual para evitar distorções no início do sprint
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const completedSprints = series.filter(sprintItem => {
    const sprintMeta = sprintMetadata.find(m => m.sprint === sprintItem.sprintName);
    if (!sprintMeta) return false;
    
    const sprintEnd = new Date(sprintMeta.dataFim);
    sprintEnd.setHours(23, 59, 59, 999);
    
    // Apenas sprints passados: data de fim já passou
    return sprintEnd.getTime() < now.getTime();
  });

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
  const averages = {
    avgInflow: avg(completedSprints.map(s => s.inflow)),
    avgOutflow: avg(completedSprints.map(s => s.outflow)),
    avgNetFlow: avg(completedSprints.map(s => s.netFlow)),
    avgExitRatio: avg(completedSprints.map(s => (Number.isFinite(s.exitRatio) ? s.exitRatio : 0))),
    avgInflowHours: avg(completedSprints.map(s => s.inflowHours)),
    avgOutflowHours: avg(completedSprints.map(s => s.outflowHours)),
    avgNetFlowHours: avg(completedSprints.map(s => s.netFlowHours)),
    avgExitRatioHours: avg(completedSprints.map(s => (Number.isFinite(s.exitRatioHours) ? s.exitRatioHours : 0))),
    avgInflowByType: {
      bugs: avg(completedSprints.map(s => s.inflowByType.bugs)),
      duvidasOcultas: avg(completedSprints.map(s => s.inflowByType.duvidasOcultas)),
      tarefas: avg(completedSprints.map(s => s.inflowByType.tarefas)),
      bugsHours: avg(completedSprints.map(s => s.inflowByType.bugsHours)),
      duvidasOcultasHours: avg(completedSprints.map(s => s.inflowByType.duvidasOcultasHours)),
      tarefasHours: avg(completedSprints.map(s => s.inflowByType.tarefasHours)),
    },
    avgOutflowByType: {
      bugs: avg(completedSprints.map(s => s.outflowByType.bugs)),
      duvidasOcultas: avg(completedSprints.map(s => s.outflowByType.duvidasOcultas)),
      tarefas: avg(completedSprints.map(s => s.outflowByType.tarefas)),
      bugsHours: avg(completedSprints.map(s => s.outflowByType.bugsHours)),
      duvidasOcultasHours: avg(completedSprints.map(s => s.outflowByType.duvidasOcultasHours)),
      tarefasHours: avg(completedSprints.map(s => s.outflowByType.tarefasHours)),
    },
  };

  // Current backlog: APENAS tarefas sem sprint (backlog tradicional) que não estão concluídas
  // Tarefas alocadas a sprints (atuais ou futuros) NÃO devem entrar no backlog atual
  // Elas são contabilizadas separadamente no card "Alocado em Sprints"
  const pendingBacklogTasks = backlogTasks.filter(t => !isCompletedStatus(t.status));
  
  const currentBacklog = {
    tasks: pendingBacklogTasks.length,
    estimatedHours: pendingBacklogTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
  };

  // Calcular alocação em sprints
  // Sprint atual: sprint que está em andamento (data atual está entre início e fim)
  const currentSprintTasks = tasksWithSprint.filter(t => {
    if (isCompletedStatus(t.status)) return false; // Excluir concluídas
    
    const sprintMeta = sprintMetadata.find(m => m.sprint === t.sprint);
    if (!sprintMeta) return false;
    
    const sprintStart = new Date(sprintMeta.dataInicio);
    sprintStart.setHours(0, 0, 0, 0);
    const sprintEnd = new Date(sprintMeta.dataFim);
    sprintEnd.setHours(23, 59, 59, 999);
    
    // Sprint atual: hoje está entre início e fim
    return now.getTime() >= sprintStart.getTime() && now.getTime() <= sprintEnd.getTime();
  });

  // Tarefas alocadas a sprints futuros (que ainda não começaram)
  const futureSprintTasks = tasksWithSprint.filter(t => {
    if (isCompletedStatus(t.status)) return false; // Excluir concluídas
    
    const sprintMeta = sprintMetadata.find(m => m.sprint === t.sprint);
    if (!sprintMeta) return false;
    
    // Sprint futuro: data de início ainda não chegou
    const sprintStart = new Date(sprintMeta.dataInicio);
    sprintStart.setHours(0, 0, 0, 0);
    
    return sprintStart.getTime() > now.getTime();
  });

  const allocation = {
    currentSprint: {
      tasks: currentSprintTasks.length,
      estimatedHours: currentSprintTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    },
    futureSprints: {
      tasks: futureSprintTasks.length,
      estimatedHours: futureSprintTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    },
    totalAllocated: {
      tasks: tasksWithSprint.filter(t => !isCompletedStatus(t.status)).length,
      estimatedHours: tasksWithSprint.filter(t => !isCompletedStatus(t.status)).reduce((sum, t) => sum + (t.estimativa || 0), 0),
    },
  };

  return { legacyInflow, series, completedWithoutSprint, averages, currentBacklog, allocation };
}

export interface SprintThroughputData {
  sprintName: string;
  throughputPerDev: number;
  completedTasks: number;
  devCount: number;
  dateInicio: Date;
  dateFim: Date;
}

export interface CapacityRecommendation {
  suggestedDevsP50: number; // Additional devs needed (P50)
  suggestedDevsP80: number; // Additional devs needed (P80)
  throughputPerDevP50: number;
  throughputPerDevP80: number;
  avgInflow: number;
  avgCurrentDevs: number; // Average current devs in recent sprints
  totalDevsNeededP50: number; // Total devs needed (P50)
  totalDevsNeededP80: number; // Total devs needed (P80)
  sprintData: SprintThroughputData[]; // Throughput data per sprint
}

/**
 * Recommend number of developers to stabilize the system based on historical throughput per dev.
 * - Throughput per dev per sprint = count(completed tasks in sprint) / unique devs with completed tasks in sprint
 * - Use percentiles (P50/P80) across sprints for conservative/aggressive scenarios
 * - suggestedDevs ≈ ceil(avgInflow / theta)
 * @param selectedDevs Optional set of developer names to include in the analysis. If provided, only these devs will be considered.
 */
export function calculateCapacityRecommendation(
  tasks: TaskItem[],
  sprintMetadata: SprintMetadata[],
  selectedDevs?: Set<string> | null
): CapacityRecommendation {
  if (!sprintMetadata || sprintMetadata.length === 0) {
    return {
      suggestedDevsP50: 0,
      suggestedDevsP80: 0,
      throughputPerDevP50: 0,
      throughputPerDevP80: 0,
      avgInflow: 0,
      avgCurrentDevs: selectedDevs && selectedDevs.size > 0 ? selectedDevs.size : 0,
      totalDevsNeededP50: 0,
      totalDevsNeededP80: 0,
      sprintData: [],
    };
  }

  // Incluir todas as tarefas na análise de capacidade (reunião, auxílio e treinamento também contam)

  // Compute inflow per sprint
  const flow = calculateBacklogFlowBySprint(tasks, sprintMetadata);
  const avgInflow = flow.averages.avgInflow;

  // For each sprint, compute throughput per dev
  const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
  const ordered = [...sprintMetadata].sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime());
  const perSprintThroughputPerDev: number[] = [];
  const sprintData: SprintThroughputData[] = [];

  // Get current date to filter only completed sprints
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  for (const meta of ordered) {
    // Only process completed sprints (end date in the past)
    const sprintEndDate = new Date(meta.dataFim);
    sprintEndDate.setHours(23, 59, 59, 999);
    if (sprintEndDate.getTime() >= now.getTime()) {
      // Skip sprints that haven't ended yet
      continue;
    }

    const sprintTasks = tasksWithSprint.filter(t => t.sprint === meta.sprint);
    const completed = sprintTasks.filter(t => isCompletedStatus(t.status));
    
    // Filter by selected devs if provided
    const filteredCompleted = selectedDevs && selectedDevs.size > 0
      ? completed.filter(t => t.responsavel && selectedDevs.has(t.responsavel))
      : completed;
    
    const devs = new Set<string>(filteredCompleted.map(t => t.responsavel).filter(Boolean));
    const devCount = devs.size || 1; // avoid division by zero
    const completedCount = filteredCompleted.length;
    const throughput = completedCount / devCount;
    
    perSprintThroughputPerDev.push(throughput);
    
    // Store detailed sprint data
    sprintData.push({
      sprintName: meta.sprint,
      throughputPerDev: throughput,
      completedTasks: completedCount,
      devCount: devCount,
      dateInicio: meta.dataInicio,
      dateFim: meta.dataFim,
    });
  }

  const sorted = perSprintThroughputPerDev.slice().sort((a, b) => a - b);
  const percentile = (p: number) => {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil(p * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
  };

  const thetaP50 = percentile(0.5);
  const thetaP80 = percentile(0.8);

  // Calculate total devs needed
  const totalDevsNeededP50 = thetaP50 > 0 ? Math.ceil(avgInflow / thetaP50) : 0;
  const totalDevsNeededP80 = thetaP80 > 0 ? Math.ceil(avgInflow / thetaP80) : 0;

  // Calculate current devs: if devs are selected, use that count; otherwise, calculate from recent sprints
  let avgCurrentDevs: number;
  
  if (selectedDevs && selectedDevs.size > 0) {
    // User selected specific devs - use that as the current capacity
    avgCurrentDevs = selectedDevs.size;
  } else {
    // No devs selected - calculate average from recent completed sprints (last 3 sprints or all if less than 3)
    const completedSprints = ordered.filter(meta => {
      const sprintEndDate = new Date(meta.dataFim);
      sprintEndDate.setHours(23, 59, 59, 999);
      return sprintEndDate.getTime() < now.getTime();
    });
    const recentSprints = completedSprints.slice(-3);
    const currentDevCounts: number[] = [];
    for (const meta of recentSprints) {
      const sprintTasks = tasksWithSprint.filter(t => t.sprint === meta.sprint);
      const completed = sprintTasks.filter(t => isCompletedStatus(t.status));
      
      const devs = new Set<string>(completed.map(t => t.responsavel).filter(Boolean));
      currentDevCounts.push(devs.size || 0);
    }
    avgCurrentDevs = currentDevCounts.length > 0
      ? Math.round(currentDevCounts.reduce((sum, count) => sum + count, 0) / currentDevCounts.length)
      : 0;
  }

  // Calculate additional devs needed (total needed - current)
  const suggestedDevsP50 = Math.max(0, totalDevsNeededP50 - avgCurrentDevs);
  const suggestedDevsP80 = Math.max(0, totalDevsNeededP80 - avgCurrentDevs);

  return {
    suggestedDevsP50,
    suggestedDevsP80,
    throughputPerDevP50: thetaP50,
    throughputPerDevP80: thetaP80,
    avgInflow,
    avgCurrentDevs, // Add this for display
    totalDevsNeededP50, // Add this for display
    totalDevsNeededP80, // Add this for display
    sprintData, // Detailed data per sprint
  };
}

