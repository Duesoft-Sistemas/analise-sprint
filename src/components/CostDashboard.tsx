import React, { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Code,
  Calendar,
  Filter,
  BarChart3,
  X,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSprintStore } from '../store/useSprintStore';
import { calculateCostAnalytics } from '../services/costAnalytics';
import { formatHours, normalizeForComparison, isFullyCompletedStatus } from '../utils/calculations';

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const CostDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const worklogs = useSprintStore((state) => state.worklogs);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);
  const costData = useSprintStore((state) => state.costData);
  
  const [sprintDe, setSprintDe] = useState<string>('');
  const [sprintAte, setSprintAte] = useState<string>('');
  const [viewMode, setViewMode] = useState<'client' | 'feature' | 'developer'>('client');
  const [paginationLimit, setPaginationLimit] = useState<number | null>(10);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Available sprints for filter (only completed sprints, sorted by date)
  const availableSprints = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return sprintMetadata
      .filter(meta => {
        const sprintEnd = new Date(meta.dataFim);
        sprintEnd.setHours(23, 59, 59, 999);
        return sprintEnd < today; // Only completed sprints
      })
      .map(m => m.sprint)
      .sort((a, b) => {
        const metaA = sprintMetadata.find(m => m.sprint === a);
        const metaB = sprintMetadata.find(m => m.sprint === b);
        if (!metaA || !metaB) return 0;
        return metaA.dataInicio.getTime() - metaB.dataInicio.getTime();
      });
  }, [sprintMetadata]);

  // Calculate selected sprints based on range
  const selectedSprints = useMemo(() => {
    if (!sprintDe && !sprintAte) {
      return []; // All sprints
    }
    
    const sprintIndices = availableSprints.map((sprint, index) => ({ sprint, index }));
    const deIndex = sprintIndices.find(s => s.sprint === sprintDe)?.index ?? 0;
    const ateIndex = sprintIndices.find(s => s.sprint === sprintAte)?.index ?? availableSprints.length - 1;
    
    const startIndex = Math.min(deIndex, ateIndex);
    const endIndex = Math.max(deIndex, ateIndex);
    
    return availableSprints.slice(startIndex, endIndex + 1);
  }, [sprintDe, sprintAte, availableSprints]);

  // Calculate analytics
  const analytics = useMemo(() => {
    if (costData.length === 0) {
      return null;
    }
    return calculateCostAnalytics(tasks, worklogs, sprintMetadata, costData, selectedSprints);
  }, [tasks, worklogs, sprintMetadata, costData, selectedSprints]);

  // Calculate client costs over time (by sprint)
  const clientCostsOverTime = useMemo(() => {
    if (!selectedClient || costData.length === 0 || sprintMetadata.length === 0) {
      return [];
    }

    // Helper to get hourly rate
    const getHourlyRate = (developer: string): number => {
      const cost = costData.find(c => normalizeForComparison(c.responsavel) === normalizeForComparison(developer));
      return cost?.valorHora || 0;
    };

    // Filter and sort only completed sprints by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedSprints = sprintMetadata.filter(meta => {
      const sprintEnd = new Date(meta.dataFim);
      sprintEnd.setHours(23, 59, 59, 999);
      return sprintEnd < today; // Only completed sprints
    });
    
    const sortedSprints = [...completedSprints].sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime());

    return sortedSprints.map(sprint => {
      // Filter tasks for this client and sprint
      // IMPORTANT: Only include tasks from valid sprints (exclude backlog) and fully completed
      const clientTasks = tasks.filter(task => {
        // Exclude backlog tasks - only tasks from valid sprints
        if (!task.sprint || task.sprint.trim() === '') {
          return false;
        }
        
        const hasClient = task.categorias.some(cat => 
          normalizeForComparison(cat) === normalizeForComparison(selectedClient)
        );
        return hasClient && task.sprint === sprint.sprint && isFullyCompletedStatus(task.status);
      });

      let sprintCost = 0;
      let sprintHours = 0;

      for (const task of clientTasks) {
        const taskWorklogs = worklogs.filter(w => w.taskId === task.id || w.taskId === task.chave);
        
        for (const worklog of taskWorklogs) {
          const worklogHours = worklog.tempoGasto;
          if (worklogHours > 0) {
            // Check if worklog is within sprint period
            const worklogDate = new Date(worklog.data);
            if (worklogDate >= sprint.dataInicio && worklogDate <= sprint.dataFim) {
              const responsible = worklog.responsavel?.trim() || task.responsavel;
              const hourlyRate = getHourlyRate(responsible);
              sprintCost += worklogHours * hourlyRate;
              sprintHours += worklogHours;
            }
          }
        }
      }

      return {
        sprint: sprint.sprint,
        date: sprint.dataInicio,
        cost: sprintCost,
        hours: sprintHours,
      };
    });
  }, [selectedClient, tasks, worklogs, sprintMetadata, costData]);

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <DollarSign className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Dados de Custos Não Encontrados
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Carregue a planilha de custos para visualizar as análises de gerenciamento de custos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Gerenciamento de Custos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Análise de custos por cliente, feature, desenvolvedor e sprint
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtro de Período</h3>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Todos os Sprints Button */}
          <button
            onClick={() => {
              setSprintDe('');
              setSprintAte('');
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              !sprintDe && !sprintAte
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md shadow-green-500/30'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Todos os Sprints
          </button>
          
          {/* Sprint Range Selectors */}
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Sprint de
              </label>
              <div className="relative">
                <select
                  value={sprintDe}
                  onChange={(e) => setSprintDe(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="">Selecione o sprint inicial</option>
                  {availableSprints.map(sprint => (
                    <option key={sprint} value={sprint}>
                      {sprint}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="flex items-end pb-6 sm:pb-0">
              <span className="text-gray-400 dark:text-gray-500 font-medium">até</span>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Sprint até
              </label>
              <div className="relative">
                <select
                  value={sprintAte}
                  onChange={(e) => setSprintAte(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="">Selecione o sprint final</option>
                  {availableSprints.map(sprint => (
                    <option key={sprint} value={sprint}>
                      {sprint}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Period Summary */}
        {selectedSprints.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(analytics.period.startDate).toLocaleDateString('pt-BR')}
                </span>
                {' até '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(analytics.period.endDate).toLocaleDateString('pt-BR')}
                </span>
                {' • '}
                <span className="text-gray-500 dark:text-gray-500">
                  {selectedSprints.length} sprint{selectedSprints.length > 1 ? 's' : ''} selecionado{selectedSprints.length > 1 ? 's' : ''}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Custo Total</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(analytics.overall.totalCost)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Horas</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatHours(analytics.overall.totalHours)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Custo Médio/Hora</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(analytics.overall.averageCostPerHour)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Tarefas</span>
            <BarChart3 className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.overall.taskCount}
          </p>
        </div>
      </div>

      {/* View Mode Tabs and Pagination */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setViewMode('client')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'client'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Por Cliente
            </button>
            <button
              onClick={() => setViewMode('feature')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'feature'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Code className="w-4 h-4" />
              Por Feature
            </button>
            <button
              onClick={() => setViewMode('developer')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'developer'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="w-4 h-4" />
              Por Desenvolvedor
            </button>
          </div>
          
          {/* Pagination Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Mostrar:
            </label>
            <select
              value={paginationLimit === null ? 'all' : paginationLimit.toString()}
              onChange={(e) => setPaginationLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="30">Top 30</option>
              <option value="40">Top 40</option>
              <option value="all">Todos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis by Client */}
      {viewMode === 'client' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              Custos por Cliente
            </h3>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Cliente</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Custo Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Horas</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Tarefas</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byClient
                    .slice(0, paginationLimit === null ? undefined : paginationLimit)
                    .map((client) => (
                    <tr 
                      key={client.client} 
                      onClick={() => setSelectedClient(client.client)}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                        selectedClient === client.client ? 'bg-green-50 dark:bg-green-900/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{client.client}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(client.realCost)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{formatHours(client.realHours)}</td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{client.taskCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Client Cost Chart */}
          {selectedClient && clientCostsOverTime.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Evolução de Custos - {selectedClient}
                </h3>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Fechar gráfico"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={clientCostsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="sprint" 
                    stroke="#6b7280"
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tickFormatter={(value) => formatCurrency(value)}
                    className="text-xs"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Sprint: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Analysis by Feature */}
      {viewMode === 'feature' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-green-600" />
              Custos por Feature
            </h3>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Custo Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Horas</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Tarefas</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byFeature
                    .slice(0, paginationLimit === null ? undefined : paginationLimit)
                    .map((feature) => (
                    <tr key={feature.feature} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{feature.feature}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(feature.realCost)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{formatHours(feature.realHours)}</td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{feature.taskCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analysis by Developer */}
      {viewMode === 'developer' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Custos por Desenvolvedor
            </h3>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Desenvolvedor</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Custo Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Horas</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Custo/Hora</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Tarefas</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byDeveloper
                    .slice(0, paginationLimit === null ? undefined : paginationLimit)
                    .map((dev) => (
                    <tr key={dev.developer} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{dev.developer}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(dev.totalCost)}</td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{formatHours(dev.totalHours)}</td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{formatCurrency(dev.averageCostPerHour)}</td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{dev.taskCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

