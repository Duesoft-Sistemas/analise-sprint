import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  HelpCircle,
  Filter,
  Calendar,
  Award,
  Target,
  Zap,
} from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { calculatePerformanceAnalytics, generateComparativeInsights, calculateCustomPeriodPerformance } from '../services/performanceAnalytics';
import { DeveloperPerformanceCard } from './DeveloperPerformanceCard';
import { PerformanceMetricsModal } from './PerformanceMetricsModal';
import { DeveloperDetailedAnalysisModal } from './DeveloperDetailedAnalysisModal';
import { SprintPerformanceMetrics, AllSprintsPerformanceMetrics, CustomPeriodMetrics } from '../types';
import { calculateDetailedDeveloperAnalytics } from '../services/detailedDeveloperAnalytics';
import { isCompletedStatus } from '../utils/calculations';

type ViewMode = 'sprint' | 'allSprints';
type SortBy = 'overall' | 'accuracy' | 'quality' | 'productivity';

export const PerformanceDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const sprints = useSprintStore((state) => state.sprints);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);

  const [viewMode, setViewMode] = useState<ViewMode>('sprint');
  const [selectedSprintView, setSelectedSprintView] = useState<string[]>(selectedSprint ? [selectedSprint] : sprints.length > 0 ? [sprints[0]] : []);
  const [sortBy, setSortBy] = useState<SortBy>('overall');
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [selectedDeveloperForAnalysis, setSelectedDeveloperForAnalysis] = useState<string | null>(null);
  const sprintSelectorRef = useRef<HTMLDivElement>(null);

  // Close sprint selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sprintSelectorRef.current && !sprintSelectorRef.current.contains(event.target as Node)) {
        setShowSprintSelector(false);
      }
    };

    if (showSprintSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSprintSelector]);

  // Reset selected sprints when view mode changes or when sprints list updates
  useEffect(() => {
    if (viewMode === 'allSprints') {
      setShowSprintSelector(false);
    } else if (viewMode === 'sprint' && selectedSprintView.length === 0 && sprints.length > 0) {
      setSelectedSprintView([sprints[0]]);
    }
  }, [viewMode, sprints.length]); // Only depend on sprints.length to avoid loops

  // Calculate all performance analytics
  const analytics = useMemo(() => {
    if (tasks.length === 0) return null;
    return calculatePerformanceAnalytics(tasks);
  }, [tasks]);

  // Get metrics for current view
  const currentMetrics = useMemo(() => {
    if (!analytics) return [];

    if (viewMode === 'sprint' && selectedSprintView.length > 0) {
      // Single sprint selected
      if (selectedSprintView.length === 1) {
        const sprintName = selectedSprintView[0];
        const sprintMetrics = analytics.developerMetrics.bySprint.get(sprintName);
        if (!sprintMetrics) return [];
        return Array.from(sprintMetrics.values());
      } 
      // Multiple sprints selected - calculate aggregated metrics
      else {
        const developerIds = new Set<string>();
        tasks.forEach(task => {
          if (selectedSprintView.includes(task.sprint)) {
            developerIds.add(task.idResponsavel);
          }
        });

        const aggregatedMetrics: (SprintPerformanceMetrics | CustomPeriodMetrics)[] = [];
        developerIds.forEach(developerId => {
          const developerTasks = tasks.filter(t => t.idResponsavel === developerId);
          const developerName = developerTasks[0]?.responsavel || developerId;
          const customMetrics = calculateCustomPeriodPerformance(
            tasks,
            developerId,
            developerName,
            selectedSprintView,
            `${selectedSprintView.length} Sprints Selecionados`
          );
          
          // Calculate bugsVsFeatures for the period - IMPORTANT: Only completed tasks
          const periodTasks = tasks.filter(t => 
            t.idResponsavel === developerId && 
            selectedSprintView.includes(t.sprint) &&
            isCompletedStatus(t.status)
          );
          const bugTasks = periodTasks.filter(t => t.tipo === 'Bug').length;
          const featureTasks = periodTasks.filter(t => t.tipo === 'Tarefa' || t.tipo === 'História').length;
          const bugsVsFeatures = featureTasks > 0 ? bugTasks / featureTasks : 0;
          
          // Convert CustomPeriodMetrics to SprintPerformanceMetrics format for compatibility
          const sprintMetrics: SprintPerformanceMetrics = {
            developerId: customMetrics.developerId,
            developerName: customMetrics.developerName,
            sprintName: customMetrics.periodName,
            totalHoursWorked: customMetrics.totalHoursWorked,
            totalHoursEstimated: customMetrics.totalHoursEstimated,
            tasksCompleted: customMetrics.totalTasksCompleted,
            tasksStarted: customMetrics.totalTasksStarted,
            averageHoursPerTask: customMetrics.totalHoursWorked / customMetrics.totalTasksCompleted || 0,
            estimationAccuracy: customMetrics.avgEstimationAccuracy,
            accuracyRate: customMetrics.avgAccuracyRate,
            tendsToOverestimate: customMetrics.tendsToOverestimate,
            tendsToUnderestimate: customMetrics.tendsToUnderestimate,
            bugRate: customMetrics.avgBugRate,
            bugsVsFeatures,
            qualityScore: customMetrics.avgQualityScore,
            reunioesHours: 0,
            utilizationRate: customMetrics.utilizationRate,
            completionRate: customMetrics.completionRate,
            avgTimeToComplete: customMetrics.avgTimeToComplete,
            consistencyScore: customMetrics.consistencyScore,
            avgComplexity: customMetrics.avgComplexity,
            complexityDistribution: customMetrics.complexityDistribution,
            performanceByComplexity: customMetrics.performanceByComplexity.map(
              c => ({ level: c.level, avgHours: c.avgHours, accuracy: c.accuracy })
            ),
            performanceScore: customMetrics.avgPerformanceScore,
            baseScore: customMetrics.avgPerformanceScore,
            complexityBonus: 0,
            seniorityEfficiencyBonus: 0,
            auxilioBonus: 0,
            tasks: [],
          };
          
          aggregatedMetrics.push(sprintMetrics);
        });

        return aggregatedMetrics;
      }
    } else if (viewMode === 'allSprints') {
      return Array.from(analytics.developerMetrics.allSprints.values());
    }

    return [];
  }, [analytics, viewMode, selectedSprintView, tasks]);

  // Get comparisons for current view
  const currentComparisons = useMemo(() => {
    if (!analytics) return [];

    if (viewMode === 'sprint' && selectedSprintView.length > 0) {
      // For single sprint, use existing comparisons
      if (selectedSprintView.length === 1) {
        return analytics.comparisons.bySprint.get(selectedSprintView[0]) || [];
      }
      // For multiple sprints, calculate new comparisons based on aggregated metrics
      else {
        // Recalculate comparisons from currentMetrics
        const metrics = currentMetrics as SprintPerformanceMetrics[];
        if (metrics.length === 0) return [];
        
        // Sort by performance score
        const sorted = [...metrics].sort((a, b) => b.performanceScore - a.performanceScore);
        
        return sorted.map((m, index) => ({
          developerId: m.developerId,
          overallRank: index + 1,
          accuracyRank: [...metrics].sort((a, b) => b.accuracyRate - a.accuracyRate).findIndex(m2 => m2.developerId === m.developerId) + 1,
          qualityRank: [...metrics].sort((a, b) => b.qualityScore - a.qualityScore).findIndex(m2 => m2.developerId === m.developerId) + 1,
          productivityRank: [...metrics].sort((a, b) => b.totalHoursWorked - a.totalHoursWorked).findIndex(m2 => m2.developerId === m.developerId) + 1,
          totalDevelopers: metrics.length,
        }));
      }
    } else if (viewMode === 'allSprints') {
      return analytics.comparisons.allSprints;
    }

    return [];
  }, [analytics, viewMode, selectedSprintView, currentMetrics]);

  // Get insights for current view
  const getInsightsForDeveloper = (developerId: string) => {
    if (!analytics) return [];

    if (viewMode === 'sprint' && selectedSprintView.length > 0) {
      // For single sprint, use existing insights
      if (selectedSprintView.length === 1) {
        const sprintInsights = analytics.insights.bySprint.get(selectedSprintView[0]);
        return sprintInsights?.get(developerId) || [];
      }
      // For multiple sprints, generate insights from aggregated metrics
      else {
        // Return empty insights for now - could be enhanced later
        return [];
      }
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

    if (viewMode === 'allSprints') {
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
        totalHoursWorked: sprintMetrics.reduce((sum, m) => sum + m.totalHoursWorked, 0) / sprintMetrics.length,
        totalHoursEstimated: sprintMetrics.reduce((sum, m) => sum + m.totalHoursEstimated, 0) / sprintMetrics.length,
        avgAuxilioBonus: sprintMetrics.reduce((sum, m) => sum + m.auxilioBonus, 0) / sprintMetrics.length,
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
          <div className="relative" ref={sprintSelectorRef}>
            <button
              onClick={() => setShowSprintSelector(!showSprintSelector)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {selectedSprintView.length === 0
                ? 'Selecionar Sprints'
                : selectedSprintView.length === 1
                ? selectedSprintView[0]
                : `${selectedSprintView.length} sprints selecionados`}
            </button>
            
            {showSprintSelector && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[250px] max-h-96 overflow-y-auto">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSprintView([...sprints])}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      onClick={() => setSelectedSprintView([])}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  {sprints.map((sprint) => (
                    <label
                      key={sprint}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSprintView.includes(sprint)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSprintView([...selectedSprintView, sprint]);
                          } else {
                            setSelectedSprintView(selectedSprintView.filter(s => s !== sprint));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{sprint}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
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
            {'avgTestNote' in summaryStats && summaryStats.avgTestNote !== undefined && summaryStats.avgTestNote !== null && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Nota média {(summaryStats.avgTestNote as number).toFixed(1)}/5
              </div>
            )}
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
            let insights = getInsightsForDeveloper(metrics.developerId);

            // Cast to SprintPerformanceMetrics for the card (they have compatible interfaces)
            let sprintMetrics: SprintPerformanceMetrics;
            
            if (viewMode === 'sprint') {
              sprintMetrics = metrics as SprintPerformanceMetrics;
              
              // Add comparative insights when team average is available
              if (summaryStats) {
                const teamAvg = {
                  accuracyRate: summaryStats.avgAccuracyRate,
                  totalHoursWorked: summaryStats.totalHoursWorked || 0,
                  totalHoursEstimated: summaryStats.totalHoursEstimated || 0,
                  performanceScore: summaryStats.avgPerformanceScore,
                };
                const comparativeInsights = generateComparativeInsights(sprintMetrics, teamAvg);
                insights = [...insights, ...comparativeInsights];
              }
            } else {
              const allSprintsMetrics = metrics as AllSprintsPerformanceMetrics;
              sprintMetrics = {
                developerId: allSprintsMetrics.developerId,
                developerName: allSprintsMetrics.developerName,
                sprintName: 'Todos os Sprints',
                totalHoursWorked: allSprintsMetrics.totalHoursWorked,
                totalHoursEstimated: allSprintsMetrics.totalHoursEstimated,
                tasksCompleted: allSprintsMetrics.totalTasksCompleted,
                tasksStarted: allSprintsMetrics.totalTasksStarted,
                averageHoursPerTask: allSprintsMetrics.totalHoursWorked / 
                  allSprintsMetrics.totalTasksCompleted || 0,
                estimationAccuracy: allSprintsMetrics.avgEstimationAccuracy,
                accuracyRate: allSprintsMetrics.avgAccuracyRate,
                tendsToOverestimate: allSprintsMetrics.tendsToOverestimate,
                tendsToUnderestimate: allSprintsMetrics.tendsToUnderestimate,
                bugRate: allSprintsMetrics.avgBugRate,
                bugsVsFeatures: 0,
                qualityScore: allSprintsMetrics.avgQualityScore,
                reunioesHours: 0,
                utilizationRate: allSprintsMetrics.utilizationRate,
                completionRate: allSprintsMetrics.completionRate,
                avgTimeToComplete: allSprintsMetrics.avgTimeToComplete,
                consistencyScore: allSprintsMetrics.consistencyScore,
                avgComplexity: allSprintsMetrics.avgComplexity,
                complexityDistribution: allSprintsMetrics.complexityDistribution,
                performanceByComplexity: allSprintsMetrics.performanceByComplexity.map(
                  c => ({ level: c.level, avgHours: c.avgHours, accuracy: c.accuracy })
                ),
                performanceScore: allSprintsMetrics.avgPerformanceScore,
                baseScore: allSprintsMetrics.avgPerformanceScore,
                complexityBonus: 0,
                seniorityEfficiencyBonus: 0,
                auxilioBonus: 0,
                tasks: [],
              };
            }

            return (
              <div key={metrics.developerId} className="relative">
                <DeveloperPerformanceCard
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
                  teamAverage={
                    summaryStats && viewMode === 'sprint'
                      ? {
                          accuracyRate: summaryStats.avgAccuracyRate,
                          totalHoursWorked: summaryStats.totalHoursWorked || 0,
                          totalHoursEstimated: summaryStats.totalHoursEstimated || 0,
                          performanceScore: summaryStats.avgPerformanceScore,
                          auxilioBonus: summaryStats.avgAuxilioBonus || 0,
                        }
                      : undefined
                  }
                />
                <button
                  onClick={() => {
                    setSelectedDeveloperForAnalysis(metrics.developerId);
                    setShowDetailedAnalysis(true);
                  }}
                  className="mt-2 w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Ver Análise Detalhada
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Explanation Modal */}
      <PerformanceMetricsModal
        isOpen={showMetricsModal}
        onClose={() => setShowMetricsModal(false)}
      />

      {/* Detailed Analysis Modal */}
      <DeveloperDetailedAnalysisModal
        isOpen={showDetailedAnalysis}
        onClose={() => {
          setShowDetailedAnalysis(false);
          setSelectedDeveloperForAnalysis(null);
        }}
        analytics={
          selectedDeveloperForAnalysis && sprintMetadata.length > 0
            ? (() => {
                const selectedMetrics = sortedMetrics.find(m => m.developerId === selectedDeveloperForAnalysis);
                if (!selectedMetrics) return null;
                
                return calculateDetailedDeveloperAnalytics(
                  tasks,
                  sprintMetadata,
                  selectedMetrics.developerId,
                  selectedMetrics.developerName
                );
              })()
            : null
        }
      />
    </div>
  );
};

