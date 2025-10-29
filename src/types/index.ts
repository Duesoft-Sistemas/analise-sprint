// Parsed task item
export interface TaskItem {
  chave: string;
  id: string;
  resumo: string;
  tempoGasto: number; // in hours - DEPRECATED: use tempoGastoTotal
  sprint: string;
  criado: Date;
  estimativa: number; // in hours - original estimate (never changes)
  responsavel: string;
  idResponsavel: string;
  status: string;
  modulo: string;
  feature: string;
  categorias: string[];
  detalhesOcultos: string;
  tipo: 'Bug' | 'Tarefa' | 'História' | 'Outro';
  retrabalho: boolean; // Sim = true, Não = false
  complexidade: number; // 1 to 5
  
  // Hybrid approach fields (calculated from worklog)
  estimativaRestante?: number; // in hours - remaining work for current sprint
  tempoGastoTotal?: number; // in hours - total time spent across all sprints
  tempoGastoNoSprint?: number; // in hours - time spent in current sprint only
  tempoGastoOutrosSprints?: number; // in hours - time spent in other sprints
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

// Cross-sprint analytics
export interface CrossSprintAnalytics {
  backlogTasks: number;
  backlogHours: number;
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
}

// Alert/Risk items
export interface RiskAlert {
  type: 'overAllocated' | 'overTime' | 'noProgress' | 'sprintEndingSoon';
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
  isRework: boolean;
  complexityScore: number; // 1-5
  hoursSpent: number;
  hoursEstimated: number;
}

// Developer performance in a single sprint
export interface SprintPerformanceMetrics {
  developerId: string;
  developerName: string;
  sprintName: string;
  
  // Productivity
  totalHoursWorked: number;
  tasksCompleted: number;
  tasksStarted: number;
  averageHoursPerTask: number;
  
  // Accuracy
  estimationAccuracy: number; // Average % deviation
  accuracyRate: number; // % of tasks within ±20% of estimate
  tendsToOverestimate: boolean;
  tendsToUnderestimate: boolean;
  
  // Quality
  reworkRate: number; // % of tasks that are rework
  bugRate: number; // % of tasks that are bugs
  bugsVsFeatures: number; // ratio bugs/features
  qualityScore: number; // 100 - reworkRate
  
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
  performanceScore: number; // 0-100 weighted score
  
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
  totalTasksCompleted: number;
  averageHoursPerSprint: number;
  averageTasksPerSprint: number;
  
  // Average performance
  avgEstimationAccuracy: number;
  avgAccuracyRate: number;
  avgReworkRate: number;
  avgBugRate: number;
  avgQualityScore: number;
  avgPerformanceScore: number;
  
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
    reworkRate: number;
  }[];
  
  // By type
  performanceByType: {
    type: 'Bug' | 'Tarefa' | 'História' | 'Outro';
    count: number;
    avgHours: number;
    accuracy: number;
    reworkRate: number;
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
