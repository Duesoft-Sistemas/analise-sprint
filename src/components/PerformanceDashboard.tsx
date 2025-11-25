import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart3,
  Users,
  Filter,
  Calendar,
  Award,
  Target,
  Zap,
  Info,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { calculatePerformanceAnalytics, generateComparativeInsights, calculateCustomPeriodPerformance } from '../services/performanceAnalytics';
import { DeveloperPerformanceCard } from './DeveloperPerformanceCard';
import { SprintPerformanceMetrics, CustomPeriodMetrics, TaskItem } from '../types';
import { isCompletedStatus, isFullyCompletedStatus, isNeutralTask } from '../utils/calculations';
import { getEfficiencyThreshold } from '../config/performanceConfig';
import { getDefaultSelectedDevelopers } from '../services/configService';

type SortBy = 'overall' | 'accuracy' | 'quality' | 'productivity';

export const PerformanceDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const sprints = useSprintStore((state) => state.sprints);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);
  const worklogs = useSprintStore((state) => state.worklogs);

  // Get finished sprints (dataFim < today)
  const finishedSprints = useMemo(() => {
    if (!sprintMetadata || sprintMetadata.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sprintMetadata
      .filter(meta => {
        const sprintEnd = new Date(meta.dataFim);
        sprintEnd.setHours(23, 59, 59, 999);
        return sprintEnd < today;
      })
      .map(meta => meta.sprint)
      .filter(sprint => sprints.includes(sprint)); // Only include sprints that exist in the sprints list
  }, [sprintMetadata, sprints]);

  const [selectedSprintView, setSelectedSprintView] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('overall');
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const sprintSelectorRef = useRef<HTMLDivElement>(null);
  const [showDeveloperSelector, setShowDeveloperSelector] = useState(false);
  const developerSelectorRef = useRef<HTMLDivElement>(null);
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [showBonuses, setShowBonuses] = useState<boolean>(true); // Default: show bonuses

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

  // Close developer selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (developerSelectorRef.current && !developerSelectorRef.current.contains(event.target as Node)) {
        setShowDeveloperSelector(false);
      }
    };

    if (showDeveloperSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeveloperSelector]);

  // Auto-select all finished sprints when available (on mount or when finishedSprints first loads)
  useEffect(() => {
    if (finishedSprints.length > 0 && selectedSprintView.length === 0) {
      // Always select all finished sprints by default when nothing is selected
      setSelectedSprintView([...finishedSprints]);
    }
  }, [finishedSprints.length]);


  // Calculate all performance analytics
  const analytics = useMemo(() => {
    if (tasks.length === 0) return null;
    return calculatePerformanceAnalytics(tasks, worklogs, sprintMetadata);
  }, [tasks, worklogs, sprintMetadata]);

  // Get metrics for current view
  const currentMetrics = useMemo(() => {
    if (!analytics) return [];

    if (selectedSprintView.length > 0) {
      // Single sprint selected
      if (selectedSprintView.length === 1) {
        const sprintName = selectedSprintView[0];
        const sprintMetrics = analytics.developerMetrics.bySprint.get(sprintName);
        if (!sprintMetrics) return [];
        const metrics = Array.from(sprintMetrics.values());
        
        // If showBonuses is false, adjust performanceScore to use only baseScore
        if (!showBonuses) {
          return metrics.map(metric => ({
            ...metric,
            performanceScore: metric.baseScore,
            // Keep bonus values in the metric but don't include them in performanceScore
          }));
        }
        
        return metrics; // With bonuses (original performanceScore)
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
            `${selectedSprintView.length} Sprints Selecionados`,
            worklogs,
            sprintMetadata
          );
          
          // Calculate bugsVsFeatures for the period - IMPORTANT: Only fully completed tasks (status "concluído" or "concluido")
          const periodTasks = tasks.filter(t => 
            t.idResponsavel === developerId && 
            selectedSprintView.includes(t.sprint) &&
            isFullyCompletedStatus(t.status)
          );
          const bugTasks = periodTasks.filter(t => t.tipo === 'Bug').length;
          const featureTasks = periodTasks.filter(t => t.tipo === 'Tarefa' || t.tipo === 'História').length;
          const bugsVsFeatures = featureTasks > 0 ? bugTasks / featureTasks : 0;
          
          // Aggregate tasks from all sprints in the period
          const allTasksMetrics = customMetrics.sprints.flatMap(sprint => sprint.tasks);
          
          // Calculate aggregated metrics based on aggregated tasks
          // IMPORTANT: Performance analysis only considers fully completed tasks (status "concluído" or "concluido")
          const completedTasks = allTasksMetrics.filter(t => isFullyCompletedStatus(t.task.status));
          const completedWithEstimates = completedTasks.filter(t => t.hoursEstimated > 0);
          
          // Separate bugs and features
          const bugs = completedWithEstimates.filter(t => t.task.tipo === 'Bug');
          const features = completedWithEstimates.filter(t => t.task.tipo !== 'Bug');
          
          // Calculate efficient bugs (using complexity zone)
          const efficientBugs = bugs.filter(t => t.efficiencyImpact?.zone === 'efficient').length;
          const acceptableBugs = bugs.filter(t => t.efficiencyImpact?.zone === 'acceptable').length;
          const bugAccuracyRate = bugs.length > 0 ? ((efficientBugs + (acceptableBugs * 0.5)) / bugs.length) * 100 : 0;
          
          // Calculate feature estimation accuracy (average deviation)
          const featureDeviations = features.map(t => t.estimationAccuracy);
          const featureEstimationAccuracy = featureDeviations.length > 0
            ? featureDeviations.reduce((sum, d) => sum + d, 0) / featureDeviations.length
            : 0;
          
          // Calculate weighted accuracy rate
          const weightedEfficientScore = efficientBugs + (acceptableBugs * 0.5) + 
            features.filter(t => {
              const deviation = t.estimationAccuracy;
              const threshold = getEfficiencyThreshold(t.complexityScore);
              return deviation > 0 ? true : deviation >= threshold.slower;
            }).length;
          const accuracyRate = completedWithEstimates.length > 0
            ? (weightedEfficientScore / completedWithEstimates.length) * 100
            : 0;
          
          // Recalculate bonuses based on aggregated tasks (not sum from individual sprints)
          // Seniority Bonus: tasks with complexity 4-5 that are efficient and have quality >= 4
          const seniorTasks = completedTasks.filter(t => t.complexityScore >= 4 && t.hoursEstimated > 0);
          let seniorityEfficiencyBonus = 0;
          const seniorityBonusTasks: TaskItem[] = [];
          
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
            seniorityEfficiencyBonus = Math.round(seniorEfficiencyScore * 15); // MAX_SENIORITY_EFFICIENCY_BONUS
          }
          
          // Competence Bonus: tasks with complexity 3 that are efficient and have quality >= 4
          const mediumTasks = completedTasks.filter(t => t.complexityScore === 3 && t.hoursEstimated > 0);
          let competenceBonus = 0;
          const competenceBonusTasks: TaskItem[] = [];
          
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
            competenceBonus = Math.round(mediumEfficiencyScore * 5); // MAX_COMPLEXITY_3_BONUS
          }
          
          // IMPORTANT: Bônus não devem ser consolidados quando há múltiplos sprints
          // Os bônus (Senioridade, Competência, Auxílio) são calculados e atribuídos por sprint individual
          // Quando há múltiplos sprints selecionados, mostramos apenas métricas base (eficácia, qualidade)
          // A evolução dos bônus deve ser visualizada através de gráficos de tendência, não através de soma
          const auxilioBonus = 0;
          
          // Aggregate reunion hours
          const reunioesHours = customMetrics.sprints.reduce((sum, s) => sum + (s.reunioesHours || 0), 0);
          
          // Aggregate test notes for quality calculation
          const qualityTasks = completedTasks.filter(t => 
            !isNeutralTask(t.task) && 
            t.task.notaTeste !== null && 
            t.task.notaTeste !== undefined
          );
          const testNotes = qualityTasks.map(t => t.task.notaTeste as number);
          const avgTestNote = testNotes.length > 0 ? (testNotes.reduce((s, n) => s + n, 0) / testNotes.length) : undefined;
          const qualityScore = avgTestNote !== undefined ? Math.max(0, Math.min(100, avgTestNote * 20)) : customMetrics.avgQualityScore;
          
          // Calculate base score (considering quality if available)
          const executionEfficiency = accuracyRate;
          const scoreHasQuality = qualityTasks.length > 0;
          const baseScore = scoreHasQuality
            ? ((qualityScore * 0.50) + (executionEfficiency * 0.50))
            : executionEfficiency;
          
          // Note: seniorityBonusTasks and competenceBonusTasks are already calculated above
          
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
            accuracyRate: accuracyRate,
            bugAccuracyRate: bugAccuracyRate,
            featureEstimationAccuracy: featureEstimationAccuracy,
            tendsToOverestimate: customMetrics.tendsToOverestimate,
            tendsToUnderestimate: customMetrics.tendsToUnderestimate,
            bugRate: customMetrics.avgBugRate,
            bugsVsFeatures,
            qualityScore: qualityScore,
            testScore: avgTestNote !== undefined ? avgTestNote * 20 : undefined,
            avgTestNote: avgTestNote,
            reunioesHours: reunioesHours,
            utilizationRate: customMetrics.utilizationRate,
            completionRate: customMetrics.completionRate,
            avgTimeToComplete: customMetrics.avgTimeToComplete,
            consistencyScore: customMetrics.consistencyScore,
            avgComplexity: customMetrics.avgComplexity,
            complexityDistribution: customMetrics.complexityDistribution,
            performanceByComplexity: customMetrics.performanceByComplexity.map(
              c => ({ level: c.level, avgHours: c.avgHours, accuracy: c.accuracy })
            ),
            // Performance Score: quando há múltiplos sprints, usa apenas baseScore (bônus são por sprint individual)
            performanceScore: baseScore,
            baseScore: baseScore,
            // Bônus zerados quando múltiplos sprints - são calculados por sprint individual
            seniorityEfficiencyBonus: 0,
            competenceBonus: 0,
            auxilioBonus: 0,
            overtimeBonus: 0,
            seniorityBonusTasks: seniorityBonusTasks.length > 0 ? seniorityBonusTasks : undefined,
            competenceBonusTasks: competenceBonusTasks.length > 0 ? competenceBonusTasks : undefined,
            overtimeBonusTasks: [],
            tasks: allTasksMetrics,
          };
          
          aggregatedMetrics.push(sprintMetrics);
        });

        return aggregatedMetrics;
      }
    }

    return [];
  }, [analytics, selectedSprintView, tasks, showBonuses]);

  // Available developer options for current view
  const developerOptions = useMemo(() => {
    const list = currentMetrics.map(m => ({
      id: m.developerId,
      name: m.developerName,
    }));
    const map = new Map(list.map(d => [d.id, d]));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [currentMetrics]);

  // Initialize selected developers based on default config or all developers
  useEffect(() => {
    if (developerOptions.length > 0 && selectedDevelopers.length === 0) {
      const defaultDevs = getDefaultSelectedDevelopers();
      
      // If there are default devs configured, try to match them with available options
      if (defaultDevs.length > 0) {
        // Try to match by name first, then by id
        const matchedDevs = defaultDevs
          .map(defaultDev => {
            // Try to find by name (exact match)
            const byName = developerOptions.find(d => d.name === defaultDev);
            if (byName) return byName.id;
            
            // Try to find by id (exact match)
            const byId = developerOptions.find(d => d.id === defaultDev);
            if (byId) return byId.id;
            
            return null;
          })
          .filter((id): id is string => id !== null);
        
        // Use matched devs if any found, otherwise use all
        setSelectedDevelopers(matchedDevs.length > 0 ? matchedDevs : developerOptions.map(d => d.id));
      } else {
        // No defaults configured, select all by default
        setSelectedDevelopers(developerOptions.map(d => d.id));
      }
    }
  }, [developerOptions, selectedDevelopers.length]);

  // Get comparisons for current view (only for selected developers)
  const currentComparisons = useMemo(() => {
    if (!analytics) return [];

    // Get metrics only for selected developers
    const filteredMetrics = currentMetrics.filter(m => 
      selectedDevelopers.length === 0 || selectedDevelopers.includes(m.developerId)
    ) as SprintPerformanceMetrics[];

    if (filteredMetrics.length === 0) return [];

    if (selectedSprintView.length > 0) {
      // For single sprint, recalculate rankings from filtered developers
      if (selectedSprintView.length === 1) {
        const allComparisons = analytics.comparisons.bySprint.get(selectedSprintView[0]) || [];
        // Filter comparisons to only selected developers and recalculate ranks
        const filteredComparisons = allComparisons.filter(c => 
          selectedDevelopers.length === 0 || selectedDevelopers.includes(c.developerId)
        );
        
        // Recalculate ranks based on filtered developers
        const metricsMap = new Map(filteredMetrics.map(m => [m.developerId, m]));
        const sortedByPerformance = [...filteredMetrics].sort((a, b) => b.performanceScore - a.performanceScore);
        const sortedByAccuracy = [...filteredMetrics].sort((a, b) => b.accuracyRate - a.accuracyRate);
        const sortedByQuality = [...filteredMetrics].sort((a, b) => b.qualityScore - a.qualityScore);
        const sortedByProductivity = [...filteredMetrics].sort((a, b) => b.totalHoursWorked - a.totalHoursWorked);

        return filteredComparisons.map(comp => {
          const metric = metricsMap.get(comp.developerId);
          if (!metric) return comp;

          return {
            developerId: comp.developerId,
            overallRank: sortedByPerformance.findIndex(m => m.developerId === comp.developerId) + 1,
            accuracyRank: sortedByAccuracy.findIndex(m => m.developerId === comp.developerId) + 1,
            qualityRank: sortedByQuality.findIndex(m => m.developerId === comp.developerId) + 1,
            productivityRank: sortedByProductivity.findIndex(m => m.developerId === comp.developerId) + 1,
            totalDevelopers: filteredMetrics.length,
          };
        });
      }
      // For multiple sprints, calculate new comparisons based on aggregated metrics
      else {
        // Recalculate comparisons from filtered metrics
        const sorted = [...filteredMetrics].sort((a, b) => b.performanceScore - a.performanceScore);
        const sortedByAccuracy = [...filteredMetrics].sort((a, b) => b.accuracyRate - a.accuracyRate);
        const sortedByQuality = [...filteredMetrics].sort((a, b) => b.qualityScore - a.qualityScore);
        const sortedByProductivity = [...filteredMetrics].sort((a, b) => b.totalHoursWorked - a.totalHoursWorked);
        
        return filteredMetrics.map((m) => ({
          developerId: m.developerId,
          overallRank: sorted.findIndex(m2 => m2.developerId === m.developerId) + 1,
          accuracyRank: sortedByAccuracy.findIndex(m2 => m2.developerId === m.developerId) + 1,
          qualityRank: sortedByQuality.findIndex(m2 => m2.developerId === m.developerId) + 1,
          productivityRank: sortedByProductivity.findIndex(m2 => m2.developerId === m.developerId) + 1,
          totalDevelopers: filteredMetrics.length,
        }));
      }
    }

    return [];
  }, [analytics, selectedSprintView, currentMetrics, selectedDevelopers]);

  // Get insights for current view
  const getInsightsForDeveloper = (developerId: string) => {
    if (!analytics) return [];

    if (selectedSprintView.length > 0) {
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
  }, [sortedMetrics]);

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

  const isMultiSprintView = selectedSprintView.length > 1;

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
      </div>

      {/* Info Alert: Multiple Sprints Selected */}
      {isMultiSprintView && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Visualização de Múltiplos Sprints
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Importante:</strong> Quando há múltiplos sprints selecionados, os <strong>bônus (Senioridade, Competência e Auxílio) não são contabilizados</strong> no score final.
                O score máximo é <strong>100 pontos</strong> (baseado apenas em Eficiência e Qualidade), não 130.
                Os bônus são calculados e atribuídos <strong>por sprint individual</strong> e podem ser visualizados através de gráficos de tendência.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Sprint Selector */}
        {finishedSprints.length > 0 && (
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
                      onClick={() => setSelectedSprintView([...finishedSprints])}
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
                  {finishedSprints.map((sprint) => (
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

        {/* Developer Selector */}
        {developerOptions.length > 0 && (
          <div className="relative" ref={developerSelectorRef}>
            <button
              onClick={() => setShowDeveloperSelector(!showDeveloperSelector)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {selectedDevelopers.length === 0
                ? 'Selecionar Devs'
                : selectedDevelopers.length === developerOptions.length
                ? 'Todos os Devs'
                : `${selectedDevelopers.length} devs selecionados`}
            </button>

            {showDeveloperSelector && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[260px] max-h-96 overflow-y-auto">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDevelopers(developerOptions.map(d => d.id))}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      onClick={() => setSelectedDevelopers([])}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  {developerOptions.map((dev) => (
                    <label
                      key={dev.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDevelopers.includes(dev.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDevelopers([...selectedDevelopers, dev.id]);
                          } else {
                            setSelectedDevelopers(selectedDevelopers.filter(id => id !== dev.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{dev.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sort By */}
        <div className="flex items-center gap-2">
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

        {/* Bonus Toggle - Only show when single sprint is selected */}
        {selectedSprintView.length === 1 && (
          <div className="flex items-center gap-2 ml-auto">
            <Award className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bônus:
            </span>
            <button
              onClick={() => setShowBonuses(!showBonuses)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                showBonuses
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              title={showBonuses ? 'Mostrando com bônus (score até 130)' : 'Mostrando sem bônus (score até 100)'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  showBonuses ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {showBonuses ? 'Com Bônus' : 'Sem Bônus'}
            </span>
          </div>
        )}
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
              <span className="text-lg text-gray-500 dark:text-gray-400">/{isMultiSprintView ? 100 : (showBonuses ? 130 : 100)}</span>
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
          {sortedMetrics
            .filter(m => selectedDevelopers.length === 0 ? false : selectedDevelopers.includes(m.developerId))
            .map((metrics) => {
            const comparison = currentComparisons.find(
              (c) => c.developerId === metrics.developerId
            );
            let insights = getInsightsForDeveloper(metrics.developerId);

            // Cast to SprintPerformanceMetrics for the card
            const sprintMetrics = metrics as SprintPerformanceMetrics;
            
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
                teamAverage={
                  summaryStats
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

