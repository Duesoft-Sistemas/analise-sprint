import { TaskItem, TaskPerformanceMetrics } from '../types';
import { isCompletedStatus, normalizeForComparison, isNeutralTask } from '../utils/calculations';
import { getEfficiencyThreshold } from '../config/performanceConfig';
import { calculateTaskMetrics } from './performanceAnalytics';

// =============================================================================
// TYPES
// =============================================================================

export interface FeatureModulePerformance {
  feature?: string;
  module?: string;
  taskCount: number;
  totalHoursWorked: number;
  totalHoursEstimated: number;
  avgAccuracyRate: number; // Overall, for backward compatibility
  avgQualityScore: number;
  avgPerformanceScore: number;
  avgComplexity: number;
  completionRate: number;
  tasks: TaskItem[];
  
  // Breakdown metrics
  bugAccuracyRate: number;
  featureEstimationAccuracy: number;
  bugs: TaskPerformanceMetrics[];
  features: TaskPerformanceMetrics[];
}

export interface ComplexityDetailedAnalysis {
  level: number;
  taskCount: number;
  totalHoursWorked: number;
  totalHoursEstimated: number;
  avgAccuracyRate: number; // Overall
  avgQualityScore: number;
  avgPerformanceScore: number;
  avgHoursPerTask: number;
  bestPerformance: boolean;
  tasks: TaskItem[];
  
  // Breakdown metrics
  bugAccuracyRate: number;
  featureEstimationAccuracy: number;
  bugs: TaskPerformanceMetrics[];
  features: TaskPerformanceMetrics[];
}

export interface DeveloperDetailedAnalytics {
  developerId: string;
  developerName: string;
  
  // Por Feature/Módulo
  byFeature: FeatureModulePerformance[];
  byModule: FeatureModulePerformance[];
  
  // Por Complexidade Detalhada
  byComplexity: ComplexityDetailedAnalysis[];
  bestComplexityLevel: number; // Nível onde performa melhor
  complexityPreference: 'simple' | 'medium' | 'complex' | 'mixed';
  
  // Insights gerados
  insights: {
    type: 'positive' | 'negative' | 'neutral' | 'recommendation';
    title: string;
    description: string;
    recommendation?: string;
  }[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Helper to identify auxilio tasks (normalized comparison)
function isAuxilioTask(task: TaskItem): boolean {
  if (!task.detalhesOcultos || task.detalhesOcultos.length === 0) return false;
  return task.detalhesOcultos.some(d => normalizeForComparison(d) === 'auxilio');
}

function calculateTaskAccuracyRate(task: TaskItem): number {
  const estimated = task.estimativa;
  // For detailed analytics (all sprints analysis), use tempoGastoTotal (total historical hours)
  // This function analyzes all developer tasks across all sprints, so we need total hours
  const spent = task.tempoGastoTotal ?? 0;
  
  if (estimated === 0) return 0;
  const accuracy = ((estimated - spent) / estimated) * 100;
  
  // Considera eficiente se está dentro de ±20% OU até 50% mais rápido
  if (accuracy >= -20 && accuracy <= 50) return 100; // Eficiente
  return 0; // Ineficiente
}

function calculateTaskPerformanceScore(task: TaskItem): number {
  const quality = (task.notaTeste ?? 5) * 20; // 0-100
  const accuracy = calculateTaskAccuracyRate(task);
  return (quality * 0.5) + (accuracy * 0.5);
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Calculate performance by feature/module
 */
function calculateFeatureModulePerformance(
  tasks: TaskItem[],
  groupBy: 'feature' | 'module'
): FeatureModulePerformance[] {
  const grouped = new Map<string, TaskItem[]>();
  
  tasks.forEach(task => {
    if (groupBy === 'feature') {
      // Features é um array - cada feature deve criar uma entrada separada
      if (task.feature.length > 0) {
        for (const feature of task.feature) {
          if (feature && feature.trim() !== '') {
            const key = feature.trim();
            if (!grouped.has(key)) {
              grouped.set(key, []);
            }
            grouped.get(key)!.push(task);
          }
        }
      }
    } else {
      // Módulo continua sendo string
      const key = task.modulo;
      if (!key || key.trim() === '') return;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(task);
    }
  });
  
  const results: FeatureModulePerformance[] = [];
  
  grouped.forEach((taskList, key) => {
    // For detailed analytics (all sprints analysis), use tempoGastoTotal (total historical hours)
    const totalHoursWorked = taskList.reduce((sum, t) => 
      sum + (t.tempoGastoTotal ?? 0), 0
    );
    const totalHoursEstimated = taskList.reduce((sum, t) => 
      sum + (t.estimativaRestante ?? t.estimativa), 0
    );
    
    // Reworked accuracy calculation
    const taskMetrics = taskList.map(t => calculateTaskMetrics(t, false));
    const completedMetrics = taskMetrics.filter(t => isCompletedStatus(t.task.status) && t.hoursEstimated > 0);

    const bugs = completedMetrics.filter(t => t.task.tipo === 'Bug');
    const features = completedMetrics.filter(t => t.task.tipo !== 'Bug');

    const efficientBugs = bugs.filter(t => t.efficiencyImpact?.isEfficient).length;
    const bugAccuracyRate = bugs.length > 0 ? (efficientBugs / bugs.length) * 100 : 0;

    const featureDeviations = features.map(t => t.estimationAccuracy);
    const featureEstimationAccuracy = featureDeviations.length > 0
      ? featureDeviations.reduce((sum, d) => sum + d, 0) / featureDeviations.length
      : 0;
      
    // NEW weighted calculation for overall accuracy
    let weightedEfficientScore = 0;
    completedMetrics.forEach(t => {
      if (t.efficiencyImpact && t.efficiencyImpact.type === 'complexity_zone') {
        if (t.efficiencyImpact.zone === 'efficient') {
          weightedEfficientScore += 1;
        } else if (t.efficiencyImpact.zone === 'acceptable') {
          weightedEfficientScore += 0.5;
        }
      } else {
        const deviation = t.estimationAccuracy;
        const threshold = getEfficiencyThreshold(t.complexityScore);
        const isEfficient = deviation > 0 ? true : deviation >= threshold.slower;
        if (isEfficient) {
          weightedEfficientScore += 1;
        }
      }
    });

    const avgAccuracyRate = completedMetrics.length > 0
      ? (weightedEfficientScore / completedMetrics.length) * 100
      : 0;

    // =============================================================================
    // 5. CALCULAR MÉTRICAS DERIVADAS (Qualidade, Eficiência, etc.)
    // =============================================================================
    const tasksWithGrades = taskList.filter(t => t.notaTeste !== null && t.notaTeste !== undefined);
    const qualityScores = tasksWithGrades.map(t => (t.notaTeste ?? 0) * 20);
    const avgQualityScore = qualityScores.length > 0 ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length : 0;

    taskList.map(t => calculateTaskMetrics(t, false));
    
    const performanceScores = taskList.map(calculateTaskPerformanceScore);
    const avgPerformanceScore = performanceScores.reduce((sum, p) => sum + p, 0) / performanceScores.length;
    
    const avgComplexity = taskList.reduce((sum, t) => sum + t.complexidade, 0) / taskList.length;
    
    // IMPORTANT: Only completed tasks are considered for performance calculations
    const completed = taskList.filter(t => isCompletedStatus(t.status)).length;
    const completionRate = taskList.length > 0 ? (completed / taskList.length) * 100 : 0;
    
    results.push({
      [groupBy === 'feature' ? 'feature' : 'module']: key,
      taskCount: taskList.length,
      totalHoursWorked,
      totalHoursEstimated,
      avgAccuracyRate,
      avgQualityScore,
      avgPerformanceScore,
      avgComplexity,
      completionRate,
      tasks: taskList,
      // Add new breakdown metrics
      bugAccuracyRate,
      featureEstimationAccuracy,
      bugs,
      features,
    });
  });
  
  // Sort by performance score descending
  return results.sort((a, b) => b.avgPerformanceScore - a.avgPerformanceScore);
}

/**
 * Calculate detailed complexity analysis
 */
function calculateComplexityDetailedAnalysis(
  tasks: TaskItem[]
): ComplexityDetailedAnalysis[] {
  const grouped = new Map<number, TaskItem[]>();
  
  // Group by complexity level
  [1, 2, 3, 4, 5].forEach(level => {
    grouped.set(level, tasks.filter(t => t.complexidade === level));
  });
  
  const results: ComplexityDetailedAnalysis[] = [];
  
  grouped.forEach((taskList, level) => {
    if (taskList.length === 0) {
      results.push({
        level,
        taskCount: 0,
        totalHoursWorked: 0,
        totalHoursEstimated: 0,
        avgAccuracyRate: 0,
        avgQualityScore: 0,
        avgPerformanceScore: 0,
        avgHoursPerTask: 0,
        bestPerformance: false,
        tasks: [],
        bugAccuracyRate: 0,
        featureEstimationAccuracy: 0,
        bugs: [],
        features: [],
      });
      return;
    }
    
    // For complexity analysis (all sprints), use tempoGastoTotal (total historical hours)
    const totalHoursWorked = taskList.reduce((sum, t) => 
      sum + (t.tempoGastoTotal ?? 0), 0
    );
    const totalHoursEstimated = taskList.reduce((sum, t) => 
      sum + (t.estimativaRestante ?? t.estimativa), 0
    );
    
    const avgHoursPerTask = totalHoursWorked / taskList.length;

    // Reworked accuracy calculation
    const taskMetrics = taskList.map(t => calculateTaskMetrics(t, false));
    const completedMetrics = taskMetrics.filter(t => isCompletedStatus(t.task.status) && t.hoursEstimated > 0);

    const bugs = completedMetrics.filter(t => t.task.tipo === 'Bug');
    const features = completedMetrics.filter(t => t.task.tipo !== 'Bug');

    const efficientBugs = bugs.filter(t => t.efficiencyImpact?.isEfficient).length;
    const bugAccuracyRate = bugs.length > 0 ? (efficientBugs / bugs.length) * 100 : 0;

    const featureDeviations = features.map(t => t.estimationAccuracy);
    const featureEstimationAccuracy = featureDeviations.length > 0
      ? featureDeviations.reduce((sum, d) => sum + d, 0) / featureDeviations.length
      : 0;
    
    // NEW weighted calculation for overall accuracy
    let weightedEfficientScore = 0;
    completedMetrics.forEach(t => {
      if (t.efficiencyImpact && t.efficiencyImpact.type === 'complexity_zone') {
        if (t.efficiencyImpact.zone === 'efficient') {
          weightedEfficientScore += 1;
        } else if (t.efficiencyImpact.zone === 'acceptable') {
          weightedEfficientScore += 0.5;
        }
      } else {
        const deviation = t.estimationAccuracy;
        const threshold = getEfficiencyThreshold(t.complexityScore);
        const isEfficient = deviation > 0 ? true : deviation >= threshold.slower;
        if (isEfficient) {
          weightedEfficientScore += 1;
        }
      }
    });

    const avgAccuracyRate = completedMetrics.length > 0
      ? (weightedEfficientScore / completedMetrics.length) * 100
      : 0;
    
    // =============================================================================
    // 5. CALCULAR MÉTRICAS DERIVADAS (Qualidade, Eficiência, etc.)
    // =============================================================================
    const tasksWithGrades = taskList.filter(t => t.notaTeste !== null && t.notaTeste !== undefined);
    const qualityScores = tasksWithGrades.map(t => (t.notaTeste ?? 0) * 20);
    const avgQualityScore = qualityScores.length > 0 ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length : 0;

    taskList.map(t => calculateTaskMetrics(t, false));

    const performanceScores = taskList.map(calculateTaskPerformanceScore);
    const avgPerformanceScore = performanceScores.reduce((sum, p) => sum + p, 0) / performanceScores.length;
    
    results.push({
      level,
      taskCount: taskList.length,
      totalHoursWorked,
      totalHoursEstimated,
      avgAccuracyRate,
      avgQualityScore,
      avgPerformanceScore,
      avgHoursPerTask,
      bestPerformance: false, // Will be set later
      tasks: taskList,
      bugAccuracyRate,
      featureEstimationAccuracy,
      bugs,
      features,
    });
  });
  
  // Find best performance level
  const nonEmpty = results.filter(r => r.taskCount > 0);
  if (nonEmpty.length > 0) {
    const best = nonEmpty.reduce((max, current) => 
      current.avgPerformanceScore > max.avgPerformanceScore ? current : max
    );
    best.bestPerformance = true;
  }
  
  return results;
}

/**
 * Generate insights based on detailed analytics
 */
function generateDetailedInsights(analytics: Omit<DeveloperDetailedAnalytics, 'insights'>): DeveloperDetailedAnalytics['insights'] {
  const insights: DeveloperDetailedAnalytics['insights'] = [];
  
  // Feature/Module insights
  if (analytics.byFeature.length > 0) {
    const bestFeature = analytics.byFeature[0];
    const worstFeature = analytics.byFeature[analytics.byFeature.length - 1];
    
    if (bestFeature.avgPerformanceScore > worstFeature.avgPerformanceScore + 15) {
      insights.push({
        type: 'recommendation',
        title: 'Especialização por Feature Detectada',
        description: `Você tem ${bestFeature.avgPerformanceScore.toFixed(0)}% de performance em "${bestFeature.feature}" vs ${worstFeature.avgPerformanceScore.toFixed(0)}% em "${worstFeature.feature}".`,
        recommendation: `Considere ser mentor/lead em "${bestFeature.feature}" ou receber treinamento em "${worstFeature.feature}".`,
      });
    }
  }
  
  if (analytics.byModule.length > 0) {
    const bestModule = analytics.byModule[0];
    const worstModule = analytics.byModule[analytics.byModule.length - 1];
    
    if (bestModule.avgPerformanceScore > worstModule.avgPerformanceScore + 15) {
      insights.push({
        type: 'recommendation',
        title: 'Especialização por Módulo Detectada',
        description: `Você performa ${(bestModule.avgPerformanceScore - worstModule.avgPerformanceScore).toFixed(0)}% melhor no módulo "${bestModule.module}" comparado com "${worstModule.module}".`,
        recommendation: `Considere ser referência técnica em "${bestModule.module}" ou expandir conhecimento em "${worstModule.module}".`,
      });
    }
  }
  
  // Complexity insights
  if (analytics.bestComplexityLevel > 0) {
    const bestComplexity = analytics.byComplexity.find(c => c.level === analytics.bestComplexityLevel);
    if (bestComplexity && bestComplexity.taskCount >= 3) {
      insights.push({
        type: 'positive',
        title: 'Excelente Performance em Tarefas Complexas',
        description: `Você performa melhor em tarefas de complexidade nível ${analytics.bestComplexityLevel} com ${bestComplexity.avgPerformanceScore.toFixed(0)}% de performance score.`,
        recommendation: `Considere ser alocado para mais tarefas de nível ${analytics.bestComplexityLevel} para maximizar seu impacto.`,
      });
    }
  }
  
  return insights;
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Calculate detailed analytics for a single developer
 */
export function calculateDetailedDeveloperAnalytics(
  tasks: TaskItem[],
  developerId: string,
  developerName: string
): DeveloperDetailedAnalytics {
  // IMPORTANT: Explicitly exclude tasks without sprint (backlog) - they don't interfere in detailed analytics
  // IMPORTANT: Also exclude auxilio and neutral tasks from detailed analysis
  const developerTasks = tasks.filter(t => 
    t.idResponsavel === developerId && 
    t.sprint && 
    t.sprint.trim() !== '' &&
    !isAuxilioTask(t) &&
    !isNeutralTask(t)
  );
  
  // Calculate by feature and module
  const byFeature = calculateFeatureModulePerformance(developerTasks, 'feature');
  const byModule = calculateFeatureModulePerformance(developerTasks, 'module');
  
  // Calculate complexity analysis
  const byComplexity = calculateComplexityDetailedAnalysis(developerTasks);
  const bestComplexityLevel = byComplexity.find(c => c.bestPerformance && c.taskCount > 0)?.level ?? 0;
  
  // Determine complexity preference
  const totalByComplexity = byComplexity.filter(c => c.taskCount > 0);
  const simpleCount = totalByComplexity.filter(c => c.level <= 2).reduce((sum, c) => sum + c.taskCount, 0);
  const mediumCount = totalByComplexity.filter(c => c.level === 3).reduce((sum, c) => sum + c.taskCount, 0);
  const complexCount = totalByComplexity.filter(c => c.level >= 4).reduce((sum, c) => sum + c.taskCount, 0);
  const totalTasks = simpleCount + mediumCount + complexCount;
  
  let complexityPreference: 'simple' | 'medium' | 'complex' | 'mixed';
  if (totalTasks === 0) {
    complexityPreference = 'mixed';
  } else {
    const simpleRatio = simpleCount / totalTasks;
    const mediumRatio = mediumCount / totalTasks;
    const complexRatio = complexCount / totalTasks;
    
    if (complexRatio > 0.4) complexityPreference = 'complex';
    else if (mediumRatio > 0.4) complexityPreference = 'medium';
    else if (simpleRatio > 0.5) complexityPreference = 'simple';
    else complexityPreference = 'mixed';
  }
  
  const analyticsWithoutInsights: Omit<DeveloperDetailedAnalytics, 'insights'> = {
    developerId,
    developerName,
    byFeature,
    byModule,
    byComplexity,
    bestComplexityLevel,
    complexityPreference,
  };
  
  const insights = generateDetailedInsights(analyticsWithoutInsights);
  
  return {
    ...analyticsWithoutInsights,
    insights,
  };
}

