import React, { useMemo } from 'react';
import { X, User, BarChart3, Target, Award } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { formatHours, isCompletedStatus, isFullyCompletedStatus, compareTicketCodes, isAuxilioTask, isNeutralTask, isImpedimentoTrabalhoTask, isTestesTask } from '../utils/calculations';
import { calculateTaskMetrics, calculateSprintPerformance } from '../services/performanceAnalytics';
import { getEfficiencyThreshold } from '../config/performanceConfig';
import { calculateTaskHybridMetrics } from '../services/hybridCalculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WorklogDeveloperDetailsModalProps {
  developerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WorklogDeveloperDetailsModal: React.FC<WorklogDeveloperDetailsModalProps> = ({
  developerName,
  isOpen,
  onClose,
}) => {
  const tasks = useSprintStore((state) => state.tasks);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);
  const worklogs = useSprintStore((state) => state.worklogs);
  const getSprintPeriod = useSprintStore((state) => state.getSprintPeriod);

  // Helper function to check if a date is within a period
  const isDateInPeriod = (date: Date, startDate: Date, endDate: Date): boolean => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return dateOnly.getTime() >= startOnly.getTime() && dateOnly.getTime() <= endOnly.getTime();
  };

  // Get developer tasks for selected sprint - include ALL tasks that had work in the sprint period
  // The goal is to show everything the developer worked on in the week, regardless of task status or allocation
  const developerTasks = useMemo(() => {
    if (!selectedSprint || !sprintMetadata || sprintMetadata.length === 0) return [];
    
    const sprintPeriod = getSprintPeriod(selectedSprint);
    if (!sprintPeriod) return [];

    // Step 1: Find ALL worklogs in the sprint period (regardless of developer)
    const worklogsInPeriod = worklogs.filter(w => 
      isDateInPeriod(w.data, sprintPeriod.startDate, sprintPeriod.endDate)
    );

    // Step 2: For each worklog, find the corresponding task and check if developer matches
    // Build a set of task IDs/chaves that have worklogs from THIS developer in the period
    const taskIdentifiersWithWork = new Set<string>();
    
    worklogsInPeriod.forEach(w => {
      // Try to find task by ID or chave
      const task = tasks.find(t => {
        const taskIdMatch = String(t.id || '').trim() === String(w.taskId).trim();
        const taskChaveMatch = String(t.chave || '').trim() === String(w.taskId).trim();
        return taskIdMatch || taskChaveMatch;
      });
      
      // If task found and developer matches, add to set
      if (task && task.responsavel === developerName) {
        // Add both ID and chave to the set to ensure we catch it
        if (task.id && task.id.trim()) {
          taskIdentifiersWithWork.add(String(task.id).trim());
        }
        if (task.chave && task.chave.trim()) {
          taskIdentifiersWithWork.add(String(task.chave).trim());
        }
        // Also add the worklog taskId itself
        taskIdentifiersWithWork.add(String(w.taskId).trim());
      }
    });

    // Step 3: Include ALL tasks that have worklogs from this developer in the period
    // Status doesn't matter - if there's worklog, it shows up
    const filteredTasks = tasks.filter(t => {
      // Must be assigned to this developer
      if (t.responsavel !== developerName) return false;
      
      // Check if task has worklogs in the period (by ID or chave)
      const taskId = String(t.id || '').trim();
      const taskChave = String(t.chave || '').trim();
      const hasWorkInPeriod = (taskId && taskIdentifiersWithWork.has(taskId)) ||
                             (taskChave && taskIdentifiersWithWork.has(taskChave));
      
      if (hasWorkInPeriod) return true;
      
      // Also include if currently assigned to this sprint (even without worklog - might be planned work)
      if (t.sprint && t.sprint.trim() !== '' && t.sprint === selectedSprint) {
        return true;
      }
      
      return false;
    });

    // Recalculate hybrid metrics for this sprint period for all included tasks
    return filteredTasks.map(task => {
      // Recalculate metrics for this specific sprint period
      return calculateTaskHybridMetrics(task, worklogs, sprintPeriod);
    });
  }, [tasks, developerName, selectedSprint, worklogs, sprintMetadata, getSprintPeriod]);

  // Helper function to check if task was completed in another sprint
  // REGRA: Sprint de conclusão = sprint onde a tarefa está alocada atualmente (task.sprint)
  // Se tarefa está concluída e alocada em sprint diferente do analisado,
  // ela foi concluída no sprint onde está alocada e deve aparecer como Pendente no sprint atual
  const isCompletedInOtherSprint = (task: typeof developerTasks[0]): { isOtherSprint: boolean; completedSprint?: string } => {
    if (!selectedSprint) {
      return { isOtherSprint: false };
    }
    
    // Só verifica se a tarefa está marcada como concluída
    if (!isCompletedStatus(task.status)) {
      return { isOtherSprint: false };
    }
    
    // Se a tarefa está alocada em um sprint diferente do que está sendo analisado,
    // ela foi concluída no sprint onde está alocada
    if (task.sprint && task.sprint.trim() !== '' && task.sprint !== selectedSprint) {
      return { isOtherSprint: true, completedSprint: task.sprint };
    }
    
    // Se está no mesmo sprint ou não tem sprint, foi concluída no sprint atual
    return { isOtherSprint: false };
  };

  // Calculate task metrics for display - using the same logic as performance analysis
  const taskMetricsData = useMemo(() => {
    return developerTasks.map(task => {
      const { isOtherSprint, completedSprint } = isCompletedInOtherSprint(task);
      
      // If completed in another sprint, treat as pending for this sprint
      // Normalize "Tarefas pendentes" to "Pendente"
      const normalizedStatus = task.status === 'Tarefas pendentes' ? 'Pendente' : task.status;
      const displayStatus = isOtherSprint ? 'Pendente' : normalizedStatus;
      const displayTask = isOtherSprint 
        ? { ...task, status: 'Pendente' } 
        : { ...task, status: normalizedStatus };
      
      // Use estimativaRestante instead of estimativa (like TaskList.tsx does)
      // This considers hours already worked in previous sprints
      const estimativaRestante = task.estimativaRestante ?? task.estimativa ?? 0;
      const taskWithRemainingEstimate = { ...displayTask, estimativa: estimativaRestante };
      
      // Get tempoGastoOutrosSprints to determine if task came from another sprint
      const tempoOutrosSprints = task.tempoGastoOutrosSprints ?? 0;
      const estimativaOriginal = task.estimativa ?? 0;
      const tempoGastoTotal = task.tempoGastoTotal ?? task.tempoGastoNoSprint ?? 0;
      
      const metrics = calculateTaskMetrics(taskWithRemainingEstimate, true); // useSprintOnly = true
      
      // Check if task is fully completed (for variance calculation)
      const isCompleted = isFullyCompletedStatus(displayStatus);
      
      // For completed tasks: use accumulated values (total estimate vs total spent)
      // For pending tasks: use sprint-only values (remaining estimate vs sprint spent)
      const hoursEstimatedForVariance = isCompleted ? estimativaOriginal : metrics.hoursEstimated;
      const hoursSpentForVariance = isCompleted ? tempoGastoTotal : metrics.hoursSpent;
      
      // Only calculate efficiency if task was actually worked on in this sprint AND is completed
      // IMPORTANT: Must match the same criteria as calculateSprintPerformance (lines 310-334):
      // - Exclude neutral tasks (reunião/treinamento) - line 311-312
      // - Exclude impedimento trabalho tasks - line 312
      // - Must be completed - line 320
      // - Must have estimate > 0 - line 334
      let isEfficient = false;
      let hasEfficiency = false;
      
      if (!isOtherSprint) {
        // Exclude neutral and impedimento tasks (same as workTasks filter in performanceAnalytics.ts line 310-313)
        const isNeutral = isNeutralTask(task);
        const isImpedimento = isImpedimentoTrabalhoTask(task);
        
        if (!isNeutral && !isImpedimento) {
          // IMPORTANT: Only calculate efficiency for fully completed tasks (same as performance analysis)
          // Line 320 in performanceAnalytics.ts: const completedTasks = workTasks.filter(t => isFullyCompletedStatus(t.status));
          
          if (isCompleted) {
            // Determine efficiency using the same logic as calculateSprintPerformance (lines 362-377)
            // Only calculate efficiency for tasks with estimates (same as performance analysis line 334)
            if (metrics.hoursEstimated > 0) {
              hasEfficiency = true;
              if (metrics.efficiencyImpact && metrics.efficiencyImpact.type === 'complexity_zone') {
                // For bugs: use isEfficient directly from efficiencyImpact (line 344 in performanceAnalytics.ts)
                isEfficient = metrics.efficiencyImpact.isEfficient;
              } else {
                // For features: use deviation percentual (same logic as line 373 in performanceAnalytics.ts)
                const deviation = metrics.estimationAccuracy;
                const threshold = getEfficiencyThreshold(metrics.complexityScore);
                // Efficient if: deviation > 0 (gastou menos que estimou) OR deviation is within acceptable range
                isEfficient = deviation > 0 || (deviation >= threshold.slower && deviation <= 0);
              }
            }
          }
        }
        // If task is neutral, impedimento, not completed or has no estimate, efficiency is not calculated (same as performance analysis)
      }
      
      return {
        task,
        displayTask,
        displayStatus,
        isCompletedInOtherSprint: isOtherSprint,
        completedSprint,
        metrics,
        variance: hoursSpentForVariance - hoursEstimatedForVariance,
        variancePercent: hoursEstimatedForVariance > 0 
          ? Math.round(((hoursSpentForVariance - hoursEstimatedForVariance) / hoursEstimatedForVariance) * 100)
          : 0,
        isEfficient,
        hasEfficiency,
        tempoOutrosSprints,
        estimativaOriginal,
      };
    }).sort((a, b) => compareTicketCodes(a.task.chave || a.task.id, b.task.chave || b.task.id));
  }, [developerTasks, selectedSprint, sprintMetadata, worklogs, getSprintPeriod]);

  if (!isOpen) return null;

  const getTestNoteColor = (note: number | null | undefined) => {
    if (note === null || note === undefined) return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
    if (note >= 4.5) return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
    if (note >= 3.5) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
    if (note >= 2.5) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
  };

  const getEfficiencyColor = (isEfficient: boolean, efficiencyImpact?: { isEfficient: boolean; zone?: string }) => {
    if (!efficiencyImpact) {
      return isEfficient 
        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
        : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
    }
    
    if (efficiencyImpact.zone === 'efficient') {
      return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
    }
    if (efficiencyImpact.zone === 'acceptable') {
      return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
    }
    return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
  };

  // Calculate totals (excluding tasks completed in other sprints from efficiency count)
  const totals = useMemo(() => {
    const totalEstimated = taskMetricsData.reduce((sum, item) => sum + item.metrics.hoursEstimated, 0);
    const totalSpent = taskMetricsData.reduce((sum, item) => sum + item.metrics.hoursSpent, 0);
    const totalVariance = totalSpent - totalEstimated;
    const totalVariancePercent = totalEstimated > 0 
      ? Math.round((totalVariance / totalEstimated) * 100)
      : 0;
    // Only count efficiency for tasks actually worked on in this sprint
    const tasksWithEfficiency = taskMetricsData.filter(item => item.hasEfficiency);
    const efficientTasks = tasksWithEfficiency.filter(item => item.isEfficient).length;
    
    return {
      totalEstimated,
      totalSpent,
      totalVariance,
      totalVariancePercent,
      efficientTasks,
      totalTasks: taskMetricsData.length,
      tasksWithEfficiency: tasksWithEfficiency.length,
    };
  }, [taskMetricsData]);

  // Calculate planned spent (excluding special tasks)
  const plannedSpentBreakdown = useMemo(() => {
    let plannedSpent = 0; // Time spent on planned tasks
    let auxilioHours = 0;
    let neutralHours = 0; // Reunião/Treinamento
    let impedimentoHours = 0;
    let testesHours = 0;

    taskMetricsData.forEach(item => {
      const hoursSpent = item.metrics.hoursSpent;

      // Check if it's a special task type (unplanned)
      // Order matters: check most specific first
      if (isAuxilioTask(item.task)) {
        auxilioHours += hoursSpent;
      } else if (isNeutralTask(item.task)) {
        neutralHours += hoursSpent;
      } else if (isImpedimentoTrabalhoTask(item.task)) {
        impedimentoHours += hoursSpent;
      } else if (isTestesTask(item.task)) {
        testesHours += hoursSpent;
      } else {
        // Planned task - all time counts as planned
        plannedSpent += hoursSpent;
      }
    });

    // Calculate total realizado (sum of all spent time)
    const totalRealizado = plannedSpent + auxilioHours + neutralHours + impedimentoHours + testesHours;

    return {
      plannedSpent,
      auxilioHours,
      neutralHours,
      impedimentoHours,
      testesHours,
      totalRealizado,
    };
  }, [taskMetricsData]);

  // Prepare chart data for Estimated vs Spent comparison with breakdown of unplanned time
  const estimatedVsSpentChartData = useMemo(() => {
    const { plannedSpent, auxilioHours, neutralHours, impedimentoHours, testesHours, totalRealizado } = plannedSpentBreakdown;

    // Create chart data - Estimado first, then breakdown categories, then Gasto Total last
    // Use horizontal bars for better comparison
    const chartData = [
      {
        name: 'Estimado',
        value: Number(totals.totalEstimated.toFixed(2)),
        type: 'estimado'
      }
    ];

    // Add breakdown categories if they exist (before Gasto Total)
    if (plannedSpent > 0) {
      chartData.push({
        name: 'Realizado (Planejado)',
        value: Number(plannedSpent.toFixed(2)),
        type: 'planejado'
      });
    }
    if (auxilioHours > 0) {
      chartData.push({
        name: 'Auxílio',
        value: Number(auxilioHours.toFixed(2)),
        type: 'auxilio'
      });
    }
    if (neutralHours > 0) {
      chartData.push({
        name: 'Reunião/Treinamento',
        value: Number(neutralHours.toFixed(2)),
        type: 'neutral'
      });
    }
    if (impedimentoHours > 0) {
      chartData.push({
        name: 'Impedimento',
        value: Number(impedimentoHours.toFixed(2)),
        type: 'impedimento'
      });
    }
    if (testesHours > 0) {
      chartData.push({
        name: 'Testes',
        value: Number(testesHours.toFixed(2)),
        type: 'testes'
      });
    }

    // Add Gasto Total as the last row
    chartData.push({
      name: 'Gasto Total',
      value: Number(totalRealizado.toFixed(2)),
      type: 'total'
    });

    return chartData;
  }, [totals, plannedSpentBreakdown]);

  // Calculate performance metrics using the same logic as performance dashboard
  const performanceMetrics = useMemo(() => {
    if (!selectedSprint || developerTasks.length === 0) return null;
    
    // Find developer ID from tasks
    const devTask = developerTasks.find(t => t.responsavel === developerName);
    if (!devTask || !devTask.idResponsavel) return null;
    
    // Calculate performance metrics using the same function as performance dashboard
    return calculateSprintPerformance(
      tasks,
      devTask.idResponsavel,
      developerName,
      selectedSprint,
      worklogs,
      sprintMetadata
    );
  }, [tasks, developerName, selectedSprint, worklogs, sprintMetadata, developerTasks]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-4 border-indigo-500 dark:border-indigo-400 w-full max-w-[95vw] min-w-[90vw] max-h-[95vh] my-auto overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 dark:bg-indigo-600 rounded-lg shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Análise de Desempenho
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {developerName} • {selectedSprint || 'Nenhum sprint selecionado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border-2 border-transparent hover:border-red-300 dark:hover:border-red-700"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900">
          {/* Insights Section */}
          <div className="space-y-6">
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Estimated vs Spent Chart */}
              <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950/30 rounded-xl p-5 border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Estimado vs Realizado</h3>
                  </div>
                  {/* Totalizador no cabeçalho */}
                  <div className="flex flex-col gap-3 text-sm">
                    {/* Comparação Principal: Estimado vs Realizado (Planejado) */}
                    {totals.totalEstimated > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Estimado:</span>{' '}
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formatHours(totals.totalEstimated)}</span>
                          </div>
                          {plannedSpentBreakdown.plannedSpent > 0 && (
                            <>
                              <span className="text-gray-400 dark:text-gray-500">•</span>
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Realizado (Planejado):</span>{' '}
                                <span className="text-blue-600 dark:text-blue-400 font-bold">{formatHours(plannedSpentBreakdown.plannedSpent)}</span>
                              </div>
                              <span className="text-gray-400 dark:text-gray-500">•</span>
                              <div className={`font-semibold ${
                                plannedSpentBreakdown.plannedSpent > totals.totalEstimated 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : plannedSpentBreakdown.plannedSpent < totals.totalEstimated
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                Diferença: {plannedSpentBreakdown.plannedSpent > totals.totalEstimated ? '+' : ''}
                                {formatHours(plannedSpentBreakdown.plannedSpent - totals.totalEstimated)}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Gasto Total (incluindo tarefas especiais) */}
                    {totals.totalSpent > 0 && (
                      <div className="flex items-center gap-4 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Gasto Total:</span>{' '}
                          <span className="text-green-600 dark:text-green-400 font-bold">{formatHours(totals.totalSpent)}</span>
                        </div>
                        {totals.totalEstimated > 0 && (
                          <>
                            <span className="text-gray-400 dark:text-gray-500">•</span>
                            <div className={`font-medium text-gray-600 dark:text-gray-400 ${
                              totals.totalSpent > totals.totalEstimated 
                                ? 'text-red-600 dark:text-red-400' 
                                : totals.totalSpent < totals.totalEstimated
                                ? 'text-green-600 dark:text-green-400'
                                : ''
                            }`}>
                              Diferença Total: {totals.totalSpent > totals.totalEstimated ? '+' : ''}
                              {formatHours(totals.totalSpent - totals.totalEstimated)}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={estimatedVsSpentChartData}
                      layout="vertical"
                      margin={{ top: 10, right: 80, left: 180, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => `${value}h`} 
                        tick={{ fontSize: 12 }} 
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        width={170}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatHours(value)}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                        itemStyle={{ color: '#374151' }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[0, 8, 8, 0]}
                      >
                        {estimatedVsSpentChartData.map((entry, index) => {
                          let fillColor = '#6366f1'; // default indigo
                          
                          if (entry.type === 'estimado') {
                            fillColor = '#6366f1'; // indigo
                          } else if (entry.type === 'total') {
                            fillColor = '#10b981'; // green
                          } else if (entry.type === 'planejado') {
                            fillColor = '#86efac'; // light green
                          } else if (entry.type === 'auxilio') {
                            fillColor = '#ec4899'; // pink
                          } else if (entry.type === 'neutral') {
                            fillColor = '#8b5cf6'; // purple
                          } else if (entry.type === 'impedimento') {
                            fillColor = '#ef4444'; // red
                          } else if (entry.type === 'testes') {
                            fillColor = '#f59e0b'; // orange
                          }
                          
                          return <Cell key={`cell-${index}`} fill={fillColor} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Efficiency and Quality Cards */}
            {performanceMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Execution Efficiency */}
                {(() => {
                  const efficiency = performanceMetrics.accuracyRate;
                  const bgColor = efficiency >= 75 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20' 
                    : efficiency >= 60 
                    ? 'bg-blue-50 dark:bg-blue-950/20' 
                    : efficiency >= 45 
                    ? 'bg-yellow-50 dark:bg-yellow-950/20' 
                    : 'bg-red-50 dark:bg-red-950/20';
                  const borderColor = efficiency >= 75 
                    ? 'border-emerald-200 dark:border-emerald-800' 
                    : efficiency >= 60 
                    ? 'border-blue-200 dark:border-blue-800' 
                    : efficiency >= 45 
                    ? 'border-yellow-200 dark:border-yellow-800' 
                    : 'border-red-200 dark:border-red-800';
                  const iconBgColor = efficiency >= 75 
                    ? 'bg-emerald-100 dark:bg-emerald-900/40' 
                    : efficiency >= 60 
                    ? 'bg-blue-100 dark:bg-blue-900/40' 
                    : efficiency >= 45 
                    ? 'bg-yellow-100 dark:bg-yellow-900/40' 
                    : 'bg-red-100 dark:bg-red-900/40';
                  const iconColor = efficiency >= 75 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : efficiency >= 60 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : efficiency >= 45 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-red-600 dark:text-red-400';
                  const valueColor = efficiency >= 75 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : efficiency >= 60 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : efficiency >= 45 
                    ? 'text-yellow-700 dark:text-yellow-300' 
                    : 'text-red-700 dark:text-red-300';
                  
                  return (
                    <div className={`${bgColor} rounded-lg p-5 border-2 ${borderColor} shadow-md`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${iconBgColor}`}>
                          <Target className={`w-5 h-5 ${iconColor}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          Eficiência
                        </span>
                      </div>
                      <div className={`text-3xl font-bold ${valueColor} mb-2`}>
                        {efficiency.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {performanceMetrics.tasksCompleted > 0 
                          ? `${performanceMetrics.tasksCompleted} tarefa${performanceMetrics.tasksCompleted !== 1 ? 's' : ''} concluída${performanceMetrics.tasksCompleted !== 1 ? 's' : ''}`
                          : 'Sem tarefas concluídas'}
                      </div>
                    </div>
                  );
                })()}

                {/* Quality */}
                {(() => {
                  const quality = performanceMetrics.qualityScore;
                  const bgColor = quality >= 75 
                    ? 'bg-purple-50 dark:bg-purple-950/20' 
                    : quality >= 60 
                    ? 'bg-indigo-50 dark:bg-indigo-950/20' 
                    : quality >= 45 
                    ? 'bg-yellow-50 dark:bg-yellow-950/20' 
                    : 'bg-red-50 dark:bg-red-950/20';
                  const borderColor = quality >= 75 
                    ? 'border-purple-200 dark:border-purple-800' 
                    : quality >= 60 
                    ? 'border-indigo-200 dark:border-indigo-800' 
                    : quality >= 45 
                    ? 'border-yellow-200 dark:border-yellow-800' 
                    : 'border-red-200 dark:border-red-800';
                  const iconBgColor = quality >= 75 
                    ? 'bg-purple-100 dark:bg-purple-900/40' 
                    : quality >= 60 
                    ? 'bg-indigo-100 dark:bg-indigo-900/40' 
                    : quality >= 45 
                    ? 'bg-yellow-100 dark:bg-yellow-900/40' 
                    : 'bg-red-100 dark:bg-red-900/40';
                  const iconColor = quality >= 75 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : quality >= 60 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : quality >= 45 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-red-600 dark:text-red-400';
                  const valueColor = quality >= 75 
                    ? 'text-purple-700 dark:text-purple-300' 
                    : quality >= 60 
                    ? 'text-indigo-700 dark:text-indigo-300' 
                    : quality >= 45 
                    ? 'text-yellow-700 dark:text-yellow-300' 
                    : 'text-red-700 dark:text-red-300';
                  
                  return (
                    <div className={`${bgColor} rounded-lg p-5 border-2 ${borderColor} shadow-md`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${iconBgColor}`}>
                          <Award className={`w-5 h-5 ${iconColor}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          Qualidade
                        </span>
                      </div>
                      <div className={`text-3xl font-bold ${valueColor} mb-2`}>
                        {quality.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {performanceMetrics.avgTestNote !== undefined
                          ? `Nota ${performanceMetrics.avgTestNote.toFixed(1)}/5`
                          : 'Sem notas de teste'}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Tasks Table */}
          <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950/30 rounded-xl p-5 border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Tarefas ({developerTasks.length})
            </h3>
            <div className="max-h-[60vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white uppercase bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 sticky top-0 shadow-md">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Chave</th>
                    <th scope="col" className="px-4 py-3 font-bold">Resumo</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Estimado</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Gasto</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Variação</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold">Nota</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold">Eficiência</th>
                  </tr>
                </thead>
                <tbody>
                  {taskMetricsData.map(({ task, displayStatus, isCompletedInOtherSprint, completedSprint, metrics, variance, variancePercent, isEfficient, hasEfficiency, tempoOutrosSprints, estimativaOriginal }) => {
                    // For performance metrics display, use fully completed status (consistent with performance analysis)
                    const isCompleted = isFullyCompletedStatus(displayStatus);
                    const efficiencyZone = metrics.efficiencyImpact?.zone || '';
                    const efficiencyLabel = hasEfficiency 
                      ? (metrics.efficiencyImpact?.type === 'complexity_zone'
                          ? (efficiencyZone === 'efficient' ? '✅ Eficiente' : efficiencyZone === 'acceptable' ? '⚠️ Aceitável' : '❌ Ineficiente')
                          : (isEfficient ? '✅ Eficiente' : '❌ Ineficiente'))
                      : '-';

                    // Determine background color for first column based on task type
                    const firstColumnBg = task.tipo === 'Bug' 
                      ? 'bg-red-50 dark:bg-red-950/20' 
                      : task.tipo === 'Tarefa' || task.tipo === 'História'
                      ? 'bg-blue-50 dark:bg-blue-950/20'
                      : '';

                    return (
                      <tr 
                        key={task.chave || task.id} 
                        className="border-b border-indigo-100 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                      >
                        <td className={`px-4 py-2 font-medium text-gray-900 dark:text-white ${firstColumnBg}`}>
                          {task.chave || task.id}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300 max-w-md">
                          <div className="truncate" title={task.resumo}>
                            {task.resumo}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              isCompleted
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}>
                              {displayStatus}
                            </span>
                            {isCompletedInOtherSprint && completedSprint && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-500 italic" title={`Concluída no sprint ${completedSprint}`}>
                                ({completedSprint})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                          <div className="flex flex-col items-end">
                            <span>{formatHours(metrics.hoursEstimated)}</span>
                            {tempoOutrosSprints > 0 && (
                              <span className="text-xs text-blue-600 dark:text-blue-400" title={`${formatHours(tempoOutrosSprints)} gastas em sprints anteriores`}>
                                ({formatHours(estimativaOriginal)} orig.)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                          <div className="flex flex-col items-end">
                            <span>{formatHours(metrics.hoursSpent)}</span>
                            {tempoOutrosSprints > 0 && (
                              <span className="text-xs text-purple-600 dark:text-purple-400" title="Tempo gasto em sprints anteriores">
                                +{formatHours(tempoOutrosSprints)} ant.
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {isCompleted && metrics.hoursEstimated > 0 ? (
                            <span className={`font-medium ${
                              variance > 0 ? 'text-red-600 dark:text-red-400' : variance < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {variancePercent > 0 ? '+' : ''}{variancePercent}%
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {task.notaTeste !== null && task.notaTeste !== undefined ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getTestNoteColor(task.notaTeste)}`}>
                              {task.notaTeste.toFixed(1)}/5
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {hasEfficiency ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getEfficiencyColor(isEfficient, metrics.efficiencyImpact)}`} title={metrics.efficiencyImpact?.description}>
                              {efficiencyLabel}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 border-t-2 border-indigo-300 dark:border-indigo-700">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-bold uppercase text-gray-900 dark:text-white">
                      Total ({totals.totalTasks} tarefa{totals.totalTasks !== 1 ? 's' : ''})
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-lg text-gray-900 dark:text-white">
                      {formatHours(totals.totalEstimated)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-lg text-gray-900 dark:text-white">
                      {formatHours(totals.totalSpent)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-lg">
                      {totals.totalEstimated > 0 ? (
                        <span className={totals.totalVariance > 0 ? 'text-red-600 dark:text-red-400' : totals.totalVariance < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                          {totals.totalVariancePercent > 0 ? '+' : ''}{totals.totalVariancePercent}%
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-lg">
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-lg">
                      <span className="text-gray-900 dark:text-white">
                        {totals.tasksWithEfficiency > 0 ? `${totals.efficientTasks}/${totals.tasksWithEfficiency}` : '-'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

