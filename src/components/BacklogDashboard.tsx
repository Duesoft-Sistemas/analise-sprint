import React, { useMemo, useState } from 'react';
import {
  Inbox,
  Bug,
  HelpCircle,
  CheckSquare,
  BarChart3,
  BarChart2,
  List,
  Building2,
  Code,
  Layers,
  Calendar,
  TrendingUp,
  Filter,
  Clock,
} from 'lucide-react';
import { FileSpreadsheet } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { calculateBacklogAnalytics, calculateBacklogAnalysisByClient, calculateBacklogAnalysisByFeature, BacklogAnalytics as BacklogAnalyticsType } from '../services/analytics';
import { Package, User, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { formatHours, normalizeForComparison, isCompletedStatus, isAuxilioTask, isNeutralTask, taskHasCategory } from '../utils/calculations';
import { TaskItem } from '../types';
import { AnalyticsChart } from './AnalyticsCharts';

// Helper to check if task has DuvidaOculta in detalhesOcultos array
function isDuvidaOcultaTask(task: TaskItem): boolean {
  if (!task.detalhesOcultos || task.detalhesOcultos.length === 0) return false;
  return task.detalhesOcultos.some(d => {
    const normalized = normalizeForComparison(d);
    return normalized === 'duvidaoculta' || normalized === 'duvida oculta';
  });
}

interface BacklogDashboardProps {
  // Optional anchors for presentation mode scrolling
  summaryRef?: React.RefObject<HTMLDivElement>;
  byComplexityRef?: React.RefObject<HTMLDivElement>;
  byFeatureRef?: React.RefObject<HTMLDivElement>;
  byClientRef?: React.RefObject<HTMLDivElement>;
  byStatusRef?: React.RefObject<HTMLDivElement>;
  insightsRef?: React.RefObject<HTMLDivElement>;
  taskListRef?: React.RefObject<HTMLDivElement>;
}

export const BacklogDashboard: React.FC<BacklogDashboardProps> = ({
  summaryRef,
  byComplexityRef,
  byFeatureRef,
  byClientRef,
  byStatusRef,
  insightsRef,
  taskListRef,
}) => {
  const tasks = useSprintStore((state) => state.tasks);
  // Use a single state object to ensure atomic updates and prevent filter accumulation
  const [activeFilter, setActiveFilter] = useState<{
    type: 'type' | 'feature' | 'client' | 'complexity' | null;
    value: string | number | null;
  } | null>(null);
  const [topLimit, setTopLimit] = useState<number | null>(20);
  const [viewScope, setViewScope] = useState<'backlog' | 'pendingAll'>('pendingAll'); // default: all pending tasks
  const [featureViewMode, setFeatureViewMode] = useState<'chart' | 'list'>('chart');
  const [clientViewMode, setClientViewMode] = useState<'chart' | 'list'>('chart');

  // Extract filter values from activeFilter for backward compatibility
  const filterType = activeFilter?.type === 'type' ? (activeFilter.value as string) : null;
  const filterComplexity = activeFilter?.type === 'complexity' ? (activeFilter.value as number) : null;

  // Function to clear all filters
  const clearFilters = () => {
    setActiveFilter(null);
  };

  // Helper functions that always clear filters before applying new one
  // Using a single state ensures atomic updates - no accumulation possible
  const applyTypeFilter = (type: string | null) => {
    if (type) {
      setActiveFilter({ type: 'type', value: type });
    } else {
      setActiveFilter(null);
    }
  };

  const applyFeatureFilter = (feature: string | null) => {
    if (feature) {
      setActiveFilter({ type: 'feature', value: feature });
    } else {
      setActiveFilter(null);
    }
  };

  const applyClientFilter = (client: string | null) => {
    if (client) {
      setActiveFilter({ type: 'client', value: client });
    } else {
      setActiveFilter(null);
    }
  };

  const applyComplexityFilter = (complexity: number | null) => {
    if (complexity !== null) {
      setActiveFilter({ type: 'complexity', value: complexity });
    } else {
      setActiveFilter(null);
    }
  };

  // Helper function to get filter display label
  const getFilterLabel = (): { label: string; icon: React.ReactNode; color: string } | null => {
    if (!activeFilter) return null;

    switch (activeFilter.type) {
      case 'type':
        const typeValue = activeFilter.value as string;
        const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
          'bugs': { label: 'Bugs Reais', icon: <Bug className="w-4 h-4" />, color: 'red' },
          'dubidasOcultas': { label: 'Dúvidas Ocultas', icon: <HelpCircle className="w-4 h-4" />, color: 'yellow' },
          'Folha': { label: 'Folha', icon: <FileSpreadsheet className="w-4 h-4" />, color: 'green' },
          'Tarefa': { label: 'Tarefas', icon: <CheckSquare className="w-4 h-4" />, color: 'green' },
        };
        return typeLabels[typeValue] || { label: typeValue, icon: <CheckSquare className="w-4 h-4" />, color: 'gray' };
      
      case 'feature':
        return {
          label: `Feature: ${activeFilter.value as string}`,
          icon: <Code className="w-4 h-4" />,
          color: 'blue'
        };
      
      case 'client':
        return {
          label: `Cliente: ${activeFilter.value as string}`,
          icon: <Building2 className="w-4 h-4" />,
          color: 'purple'
        };
      
      case 'complexity':
        return {
          label: `Complexidade: Nível ${activeFilter.value}`,
          icon: <Layers className="w-4 h-4" />,
          color: 'orange'
        };
      
      default:
        return null;
    }
  };

  // Calculate analytics based on scope
  const analytics: BacklogAnalyticsType = useMemo(() => {
    // Helper to build analytics from a given subset of tasks (no worklog, only estimativa)
    // Used for "pendingAll" scope which doesn't have all advanced analyses
    const buildAnalyticsFromTasks = (taskSubset: TaskItem[]) => {
      // Exclude neutral (reunião/treinamento) and auxilio tasks from the analysis
      const pendingTasks = taskSubset.filter((t) => !isNeutralTask(t) && !isAuxilioTask(t));

      // Helpers
      const isDuvidaOcultaTaskLocal = (t: TaskItem) => {
        if (!t.detalhesOcultos || t.detalhesOcultos.length === 0) return false;
        return t.detalhesOcultos.some(d => {
          const normalized = normalizeForComparison(d);
          return normalized === 'duvidaoculta' || normalized === 'duvida oculta';
        });
      };
      const isFolha = (t: TaskItem) => t.modulo === 'DSFolha' || (t.feature || []).includes('DSFolha');

      const bugs = pendingTasks.filter((t) => t.tipo === 'Bug' && !isDuvidaOcultaTaskLocal(t) && !isFolha(t));
      const dubidasOcultas = pendingTasks.filter((t) => t.tipo === 'Bug' && isDuvidaOcultaTaskLocal(t) && !isFolha(t));
      const folha = pendingTasks.filter((t) => (t.modulo === 'DSFolha' || (t.feature || []).includes('DSFolha')));
      const tarefas = pendingTasks.filter(
        (t) => !(t.tipo === 'Bug' && !isDuvidaOcultaTaskLocal(t) && !isFolha(t)) && 
               !(t.tipo === 'Bug' && isDuvidaOcultaTaskLocal(t)) &&
               !(t.modulo === 'DSFolha' || (t.feature || []).includes('DSFolha'))
      );

      const createTotalizer = (label: string, list: TaskItem[]) => ({
        label,
        count: list.length,
        hours: 0,
        estimatedHours: list.reduce((sum, x) => sum + (x.estimativa || 0), 0),
      });

      // Complexity
      const complexityMap = new Map<number, TaskItem[]>();
      pendingTasks.forEach((task) => {
        const level = task.complexidade || 1;
        if (!complexityMap.has(level)) complexityMap.set(level, []);
        complexityMap.get(level)!.push(task);
      });
      const byComplexity = Array.from({ length: 5 }, (_, i) => createTotalizer(`Complexidade ${i + 1}`, complexityMap.get(i + 1) || []));

      // Feature/Client reuse backlog helpers
      const byFeature = calculateBacklogAnalysisByFeature(pendingTasks);
      const byClient = calculateBacklogAnalysisByClient(pendingTasks);

      // Status
      const statusMap = new Map<string, TaskItem[]>();
      pendingTasks.forEach((task) => {
        const status = task.status || '(Sem Status)';
        if (!statusMap.has(status)) statusMap.set(status, []);
        statusMap.get(status)!.push(task);
      });
      const byStatus = Array.from(statusMap.entries()).map(([status, list]) => createTotalizer(status, list)).sort((a, b) => b.count - a.count);

      // For pendingAll, return simplified structure (no advanced analyses)
      return {
        summary: {
          totalTasks: pendingTasks.length,
          totalEstimatedHours: pendingTasks.reduce((sum, t) => sum + (t.estimativa || 0), 0),
          bugs: bugs.length,
          dubidasOcultas: dubidasOcultas.length,
          folha: folha.length,
          tarefas: tarefas.length,
        },
        byType: {
          bugs: createTotalizer('Bugs Reais', bugs),
          dubidasOcultas: createTotalizer('Dúvidas Ocultas', dubidasOcultas),
          folha: createTotalizer('Folha', folha),
          tarefas: createTotalizer('Tarefas', tarefas),
        },
        byComplexity,
        byFeature,
        byClient,
        byModule: [], // Not available for pendingAll
        byStatus,
        byResponsible: [], // Not available for pendingAll
        ageAnalysis: {
          averageAgeDays: 0,
          ageDistribution: [],
          oldestTasks: [],
        },
        estimateAnalysis: {
          tasksWithoutEstimate: { count: 0, tasks: [] },
          estimateDistribution: [],
          averageEstimate: 0,
          averageEstimateByType: { bugs: 0, dubidasOcultas: 0, folha: 0, tarefas: 0 },
        },
        riskAnalysis: {
          highRiskTasks: [],
          riskDistribution: [],
        },
        tasks: pendingTasks,
      };
    };

    if (viewScope === 'backlog') {
      // Use the full calculateBacklogAnalytics function for backlog scope
      // This includes all new analyses (age, estimates, risk, module, responsible)
      return calculateBacklogAnalytics(tasks);
    }

    // pendingAll: consider all tasks not completed (including backlog), simple analysis (counts/estimates)
    const pendingTasks = tasks.filter((t) => !isCompletedStatus(t.status));
    return buildAnalyticsFromTasks(pendingTasks);
  }, [tasks, viewScope]);

  // Helper to check if task is Folha
  const isFolhaTask = (t: TaskItem) => t.modulo === 'DSFolha' || (t.feature || []).includes('DSFolha');

  // Filter analytics if needed
  // CRITICAL: Always start from the complete analytics.tasks array and apply only ONE active filter at a time
  // Using activeFilter state ensures only one filter can be active at a time - no accumulation possible
  const filteredTasks = useMemo(() => {
    // CRITICAL: Always start from a fresh copy of the complete list
    // This ensures we never accumulate results from previous filters
    let filtered = [...analytics.tasks];

    // Apply only ONE filter based on activeFilter state
    // Since activeFilter is a single state object, only one filter can be active at a time
    if (!activeFilter) {
      // No filter active - return empty array (list only shows when filter is selected)
      return [];
    } else if (activeFilter.type === 'type' && activeFilter.value && activeFilter.value !== 'all') {
      const type = activeFilter.value as string;
      if (type === 'bugs') {
        filtered = filtered.filter((t) => t.tipo === 'Bug' && !isDuvidaOcultaTask(t) && !isFolhaTask(t));
      } else if (type === 'dubidasOcultas') {
        filtered = filtered.filter((t) => t.tipo === 'Bug' && isDuvidaOcultaTask(t) && !isFolhaTask(t));
      } else if (type === 'Folha') {
        filtered = filtered.filter((t) => isFolhaTask(t));
      } else if (type === 'Tarefa') {
        // Tarefas são todas que não são bugs reais, dúvidas ocultas ou folha
        filtered = filtered.filter((t) => 
          !(t.tipo === 'Bug' && !isDuvidaOcultaTask(t) && !isFolhaTask(t)) &&
          !(t.tipo === 'Bug' && isDuvidaOcultaTask(t)) &&
          !isFolhaTask(t)
        );
      } else {
        filtered = filtered.filter((t) => t.tipo === type);
      }
    } else if (activeFilter.type === 'feature' && activeFilter.value && activeFilter.value !== 'all') {
      const feature = activeFilter.value as string;
      filtered = filtered.filter((t) => t.feature.includes(feature));
    } else if (activeFilter.type === 'client' && activeFilter.value && activeFilter.value !== 'all') {
      const client = activeFilter.value as string;
      filtered = filtered.filter((t) => taskHasCategory(t.categorias, client));
    } else if (activeFilter.type === 'complexity' && activeFilter.value !== null) {
      const complexity = activeFilter.value as number;
      filtered = filtered.filter((t) => (t.complexidade || 1) === complexity);
    }

    // Remove duplicates based on id or chave (only if both exist)
    const seen = new Set<string>();
    filtered = filtered.filter((t) => {
      const key = (t.id || t.chave || '').toString();
      // Only filter duplicates if we have a valid key
      if (key && key.trim() !== '') {
        if (seen.has(key)) {
          return false; // Duplicate
        }
        seen.add(key);
      }
      // If no key, keep the task (it will be rendered with a fallback key)
      return true;
    });

    // Sort by task code (chave) - ascending order
    filtered = filtered.sort((a, b) => {
      const codeA = (a.chave || a.id || '').toUpperCase();
      const codeB = (b.chave || b.id || '').toUpperCase();
      return codeA.localeCompare(codeB);
    });

    return filtered;
  }, [analytics.tasks, activeFilter]);

  const TOP_OPTIONS = [5, 10, 15, 20, null];

  if (analytics.summary.totalTasks === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 opacity-50" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhuma tarefa em backlog</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Todas as tarefas estão alocadas em sprints. Parabéns! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-500 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Inbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Análise de Backlog</h2>
              <p className="text-gray-200 text-sm">
                Visualização completa para alocação eficiente nos sprints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-200/80">Escopo</span>
            <button
              onClick={() => setViewScope('backlog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewScope === 'backlog' ? 'bg-white text-gray-900' : 'bg-white/10 text-white border border-white/30'}`}
              title="Mostrar somente tarefas sem sprint (Backlog)"
            >
              Backlog
            </button>
            <button
              onClick={() => setViewScope('pendingAll')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewScope === 'pendingAll' ? 'bg-white text-gray-900' : 'bg-white/10 text-white border border-white/30'}`}
              title="Mostrar todas as tarefas pendentes (com ou sem sprint)"
            >
              Pendentes (todos)
            </button>
            {activeFilter && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-red-500/80 hover:bg-red-500 text-white border border-red-400/50 flex items-center gap-1.5"
                title="Limpar todos os filtros"
              >
                <Filter className="w-3 h-3" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div ref={summaryRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <SummaryCard
          icon={<Inbox className="w-5 h-5" />}
          label="Total de Tarefas"
          value={analytics.summary.totalTasks.toString()}
          subtitle="tarefas em backlog"
          color="gray"
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5" />}
          label="Horas Estimadas"
          value={formatHours(analytics.summary.totalEstimatedHours)}
          subtitle="de trabalho planejado"
          color="blue"
        />
        <SummaryCard
          icon={<Bug className="w-5 h-5" />}
          label="Bugs Reais"
          value={analytics.summary.bugs.toString()}
          subtitle={`${formatHours(analytics.byType.bugs.estimatedHours)} estimadas`}
          color="red"
          onClick={() => applyTypeFilter('bugs')}
          isActive={filterType === 'bugs'}
        />
        <SummaryCard
          icon={<HelpCircle className="w-5 h-5" />}
          label="Dúvidas Ocultas"
          value={analytics.summary.dubidasOcultas.toString()}
          subtitle={`${formatHours(analytics.byType.dubidasOcultas.estimatedHours)} estimadas`}
          color="yellow"
          onClick={() => applyTypeFilter('dubidasOcultas')}
          isActive={filterType === 'dubidasOcultas'}
        />
        <SummaryCard
          icon={<FileSpreadsheet className="w-5 h-5" />}
          label="Folha"
          value={analytics.summary.folha.toString()}
          subtitle={`${formatHours(analytics.byType.folha.estimatedHours)} estimadas`}
          color="green"
          onClick={() => applyTypeFilter('Folha')}
          isActive={filterType === 'Folha'}
        />
        <SummaryCard
          icon={<CheckSquare className="w-5 h-5" />}
          label="Tarefas"
          value={analytics.summary.tarefas.toString()}
          subtitle={`${formatHours(analytics.byType.tarefas.estimatedHours)} estimadas`}
          color="green"
          onClick={() => applyTypeFilter('Tarefa')}
          isActive={filterType === 'Tarefa'}
        />
      </div>

      {/* (Removido) Distribuição por Tipo - redundante com os cards do topo */}

      {/* Distribution by Complexity */}
      <div ref={byComplexityRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Complexidade</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {analytics.byComplexity.map((complexity, index) => (
            <ComplexityCard
              key={index}
              level={index + 1}
              count={complexity.count}
              hours={complexity.estimatedHours}
              onClick={() => applyComplexityFilter(index + 1)}
              isActive={filterComplexity === index + 1}
            />
          ))}
        </div>
      </div>

      {/* Analysis by Feature */}
      <div ref={byFeatureRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Feature</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({analytics.byFeature.length} features)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFeatureViewMode('chart')} className={`p-1.5 rounded-md ${featureViewMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Gráfico">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button onClick={() => setFeatureViewMode('list')} className={`p-1.5 rounded-md ${featureViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Lista">
              <List className="w-4 h-4" />
            </button>
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={topLimit === null ? 'all' : topLimit.toString()}
              onChange={(e) => setTopLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
            >
              {TOP_OPTIONS.map((option) => (
                <option key={option ?? 'all'} value={option ?? 'all'}>
                  Top {option ?? 'Todas'}
                </option>
              ))}
            </select>
          </div>
        </div>
        {featureViewMode === 'chart' ? (
          <AnalyticsChart
            data={analytics.byFeature.slice(0, topLimit ?? undefined)}
            title=""
            onBarClick={(value) => {
              // Limpar todos os filtros antes de aplicar novo
              applyFeatureFilter(value);
            }}
          />
        ) : (
          <div className="space-y-2">
            {analytics.byFeature
              .slice(0, topLimit ?? undefined)
              .map((feature, index) => {
                const maxHours = analytics.byFeature[0]?.estimatedHours || 1;
                const percentage = (feature.estimatedHours / maxHours) * 100;
                const totalFeatureHoursAll = analytics.byFeature.reduce((sum, f) => sum + (f.estimatedHours || 0), 0);
                const percentOfTotal = totalFeatureHoursAll > 0 ? (feature.estimatedHours / totalFeatureHoursAll) * 100 : 0;
                
                return (
                  <div
                    key={feature.label}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                    </div>
                    <div className="flex-shrink-0 text-blue-500 dark:text-blue-400">
                      <Code className="w-4 h-4" />
                    </div>
                    <div className="flex-shrink-0 min-w-[200px] flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={feature.label}>
                        {feature.label}
                      </p>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {feature.count} tarefa{feature.count !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium min-w-[48px] text-right">
                        {percentOfTotal.toFixed(1)}%
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[200px]">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[80px] text-right">
                        {formatHours(feature.estimatedHours)}
                      </span>
                    </div>
                  </div>
                );
              })}
            {analytics.byFeature.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                Nenhuma feature encontrada
              </p>
            )}
          </div>
        )}
      </div>

      {/* Analysis by Client */}
      <div ref={byClientRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Cliente</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({analytics.byClient.length} clientes)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setClientViewMode('chart')} className={`p-1.5 rounded-md ${clientViewMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Gráfico">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button onClick={() => setClientViewMode('list')} className={`p-1.5 rounded-md ${clientViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Lista">
              <List className="w-4 h-4" />
            </button>
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={topLimit === null ? 'all' : topLimit.toString()}
              onChange={(e) => setTopLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
            >
              {TOP_OPTIONS.map((option) => (
                <option key={option ?? 'all'} value={option ?? 'all'}>
                  Top {option ?? 'Todas'}
                </option>
              ))}
            </select>
          </div>
        </div>
        {clientViewMode === 'chart' ? (
          <AnalyticsChart
            data={analytics.byClient.slice(0, topLimit ?? undefined)}
            title=""
            onBarClick={(value) => {
              // Limpar todos os filtros antes de aplicar novo
              applyClientFilter(value);
            }}
          />
        ) : (
          <div className="space-y-2">
            {analytics.byClient
              .slice(0, topLimit ?? undefined)
              .map((client, index) => {
                const maxHours = analytics.byClient[0]?.estimatedHours || 1;
                const percentage = (client.estimatedHours / maxHours) * 100;
                const totalClientHoursAll = analytics.byClient.reduce((sum, c) => sum + (c.estimatedHours || 0), 0);
                const percentOfTotal = totalClientHoursAll > 0 ? (client.estimatedHours / totalClientHoursAll) * 100 : 0;
                
                return (
                  <div
                    key={client.label}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                    </div>
                    <div className="flex-shrink-0 text-purple-500 dark:text-purple-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-shrink-0 min-w-[200px] flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={client.label}>
                        {client.label}
                      </p>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {client.count} tarefa{client.count !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium min-w-[48px] text-right">
                        {percentOfTotal.toFixed(1)}%
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[200px]">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[80px] text-right">
                        {formatHours(client.estimatedHours)}
                      </span>
                    </div>
                  </div>
                );
              })}
            {analytics.byClient.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                Nenhum cliente encontrado
              </p>
            )}
          </div>
        )}
      </div>

      {/* Analysis by Module */}
      {viewScope === 'backlog' && analytics.byModule.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Módulo</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({analytics.byModule.length} módulos)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.byModule.slice(0, 9).map((module) => (
              <div
                key={module.label}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{module.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{module.count}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">tarefas</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatHours(module.estimatedHours)} estimadas
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis by Responsible */}
      {viewScope === 'backlog' && analytics.byResponsible.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Responsável</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({analytics.byResponsible.length} responsáveis)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.byResponsible.slice(0, 9).map((responsible) => (
              <div
                key={responsible.label}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{responsible.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{responsible.count}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">tarefas</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatHours(responsible.estimatedHours)} estimadas
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis by Status */}
      {analytics.byStatus.length > 0 && (
        <div ref={byStatusRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Status</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.byStatus.slice(0, 9).map((status) => (
              <div
                key={status.label}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{status.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{status.count}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">tarefas</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatHours(status.estimatedHours)} estimadas
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Age Analysis - Temporal */}
      {viewScope === 'backlog' && analytics.ageAnalysis.ageDistribution.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análise Temporal (Idade do Backlog)</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Idade média: {analytics.ageAnalysis.averageAgeDays.toFixed(1)} dias
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {analytics.ageAnalysis.ageDistribution.map((ageRange) => (
              <div
                key={ageRange.label}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{ageRange.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{ageRange.count}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">tarefas</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatHours(ageRange.estimatedHours)} estimadas
                </p>
              </div>
            ))}
          </div>
          {analytics.ageAnalysis.oldestTasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tarefas Mais Antigas (Top 5)</p>
              <div className="space-y-2">
                {[...analytics.ageAnalysis.oldestTasks].sort((a, b) => {
                  const codeA = (a.chave || a.id || '').toUpperCase();
                  const codeB = (b.chave || b.id || '').toUpperCase();
                  return codeA.localeCompare(codeB);
                }).slice(0, 5).map((task) => {
                  const ageDays = task.criado && !isNaN(task.criado.getTime())
                    ? Math.floor((new Date().getTime() - task.criado.getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  return (
                    <div key={task.id || task.chave} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {task.chave || task.id}: {task.resumo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ageDays !== null ? `${ageDays} dias` : 'Data inválida'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                        {formatHours(task.estimativa || 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estimate Analysis */}
      {viewScope === 'backlog' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análise de Estimativas</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Média: {formatHours(analytics.estimateAnalysis.averageEstimate)}
            </span>
          </div>
          {analytics.estimateAnalysis.tasksWithoutEstimate.count > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                ⚠️ {analytics.estimateAnalysis.tasksWithoutEstimate.count} tarefa{analytics.estimateAnalysis.tasksWithoutEstimate.count !== 1 ? 's' : ''} sem estimativa
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {analytics.estimateAnalysis.estimateDistribution.map((range) => (
              <div
                key={range.label}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{range.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{range.count}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">tarefas</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatHours(range.estimatedHours)} estimadas
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Média de Estimativa por Tipo</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Bugs</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatHours(analytics.estimateAnalysis.averageEstimateByType.bugs)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Dúvidas Ocultas</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatHours(analytics.estimateAnalysis.averageEstimateByType.dubidasOcultas)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Folha</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatHours(analytics.estimateAnalysis.averageEstimateByType.folha)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Tarefas</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatHours(analytics.estimateAnalysis.averageEstimateByType.tarefas)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis */}
      {viewScope === 'backlog' && analytics.riskAnalysis.riskDistribution.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análise de Risco</h3>
            {analytics.riskAnalysis.highRiskTasks.length > 0 && (
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                {analytics.riskAnalysis.highRiskTasks.length} tarefa{analytics.riskAnalysis.highRiskTasks.length !== 1 ? 's' : ''} de alto risco
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {analytics.riskAnalysis.riskDistribution.map((risk) => {
              const colorClasses = {
                'Baixo': 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800',
                'Médio': 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800',
                'Alto': 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800',
                'Crítico': 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800',
              };
              const colorClass = colorClasses[risk.label as keyof typeof colorClasses] || colorClasses['Baixo'];
              return (
                <div
                  key={risk.label}
                  className={`bg-gradient-to-br ${colorClass} rounded-lg p-4 border-2`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{risk.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{risk.count}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">tarefas</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatHours(risk.estimatedHours)} estimadas
                  </p>
                </div>
              );
            })}
          </div>
          {analytics.riskAnalysis.highRiskTasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tarefas de Alto Risco (Top 10)</p>
              <div className="space-y-2">
                {[...analytics.riskAnalysis.highRiskTasks].sort((a, b) => {
                  const codeA = (a.task.chave || a.task.id || '').toUpperCase();
                  const codeB = (b.task.chave || b.task.id || '').toUpperCase();
                  return codeA.localeCompare(codeB);
                }).slice(0, 10).map((riskItem) => (
                  <div key={riskItem.task.id || riskItem.task.chave} className="flex items-start justify-between py-2 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                          Risco: {riskItem.riskScore}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {riskItem.task.chave || riskItem.task.id}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {riskItem.task.resumo}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {riskItem.riskFactors.map((factor, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                      {formatHours(riskItem.task.estimativa || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Priority Insights */}
      <div ref={insightsRef} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-md border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Insights para Alocação</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Análise detalhada do backlog para planejamento estratégico</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Visão Geral */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Visão Geral</h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5">📊</span>
                <p>
                  <strong>{analytics.summary.totalTasks}</strong> tarefas pendentes totalizando <strong>{formatHours(analytics.summary.totalEstimatedHours)}</strong> de trabalho planejado
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5">⏱️</span>
                <p>
                  Média de <strong>{analytics.summary.totalTasks > 0 ? formatHours(analytics.summary.totalEstimatedHours / analytics.summary.totalTasks) : '0h'}</strong> por tarefa
                </p>
              </div>
              {analytics.byFeature.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 dark:text-blue-400 mt-0.5">🔧</span>
                  <p>
                    Distribuídas em <strong>{analytics.byFeature.length}</strong> features diferentes
                  </p>
                </div>
              )}
              {analytics.byClient.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 dark:text-purple-400 mt-0.5">🏢</span>
                  <p>
                    <strong>{analytics.byClient.length}</strong> clientes com demanda pendente
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Prioridades e Riscos */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Prioridades e Riscos</h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-red-500 dark:text-red-400 mt-0.5">🐛</span>
                <p>
                  <strong>{analytics.summary.bugs}</strong> bugs reais ({formatHours(analytics.byType.bugs.estimatedHours)}) precisam atenção imediata
                </p>
              </div>
              {analytics.summary.dubidasOcultas > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500 dark:text-yellow-400 mt-0.5">❓</span>
                  <p>
                    <strong>{analytics.summary.dubidasOcultas}</strong> dúvidas ocultas ({formatHours(analytics.byType.dubidasOcultas.estimatedHours)}) requerem esclarecimento
                  </p>
                </div>
              )}
              {viewScope === 'backlog' && analytics.riskAnalysis.highRiskTasks.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-red-500 dark:text-red-400 mt-0.5">🚨</span>
                  <p className="text-red-600 dark:text-red-400">
                    <strong>{analytics.riskAnalysis.highRiskTasks.length}</strong> tarefa{analytics.riskAnalysis.highRiskTasks.length !== 1 ? 's' : ''} de alto risco precisam atenção imediata
                  </p>
                </div>
              )}
              {analytics.byComplexity.filter((c, i) => i >= 3 && c.count > 0).reduce((sum, c) => sum + c.count, 0) > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-orange-500 dark:text-orange-400 mt-0.5">⚠️</span>
                  <p className="text-orange-600 dark:text-orange-400">
                    <strong>{analytics.byComplexity.filter((c, i) => i >= 3 && c.count > 0).reduce((sum, c) => sum + c.count, 0)}</strong> tarefas de alta complexidade (4-5) no backlog
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Distribuição e Complexidade */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Distribuição e Complexidade</h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {analytics.byComplexity.some(c => c.count > 0) && (
                <div className="flex items-start gap-2">
                  <span className="text-indigo-500 dark:text-indigo-400 mt-0.5">📈</span>
                  <p>
                    Complexidade predominante: <strong>
                      {analytics.byComplexity
                        .map((c, i) => ({ level: i + 1, count: c.count }))
                        .sort((a, b) => b.count - a.count)[0]?.level || 'N/A'}
                    </strong> ({analytics.byComplexity
                      .map((c, i) => ({ level: i + 1, count: c.count }))
                      .sort((a, b) => b.count - a.count)[0]?.count || 0} tarefas)
                  </p>
                </div>
              )}
              {analytics.byFeature.length > 0 && analytics.byFeature[0] && (
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 dark:text-blue-400 mt-0.5">⭐</span>
                  <p>
                    Feature com maior demanda: <strong>{analytics.byFeature[0].label}</strong> ({analytics.byFeature[0].count} tarefas, {formatHours(analytics.byFeature[0].estimatedHours)})
                  </p>
                </div>
              )}
              {analytics.byClient.length > 0 && analytics.byClient[0] && (
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 dark:text-purple-400 mt-0.5">👤</span>
                  <p>
                    Cliente com maior demanda: <strong>{analytics.byClient[0].label}</strong> ({analytics.byClient[0].count} tarefas, {formatHours(analytics.byClient[0].estimatedHours)})
                  </p>
                </div>
              )}
              {viewScope === 'backlog' && analytics.byModule.length > 0 && analytics.byModule[0] && (
                <div className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 mt-0.5">📦</span>
                  <p>
                    Módulo mais afetado: <strong>{analytics.byModule[0].label}</strong> ({analytics.byModule[0].count} tarefas)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Análise Temporal e Estimativas */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Análise Temporal e Estimativas</h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {/* Análise Temporal - só disponível no modo backlog */}
              {viewScope === 'backlog' && analytics.ageAnalysis.averageAgeDays > 0 && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5">📅</span>
                    <p>
                      Idade média do backlog: <strong>{analytics.ageAnalysis.averageAgeDays.toFixed(1)} dias</strong>
                    </p>
                  </div>
                  {(() => {
                    const oldTasks = analytics.ageAnalysis.ageDistribution.find(r => r.label === '90+ dias');
                    return oldTasks && oldTasks.count > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-red-500 dark:text-red-400 mt-0.5">⏰</span>
                        <p className="text-red-600 dark:text-red-400">
                          <strong>{oldTasks.count}</strong> tarefas com mais de 90 dias no backlog
                        </p>
                      </div>
                    );
                  })()}
                </>
              )}
              {viewScope === 'pendingAll' && (
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 dark:text-blue-400 mt-0.5">ℹ️</span>
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    Análise temporal disponível apenas no modo "Backlog"
                  </p>
                </div>
              )}

              {/* Análise de Estimativas */}
              {viewScope === 'backlog' && analytics.estimateAnalysis.averageEstimate > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 mt-0.5">📏</span>
                  <p>
                    Estimativa média: <strong>{formatHours(analytics.estimateAnalysis.averageEstimate)}</strong> por tarefa
                  </p>
                </div>
              )}
              {viewScope === 'pendingAll' && analytics.summary.totalTasks > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 mt-0.5">📏</span>
                  <p>
                    Estimativa média: <strong>{formatHours(analytics.summary.totalEstimatedHours / analytics.summary.totalTasks)}</strong> por tarefa
                  </p>
                </div>
              )}
              {viewScope === 'backlog' && analytics.estimateAnalysis.tasksWithoutEstimate.count > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500 dark:text-yellow-400 mt-0.5">⚠️</span>
                  <p className="text-yellow-600 dark:text-yellow-400">
                    <strong>{analytics.estimateAnalysis.tasksWithoutEstimate.count}</strong> tarefa{analytics.estimateAnalysis.tasksWithoutEstimate.count !== 1 ? 's' : ''} sem estimativa ({((analytics.estimateAnalysis.tasksWithoutEstimate.count / analytics.summary.totalTasks) * 100).toFixed(1)}% do total)
                  </p>
                </div>
              )}
              {viewScope === 'pendingAll' && (() => {
                const tasksWithoutEstimate = analytics.tasks.filter(t => !t.estimativa || t.estimativa === 0).length;
                return tasksWithoutEstimate > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-500 dark:text-yellow-400 mt-0.5">⚠️</span>
                    <p className="text-yellow-600 dark:text-yellow-400">
                      <strong>{tasksWithoutEstimate}</strong> tarefa{tasksWithoutEstimate !== 1 ? 's' : ''} sem estimativa ({((tasksWithoutEstimate / analytics.summary.totalTasks) * 100).toFixed(1)}% do total)
                    </p>
                  </div>
                );
              })()}

              {/* Distribuição de Estimativas */}
              {viewScope === 'backlog' && analytics.estimateAnalysis.estimateDistribution.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-indigo-500 dark:text-indigo-400 mt-0.5">📊</span>
                  <p>
                    Distribuição: {analytics.estimateAnalysis.estimateDistribution
                      .filter(r => r.count > 0)
                      .slice(0, 3)
                      .map(r => `${r.count} em ${r.label}`)
                      .join(', ')}
                  </p>
                </div>
              )}

              {/* Status mais comum */}
              {analytics.byStatus.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 dark:text-gray-400 mt-0.5">📋</span>
                  <p>
                    Status mais comum: <strong>{analytics.byStatus[0]?.label || 'N/A'}</strong> ({analytics.byStatus[0]?.count || 0} tarefas, {formatHours(analytics.byStatus[0]?.estimatedHours || 0)})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Alocação e Responsáveis */}
          {viewScope === 'backlog' && analytics.byResponsible.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Alocação e Responsáveis</h4>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-500 dark:text-cyan-400 mt-0.5">👥</span>
                  <p>
                    <strong>{analytics.byResponsible.length}</strong> responsável{analytics.byResponsible.length !== 1 ? 'eis' : ''} com tarefas no backlog
                  </p>
                </div>
                {analytics.byResponsible[0] && (
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-500 dark:text-cyan-400 mt-0.5">🔝</span>
                    <p>
                      Maior backlog: <strong>{analytics.byResponsible[0].label}</strong> ({analytics.byResponsible[0].count} tarefas, {formatHours(analytics.byResponsible[0].estimatedHours)})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recomendações Estratégicas */}
          <div className="space-y-2 md:col-span-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Recomendações Estratégicas</h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {analytics.summary.bugs > 0 && (
                <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="text-red-500 dark:text-red-400 mt-0.5">🎯</span>
                  <p>
                    Priorizar <strong>{analytics.summary.bugs} bugs reais</strong> para estabilização do sistema. Considere uma sprint focada em correções.
                  </p>
                </div>
              )}
              {analytics.byComplexity.filter((c, i) => i >= 2 && c.count > 0).reduce((sum, c) => sum + c.count, 0) > analytics.summary.totalTasks * 0.5 && (
                <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                  <span className="text-orange-500 dark:text-orange-400 mt-0.5">⚖️</span>
                  <p>
                    Mais de <strong>50% das tarefas</strong> têm complexidade média-alta (3-5). Considere quebrar tarefas grandes em menores.
                  </p>
                </div>
              )}
              {viewScope === 'backlog' && analytics.ageAnalysis.averageAgeDays > 60 && (
                <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <span className="text-yellow-500 dark:text-yellow-400 mt-0.5">🔄</span>
                  <p>
                    Backlog com idade média de <strong>{analytics.ageAnalysis.averageAgeDays.toFixed(1)} dias</strong>. Revise tarefas antigas para validar relevância.
                  </p>
                </div>
              )}
              {analytics.byFeature.length > 10 && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-500 dark:text-blue-400 mt-0.5">📊</span>
                  <p>
                    Backlog distribuído em <strong>{analytics.byFeature.length} features</strong>. Considere priorizar features estratégicas para melhor foco.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task List (optional reading view) */}
      <div ref={taskListRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lista de Tarefas {viewScope === 'pendingAll' ? '(Pendentes de todo o sistema)' : '(Backlog)'}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              • {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Sem métricas de horas — apenas leitura/planejamento
          </div>
        </div>

        {/* Filter Badge */}
        {activeFilter && (() => {
          const filterInfo = getFilterLabel();
          if (!filterInfo) return null;
          
          const colorClasses = {
            red: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
            yellow: 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
            green: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
            blue: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
            purple: 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
            orange: 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
            gray: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300',
          };
          
          return (
            <div className={`mb-4 rounded-lg border-2 ${colorClasses[filterInfo.color as keyof typeof colorClasses] || colorClasses.gray} p-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-white/50 dark:bg-black/20">
                  {filterInfo.icon}
                </div>
                <div>
                  <p className="text-xs font-medium opacity-80">Filtro Aplicado</p>
                  <p className="text-sm font-semibold">{filterInfo.label}</p>
                </div>
              </div>
              <button
                onClick={clearFilters}
                className="ml-2 px-2.5 py-1.5 text-xs font-medium rounded-md bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/40 transition-colors flex items-center gap-1.5"
                title="Remover filtro"
              >
                <span className="text-lg leading-none">×</span>
                Limpar
              </button>
            </div>
          );
        })()}

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredTasks.slice(0, 200).map((t) => (
            <div key={t.id || t.chave} className="py-2.5 flex flex-col lg:flex-row lg:items-center lg:gap-4">
              <div className="min-w-[140px] font-mono text-xs text-gray-600 dark:text-gray-300">
                {t.chave || t.id}
              </div>
              <div className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                {t.resumo}
              </div>
              <div className="mt-1 lg:mt-0 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {t.tipo}
                </span>
                {t.feature && t.feature.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {t.feature.includes('DSFolha') ? 'DSFolha' : t.feature[0]}
                  </span>
                )}
                {t.categorias && t.categorias.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    {t.categorias[0]}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded ${isCompletedStatus(t.status) ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                  {isCompletedStatus(t.status) ? 'Concluída' : 'Pendente'}
                </span>
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Est.: {formatHours(t.estimativa || 0)}
                </span>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-8">
              {!activeFilter ? (
                <div className="flex flex-col items-center gap-3">
                  <Filter className="w-12 h-12 text-gray-400 dark:text-gray-500 opacity-50" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Selecione um filtro para visualizar as tarefas
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Clique em um dos cards acima, gráficos ou análises para filtrar
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                  Nenhuma tarefa encontrada com os filtros atuais.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  color: 'gray' | 'blue' | 'red' | 'yellow' | 'green' | 'purple';
  onClick?: () => void;
  isActive?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, subtitle, color, onClick, isActive }) => {
  const colorClasses = {
    gray: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    red: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  const activeClasses = isActive ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 shadow-lg scale-105' : '';

  return (
    <div 
      className={`rounded-xl border-2 ${colorClasses[color]} p-4 hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${activeClasses}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs opacity-70">{subtitle}</p>
    </div>
  );
};


interface ComplexityCardProps {
  level: number;
  count: number;
  hours: number;
  onClick?: () => void;
  isActive?: boolean;
}

const ComplexityCard: React.FC<ComplexityCardProps> = ({ level, count, hours, onClick, isActive }) => {
  const colors = [
    { bg: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400' },
    { bg: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400' },
    { bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400' },
    { bg: 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400' },
    { bg: 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400' },
  ];

  const color = colors[level - 1] || colors[0];
  const activeClasses = isActive ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 shadow-lg scale-105' : '';

  return (
    <div 
      className={`rounded-xl border-2 bg-gradient-to-br ${color.bg} ${color.border} p-4 hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${activeClasses}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <Layers className={`w-4 h-4 ${color.text}`} />
        <p className={`text-sm font-medium ${color.text}`}>Nível {level}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{count}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{formatHours(hours)} estimadas</p>
    </div>
  );
};



