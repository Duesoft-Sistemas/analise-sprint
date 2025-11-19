import React, { useMemo, useState } from 'react';
import { Filter as FilterIcon, RotateCw } from 'lucide-react';
import { TaskItem } from '../types';
import { useSprintStore } from '../store/useSprintStore';
import { formatHours, isCompletedStatus, normalizeForComparison, taskHasCategory } from '../utils/calculations';
import { TaskFilters } from './TaskFilters';

const getDetalheTagColor = (detalhe: string) => {
  const normalized = normalizeForComparison(detalhe).replace(/\s/g, '');
  if (normalized.includes('auxilio')) {
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
  }
  if (normalized.includes('reuniao')) {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
  }
  if (normalized.includes('treinamento')) {
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
  }
  if (normalized.includes('duvidaoculta')) {
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
  }
  return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
};

export const TaskList: React.FC = () => {
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const selectedDeveloper = useSprintStore((state) => state.selectedDeveloper);
  const tasks = useSprintStore((state) => state.tasks);
  const taskFilters = useSprintStore((state) => state.taskFilters);
  const analyticsFilter = useSprintStore((state) => state.analyticsFilter);
  const setAnalyticsFilter = useSprintStore((state) => state.setAnalyticsFilter);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFeature, setFilterFeature] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterNoEstimate, setFilterNoEstimate] = useState(false);
  const [filterDelayed, setFilterDelayed] = useState(false);
  const [filterAhead, setFilterAhead] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterTestNote, setFilterTestNote] = useState('all'); // 'all', 'with', 'without'

  // Get base filtered tasks (by sprint, developer and global filters)
  // IMPORTANT: Always exclude tasks without sprint (backlog) when no sprint is selected
  // Backlog tasks should only appear in multi-sprint analysis, not in task list
  const baseFilteredTasks = useMemo(() => {
    let filtered = tasks;

    // Always exclude backlog tasks (without sprint) - they are only for backlog analysis
    filtered = filtered.filter((t) => t.sprint && t.sprint.trim() !== '');

    // Filter by selected sprint
    if (selectedSprint) {
      filtered = filtered.filter((t) => t.sprint === selectedSprint);
    }

    // Filter by selected developer
    if (selectedDeveloper) {
      filtered = filtered.filter((t) => t.responsavel === selectedDeveloper);
    }

    // Apply global task filters from store
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

    return filtered;
  }, [tasks, selectedSprint, selectedDeveloper, taskFilters]);

  const filteredTasks = useMemo(() => {
    let result = baseFilteredTasks;

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.resumo.toLowerCase().includes(search) ||
          t.chave.toLowerCase().includes(search) ||
          t.responsavel.toLowerCase().includes(search)
      );
    }

    // Apply additional filters
    if (filterFeature) {
      result = result.filter((t) => t.feature.includes(filterFeature));
    }
    if (filterModule) {
      result = result.filter((t) => t.modulo === filterModule);
    }
    if (filterClient) {
      result = result.filter((t) => taskHasCategory(t.categorias, filterClient));
    }
    if (filterType) {
      result = result.filter((t) => t.tipo === filterType);
    }
    if (filterStatus.length > 0) {
      result = result.filter((t) => filterStatus.includes(t.status));
    }
    if (filterNoEstimate) {
      result = result.filter((t) => t.estimativa === 0);
    }
    if (filterTestNote === 'with') {
      result = result.filter(t => t.notaTeste !== null && t.notaTeste !== undefined);
    } else if (filterTestNote === 'without') {
      result = result.filter(t => t.notaTeste === null || t.notaTeste === undefined);
    }
    if (filterDelayed) {
      result = result.filter(t => {
        const tempoGasto = t.tempoGastoNoSprint ?? 0;

        // Lógica para bugs baseada na complexidade
        if (t.tipo === 'Bug') {
          const complexidade = t.complexidade ?? 0;
          switch (complexidade) {
            case 1: return tempoGasto > 2;  // Ineficiente se > 2h
            case 2: return tempoGasto > 4;  // Ineficiente se > 4h
            case 3: return tempoGasto > 8;  // Ineficiente se > 8h
            case 4: return tempoGasto > 16; // Ineficiente se > 16h
            case 5: return tempoGasto > 32; // Ineficiente se > 32h
            default: return false;
          }
        } else {
          // Lógica original para outros tipos de tarefa
          const estimativa = t.estimativaRestante ?? t.estimativa ?? 0;
          return estimativa > 0 && tempoGasto > estimativa;
        }
      });
    }
    if (filterAhead) {
      result = result.filter(t => {
        const isCompleted = isCompletedStatus(t.status);
        const tempoGasto = t.tempoGastoNoSprint ?? 0;
        const estimativa = t.estimativaRestante ?? t.estimativa ?? 0;
        return isCompleted && estimativa > 0 && tempoGasto < estimativa;
      });
    }

    // Apply analytics filter
    if (analyticsFilter) {
      if (analyticsFilter.type === 'feature') {
        result = result.filter(t => t.feature.includes(analyticsFilter.value));
      } else if (analyticsFilter.type === 'client') {
        result = result.filter(t => taskHasCategory(t.categorias, analyticsFilter.value));
      }
    }

    // Sort by task code (chave)
    result = result.sort((a, b) => a.chave.localeCompare(b.chave));

    return result;
  }, [baseFilteredTasks, searchTerm, filterFeature, filterModule, filterClient, filterStatus, filterNoEstimate, filterDelayed, filterAhead, analyticsFilter, filterType, filterTestNote]);

  // Get unique values for filters - BASED ON CURRENT SPRINT TASKS
  const uniqueFeatures = useMemo(() => {
    const features = new Set<string>();
    baseFilteredTasks.forEach((t) => {
      // Features é um array - adicionar cada feature ao Set
      t.feature.forEach(f => {
        if (f && f.trim() !== '') {
          features.add(f.trim());
        }
      });
    });
    return Array.from(features).sort();
  }, [baseFilteredTasks]);

  const uniqueModules = useMemo(() => {
    const modules = new Set(baseFilteredTasks.filter((t) => t.modulo).map((t) => t.modulo));
    return Array.from(modules).sort();
  }, [baseFilteredTasks]);

  const uniqueClients = useMemo(() => {
    const clients = new Map<string, string>();
    baseFilteredTasks.forEach((t) =>
      t.categorias.forEach((c) => {
        if (!c) return;
        const trimmed = c.trim();
        if (!trimmed) return;
        const normalized = normalizeForComparison(trimmed);
        if (!clients.has(normalized)) {
          clients.set(normalized, trimmed);
        }
      })
    );
    return Array.from(clients.values()).sort((a, b) => a.localeCompare(b));
  }, [baseFilteredTasks]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(baseFilteredTasks.map((t) => t.status));
    return Array.from(statuses).sort();
  }, [baseFilteredTasks]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(baseFilteredTasks.map((t) => t.tipo));
    return Array.from(types).sort();
  }, [baseFilteredTasks]);

  const hasFilters = Boolean(
    searchTerm ||
      filterFeature ||
      filterModule ||
      filterClient ||
      filterStatus.length > 0 ||
      filterNoEstimate ||
      filterDelayed ||
      filterAhead ||
      filterType ||
      filterTestNote !== 'all'
  );

  const clearFilters = () => {
    setSearchTerm('');
    setFilterFeature('');
    setFilterModule('');
    setFilterClient('');
    setFilterStatus([]);
    setFilterNoEstimate(false);
    setFilterDelayed(false);
    setFilterAhead(false);
    setFilterType('');
    setFilterTestNote('all');
  };

  const handleStatusChange = (status: string) => {
    setFilterStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const setSelectedDeveloper = useSprintStore((state) => state.setSelectedDeveloper);

  const handleClearFilter = () => {
    if (analyticsFilter) {
      setAnalyticsFilter(null);
    } else if (selectedDeveloper) {
      setSelectedDeveloper(null);
    }
  };
  
  // Calculate totals and averages for filtered tasks
  const totals = useMemo(() => {
    if (filteredTasks.length === 0) {
      return {
        count: 0,
        totalEstimated: 0,
        totalSpent: 0,
        avgComplexity: 0,
        avgTestNote: 0,
      };
    }

    let totalEstimated = 0;
    let totalSpent = 0;
    let totalComplexity = 0;
    
    const tasksWithGrades = filteredTasks.filter(t => t.notaTeste !== null && t.notaTeste !== undefined);
    const totalTestNote = tasksWithGrades.reduce((sum, task) => sum + (task.notaTeste ?? 0), 0);

    filteredTasks.forEach((task) => {
      // Use hybrid fields for calculations
      const estimativaRestante = task.estimativaRestante ?? task.estimativa ?? 0;
      const tempoGasto = task.tempoGastoNoSprint ?? 0;

      totalEstimated += estimativaRestante;
      totalSpent += tempoGasto;
      totalComplexity += task.complexidade ?? 0;
    });

    return {
      count: filteredTasks.length,
      totalEstimated,
      totalSpent,
      avgComplexity: totalComplexity / filteredTasks.length,
      avgTestNote: tasksWithGrades.length > 0 ? totalTestNote / tasksWithGrades.length : 0,
    };
  }, [filteredTasks]);

  if (!selectedSprint) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Selecione um sprint para ver as tarefas</p>
      </div>
    );
  }

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Tarefas do Sprint
        </h2>
      </div>

      <TaskFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterFeature={filterFeature}
        setFilterFeature={setFilterFeature}
        uniqueFeatures={uniqueFeatures}
        filterModule={filterModule}
        setFilterModule={setFilterModule}
        uniqueModules={uniqueModules}
        filterClient={filterClient}
        setFilterClient={setFilterClient}
        uniqueClients={uniqueClients}
        filterType={filterType}
        setFilterType={setFilterType}
        uniqueTypes={uniqueTypes}
        filterStatus={filterStatus}
        onStatusChange={handleStatusChange}
        uniqueStatuses={uniqueStatuses}
        filterNoEstimate={filterNoEstimate}
        setFilterNoEstimate={setFilterNoEstimate}
        filterDelayed={filterDelayed}
        setFilterDelayed={setFilterDelayed}
        filterAhead={filterAhead}
        setFilterAhead={setFilterAhead}
        filterTestNote={filterTestNote}
        setFilterTestNote={setFilterTestNote}
        hasFilters={hasFilters}
        clearFilters={clearFilters}
      />

      {(selectedDeveloper || analyticsFilter) && (
        <div className="flex items-center justify-between p-3 mb-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <FilterIcon className="w-5 h-5" />
            <span className="text-sm font-medium">
              Filtrando por {analyticsFilter ? (analyticsFilter.type === 'feature' ? 'Feature' : 'Cliente') : 'Desenvolvedor'}:{' '}
              <span className="font-bold">{analyticsFilter ? analyticsFilter.value : selectedDeveloper}</span>
            </span>
          </div>
          <button
            onClick={handleClearFilter}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <RotateCw className="w-4 h-4" />
            Limpar
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chave
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resumo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sprint
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Complexidade
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nota Teste
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estimado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gasto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Variação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTasks.map((task) => (
                  <TaskRow key={task.chave} task={task} />
                ))}
              </tbody>
              <tfoot className="bg-gray-100 dark:bg-gray-900/70 border-t-2 border-gray-300 dark:border-gray-600">
                <tr className="font-semibold">
                  <td colSpan={6} className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                    Total ({totals.count} tarefa{totals.count !== 1 ? 's' : ''})
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-8 rounded-full text-sm font-bold ${
                        totals.avgComplexity <= 2
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                          : totals.avgComplexity === 3
                          ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                      }`}
                      title={`Média de Complexidade: ${totals.avgComplexity.toFixed(2)}/5`}
                    >
                      {totals.avgComplexity.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
                        totals.avgTestNote >= 4.5
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                          : totals.avgTestNote >= 3.5
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                          : totals.avgTestNote >= 2.5
                          ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                      }`}
                      title={`Média de Nota de Teste: ${totals.avgTestNote > 0 ? totals.avgTestNote.toFixed(2) : 'N/A'}/5`}
                    >
                      {totals.avgTestNote > 0 ? `${totals.avgTestNote.toFixed(1)}/5` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right font-semibold">
                    {formatHours(totals.totalEstimated)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right font-semibold">
                    {formatHours(totals.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {totals.totalEstimated > 0 ? (
                      <span
                        className={`font-semibold ${
                          totals.totalSpent > totals.totalEstimated
                            ? 'text-red-600 dark:text-red-400'
                            : totals.totalSpent < totals.totalEstimated
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {(() => {
                          const variance = totals.totalSpent - totals.totalEstimated;
                          const variancePercent = Math.round((variance / totals.totalEstimated) * 100);
                          return (
                            <>
                              {variance > 0 ? '+' : ''}
                              {formatHours(Math.abs(variance))} ({variancePercent > 0 ? '+' : ''}
                              {variancePercent}%)
                            </>
                          );
                        })()}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
};

interface TaskRowProps {
  task: TaskItem;
}

const TaskRow: React.FC<TaskRowProps> = ({ task }) => {
  // Use hybrid fields - IMPORTANT: Time spent is ALWAYS from worklog
  const tempoGasto = task.tempoGastoNoSprint ?? 0;
  const estimativaRestante = task.estimativaRestante ?? task.estimativa;
  const tempoOutrosSprints = task.tempoGastoOutrosSprints ?? 0;
  
  const variance = tempoGasto - estimativaRestante;
  const variancePercent =
    estimativaRestante > 0 ? Math.round((variance / estimativaRestante) * 100) : 0;

  const isCompleted = isCompletedStatus(task.status);
  const isOverTime = !isCompleted && estimativaRestante > 0 && tempoGasto > estimativaRestante;

  // Determinar cores para complexidade
  const getComplexityColor = (complexity: number) => {
    if (complexity <= 2) return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
    if (complexity === 3) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
  };

  const getTestNoteColor = (note: number) => {
    if (note >= 4.5) return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
    if (note >= 3.5) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
    if (note >= 2.5) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
  };

  return (
    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isOverTime ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{task.chave}</td>
      <td className="px-4 py-3 text-sm max-w-md">
        <div className="text-gray-700 dark:text-gray-300 truncate" title={task.resumo}>
          {task.resumo}
        </div>
        {task.detalhesOcultos && task.detalhesOcultos.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {task.detalhesOcultos.map(detalhe => (
              <span key={detalhe} className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${getDetalheTagColor(detalhe)}`}>
                {detalhe}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {task.sprint || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{task.responsavel || '-'}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            isCompleted
              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
          }`}
        >
          {task.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${
            task.tipo === 'Bug'
              ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
              : task.tipo === 'História'
              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
          }`}
        >
          {task.tipo}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getComplexityColor(task.complexidade)}`}
          title={`Complexidade: ${task.complexidade}/5`}
        >
          {task.complexidade}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {(() => {
          const note = task.notaTeste;
          if (note === null || note === undefined) {
            return <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>;
          }
          return (
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getTestNoteColor(note)}`}
              title={`Nota de Teste: ${note.toFixed(1)}/5`}
            >
              {note.toFixed(1)}/5
            </span>
          );
        })()}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        <div className="flex flex-col items-end">
          <span>{formatHours(estimativaRestante)}</span>
          {tempoOutrosSprints > 0 && (
            <span className="text-xs text-blue-600 dark:text-blue-400" title={`${formatHours(tempoOutrosSprints)} gastas em sprints anteriores`}>
              ({formatHours(task.estimativa)} orig.)
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        <div className="flex flex-col items-end">
          <span>{formatHours(tempoGasto)}</span>
          {tempoOutrosSprints > 0 && (
            <span className="text-xs text-purple-600 dark:text-purple-400" title="Tempo gasto em sprints anteriores">
              +{formatHours(tempoOutrosSprints)} ant.
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {estimativaRestante > 0 ? (
          <span
            className={`font-medium ${
              variance > 0 ? 'text-red-600 dark:text-red-400' : variance < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {variance > 0 ? '+' : ''}
            {formatHours(Math.abs(variance))} ({variancePercent > 0 ? '+' : ''}
            {variancePercent}%)
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">-</span>
        )}
      </td>
    </tr>
  );
};

