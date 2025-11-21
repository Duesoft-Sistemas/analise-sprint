// Parsed task item
export interface TaskItem {
  chave: string;
  id: string;
  resumo: string;
  tempoGasto: number; // in hours - ⚠️ DEPRECATED: DO NOT USE IN CALCULATIONS! Use tempoGastoTotal instead.
                      // This field comes from the sprint spreadsheet and may be outdated.
                      // ALWAYS use worklog-based fields (tempoGastoTotal, tempoGastoNoSprint) for calculations.
  sprint: string;
  criado: Date;
  estimativa: number; // in hours - original estimate (never changes)
  responsavel: string;
  idResponsavel: string;
  status: string;
  modulo: string;
  feature: string[]; // Array de features - pode haver múltiplas colunas na planilha
  categorias: string[];
  detalhesOcultos: string[]; // Array de detalhes ocultos - pode haver múltiplas colunas na planilha
  // Valores aceitos (case-insensitive, normalizados): "DuvidaOculta", "Reuniao"/"Reunião", "Auxilio"/"Auxílio"
  tipo: 'Bug' | 'Tarefa' | 'História' | 'Outro';
  complexidade: number; // 1 to 5
  notaTeste?: number; // 1-5 (default 5 if missing)
  qualidadeChamado?: string; // Campo personalizado (Qualidade do Chamado)
  
  // Hybrid approach fields (calculated from worklog) - ALWAYS USE THESE FOR CALCULATIONS
  estimativaRestante?: number; // in hours - remaining work for current sprint
  tempoGastoTotal?: number; // in hours - total time spent across all sprints (FROM WORKLOG)
  tempoGastoNoSprint?: number; // in hours - time spent in current sprint only (FROM WORKLOG)
  tempoGastoOutrosSprints?: number; // in hours - time spent in other sprints (FROM WORKLOG)
  
  // Delivery management
  dataLimite?: Date; // Data limite de entrega da tarefa
}

// Developer metrics
export interface DeveloperMetrics {
  name: string;
  id: string;
  totalAllocatedHours: number;
  totalAvailableHours: number;
  totalSpentHours: number;
  estimatedHours: number;
  tasks: TaskItem[];
  riskLevel: 'low' | 'medium' | 'high';
  utilizationPercent: number;
}

// Totalizer by dimension
export interface Totalizer {
  label: string;
  count: number;
  hours: number;
  estimatedHours: number;
  // Optional breakdown by type for backlog analysis
  byType?: {
    bugs: number;
    duvidasOcultas: number;
    tarefas: number;
    bugsHours: number;
    duvidasOcultasHours: number;
    tarefasHours: number;
  };
}

// Bug totalizer with special handling
export interface BugTotalizer {
  realBugs: Totalizer;
  dubidasOcultas: Totalizer;
  total: Totalizer;
}

// Sprint analytics
export interface SprintAnalytics {
  sprintName: string;
  totalTasks: number;
  totalHours: number;
  totalEstimatedHours: number;
  completedTasks: number;
  completedHours: number;
  developers: DeveloperMetrics[];
  byType: {
    bugs: BugTotalizer;
    tarefas: Totalizer;
    historias: Totalizer;
    outros: Totalizer;
  };
  byFeature: Totalizer[];
  byModule: Totalizer[];
  byClient: Totalizer[];
}

// Problem analysis (bugs reais e dúvidas ocultas)
export interface ProblemAnalysis {
  label: string;
  totalTasks: number;
  totalTarefas: number;
  realBugs: number;
  dubidasOcultas: number;
  totalHours: number;
}

// Cross-sprint analytics
export interface CrossSprintAnalytics {
  backlogTasks: number;
  backlogHours: number;
  backlogByFeature: Totalizer[]; // Análise de backlog por feature
  backlogByClient: Totalizer[]; // Análise de backlog por cliente
  sprintDistribution: {
    sprintName: string;
    tasks: number;
    hours: number;
    estimatedHours: number;
  }[];
  developerAllocation: {
    name: string;
    sprints: {
      sprintName: string;
      hours: number;
      estimatedHours: number;
    }[];
    totalHours: number;
  }[];
  clientAllocation: {
    client: string;
    sprints: {
      sprintName: string;
      hours: number;
      estimatedHours: number;
    }[];
    totalHours: number;
  }[];
  // Análise de problemas (bugs reais e dúvidas ocultas) - apenas tarefas com sprint
  byFeature: ProblemAnalysis[];
  byClient: ProblemAnalysis[];
}

// Alert/Risk items
export interface RiskAlert {
  type: 'overAllocated' | 'overTime' | 'noProgress' | 'sprintEndingSoon' | 'missingEstimate';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  taskOrDeveloper: string;
  relatedTask?: TaskItem;
}

// Filters for task list
export interface TaskFilters {
  responsavel?: string;
  feature?: string;
  modulo?: string;
  categoria?: string;
  sprint?: string;
  status?: string;
}

// Performance Analytics Types

// Explanation of how a metric is calculated
export interface MetricExplanation {
  formula: string;
  description: string;
  interpretation: string;
  example?: string;
}

// Task-level performance metrics
export interface TaskPerformanceMetrics {
  task: TaskItem;
  estimationAccuracy: number; // -100 to +100 (% deviation from estimate)
  isOnTime: boolean; // spent <= estimated
  complexityScore: number; // 1-5
  hoursSpent: number;
  hoursEstimated: number;
  // Information about efficiency impact (complexity zone evaluation)
  efficiencyImpact?: {
    type: 'normal' | 'complexity_zone';
    description: string;
    isEfficient: boolean;
    zone?: 'efficient' | 'acceptable' | 'inefficient';
    expectedMaxHours?: number;
  };
}

// Developer performance in a single sprint
export interface SprintPerformanceMetrics {
  developerId: string;
  developerName: string;
  sprintName: string;
  
  // Productivity
  totalHoursWorked: number;
  totalHoursEstimated: number; // Total estimated hours for comparison
  tasksCompleted: number;
  tasksStarted: number;
  averageHoursPerTask: number;
  
  // Accuracy
  estimationAccuracy: number; // Average % deviation
  accuracyRate: number; // % of tasks executed efficiently (bugs: all complexities 1-5 use hours spent zone, features: all use deviation percentage)
  
  // Breakdown-specific metrics
  bugAccuracyRate: number;
  featureEstimationAccuracy: number;
  
  tendsToOverestimate: boolean;
  tendsToUnderestimate: boolean;
  // Information about tasks impacted by complexity zone rule (hours exceeding complexity limits)
  tasksImpactedByComplexityZone?: number; // Count of tasks impacted
  complexityZoneImpactDetails?: string; // Description of the impact
  
  // Quality
  qualityScore: number; // Derived from Nota de Teste (scaled 0-100)
  
  // Informative metrics (NOT used in scoring - just show work distribution)
  bugRate: number; // % of tasks that are bugs (informative only)
  bugsVsFeatures: number; // ratio bugs/features (informative only)
  testScore?: number; // 0-100 (avgTestNote × 20)
  avgTestNote?: number; // 1-5
  reunioesHours: number; // hours spent in meetings (informative only - neutral, doesn't affect score)
  
  // Efficiency
  utilizationRate: number; // hours worked / 40h
  completionRate: number; // completed / started
  avgTimeToComplete: number; // average hours
  consistencyScore: number; // inverse of std deviation
  
  // Complexity
  avgComplexity: number;
  complexityDistribution: { level: number; count: number; avgAccuracy: number }[];
  performanceByComplexity: { level: number; avgHours: number; accuracy: number }[];
  
  // Overall Score
  performanceScore: number; // 0-130 weighted score (base + seniority bonus + auxilio bonus)
  baseScore: number; // 0-100 base score without bonuses
  seniorityEfficiencyBonus: number; // 0-15 bonus for executing complex tasks with high efficiency
  competenceBonus: number; // Adicionado
  auxilioBonus: number; // 0-10 bonus for helping other developers
  overtimeBonus: number; // 0-10 bonus for working extra hours (>40h) with high quality (DEPRECATED - sempre 0)
  
  // Bonus tasks breakdown
  seniorityBonusTasks?: TaskItem[];
  competenceBonusTasks?: TaskItem[];
  overtimeBonusTasks?: TaskItem[]; // DEPRECATED - sempre array vazio
  
  // Raw data
  tasks: TaskPerformanceMetrics[];
}

// Developer performance across all sprints
export interface AllSprintsPerformanceMetrics {
  developerId: string;
  developerName: string;
  
  // Aggregated metrics
  totalSprints: number;
  totalHoursWorked: number;
  totalHoursEstimated: number; // ADDED: Total estimated hours across all sprints
  totalTasksCompleted: number;
  totalTasksStarted: number; // ADDED: Total started tasks
  averageHoursPerSprint: number;
  averageTasksPerSprint: number;
  
  // Average performance
  avgEstimationAccuracy: number;
  avgAccuracyRate: number;
  avgBugRate: number;
  avgQualityScore: number;
  avgTestScore?: number; // 0-100
  avgTestNote?: number; // 1-5
  avgPerformanceScore: number;
  
  // Efficiency & Completion (ADDED for component compatibility)
  utilizationRate: number; // Average utilization
  completionRate: number; // Average completion rate
  avgTimeToComplete: number; // Average time to complete tasks
  consistencyScore: number; // Average consistency
  avgComplexity: number; // ADDED: Average complexity across all tasks
  
  // Tendencies (ADDED)
  tendsToOverestimate: boolean;
  tendsToUnderestimate: boolean;
  
  // Complexity distribution (ADDED for component compatibility)
  complexityDistribution: { level: number; count: number; avgAccuracy: number }[];
  
  // Trends (improvement over time)
  accuracyTrend: 'improving' | 'declining' | 'stable';
  qualityTrend: 'improving' | 'declining' | 'stable';
  productivityTrend: 'improving' | 'declining' | 'stable';
  
  // Sprint-by-sprint breakdown
  sprintBreakdown: {
    sprintName: string;
    performanceScore: number;
    hoursWorked: number;
    tasksCompleted: number;
    accuracy: number;
    quality: number;
  }[];
  
  // By complexity
  performanceByComplexity: {
    level: number;
    totalTasks: number;
    avgHours: number;
    accuracy: number;
  }[];
  
  // By type
  performanceByType: {
    type: 'Bug' | 'Tarefa' | 'História' | 'Outro';
    count: number;
    avgHours: number;
    accuracy: number;
  }[];
  
  // Sprint performance details
  sprints: SprintPerformanceMetrics[];
}

// Comparative metrics for ranking
export interface DeveloperComparison {
  developerId: string;
  developerName: string;
  performanceScore: number;
  accuracyRank: number;
  qualityRank: number;
  productivityRank: number;
  overallRank: number;
  totalDevelopers: number;
}

// Insights generated from performance data
export interface PerformanceInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  metric: string;
  value: string;
  recommendation?: string;
}

// Complete performance analytics response
export interface PerformanceAnalytics {
  // Individual developer metrics
  developerMetrics: {
    bySprint: Map<string, Map<string, SprintPerformanceMetrics>>; // sprint -> developer -> metrics
    allSprints: Map<string, AllSprintsPerformanceMetrics>; // developer -> all sprints metrics
  };
  
  // Comparisons and rankings
  comparisons: {
    bySprint: Map<string, DeveloperComparison[]>; // sprint -> rankings
    allSprints: DeveloperComparison[]; // overall rankings
  };
  
  // Insights
  insights: {
    bySprint: Map<string, Map<string, PerformanceInsight[]>>; // sprint -> developer -> insights
    allSprints: Map<string, PerformanceInsight[]>; // developer -> insights
  };
  
  // Metric explanations
  explanations: Map<string, MetricExplanation>;
}

// Worklog entry from detailed time tracking
export interface WorklogEntry {
  taskId: string; // ID or key of the task (e.g., "PROJ-101")
  responsavel: string; // Developer who logged the time
  tempoGasto: number; // in hours
  data: Date; // Date when the time was logged
}

// Sprint period for filtering worklogs
export interface SprintPeriod {
  sprintName: string;
  startDate: Date;
  endDate: Date;
}

// Sprint metadata from sprints configuration file
export interface SprintMetadata {
  sprint: string; // Sprint name/ID (e.g., "OUT25 - Semana 4")
  dataInicio: Date; // Start date
  dataFim: Date; // End date
}

// Custom period with multiple selected sprints
export interface CustomPeriodMetrics {
  developerId: string;
  developerName: string;
  periodName: string; // e.g., "Q1 2025" or "Sprints 5-8"
  selectedSprints: string[]; // array of sprint names
  
  // Same structure as AllSprintsPerformanceMetrics but for selected sprints only
  totalSprints: number;
  totalHoursWorked: number;
  totalHoursEstimated: number; // ADDED
  totalTasksCompleted: number;
  totalTasksStarted: number; // ADDED
  averageHoursPerSprint: number;
  averageTasksPerSprint: number;
  
  avgEstimationAccuracy: number;
  avgAccuracyRate: number;
  avgBugRate: number;
  avgQualityScore: number;
  avgTestScore?: number; // 0-100
  avgTestNote?: number; // 1-5
  avgPerformanceScore: number;
  
  // ADDED for component compatibility
  utilizationRate: number;
  completionRate: number;
  avgTimeToComplete: number;
  consistencyScore: number;
  avgComplexity: number;
  tendsToOverestimate: boolean;
  tendsToUnderestimate: boolean;
  complexityDistribution: { level: number; count: number; avgAccuracy: number }[];
  
  // Sprint-by-sprint breakdown for selected period
  sprintBreakdown: {
    sprintName: string;
    performanceScore: number;
    hoursWorked: number;
    tasksCompleted: number;
    accuracy: number;
    quality: number;
  }[];
  
  performanceByComplexity: {
    level: number;
    totalTasks: number;
    avgHours: number;
    accuracy: number;
  }[];
  
  performanceByType: {
    type: 'Bug' | 'Tarefa' | 'História' | 'Outro';
    count: number;
    avgHours: number;
    accuracy: number;
  }[];
  
  // Reference to original sprint metrics
  sprints: SprintPerformanceMetrics[];
}

// Temporal Evolution Analytics (for career progression tracking)
export type TemporalAggregation = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'sprint';

// Performance metrics aggregated by time period
export interface TemporalPeriodMetrics {
  periodId: string; // e.g., "2024-Q1", "2024-03", "2024-H1", "2024"
  periodLabel: string; // e.g., "Q1 2024", "Março 2024", "1º Semestre 2024", "2024"
  startDate: Date;
  endDate: Date;
  
  // Aggregated metrics for this period
  totalSprints: number;
  totalHoursWorked: number;
  totalHoursEstimated: number;
  totalTasksCompleted: number;
  totalTasksStarted: number;
  
  // Average performance scores
  avgPerformanceScore: number; // Base score without bonuses (for multiple sprints view)
  avgPerformanceScoreWithBonus?: number; // Average of individual sprint scores with bonuses
  avgAccuracyRate: number;
  avgQualityScore: number;
  avgCompletionRate: number;
  
  // Quality metrics
  avgBugRate: number;
  
  // Efficiency
  avgEstimationAccuracy: number;
  avgUtilizationRate: number;
  avgComplexity: number;
  
  // Sprint names included in this period
  includedSprints: string[];
}

// Developer evolution over time
export interface DeveloperTemporalEvolution {
  developerId: string;
  developerName: string;
  aggregationType: TemporalAggregation;
  
  // Time series data
  periods: TemporalPeriodMetrics[];
  
  // Overall trends
  overallTrend: {
    performance: 'improving' | 'declining' | 'stable';
    accuracy: 'improving' | 'declining' | 'stable';
    quality: 'improving' | 'declining' | 'stable';
    complexity: 'increasing' | 'decreasing' | 'stable';
  };
  
  // Growth indicators
  growthMetrics: {
    performanceGrowth: number; // % change from first to last period
    accuracyGrowth: number;
    qualityGrowth: number;
    complexityGrowth: number;
    totalGrowthScore: number; // weighted score of all growth metrics
  };
  
  // Career progression insights
  careerInsights: {
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    metric?: string;
    recommendation?: string;
  }[];
  
  // Statistical analysis
  statistics: {
    avgPerformanceScore: number;
    medianPerformanceScore: number;
    minPerformanceScore: number;
    maxPerformanceScore: number;
    performanceStdDev: number;
    consistencyScore: number; // How consistent is the developer's performance over time
  };
}

// Complete temporal analytics response
export interface TemporalEvolutionAnalytics {
  aggregationType: TemporalAggregation;
  developers: DeveloperTemporalEvolution[];
  
  // Team-wide temporal metrics for comparison
  teamAverages: {
    periodId: string;
    avgPerformanceScore: number;
    avgAccuracyRate: number;
    avgQualityScore: number;
  }[];
}

// -----------------------------
// Presentation mode (slides)
// -----------------------------

export type ViewMode =
  | 'sprint'
  | 'multiSprint'
  | 'performance'
  | 'evolution'
  | 'quality'
  | 'inconsistencies'
  | 'backlog'
  | 'backlogFlow';

export type SprintPresentationSection =
  | 'summary'
  | 'byFeature'
  | 'byClient'
  | 'developers'
  | 'tasks';

export type MultiSprintPresentationSection =
  | 'sprintDistribution'
  | 'developerAllocation'
  | 'clientAllocation'
  | 'featureAnalysis'
  | 'managementKPIs';

export type BacklogPresentationSection =
  | 'summary'
  | 'byComplexity'
  | 'byFeature'
  | 'byClient'
  | 'byStatus'
  | 'insights'
  | 'taskList';

export type BacklogFlowPresentationSection =
  | 'kpis'
  | 'kpisHours'
  | 'chart'
  | 'chartHours'
  | 'capacity'
  | 'help';

export type DeliveryPresentationSection =
  | 'dataLimite'
  | 'previsao'
  | 'cronograma'
  | 'taskList';

export type WorklogPresentationSection =
  | 'overview'
  | 'daily'
  | 'developers';

export interface PresentationStep {
  view: ViewMode;
  section?: SprintPresentationSection; // Applies to 'sprint' view
  multiSection?: MultiSprintPresentationSection; // Applies to 'multiSprint' view
  backlogSection?: BacklogPresentationSection; // Applies to 'backlog' view
  backlogFlowSection?: BacklogFlowPresentationSection; // Applies to 'backlogFlow' view
  deliverySection?: DeliveryPresentationSection; // Applies to 'delivery' view
  worklogSection?: WorklogPresentationSection; // Applies to 'worklog' view
  durationMs?: number; // Optional per-step override; falls back to intervalMs
}

export interface PresentationConfig {
  isActive: boolean;
  isPlaying: boolean;
  intervalMs: number;
  steps: PresentationStep[];
  currentStepIndex: number;
}