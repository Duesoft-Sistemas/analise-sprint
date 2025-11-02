import React, { useMemo, useState } from 'react';
import { Search, Filter, X, FileDown } from 'lucide-react';
import { TaskItem } from '../types';
import { useSprintStore } from '../store/useSprintStore';
import { formatHours, isCompletedStatus, normalizeForComparison } from '../utils/calculations';
import { exportTasksToExcel } from '../services/excelExportService';

const getDetalheTagColor = (detalhe: string) => {
  const normalized = normalizeForComparison(detalhe).replace(/\s/g, '');
  if (normalized.includes('horaextra')) {
    return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
  }
  if (normalized.includes('auxilio')) {
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
  }
  if (normalized.includes('reuniao')) {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFeature, setFilterFeature] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterNoEstimate, setFilterNoEstimate] = useState(false);

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
      filtered = filtered.filter((t) => t.categorias.includes(taskFilters.categoria!));
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
      result = result.filter((t) => t.categorias.includes(filterClient));
    }
    if (filterStatus) {
      result = result.filter((t) => t.status === filterStatus);
    }
    if (filterNoEstimate) {
      result = result.filter((t) => t.estimativa === 0);
    }

    return result;
  }, [baseFilteredTasks, searchTerm, filterFeature, filterModule, filterClient, filterStatus, filterNoEstimate]);

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
    const clients = new Set<string>();
    baseFilteredTasks.forEach((t) => t.categorias.forEach((c) => clients.add(c)));
    return Array.from(clients).sort();
  }, [baseFilteredTasks]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(baseFilteredTasks.map((t) => t.status));
    return Array.from(statuses).sort();
  }, [baseFilteredTasks]);

  const hasFilters =
    searchTerm || filterFeature || filterModule || filterClient || filterStatus || filterNoEstimate;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterFeature('');
    setFilterModule('');
    setFilterClient('');
    setFilterStatus('');
    setFilterNoEstimate(false);
  };

  const handleExport = () => {
    if (selectedSprint) {
      exportTasksToExcel(filteredTasks, selectedSprint);
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
    let totalTestNote = 0;
    let testNoteCount = 0;

    filteredTasks.forEach((task) => {
      // Use hybrid fields for calculations
      const estimativaRestante = task.estimativaRestante ?? task.estimativa ?? 0;
      const tempoGasto = task.tempoGastoNoSprint ?? 0;

      totalEstimated += estimativaRestante;
      totalSpent += tempoGasto;
      totalComplexity += task.complexidade ?? 0;

      const notaTeste = task.notaTeste ?? 5; // Default to 5 if missing
      totalTestNote += notaTeste;
      testNoteCount++;
    });

    return {
      count: filteredTasks.length,
      totalEstimated,
      totalSpent,
      avgComplexity: totalComplexity / filteredTasks.length,
      avgTestNote: totalTestNote / testNoteCount,
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
            <Filter className="w-4 h-4 text-white" />
          </div>
          Lista de Tarefas
          {selectedDeveloper && (
            <span className="text-sm text-blue-600 dark:text-blue-400">({selectedDeveloper})</span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={filteredTasks.length === 0}
            title={filteredTasks.length === 0 ? "Nenhuma tarefa para exportar" : "Exportar lista para Excel"}
          >
            <FileDown className="w-4 h-4" />
            Exportar Excel
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
            {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por resumo, chave ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={filterFeature}
            onChange={(e) => setFilterFeature(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todas as features</option>
            {uniqueFeatures.map((feature) => (
              <option key={feature} value={feature}>
                {feature}
              </option>
            ))}
          </select>

          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos os módulos</option>
            {uniqueModules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos os clientes</option>
            {uniqueClients.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos os status</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={filterNoEstimate}
              onChange={(e) => setFilterNoEstimate(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span>Apenas tarefas sem estimativa</span>
          </label>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhuma tarefa encontrada com os filtros aplicados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
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
                      title={`Média de Nota de Teste: ${totals.avgTestNote.toFixed(2)}/5`}
                    >
                      {totals.avgTestNote.toFixed(1)}/5
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
        )}
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
          const note = task.notaTeste ?? 5;
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

