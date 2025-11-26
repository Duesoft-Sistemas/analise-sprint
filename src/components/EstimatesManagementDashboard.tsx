import React, { useMemo, useState } from 'react';
import { Target, TrendingUp, TrendingDown, AlertTriangle, User, Calendar, FileText, X } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { calculateTaskMetrics } from '../services/performanceAnalytics';
import { formatHours, isFullyCompletedStatus } from '../utils/calculations';
import { TaskItem, WorklogEntry } from '../types';

interface TaskWorklogDescriptionsModalProps {
  isOpen: boolean;
  task: TaskItem | null;
  worklogs: WorklogEntry[];
  onClose: () => void;
}

const TaskWorklogDescriptionsModal: React.FC<TaskWorklogDescriptionsModalProps> = ({
  isOpen,
  task,
  worklogs,
  onClose,
}) => {
  const describedWorklogs = useMemo(() => {
    if (!task) return [];
    
    const taskId = String(task.id ?? '').trim();
    const taskChave = String(task.chave ?? '').trim();
    
    return worklogs
      .filter((worklog) => {
        const worklogTaskId = String(worklog.taskId ?? '').trim();
        // Match by task ID or chave
        const matches = worklogTaskId === taskId || worklogTaskId === taskChave;
        return matches && worklog.descricao && worklog.descricao.trim().length > 0;
      })
      .map((worklog) => ({
        id: `${worklog.taskId}-${worklog.data.getTime()}`,
        description: worklog.descricao!.trim(),
        date: worklog.data,
        hours: worklog.tempoGasto,
        responsavel: worklog.responsavel,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [task, worklogs]);

  if (!isOpen || !task) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-100 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500 dark:bg-indigo-600 text-white shadow">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Worklogs com descrição
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {task.chave || task.id} • {task.resumo} • {describedWorklogs.length} registro{describedWorklogs.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-gray-900">
          {describedWorklogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Nenhum worklog com descrição foi registrado para esta tarefa.
            </div>
          ) : (
            <div className="space-y-4">
              {describedWorklogs.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {entry.responsavel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {formatHours(entry.hours)}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {entry.date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {entry.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const abbreviateName = (fullName: string): string => {
  if (!fullName || fullName.trim() === '') return '-';
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '-';
  if (parts.length === 1) return parts[0];
  
  // Primeiro nome + primeira letra do segundo nome + ponto
  return `${parts[0]} ${parts[1][0]}.`;
};

export const EstimatesManagementDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const sprints = useSprintStore((state) => state.sprints);
  const worklogs = useSprintStore((state) => state.worklogs);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);

  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>('');
  const [selectedDeveloperFilter, setSelectedDeveloperFilter] = useState<string>('');
  const [deviationThreshold, setDeviationThreshold] = useState<number>(50);
  const [deviationType, setDeviationType] = useState<'both' | 'up' | 'down'>('both');

  // Initialize sprint filter with first available sprint or selected sprint
  React.useEffect(() => {
    if (!selectedSprintFilter && sprints.length > 0) {
      setSelectedSprintFilter(selectedSprint || sprints[0]);
    }
  }, [selectedSprintFilter, sprints, selectedSprint]);
  const [descriptionModal, setDescriptionModal] = useState<{ task: TaskItem } | null>(null);

  // Get unique developers from tasks
  const developers = useMemo(() => {
    const devSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.responsavel && task.responsavel.trim() !== '') {
        devSet.add(task.responsavel);
      }
    });
    return Array.from(devSet).sort();
  }, [tasks]);

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Only include fully completed tasks (not intermediate statuses like "teste", "compilar", etc.)
    result = result.filter((t) => isFullyCompletedStatus(t.status));

    // Filter by sprint (required - always filter)
    if (selectedSprintFilter) {
      result = result.filter((t) => t.sprint === selectedSprintFilter);
    }

    // Filter by developer (if selected)
    if (selectedDeveloperFilter) {
      result = result.filter((t) => t.responsavel === selectedDeveloperFilter);
    }

    // Only include tasks with estimates
    result = result.filter((t) => t.estimativa > 0);

    return result;
  }, [tasks, selectedSprintFilter, selectedDeveloperFilter]);

  // Calculate metrics and filter tasks with deviation > threshold
  // IMPORTANT: Always use tempoGastoTotal (total accumulated time from worklog) regardless of sprint filter
  // Both estimate and time spent should reflect the total accumulated values, even if task passed through multiple sprints
  const tasksWithHighDeviation = useMemo(() => {
    return filteredTasks
      .map((task) => {
        // Always use tempoGastoTotal (total accumulated from worklog) - never use tempoGastoNoSprint
        // This ensures we see the total deviation across all sprints, not just within a specific sprint
        const useSprintOnly = false; // Always false to get total accumulated time
        const metrics = calculateTaskMetrics(task, useSprintOnly);
        
        // Only include tasks with valid estimates and time spent
        if (metrics.hoursEstimated <= 0) {
          return null;
        }
        
        return {
          task,
          metrics,
          deviation: metrics.estimationAccuracy,
          absDeviation: Math.abs(metrics.estimationAccuracy),
        };
      })
      .filter((item): item is NonNullable<typeof item> => {
        if (item === null || item.absDeviation <= deviationThreshold) {
          return false;
        }
        // Filter by deviation type
        if (deviationType === 'up') {
          return item.deviation > deviationThreshold; // Only overestimated (positive deviation)
        } else if (deviationType === 'down') {
          return item.deviation < -deviationThreshold; // Only underestimated (negative deviation)
        }
        // 'both' - show all
        return true;
      })
      .sort((a, b) => b.deviation - a.deviation); // Sort by deviation (highest first: overestimated first, then underestimated)
  }, [filteredTasks, deviationThreshold, deviationType]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasksWithHighDeviation.length;
    const underestimated = tasksWithHighDeviation.filter((t) => t.deviation < -deviationThreshold).length;
    const overestimated = tasksWithHighDeviation.filter((t) => t.deviation > deviationThreshold).length;
    const avgDeviation = total > 0
      ? tasksWithHighDeviation.reduce((sum, t) => sum + t.deviation, 0) / total
      : 0;

    return { total, underestimated, overestimated, avgDeviation };
  }, [tasksWithHighDeviation, deviationThreshold]);

  const getDeviationColor = (deviation: number) => {
    if (deviation < -deviationThreshold) {
      return 'text-red-600 dark:text-red-400';
    } else if (deviation > deviationThreshold) {
      return 'text-green-600 dark:text-green-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  const getDeviationIcon = (deviation: number) => {
    if (deviation < -deviationThreshold) {
      return <TrendingDown className="w-4 h-4" />;
    } else if (deviation > deviationThreshold) {
      return <TrendingUp className="w-4 h-4" />;
    }
    return null;
  };

  // Check if task has worklogs with description (filtered only by task, not by period)
  const taskHasWorklogDescriptions = (task: TaskItem): boolean => {
    const taskId = String(task.id ?? '').trim();
    const taskChave = String(task.chave ?? '').trim();
    
    return worklogs.some((worklog) => {
      const worklogTaskId = String(worklog.taskId ?? '').trim();
      const matches = worklogTaskId === taskId || worklogTaskId === taskChave;
      return matches && worklog.descricao && worklog.descricao.trim().length > 0;
    });
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gerenciamento de Estimativas
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Tarefas com desvio superior ao percentual configurado (para cima ou para baixo)
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sprint Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Sprint</span>
              </div>
            </label>
            <select
              value={selectedSprintFilter}
              onChange={(e) => setSelectedSprintFilter(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
            >
              {sprints.map((sprint) => (
                <option key={sprint} value={sprint}>
                  {sprint}
                </option>
              ))}
            </select>
          </div>

          {/* Developer Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Desenvolvedor</span>
              </div>
            </label>
            <select
              value={selectedDeveloperFilter}
              onChange={(e) => setSelectedDeveloperFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
            >
              <option value="">Todos os desenvolvedores</option>
              {developers.map((dev) => (
                <option key={dev} value={dev}>
                  {dev}
                </option>
              ))}
            </select>
          </div>

          {/* Deviation Threshold Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Desvio Mínimo (%)</span>
              </div>
            </label>
            <input
              type="number"
              min="0"
              max="1000"
              value={deviationThreshold}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setDeviationThreshold(0);
                } else {
                  const numValue = Number(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setDeviationThreshold(numValue);
                  }
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '' || Number(e.target.value) < 0) {
                  setDeviationThreshold(50);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="50"
            />
          </div>

          {/* Deviation Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Tipo de Desvio</span>
              </div>
            </label>
            <select
              value={deviationType}
              onChange={(e) => setDeviationType(e.target.value as 'both' | 'up' | 'down')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
            >
              <option value="both">Ambos</option>
              <option value="up">Só para cima (Superestimadas)</option>
              <option value="down">Só para baixo (Subestimadas)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total de Tarefas
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Subestimadas
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.underestimated}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Superestimadas
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.overestimated}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Desvio Médio
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.avgDeviation.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Tarefas com Alto Desvio
        </h3>

        {tasksWithHighDeviation.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma tarefa encontrada com desvio superior a {deviationThreshold}%
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Chave
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Resumo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Responsável
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Estimativa
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tempo Gasto
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Desvio
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Descrições
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasksWithHighDeviation.map((item) => {
                  const { task, metrics, deviation } = item;
                  const deviationColor = getDeviationColor(deviation);
                  const deviationIcon = getDeviationIcon(deviation);

                  return (
                    <tr
                      key={task.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {task.chave || task.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {task.resumo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {abbreviateName(task.responsavel || '')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatHours(metrics.hoursEstimated)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatHours(metrics.hoursSpent)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {deviationIcon}
                          <span className={`text-sm font-semibold ${deviationColor}`}>
                            {deviation.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const hasDescriptions = taskHasWorklogDescriptions(task);
                          return (
                            <button
                              onClick={() => {
                                if (hasDescriptions) {
                                  setDescriptionModal({ task });
                                }
                              }}
                              disabled={!hasDescriptions}
                              title={
                                hasDescriptions
                                  ? 'Ver worklogs com descrição'
                                  : 'Nenhuma descrição registrada para esta tarefa'
                              }
                              className={`inline-flex items-center justify-center p-2 rounded-lg transition ${
                                hasDescriptions
                                  ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer'
                                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Worklog Descriptions Modal */}
      {descriptionModal && (
        <TaskWorklogDescriptionsModal
          isOpen={Boolean(descriptionModal)}
          task={descriptionModal.task}
          worklogs={worklogs}
          onClose={() => setDescriptionModal(null)}
        />
      )}
    </div>
  );
};

