import React, { useMemo, useState } from 'react';
import { useSprintStore } from '../store/useSprintStore';
import { calculateBacklogFlowBySprint, calculateCapacityRecommendation } from '../services/analytics';
import { Inbox, CheckSquare, TrendingUp, BarChart3, Clock, X, List } from 'lucide-react';
import { formatHours } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TaskItem } from '../types';

type FilterType = 
  | { type: 'legacyInflow' }
  | { type: 'inflow'; sprintName: string }
  | { type: 'outflow'; sprintName: string }
  | { type: 'completedWithoutSprint' }
  | null;

export const BacklogFlowDashboard: React.FC = () => {
  const tasks = useSprintStore((s) => s.tasks);
  const sprintMetadata = useSprintStore((s) => s.sprintMetadata);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  const backlogFlow = useMemo(() => {
    if (!sprintMetadata || sprintMetadata.length === 0) return null;
    return calculateBacklogFlowBySprint(tasks, sprintMetadata);
  }, [tasks, sprintMetadata]);

  const capacityReco = useMemo(() => {
    if (!sprintMetadata || sprintMetadata.length === 0) return null;
    return calculateCapacityRecommendation(tasks, sprintMetadata);
  }, [tasks, sprintMetadata]);

  if (!backlogFlow) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 opacity-50" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Configure os sprints para ver o fluxo</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Carregue o arquivo de sprints para habilitar a análise por período.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border border-slate-500 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Fluxo & Capacidade</h2>
            <p className="text-gray-200 text-sm">Entradas, saídas e recomendação de capacidade por sprint</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <SummaryCard
          icon={<Inbox className="w-5 h-5" />}
          label="Entrada no Backlog (méd.)"
          value={backlogFlow.averages.avgInflow.toFixed(1)}
          subtitle="tickets/sprint"
          color="gray"
          onClick={() => setActiveFilter(null)}
          isClickable={activeFilter !== null}
        />
        <SummaryCard
          icon={<CheckSquare className="w-5 h-5" />}
          label="Outflow (médio)"
          value={backlogFlow.averages.avgOutflow.toFixed(1)}
          subtitle="tickets/sprint"
          color="green"
          onClick={() => setActiveFilter(null)}
          isClickable={activeFilter !== null}
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Net Flow (médio)"
          value={backlogFlow.averages.avgNetFlow.toFixed(1)}
          subtitle="saídas − entradas"
          color="blue"
          onClick={() => setActiveFilter(null)}
          isClickable={activeFilter !== null}
        />
        <SummaryCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Exit Ratio (méd.)"
          value={Number.isFinite(backlogFlow.averages.avgExitRatio) ? backlogFlow.averages.avgExitRatio.toFixed(2) : '∞'}
          subtitle="outflow / inflow"
          color="purple"
          onClick={() => setActiveFilter(null)}
          isClickable={activeFilter !== null}
        />
        <SummaryCard
          icon={<Inbox className="w-5 h-5" />}
          label="Backlog Atual"
          value={backlogFlow.currentBacklog.tasks.toString()}
          subtitle={`${formatHours(backlogFlow.currentBacklog.estimatedHours)} estimadas`}
          color="yellow"
          onClick={() => setActiveFilter(null)}
          isClickable={activeFilter !== null}
        />
        {backlogFlow.legacyInflow && (
          <SummaryCard
            icon={<Inbox className="w-5 h-5" />}
            label="Anterior"
            value={backlogFlow.legacyInflow.tasks.toString()}
            subtitle={`${formatHours(backlogFlow.legacyInflow.estimatedHours)} estimadas`}
            color="gray"
            onClick={() => setActiveFilter({ type: 'legacyInflow' })}
            isClickable={true}
            isActive={activeFilter?.type === 'legacyInflow'}
          />
        )}
      </div>

      {/* Chart */}
      {backlogFlow.series.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Entradas vs Saídas por Sprint (análise completa)</h4>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  // Add "Anterior" column before sprints if legacy inflow exists
                  ...(backlogFlow.legacyInflow ? [{
                    sprint: 'Anterior',
                    'Entradas no Backlog': backlogFlow.legacyInflow.tasks,
                    'Entradas Legadas': null,
                    Saídas: null,
                    filterType: 'legacyInflow' as const,
                  }] : []),
                  // Sprint series
                  ...backlogFlow.series.map(s => ({
                    sprint: s.sprintName,
                    'Entradas no Backlog': s.inflow,
                    'Entradas Legadas': null,
                    Saídas: s.outflow,
                    sprintName: s.sprintName,
                  }))
                ]}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                onClick={(data: any) => {
                  if (!data || !data.activePayload || data.activePayload.length === 0) return;
                  const payload = data.activePayload[0].payload;
                  
                  if (payload.filterType === 'legacyInflow') {
                    setActiveFilter({ type: 'legacyInflow' });
                  } else if (payload.sprintName) {
                    // Quando clica em qualquer barra do sprint, seleciona o sprint
                    // Por padrão mostra entradas, mas o usuário pode alternar na seção da lista
                    setActiveFilter({ type: 'inflow', sprintName: payload.sprintName });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="sprint" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (value === null || value === undefined) return null;
                    return [value, name];
                  }}
                />
                <Bar dataKey="Entradas no Backlog" fill="#6b7280" radius={[4,4,0,0]} style={{ cursor: 'pointer' }} />
                <Bar dataKey="Entradas Legadas" fill="#9ca3af" radius={[4,4,0,0]} />
                <Bar dataKey="Saídas" fill="#10b981" radius={[4,4,0,0]} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {backlogFlow.legacyInflow && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              <p>
                * Coluna "Anterior": {backlogFlow.legacyInflow.tasks} tarefas sem sprint criadas antes do primeiro sprint ou sem data de criação ({formatHours(backlogFlow.legacyInflow.estimatedHours)} estimadas)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Capacity Recommendation */}
      {capacityReco && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recomendação de Capacidade</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Capacidade (P50)"
              value={`+${capacityReco.suggestedDevsP50}`}
              subtitle={`θ P50 ≈ ${capacityReco.throughputPerDevP50.toFixed(2)} tickets/dev/sprint`}
              color="green"
            />
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Capacidade (P80)"
              value={`+${capacityReco.suggestedDevsP80}`}
              subtitle={`θ P80 ≈ ${capacityReco.throughputPerDevP80.toFixed(2)} tickets/dev/sprint`}
              color="blue"
            />
            <SummaryCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Inflow Médio"
              value={capacityReco.avgInflow.toFixed(1)}
              subtitle="tickets/sprint (base p/ capacidade)"
              color="purple"
            />
          </div>
        </div>
      )}

      {/* Task List for Audit */}
      {activeFilter && (() => {
        // Helper function to format sprint period
        const getSprintPeriodLabel = (sprintName: string): string => {
          const metadata = sprintMetadata.find(m => m.sprint === sprintName);
          if (metadata) {
            const startStr = metadata.dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const endStr = metadata.dataFim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            return `${sprintName} (${startStr} - ${endStr})`;
          }
          return sprintName;
        };

        // Se o filtro é de um sprint (inflow ou outflow), mostrar opções para alternar
        const isSprintFilter = activeFilter.type === 'inflow' || activeFilter.type === 'outflow';
        const sprintName = isSprintFilter ? activeFilter.sprintName : null;
        const sprintItem = sprintName ? backlogFlow.series.find(s => s.sprintName === sprintName) : null;

        const filterLabel = 
          activeFilter.type === 'legacyInflow' && 'Anterior'
          || activeFilter.type === 'inflow' && `Entradas - ${getSprintPeriodLabel(activeFilter.sprintName)}`
          || activeFilter.type === 'outflow' && `Saídas - ${getSprintPeriodLabel(activeFilter.sprintName)}`
          || activeFilter.type === 'completedWithoutSprint' && 'Concluídas sem Sprint';

        return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tarefas Filtradas: {filterLabel}
              </h4>
            </div>
            <button
              onClick={() => setActiveFilter(null)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Limpar filtro"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Botões para alternar entre Entradas e Saídas quando um sprint está selecionado */}
          {isSprintFilter && sprintItem && (
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setActiveFilter({ type: 'inflow', sprintName: sprintName! })}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter.type === 'inflow'
                    ? 'bg-gray-600 dark:bg-gray-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📥 Entradas ({sprintItem.inflow})
              </button>
              <button
                onClick={() => setActiveFilter({ type: 'outflow', sprintName: sprintName! })}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter.type === 'outflow'
                    ? 'bg-green-600 dark:bg-green-500 text-white'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40'
                }`}
              >
                📤 Saídas ({sprintItem.outflow})
              </button>
            </div>
          )}
          
          <TaskFilterList filter={activeFilter} backlogFlow={backlogFlow} />
        </div>
        );
      })()}
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
  isClickable?: boolean;
  isActive?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, subtitle, color, onClick, isClickable, isActive }) => {
  const colorClasses = {
    gray: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    red: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  const baseClasses = `rounded-xl border-2 ${colorClasses[color]} p-4 transition-all duration-300`;
  const interactiveClasses = isClickable ? 'hover:shadow-lg cursor-pointer' : '';
  const activeClasses = isActive ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg' : '';

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${activeClasses}`}
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
}

interface TaskFilterListProps {
  filter: FilterType;
  backlogFlow: ReturnType<typeof calculateBacklogFlowBySprint>;
}

const TaskFilterList: React.FC<TaskFilterListProps> = ({ filter, backlogFlow }) => {
  if (!filter) return null;

  // Criar uma key única do filtro para garantir que useMemo detecte mudanças
  const filterKey = useMemo(() => {
    if (filter.type === 'legacyInflow') return 'legacyInflow';
    if (filter.type === 'completedWithoutSprint') return 'completedWithoutSprint';
    return `${filter.type}-${filter.sprintName}`;
  }, [filter]);

  // Usar useMemo para recalcular quando o filtro mudar
  const filteredTasks = useMemo(() => {
    let tasks: TaskItem[] = [];

    if (filter.type === 'legacyInflow' && backlogFlow.legacyInflow) {
      tasks = backlogFlow.legacyInflow.taskList;
    } else if (filter.type === 'completedWithoutSprint' && backlogFlow.completedWithoutSprint) {
      tasks = backlogFlow.completedWithoutSprint.taskList;
    } else if (filter.type === 'inflow') {
      const sprintItem = backlogFlow.series.find(s => s.sprintName === filter.sprintName);
      if (sprintItem) {
        tasks = sprintItem.inflowTasks;
      }
    } else if (filter.type === 'outflow') {
      const sprintItem = backlogFlow.series.find(s => s.sprintName === filter.sprintName);
      if (sprintItem) {
        tasks = sprintItem.outflowTasks;
      }
    }

    return tasks;
  }, [filterKey, filter, backlogFlow]);

  // Sort tasks by code (chave) - ascending order
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const codeA = (a.chave || a.id || '').toUpperCase();
      const codeB = (b.chave || b.id || '').toUpperCase();
      return codeA.localeCompare(codeB);
    });
  }, [filteredTasks]);

  if (sortedTasks.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
        Nenhuma tarefa encontrada para este filtro.
      </p>
    );
  }

  return (
    <div key={filterKey} className="space-y-1 max-h-[600px] overflow-y-auto">
      {sortedTasks.map((task) => (
        <div
          key={task.id || task.chave}
          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-4 text-sm"
        >
          {/* Código */}
          <div className="flex-shrink-0 font-mono font-semibold text-gray-700 dark:text-gray-300 w-24">
            {task.chave || task.id || '-'}
          </div>
          
          {/* Descrição */}
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white truncate" title={task.resumo}>
              {task.resumo || '-'}
            </p>
          </div>
          
          {/* Tipo */}
          <div className="flex-shrink-0 w-24">
            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
              {task.tipo || '-'}
            </span>
          </div>
          
          {/* Sprint */}
          <div className="flex-shrink-0 w-32">
            {task.sprint ? (
              <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">
                {task.sprint}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
            )}
          </div>
          
          {/* Criado */}
          <div className="flex-shrink-0 w-28">
            {task.criado && !isNaN(task.criado.getTime()) ? (
              <span className="text-gray-700 dark:text-gray-300 text-xs">
                {task.criado.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
            )}
          </div>
          
          {/* Status */}
          <div className="flex-shrink-0 w-32">
            {task.status ? (
              <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs">
                {task.status}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
            )}
          </div>
          
          {/* Cliente */}
          <div className="flex-shrink-0 w-40">
            {task.categorias && task.categorias.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {task.categorias.map((c, idx) => (
                  <span key={idx} className="px-2 py-1 rounded bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
            )}
          </div>
          
          {/* Estimativa */}
          <div className="flex-shrink-0 w-20 text-right">
            <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">
              {formatHours(task.estimativa || 0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};


