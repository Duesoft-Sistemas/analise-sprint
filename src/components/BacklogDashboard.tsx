import React, { useMemo, useState } from 'react';
import {
  Inbox,
  Bug,
  HelpCircle,
  CheckSquare,
  BarChart3,
  Users,
  Building2,
  Code,
  Layers,
  Calendar,
  TrendingUp,
  AlertCircle,
  Filter,
  Clock,
} from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { calculateBacklogAnalytics, BacklogAnalytics as BacklogAnalyticsType } from '../services/analytics';
import { formatHours } from '../utils/calculations';

export const BacklogDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterFeature, setFilterFeature] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState<string | null>(null);
  const [topLimit, setTopLimit] = useState<number | null>(10);

  // Calculate backlog analytics
  const analytics = useMemo(() => {
    return calculateBacklogAnalytics(tasks);
  }, [tasks]);

  // Filter analytics if needed
  const filteredTasks = useMemo(() => {
    let filtered = analytics.tasks;

    if (filterType && filterType !== 'all') {
      if (filterType === 'bugs') {
        filtered = filtered.filter((t) => t.tipo === 'Bug' && t.detalhesOcultos !== 'DuvidaOculta');
      } else if (filterType === 'dubidasOcultas') {
        filtered = filtered.filter((t) => t.tipo === 'Bug' && t.detalhesOcultos === 'DuvidaOculta');
      } else {
        filtered = filtered.filter((t) => t.tipo === filterType);
      }
    }

    if (filterFeature && filterFeature !== 'all') {
      filtered = filtered.filter((t) => t.feature.includes(filterFeature));
    }

    if (filterClient && filterClient !== 'all') {
      filtered = filtered.filter((t) => t.categorias.includes(filterClient));
    }

    return filtered;
  }, [analytics.tasks, filterType, filterFeature, filterClient]);

  const TOP_OPTIONS = [5, 10, 15, 20, null];

  // Calculate percentages for visual comparison
  const typePercentages = useMemo(() => {
    const total = analytics.summary.totalTasks;
    if (total === 0) return {};
    
    return {
      bugs: (analytics.summary.bugs / total) * 100,
      dubidasOcultas: (analytics.summary.dubidasOcultas / total) * 100,
      tarefas: (analytics.summary.tarefas / total) * 100,
    };
  }, [analytics.summary]);

  if (analytics.summary.totalTasks === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 opacity-50" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhuma tarefa em backlog</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Todas as tarefas estão alocadas em sprints. Parabéns! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-500 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Inbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Análise de Backlog</h2>
              <p className="text-gray-200 text-sm">
                Visualização completa para alocação eficiente nos sprints
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          icon={<Inbox className="w-5 h-5" />}
          label="Total de Tarefas"
          value={analytics.summary.totalTasks.toString()}
          subtitle="tarefas em backlog"
          color="gray"
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5" />}
          label="Horas Estimadas"
          value={formatHours(analytics.summary.totalEstimatedHours)}
          subtitle="de trabalho planejado"
          color="blue"
        />
        <SummaryCard
          icon={<Bug className="w-5 h-5" />}
          label="Bugs Reais"
          value={analytics.summary.bugs.toString()}
          subtitle={`${formatHours(analytics.byType.bugs.estimatedHours)} estimadas`}
          color="red"
        />
        <SummaryCard
          icon={<HelpCircle className="w-5 h-5" />}
          label="Dúvidas Ocultas"
          value={analytics.summary.dubidasOcultas.toString()}
          subtitle={`${formatHours(analytics.byType.dubidasOcultas.estimatedHours)} estimadas`}
          color="yellow"
        />
        <SummaryCard
          icon={<CheckSquare className="w-5 h-5" />}
          label="Tarefas"
          value={analytics.summary.tarefas.toString()}
          subtitle={`${formatHours(analytics.byType.tarefas.estimatedHours)} estimadas`}
          color="green"
        />
      </div>

      {/* Distribution by Type */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Tipo</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            • {analytics.summary.totalTasks} tarefas no total
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TypeCard
            icon={<Bug className="w-5 h-5" />}
            label="Bugs Reais"
            count={analytics.byType.bugs.count}
            hours={analytics.byType.bugs.estimatedHours}
            color="red"
            percentage={typePercentages.bugs}
          />
          <TypeCard
            icon={<HelpCircle className="w-5 h-5" />}
            label="Dúvidas Ocultas"
            count={analytics.byType.dubidasOcultas.count}
            hours={analytics.byType.dubidasOcultas.estimatedHours}
            color="yellow"
            percentage={typePercentages.dubidasOcultas}
          />
          <TypeCard
            icon={<CheckSquare className="w-5 h-5" />}
            label="Tarefas"
            count={analytics.byType.tarefas.count}
            hours={analytics.byType.tarefas.estimatedHours}
            color="green"
            percentage={typePercentages.tarefas}
          />
        </div>
      </div>

      {/* Distribution by Complexity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Complexidade</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {analytics.byComplexity.map((complexity, index) => (
            <ComplexityCard
              key={index}
              level={index + 1}
              count={complexity.count}
              hours={complexity.estimatedHours}
            />
          ))}
        </div>
      </div>

      {/* Analysis by Feature */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Feature</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({analytics.byFeature.length} features)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={topLimit === null ? 'all' : topLimit.toString()}
              onChange={(e) => setTopLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
            >
              {TOP_OPTIONS.map((option) => (
                <option key={option ?? 'all'} value={option ?? 'all'}>
                  Top {option ?? 'Todas'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          {analytics.byFeature
            .slice(0, topLimit ?? undefined)
            .map((feature, index) => {
              const maxHours = analytics.byFeature[0]?.estimatedHours || 1;
              const percentage = (feature.estimatedHours / maxHours) * 100;
              
              return (
                <div
                  key={feature.label}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex-shrink-0 text-blue-500 dark:text-blue-400">
                    <Code className="w-4 h-4" />
                  </div>
                  <div className="flex-shrink-0 min-w-[200px] flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={feature.label}>
                      {feature.label}
                    </p>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {feature.count} tarefa{feature.count !== 1 ? 's' : ''}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[200px]">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[80px] text-right">
                      {formatHours(feature.estimatedHours)}
                    </span>
                  </div>
                </div>
              );
            })}
          {analytics.byFeature.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              Nenhuma feature encontrada
            </p>
          )}
        </div>
      </div>

      {/* Analysis by Client */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Cliente</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({analytics.byClient.length} clientes)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={topLimit === null ? 'all' : topLimit.toString()}
              onChange={(e) => setTopLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
            >
              {TOP_OPTIONS.map((option) => (
                <option key={option ?? 'all'} value={option ?? 'all'}>
                  Top {option ?? 'Todas'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          {analytics.byClient
            .slice(0, topLimit ?? undefined)
            .map((client, index) => {
              const maxHours = analytics.byClient[0]?.estimatedHours || 1;
              const percentage = (client.estimatedHours / maxHours) * 100;
              
              return (
                <div
                  key={client.label}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex-shrink-0 text-purple-500 dark:text-purple-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-shrink-0 min-w-[200px] flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={client.label}>
                      {client.label}
                    </p>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {client.count} tarefa{client.count !== 1 ? 's' : ''}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[200px]">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[80px] text-right">
                      {formatHours(client.estimatedHours)}
                    </span>
                  </div>
                </div>
              );
            })}
          {analytics.byClient.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              Nenhum cliente encontrado
            </p>
          )}
        </div>
      </div>

      {/* Analysis by Responsável */}
      {analytics.byResponsavel.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Responsável</h3>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={topLimit === null ? 'all' : topLimit.toString()}
                onChange={(e) => setTopLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              >
                {TOP_OPTIONS.map((option) => (
                  <option key={option ?? 'all'} value={option ?? 'all'}>
                    Top {option ?? 'Todas'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {analytics.byResponsavel.slice(0, topLimit ?? undefined).map((resp, index) => (
              <AnalysisRow
                key={resp.label}
                rank={index + 1}
                label={resp.label}
                count={resp.count}
                hours={resp.estimatedHours}
                icon={<Users className="w-4 h-4" />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Analysis by Status */}
      {analytics.byStatus.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Por Status</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.byStatus.slice(0, 9).map((status, index) => (
              <div
                key={status.label}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{status.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{status.count}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">tarefas</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatHours(status.estimatedHours)} estimadas
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-md border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Insights para Alocação</h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                  <p>
                    <strong>{formatHours(analytics.summary.totalEstimatedHours)}</strong> de trabalho planejado aguardando alocação
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 dark:text-red-400 mt-0.5">•</span>
                  <p>
                    <strong>{analytics.summary.bugs + analytics.summary.dubidasOcultas}</strong> bugs/dúvidas precisam de atenção prioritária
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                  <p>
                    <strong>{analytics.byFeature.length}</strong> features diferentes no backlog
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 dark:text-purple-400 mt-0.5">•</span>
                  <p>
                    <strong>{analytics.byClient.length}</strong> clientes com demanda pendente
                  </p>
                </div>
                {analytics.byComplexity.filter((c, i) => i >= 3 && c.count > 0).reduce((sum, c) => sum + c.count, 0) > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500 dark:text-orange-400 mt-0.5">⚠️</span>
                    <p className="text-orange-600 dark:text-orange-400">
                      <strong>{analytics.byComplexity.filter((c, i) => i >= 3 && c.count > 0).reduce((sum, c) => sum + c.count, 0)}</strong> tarefas de alta complexidade (4-5) no backlog
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Estatísticas Rápidas</h3>
              <div className="space-y-3">
                <StatRow
                  label="Média de Horas por Tarefa"
                  value={analytics.summary.totalTasks > 0 
                    ? formatHours(analytics.summary.totalEstimatedHours / analytics.summary.totalTasks)
                    : '0h'
                  }
                />
                <StatRow
                  label="Tarefa Mais Complexa"
                  value={analytics.byComplexity
                    .slice()
                    .reverse()
                    .find(c => c.count > 0)?.label || 'N/A'}
                />
                <StatRow
                  label="Feature com Mais Demanda"
                  value={analytics.byFeature[0]?.label || 'N/A'}
                />
                <StatRow
                  label="Cliente com Mais Demanda"
                  value={analytics.byClient[0]?.label || 'N/A'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  color: 'gray' | 'blue' | 'red' | 'yellow' | 'green' | 'purple';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, subtitle, color }) => {
  const colorClasses = {
    gray: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    red: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className={`rounded-xl border-2 ${colorClasses[color]} p-4 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs opacity-70">{subtitle}</p>
    </div>
  );
};

interface TypeCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  hours: number;
  color: 'red' | 'yellow' | 'green' | 'purple' | 'gray';
  percentage?: number;
}

const TypeCard: React.FC<TypeCardProps> = ({ icon, label, count, hours, color, percentage }) => {
  const colorClasses = {
    red: 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30',
    yellow: 'border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30',
    green: 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
    purple: 'border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30',
    gray: 'border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30',
  };

  const textColorClasses = {
    red: 'text-red-700 dark:text-red-400',
    yellow: 'text-yellow-700 dark:text-yellow-400',
    green: 'text-green-700 dark:text-green-400',
    purple: 'text-purple-700 dark:text-purple-400',
    gray: 'text-gray-700 dark:text-gray-400',
  };

  const progressColorClasses = {
    red: 'bg-red-500 dark:bg-red-400',
    yellow: 'bg-yellow-500 dark:bg-yellow-400',
    green: 'bg-green-500 dark:bg-green-400',
    purple: 'bg-purple-500 dark:bg-purple-400',
    gray: 'bg-gray-500 dark:bg-gray-400',
  };

  return (
    <div className={`rounded-xl border-2 ${colorClasses[color]} p-4 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className={`text-sm font-medium ${textColorClasses[color]}`}>{label}</p>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
        {percentage !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">({percentage.toFixed(1)}%)</span>
        )}
      </div>
      {percentage !== undefined && (
        <div className="mb-2 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${progressColorClasses[color]}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{formatHours(hours)} estimadas</p>
    </div>
  );
};

interface ComplexityCardProps {
  level: number;
  count: number;
  hours: number;
}

const ComplexityCard: React.FC<ComplexityCardProps> = ({ level, count, hours }) => {
  const colors = [
    { bg: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400' },
    { bg: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400' },
    { bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400' },
    { bg: 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400' },
    { bg: 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400' },
  ];

  const color = colors[level - 1] || colors[0];

  return (
    <div className={`rounded-xl border-2 bg-gradient-to-br ${color.bg} ${color.border} p-4 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center gap-2 mb-2">
        <Layers className={`w-4 h-4 ${color.text}`} />
        <p className={`text-sm font-medium ${color.text}`}>Nível {level}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{count}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{formatHours(hours)} estimadas</p>
    </div>
  );
};

interface AnalysisRowProps {
  rank: number;
  label: string;
  count: number;
  hours: number;
  icon: React.ReactNode;
}

const AnalysisRow: React.FC<AnalysisRowProps> = ({ rank, label, count, hours, icon }) => {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <div className="flex-shrink-0 w-8 text-center">
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{rank}</span>
      </div>
      <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">{icon}</div>
      <div className="flex-shrink-0 min-w-[200px] flex-1">
        <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={label}>{label}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {count} tarefa{count !== 1 ? 's' : ''}
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatHours(hours)}
          </p>
        </div>
      </div>
    </div>
  );
};

interface StatRowProps {
  label: string;
  value: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value }) => {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}:</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
};

