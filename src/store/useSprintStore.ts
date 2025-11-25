import { create } from 'zustand';
import {
  TaskItem,
  SprintAnalytics,
  CrossSprintAnalytics,
  RiskAlert,
  TaskFilters,
  WorklogEntry,
  SprintPeriod,
  SprintMetadata,
  DeveloperMetrics,
  PresentationConfig,
  PresentationStep,
} from '../types';
import {
  calculateSprintAnalytics,
  calculateCrossSprintAnalytics,
  calculateRiskAlerts,
  getAllSprints,
} from '../services/analytics';
import { calculateAllTasksHybridMetrics } from '../services/hybridCalculations';
import { isBacklogSprintValue, taskHasCategory } from '../utils/calculations';

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
  
  // Sprint metadata from sprints.xlsx
  sprintMetadata: SprintMetadata[];
  sprintsFileName: string | null;
  
  // File metadata
  layoutFileName: string | null;
  layoutFileNames: string[]; // Array para múltiplos arquivos
  worklogFileName: string | null;
  worklogFileNames: string[]; // Array para múltiplos arquivos
  
  // Filters
  taskFilters: TaskFilters;
  
  // Selected developer for drill-down
  selectedDeveloper: string | null;
  analyticsFilter: { type: 'feature' | 'client'; value: string } | null;
  
  // State for breakdown modal
  isBreakdownModalOpen: boolean;
  developerForBreakdown: DeveloperMetrics | null;
  
  // State for worklog developer details modal
  isWorklogDeveloperModalOpen: boolean;
  worklogDeveloperName: string | null;

  // Presentation mode
  presentation: PresentationConfig;

  // Actions
  setTasks: (tasks: TaskItem[], fileName?: string) => void;
  addTasks: (tasks: TaskItem[], fileName?: string) => void; // Adiciona tarefas sem substituir
  removeTasksByFileName: (fileName: string) => void; // Remove tarefas de um arquivo específico
  setWorklogs: (worklogs: WorklogEntry[], fileName?: string) => void;
  addWorklogs: (worklogs: WorklogEntry[], fileName?: string) => void; // Adiciona worklogs sem substituir
  removeWorklogsByFileName: (fileName: string) => void; // Remove worklogs de um arquivo específico
  setSprintPeriod: (period: SprintPeriod | null) => void;
  setSprintMetadata: (metadata: SprintMetadata[], fileName?: string) => void;
  addSprintMetadata: (metadata: SprintMetadata[], fileName?: string) => void; // Adiciona metadados sem substituir
  removeSprintMetadataByFileName: (fileName: string) => void; // Remove metadados de um arquivo específico
  setSelectedSprint: (sprint: string) => void;
  setTaskFilters: (filters: TaskFilters) => void;
  setSelectedDeveloper: (developer: string | null) => void;
  clearData: () => void;
  setAnalyticsFilter: (filter: { type: 'feature' | 'client'; value: string } | null) => void;
  openBreakdownModal: (developer: DeveloperMetrics) => void;
  closeBreakdownModal: () => void;
  openWorklogDeveloperModal: (developerName: string) => void;
  closeWorklogDeveloperModal: () => void;

  // Presentation actions
  setPresentationConfig: (update: Partial<PresentationConfig>) => void;
  setPresentationSteps: (steps: PresentationStep[]) => void;
  startPresentation: () => void;
  stopPresentation: () => void;
  nextPresentationStep: () => void;
  prevPresentationStep: () => void;
  setCurrentPresentationIndex: (index: number) => void;
  
  // Computed getters
  getFilteredTasks: () => TaskItem[];
  getSprintPeriod: (sprintName: string) => SprintPeriod | null;
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
  sprintMetadata: [],
  sprintsFileName: null,
  layoutFileName: null,
  layoutFileNames: [],
  worklogFileName: null,
  worklogFileNames: [],
  taskFilters: {},
  selectedDeveloper: null,
  analyticsFilter: null,
  isBreakdownModalOpen: false,
  developerForBreakdown: null,
  presentation: {
    isActive: false,
    isPlaying: false,
    intervalMs: 60000,
    currentStepIndex: 0,
    steps: [
      { view: 'sprint', section: 'summary' },
      { view: 'sprint', section: 'byClient' },
      { view: 'sprint', section: 'byFeature' },
      { view: 'sprint', section: 'developers' },
      { view: 'multiSprint', multiSection: 'sprintDistribution' },
      { view: 'multiSprint', multiSection: 'developerAllocation' },
      { view: 'multiSprint', multiSection: 'clientAllocation' },
      { view: 'multiSprint', multiSection: 'featureAnalysis' },
    ],
  },

  // Actions
  setTasks: (tasks: TaskItem[], fileName?: string) => {
    const { worklogs, sprintMetadata } = get();
    
    // Calculate hybrid metrics if worklogs are available
    // Use sprint-specific periods from metadata
    // IMPORTANT: Tarefas sem sprint (backlog) NÃO são processadas - são apenas para análise de demandas
    // Elas não interferem em métricas de performance, mesmo que tenham worklog
    let processedTasks = tasks;
    
    // Reset file names array
    const layoutFileNames = fileName ? [fileName] : [];
    if (worklogs.length > 0 && sprintMetadata.length > 0) {
      // Process each sprint separately with its correct period
      // Filter out tasks without sprint (backlog) - they are NOT processed for metrics
      const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      const knownSprintTasks = tasksWithSprint.filter(t => sprintMetadata.some(m => m.sprint === t.sprint));
      const unknownSprintTasks = tasksWithSprint.filter(t => !sprintMetadata.some(m => m.sprint === t.sprint));
      const tasksBySprint = new Map<string, TaskItem[]>();
      knownSprintTasks.forEach(task => {
        if (!tasksBySprint.has(task.sprint)) {
          tasksBySprint.set(task.sprint, []);
        }
        tasksBySprint.get(task.sprint)!.push(task);
      });
      
      processedTasks = [];
      tasksBySprint.forEach((sprintTasks, sprintName) => {
        const metadata = sprintMetadata.find(m => m.sprint === sprintName);
        // Only consider sprints that exist in the sprint metadata (with dates)
        if (!metadata) {
          return; // skip tasks from sprints not declared in the sprints spreadsheet
        }
        const period = {
          sprintName,
          startDate: metadata.dataInicio,
          endDate: metadata.dataFim,
        };
        const processed = calculateAllTasksHybridMetrics(sprintTasks, worklogs, period);
        processedTasks.push(...processed);
      });
      
      // IMPORTANT: Add backlog tasks (without sprint or unknown sprint) back to processedTasks but WITHOUT hybrid metrics
      // They keep their original structure but won't have tempoGastoTotal, tempoGastoNoSprint, etc.
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      processedTasks.push(...backlogTasks, ...unknownSprintTasks);
    } else if (worklogs.length > 0) {
      // Fallback: use single period if no metadata
      // Filter out tasks without sprint (backlog) - they are NOT processed for metrics
      const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      const { sprintPeriod } = get();
      const processed = calculateAllTasksHybridMetrics(tasksWithSprint, worklogs, sprintPeriod);
      
      // Add backlog tasks back without hybrid metrics
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      processedTasks = [...processed, ...backlogTasks];
    } else {
      // No worklogs - keep all tasks as-is (including backlog)
      processedTasks = tasks;
    }
    
    // Build sprint options: prefer explicit sprint metadata (from sprints.xlsx)
    let sprints: string[];
    if (sprintMetadata.length > 0) {
      // Respect the order by start date from the spreadsheet
      const ordered = [...sprintMetadata].sort(
        (a, b) => a.dataInicio.getTime() - b.dataInicio.getTime()
      );
      sprints = ordered.map((m) => m.sprint);
    } else {
      // Fallback to inferring from tasks when metadata not provided
      sprints = getAllSprints(processedTasks);
    }

    // Choose default selected sprint
    let selectedSprint: string | null = null;
    if (sprintMetadata.length > 0) {
      const today = new Date().getTime();
      const active = sprintMetadata.find(
        (m) => today >= m.dataInicio.getTime() && today <= m.dataFim.getTime()
      );
      selectedSprint = active ? active.sprint : sprints[0] || null;
    } else {
      selectedSprint = sprints.length > 0 ? sprints[0] : null;
    }
    
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint, sprintMetadata, worklogs)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint, sprintMetadata)
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
      layoutFileNames,
    });
  },

  addTasks: (newTasks: TaskItem[], fileName?: string) => {
    const { tasks, worklogs, sprintMetadata, layoutFileNames } = get();
    
    // Concatenar novas tarefas com as existentes
    const allTasks = [...tasks, ...newTasks];
    
    // Adicionar nome do arquivo se fornecido e ainda não estiver na lista
    const updatedFileNames = fileName && !layoutFileNames.includes(fileName)
      ? [...layoutFileNames, fileName]
      : layoutFileNames;
    
    // Processar todas as tarefas
    let processedTasks = allTasks;
    if (worklogs.length > 0 && sprintMetadata.length > 0) {
      const tasksWithSprint = allTasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      const knownSprintTasks = tasksWithSprint.filter(t => sprintMetadata.some(m => m.sprint === t.sprint));
      const unknownSprintTasks = tasksWithSprint.filter(t => !sprintMetadata.some(m => m.sprint === t.sprint));
      const tasksBySprint = new Map<string, TaskItem[]>();
      knownSprintTasks.forEach(task => {
        if (!tasksBySprint.has(task.sprint)) {
          tasksBySprint.set(task.sprint, []);
        }
        tasksBySprint.get(task.sprint)!.push(task);
      });
      
      processedTasks = [];
      tasksBySprint.forEach((sprintTasks, sprintName) => {
        const metadata = sprintMetadata.find(m => m.sprint === sprintName);
        if (!metadata) {
          return;
        }
        const period = {
          sprintName,
          startDate: metadata.dataInicio,
          endDate: metadata.dataFim,
        };
        const processed = calculateAllTasksHybridMetrics(sprintTasks, worklogs, period);
        processedTasks.push(...processed);
      });

      // Append backlog and unknown-sprint tasks without hybrid metrics
      const backlogTasks = allTasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      processedTasks.push(...backlogTasks, ...unknownSprintTasks);
    } else if (worklogs.length > 0) {
      const { sprintPeriod } = get();
      const tasksWithSprint = allTasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      const processed = calculateAllTasksHybridMetrics(tasksWithSprint, worklogs, sprintPeriod);
      const backlogTasks = allTasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      processedTasks = [...processed, ...backlogTasks];
    }
    
    // Recalcular sprints
    let sprints: string[];
    if (sprintMetadata.length > 0) {
      const ordered = [...sprintMetadata].sort(
        (a, b) => a.dataInicio.getTime() - b.dataInicio.getTime()
      );
      sprints = ordered.map((m) => m.sprint);
    } else {
      sprints = getAllSprints(processedTasks);
    }
    
    // Manter sprint selecionado se ainda existir, senão escolher o primeiro
    let selectedSprint: string | null = null;
    const { selectedSprint: currentSelected } = get();
    if (sprintMetadata.length > 0) {
      const today = new Date().getTime();
      const active = sprintMetadata.find(
        (m) => today >= m.dataInicio.getTime() && today <= m.dataFim.getTime()
      );
      selectedSprint = active ? active.sprint 
        : (currentSelected && sprints.includes(currentSelected) ? currentSelected : sprints[0] || null);
    } else {
      selectedSprint = currentSelected && sprints.includes(currentSelected) 
        ? currentSelected 
        : sprints[0] || null;
    }
    
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint, sprintMetadata, worklogs)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint, sprintMetadata)
      : [];

    set({
      tasks: processedTasks,
      sprints,
      selectedSprint,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
      layoutFileNames: updatedFileNames,
      layoutFileName: updatedFileNames.length > 0 ? updatedFileNames[updatedFileNames.length - 1] : null,
    });
  },

  removeTasksByFileName: (fileName: string) => {
    const { tasks, worklogs, sprintMetadata, layoutFileNames } = get();
    
    // Remover tarefas que foram importadas do arquivo específico
    // Como não temos uma referência direta, precisamos armazenar o nome do arquivo de origem
    // Por enquanto, vamos assumir que o usuário quer limpar todas as tarefas se remover o arquivo
    // Uma solução melhor seria adicionar um campo fileName em TaskItem
    // Por ora, vamos simplesmente remover o nome do arquivo da lista
    const updatedFileNames = layoutFileNames.filter(fn => fn !== fileName);
    
    // Se não há mais arquivos, limpar todas as tarefas
    if (updatedFileNames.length === 0) {
      set({
        tasks: [],
        sprints: [],
        selectedSprint: null,
        sprintAnalytics: null,
        crossSprintAnalytics: null,
        riskAlerts: [],
        layoutFileNames: [],
        layoutFileName: null,
      });
      return;
    }
    
    // Recalcular tudo com as tarefas restantes
    let processedTasks = tasks;
    if (worklogs.length > 0 && sprintMetadata.length > 0) {
      const tasksBySprint = new Map<string, TaskItem[]>();
      tasks.forEach(task => {
        if (!tasksBySprint.has(task.sprint)) {
          tasksBySprint.set(task.sprint, []);
        }
        tasksBySprint.get(task.sprint)!.push(task);
      });
      
      processedTasks = [];
      tasksBySprint.forEach((sprintTasks, sprintName) => {
        const metadata = sprintMetadata.find(m => m.sprint === sprintName);
        if (!metadata) {
          return;
        }
        const period = {
          sprintName,
          startDate: metadata.dataInicio,
          endDate: metadata.dataFim,
        };
        const processed = calculateAllTasksHybridMetrics(sprintTasks, worklogs, period);
        processedTasks.push(...processed);
      });

      // Re-add backlog and unknown sprints without hybrid metrics
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      const unknownSprintTasks = tasks.filter(
        t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint) && !sprintMetadata.some(m => m.sprint === t.sprint)
      );
      processedTasks.push(...backlogTasks, ...unknownSprintTasks);
    } else if (worklogs.length > 0) {
      const { sprintPeriod } = get();
      const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      const processed = calculateAllTasksHybridMetrics(tasksWithSprint, worklogs, sprintPeriod);
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      processedTasks = [...processed, ...backlogTasks];
    }
    
    let sprints: string[];
    if (sprintMetadata.length > 0) {
      const ordered = [...sprintMetadata].sort(
        (a, b) => a.dataInicio.getTime() - b.dataInicio.getTime()
      );
      sprints = ordered.map((m) => m.sprint);
    } else {
      sprints = getAllSprints(processedTasks);
    }
    
    const { selectedSprint } = get();
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint, sprintMetadata, worklogs)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint, sprintMetadata)
      : [];

    set({
      tasks: processedTasks,
      sprints,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
      layoutFileNames: updatedFileNames,
      layoutFileName: updatedFileNames.length > 0 ? updatedFileNames[updatedFileNames.length - 1] : null,
    });
  },

  setWorklogs: (worklogs: WorklogEntry[], fileName?: string) => {
    const { tasks, sprintMetadata, selectedSprint } = get();
    
    // Recalculate hybrid metrics with new worklogs using sprint-specific periods
    let processedTasks = tasks;
    if (sprintMetadata.length > 0) {
      const tasksBySprint = new Map<string, TaskItem[]>();
      const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      tasksWithSprint.forEach(task => {
        if (!tasksBySprint.has(task.sprint)) tasksBySprint.set(task.sprint, []);
        tasksBySprint.get(task.sprint)!.push(task);
      });
      
      processedTasks = [];
      tasksBySprint.forEach((sprintTasks, sprintName) => {
        const metadata = sprintMetadata.find(m => m.sprint === sprintName);
        if (!metadata) {
          return; // ignore tasks from sprints not listed in metadata
        }
        const period = {
          sprintName,
          startDate: metadata.dataInicio,
          endDate: metadata.dataFim,
        };
        const processed = calculateAllTasksHybridMetrics(sprintTasks, worklogs, period);
        processedTasks.push(...processed);
      });

      // Re-add backlog and unknown sprints without hybrid metrics
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      const unknownSprintTasks = tasksWithSprint.filter(t => !sprintMetadata.some(m => m.sprint === t.sprint));
      processedTasks.push(...backlogTasks, ...unknownSprintTasks);
    } else {
      // Fallback: use single period if no metadata
      const { sprintPeriod } = get();
      const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      const processed = calculateAllTasksHybridMetrics(tasksWithSprint, worklogs, sprintPeriod);
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      processedTasks = [...processed, ...backlogTasks];
    }
    
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint, sprintMetadata, worklogs)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint, sprintMetadata)
      : [];

    const worklogFileNames = fileName ? [fileName] : [];
    set({
      worklogs,
      tasks: processedTasks,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
      worklogFileName: fileName || null,
      worklogFileNames,
    });
  },

  addWorklogs: (newWorklogs: WorklogEntry[], fileName?: string) => {
    const { worklogs, tasks, sprintMetadata, selectedSprint, worklogFileNames } = get();
    
    // Concatenar novos worklogs com os existentes
    const allWorklogs = [...worklogs, ...newWorklogs];
    
    // Adicionar nome do arquivo se fornecido e ainda não estiver na lista
    const updatedFileNames = fileName && !worklogFileNames.includes(fileName)
      ? [...worklogFileNames, fileName]
      : worklogFileNames;
    
    // Recalcular métricas híbridas com todos os worklogs
    let processedTasks = tasks;
    if (sprintMetadata.length > 0) {
      const tasksBySprint = new Map<string, TaskItem[]>();
      const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      tasksWithSprint.forEach(task => {
        if (!tasksBySprint.has(task.sprint)) tasksBySprint.set(task.sprint, []);
        tasksBySprint.get(task.sprint)!.push(task);
      });
      
      processedTasks = [];
      tasksBySprint.forEach((sprintTasks, sprintName) => {
        const metadata = sprintMetadata.find(m => m.sprint === sprintName);
        if (!metadata) {
          return;
        }
        const period = {
          sprintName,
          startDate: metadata.dataInicio,
          endDate: metadata.dataFim,
        };
        const processed = calculateAllTasksHybridMetrics(sprintTasks, allWorklogs, period);
        processedTasks.push(...processed);
      });

      // Re-add backlog and unknown sprints without hybrid metrics
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      const unknownSprintTasks = tasksWithSprint.filter(t => !sprintMetadata.some(m => m.sprint === t.sprint));
      processedTasks.push(...backlogTasks, ...unknownSprintTasks);
    } else {
      const { sprintPeriod } = get();
      const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      const processed = calculateAllTasksHybridMetrics(tasksWithSprint, allWorklogs, sprintPeriod);
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      processedTasks = [...processed, ...backlogTasks];
    }
    
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint, sprintMetadata, worklogs)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint, sprintMetadata)
      : [];

    set({
      worklogs: allWorklogs,
      tasks: processedTasks,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
      worklogFileNames: updatedFileNames,
      worklogFileName: updatedFileNames.length > 0 ? updatedFileNames[updatedFileNames.length - 1] : null,
    });
  },

  removeWorklogsByFileName: (fileName: string) => {
    const { worklogs, tasks, sprintMetadata, selectedSprint, worklogFileNames } = get();
    
    // Remover worklogs do arquivo específico
    // Por enquanto, vamos assumir que não há referência direta
    // Uma solução melhor seria adicionar um campo fileName em WorklogEntry
    // Por ora, vamos simplesmente remover o nome do arquivo da lista
    const updatedFileNames = worklogFileNames.filter(fn => fn !== fileName);
    
    // Se não há mais arquivos, limpar todos os worklogs
    let allWorklogs = worklogs;
    if (updatedFileNames.length === 0) {
      allWorklogs = [];
    }
    
    // Recalcular métricas
    let processedTasks = tasks;
    if (allWorklogs.length > 0 && sprintMetadata.length > 0) {
      const tasksBySprint = new Map<string, TaskItem[]>();
      tasks.forEach(task => {
        if (!tasksBySprint.has(task.sprint)) {
          tasksBySprint.set(task.sprint, []);
        }
        tasksBySprint.get(task.sprint)!.push(task);
      });
      
      processedTasks = [];
      tasksBySprint.forEach((sprintTasks, sprintName) => {
        const metadata = sprintMetadata.find(m => m.sprint === sprintName);
        if (!metadata) {
          return;
        }
        const period = {
          sprintName,
          startDate: metadata.dataInicio,
          endDate: metadata.dataFim,
        };
        const processed = calculateAllTasksHybridMetrics(sprintTasks, allWorklogs, period);
        processedTasks.push(...processed);
      });
    } else if (allWorklogs.length > 0) {
      const { sprintPeriod } = get();
      processedTasks = calculateAllTasksHybridMetrics(tasks, allWorklogs, sprintPeriod);
    }
    
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint, sprintMetadata, worklogs)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint, sprintMetadata)
      : [];

    set({
      worklogs: allWorklogs,
      tasks: processedTasks,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
      worklogFileNames: updatedFileNames,
      worklogFileName: updatedFileNames.length > 0 ? updatedFileNames[updatedFileNames.length - 1] : null,
    });
  },

  setSprintMetadata: (metadata: SprintMetadata[], fileName?: string) => {
    const { tasks, worklogs, selectedSprint } = get();
    
    // Recalculate hybrid metrics with sprint-specific periods
    let processedTasks = tasks;
    if (worklogs.length > 0 && metadata.length > 0) {
      const tasksBySprint = new Map<string, TaskItem[]>();
      const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      tasksWithSprint.forEach(task => {
        if (!tasksBySprint.has(task.sprint)) tasksBySprint.set(task.sprint, []);
        tasksBySprint.get(task.sprint)!.push(task);
      });
      
      processedTasks = [];
      tasksBySprint.forEach((sprintTasks, sprintName) => {
        const sprintMeta = metadata.find(m => m.sprint === sprintName);
        if (!sprintMeta) {
          return; // ignore tasks for sprints not present in spreadsheet
        }
        const period = {
          sprintName,
          startDate: sprintMeta.dataInicio,
          endDate: sprintMeta.dataFim,
        };
        const processed = calculateAllTasksHybridMetrics(sprintTasks, worklogs, period);
        processedTasks.push(...processed);
      });

      // Re-add backlog and unknown sprints without hybrid metrics
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      const unknownSprintTasks = tasksWithSprint.filter(t => !metadata.some(m => m.sprint === t.sprint));
      processedTasks.push(...backlogTasks, ...unknownSprintTasks);
    }
    
    // Build sprint options strictly from metadata
    const ordered = [...metadata].sort(
      (a, b) => a.dataInicio.getTime() - b.dataInicio.getTime()
    );
    const sprints = ordered.map((m) => m.sprint);

    // Determine selected sprint: prefer currently active by date
    const today = new Date().getTime();
    const active = ordered.find(
      (m) => today >= m.dataInicio.getTime() && today <= m.dataFim.getTime()
    );
    const newSelected = active
      ? active.sprint
      : (selectedSprint && sprints.includes(selectedSprint))
        ? selectedSprint
        : sprints[0] || null;

    const sprintAnalytics = newSelected
      ? calculateSprintAnalytics(processedTasks, newSelected, metadata || [], worklogs)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = newSelected
      ? calculateRiskAlerts(processedTasks, newSelected, metadata || [])
      : [];

    set({
      sprintMetadata: metadata,
      sprintsFileName: fileName || null,
      tasks: processedTasks,
      sprints,
      selectedSprint: newSelected,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
    });
  },

  addSprintMetadata: (newMetadata: SprintMetadata[], fileName?: string) => {
    const { sprintMetadata, tasks, worklogs, selectedSprint } = get();
    
    // Combinar metadados, evitando duplicatas por nome de sprint
    const existingSprintNames = new Set(sprintMetadata.map(m => m.sprint));
    const uniqueNewMetadata = newMetadata.filter(m => !existingSprintNames.has(m.sprint));
    const combinedMetadata = [...sprintMetadata, ...uniqueNewMetadata];
    
    // Recalcular métricas híbridas com os novos metadados
    let processedTasks = tasks;
    if (worklogs.length > 0 && combinedMetadata.length > 0) {
      const tasksBySprint = new Map<string, TaskItem[]>();
      const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      tasksWithSprint.forEach(task => {
        if (!tasksBySprint.has(task.sprint)) tasksBySprint.set(task.sprint, []);
        tasksBySprint.get(task.sprint)!.push(task);
      });
      
      processedTasks = [];
      tasksBySprint.forEach((sprintTasks, sprintName) => {
        const sprintMeta = combinedMetadata.find(m => m.sprint === sprintName);
        if (!sprintMeta) {
          return;
        }
        const period = {
          sprintName,
          startDate: sprintMeta.dataInicio,
          endDate: sprintMeta.dataFim,
        };
        const processed = calculateAllTasksHybridMetrics(sprintTasks, worklogs, period);
        processedTasks.push(...processed);
      });

      // Re-add backlog and unknown sprints without hybrid metrics
      const backlogTasks = tasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      const unknownSprintTasks = tasksWithSprint.filter(t => !combinedMetadata.some(m => m.sprint === t.sprint));
      processedTasks.push(...backlogTasks, ...unknownSprintTasks);
    }
    
    // Recalcular sprints ordenados por data
    const ordered = [...combinedMetadata].sort(
      (a, b) => a.dataInicio.getTime() - b.dataInicio.getTime()
    );
    const sprints = ordered.map((m) => m.sprint);

    const today = new Date().getTime();
    const active = ordered.find(
      (m) => today >= m.dataInicio.getTime() && today <= m.dataFim.getTime()
    );
    const newSelected = active
      ? active.sprint
      : (selectedSprint && sprints.includes(selectedSprint))
        ? selectedSprint
        : sprints[0] || null;

    const sprintAnalytics = newSelected
      ? calculateSprintAnalytics(processedTasks, newSelected, combinedMetadata, worklogs)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = newSelected
      ? calculateRiskAlerts(processedTasks, newSelected, combinedMetadata)
      : [];

    set({
      sprintMetadata: combinedMetadata,
      sprintsFileName: fileName || null,
      tasks: processedTasks,
      sprints,
      selectedSprint: newSelected,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
    });
  },

  removeSprintMetadataByFileName: (_fileName: string) => {
    // Para sprint metadata, vamos simplesmente limpar tudo
    // pois não há uma forma fácil de saber quais metadados vieram de qual arquivo
    const { tasks, worklogs } = get();
    
    // Limpar todos os metadados
    let processedTasks = tasks;
    if (worklogs.length > 0) {
      const { sprintPeriod } = get();
      processedTasks = calculateAllTasksHybridMetrics(tasks, worklogs, sprintPeriod);
    }
    
    const sprints = getAllSprints(processedTasks);
    const newSelected = sprints.length > 0 ? sprints[0] : null;

    const sprintAnalytics = newSelected
      ? calculateSprintAnalytics(processedTasks, newSelected, [], worklogs)
      : null;
    
    const crossSprintAnalytics = calculateCrossSprintAnalytics(processedTasks);
    
    const riskAlerts = newSelected
      ? calculateRiskAlerts(processedTasks, newSelected, [])
      : [];

    set({
      sprintMetadata: [],
      sprintsFileName: null,
      tasks: processedTasks,
      sprints,
      selectedSprint: newSelected,
      sprintAnalytics,
      crossSprintAnalytics,
      riskAlerts,
    });
  },

  setSprintPeriod: (period: SprintPeriod | null) => {
    const { tasks, worklogs, selectedSprint, sprintMetadata } = get();
    
    // Recalculate hybrid metrics with new sprint period
    const processedTasks = worklogs.length > 0
      ? calculateAllTasksHybridMetrics(tasks, worklogs, period)
      : tasks;
    
    const sprintAnalytics = selectedSprint
      ? calculateSprintAnalytics(processedTasks, selectedSprint, sprintMetadata, worklogs)
      : null;
    
    const riskAlerts = selectedSprint
      ? calculateRiskAlerts(processedTasks, selectedSprint, sprintMetadata)
      : [];

    set({
      sprintPeriod: period,
      tasks: processedTasks,
      sprintAnalytics,
      riskAlerts,
    });
  },

  setSelectedSprint: (sprint: string) => {
    const { tasks, worklogs, sprintMetadata } = get();
    const sprintAnalytics = calculateSprintAnalytics(tasks, sprint, sprintMetadata, worklogs);
    const riskAlerts = calculateRiskAlerts(tasks, sprint, sprintMetadata);

    set({
      selectedSprint: sprint,
      sprintAnalytics,
      riskAlerts,
      selectedDeveloper: null,
    });
  },

  setTaskFilters: (filters: TaskFilters) => {
    // Limpar todos os filtros antes de aplicar novos
    set({ 
      taskFilters: {},
      analyticsFilter: null,
      selectedDeveloper: null,
    });
    // Aplicar o novo filtro
    set({ taskFilters: filters });
  },

  setSelectedDeveloper: (developer: string | null) => {
    // Limpar todos os filtros antes de aplicar novo desenvolvedor
    set({ 
      taskFilters: {},
      analyticsFilter: null,
    });
    // Aplicar o novo desenvolvedor
    set({ selectedDeveloper: developer });
  },

  setAnalyticsFilter: (filter) => {
    // Limpar todos os filtros antes de aplicar novo filtro de analytics
    set({ 
      taskFilters: {},
      selectedDeveloper: null,
    });
    // Aplicar o novo filtro de analytics
    set({ analyticsFilter: filter });
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
      sprintMetadata: [],
      sprintsFileName: null,
      layoutFileName: null,
      layoutFileNames: [],
      worklogFileName: null,
      worklogFileNames: [],
      taskFilters: {},
      selectedDeveloper: null,
      analyticsFilter: null,
      isBreakdownModalOpen: false,
      developerForBreakdown: null,
      isWorklogDeveloperModalOpen: false,
      worklogDeveloperName: null,
    });
  },

  openBreakdownModal: (developer: DeveloperMetrics) => {
    set({ isBreakdownModalOpen: true, developerForBreakdown: developer });
  },

  closeBreakdownModal: () => {
    set({ isBreakdownModalOpen: false, developerForBreakdown: null });
  },

  openWorklogDeveloperModal: (developerName: string) => {
    set({ isWorklogDeveloperModalOpen: true, worklogDeveloperName: developerName });
  },

  closeWorklogDeveloperModal: () => {
    set({ isWorklogDeveloperModalOpen: false, worklogDeveloperName: null });
  },

  // Presentation actions
  setPresentationConfig: (update) => {
    set((state) => ({
      presentation: { ...state.presentation, ...update },
    }));
  },
  setPresentationSteps: (steps) => {
    set((state) => ({
      presentation: { ...state.presentation, steps },
    }));
  },
  startPresentation: () => {
    set((state) => ({
      presentation: { ...state.presentation, isActive: true, isPlaying: true },
    }));
  },
  stopPresentation: () => {
    set((state) => ({
      presentation: { ...state.presentation, isPlaying: false },
    }));
  },
  nextPresentationStep: () => {
    set((state) => {
      const total = state.presentation.steps.length;
      const next = total === 0 ? 0 : (state.presentation.currentStepIndex + 1) % total;
      return { presentation: { ...state.presentation, currentStepIndex: next } };
    });
  },
  prevPresentationStep: () => {
    set((state) => {
      const total = state.presentation.steps.length;
      const prev = total === 0 ? 0 : (state.presentation.currentStepIndex - 1 + total) % total;
      return { presentation: { ...state.presentation, currentStepIndex: prev } };
    });
  },
  setCurrentPresentationIndex: (index) => {
    set((state) => ({
      presentation: { ...state.presentation, currentStepIndex: index },
    }));
  },

  // Computed getter for filtered tasks
  getFilteredTasks: () => {
    const { tasks, taskFilters, selectedSprint, selectedDeveloper, analyticsFilter } = get();
    
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
      filtered = filtered.filter((t) => t.feature.includes(taskFilters.feature!));
    }

    if (taskFilters.modulo) {
      filtered = filtered.filter((t) => t.modulo === taskFilters.modulo);
    }

    if (taskFilters.categoria) {
      filtered = filtered.filter((t) => taskHasCategory(t.categorias, taskFilters.categoria));
    }

    if (taskFilters.sprint) {
      filtered = filtered.filter((t) => t.sprint === taskFilters.sprint);
    }

    if (taskFilters.status) {
      filtered = filtered.filter((t) => t.status === taskFilters.status);
    }

    if (analyticsFilter) {
      if (analyticsFilter.type === 'feature') {
        filtered = filtered.filter((t) => t.feature.includes(analyticsFilter.value));
      } else if (analyticsFilter.type === 'client') {
        filtered = filtered.filter((t) => taskHasCategory(t.categorias, analyticsFilter.value));
      }
    }

    return filtered;
  },
  
  // Get sprint period from metadata
  getSprintPeriod: (sprintName: string) => {
    const { sprintMetadata } = get();
    const metadata = sprintMetadata.find(m => m.sprint === sprintName);
    
    if (metadata) {
      return {
        sprintName,
        startDate: metadata.dataInicio,
        endDate: metadata.dataFim,
      };
    }
    
    return null;
  },
}));

