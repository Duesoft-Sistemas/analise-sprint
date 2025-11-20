import {
  TaskItem,
  SprintMetadata,
  TemporalAggregation,
  TemporalPeriodMetrics,
  DeveloperTemporalEvolution,
  TemporalEvolutionAnalytics,
  SprintPerformanceMetrics,
  WorklogEntry,
} from '../types';
import { calculatePerformanceAnalytics, calculateCustomPeriodPerformance } from './performanceAnalytics';
import { isCompletedStatus, isNeutralTask } from '../utils/calculations';
import { getEfficiencyThreshold } from '../config/performanceConfig';

/**
 * Get period identifier and label based on date and aggregation type
 * For 'sprint' aggregation, sprintName should be provided instead of date
 */
function getPeriodInfo(date: Date, aggregationType: TemporalAggregation, sprintName?: string): { id: string; label: string } {
  if (aggregationType === 'sprint' && sprintName) {
    return {
      id: sprintName,
      label: sprintName
    };
  }

  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1; // 1-4
  const semester = Math.floor(month / 6) + 1; // 1-2

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  switch (aggregationType) {
    case 'monthly':
      return {
        id: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: `${monthNames[month]} ${year}`
      };
    case 'quarterly':
      return {
        id: `${year}-Q${quarter}`,
        label: `Q${quarter} ${year}`
      };
    case 'semiannual':
      return {
        id: `${year}-H${semester}`,
        label: `${semester}º Semestre ${year}`
      };
    case 'annual':
      return {
        id: `${year}`,
        label: `${year}`
      };
    case 'sprint':
      // Should not reach here if sprintName is provided
      return {
        id: date.toISOString(),
        label: date.toISOString()
      };
  }
}

/**
 * Get date range for a period
 * For 'sprint' aggregation, sprints array should be provided to find the sprint dates
 */
function getPeriodDateRange(periodId: string, aggregationType: TemporalAggregation, sprints?: SprintMetadata[]): { start: Date; end: Date } {
  if (aggregationType === 'sprint' && sprints) {
    // Find the sprint in the sprints array
    const sprint = sprints.find(s => s.sprint === periodId);
    if (sprint) {
      return {
        start: sprint.dataInicio,
        end: sprint.dataFim
      };
    }
    // Fallback if sprint not found
    return {
      start: new Date(),
      end: new Date()
    };
  }

  if (aggregationType === 'monthly') {
    const [year, month] = periodId.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
    return { start, end };
  } else if (aggregationType === 'quarterly') {
    const [year, q] = periodId.split('-Q').map(Number);
    const startMonth = (q - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    return { start, end };
  } else if (aggregationType === 'semiannual') {
    const [year, h] = periodId.split('-H').map(Number);
    const startMonth = (h - 1) * 6;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 6, 0, 23, 59, 59, 999);
    return { start, end };
  } else { // annual
    const year = Number(periodId);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { start, end };
  }
}

/**
 * Group sprints by temporal period
 */
function groupSprintsByPeriod(
  sprints: SprintMetadata[],
  aggregationType: TemporalAggregation
): Map<string, { periodId: string; periodLabel: string; sprints: string[]; startDate: Date; endDate: Date }> {
  const periodMap = new Map<string, { periodId: string; periodLabel: string; sprints: string[]; startDate: Date; endDate: Date }>();

  if (aggregationType === 'sprint') {
    // Each sprint is its own period
    for (const sprint of sprints) {
      const periodInfo = getPeriodInfo(sprint.dataInicio, aggregationType, sprint.sprint);
      const periodId = periodInfo.id;
      const dateRange = getPeriodDateRange(periodId, aggregationType, sprints);
      
      periodMap.set(periodId, {
        periodId: periodId,
        periodLabel: periodInfo.label,
        sprints: [sprint.sprint],
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
    }
  } else {
    // Group sprints by temporal period (monthly, quarterly, etc.)
    for (const sprint of sprints) {
      const periodInfo = getPeriodInfo(sprint.dataInicio, aggregationType);
      const periodId = periodInfo.id;

      if (!periodMap.has(periodId)) {
        const dateRange = getPeriodDateRange(periodId, aggregationType, sprints);
        periodMap.set(periodId, {
          periodId: periodId,
          periodLabel: periodInfo.label,
          sprints: [],
          startDate: dateRange.start,
          endDate: dateRange.end,
        });
      }

      periodMap.get(periodId)!.sprints.push(sprint.sprint);
    }
  }

  return periodMap;
}

/**
 * Calculate metrics for a specific period
 * Uses the same logic as PerformanceDashboard when multiple sprints are selected:
 * aggregates tasks from all sprints and recalculates metrics, rather than averaging sprint scores
 */
function calculatePeriodMetrics(
  developerId: string,
  developerName: string,
  sprintNames: string[],
  tasks: TaskItem[],
  worklogs: WorklogEntry[] | undefined,
  sprintMetadata: SprintMetadata[] | undefined,
  periodInfo: { periodId: string; periodLabel: string; startDate: Date; endDate: Date }
): TemporalPeriodMetrics | null {
  if (sprintNames.length === 0) {
    return null;
  }

  // Use calculateCustomPeriodPerformance to get aggregated metrics from tasks
  // This is the same approach used in PerformanceDashboard for multiple sprints
  const customMetrics = calculateCustomPeriodPerformance(
    tasks,
    developerId,
    developerName,
    sprintNames,
    periodInfo.periodLabel,
    worklogs,
    sprintMetadata
  );

  if (customMetrics.totalTasksCompleted === 0) {
    return null;
  }

  // Aggregate tasks from all sprints in the period
  const allTasksMetrics = customMetrics.sprints.flatMap(sprint => sprint.tasks);

  // Calculate aggregated metrics based on aggregated tasks (same logic as PerformanceDashboard)
  const completedTasks = allTasksMetrics.filter(t => isCompletedStatus(t.task.status));
  const completedWithEstimates = completedTasks.filter(t => t.hoursEstimated > 0);

  // Separate bugs and features
  const bugs = completedWithEstimates.filter(t => t.task.tipo === 'Bug');
  const features = completedWithEstimates.filter(t => t.task.tipo !== 'Bug');

  // Calculate efficient bugs (using complexity zone)
  const efficientBugs = bugs.filter(t => t.efficiencyImpact?.zone === 'efficient').length;
  const acceptableBugs = bugs.filter(t => t.efficiencyImpact?.zone === 'acceptable').length;
  const bugAccuracyRate = bugs.length > 0 ? ((efficientBugs + (acceptableBugs * 0.5)) / bugs.length) * 100 : 0;

  // Calculate feature estimation accuracy (average deviation)
  const featureDeviations = features.map(t => t.estimationAccuracy);
  const featureEstimationAccuracy = featureDeviations.length > 0
    ? featureDeviations.reduce((sum, d) => sum + d, 0) / featureDeviations.length
    : 0;

  // Calculate weighted accuracy rate
  const weightedEfficientScore = efficientBugs + (acceptableBugs * 0.5) + 
    features.filter(t => {
      const deviation = t.estimationAccuracy;
      const threshold = getEfficiencyThreshold(t.complexityScore);
      return deviation > 0 ? true : deviation >= threshold.slower;
    }).length;
  const accuracyRate = completedWithEstimates.length > 0
    ? (weightedEfficientScore / completedWithEstimates.length) * 100
    : 0;

  // Recalculate bonuses based on aggregated tasks (same logic as PerformanceDashboard)
  // Seniority Bonus: tasks with complexity 4-5 that are efficient and have quality >= 4
  const seniorTasks = completedTasks.filter(t => t.complexityScore >= 4 && t.hoursEstimated > 0);
  let seniorityEfficiencyBonus = 0;

  if (seniorTasks.length > 0) {
    let highlyEfficientSenior = 0;
    for (const task of seniorTasks) {
      const hasGoodQuality = task.task.notaTeste !== null && task.task.notaTeste !== undefined && task.task.notaTeste >= 4;
      if (!hasGoodQuality) continue;

      let isEfficient = false;
      if (task.efficiencyImpact && task.efficiencyImpact.type === 'complexity_zone') {
        if (task.efficiencyImpact.zone === 'efficient') {
          highlyEfficientSenior++;
          isEfficient = true;
        }
      } else {
        const deviation = task.estimationAccuracy;
        const threshold = getEfficiencyThreshold(task.complexityScore);
        if (deviation >= 0 || (deviation < 0 && deviation >= threshold.slower)) {
          highlyEfficientSenior++;
          isEfficient = true;
        }
      }
    }
    const seniorEfficiencyScore = highlyEfficientSenior / seniorTasks.length;
    seniorityEfficiencyBonus = Math.round(seniorEfficiencyScore * 15); // MAX_SENIORITY_EFFICIENCY_BONUS
  }

  // Competence Bonus: tasks with complexity 3 that are efficient and have quality >= 4
  const mediumTasks = completedTasks.filter(t => t.complexityScore === 3 && t.hoursEstimated > 0);
  let competenceBonus = 0;

  if (mediumTasks.length > 0) {
    let highlyEfficientMedium = 0;
    for (const task of mediumTasks) {
      const hasGoodQuality = task.task.notaTeste !== null && task.task.notaTeste !== undefined && task.task.notaTeste >= 4;
      if (!hasGoodQuality) continue;

      let isEfficient = false;
      if (task.efficiencyImpact && task.efficiencyImpact.type === 'complexity_zone') {
        if (task.efficiencyImpact.zone === 'efficient') {
          highlyEfficientMedium++;
          isEfficient = true;
        }
      } else {
        const deviation = task.estimationAccuracy;
        const threshold = getEfficiencyThreshold(task.complexityScore);
        if (deviation >= 0 || (deviation < 0 && deviation >= threshold.slower)) {
          highlyEfficientMedium++;
          isEfficient = true;
        }
      }
    }
    const mediumEfficiencyScore = highlyEfficientMedium / mediumTasks.length;
    competenceBonus = Math.round(mediumEfficiencyScore * 5); // MAX_COMPLEXITY_3_BONUS
  }

  // Auxilio Bonus: sum of auxilio hours across all sprints
  const auxilioBonus = customMetrics.sprints.reduce((sum, s) => sum + (s.auxilioBonus || 0), 0);

  // Aggregate test notes for quality calculation
  const qualityTasks = completedTasks.filter(t => 
    !isNeutralTask(t.task) && 
    t.task.notaTeste !== null && 
    t.task.notaTeste !== undefined
  );
  const testNotes = qualityTasks.map(t => t.task.notaTeste as number);
  const avgTestNote = testNotes.length > 0 ? (testNotes.reduce((s, n) => s + n, 0) / testNotes.length) : undefined;
  const qualityScore = avgTestNote !== undefined ? Math.max(0, Math.min(100, avgTestNote * 20)) : customMetrics.avgQualityScore;

  // Calculate base score (considering quality if available)
  const executionEfficiency = accuracyRate;
  const scoreHasQuality = qualityTasks.length > 0;
  const baseScore = scoreHasQuality
    ? ((qualityScore * 0.50) + (executionEfficiency * 0.50))
    : executionEfficiency;

  // Calculate performance score (same formula as PerformanceDashboard)
  const performanceScore = baseScore + seniorityEfficiencyBonus + competenceBonus + auxilioBonus;

  // Calculate bugs vs features (only completed tasks)
  const completedTaskItems = completedTasks.map(t => t.task);
  const bugTasks = completedTaskItems.filter(t => t.tipo === 'Bug').length;
  const featureTasks = completedTaskItems.filter(t => t.tipo === 'Tarefa' || t.tipo === 'História').length;
  const bugsVsFeatures = featureTasks > 0 ? bugTasks / featureTasks : 0;

  return {
    periodId: periodInfo.periodId,
    periodLabel: periodInfo.periodLabel,
    startDate: periodInfo.startDate,
    endDate: periodInfo.endDate,
    totalSprints: sprintNames.length,
    totalHoursWorked: customMetrics.totalHoursWorked,
    totalHoursEstimated: customMetrics.totalHoursEstimated,
    totalTasksCompleted: customMetrics.totalTasksCompleted,
    totalTasksStarted: customMetrics.totalTasksStarted,
    avgPerformanceScore: performanceScore, // Recalculated based on aggregated tasks, not average of sprint scores
    avgAccuracyRate: accuracyRate,
    avgQualityScore: qualityScore,
    avgCompletionRate: customMetrics.completionRate,
    avgBugRate: completedTaskItems.length > 0 ? (bugTasks / completedTaskItems.length) * 100 : 0,
    avgEstimationAccuracy: customMetrics.avgEstimationAccuracy,
    avgUtilizationRate: customMetrics.utilizationRate,
    avgComplexity: customMetrics.avgComplexity,
    includedSprints: sprintNames,
  };
}

/**
 * Calculate trend based on time series data using linear regression
 */
function calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable';

  // Simple linear regression
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, v) => sum + v, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    const yDiff = values[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;

  // Threshold for considering a trend significant
  const threshold = 0.5;

  if (slope > threshold) return 'improving';
  if (slope < -threshold) return 'declining';
  return 'stable';
}

/**
 * Calculate trend for complexity (uses different terminology)
 */
function calculateComplexityTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  const trend = calculateTrend(values);
  if (trend === 'improving') return 'increasing';
  if (trend === 'declining') return 'decreasing';
  return 'stable';
}

/**
 * Generate career insights based on temporal evolution
 */
function generateCareerInsights(evolution: Omit<DeveloperTemporalEvolution, 'careerInsights'>): DeveloperTemporalEvolution['careerInsights'] {
  const insights: DeveloperTemporalEvolution['careerInsights'] = [];
  const { overallTrend, growthMetrics, statistics, periods } = evolution;

  // Performance trend insights
  if (overallTrend.performance === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Evolução Positiva de Performance',
      description: `Performance melhorou ${growthMetrics.performanceGrowth.toFixed(1)}% ao longo do período analisado.`,
      metric: 'Performance',
      recommendation: 'Continue o excelente trabalho! Considere compartilhar suas práticas com a equipe.'
    });
  } else if (overallTrend.performance === 'declining') {
    insights.push({
      type: 'negative',
      title: 'Declínio na Performance',
      description: `Performance diminuiu ${Math.abs(growthMetrics.performanceGrowth).toFixed(1)}% no período.`,
      metric: 'Performance',
      recommendation: 'Recomendamos uma conversa 1:1 para identificar possíveis bloqueios ou necessidades de suporte.'
    });
  }

  // Quality trend insights
  if (overallTrend.quality === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Melhoria Contínua na Qualidade',
      description: `Qualidade do código melhorou ${growthMetrics.qualityGrowth.toFixed(1)}% ao longo do tempo.`,
      metric: 'Qualidade',
    });
  } else if (overallTrend.quality === 'declining') {
    insights.push({
      type: 'negative',
      title: 'Qualidade Precisa Atenção',
      description: `Qualidade (nota de teste) diminuiu ao longo do período.`,
      metric: 'Qualidade',
      recommendation: 'Considere revisar processos de code review e aumentar cobertura de testes.'
    });
  }

  // Complexity growth insights
  if (overallTrend.complexity === 'increasing') {
    insights.push({
      type: 'positive',
      title: 'Assumindo Tarefas Mais Complexas',
      description: `Complexidade média aumentou ${growthMetrics.complexityGrowth.toFixed(1)}%, indicando crescimento técnico.`,
      metric: 'Complexidade',
      recommendation: 'Excelente! Está assumindo desafios maiores. Considere para promoção ou tarefas de liderança técnica.'
    });
  }

  // Consistency insights
  if (statistics.consistencyScore >= 80) {
    insights.push({
      type: 'positive',
      title: 'Performance Consistente',
      description: `Mantém performance estável com score de consistência de ${statistics.consistencyScore.toFixed(0)}/100.`,
      metric: 'Consistência',
    });
  } else if (statistics.consistencyScore < 60) {
    insights.push({
      type: 'neutral',
      title: 'Variação na Performance',
      description: `Performance varia significativamente entre períodos (consistência: ${statistics.consistencyScore.toFixed(0)}/100).`,
      metric: 'Consistência',
      recommendation: 'Identifique fatores que causam variação (tipo de tarefa, carga, etc) para estabilizar performance.'
    });
  }

  // Overall growth insights
  if (growthMetrics.totalGrowthScore >= 20) {
    insights.push({
      type: 'positive',
      title: '🏆 Crescimento Excepcional',
      description: `Crescimento total de ${growthMetrics.totalGrowthScore.toFixed(1)}% em múltiplas dimensões.`,
      recommendation: 'Forte candidato para promoção ou aumento de responsabilidades.'
    });
  } else if (growthMetrics.totalGrowthScore < -10) {
    insights.push({
      type: 'negative',
      title: 'Regressão nas Métricas',
      description: `Métricas gerais diminuíram ${Math.abs(growthMetrics.totalGrowthScore).toFixed(1)}% no período.`,
      recommendation: 'Agende reunião para discutir desafios e plano de desenvolvimento individual.'
    });
  }

  // Recent performance check (last period vs average)
  if (periods.length >= 2) {
    const lastPeriod = periods[periods.length - 1];
    const avgScore = statistics.avgPerformanceScore;
    const difference = ((lastPeriod.avgPerformanceScore - avgScore) / avgScore) * 100;

    if (difference > 15) {
      insights.push({
        type: 'positive',
        title: 'Performance Recente Acima da Média',
        description: `Última performance (${lastPeriod.avgPerformanceScore.toFixed(0)}) está ${difference.toFixed(0)}% acima da média pessoal.`,
      });
    } else if (difference < -15) {
      insights.push({
        type: 'negative',
        title: 'Performance Recente Abaixo da Média',
        description: `Última performance está ${Math.abs(difference).toFixed(0)}% abaixo da média pessoal.`,
        recommendation: 'Verifique se há bloqueios ou desafios específicos no período recente.'
      });
    }
  }

  return insights;
}

/**
 * Calculate statistical metrics
 */
function calculateStatistics(periods: TemporalPeriodMetrics[]) {
  const scores = periods.map(p => p.avgPerformanceScore);
  const sortedScores = [...scores].sort((a, b) => a - b);
  
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const median = sortedScores.length % 2 === 0
    ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
    : sortedScores[Math.floor(sortedScores.length / 2)];
  
  // Standard deviation
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Consistency score (inverse of coefficient of variation)
  const coefficientOfVariation = avg === 0 ? 0 : stdDev / avg;
  const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100));
  
  return {
    avgPerformanceScore: avg,
    medianPerformanceScore: median,
    minPerformanceScore: min,
    maxPerformanceScore: max,
    performanceStdDev: stdDev,
    consistencyScore,
  };
}

/**
 * Main function to calculate temporal evolution analytics
 */
export function calculateTemporalEvolution(
  tasks: TaskItem[],
  sprints: SprintMetadata[],
  aggregationType: TemporalAggregation,
  worklogs?: WorklogEntry[]
): TemporalEvolutionAnalytics {
  // First, calculate all performance analytics
  const performanceAnalytics = calculatePerformanceAnalytics(tasks);
  
  // Filter sprints: if aggregation is 'sprint', only include finished sprints (dataFim < today)
  const filteredSprints = aggregationType === 'sprint'
    ? sprints.filter(sprint => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const sprintEnd = new Date(sprint.dataFim);
        sprintEnd.setHours(23, 59, 59, 999); // End of sprint end date
        return sprintEnd < today;
      })
    : sprints;
  
  // Group sprints by period
  const periodGroups = groupSprintsByPeriod(filteredSprints, aggregationType);
  
  // Create a map for quick lookup of sprint metrics by developer and sprint
  const sprintMetricsMap = new Map<string, SprintPerformanceMetrics>();
  performanceAnalytics.developerMetrics.bySprint.forEach((devMap, sprintName) => {
    devMap.forEach((metrics, developerId) => {
      sprintMetricsMap.set(`${developerId}-${sprintName}`, metrics);
    });
  });
  
  // Get all unique developers
  const developers = Array.from(performanceAnalytics.developerMetrics.allSprints.keys());
  
  // Calculate temporal evolution for each developer
  const developerEvolutions: DeveloperTemporalEvolution[] = [];
  
  for (const developerId of developers) {
    const allSprintsMetrics = performanceAnalytics.developerMetrics.allSprints.get(developerId);
    if (!allSprintsMetrics) continue;
    
    // Calculate metrics for each period
    const periods: TemporalPeriodMetrics[] = [];
    
    for (const [_, periodInfo] of periodGroups) {
      const periodMetrics = calculatePeriodMetrics(
        developerId,
        allSprintsMetrics.developerName,
        periodInfo.sprints,
        tasks,
        worklogs,
        sprints,
        periodInfo
      );
      
      if (periodMetrics) {
        periods.push(periodMetrics);
      }
    }
    
    // Sort periods chronologically
    periods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    if (periods.length === 0) continue;
    
    // Calculate trends
    const performanceScores = periods.map(p => p.avgPerformanceScore);
    const accuracyScores = periods.map(p => p.avgAccuracyRate);
    const qualityScores = periods.map(p => p.avgQualityScore);
    const complexityScores = periods.map(p => p.avgComplexity);
    
    const overallTrend = {
      performance: calculateTrend(performanceScores),
      accuracy: calculateTrend(accuracyScores),
      quality: calculateTrend(qualityScores),
      complexity: calculateComplexityTrend(complexityScores),
    };
    
    // Calculate growth metrics (first to last period)
    const firstPeriod = periods[0];
    const lastPeriod = periods[periods.length - 1];
    
    const performanceGrowth = ((lastPeriod.avgPerformanceScore - firstPeriod.avgPerformanceScore) / firstPeriod.avgPerformanceScore) * 100;
    const accuracyGrowth = ((lastPeriod.avgAccuracyRate - firstPeriod.avgAccuracyRate) / firstPeriod.avgAccuracyRate) * 100;
    const qualityGrowth = ((lastPeriod.avgQualityScore - firstPeriod.avgQualityScore) / firstPeriod.avgQualityScore) * 100;
    const complexityGrowth = ((lastPeriod.avgComplexity - firstPeriod.avgComplexity) / firstPeriod.avgComplexity) * 100;
    
    // Weighted total growth score (performance and quality are more important)
    const totalGrowthScore = (
      performanceGrowth * 0.4 +
      qualityGrowth * 0.3 +
      accuracyGrowth * 0.2 +
      complexityGrowth * 0.1
    );
    
    const growthMetrics = {
      performanceGrowth,
      accuracyGrowth,
      qualityGrowth,
      complexityGrowth,
      totalGrowthScore,
    };
    
    // Calculate statistics
    const statistics = calculateStatistics(periods);
    
    // Create evolution object without insights first
    const evolutionWithoutInsights: Omit<DeveloperTemporalEvolution, 'careerInsights'> = {
      developerId,
      developerName: allSprintsMetrics.developerName,
      aggregationType,
      periods,
      overallTrend,
      growthMetrics,
      statistics,
    };
    
    // Generate career insights
    const careerInsights = generateCareerInsights(evolutionWithoutInsights);
    
    developerEvolutions.push({
      ...evolutionWithoutInsights,
      careerInsights,
    });
  }
  
  // Calculate team averages for each period
  const teamAveragesByPeriod = new Map<string, { avgPerformanceScore: number; avgAccuracyRate: number; avgQualityScore: number; count: number }>();
  
  developerEvolutions.forEach(dev => {
    dev.periods.forEach(period => {
      if (!teamAveragesByPeriod.has(period.periodId)) {
        teamAveragesByPeriod.set(period.periodId, {
          avgPerformanceScore: 0,
          avgAccuracyRate: 0,
          avgQualityScore: 0,
          count: 0,
        });
      }
      
      const avg = teamAveragesByPeriod.get(period.periodId)!;
      avg.avgPerformanceScore += period.avgPerformanceScore;
      avg.avgAccuracyRate += period.avgAccuracyRate;
      avg.avgQualityScore += period.avgQualityScore;
      avg.count++;
    });
  });
  
  const teamAverages = Array.from(teamAveragesByPeriod.entries()).map(([periodId, data]) => ({
    periodId,
    avgPerformanceScore: data.avgPerformanceScore / data.count,
    avgAccuracyRate: data.avgAccuracyRate / data.count,
    avgQualityScore: data.avgQualityScore / data.count,
  }));
  
  return {
    aggregationType,
    developers: developerEvolutions,
    teamAverages,
  };
}

