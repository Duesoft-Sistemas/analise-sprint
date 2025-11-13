import {
  TaskItem,
  SprintAnalytics,
  DeveloperMetrics,
  Totalizer,
  CrossSprintAnalytics,
  RiskAlert,
  ProblemAnalysis,
} from '../types';
import {
  isCompletedStatus,
  calculateRiskLevel,
  calculatePercentage,
  normalizeForComparison,
  isNeutralTask,
  isAuxilioTask,
} from '../utils/calculations';
import { isBacklogSprintValue } from '../utils/calculations';

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

    // Tarefas sem estimativa (e que não sejam de auxílio/reunião)
    if ((!task.estimativa || task.estimativa === 0) && !isNeutralTask(task) && !isAuxilioTask(task)) {
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

  for (const [feature, featureTasks] of featureMap.entries()) {
    // Backlog usa apenas estimativa (não tem tempo gasto processado)
    totalizers.push({
      label: feature,
      count: featureTasks.length,
      hours: 0, // Backlog não tem horas trabalhadas
      estimatedHours: featureTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
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

  for (const [client, clientTasks] of clientMap.entries()) {
    // Backlog usa apenas estimativa (não tem tempo gasto processado)
    totalizers.push({
      label: client,
      count: clientTasks.length,
      hours: 0, // Backlog não tem horas trabalhadas
      estimatedHours: clientTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    });
  }

  // Ordenar por horas estimadas (demanda futura)
  return totalizers.sort((a, b) => b.estimatedHours - a.estimatedHours);
}

// =============================================================================
// BACKLOG ANALYTICS - Complete backlog analysis for sprint allocation
// =============================================================================

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
  byStatus: Totalizer[];
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

  return {
    summary,
    byType,
    byComplexity,
    byFeature,
    byClient,
    byStatus,
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

