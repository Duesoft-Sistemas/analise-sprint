import {
  TaskItem,
  TaskPerformanceMetrics,
  SprintPerformanceMetrics,
  AllSprintsPerformanceMetrics,
  DeveloperComparison,
  PerformanceInsight,
  PerformanceAnalytics,
  MetricExplanation,
  CustomPeriodMetrics,
} from '../types';
import { isCompletedStatus, isNeutralTask, isAuxilioTask, isImpedimentoTrabalhoTask, normalizeForComparison, formatHours } from '../utils/calculations';
import {
  getEfficiencyThreshold as getThresholdFromConfig,
  checkComplexityZoneEfficiency,
  MAX_SENIORITY_EFFICIENCY_BONUS,
  MAX_COMPLEXITY_3_BONUS,
  AUXILIO_BONUS_SCALE,
} from '../config/performanceConfig';

// =============================================================================
// METRIC EXPLANATIONS - Como cada métrica é calculada
// =============================================================================

export const METRIC_EXPLANATIONS: Record<string, MetricExplanation> = {
  estimationAccuracy: {
    formula: '((Tempo Estimado - Tempo Gasto) / Tempo Estimado) × 100',
    description: 'Mede o desvio percentual entre o tempo estimado e o tempo gasto em cada tarefa',
    interpretation: 'Valores negativos = subestimou (gastou mais que estimado). Valores positivos = superestimou (gastou menos que estimado). Valor 0 = estimativa perfeita. Esta métrica alimenta a Eficiência de Execução.',
    example: 'Estimou 10h, gastou 12h = -20% (subestimou em 20%)',
  },
  
  accuracyRate: {
    formula: '(Tarefas eficientes / Total) × 100. Avaliação separada: Bugs usam zona de eficiência (todas complexidades), Features usam apenas desvio percentual',
    description: '⭐ EFICIÊNCIA DE EXECUÇÃO: Percentual de tarefas executadas de forma eficiente. SISTEMA SEPARADO: BUGS - Complexidades 1-5 usam zona de eficiência (APENAS horas gastas). FEATURES - Todas usam desvio percentual (compara estimativa vs horas gastas). Representa 50% do seu Performance Score.',
    interpretation: 'Quanto maior, mais eficiente você é. IMPORTANTE: BUGS são avaliados por zona de complexidade (não penalizados por estimativa ruim). FEATURES são avaliadas por desvio percentual (dev deve executar conforme estimativa). BUGS: Complexidade 1 gastou 3h = ✅ eficiente (≤4h aceitável). Complexidade 5 gastou 14h = ✅ eficiente (≤16h). FEATURES: Complexidade 1 estimou 10h, gastou 12h (-20%) = ❌ ineficiente (limite -15%). Complexidade 5 estimou 30h, gastou 35h (-16%) = ✅ eficiente (limite -40%).',
    example: 'Bug complexidade 1 gastou 3h = ✅ eficiente (zona: ≤4h aceitável). Bug complexidade 5 gastou 14h = ✅ eficiente (zona: ≤16h). Feature complexidade 1 estimou 10h, gastou 8h (+20%) = ✅ eficiente (≤+50% permitido). Feature complexidade 4 estimou 10h, gastou 15h (-50%) = ❌ ineficiente (limite -30%).',
  },
  
  bugRate: {
    formula: '(Tarefas tipo Bug / Total de Tarefas) × 100',
    description: '⚠️ MÉTRICA INFORMATIVA (não impacta o Performance Score): Percentual de tarefas que são correções de bugs. Bugs são apenas um tipo de tarefa como qualquer outro.',
    interpretation: 'Esta métrica mostra apenas a distribuição de tipos de trabalho. Um dev que pega muitos bugs não está pior - está apenas trabalhando em correções ao invés de features. O Performance Score avalia qualidade via Nota de Teste, não pelo tipo de tarefa.',
    example: '3 bugs de 10 tarefas = 30% de bugs. Isso não indica performance ruim - apenas mostra que 30% do trabalho foi em correções.',
  },
  
  qualityScore: {
    formula: 'Nota de Teste Média × 20 (nota 1–5 escalada para 0–100)',
    description: 'Score de qualidade baseado na Nota de Teste. Tarefas sem nota são desconsideradas. Representa 50% do Performance Score.',
    interpretation: 'Quanto maior, melhor a qualidade. 100 = Perfeito. <60 = Precisa Atenção.',
    example: 'Nota média 4.0 → 80 de quality score. Tarefa sem nota não entra no cálculo.',
  },
  
  utilizationRate: {
    formula: '(Total de Horas Trabalhadas / 40h) × 100',
    description: '⚠️ MÉTRICA DE CONTEXTO (não impacta o Performance Score): Percentual de utilização da capacidade semanal (assumindo 40h). Como todos os desenvolvedores registram ~40h, esta métrica serve apenas para identificar sobrecarga.',
    interpretation: '>100% = sobrecarga (risco de burnout), 80-100% = bem utilizado, <80% = pode receber mais tarefas. Esta métrica é útil para gestão de carga, mas não diferencia performance individual.',
    example: '36h trabalhadas / 40h = 90% de utilização',
  },
  
  completionRate: {
    formula: '(Tarefas Concluídas / Tarefas Iniciadas) × 100',
    description: '⚠️ MÉTRICA INFORMATIVA (não impacta o Performance Score): Percentual de tarefas que foram finalizadas em relação às iniciadas. Esta métrica não faz parte do score pois pode ser afetada por interrupções e realocações que não são culpa do desenvolvedor.',
    interpretation: 'Mostra apenas a distribuição de trabalho (concluído vs iniciado). Valores baixos podem indicar interrupções, mas não necessariamente performance ruim. O Performance Score foca em qualidade e eficiência - coisas que o dev controla diretamente.',
    example: '8 concluídas de 10 iniciadas = 80% de conclusão. Isso não afeta seu score.',
  },
  
  consistencyScore: {
    formula: '100 - (Desvio Padrão das Estimativas / Média × 100)',
    description: 'Mede a consistência nas estimativas (inverso da variação)',
    interpretation: 'Quanto maior, mais consistente. Alta variação pode indicar dificuldade com certos tipos de tarefa.',
    example: 'Desvio padrão baixo = estimativas consistentes = score alto',
  },
  
  performanceScore: {
    formula: 'Base: (50% × Qualidade) + (50% × Eficiência) + Bônus (Senioridade + Comp. Média + Auxílio)',
    description: 'Score geral ponderado combinando qualidade (Nota de Teste) e eficiência. BÔNUS DE SENIORIDADE: Executar tarefas complexas (nível 4-5) com alta eficiência adiciona até +15 pontos. BÔNUS DE COMPETÊNCIA: Executar tarefas de complexidade média (nível 3) com alta eficiência adiciona um bônus de até +5 pontos. BÔNUS DE AUXÍLIOS: Ajudar outros desenvolvedores adiciona até +10 pontos. O score máximo é 130.',
    interpretation: '115+ = excepcional (com bônus), 90-114 = excelente, 75-89 = muito bom, 60-74 = bom, 45-59 = adequado, <45 = precisa melhorias. O Bônus de Senioridade recompensa a execução de tarefas de alta complexidade, enquanto o Bônus de Competência incentiva a eficiência em tarefas de média complexidade. Ambos são indicadores chave de desempenho.',
    example: 'Base: Qualidade 90 + Eficiência 75 = 82.5. Bônus: +12 (senioridade) + 4 (comp. média) + 7 (auxílio) = 105.5. Score Final: 105.5 🏆⭐',
  },
  
  bugsVsFeatures: {
    formula: 'Número de Bugs / Número de Features (Tarefas + Histórias)',
    description: '⚠️ MÉTRICA INFORMATIVA (não impacta o Performance Score): Razão entre trabalho corretivo (bugs) e trabalho novo (features). Mostra apenas a distribuição de tipos de trabalho.',
    interpretation: 'Valores maiores indicam mais trabalho em correções, menores indicam mais trabalho em features. Isso NÃO avalia performance - um dev pode ter ratio alto simplesmente porque foi alocado para correções. O Performance Score não considera o tipo de tarefa.',
    example: '2 bugs e 8 features = 0.25 (para cada 4 features, 1 bug). Isso mostra apenas a distribuição de trabalho, não qualidade.',
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
  
  const threshold = 0.5;
  
  if (slope > threshold) return 'improving';
  if (slope < -threshold) return 'declining';
  return 'stable';
}

// =============================================================================
// COMPLEXITY-BASED THRESHOLDS
// =============================================================================

function getEfficiencyThreshold(complexity: number): { faster: number; slower: number } {
  const threshold = getThresholdFromConfig(complexity);
  return { faster: threshold.faster, slower: threshold.slower };
}

// =============================================================================
// BONUS CALCULATIONS
// =============================================================================

function calculateEfficiencyBonuses(
  taskMetrics: TaskPerformanceMetrics[]
): { 
  seniorityBonus: number; 
  competenceBonus: number;
  seniorityBonusTasks: TaskItem[];
  competenceBonusTasks: TaskItem[];
} {
  const seniorityBonusTasks: TaskItem[] = [];
  const competenceBonusTasks: TaskItem[] = [];

  // Tarefas de Senioridade (nível 4 e 5)
  const seniorTasks = taskMetrics.filter(t => 
    t.complexityScore >= 4 && t.hoursEstimated > 0
  );
  
  // Tarefas de complexidade média (nível 3)
  const mediumTasks = taskMetrics.filter(t => 
    t.complexityScore === 3 && t.hoursEstimated > 0
  );
  
  let seniorBonus = 0;
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

      if (isEfficient) {
        seniorityBonusTasks.push(task.task);
      }
    }
    const seniorEfficiencyScore = highlyEfficientSenior / seniorTasks.length;
    seniorBonus = seniorEfficiencyScore * MAX_SENIORITY_EFFICIENCY_BONUS;
  }
  
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

      if (isEfficient) {
        competenceBonusTasks.push(task.task);
      }
    }
    const mediumEfficiencyScore = highlyEfficientMedium / mediumTasks.length;
    competenceBonus = mediumEfficiencyScore * MAX_COMPLEXITY_3_BONUS;
  }
  
  return {
    seniorityBonus: Math.round(seniorBonus),
    competenceBonus: Math.round(competenceBonus),
    seniorityBonusTasks,
    competenceBonusTasks,
  };
}

function calculateAuxilioBonus(auxilioHours: number): number {
  if (auxilioHours <= 0) return 0;
  
  for (const scale of AUXILIO_BONUS_SCALE) {
    if (auxilioHours >= scale.minHours) {
      return scale.points;
    }
  }
  
  return 0;
}

// =============================================================================
// TASK-LEVEL METRICS
// =============================================================================

export function calculateTaskMetrics(task: TaskItem, useSprintOnly: boolean = false): TaskPerformanceMetrics {
  const hoursSpent = useSprintOnly ? (task.tempoGastoNoSprint ?? 0) : (task.tempoGastoTotal ?? 0);
  const hoursEstimated = Number(task.estimativa) || 0;
  
  let estimationAccuracy = 0;
  if (hoursEstimated > 0) {
    estimationAccuracy = ((hoursEstimated - hoursSpent) / hoursEstimated) * 100;
  }
  
  const isOnTime = hoursSpent <= hoursEstimated;
  
  const efficiencyImpact = checkComplexityZoneEfficiency(
    task.complexidade,
    hoursSpent,
    hoursEstimated,
    task.tipo
  );
  
  return {
    task,
    estimationAccuracy,
    isOnTime,
    complexityScore: task.complexidade,
    hoursSpent,
    hoursEstimated,
    efficiencyImpact,
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
  const devTasks = tasks.filter(
    t => t.idResponsavel === developerId && 
         t.sprint === sprintName &&
         t.sprint && 
         t.sprint.trim() !== ''
  );
  
  if (devTasks.length === 0) {
    return createEmptySprintMetrics(developerId, developerName, sprintName);
  }
  
  const neutralTasks = devTasks.filter(t => isNeutralTask({ detalhesOcultos: t.detalhesOcultos }));
  const neutralHours = neutralTasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0);
  
  // Exclude impedimento trabalho tasks from performance calculations
  // These tasks are imported for hour tracking but excluded from performance/score
  const impedimentoTasks = devTasks.filter(t => isImpedimentoTrabalhoTask(t));
  const impedimentoHours = impedimentoTasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0);
  
  // Work tasks exclude both neutral and impedimento tasks
  const workTasks = devTasks.filter(t => 
    !isNeutralTask({ detalhesOcultos: t.detalhesOcultos }) && 
    !isImpedimentoTrabalhoTask(t)
  );
  
  // Task metrics for all tasks (for display purposes, but impedimento excluded from performance)
  const taskMetrics = devTasks
    .filter(t => !isImpedimentoTrabalhoTask(t))
    .map(t => calculateTaskMetrics(t, false));
  
  const completedTasks = workTasks.filter(t => isCompletedStatus(t.status));
  const completedMetrics = completedTasks.map(t => calculateTaskMetrics(t, false));
  
  const totalHoursWorked = devTasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0);
  const totalHoursEstimated = completedTasks.reduce((sum, t) => {
    const estimate = Number(t.estimativa) || 0;
    return sum + estimate;
  }, 0);
  const tasksCompleted = completedTasks.length;
  const tasksStarted = devTasks.length;
  const averageHoursPerTask = tasksCompleted > 0 
    ? completedTasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0) / tasksCompleted 
    : 0;
  
  const completedWithEstimates = completedMetrics.filter(t => t.hoursEstimated > 0);
  let estimationAccuracy = 0;
  let accuracyRate = 0;
  let tasksImpactedByComplexityZone = 0;
  
  const bugMetrics = completedWithEstimates.filter(t => t.task.tipo === 'Bug');
  const featureMetrics = completedWithEstimates.filter(t => t.task.tipo !== 'Bug');
  
  const efficientBugs = bugMetrics.filter(t => {
    if (t.efficiencyImpact && t.efficiencyImpact.type === 'complexity_zone') {
      return t.efficiencyImpact.isEfficient;
    }
    const deviation = t.estimationAccuracy;
    const threshold = getEfficiencyThreshold(t.complexityScore);
    return deviation > 0 ? true : deviation >= threshold.slower;
  }).length;
  const bugAccuracyRate = bugMetrics.length > 0 ? (efficientBugs / bugMetrics.length) * 100 : 0;
  
  const featureDeviations = featureMetrics.map(t => t.estimationAccuracy);
  const featureEstimationAccuracy = featureDeviations.length > 0
    ? featureDeviations.reduce((sum, d) => sum + d, 0) / featureDeviations.length
    : 0;
  
  if (completedWithEstimates.length > 0) {
    const deviations = completedWithEstimates.map(t => t.estimationAccuracy);
    estimationAccuracy = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    
    let weightedEfficientScore = 0;
    completedWithEstimates.forEach(t => {
      if (t.efficiencyImpact && t.efficiencyImpact.type === 'complexity_zone') {
        tasksImpactedByComplexityZone++;
        if (t.efficiencyImpact.zone === 'efficient') {
          weightedEfficientScore += 1;
        } else if (t.efficiencyImpact.zone === 'acceptable') {
          weightedEfficientScore += 0.5;
        }
      } else {
        const deviation = t.estimationAccuracy;
        const threshold = getEfficiencyThreshold(t.complexityScore);
        const isEfficient = deviation > 0 || (deviation >= threshold.slower && deviation <= 0);
        if (isEfficient) {
          weightedEfficientScore += 1;
        }
      }
    });

    accuracyRate = (weightedEfficientScore / completedWithEstimates.length) * 100;
  }
  
  const tendsToOverestimate = estimationAccuracy > 10;
  const tendsToUnderestimate = estimationAccuracy < -10;

  const bugTasks = completedTasks.filter(t => t.tipo === 'Bug').length;
  const bugRate = tasksCompleted > 0 ? (bugTasks / tasksCompleted) * 100 : 0;
  
  const featureTasks = completedTasks.filter(t => t.tipo === 'Tarefa' || t.tipo === 'História').length;
  const bugsVsFeatures = featureTasks > 0 ? bugTasks / featureTasks : 0;
  
  const qualityTasks = completedTasks.filter(t => 
    !isAuxilioTask(t) && 
    !isNeutralTask(t) && 
    !isImpedimentoTrabalhoTask(t) &&
    t.notaTeste !== null && 
    t.notaTeste !== undefined
  );
  const testNotes = qualityTasks.map(t => t.notaTeste as number);
  const avgTestNote = testNotes.length > 0 ? (testNotes.reduce((s, n) => s + n, 0) / testNotes.length) : 0;
  const testScore = testNotes.length > 0 ? Math.max(0, Math.min(100, avgTestNote * 20)) : 0;
  const qualityScore = testScore;
  
  const utilizationRate = (totalHoursWorked / 40) * 100;
  
  const completionRate = tasksStarted > 0 ? (tasksCompleted / tasksStarted) * 100 : 0;
  
  const avgTimeToComplete = tasksCompleted > 0
    ? completedTasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0) / tasksCompleted
    : 0;
  
  let consistencyScore = 50;
  if (completedWithEstimates.length > 1) {
    const deviations = completedWithEstimates.map(t => Math.abs(t.estimationAccuracy));
    const stdDev = calculateStdDev(deviations);
    const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    const coefficientOfVariation = avgDeviation > 0 ? (stdDev / avgDeviation) : 0;
    consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 50));
  }
  
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
  
  const executionEfficiency = accuracyRate;

  const scoreHasQuality = qualityTasks.length > 0;

  const baseScoreFinal = scoreHasQuality
    ? ((qualityScore * 0.50) + (executionEfficiency * 0.50))
    : executionEfficiency;
  
  const { seniorityBonus, competenceBonus, seniorityBonusTasks, competenceBonusTasks } = calculateEfficiencyBonuses(completedMetrics);
  
  // Bônus de Auxílio: calcula horas de auxílio de TODAS as tarefas (incluindo não concluídas)
  // Isso permite que tarefas de auxílio contínuas que atravessam múltiplos sprints sejam devidamente recompensadas
  const auxilioTasks = devTasks.filter(t => isAuxilioTask({ detalhesOcultos: t.detalhesOcultos }));
  const auxilioHours = auxilioTasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0);
  const auxilioBonus = calculateAuxilioBonus(auxilioHours);
  
  const performanceScore = Math.min(130, baseScoreFinal + seniorityBonus + competenceBonus + auxilioBonus);
  
  return {
    developerId,
    developerName,
    sprintName,
    totalHoursWorked,
    totalHoursEstimated,
    tasksCompleted,
    tasksStarted,
    averageHoursPerTask,
    estimationAccuracy,
    accuracyRate,
    bugAccuracyRate,
    featureEstimationAccuracy,
    tendsToOverestimate,
    tendsToUnderestimate,
    bugRate,
    bugsVsFeatures,
    qualityScore,
    testScore,
    avgTestNote,
    reunioesHours: neutralHours,
    utilizationRate,
    completionRate,
    avgTimeToComplete,
    consistencyScore,
    avgComplexity,
    complexityDistribution,
    performanceByComplexity,
    performanceScore,
    baseScore: baseScoreFinal,
    seniorityEfficiencyBonus: seniorityBonus,
    competenceBonus: competenceBonus,
    auxilioBonus,
    overtimeBonus: 0,
    seniorityBonusTasks,
    competenceBonusTasks,
    overtimeBonusTasks: [],
    tasksImpactedByComplexityZone: tasksImpactedByComplexityZone || 0,
    complexityZoneImpactDetails: tasksImpactedByComplexityZone > 0
      ? `${tasksImpactedByComplexityZone} tarefa(s) ${tasksImpactedByComplexityZone === 1 ? 'foi' : 'foram'} avaliada(s) pela zona de eficiência por complexidade (horas excessivas para a complexidade)`
      : undefined,
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
    totalHoursEstimated: 0,
    tasksCompleted: 0,
    tasksStarted: 0,
    averageHoursPerTask: 0,
    estimationAccuracy: 0,
    accuracyRate: 0,
    bugAccuracyRate: 0,
    featureEstimationAccuracy: 0,
    tendsToOverestimate: false,
    tendsToUnderestimate: false,
    bugRate: 0,
    bugsVsFeatures: 0,
    qualityScore: 0,
    testScore: 0,
    avgTestNote: 0,
    reunioesHours: 0,
    utilizationRate: 0,
    completionRate: 0,
    avgTimeToComplete: 0,
    consistencyScore: 50,
    avgComplexity: 0,
    complexityDistribution: [1, 2, 3, 4, 5].map(level => ({ level, count: 0, avgAccuracy: 0 })),
    performanceByComplexity: [],
    performanceScore: 0,
    baseScore: 0,
    seniorityEfficiencyBonus: 0,
    competenceBonus: 0,
    auxilioBonus: 0,
    overtimeBonus: 0,
    seniorityBonusTasks: [],
    competenceBonusTasks: [],
    overtimeBonusTasks: [],
    tasksImpactedByComplexityZone: 0,
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
  const sprintMetrics = sprints.map(sprint =>
    calculateSprintPerformance(tasks, developerId, developerName, sprint)
  ).filter(m => m.tasksStarted > 0);
  
  if (sprintMetrics.length === 0) {
    return createEmptyAllSprintsMetrics(developerId, developerName);
  }
  
  const totalSprints = sprintMetrics.length;
  const totalHoursWorked = sprintMetrics.reduce((sum, m) => sum + m.totalHoursWorked, 0);
  const totalHoursEstimated = sprintMetrics.reduce((sum, m) => sum + m.totalHoursEstimated, 0);
  const totalTasksCompleted = sprintMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const totalTasksStarted = sprintMetrics.reduce((sum, m) => sum + m.tasksStarted, 0);
  const averageHoursPerSprint = totalHoursWorked / totalSprints;
  const averageTasksPerSprint = totalTasksCompleted / totalSprints;
  
  const avgEstimationAccuracy = sprintMetrics.reduce((sum, m) => sum + m.estimationAccuracy, 0) / totalSprints;
  const avgAccuracyRate = sprintMetrics.reduce((sum, m) => sum + m.accuracyRate, 0) / totalSprints;
  const avgBugRate = sprintMetrics.reduce((sum, m) => sum + m.bugRate, 0) / totalSprints;
  const avgQualityScore = sprintMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / totalSprints;
  const avgPerformanceScore = sprintMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / totalSprints;
  
  const utilizationRate = sprintMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) / totalSprints;
  const completionRate = sprintMetrics.reduce((sum, m) => sum + m.completionRate, 0) / totalSprints;
  const avgTimeToComplete = sprintMetrics.reduce((sum, m) => sum + m.avgTimeToComplete, 0) / totalSprints;
  const consistencyScore = sprintMetrics.reduce((sum, m) => sum + m.consistencyScore, 0) / totalSprints;
  
  const allTasksForComplexity = sprintMetrics.flatMap(m => m.tasks);
  const avgComplexity = allTasksForComplexity.length > 0
    ? allTasksForComplexity.reduce((sum, t) => sum + t.complexityScore, 0) / allTasksForComplexity.length
    : 0;
  
  const tendsToOverestimate = avgEstimationAccuracy > 10;
  const tendsToUnderestimate = avgEstimationAccuracy < -10;
  
  const complexityDistribution = [1, 2, 3, 4, 5].map(level => {
    const tasksAtLevel = allTasksForComplexity.filter(t => t.complexityScore === level);
    const count = tasksAtLevel.length;
    const avgAccuracy = count > 0
      ? tasksAtLevel.reduce((sum, t) => sum + Math.abs(t.estimationAccuracy), 0) / count
      : 0;
    
    return { level, count, avgAccuracy };
  });
  
  const accuracyValues = sprintMetrics.map(m => 100 - Math.abs(m.estimationAccuracy));
  const qualityValues = sprintMetrics.map(m => m.qualityScore);
  const productivityValues = sprintMetrics.map(m => m.totalHoursWorked);
  
  const accuracyTrend = determineTrend(accuracyValues);
  const qualityTrend = determineTrend(qualityValues);
  const productivityTrend = determineTrend(productivityValues);
  
  const sprintBreakdown = sprintMetrics.map(m => ({
    sprintName: m.sprintName,
    performanceScore: m.performanceScore,
    hoursWorked: m.totalHoursWorked,
    tasksCompleted: m.tasksCompleted,
    accuracy: 100 - Math.abs(m.estimationAccuracy),
    quality: m.qualityScore,
  }));
  
  const allTasks = allTasksForComplexity;
  const performanceByComplexity = [1, 2, 3, 4, 5].map(level => {
    const tasksAtLevel = allTasks.filter(t => t.complexityScore === level);
    const totalTasks = tasksAtLevel.length;
    const avgHours = totalTasks > 0
      ? tasksAtLevel.reduce((sum, t) => sum + t.hoursSpent, 0) / totalTasks
      : 0;
    const accuracy = totalTasks > 0
      ? tasksAtLevel.reduce((sum, t) => sum + t.estimationAccuracy, 0) / totalTasks
      : 0;
    
    return { level, totalTasks, avgHours, accuracy };
  });
  
  const performanceByType = (['Bug', 'Tarefa', 'História', 'Outro'] as const).map(type => {
    const tasksOfType = allTasks.filter(t => t.task.tipo === type);
    const count = tasksOfType.length;
    const avgHours = count > 0
      ? tasksOfType.reduce((sum, t) => sum + t.hoursSpent, 0) / count
      : 0;
    const accuracy = count > 0
      ? tasksOfType.reduce((sum, t) => sum + t.estimationAccuracy, 0) / count
      : 0;
    
    return { type, count, avgHours, accuracy };
  });
  
  return {
    developerId,
    developerName,
    totalSprints,
    totalHoursWorked,
    totalHoursEstimated,
    totalTasksCompleted,
    totalTasksStarted,
    averageHoursPerSprint,
    averageTasksPerSprint,
    avgEstimationAccuracy,
    avgAccuracyRate,
    avgBugRate,
    avgQualityScore,
    avgPerformanceScore,
    utilizationRate,
    completionRate,
    avgTimeToComplete,
    consistencyScore,
    avgComplexity,
    tendsToOverestimate,
    tendsToUnderestimate,
    complexityDistribution,
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
    totalHoursEstimated: 0,
    totalTasksCompleted: 0,
    totalTasksStarted: 0,
    averageHoursPerSprint: 0,
    averageTasksPerSprint: 0,
    avgEstimationAccuracy: 0,
    avgAccuracyRate: 0,
    avgBugRate: 0,
    avgQualityScore: 100,
    avgPerformanceScore: 0,
    utilizationRate: 0,
    completionRate: 0,
    avgTimeToComplete: 0,
    consistencyScore: 50,
    avgComplexity: 0,
    tendsToOverestimate: false,
    tendsToUnderestimate: false,
    complexityDistribution: [1, 2, 3, 4, 5].map(level => ({ level, count: 0, avgAccuracy: 0 })),
    accuracyTrend: 'stable',
    qualityTrend: 'stable',
    productivityTrend: 'stable',
    sprintBreakdown: [],
    performanceByComplexity: [1, 2, 3, 4, 5].map(level => ({
      level,
      totalTasks: 0,
      avgHours: 0,
      accuracy: 0,
    })),
    performanceByType: (['Bug', 'Tarefa', 'História', 'Outro'] as const).map(type => ({
      type,
      count: 0,
      avgHours: 0,
      accuracy: 0,
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
  
  if (metrics.accuracyRate >= 70) {
    insights.push({
      type: 'positive',
      title: 'Ótima Acurácia nas Estimativas',
      description: `${metrics.accuracyRate.toFixed(0)}% das tarefas ficaram dentro de ±20% da estimativa`,
      metric: 'accuracyRate',
      value: `${metrics.accuracyRate.toFixed(0)}%`,
    });
  } else if (metrics.accuracyRate < 50) {
    const variance = metrics.totalHoursWorked - metrics.totalHoursEstimated;
    const variancePercent = metrics.totalHoursEstimated > 0 
      ? ((variance / metrics.totalHoursEstimated) * 100).toFixed(0)
      : '0';
    const varianceSign = variance > 0 ? '+' : '';
    
    insights.push({
      type: 'negative',
      title: 'Baixa Eficiência de Execução',
      description: `Apenas ${metrics.accuracyRate.toFixed(0)}% das tarefas ficaram dentro de ±20% da estimativa. Estimado (concluídas): ${formatHours(metrics.totalHoursEstimated)} | Gasto (todas): ${formatHours(metrics.totalHoursWorked)} (${varianceSign}${variancePercent}%). Compare com a média da equipe para identificar se é um problema geral de estimativa ou individual.`,
      metric: 'accuracyRate',
      value: `${metrics.accuracyRate.toFixed(0)}%`,
      recommendation: 'Revisar processo de estimativa ou identificar se há necessidade de suporte técnico adicional.',
    });
  }
  
  if (metrics.tendsToUnderestimate) {
    const variance = metrics.totalHoursWorked - metrics.totalHoursEstimated;
    insights.push({
      type: 'warning',
      title: 'Tendência a Subestimar',
      description: `Média de ${Math.abs(metrics.estimationAccuracy).toFixed(0)}% abaixo das estimativas. Gastou ${formatHours(Math.abs(variance))} a mais que o estimado.`,
      metric: 'estimationAccuracy',
      value: `${metrics.estimationAccuracy.toFixed(1)}%`,
      recommendation: 'Adicionar buffer de tempo ou revisar complexidade das tarefas.',
    });
  } else if (metrics.tendsToOverestimate) {
    const variance = metrics.totalHoursEstimated - metrics.totalHoursWorked;
    insights.push({
      type: 'neutral',
      title: 'Tendência a Superestimar',
      description: `Média de ${metrics.estimationAccuracy.toFixed(0)}% acima das estimativas. Economizou ${formatHours(variance)} em relação ao estimado.`,
      metric: 'estimationAccuracy',
      value: `${metrics.estimationAccuracy.toFixed(1)}%`,
      recommendation: 'Pode alocar mais tarefas com segurança.',
    });
  }
  
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
      recommendation: 'Focar em melhorar estimativas e qualidade.',
    });
  }
  
  return insights;
}

/**
 * Generate comparative insights when team average is available
 */
export function generateComparativeInsights(
  metrics: SprintPerformanceMetrics,
  teamAverage: {
    accuracyRate: number;
    totalHoursWorked: number;
    totalHoursEstimated: number;
    performanceScore: number;
  }
): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  
  const efficiencyDiff = metrics.accuracyRate - teamAverage.accuracyRate;
  if (Math.abs(efficiencyDiff) >= 15) {
    if (efficiencyDiff > 0) {
      insights.push({
        type: 'positive',
        title: 'Eficiência Acima da Média',
        description: `Sua eficiência de execução (${metrics.accuracyRate.toFixed(0)}%) está ${efficiencyDiff.toFixed(0)} pontos acima da média da equipe (${teamAverage.accuracyRate.toFixed(0)}%). Excelente consistência!`,
        metric: 'accuracyRate',
        value: `+${efficiencyDiff.toFixed(0)}pts`,
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Eficiência Abaixo da Média',
        description: `Sua eficiência (${metrics.accuracyRate.toFixed(0)}%) está ${Math.abs(efficiencyDiff).toFixed(0)} pontos abaixo da média da equipe (${teamAverage.accuracyRate.toFixed(0)}%). Isso pode indicar necessidade de suporte ou tarefas mais complexas.`,
        metric: 'accuracyRate',
        value: `${efficiencyDiff.toFixed(0)}pts`,
        recommendation: 'Revisar se as estimativas estão adequadas para seu nível de senioridade e tipo de tarefas.',
      });
    }
  }
  
  const scoreDiff = metrics.performanceScore - teamAverage.performanceScore;
  if (Math.abs(scoreDiff) >= 10) {
    if (scoreDiff > 0) {
      insights.push({
        type: 'positive',
        title: 'Performance Acima da Equipe',
        description: `Seu score geral (${metrics.performanceScore.toFixed(0)}) está ${scoreDiff.toFixed(0)} pontos acima da média (${teamAverage.performanceScore.toFixed(0)}). Continue assim!`,
        metric: 'performanceScore',
        value: `+${scoreDiff.toFixed(0)}pts`,
      });
    } else {
      insights.push({
        type: 'neutral',
        title: 'Performance Abaixo da Equipe',
        description: `Seu score (${metrics.performanceScore.toFixed(0)}) está ${Math.abs(scoreDiff).toFixed(0)} pontos abaixo da média (${teamAverage.performanceScore.toFixed(0)}%). Identifique áreas de melhoria.`,
        metric: 'performanceScore',
        value: `${scoreDiff.toFixed(0)}pts`,
      });
    }
  }
  
  const myVariance = ((metrics.totalHoursWorked - metrics.totalHoursEstimated) / Math.max(metrics.totalHoursEstimated, 1)) * 100;
  const teamVariance = ((teamAverage.totalHoursWorked - teamAverage.totalHoursEstimated) / Math.max(teamAverage.totalHoursEstimated, 1)) * 100;
  const varianceDiff = myVariance - teamVariance;
  
  if (Math.abs(varianceDiff) >= 20) {
    if (varianceDiff < 0) {
      insights.push({
        type: 'positive',
        title: 'Melhor Controle de Tempo',
        description: `Você desvia ${Math.abs(varianceDiff).toFixed(0)}% menos das estimativas que a média da equipe. Isso indica ótimo planejamento e execução.`,
        metric: 'estimationAccuracy',
        value: `${varianceDiff.toFixed(0)}%`,
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Maior Desvio que a Equipe',
        description: `Você desvia ${varianceDiff.toFixed(0)}% mais das estimativas que a média da equipe. Pode indicar tarefas mais complexas ou necessidade de ajuste nas estimativas.`,
        metric: 'estimationAccuracy',
        value: `+${varianceDiff.toFixed(0)}%`,
        recommendation: 'Compare suas tarefas com as da equipe para identificar diferenças de complexidade.',
      });
    }
  }
  
  return insights;
}

export function generateAllSprintsInsights(metrics: AllSprintsPerformanceMetrics): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  
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
      description: 'Nota de teste está melhorando ao longo do tempo',
      metric: 'qualityTrend',
      value: 'Melhorando',
    });
  } else if (metrics.qualityTrend === 'declining') {
    insights.push({
      type: 'negative',
      title: 'Qualidade em Declínio',
      description: 'Nota de teste está diminuindo',
      metric: 'qualityTrend',
      value: 'Piorando',
      recommendation: 'Reforçar testes e code reviews.',
    });
  }
  
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
// CUSTOM PERIOD CALCULATIONS
// =============================================================================

export function calculateCustomPeriodPerformance(
  tasks: TaskItem[],
  developerId: string,
  developerName: string,
  selectedSprints: string[],
  periodName?: string
): CustomPeriodMetrics {
  const periodTasks = tasks.filter(t => 
    t.idResponsavel === developerId && 
    t.sprint &&
    t.sprint.trim() !== '' &&
    selectedSprints.includes(t.sprint)
  );
  
  if (periodTasks.length === 0) {
    return {
      developerId,
      developerName,
      periodName: periodName || `Sprints Selecionados (${selectedSprints.length})`,
      selectedSprints,
      totalSprints: selectedSprints.length,
      totalHoursWorked: 0,
      totalHoursEstimated: 0,
      totalTasksCompleted: 0,
      totalTasksStarted: 0,
      averageHoursPerSprint: 0,
      averageTasksPerSprint: 0,
      avgEstimationAccuracy: 0,
      avgAccuracyRate: 0,
      avgBugRate: 0,
      avgQualityScore: 0,
      avgPerformanceScore: 0,
      utilizationRate: 0,
      completionRate: 0,
      avgTimeToComplete: 0,
      consistencyScore: 50,
      avgComplexity: 0,
      tendsToOverestimate: false,
      tendsToUnderestimate: false,
      complexityDistribution: [1, 2, 3, 4, 5].map(level => ({ level, count: 0, avgAccuracy: 0 })),
      sprintBreakdown: [],
      performanceByComplexity: [],
      performanceByType: [],
      sprints: [],
    };
  }
  
  const sprintMetrics: SprintPerformanceMetrics[] = [];
  selectedSprints.forEach(sprint => {
    const metrics = calculateSprintPerformance(tasks, developerId, developerName, sprint);
    if (metrics.tasksStarted > 0) {
      sprintMetrics.push(metrics);
    }
  });
  
  const totalHoursWorked = sprintMetrics.reduce((sum, m) => sum + m.totalHoursWorked, 0);
  const totalHoursEstimated = sprintMetrics.reduce((sum, m) => sum + m.totalHoursEstimated, 0);
  const totalTasksCompleted = sprintMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const totalTasksStarted = sprintMetrics.reduce((sum, m) => sum + m.tasksStarted, 0);
  
  const avgEstimationAccuracy = sprintMetrics.length > 0
    ? sprintMetrics.reduce((sum, m) => sum + m.estimationAccuracy, 0) / sprintMetrics.length
    : 0;
  
  const avgAccuracyRate = sprintMetrics.length > 0
    ? sprintMetrics.reduce((sum, m) => sum + m.accuracyRate, 0) / sprintMetrics.length
    : 0;
  
  const avgBugRate = sprintMetrics.length > 0
    ? sprintMetrics.reduce((sum, m) => sum + m.bugRate, 0) / sprintMetrics.length
    : 0;
  
  const avgTestScore = sprintMetrics.length > 0
    ? sprintMetrics.reduce((sum, m) => sum + (m.testScore ?? 100), 0) / sprintMetrics.length
    : 100;
  const avgQualityScore = avgTestScore;
  
  const avgPerformanceScore = sprintMetrics.length > 0
    ? sprintMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / sprintMetrics.length
    : 0;
  
  const utilizationRate = sprintMetrics.length > 0
    ? sprintMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) / sprintMetrics.length
    : 0;
  
  const completionRate = sprintMetrics.length > 0
    ? sprintMetrics.reduce((sum, m) => sum + m.completionRate, 0) / sprintMetrics.length
    : 0;
  
  const avgTimeToComplete = sprintMetrics.length > 0
    ? sprintMetrics.reduce((sum, m) => sum + m.avgTimeToComplete, 0) / sprintMetrics.length
    : 0;
  
  const consistencyScore = sprintMetrics.length > 0
    ? sprintMetrics.reduce((sum, m) => sum + m.consistencyScore, 0) / sprintMetrics.length
    : 50;
  
  const allTasks = sprintMetrics.flatMap(m => m.tasks);
  const avgComplexity = allTasks.length > 0
    ? allTasks.reduce((sum, t) => sum + t.complexityScore, 0) / allTasks.length
    : 0;
  
  const tendsToOverestimate = avgEstimationAccuracy > 10;
  const tendsToUnderestimate = avgEstimationAccuracy < -10;
  
  const complexityDistribution = [1, 2, 3, 4, 5].map(level => {
    const tasksAtLevel = allTasks.filter(t => t.complexityScore === level);
    const count = tasksAtLevel.length;
    const avgAccuracy = count > 0
      ? tasksAtLevel.reduce((sum, t) => sum + Math.abs(t.estimationAccuracy), 0) / count
      : 0;
    
    return { level, count, avgAccuracy };
  });
  
  const sprintBreakdown = sprintMetrics.map(m => ({
    sprintName: m.sprintName,
    performanceScore: m.performanceScore,
    hoursWorked: m.totalHoursWorked,
    tasksCompleted: m.tasksCompleted,
    accuracy: m.accuracyRate,
    quality: m.qualityScore,
  }));
  
  const complexityMap = new Map<number, { totalTasks: number; totalHours: number; totalAccuracy: number }>();

  sprintMetrics.forEach(sprint => {
    sprint.performanceByComplexity.forEach(perf => {
      const existing = complexityMap.get(perf.level) || { totalTasks: 0, totalHours: 0, totalAccuracy: 0 };
      const taskCount = sprint.complexityDistribution.find(c => c.level === perf.level)?.count || 0;
      
      complexityMap.set(perf.level, {
        totalTasks: existing.totalTasks + taskCount,
        totalHours: existing.totalHours + (perf.avgHours * taskCount),
        totalAccuracy: existing.totalAccuracy + (perf.accuracy * taskCount),
      });
    });
  });

  const performanceByComplexity = Array.from(complexityMap.entries())
    .map(([level, data]) => ({
      level,
      totalTasks: data.totalTasks,
      avgHours: data.totalTasks > 0 ? data.totalHours / data.totalTasks : 0,
      accuracy: data.totalTasks > 0 ? data.totalAccuracy / data.totalTasks : 0,
    }))
    .sort((a, b) => a.level - b.level);

  const typeMap = new Map<string, { count: number; totalHours: number; totalAccuracy: number }>();

  periodTasks.forEach(task => {
    const type = task.tipo;
    const existing = typeMap.get(type) || { count: 0, totalHours: 0, totalAccuracy: 0 };
    
    const hoursSpent = task.tempoGastoTotal ?? 0;
    const hoursEstimated = task.estimativa || 0;
    const accuracy = hoursEstimated > 0 
      ? ((hoursEstimated - hoursSpent) / hoursEstimated) * 100 
      : 0;
    
    typeMap.set(type, {
      count: existing.count + 1,
      totalHours: existing.totalHours + hoursSpent,
      totalAccuracy: existing.totalAccuracy + Math.abs(accuracy),
    });
  });

  const performanceByType = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type: type as 'Bug' | 'Tarefa' | 'História' | 'Outro',
      count: data.count,
      avgHours: data.count > 0 ? data.totalHours / data.count : 0,
      accuracy: data.count > 0 ? data.totalAccuracy / data.count : 0,
    }));
  
  return {
    developerId,
    developerName,
    periodName: periodName || `Sprints ${selectedSprints.length} selecionados`,
    selectedSprints,
    totalSprints: sprintMetrics.length,
    totalHoursWorked,
    totalHoursEstimated,
    totalTasksCompleted,
    totalTasksStarted,
    averageHoursPerSprint: sprintMetrics.length > 0 ? totalHoursWorked / sprintMetrics.length : 0,
    averageTasksPerSprint: sprintMetrics.length > 0 ? totalTasksCompleted / sprintMetrics.length : 0,
    avgEstimationAccuracy,
    avgAccuracyRate,
    avgBugRate,
    avgQualityScore,
    avgTestScore,
    avgTestNote: sprintMetrics.length > 0
      ? sprintMetrics.reduce((s, m) => s + (m.avgTestNote ?? 5), 0) / sprintMetrics.length
      : 5,
    avgPerformanceScore,
    utilizationRate,
    completionRate,
    avgTimeToComplete,
    consistencyScore,
    avgComplexity,
    tendsToOverestimate,
    tendsToUnderestimate,
    complexityDistribution,
    sprintBreakdown,
    performanceByComplexity,
    performanceByType,
    sprints: sprintMetrics,
  };
}

// =============================================================================
// MAIN ANALYTICS FUNCTION
// =============================================================================

export function calculatePerformanceAnalytics(tasks: TaskItem[]): PerformanceAnalytics {
  const sprints = Array.from(new Set(tasks.map(t => t.sprint).filter(s => s && s.trim() !== '')));
  const developers = Array.from(new Set(tasks.map(t => t.idResponsavel).filter(id => id && id.trim() !== '')));
  
  const developerNames = new Map<string, string>();
  tasks.forEach(t => {
    if (t.idResponsavel && t.responsavel) {
      developerNames.set(t.idResponsavel, t.responsavel);
    }
  });
  
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
  
  const allSprintsMetrics = new Map<string, AllSprintsPerformanceMetrics>();
  developers.forEach(devId => {
    const devName = developerNames.get(devId) || devId;
    const metrics = calculateAllSprintsPerformance(tasks, devId, devName, sprints);
    if (metrics.totalSprints > 0) {
      allSprintsMetrics.set(devId, metrics);
    }
  });
  
  const comparisonsBySprint = new Map<string, DeveloperComparison[]>();
  metricsBySprint.forEach((devMap, sprint) => {
    const metrics = Array.from(devMap.values());
    const comparisons = calculateDeveloperComparisons(metrics);
    comparisonsBySprint.set(sprint, comparisons);
  });
  
  const allSprintsComparisons = calculateAllSprintsComparisons(
    Array.from(allSprintsMetrics.values())
  );
  
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

