import {
  TaskItem,
  TaskPerformanceMetrics,
  SprintPerformanceMetrics,
  AllSprintsPerformanceMetrics,
  DeveloperComparison,
  PerformanceInsight,
  PerformanceAnalytics,
  MetricExplanation,
} from '../types';
import { isCompletedStatus } from '../utils/calculations';

// =============================================================================
// METRIC EXPLANATIONS - Como cada métrica é calculada
// =============================================================================

export const METRIC_EXPLANATIONS: Record<string, MetricExplanation> = {
  estimationAccuracy: {
    formula: '((Tempo Estimado - Tempo Gasto) / Tempo Estimado) × 100',
    description: 'Mede o desvio percentual entre o tempo estimado e o tempo gasto',
    interpretation: 'Valores negativos = subestimou (gastou mais que estimado). Valores positivos = superestimou (gastou menos que estimado). Valor 0 = estimativa perfeita.',
    example: 'Estimou 10h, gastou 12h = -20% (subestimou em 20%)',
  },
  
  accuracyRate: {
    formula: '(Tarefas com desvio ≤ 20% / Total de Tarefas) × 100',
    description: 'Percentual de tarefas onde o tempo gasto ficou dentro de ±20% da estimativa',
    interpretation: 'Quanto maior, mais preciso o desenvolvedor é nas estimativas. Acima de 70% é considerado bom.',
    example: '8 de 10 tarefas ficaram dentro de ±20% = 80% de acurácia',
  },
  
  reworkRate: {
    formula: '(Tarefas com Retrabalho=Sim / Total de Tarefas) × 100',
    description: 'Percentual de tarefas que precisaram ser refeitas ou corrigidas',
    interpretation: 'Quanto menor, melhor a qualidade. Taxa alta pode indicar problemas de entendimento, testes insuficientes ou código técnico.',
    example: '2 de 10 tarefas foram retrabalho = 20% de retrabalho',
  },
  
  bugRate: {
    formula: '(Tarefas tipo Bug / Total de Tarefas) × 100',
    description: 'Percentual de tarefas que são correções de bugs',
    interpretation: 'Taxa alta pode indicar problemas de qualidade ou módulos legados. Compare com a média da equipe.',
    example: '3 bugs de 10 tarefas = 30% de bugs',
  },
  
  qualityScore: {
    formula: '100 - Taxa de Retrabalho',
    description: 'Score de qualidade baseado no inverso da taxa de retrabalho',
    interpretation: 'Quanto maior, melhor a qualidade. 80+ é excelente, 60-80 é bom, <60 precisa atenção.',
    example: '10% de retrabalho = 90 de quality score',
  },
  
  utilizationRate: {
    formula: '(Total de Horas Trabalhadas / 40h) × 100',
    description: 'Percentual de utilização da capacidade semanal (assumindo 40h)',
    interpretation: '>100% = sobrecarga, 80-100% = bem utilizado, <80% = pode receber mais tarefas',
    example: '36h trabalhadas / 40h = 90% de utilização',
  },
  
  completionRate: {
    formula: '(Tarefas Concluídas / Tarefas Iniciadas) × 100',
    description: 'Percentual de tarefas que foram finalizadas em relação às iniciadas',
    interpretation: 'Quanto maior, melhor. <80% pode indicar interrupções ou tarefas bloqueadas.',
    example: '8 concluídas de 10 iniciadas = 80% de conclusão',
  },
  
  consistencyScore: {
    formula: '100 - (Desvio Padrão das Estimativas / Média × 100)',
    description: 'Mede a consistência nas estimativas (inverso da variação)',
    interpretation: 'Quanto maior, mais consistente. Alta variação pode indicar dificuldade com certos tipos de tarefa.',
    example: 'Desvio padrão baixo = estimativas consistentes = score alto',
  },
  
  performanceScore: {
    formula: '(50% × Qualidade) + (30% × Utilização) + (20% × Conclusão)',
    description: 'Score geral ponderado combinando múltiplas métricas (apenas tarefas concluídas)',
    interpretation: '90+ = excelente, 75-90 = muito bom, 60-75 = bom, 45-60 = adequado, <45 = precisa melhorias',
    example: 'Qualidade 90, Utilização 85, Conclusão 100 = Score 90',
  },
  
  bugsVsFeatures: {
    formula: 'Número de Bugs / Número de Features (Tarefas + Histórias)',
    description: 'Razão entre trabalho corretivo (bugs) e trabalho novo (features)',
    interpretation: '<0.3 = ótimo, 0.3-0.5 = aceitável, >0.5 = muitos bugs em relação a features',
    example: '2 bugs e 8 features = 0.25 (para cada 4 features, 1 bug)',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Calculate standard deviation
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(val => Math.pow(val - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

// Determine trend from array of values (earlier to later)
function determineTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable';
  
  // Simple linear regression to determine slope
  const n = values.length;
  const xValues = values.map((_, i) => i);
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = values.reduce((sum, y) => sum + y, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (values[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  
  // Threshold for considering it stable
  const threshold = 0.5;
  
  if (slope > threshold) return 'improving';
  if (slope < -threshold) return 'declining';
  return 'stable';
}

// Normalize a score to 0-100 range
function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

// =============================================================================
// TASK-LEVEL METRICS
// =============================================================================

export function calculateTaskMetrics(task: TaskItem): TaskPerformanceMetrics {
  // Use hybrid fields: tempoGastoTotal for complete historical analysis
  const hoursSpent = task.tempoGastoTotal ?? task.tempoGasto;
  const hoursEstimated = task.estimativa;
  
  // Estimation accuracy: positive = overestimated, negative = underestimated
  let estimationAccuracy = 0;
  if (hoursEstimated > 0) {
    estimationAccuracy = ((hoursEstimated - hoursSpent) / hoursEstimated) * 100;
  }
  
  const isOnTime = hoursSpent <= hoursEstimated;
  
  return {
    task,
    estimationAccuracy,
    isOnTime,
    isRework: task.retrabalho,
    complexityScore: task.complexidade,
    hoursSpent,
    hoursEstimated,
  };
}

// =============================================================================
// SPRINT-LEVEL METRICS
// =============================================================================

export function calculateSprintPerformance(
  tasks: TaskItem[],
  developerId: string,
  developerName: string,
  sprintName: string
): SprintPerformanceMetrics {
  // Filter tasks for this developer and sprint
  const devTasks = tasks.filter(
    t => t.idResponsavel === developerId && t.sprint === sprintName
  );
  
  if (devTasks.length === 0) {
    // Return empty metrics
    return createEmptySprintMetrics(developerId, developerName, sprintName);
  }
  
  // Calculate task-level metrics
  const taskMetrics = devTasks.map(calculateTaskMetrics);
  
  // Separate completed and all tasks
  const completedTasks = devTasks.filter(t => isCompletedStatus(t.status));
  const completedMetrics = completedTasks.map(calculateTaskMetrics);
  
  // Productivity metrics - use tempoGastoTotal for complete historical analysis
  const totalHoursWorked = devTasks.reduce((sum, t) => sum + (t.tempoGastoTotal ?? t.tempoGasto), 0);
  const tasksCompleted = completedTasks.length;
  const tasksStarted = devTasks.length;
  const averageHoursPerTask = tasksCompleted > 0 
    ? completedTasks.reduce((sum, t) => sum + (t.tempoGastoTotal ?? t.tempoGasto), 0) / tasksCompleted 
    : 0;
  
  // Accuracy metrics (informative only - analyst responsibility)
  // Only consider completed tasks with estimates
  const completedWithEstimates = completedMetrics.filter(t => t.hoursEstimated > 0);
  let estimationAccuracy = 0;
  let accuracyRate = 0;
  
  if (completedWithEstimates.length > 0) {
    // Average deviation percentage
    const deviations = completedWithEstimates.map(t => t.estimationAccuracy);
    estimationAccuracy = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    
    // Tasks within ±20% of estimate
    const tasksWithinRange = completedWithEstimates.filter(
      t => Math.abs(t.estimationAccuracy) <= 20
    ).length;
    accuracyRate = (tasksWithinRange / completedWithEstimates.length) * 100;
  }
  
  const tendsToOverestimate = estimationAccuracy > 10;
  const tendsToUnderestimate = estimationAccuracy < -10;
  
  // Quality metrics - only consider completed tasks
  const reworkTasks = completedTasks.filter(t => t.retrabalho).length;
  const reworkRate = tasksCompleted > 0 ? (reworkTasks / tasksCompleted) * 100 : 0;
  
  const bugTasks = completedTasks.filter(t => t.tipo === 'Bug').length;
  const bugRate = tasksCompleted > 0 ? (bugTasks / tasksCompleted) * 100 : 0;
  
  const featureTasks = completedTasks.filter(t => t.tipo === 'Tarefa' || t.tipo === 'História').length;
  const bugsVsFeatures = featureTasks > 0 ? bugTasks / featureTasks : 0;
  
  const qualityScore = 100 - reworkRate;
  
  // Efficiency metrics
  const utilizationRate = (totalHoursWorked / 40) * 100;
  const completionRate = tasksStarted > 0 ? (tasksCompleted / tasksStarted) * 100 : 0;
  
  const avgTimeToComplete = tasksCompleted > 0
    ? completedTasks.reduce((sum, t) => sum + (t.tempoGastoTotal ?? t.tempoGasto), 0) / tasksCompleted
    : 0;
  
  // Consistency score (based on deviation of estimates for completed tasks)
  let consistencyScore = 50;
  if (completedWithEstimates.length > 1) {
    const deviations = completedWithEstimates.map(t => Math.abs(t.estimationAccuracy));
    const stdDev = calculateStdDev(deviations);
    const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    const coefficientOfVariation = avgDeviation > 0 ? (stdDev / avgDeviation) : 0;
    consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 50));
  }
  
  // Complexity metrics - use completed tasks for meaningful analysis
  const avgComplexity = tasksCompleted > 0
    ? completedTasks.reduce((sum, t) => sum + t.complexidade, 0) / tasksCompleted
    : 0;
  
  const complexityDistribution = [1, 2, 3, 4, 5].map(level => {
    const tasksAtLevel = completedMetrics.filter(t => t.complexityScore === level);
    const count = tasksAtLevel.length;
    const avgAccuracy = count > 0
      ? tasksAtLevel.reduce((sum, t) => sum + Math.abs(t.estimationAccuracy), 0) / count
      : 0;
    
    return { level, count, avgAccuracy };
  });
  
  const performanceByComplexity = [1, 2, 3, 4, 5].map(level => {
    const tasksAtLevel = completedMetrics.filter(t => t.complexityScore === level);
    const count = tasksAtLevel.length;
    const avgHours = count > 0
      ? tasksAtLevel.reduce((sum, t) => sum + t.hoursSpent, 0) / count
      : 0;
    const accuracy = count > 0
      ? tasksAtLevel.reduce((sum, t) => sum + t.estimationAccuracy, 0) / count
      : 0;
    
    return { level, avgHours, accuracy };
  });
  
  // Overall Performance Score
  // 50% quality, 30% utilization, 20% completion
  // Note: Accuracy is kept as informative metric only (analyst responsibility)
  const normalizedUtilization = Math.min(100, utilizationRate);
  
  const performanceScore = (
    (qualityScore * 0.5) +
    (normalizedUtilization * 0.3) +
    (completionRate * 0.2)
  );
  
  return {
    developerId,
    developerName,
    sprintName,
    totalHoursWorked,
    tasksCompleted,
    tasksStarted,
    averageHoursPerTask,
    estimationAccuracy,
    accuracyRate,
    tendsToOverestimate,
    tendsToUnderestimate,
    reworkRate,
    bugRate,
    bugsVsFeatures,
    qualityScore,
    utilizationRate,
    completionRate,
    avgTimeToComplete,
    consistencyScore,
    avgComplexity,
    complexityDistribution,
    performanceByComplexity,
    performanceScore,
    tasks: taskMetrics,
  };
}

function createEmptySprintMetrics(
  developerId: string,
  developerName: string,
  sprintName: string
): SprintPerformanceMetrics {
  return {
    developerId,
    developerName,
    sprintName,
    totalHoursWorked: 0,
    tasksCompleted: 0,
    tasksStarted: 0,
    averageHoursPerTask: 0,
    estimationAccuracy: 0,
    accuracyRate: 0,
    tendsToOverestimate: false,
    tendsToUnderestimate: false,
    reworkRate: 0,
    bugRate: 0,
    bugsVsFeatures: 0,
    qualityScore: 100,
    utilizationRate: 0,
    completionRate: 0,
    avgTimeToComplete: 0,
    consistencyScore: 50,
    avgComplexity: 0,
    complexityDistribution: [1, 2, 3, 4, 5].map(level => ({ level, count: 0, avgAccuracy: 0 })),
    performanceByComplexity: [1, 2, 3, 4, 5].map(level => ({ level, avgHours: 0, accuracy: 0 })),
    performanceScore: 0,
    tasks: [],
  };
}

// =============================================================================
// ALL SPRINTS METRICS
// =============================================================================

export function calculateAllSprintsPerformance(
  tasks: TaskItem[],
  developerId: string,
  developerName: string,
  sprints: string[]
): AllSprintsPerformanceMetrics {
  // Calculate metrics for each sprint
  const sprintMetrics = sprints.map(sprint =>
    calculateSprintPerformance(tasks, developerId, developerName, sprint)
  ).filter(m => m.tasksStarted > 0); // Only sprints where developer worked
  
  if (sprintMetrics.length === 0) {
    return createEmptyAllSprintsMetrics(developerId, developerName);
  }
  
  // Aggregated metrics
  const totalSprints = sprintMetrics.length;
  const totalHoursWorked = sprintMetrics.reduce((sum, m) => sum + m.totalHoursWorked, 0);
  const totalTasksCompleted = sprintMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const averageHoursPerSprint = totalHoursWorked / totalSprints;
  const averageTasksPerSprint = totalTasksCompleted / totalSprints;
  
  // Average performance metrics
  const avgEstimationAccuracy = sprintMetrics.reduce((sum, m) => sum + m.estimationAccuracy, 0) / totalSprints;
  const avgAccuracyRate = sprintMetrics.reduce((sum, m) => sum + m.accuracyRate, 0) / totalSprints;
  const avgReworkRate = sprintMetrics.reduce((sum, m) => sum + m.reworkRate, 0) / totalSprints;
  const avgBugRate = sprintMetrics.reduce((sum, m) => sum + m.bugRate, 0) / totalSprints;
  const avgQualityScore = sprintMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / totalSprints;
  const avgPerformanceScore = sprintMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / totalSprints;
  
  // Trends
  const accuracyValues = sprintMetrics.map(m => 100 - Math.abs(m.estimationAccuracy));
  const qualityValues = sprintMetrics.map(m => m.qualityScore);
  const productivityValues = sprintMetrics.map(m => m.totalHoursWorked);
  
  const accuracyTrend = determineTrend(accuracyValues);
  const qualityTrend = determineTrend(qualityValues);
  const productivityTrend = determineTrend(productivityValues);
  
  // Sprint breakdown
  const sprintBreakdown = sprintMetrics.map(m => ({
    sprintName: m.sprintName,
    performanceScore: m.performanceScore,
    hoursWorked: m.totalHoursWorked,
    tasksCompleted: m.tasksCompleted,
    accuracy: 100 - Math.abs(m.estimationAccuracy),
    quality: m.qualityScore,
  }));
  
  // Performance by complexity (aggregated across all sprints)
  const allTasks = sprintMetrics.flatMap(m => m.tasks);
  const performanceByComplexity = [1, 2, 3, 4, 5].map(level => {
    const tasksAtLevel = allTasks.filter(t => t.complexityScore === level);
    const totalTasks = tasksAtLevel.length;
    const avgHours = totalTasks > 0
      ? tasksAtLevel.reduce((sum, t) => sum + t.hoursSpent, 0) / totalTasks
      : 0;
    const accuracy = totalTasks > 0
      ? tasksAtLevel.reduce((sum, t) => sum + t.estimationAccuracy, 0) / totalTasks
      : 0;
    const reworkRate = totalTasks > 0
      ? (tasksAtLevel.filter(t => t.isRework).length / totalTasks) * 100
      : 0;
    
    return { level, totalTasks, avgHours, accuracy, reworkRate };
  });
  
  // Performance by type
  const performanceByType = (['Bug', 'Tarefa', 'História', 'Outro'] as const).map(type => {
    const tasksOfType = allTasks.filter(t => t.task.tipo === type);
    const count = tasksOfType.length;
    const avgHours = count > 0
      ? tasksOfType.reduce((sum, t) => sum + t.hoursSpent, 0) / count
      : 0;
    const accuracy = count > 0
      ? tasksOfType.reduce((sum, t) => sum + t.estimationAccuracy, 0) / count
      : 0;
    const reworkRate = count > 0
      ? (tasksOfType.filter(t => t.isRework).length / count) * 100
      : 0;
    
    return { type, count, avgHours, accuracy, reworkRate };
  });
  
  return {
    developerId,
    developerName,
    totalSprints,
    totalHoursWorked,
    totalTasksCompleted,
    averageHoursPerSprint,
    averageTasksPerSprint,
    avgEstimationAccuracy,
    avgAccuracyRate,
    avgReworkRate,
    avgBugRate,
    avgQualityScore,
    avgPerformanceScore,
    accuracyTrend,
    qualityTrend,
    productivityTrend,
    sprintBreakdown,
    performanceByComplexity,
    performanceByType,
    sprints: sprintMetrics,
  };
}

function createEmptyAllSprintsMetrics(
  developerId: string,
  developerName: string
): AllSprintsPerformanceMetrics {
  return {
    developerId,
    developerName,
    totalSprints: 0,
    totalHoursWorked: 0,
    totalTasksCompleted: 0,
    averageHoursPerSprint: 0,
    averageTasksPerSprint: 0,
    avgEstimationAccuracy: 0,
    avgAccuracyRate: 0,
    avgReworkRate: 0,
    avgBugRate: 0,
    avgQualityScore: 100,
    avgPerformanceScore: 0,
    accuracyTrend: 'stable',
    qualityTrend: 'stable',
    productivityTrend: 'stable',
    sprintBreakdown: [],
    performanceByComplexity: [1, 2, 3, 4, 5].map(level => ({
      level,
      totalTasks: 0,
      avgHours: 0,
      accuracy: 0,
      reworkRate: 0,
    })),
    performanceByType: (['Bug', 'Tarefa', 'História', 'Outro'] as const).map(type => ({
      type,
      count: 0,
      avgHours: 0,
      accuracy: 0,
      reworkRate: 0,
    })),
    sprints: [],
  };
}

// =============================================================================
// COMPARISONS AND RANKINGS
// =============================================================================

export function calculateDeveloperComparisons(
  metrics: SprintPerformanceMetrics[]
): DeveloperComparison[] {
  if (metrics.length === 0) return [];
  
  const totalDevelopers = metrics.length;
  
  // Sort by each dimension
  const byAccuracy = [...metrics].sort((a, b) => 
    Math.abs(a.estimationAccuracy) - Math.abs(b.estimationAccuracy)
  );
  const byQuality = [...metrics].sort((a, b) => b.qualityScore - a.qualityScore);
  const byProductivity = [...metrics].sort((a, b) => b.totalHoursWorked - a.totalHoursWorked);
  const byOverall = [...metrics].sort((a, b) => b.performanceScore - a.performanceScore);
  
  return metrics.map(m => {
    const accuracyRank = byAccuracy.findIndex(x => x.developerId === m.developerId) + 1;
    const qualityRank = byQuality.findIndex(x => x.developerId === m.developerId) + 1;
    const productivityRank = byProductivity.findIndex(x => x.developerId === m.developerId) + 1;
    const overallRank = byOverall.findIndex(x => x.developerId === m.developerId) + 1;
    
    return {
      developerId: m.developerId,
      developerName: m.developerName,
      performanceScore: m.performanceScore,
      accuracyRank,
      qualityRank,
      productivityRank,
      overallRank,
      totalDevelopers,
    };
  });
}

export function calculateAllSprintsComparisons(
  metrics: AllSprintsPerformanceMetrics[]
): DeveloperComparison[] {
  if (metrics.length === 0) return [];
  
  const totalDevelopers = metrics.length;
  
  const byAccuracy = [...metrics].sort((a, b) => 
    Math.abs(a.avgEstimationAccuracy) - Math.abs(b.avgEstimationAccuracy)
  );
  const byQuality = [...metrics].sort((a, b) => b.avgQualityScore - a.avgQualityScore);
  const byProductivity = [...metrics].sort((a, b) => b.averageHoursPerSprint - a.averageHoursPerSprint);
  const byOverall = [...metrics].sort((a, b) => b.avgPerformanceScore - a.avgPerformanceScore);
  
  return metrics.map(m => {
    const accuracyRank = byAccuracy.findIndex(x => x.developerId === m.developerId) + 1;
    const qualityRank = byQuality.findIndex(x => x.developerId === m.developerId) + 1;
    const productivityRank = byProductivity.findIndex(x => x.developerId === m.developerId) + 1;
    const overallRank = byOverall.findIndex(x => x.developerId === m.developerId) + 1;
    
    return {
      developerId: m.developerId,
      developerName: m.developerName,
      performanceScore: m.avgPerformanceScore,
      accuracyRank,
      qualityRank,
      productivityRank,
      overallRank,
      totalDevelopers,
    };
  });
}

// =============================================================================
// INSIGHTS GENERATION
// =============================================================================

export function generateSprintInsights(metrics: SprintPerformanceMetrics): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  
  // Accuracy insights
  if (metrics.accuracyRate >= 70) {
    insights.push({
      type: 'positive',
      title: 'Ótima Acurácia nas Estimativas',
      description: `${metrics.accuracyRate.toFixed(0)}% das tarefas ficaram dentro de ±20% da estimativa`,
      metric: 'accuracyRate',
      value: `${metrics.accuracyRate.toFixed(0)}%`,
    });
  } else if (metrics.accuracyRate < 50) {
    insights.push({
      type: 'negative',
      title: 'Baixa Acurácia nas Estimativas',
      description: `Apenas ${metrics.accuracyRate.toFixed(0)}% das tarefas ficaram dentro de ±20% da estimativa`,
      metric: 'accuracyRate',
      value: `${metrics.accuracyRate.toFixed(0)}%`,
      recommendation: 'Revisar processo de estimativa. Considerar quebrar tarefas maiores ou usar técnicas como Planning Poker.',
    });
  }
  
  // Tendency insights
  if (metrics.tendsToUnderestimate) {
    insights.push({
      type: 'warning',
      title: 'Tendência a Subestimar',
      description: `Média de ${Math.abs(metrics.estimationAccuracy).toFixed(0)}% abaixo das estimativas`,
      metric: 'estimationAccuracy',
      value: `${metrics.estimationAccuracy.toFixed(1)}%`,
      recommendation: 'Adicionar buffer de tempo ou revisar complexidade das tarefas.',
    });
  } else if (metrics.tendsToOverestimate) {
    insights.push({
      type: 'neutral',
      title: 'Tendência a Superestimar',
      description: `Média de ${metrics.estimationAccuracy.toFixed(0)}% acima das estimativas`,
      metric: 'estimationAccuracy',
      value: `${metrics.estimationAccuracy.toFixed(1)}%`,
      recommendation: 'Pode alocar mais tarefas com segurança.',
    });
  }
  
  // Quality insights
  if (metrics.reworkRate === 0) {
    insights.push({
      type: 'positive',
      title: 'Zero Retrabalho',
      description: 'Nenhuma tarefa precisou ser refeita neste sprint',
      metric: 'reworkRate',
      value: '0%',
    });
  } else if (metrics.reworkRate > 20) {
    insights.push({
      type: 'negative',
      title: 'Alta Taxa de Retrabalho',
      description: `${metrics.reworkRate.toFixed(0)}% das tarefas precisaram ser refeitas`,
      metric: 'reworkRate',
      value: `${metrics.reworkRate.toFixed(0)}%`,
      recommendation: 'Revisar processo de qualidade, testes e entendimento dos requisitos.',
    });
  }
  
  // Bug ratio insights
  if (metrics.bugsVsFeatures > 0.5) {
    insights.push({
      type: 'warning',
      title: 'Muitos Bugs Relativamente a Features',
      description: `Ratio de ${metrics.bugsVsFeatures.toFixed(2)} bugs por feature`,
      metric: 'bugsVsFeatures',
      value: metrics.bugsVsFeatures.toFixed(2),
      recommendation: 'Pode indicar código legado ou necessidade de refatoração.',
    });
  }
  
  // Utilization insights
  if (metrics.utilizationRate > 100) {
    insights.push({
      type: 'warning',
      title: 'Sobrecarga Detectada',
      description: `${metrics.utilizationRate.toFixed(0)}% de utilização (acima de 40h semanais)`,
      metric: 'utilizationRate',
      value: `${metrics.utilizationRate.toFixed(0)}%`,
      recommendation: 'Reduzir carga de trabalho para evitar burnout.',
    });
  } else if (metrics.utilizationRate < 60) {
    insights.push({
      type: 'neutral',
      title: 'Capacidade Disponível',
      description: `${metrics.utilizationRate.toFixed(0)}% de utilização - pode receber mais tarefas`,
      metric: 'utilizationRate',
      value: `${metrics.utilizationRate.toFixed(0)}%`,
    });
  }
  
  // Completion rate insights
  if (metrics.completionRate < 80 && metrics.tasksStarted > 0) {
    insights.push({
      type: 'warning',
      title: 'Baixa Taxa de Conclusão',
      description: `Apenas ${metrics.completionRate.toFixed(0)}% das tarefas foram concluídas`,
      metric: 'completionRate',
      value: `${metrics.completionRate.toFixed(0)}%`,
      recommendation: 'Verificar se há bloqueios ou interrupções frequentes.',
    });
  }
  
  // Complexity insights
  const highComplexityTasks = metrics.tasks.filter(t => t.complexityScore >= 4).length;
  if (highComplexityTasks > metrics.tasksStarted * 0.5) {
    insights.push({
      type: 'neutral',
      title: 'Muitas Tarefas Complexas',
      description: `${highComplexityTasks} de ${metrics.tasksStarted} tarefas são de alta complexidade (4-5)`,
      metric: 'avgComplexity',
      value: metrics.avgComplexity.toFixed(1),
    });
  }
  
  // Overall performance
  if (metrics.performanceScore >= 85) {
    insights.push({
      type: 'positive',
      title: 'Performance Excelente',
      description: 'Score geral acima de 85 - desempenho excepcional',
      metric: 'performanceScore',
      value: metrics.performanceScore.toFixed(0),
    });
  } else if (metrics.performanceScore < 60) {
    insights.push({
      type: 'negative',
      title: 'Performance Abaixo do Esperado',
      description: 'Score geral abaixo de 60 - necessita atenção',
      metric: 'performanceScore',
      value: metrics.performanceScore.toFixed(0),
      recommendation: 'Focar em melhorar estimativas e reduzir retrabalho.',
    });
  }
  
  return insights;
}

export function generateAllSprintsInsights(metrics: AllSprintsPerformanceMetrics): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  
  // Trend insights
  if (metrics.accuracyTrend === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Acurácia em Melhoria',
      description: 'Estimativas estão ficando mais precisas ao longo dos sprints',
      metric: 'accuracyTrend',
      value: 'Melhorando',
    });
  } else if (metrics.accuracyTrend === 'declining') {
    insights.push({
      type: 'warning',
      title: 'Acurácia em Declínio',
      description: 'Estimativas estão ficando menos precisas',
      metric: 'accuracyTrend',
      value: 'Piorando',
      recommendation: 'Revisar processo de estimativa e complexidade das tarefas.',
    });
  }
  
  if (metrics.qualityTrend === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Qualidade em Melhoria',
      description: 'Taxa de retrabalho está diminuindo',
      metric: 'qualityTrend',
      value: 'Melhorando',
    });
  } else if (metrics.qualityTrend === 'declining') {
    insights.push({
      type: 'negative',
      title: 'Qualidade em Declínio',
      description: 'Taxa de retrabalho está aumentando',
      metric: 'qualityTrend',
      value: 'Piorando',
      recommendation: 'Reforçar testes e code reviews.',
    });
  }
  
  // Overall metrics insights
  if (metrics.avgReworkRate < 10) {
    insights.push({
      type: 'positive',
      title: 'Baixa Taxa de Retrabalho Geral',
      description: `Média de ${metrics.avgReworkRate.toFixed(1)}% de retrabalho ao longo de todos os sprints`,
      metric: 'avgReworkRate',
      value: `${metrics.avgReworkRate.toFixed(1)}%`,
    });
  }
  
  // Consistency insights
  if (metrics.totalSprints >= 3) {
    const scoreVariation = calculateStdDev(
      metrics.sprintBreakdown.map(s => s.performanceScore)
    );
    
    if (scoreVariation < 10) {
      insights.push({
        type: 'positive',
        title: 'Performance Consistente',
        description: 'Score de performance estável ao longo dos sprints',
        metric: 'consistencyScore',
        value: 'Alta',
      });
    }
  }
  
  return insights;
}

// =============================================================================
// MAIN ANALYTICS FUNCTION
// =============================================================================

export function calculatePerformanceAnalytics(tasks: TaskItem[]): PerformanceAnalytics {
  // Get all unique sprints and developers
  const sprints = Array.from(new Set(tasks.map(t => t.sprint).filter(s => s && s.trim() !== '')));
  const developers = Array.from(new Set(tasks.map(t => t.idResponsavel).filter(id => id && id.trim() !== '')));
  
  // Create developer map (id -> name)
  const developerNames = new Map<string, string>();
  tasks.forEach(t => {
    if (t.idResponsavel && t.responsavel) {
      developerNames.set(t.idResponsavel, t.responsavel);
    }
  });
  
  // Calculate metrics by sprint
  const metricsBySprint = new Map<string, Map<string, SprintPerformanceMetrics>>();
  sprints.forEach(sprint => {
    const sprintMap = new Map<string, SprintPerformanceMetrics>();
    developers.forEach(devId => {
      const devName = developerNames.get(devId) || devId;
      const metrics = calculateSprintPerformance(tasks, devId, devName, sprint);
      if (metrics.tasksStarted > 0) {
        sprintMap.set(devId, metrics);
      }
    });
    metricsBySprint.set(sprint, sprintMap);
  });
  
  // Calculate all sprints metrics
  const allSprintsMetrics = new Map<string, AllSprintsPerformanceMetrics>();
  developers.forEach(devId => {
    const devName = developerNames.get(devId) || devId;
    const metrics = calculateAllSprintsPerformance(tasks, devId, devName, sprints);
    if (metrics.totalSprints > 0) {
      allSprintsMetrics.set(devId, metrics);
    }
  });
  
  // Calculate comparisons
  const comparisonsBySprint = new Map<string, DeveloperComparison[]>();
  metricsBySprint.forEach((devMap, sprint) => {
    const metrics = Array.from(devMap.values());
    const comparisons = calculateDeveloperComparisons(metrics);
    comparisonsBySprint.set(sprint, comparisons);
  });
  
  const allSprintsComparisons = calculateAllSprintsComparisons(
    Array.from(allSprintsMetrics.values())
  );
  
  // Generate insights
  const insightsBySprint = new Map<string, Map<string, PerformanceInsight[]>>();
  metricsBySprint.forEach((devMap, sprint) => {
    const sprintInsights = new Map<string, PerformanceInsight[]>();
    devMap.forEach((metrics, devId) => {
      const insights = generateSprintInsights(metrics);
      sprintInsights.set(devId, insights);
    });
    insightsBySprint.set(sprint, sprintInsights);
  });
  
  const allSprintsInsights = new Map<string, PerformanceInsight[]>();
  allSprintsMetrics.forEach((metrics, devId) => {
    const insights = generateAllSprintsInsights(metrics);
    allSprintsInsights.set(devId, insights);
  });
  
  // Metric explanations
  const explanations = new Map<string, MetricExplanation>(
    Object.entries(METRIC_EXPLANATIONS)
  );
  
  return {
    developerMetrics: {
      bySprint: metricsBySprint,
      allSprints: allSprintsMetrics,
    },
    comparisons: {
      bySprint: comparisonsBySprint,
      allSprints: allSprintsComparisons,
    },
    insights: {
      bySprint: insightsBySprint,
      allSprints: allSprintsInsights,
    },
    explanations,
  };
}

