import React, { useMemo, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { TaskItem } from '../types';
import { useSprintStore } from '../store/useSprintStore';
import { formatHours, isCompletedStatus } from '../utils/calculations';

export const TaskList: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const selectedDeveloper = useSprintStore((state) => state.selectedDeveloper);
  const getFilteredTasks = useSprintStore((state) => state.getFilteredTasks);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFeature, setFilterFeature] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterNoEstimate, setFilterNoEstimate] = useState(false);

  const filteredTasks = useMemo(() => {
    let result = getFilteredTasks();

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
      result = result.filter((t) => t.feature === filterFeature);
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
  }, [getFilteredTasks, searchTerm, filterFeature, filterModule, filterClient, filterStatus, filterNoEstimate]);

  // Get unique values for filters
  const uniqueFeatures = useMemo(() => {
    const features = new Set(tasks.filter((t) => t.feature).map((t) => t.feature));
    return Array.from(features).sort();
  }, [tasks]);

  const uniqueModules = useMemo(() => {
    const modules = new Set(tasks.filter((t) => t.modulo).map((t) => t.modulo));
    return Array.from(modules).sort();
  }, [tasks]);

  const uniqueClients = useMemo(() => {
    const clients = new Set<string>();
    tasks.forEach((t) => t.categorias.forEach((c) => clients.add(c)));
    return Array.from(clients).sort();
  }, [tasks]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(tasks.map((t) => t.status));
    return Array.from(statuses).sort();
  }, [tasks]);

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
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
          {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}
        </span>
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
                    Retrabalho
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
  // Use hybrid fields if available
  const tempoGasto = task.tempoGastoNoSprint ?? task.tempoGasto;
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

  return (
    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isOverTime ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{task.chave}</td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-md truncate" title={task.resumo}>
        {task.resumo}
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
        {task.retrabalho ? (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">
            Sim
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">-</span>
        )}
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

