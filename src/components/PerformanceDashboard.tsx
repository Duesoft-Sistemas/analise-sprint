import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  HelpCircle,
  Download,
  Filter,
  ArrowLeft,
  Calendar,
  Award,
  Target,
  Zap,
} from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { calculatePerformanceAnalytics } from '../services/performanceAnalytics';
import { DeveloperPerformanceCard } from './DeveloperPerformanceCard';
import { PerformanceMetricsModal } from './PerformanceMetricsModal';
import { SprintPerformanceMetrics, AllSprintsPerformanceMetrics } from '../types';

type ViewMode = 'sprint' | 'allSprints';
type SortBy = 'overall' | 'accuracy' | 'quality' | 'productivity';

export const PerformanceDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const sprints = useSprintStore((state) => state.sprints);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const setSelectedSprint = useSprintStore((state) => state.setSelectedSprint);

  const [viewMode, setViewMode] = useState<ViewMode>('sprint');
  const [selectedSprintView, setSelectedSprintView] = useState<string>(selectedSprint || sprints[0] || '');
  const [sortBy, setSortBy] = useState<SortBy>('overall');
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);

  // Calculate all performance analytics
  const analytics = useMemo(() => {
    if (tasks.length === 0) return null;
    return calculatePerformanceAnalytics(tasks);
  }, [tasks]);

  // Get metrics for current view
  const currentMetrics = useMemo(() => {
    if (!analytics) return [];

    if (viewMode === 'sprint' && selectedSprintView) {
      const sprintMetrics = analytics.developerMetrics.bySprint.get(selectedSprintView);
      if (!sprintMetrics) return [];
      return Array.from(sprintMetrics.values());
    } else if (viewMode === 'allSprints') {
      return Array.from(analytics.developerMetrics.allSprints.values());
    }

    return [];
  }, [analytics, viewMode, selectedSprintView]);

  // Get comparisons for current view
  const currentComparisons = useMemo(() => {
    if (!analytics) return [];

    if (viewMode === 'sprint' && selectedSprintView) {
      return analytics.comparisons.bySprint.get(selectedSprintView) || [];
    } else if (viewMode === 'allSprints') {
      return analytics.comparisons.allSprints;
    }

    return [];
  }, [analytics, viewMode, selectedSprintView]);

  // Get insights for current view
  const getInsightsForDeveloper = (developerId: string) => {
    if (!analytics) return [];

    if (viewMode === 'sprint' && selectedSprintView) {
      const sprintInsights = analytics.insights.bySprint.get(selectedSprintView);
      return sprintInsights?.get(developerId) || [];
    } else if (viewMode === 'allSprints') {
      return analytics.insights.allSprints.get(developerId) || [];
    }

    return [];
  };

  // Sort metrics
  const sortedMetrics = useMemo(() => {
    if (currentMetrics.length === 0) return [];

    const metrics = [...currentMetrics];
    const comparisons = new Map(currentComparisons.map(c => [c.developerId, c]));

    switch (sortBy) {
      case 'accuracy':
        metrics.sort((a, b) => {
          const rankA = comparisons.get(a.developerId)?.accuracyRank || 999;
          const rankB = comparisons.get(b.developerId)?.accuracyRank || 999;
          return rankA - rankB;
        });
        break;
      case 'quality':
        metrics.sort((a, b) => {
          const rankA = comparisons.get(a.developerId)?.qualityRank || 999;
          const rankB = comparisons.get(b.developerId)?.qualityRank || 999;
          return rankA - rankB;
        });
        break;
      case 'productivity':
        metrics.sort((a, b) => {
          const rankA = comparisons.get(a.developerId)?.productivityRank || 999;
          const rankB = comparisons.get(b.developerId)?.productivityRank || 999;
          return rankA - rankB;
        });
        break;
      case 'overall':
      default:
        metrics.sort((a, b) => {
          const rankA = comparisons.get(a.developerId)?.overallRank || 999;
          const rankB = comparisons.get(b.developerId)?.overallRank || 999;
          return rankA - rankB;
        });
        break;
    }

    return metrics;
  }, [currentMetrics, currentComparisons, sortBy]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (sortedMetrics.length === 0) return null;

    const isAllSprints = viewMode === 'allSprints';
    
    if (isAllSprints) {
      const allSprintsMetrics = sortedMetrics as AllSprintsPerformanceMetrics[];
      return {
        totalDevelopers: allSprintsMetrics.length,
        avgPerformanceScore: allSprintsMetrics.reduce((sum, m) => sum + m.avgPerformanceScore, 0) / allSprintsMetrics.length,
        avgAccuracyRate: allSprintsMetrics.reduce((sum, m) => sum + m.avgAccuracyRate, 0) / allSprintsMetrics.length,
        avgQualityScore: allSprintsMetrics.reduce((sum, m) => sum + m.avgQualityScore, 0) / allSprintsMetrics.length,
        avgUtilization: allSprintsMetrics.reduce((sum, m) => sum + (m.averageHoursPerSprint / 40) * 100, 0) / allSprintsMetrics.length,
      };
    } else {
      const sprintMetrics = sortedMetrics as SprintPerformanceMetrics[];
      return {
        totalDevelopers: sprintMetrics.length,
        avgPerformanceScore: sprintMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / sprintMetrics.length,
        avgAccuracyRate: sprintMetrics.reduce((sum, m) => sum + m.accuracyRate, 0) / sprintMetrics.length,
        avgQualityScore: sprintMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / sprintMetrics.length,
        avgUtilization: sprintMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) / sprintMetrics.length,
      };
    }
  }, [sortedMetrics, viewMode]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum dado disponível. Faça upload de um arquivo Excel para começar.
        </p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Calculando análises de performance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Análise de Performance
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Métricas detalhadas de acurácia, qualidade e produtividade
          </p>
        </div>
        <button
          onClick={() => setShowMetricsModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Como são Calculadas?
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('sprint')}
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              viewMode === 'sprint'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Por Sprint
          </button>
          <button
            onClick={() => setViewMode('allSprints')}
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              viewMode === 'allSprints'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Todos os Sprints
          </button>
        </div>

        {/* Sprint Selector (only in sprint mode) */}
        {viewMode === 'sprint' && sprints.length > 0 && (
          <select
            value={selectedSprintView}
            onChange={(e) => setSelectedSprintView(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm font-medium"
          >
            {sprints.map((sprint) => (
              <option key={sprint} value={sprint}>
                {sprint}
              </option>
            ))}
          </select>
        )}

        {/* Sort By */}
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
          >
            <option value="overall">Ordenar por: Performance Geral</option>
            <option value="accuracy">Ordenar por: Acurácia</option>
            <option value="quality">Ordenar por: Qualidade</option>
            <option value="productivity">Ordenar por: Produtividade</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Desenvolvedores
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summaryStats.totalDevelopers}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Performance Média
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summaryStats.avgPerformanceScore.toFixed(0)}
              <span className="text-lg text-gray-500 dark:text-gray-400">/100</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Acurácia Média
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summaryStats.avgAccuracyRate.toFixed(0)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Qualidade Média
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summaryStats.avgQualityScore.toFixed(0)}
              <span className="text-lg text-gray-500 dark:text-gray-400">/100</span>
            </p>
          </div>
        </div>
      )}

      {/* Developer Performance Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Performance Individual
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedMetrics.map((metrics) => {
            const comparison = currentComparisons.find(
              (c) => c.developerId === metrics.developerId
            );
            const insights = getInsightsForDeveloper(metrics.developerId);

            // Cast to SprintPerformanceMetrics for the card (they have compatible interfaces)
            const sprintMetrics = viewMode === 'sprint' 
              ? (metrics as SprintPerformanceMetrics)
              : {
                  ...(metrics as AllSprintsPerformanceMetrics),
                  sprintName: 'Todos os Sprints',
                  totalHoursWorked: (metrics as AllSprintsPerformanceMetrics).totalHoursWorked,
                  tasksCompleted: (metrics as AllSprintsPerformanceMetrics).totalTasksCompleted,
                  tasksStarted: (metrics as AllSprintsPerformanceMetrics).sprints.reduce(
                    (sum, s) => sum + s.tasksStarted, 0
                  ),
                  averageHoursPerTask: (metrics as AllSprintsPerformanceMetrics).totalHoursWorked / 
                    (metrics as AllSprintsPerformanceMetrics).totalTasksCompleted || 0,
                  estimationAccuracy: (metrics as AllSprintsPerformanceMetrics).avgEstimationAccuracy,
                  accuracyRate: (metrics as AllSprintsPerformanceMetrics).avgAccuracyRate,
                  tendsToOverestimate: (metrics as AllSprintsPerformanceMetrics).avgEstimationAccuracy > 10,
                  tendsToUnderestimate: (metrics as AllSprintsPerformanceMetrics).avgEstimationAccuracy < -10,
                  reworkRate: (metrics as AllSprintsPerformanceMetrics).avgReworkRate,
                  bugRate: (metrics as AllSprintsPerformanceMetrics).avgBugRate,
                  bugsVsFeatures: 0,
                  qualityScore: (metrics as AllSprintsPerformanceMetrics).avgQualityScore,
                  utilizationRate: ((metrics as AllSprintsPerformanceMetrics).averageHoursPerSprint / 40) * 100,
                  completionRate: 100,
                  avgTimeToComplete: (metrics as AllSprintsPerformanceMetrics).averageHoursPerSprint,
                  consistencyScore: 50,
                  avgComplexity: 0,
                  complexityDistribution: (metrics as AllSprintsPerformanceMetrics).performanceByComplexity.map(
                    c => ({ level: c.level, count: c.totalTasks, avgAccuracy: Math.abs(c.accuracy) })
                  ),
                  performanceByComplexity: (metrics as AllSprintsPerformanceMetrics).performanceByComplexity.map(
                    c => ({ level: c.level, avgHours: c.avgHours, accuracy: c.accuracy })
                  ),
                  performanceScore: (metrics as AllSprintsPerformanceMetrics).avgPerformanceScore,
                  tasks: [],
                } as SprintPerformanceMetrics;

            return (
              <DeveloperPerformanceCard
                key={metrics.developerId}
                metrics={sprintMetrics}
                insights={insights}
                rank={
                  comparison
                    ? {
                        overall: comparison.overallRank,
                        total: comparison.totalDevelopers,
                      }
                    : undefined
                }
                onShowDetails={() => setSelectedDeveloper(metrics.developerId)}
              />
            );
          })}
        </div>
      </div>

      {/* Metrics Explanation Modal */}
      <PerformanceMetricsModal
        isOpen={showMetricsModal}
        onClose={() => setShowMetricsModal(false)}
      />
    </div>
  );
};

