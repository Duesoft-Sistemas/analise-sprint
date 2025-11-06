import React, { useMemo } from 'react';
import { AlertTriangle, Clock, FileWarning, User, CheckCircle2, Calendar, Hash } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { TaskItem, WorklogEntry, SprintMetadata } from '../types';
import { formatHours, isCompletedStatus } from '../utils/calculations';
import { isDateInSprint } from '../services/hybridCalculations';

interface Inconsistency {
  id: string;
  type: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  count: number;
  items: any; // Can be array or object depending on inconsistency type
}

export const InconsistenciesDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const worklogs = useSprintStore((state) => state.worklogs);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);



  // Filter tasks by selected sprint
  const filteredTasks = useMemo(() => {
    return selectedSprint 
      ? tasks.filter(t => t.sprint === selectedSprint)
      : tasks;
  }, [tasks, selectedSprint]);

  const filteredWorklogs = useMemo(() => {
    return worklogs; // All worklogs (they may reference any sprint)
  }, [worklogs]);

  // Helper: Check if task has worklog (moved inside useMemo to avoid dependency issues)
  const taskHasWorklogHelper = (task: TaskItem, allWorklogs: WorklogEntry[]): boolean => {
    if (allWorklogs.length === 0) return false;
    const taskId = task.id?.toLowerCase().trim();
    const taskKey = task.chave?.toLowerCase().trim();
    return allWorklogs.some(w => {
      const worklogId = w.taskId?.toLowerCase().trim();
      return (taskId && worklogId === taskId) || (taskKey && worklogId === taskKey);
    });
  };

  // Helper: Check if worklog has corresponding task (moved inside useMemo to avoid dependency issues)
  const worklogHasTaskHelper = (worklog: WorklogEntry, allTasks: TaskItem[]): boolean => {
    const worklogId = worklog.taskId?.toLowerCase().trim();
    return allTasks.some(t => {
      const taskId = t.id?.toLowerCase().trim();
      const taskKey = t.chave?.toLowerCase().trim();
      return (taskId && worklogId === taskId) || (taskKey && worklogId === taskKey);
    });
  };

  // 1. Tarefas concluídas sem worklog
  const tasksWithoutWorklog = useMemo(() => {
    return filteredTasks.filter(task => 
      isCompletedStatus(task.status) && !taskHasWorklogHelper(task, worklogs)
    );
  }, [filteredTasks, worklogs]);

  // 4. Tarefas duplicadas
  const duplicateTasks = useMemo(() => {
    const taskMap = new Map<string, TaskItem[]>();
    
    filteredTasks.forEach(task => {
      const key = task.chave?.toLowerCase().trim() || task.id?.toLowerCase().trim() || '';
      if (key) {
        if (!taskMap.has(key)) {
          taskMap.set(key, []);
        }
        taskMap.get(key)!.push(task);
      }
    });

    const duplicates: TaskItem[][] = [];
    taskMap.forEach((taskList) => {
      if (taskList.length > 1) {
        duplicates.push(taskList);
      }
    });

    return duplicates;
  }, [filteredTasks]);

  // 5. Sprints inexistentes
  const tasksWithInvalidSprint = useMemo(() => {
    if (sprintMetadata.length === 0) return []; // If no metadata, skip this check
    return filteredTasks.filter(task => {
      const sprintName = task.sprint;
      return !sprintMetadata.some(m => m.sprint === sprintName);
    });
  }, [filteredTasks, sprintMetadata]);

  // 6. Valores numéricos inválidos
  const tasksWithInvalidValues = useMemo(() => {
    return filteredTasks.filter(task => {
      const estimativa = task.estimativa || 0;
      const tempoGastoTotal = task.tempoGastoTotal ?? 0;
      
      // Estimativa negativa
      if (estimativa < 0) return true;
      
      // Estimativa extremamente alta (>200h)
      if (estimativa > 200) return true;
      
      // Tempo gasto negativo (should not happen, but check anyway)
      if (tempoGastoTotal < 0) return true;
      
      return false;
    });
  }, [filteredTasks]);

  // 7. Worklog com tempo gasto negativo ou zero
  const worklogsWithInvalidTime = useMemo(() => {
    return filteredWorklogs.filter(w => w.tempoGasto <= 0);
  }, [filteredWorklogs]);

  // 8. Datas inválidas
  const tasksWithInvalidDates = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return filteredTasks.filter(task => {
      const createdDate = task.criado;
      
      // Data de criação no futuro
      if (createdDate && createdDate.getTime() > today.getTime()) {
        return true;
      }

      // Tarefa criada fora do período do sprint (quando metadata existe)
      if (sprintMetadata.length > 0 && task.sprint) {
        const sprintMeta = sprintMetadata.find(m => m.sprint === task.sprint);
        if (sprintMeta) {
          const isInRange = isDateInSprint(createdDate, sprintMeta.dataInicio, sprintMeta.dataFim);
          if (!isInRange) {
            return true;
          }
        }
      }

      return false;
    });
  }, [filteredTasks, sprintMetadata]);

  const worklogsWithInvalidDates = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return filteredWorklogs.filter(w => {
      const logDate = w.data;
      // Data de worklog no futuro
      return logDate && logDate.getTime() > today.getTime();
    });
  }, [filteredWorklogs]);

  const sprintsWithInvalidPeriod = useMemo(() => {
    return sprintMetadata.filter(meta => {
      // Data fim anterior à data início
      return meta.dataFim.getTime() < meta.dataInicio.getTime();
    });
  }, [sprintMetadata]);

  // 9. Worklog com data muito antiga (antes de 2020)
  const worklogsWithOldDates = useMemo(() => {
    const minDate = new Date('2020-01-01');
    minDate.setHours(0, 0, 0, 0);
    
    return filteredWorklogs.filter(w => {
      const logDate = w.data;
      return logDate && logDate.getTime() < minDate.getTime();
    });
  }, [filteredWorklogs]);

  // 10. Tarefas sem responsável
  const tasksWithoutOwner = useMemo(() => {
    return filteredTasks.filter(task => {
      const hasResponsavel = task.responsavel && task.responsavel.trim() !== '';
      const hasIdResponsavel = task.idResponsavel && task.idResponsavel.trim() !== '';
      return !hasResponsavel && !hasIdResponsavel;
    });
  }, [filteredTasks]);

  // 11. Campos obrigatórios ausentes
  const tasksWithMissingFields = useMemo(() => {
    return filteredTasks.filter(task => {
      const hasChave = task.chave && task.chave.trim() !== '';
      const hasId = task.id && task.id.trim() !== '';
      return !hasChave && !hasId;
    });
  }, [filteredTasks]);

  const worklogsWithMissingFields = useMemo(() => {
    return filteredWorklogs.filter(w => !w.taskId || w.taskId.trim() === '');
  }, [filteredWorklogs]);

  // 12. Tarefas sem sprint definido (NÃO é inconsistência - são tarefas de backlog)
  // NOTA: Tarefas sem sprint são esperadas e usadas apenas para análise de backlog
  // Elas não interferem em métricas de performance, mesmo que tenham worklog
  const tasksWithoutSprint = useMemo(() => {
    return filteredTasks.filter(task => {
      return !task.sprint || task.sprint.trim() === '';
    });
  }, [filteredTasks]);

  // 13. Estimativas inconsistentes (tempo gasto muito maior que estimativa)
  const tasksWithInconsistentEstimates = useMemo(() => {
    return filteredTasks.filter(task => {
      const estimativa = task.estimativa || 0;
      const tempoGastoTotal = task.tempoGastoTotal ?? 0;
      
      if (estimativa > 0 && tempoGastoTotal > 0) {
        // Tempo gasto > 300% da estimativa
        const percentage = (tempoGastoTotal / estimativa) * 100;
        return percentage > 300;
      }
      
      return false;
    });
  }, [filteredTasks]);

  // 14. Inconsistência entre tempo gasto deprecated e worklog
  const tasksWithDeprecatedTimeMismatch = useMemo(() => {
    return filteredTasks.filter(task => {
      const tempoGastoDeprecated = task.tempoGasto || 0;
      const tempoGastoTotal = task.tempoGastoTotal ?? 0;
      
      if (tempoGastoDeprecated > 0 && tempoGastoTotal > 0) {
        const diff = Math.abs(tempoGastoDeprecated - tempoGastoTotal);
        const percentage = (diff / Math.max(tempoGastoDeprecated, tempoGastoTotal)) * 100;
        // Diferença > 10%
        return percentage > 10;
      }
      
      return false;
    });
  }, [filteredTasks]);

  // Compile all inconsistencies
  const inconsistencies = useMemo((): Inconsistency[] => {
    const all: Inconsistency[] = [];

    // 1. Tarefas concluídas sem worklog
    if (tasksWithoutWorklog.length > 0) {
      all.push({
        id: 'tasks-without-worklog',
        type: 'tasks-without-worklog',
        category: 'Worklog',
        severity: 'high',
        title: 'Tarefas Concluídas sem Worklog',
        description: 'Tarefas com status "concluído" mas sem nenhum registro de worklog. Indica possível falta de registro de tempo.',
        count: tasksWithoutWorklog.length,
        items: tasksWithoutWorklog,
      });
    }

    // 4. Tarefas duplicadas
    if (duplicateTasks.length > 0) {
      const allDuplicates = duplicateTasks.flat();
      all.push({
        id: 'duplicate-tasks',
        type: 'duplicate-tasks',
        category: 'Dados',
        severity: 'medium',
        title: 'Tarefas Duplicadas',
        description: 'Tarefas com a mesma chave ou ID aparecendo múltiplas vezes. Pode causar duplicação nos cálculos.',
        count: allDuplicates.length,
        items: duplicateTasks,
      });
    }

    // 5. Sprints inexistentes
    if (tasksWithInvalidSprint.length > 0) {
      all.push({
        id: 'invalid-sprint',
        type: 'invalid-sprint',
        category: 'Sprint',
        severity: 'medium',
        title: 'Tarefas com Sprint Inexistente',
        description: 'Tarefas referenciando sprints que não existem no arquivo de sprints. Impacta agrupamento e análise por sprint.',
        count: tasksWithInvalidSprint.length,
        items: tasksWithInvalidSprint,
      });
    }

    // 6. Valores numéricos inválidos
    if (tasksWithInvalidValues.length > 0) {
      all.push({
        id: 'invalid-numeric-values',
        type: 'invalid-numeric-values',
        category: 'Validação',
        severity: 'medium',
        title: 'Tarefas com Valores Numéricos Inválidos',
        description: 'Tarefas com estimativas negativas ou extremamente altas (>200h), ou tempo gasto negativo. Indica possível erro de entrada.',
        count: tasksWithInvalidValues.length,
        items: tasksWithInvalidValues,
      });
    }

    // 7. Worklog com tempo inválido
    if (worklogsWithInvalidTime.length > 0) {
      all.push({
        id: 'worklog-invalid-time',
        type: 'worklog-invalid-time',
        category: 'Validação',
        severity: 'medium',
        title: 'Worklogs com Tempo Inválido',
        description: 'Registros de worklog com tempo gasto negativo ou zero. Pode indicar erro de registro.',
        count: worklogsWithInvalidTime.length,
        items: worklogsWithInvalidTime,
      });
    }

    // 8. Datas inválidas
    const allInvalidDates = [
      ...tasksWithInvalidDates,
      ...worklogsWithInvalidDates,
      ...sprintsWithInvalidPeriod,
    ];
    if (allInvalidDates.length > 0) {
      all.push({
        id: 'invalid-dates',
        type: 'invalid-dates',
        category: 'Data',
        severity: 'medium',
        title: 'Datas Inválidas',
        description: 'Datas de criação no futuro, worklogs no futuro, ou sprints com período inválido (fim antes do início).',
        count: allInvalidDates.length,
        items: {
          tasks: tasksWithInvalidDates,
          worklogs: worklogsWithInvalidDates,
          sprints: sprintsWithInvalidPeriod,
        },
      });
    }

    // 9. Worklog com data muito antiga
    if (worklogsWithOldDates.length > 0) {
      all.push({
        id: 'old-worklog-dates',
        type: 'old-worklog-dates',
        category: 'Data',
        severity: 'low',
        title: 'Worklogs com Data Muito Antiga',
        description: 'Registros de worklog com data anterior a 2020. Pode indicar erro de data ou dados históricos.',
        count: worklogsWithOldDates.length,
        items: worklogsWithOldDates,
      });
    }

    // 10. Tarefas sem responsável
    if (tasksWithoutOwner.length > 0) {
      all.push({
        id: 'tasks-without-owner',
        type: 'tasks-without-owner',
        category: 'Dados',
        severity: 'medium',
        title: 'Tarefas sem Responsável',
        description: 'Tarefas sem responsável ou ID do responsável definido. Impacta análise por desenvolvedor.',
        count: tasksWithoutOwner.length,
        items: tasksWithoutOwner,
      });
    }

    // 11. Campos obrigatórios ausentes
    const allMissingFields = [
      ...tasksWithMissingFields,
      ...worklogsWithMissingFields,
    ];
    if (allMissingFields.length > 0) {
      all.push({
        id: 'missing-required-fields',
        type: 'missing-required-fields',
        category: 'Dados',
        severity: 'high',
        title: 'Campos Obrigatórios Ausentes',
        description: 'Tarefas sem chave/ID ou worklogs sem taskId. Dados incompletos que podem causar problemas.',
        count: allMissingFields.length,
        items: {
          tasks: tasksWithMissingFields,
          worklogs: worklogsWithMissingFields,
        },
      });
    }

    // 12. Tarefas sem sprint definido - REMOVIDO (não é inconsistência)
    // Tarefas sem sprint são esperadas e usadas apenas para análise de backlog
    // Elas não interferem em métricas de performance, mesmo que tenham worklog
    // Não são tratadas como inconsistência pois fazem parte do fluxo normal

    // 13. Estimativas inconsistentes
    if (tasksWithInconsistentEstimates.length > 0) {
      all.push({
        id: 'inconsistent-estimates',
        type: 'inconsistent-estimates',
        category: 'Estimativa',
        severity: 'low',
        title: 'Estimativas Inconsistentes',
        description: 'Tarefas com tempo gasto muito maior que a estimativa original (>300%). Pode indicar erro de registro ou estimativa incorreta.',
        count: tasksWithInconsistentEstimates.length,
        items: tasksWithInconsistentEstimates,
      });
    }

    // 14. Inconsistência entre tempo deprecated e worklog
    if (tasksWithDeprecatedTimeMismatch.length > 0) {
      all.push({
        id: 'deprecated-time-mismatch',
        type: 'deprecated-time-mismatch',
        category: 'Worklog',
        severity: 'low',
        title: 'Inconsistência entre Tempo Deprecated e Worklog',
        description: 'Diferença significativa entre tempo gasto na planilha (deprecated) e tempo calculado do worklog. Indica possível desatualização da planilha.',
        count: tasksWithDeprecatedTimeMismatch.length,
        items: tasksWithDeprecatedTimeMismatch,
      });
    }

    return all.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [
    tasksWithoutWorklog,
    duplicateTasks,
    tasksWithInvalidSprint,
    tasksWithInvalidValues,
    worklogsWithInvalidTime,
    tasksWithInvalidDates,
    worklogsWithInvalidDates,
    sprintsWithInvalidPeriod,
    worklogsWithOldDates,
    tasksWithoutOwner,
    tasksWithMissingFields,
    worklogsWithMissingFields,
    tasksWithoutSprint,
    tasksWithInconsistentEstimates,
    tasksWithDeprecatedTimeMismatch,
  ]);

  const totalInconsistencies = inconsistencies.reduce((sum, inc) => sum + inc.count, 0);

  if (totalInconsistencies === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-green-200 dark:border-green-800 p-8">
        <div className="flex items-center gap-4 text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Tudo em Ordem! ✅</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Nenhuma inconsistência encontrada nos dados importados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group inconsistencies by category
  const byCategory = useMemo(() => {
    const grouped = new Map<string, Inconsistency[]>();
    inconsistencies.forEach(inc => {
      if (!grouped.has(inc.category)) {
        grouped.set(inc.category, []);
      }
      grouped.get(inc.category)!.push(inc);
    });
    return grouped;
  }, [inconsistencies]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Worklog':
        return <Clock className="w-5 h-5" />;
      case 'Status':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'Dados':
        return <FileWarning className="w-5 h-5" />;
      case 'Sprint':
        return <Calendar className="w-5 h-5" />;
      case 'Validação':
        return <AlertTriangle className="w-5 h-5" />;
      case 'Data':
        return <Calendar className="w-5 h-5" />;
      case 'Estimativa':
        return <Hash className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 shadow-xl border-2 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Inconsistências Encontradas
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {totalInconsistencies} inconsistência{totalInconsistencies !== 1 ? 's' : ''} detectada{totalInconsistencies !== 1 ? 's' : ''} em {inconsistencies.length} categoria{inconsistencies.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {totalInconsistencies}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              item{totalInconsistencies !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Alta Severidade</div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                {inconsistencies.filter(i => i.severity === 'high').reduce((sum, i) => sum + i.count, 0)}
              </div>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Média Severidade</div>
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {inconsistencies.filter(i => i.severity === 'medium').reduce((sum, i) => sum + i.count, 0)}
              </div>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Baixa Severidade</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {inconsistencies.filter(i => i.severity === 'low').reduce((sum, i) => sum + i.count, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inconsistencies by Category */}
      {Array.from(byCategory.entries()).map(([category, categoryInconsistencies]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {getCategoryIcon(category)}
            {category}
          </h3>

          {categoryInconsistencies.map((inc) => (
            <div
              key={inc.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 ${getSeverityColor(inc.severity)} overflow-hidden`}
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {inc.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(inc.severity)}`}>
                        {inc.severity === 'high' ? 'Alta' : inc.severity === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {inc.description}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {inc.count}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ocorrência{inc.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <InconsistencyItems inconsistency={inc} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Component to render items for each inconsistency type
const InconsistencyItems: React.FC<{ inconsistency: Inconsistency }> = ({ inconsistency }) => {
  const { type, items } = inconsistency;

  if (type === 'duplicate-tasks') {
    // items is TaskItem[][]
    return (
      <div className="space-y-4">
        {(items as TaskItem[][]).map((duplicateGroup, idx) => (
          <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Chave/ID duplicada: <span className="font-mono">{duplicateGroup[0].chave || duplicateGroup[0].id}</span> ({duplicateGroup.length} ocorrências)
            </div>
            <div className="space-y-2">
              {duplicateGroup.map((task, taskIdx) => (
                <div key={taskIdx} className="text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  <div className="font-medium">{task.resumo || 'Sem resumo'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Sprint: {task.sprint} | Responsável: {task.responsavel || task.idResponsavel || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'invalid-dates') {
    // items is { tasks, worklogs, sprints }
    const { tasks, worklogs, sprints } = items as any;
    return (
      <div className="space-y-4">
        {tasks && tasks.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tarefas ({tasks.length}):
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 10).map((task: TaskItem) => (
                <div key={task.chave || task.id} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-mono">{task.chave || task.id}</span>: {task.resumo || 'Sem resumo'} - Criado: {task.criado.toLocaleDateString('pt-BR')}
                </div>
              ))}
              {tasks.length > 10 && (
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  ... e mais {tasks.length - 10} tarefa(s)
                </div>
              )}
            </div>
          </div>
        )}
        {worklogs && worklogs.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Worklogs ({worklogs.length}):
            </div>
            <div className="space-y-2">
              {worklogs.slice(0, 10).map((w: WorklogEntry, idx: number) => (
                <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                  Task: <span className="font-mono">{w.taskId}</span> - Data: {w.data.toLocaleDateString('pt-BR')} - Tempo: {formatHours(w.tempoGasto)}
                </div>
              ))}
              {worklogs.length > 10 && (
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  ... e mais {worklogs.length - 10} worklog(s)
                </div>
              )}
            </div>
          </div>
        )}
        {sprints && sprints.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sprints ({sprints.length}):
            </div>
            <div className="space-y-2">
              {sprints.map((sprint: SprintMetadata) => (
                <div key={sprint.sprint} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-mono">{sprint.sprint}</span>: {sprint.dataInicio.toLocaleDateString('pt-BR')} - {sprint.dataFim.toLocaleDateString('pt-BR')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'missing-required-fields') {
    // items is { tasks, worklogs }
    const { tasks, worklogs } = items as any;
    return (
      <div className="space-y-4">
        {tasks && tasks.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tarefas sem chave/ID ({tasks.length}):
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 10).map((task: TaskItem) => (
                <div key={`${task.sprint}-${task.resumo}`} className="text-sm text-gray-600 dark:text-gray-400">
                  {task.resumo || 'Sem resumo'} - Sprint: {task.sprint || 'N/A'}
                </div>
              ))}
              {tasks.length > 10 && (
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  ... e mais {tasks.length - 10} tarefa(s)
                </div>
              )}
            </div>
          </div>
        )}
        {worklogs && worklogs.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Worklogs sem taskId ({worklogs.length}):
            </div>
            <div className="space-y-2">
              {worklogs.slice(0, 10).map((w: WorklogEntry, idx: number) => (
                <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                  Data: {w.data.toLocaleDateString('pt-BR')} - Tempo: {formatHours(w.tempoGasto)}
                </div>
              ))}
              {worklogs.length > 10 && (
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  ... e mais {worklogs.length - 10} worklog(s)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: render tasks or worklogs
  if (items.length === 0) {
    return <div className="text-sm text-gray-500 dark:text-gray-500">Nenhum item encontrado.</div>;
  }

  const isTaskItems = items[0] && 'resumo' in items[0];
  const isWorklogItems = items[0] && 'taskId' in items[0] && 'tempoGasto' in items[0];

  if (isTaskItems) {
    const taskItems = items as TaskItem[];
    return (
      <div className="space-y-3">
        {taskItems.slice(0, 20).map((task) => (
          <div
            key={task.chave || task.id || `${task.sprint}-${task.resumo}`}
            className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {task.chave || task.id || 'Sem ID'}
                  </span>
                </div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                  {task.resumo || 'Sem resumo'}
                </h5>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {task.estimativa > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Est: {formatHours(task.estimativa)}
                    </span>
                  )}
                  {task.tempoGastoTotal !== undefined && (
                    <span className="flex items-center gap-1">
                      Gasto: {formatHours(task.tempoGastoTotal)}
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
                    {task.tipo}
                  </span>
                  {task.responsavel && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {task.responsavel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {taskItems.length > 20 && (
          <div className="text-sm text-center text-gray-500 dark:text-gray-500 pt-2">
            ... e mais {taskItems.length - 20} tarefa(s)
          </div>
        )}
      </div>
    );
  }

  if (isWorklogItems) {
    const worklogItems = items as WorklogEntry[];
    return (
      <div className="space-y-3">
        {worklogItems.slice(0, 20).map((w, idx) => (
          <div
            key={idx}
            className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  Task: {w.taskId || 'Sem ID'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Data: {w.data.toLocaleDateString('pt-BR')} | Tempo: {formatHours(w.tempoGasto)}
                </div>
              </div>
            </div>
          </div>
        ))}
        {worklogItems.length > 20 && (
          <div className="text-sm text-center text-gray-500 dark:text-gray-500 pt-2">
            ... e mais {worklogItems.length - 20} worklog(s)
          </div>
        )}
      </div>
    );
  }

  return <div className="text-sm text-gray-500 dark:text-gray-500">Tipo de item não reconhecido.</div>;
};
