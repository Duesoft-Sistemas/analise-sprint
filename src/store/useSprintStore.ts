import { create } from 'zustand';
import {
  TaskItem,
  SprintAnalytics,
  CrossSprintAnalytics,
  RiskAlert,
  TaskFilters,
  WorklogEntry,
  SprintPeriod,
} from '../types';
import {
  calculateSprintAnalytics,
  calculateCrossSprintAnalytics,
  calculateRiskAlerts,
  getAllSprints,
} from '../services/analytics';
import { calculateAllTasksHybridMetrics } from '../services/hybridCalculations';

interface SprintStore {
  // Data
  tasks: TaskItem[];
  sprints: string[];
  selectedSprint: string | null;
  sprintAnalytics: SprintAnalytics | null;
  crossSprintAnalytics: CrossSprintAnalytics | null;
  riskAlerts: RiskAlert[];
  
  // Worklog data
  worklogs: WorklogEntry[];
  sprintPeriod: SprintPeriod | null;
  
  // File metadata
  layoutFileName: string | null;
  worklogFileName: string | null;
  
  // Filters
  taskFilters: TaskFilters;
  
  // Selected developer for drill-down
  selectedDeveloper: string | null;
  
  // Actions
  setTasks: (tasks: TaskItem[], fileName?: string) => void;
  setWorklogs: (worklogs: WorklogEntry[], fileName?: string) => void;
  setSprintPeriod: (period: SprintPeriod | null) => void;
  setSelectedSprint: (sprint: string) => void;
  setTaskFilters: (filters: TaskFilters) => void;
  setSelectedDeveloper: (developer: string | null) => void;
  clearData: () => void;
  
  // Computed getters
  getFilteredTasks: () => TaskItem[];
}

export const useSprintStore = create<SprintStore>((set, get) => ({
  // Initial state
  tasks: [],
  sprints: [],
  selectedSprint: null,
  sprintAnalytics: null,
  crossSprintAnalytics: null,
  riskAlerts: [],
  worklogs: [],
  sprintPeriod: null,
  layoutFileName: null,
  worklogFileName: null,
  taskFilters: {},
  selectedDeveloper: null,

  // Actions
  setTasks: (tasks: TaskItem[], fileName?: string) => {
    const { worklogs, sprintPeriod } = get();
    
    // Calculate hybrid metrics if worklogs are available
    const processedTasks = worklogs.length > 0
      ? calculateAllTasksHybridMetrics(tasks, worklogs, sprintPeriod)
      : tasks;
    
    const sprints = getAllSprints(processedTasks);
    const selectedSprint = sprints.length > 0 ? sprints[0] : null;
    
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint)
      : [];

    set({
      tasks: processedTasks,
      sprints,
      selectedSprint,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
      taskFilters: {},
      selectedDeveloper: null,
      layoutFileName: fileName || null,
    });
  },

  setWorklogs: (worklogs: WorklogEntry[], fileName?: string) => {
    const { tasks, sprintPeriod, selectedSprint } = get();
    
    // Recalculate hybrid metrics with new worklogs
    const processedTasks = calculateAllTasksHybridMetrics(tasks, worklogs, sprintPeriod);
    
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint)
      : [];

    set({
      worklogs,
      tasks: processedTasks,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
      worklogFileName: fileName || null,
    });
  },

  setSprintPeriod: (period: SprintPeriod | null) => {
    const { tasks, worklogs, selectedSprint } = get();
    
    // Recalculate hybrid metrics with new sprint period
    const processedTasks = worklogs.length > 0
      ? calculateAllTasksHybridMetrics(tasks, worklogs, period)
      : tasks;
    
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint)
      : null;
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint)
      : [];

    set({
      sprintPeriod: period,
      tasks: processedTasks,
      sprintAnalytics,
      riskAlerts,
    });
  },

  setSelectedSprint: (sprint: string) => {
    const { tasks } = get();
    const sprintAnalytics = calculateSprintAnalytics(tasks, sprint);
    const riskAlerts = calculateRiskAlerts(tasks, sprint);

    set({
      selectedSprint: sprint,
      sprintAnalytics,
      riskAlerts,
      selectedDeveloper: null,
    });
  },

  setTaskFilters: (filters: TaskFilters) => {
    set({ taskFilters: filters });
  },

  setSelectedDeveloper: (developer: string | null) => {
    set({ selectedDeveloper: developer });
  },

  clearData: () => {
    set({
      tasks: [],
      sprints: [],
      selectedSprint: null,
      sprintAnalytics: null,
      crossSprintAnalytics: null,
      riskAlerts: [],
      worklogs: [],
      sprintPeriod: null,
      layoutFileName: null,
      worklogFileName: null,
      taskFilters: {},
      selectedDeveloper: null,
    });
  },

  // Computed getter for filtered tasks
  getFilteredTasks: () => {
    const { tasks, taskFilters, selectedSprint, selectedDeveloper } = get();
    
    let filtered = tasks;

    // Filter by selected sprint
    if (selectedSprint) {
      filtered = filtered.filter((t) => t.sprint === selectedSprint);
    }

    // Filter by selected developer
    if (selectedDeveloper) {
      filtered = filtered.filter((t) => t.responsavel === selectedDeveloper);
    }

    // Apply additional filters
    if (taskFilters.responsavel) {
      filtered = filtered.filter((t) => t.responsavel === taskFilters.responsavel);
    }

    if (taskFilters.feature) {
      filtered = filtered.filter((t) => t.feature === taskFilters.feature);
    }

    if (taskFilters.modulo) {
      filtered = filtered.filter((t) => t.modulo === taskFilters.modulo);
    }

    if (taskFilters.categoria) {
      filtered = filtered.filter((t) => t.categorias.includes(taskFilters.categoria!));
    }

    if (taskFilters.sprint) {
      filtered = filtered.filter((t) => t.sprint === taskFilters.sprint);
    }

    if (taskFilters.status) {
      filtered = filtered.filter((t) => t.status === taskFilters.status);
    }

    return filtered;
  },
}));

