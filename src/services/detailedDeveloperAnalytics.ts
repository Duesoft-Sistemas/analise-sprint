import { TaskItem, SprintMetadata } from '../types';
import { isCompletedStatus } from '../utils/calculations';

// =============================================================================
// TYPES
// =============================================================================

export interface FeatureModulePerformance {
  feature?: string;
  module?: string;
  taskCount: number;
  totalHoursWorked: number;
  totalHoursEstimated: number;
  avgAccuracyRate: number;
  avgQualityScore: number;
  avgPerformanceScore: number;
  avgComplexity: number;
  completionRate: number;
  tasks: TaskItem[];
}

export interface ComplexityDetailedAnalysis {
  level: number;
  taskCount: number;
  totalHoursWorked: number;
  totalHoursEstimated: number;
  avgAccuracyRate: number;
  avgQualityScore: number;
  avgPerformanceScore: number;
  avgHoursPerTask: number;
  bestPerformance: boolean; // Se este é o nível onde o dev performa melhor
  tasks: TaskItem[];
}

export interface WorkloadCapacityAnalysis {
  sprintName: string;
  hoursWorked: number;
  hoursEstimated: number;
  utilizationRate: number;
  qualityScore: number;
  performanceScore: number;
  overcapacity: boolean; // Se trabalhou mais de 45h
  qualityImpact: number; // Diferença de qualidade vs média pessoal quando sobrecarregado
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
  
  // Workload e Capacidade
  workloadAnalysis: WorkloadCapacityAnalysis[];
  averageOptimalHours: number; // Média de horas onde performa melhor
  capacityThreshold: number; // Limite de horas onde qualidade começa a cair
  overloadFrequency: number; // % de sprints onde trabalhou >45h
  
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
    
    const accuracyRates = taskList.map(calculateTaskAccuracyRate);
    const avgAccuracyRate = accuracyRates.reduce((sum, a) => sum + a, 0) / accuracyRates.length;
    
    const qualityScores = taskList.map(t => (t.notaTeste ?? 5) * 20);
    const avgQualityScore = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
    
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
    
    const accuracyRates = taskList.map(calculateTaskAccuracyRate);
    const avgAccuracyRate = accuracyRates.reduce((sum, a) => sum + a, 0) / accuracyRates.length;
    
    const qualityScores = taskList.map(t => (t.notaTeste ?? 5) * 20);
    const avgQualityScore = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
    
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
 * Calculate workload and capacity analysis
 */
function calculateWorkloadCapacityAnalysis(
  tasks: TaskItem[],
  sprints: SprintMetadata[]
): WorkloadCapacityAnalysis[] {
  const sprintMap = new Map<string, SprintMetadata>();
  sprints.forEach(s => sprintMap.set(s.sprint, s));
  
  const sprintGroups = new Map<string, TaskItem[]>();
  
  tasks.forEach(task => {
    if (!sprintGroups.has(task.sprint)) {
      sprintGroups.set(task.sprint, []);
    }
    sprintGroups.get(task.sprint)!.push(task);
  });
  
  const results: WorkloadCapacityAnalysis[] = [];
  const sprintPerformanceScores: Map<string, number> = new Map();
  
  sprintGroups.forEach((taskList, sprintName) => {
    // For workload analysis per sprint, use tempoGastoNoSprint (hours in that specific sprint)
    // This is correct because we're grouping by sprint and analyzing each sprint separately
    const hoursWorked = taskList.reduce((sum, t) => 
      sum + (t.tempoGastoNoSprint ?? 0), 0
    );
    const hoursEstimated = taskList.reduce((sum, t) => 
      sum + (t.estimativaRestante ?? t.estimativa), 0
    );
    
    const utilizationRate = (hoursWorked / 40) * 100;
    
    const qualityScores = taskList.map(t => (t.notaTeste ?? 5) * 20);
    const avgQualityScore = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
    
    const performanceScores = taskList.map(calculateTaskPerformanceScore);
    const avgPerformanceScore = performanceScores.reduce((sum, p) => sum + p, 0) / performanceScores.length;
    
    sprintPerformanceScores.set(sprintName, avgPerformanceScore);
    
    results.push({
      sprintName,
      hoursWorked,
      hoursEstimated,
      utilizationRate,
      qualityScore: avgQualityScore,
      performanceScore: avgPerformanceScore,
      overcapacity: hoursWorked > 45,
      qualityImpact: 0, // Will be calculated after we have all data
    });
  });
  
  // Calculate quality impact (difference when overcapacity)
  const avgQualityNormal = results
    .filter(r => !r.overcapacity)
    .reduce((sum, r) => sum + r.qualityScore, 0) / 
    Math.max(1, results.filter(r => !r.overcapacity).length);
  
  results.forEach(r => {
    if (r.overcapacity) {
      r.qualityImpact = avgQualityNormal - r.qualityScore;
    }
  });
  
  return results.sort((a, b) => 
    new Date(sprintMap.get(a.sprintName)?.dataInicio ?? 0).getTime() -
    new Date(sprintMap.get(b.sprintName)?.dataInicio ?? 0).getTime()
  );
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
  
  // Workload insights
  if (analytics.overloadFrequency > 30) {
      insights.push({
        type: 'recommendation',
        title: 'Alta Frequência de Sobrecarga',
        description: `${analytics.overloadFrequency.toFixed(0)}% dos sprints você trabalhou mais de 45h/semana.`,
        recommendation: `Considere melhorar o gerenciamento de carga. Sua qualidade média cai quando sobrecarregado.`,
      });
  }
  
  if (analytics.capacityThreshold > 0 && analytics.averageOptimalHours > 0) {
    insights.push({
      type: 'neutral',
      title: 'Capacidade Ótima Identificada',
      description: `Sua performance é melhor quando trabalha entre ${analytics.averageOptimalHours.toFixed(0)}h e ${analytics.capacityThreshold.toFixed(0)}h por sprint.`,
      recommendation: `Mantenha sua carga de trabalho dentro desta faixa para otimizar performance e qualidade.`,
    });
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
  sprints: SprintMetadata[],
  developerId: string,
  developerName: string
): DeveloperDetailedAnalytics {
  const developerTasks = tasks.filter(t => t.idResponsavel === developerId);
  
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
  
  // Calculate workload analysis
  const workloadAnalysis = calculateWorkloadCapacityAnalysis(developerTasks, sprints);
  
  // Calculate optimal hours and capacity threshold
  const normalWorkloads = workloadAnalysis.filter(w => !w.overcapacity && w.hoursWorked > 0);
  const averageOptimalHours = normalWorkloads.length > 0
    ? normalWorkloads.reduce((sum, w) => sum + w.hoursWorked, 0) / normalWorkloads.length
    : 40;
  
  // Capacity threshold: where quality starts to drop
  const overcapacityWorkloads = workloadAnalysis.filter(w => w.overcapacity);
  const capacityThreshold = overcapacityWorkloads.length > 0 && normalWorkloads.length > 0
    ? Math.min(...normalWorkloads.map(w => w.hoursWorked).filter(h => h > 0))
    : 45;
  
  const overloadFrequency = workloadAnalysis.length > 0
    ? (workloadAnalysis.filter(w => w.overcapacity).length / workloadAnalysis.length) * 100
    : 0;
  
  const analyticsWithoutInsights: Omit<DeveloperDetailedAnalytics, 'insights'> = {
    developerId,
    developerName,
    byFeature,
    byModule,
    byComplexity,
    bestComplexityLevel,
    complexityPreference,
    workloadAnalysis,
    averageOptimalHours,
    capacityThreshold,
    overloadFrequency,
  };
  
  const insights = generateDetailedInsights(analyticsWithoutInsights);
  
  return {
    ...analyticsWithoutInsights,
    insights,
  };
}

