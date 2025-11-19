import React, { useMemo, useState, useEffect } from 'react';
import { useSprintStore } from '../store/useSprintStore';
import { calculateBacklogFlowBySprint, calculateCapacityRecommendation } from '../services/analytics';
import { Inbox, CheckSquare, TrendingUp, BarChart3, Clock, X, List, Calendar, Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';
import { formatHours, isBacklogSprintValue, isCompletedStatus, isAuxilioTask, isNeutralTask, isImpedimentoTrabalhoTask } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TaskItem } from '../types';

type FilterType = 
  | { type: 'legacyInflow' }
  | { type: 'inflow'; sprintName: string }
  | { type: 'outflow'; sprintName: string }
  | { type: 'completedWithoutSprint' }
  | { type: 'avgInflow' }
  | { type: 'avgOutflow' }
  | { type: 'avgNetFlow' }
  | { type: 'avgExitRatio' }
  | { type: 'currentBacklog' }
  | { type: 'allocation'; subType: 'total' | 'current' | 'future' }
  | null;

interface BacklogFlowDashboardProps {
  // Optional anchors for presentation mode scrolling
  kpisRef?: React.RefObject<HTMLDivElement>;
  kpisHoursRef?: React.RefObject<HTMLDivElement>;
  chartRef?: React.RefObject<HTMLDivElement>;
  chartHoursRef?: React.RefObject<HTMLDivElement>;
  capacityRef?: React.RefObject<HTMLDivElement>;
  helpRef?: React.RefObject<HTMLDivElement>;
}

export const BacklogFlowDashboard: React.FC<BacklogFlowDashboardProps> = ({
  kpisRef,
  kpisHoursRef,
  chartRef,
  chartHoursRef,
  capacityRef,
  helpRef,
}) => {
  const tasks = useSprintStore((s) => s.tasks);
  const sprintMetadata = useSprintStore((s) => s.sprintMetadata);
  const worklogs = useSprintStore((s) => s.worklogs);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showCapacityHelp, setShowCapacityHelp] = useState(false);
  const [selectedDevs, setSelectedDevs] = useState<Set<string>>(new Set());
  const [showDevSelector, setShowDevSelector] = useState(false);
  const [selectedCapacityPercentile, setSelectedCapacityPercentile] = useState<'P50' | 'P80' | null>(null);

  // Get all unique developers who completed tasks in sprints
  const allDevs = useMemo(() => {
    const tasksWithSprint = tasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
    const completed = tasksWithSprint.filter(t => isCompletedStatus(t.status));
    const devs = new Set<string>(completed.map(t => t.responsavel).filter(Boolean));
    return Array.from(devs).sort();
  }, [tasks]);

  // Initialize selectedDevs with all devs on first load
  useEffect(() => {
    if (allDevs.length > 0 && selectedDevs.size === 0) {
      setSelectedDevs(new Set(allDevs));
    }
  }, [allDevs, selectedDevs.size]);

  const backlogFlow = useMemo(() => {
    if (!sprintMetadata || sprintMetadata.length === 0) return null;
    return calculateBacklogFlowBySprint(tasks, sprintMetadata, worklogs);
  }, [tasks, sprintMetadata, worklogs]);

  const capacityReco = useMemo(() => {
    if (!sprintMetadata || sprintMetadata.length === 0) return null;
    // If no devs selected, use all devs (null means all devs in the function)
    const selectedDevsSet = selectedDevs.size > 0 ? selectedDevs : null;
    return calculateCapacityRecommendation(tasks, sprintMetadata, selectedDevsSet);
  }, [tasks, sprintMetadata, selectedDevs]);

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

      {/* Help Section - Como usar essas métricas */}
      <div ref={helpRef} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-full flex items-center justify-between text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg p-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              Como essas métricas ajudam na tomada de decisão?
            </span>
          </div>
          {showHelp ? <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        </button>
        
        {showHelp && (
          <div className="mt-4 space-y-4 text-sm text-blue-900 dark:text-blue-100">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Inflow */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <Inbox className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold">Entrada no Backlog (méd.)</h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  Média de tarefas criadas por sprint (somente sprints concluídos ou em andamento).
                </p>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-green-700 dark:text-green-400">✓ Decisão: Planejamento de Capacidade</p>
                  <p className="text-gray-600 dark:text-gray-400">Se média = 30 tickets/sprint, você sabe que precisa de capacidade para processar ~30 novos tickets a cada sprint.</p>
                </div>
              </div>

              {/* Outflow */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold">Outflow (médio)</h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  Média de tarefas concluídas por sprint - sua capacidade real de entrega.
                </p>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-green-700 dark:text-green-400">✓ Decisão: Definir Expectativas</p>
                  <p className="text-gray-600 dark:text-gray-400">Se média = 25 tickets/sprint, você consegue entregar ~25 tickets por sprint. Use isso para compromissos com stakeholders.</p>
                </div>
              </div>

              {/* Net Flow */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold">Net Flow (médio)</h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  Saídas - Entradas. Indica se o backlog está crescendo ou diminuindo.
                </p>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-red-700 dark:text-red-400">⚠️ Negativo: Backlog crescendo</p>
                  <p className="text-gray-600 dark:text-gray-400">Se Net Flow = -5, você está recebendo 5 tickets a mais do que consegue processar por sprint. O backlog está aumentando!</p>
                  <p className="font-medium text-green-700 dark:text-green-400 mt-2">✓ Positivo: Backlog diminuindo</p>
                  <p className="text-gray-600 dark:text-gray-400">Se Net Flow = +3, você está processando 3 tickets a mais do que recebe. O backlog está diminuindo!</p>
                </div>
              </div>

              {/* Exit Ratio */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold">Exit Ratio (méd.)</h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  Outflow / Inflow. Mede o equilíbrio entre entrada e saída.
                </p>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-green-700 dark:text-green-400">✓ Exit Ratio ≥ 1.0: Estável</p>
                  <p className="text-gray-600 dark:text-gray-400">Processando pelo menos o que recebe. Backlog tende a estabilizar.</p>
                  <p className="font-medium text-red-700 dark:text-red-400 mt-2">⚠️ Exit Ratio &lt; 1.0: Instável</p>
                  <p className="text-gray-600 dark:text-gray-400">Processando menos do que recebe. Backlog cresce. Precisa aumentar capacidade ou reduzir entrada.</p>
                </div>
              </div>

              {/* Backlog Atual */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <Inbox className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <h4 className="font-semibold">Backlog Atual</h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  Tarefas pendentes (sem sprint + sprints futuros) ainda não alocadas.
                </p>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-blue-700 dark:text-blue-400">✓ Decisão: Priorização e Alocação</p>
                  <p className="text-gray-600 dark:text-gray-400">Se backlog = 178 tickets (880h), você sabe quanto trabalho está aguardando. Use para planejar próximos sprints e definir prioridades.</p>
                </div>
              </div>

              {/* Alocado em Sprints */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-semibold">Alocado em Sprints</h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                  Tarefas já alocadas ao sprint atual e futuros.
                </p>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-blue-700 dark:text-blue-400">✓ Decisão: Visibilidade de Capacidade</p>
                  <p className="text-gray-600 dark:text-gray-400">Se 117 tarefas já estão alocadas (54 no atual + 63 em futuros), você sabe quanta capacidade já foi "prometida". Compare com sua capacidade de entrega para ajustar planejamento.</p>
                </div>
              </div>
            </div>

            {/* Exemplo Prático */}
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 border border-blue-300 dark:border-blue-700">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Exemplo Prático de Decisão:</h4>
                  <div className="space-y-2 text-xs">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Cenário:</strong> Inflow médio = 27 tickets/sprint, Outflow médio = 25 tickets/sprint
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Análise:</strong> Net Flow = -2 (backlog cresce 2 tickets/sprint), Exit Ratio = 0.93 (&lt; 1.0)
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Decisão:</strong> Você precisa aumentar capacidade OU reduzir entrada. 
                      Recomendação de capacidade mostra quantos devs adicionais seriam necessários (baseado no throughput histórico).
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Ação:</strong> 
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>Se contratação não é opção: negociar redução de demanda com stakeholders</li>
                        <li>Se é opção: usar recomendação P50/P80 para estimar quantos devs contratar</li>
                        <li>Monitorar tendência: se Net Flow melhorar, você está no caminho certo</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div ref={kpisRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard
          icon={<Inbox className="w-5 h-5" />}
          label="Entrada no Backlog (méd.)"
          value={backlogFlow.averages.avgInflow.toFixed(1)}
          subtitle={`Bugs: ${backlogFlow.averages.avgInflowByType.bugs.toFixed(1)}, D. Oculta: ${backlogFlow.averages.avgInflowByType.duvidasOcultas.toFixed(1)}, Tarefas: ${backlogFlow.averages.avgInflowByType.tarefas.toFixed(1)}`}
          color="gray"
          onClick={() => setActiveFilter(activeFilter?.type === 'avgInflow' ? null : { type: 'avgInflow' })}
          isClickable={true}
          isActive={activeFilter?.type === 'avgInflow'}
        />
        <SummaryCard
          icon={<CheckSquare className="w-5 h-5" />}
          label="Outflow (médio)"
          value={backlogFlow.averages.avgOutflow.toFixed(1)}
          subtitle={`Bugs: ${backlogFlow.averages.avgOutflowByType.bugs.toFixed(1)}, D. Oculta: ${backlogFlow.averages.avgOutflowByType.duvidasOcultas.toFixed(1)}, Tarefas: ${backlogFlow.averages.avgOutflowByType.tarefas.toFixed(1)}`}
          color="green"
          onClick={() => setActiveFilter(activeFilter?.type === 'avgOutflow' ? null : { type: 'avgOutflow' })}
          isClickable={true}
          isActive={activeFilter?.type === 'avgOutflow'}
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Net Flow (médio)"
          value={backlogFlow.averages.avgNetFlow.toFixed(1)}
          subtitle="saídas − entradas"
          color="blue"
          onClick={() => setActiveFilter(activeFilter?.type === 'avgNetFlow' ? null : { type: 'avgNetFlow' })}
          isClickable={true}
          isActive={activeFilter?.type === 'avgNetFlow'}
        />
        <SummaryCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Exit Ratio (méd.)"
          value={Number.isFinite(backlogFlow.averages.avgExitRatio) ? backlogFlow.averages.avgExitRatio.toFixed(2) : '∞'}
          subtitle="outflow / inflow"
          color="purple"
          onClick={() => setActiveFilter(activeFilter?.type === 'avgExitRatio' ? null : { type: 'avgExitRatio' })}
          isClickable={true}
          isActive={activeFilter?.type === 'avgExitRatio'}
        />
        <SummaryCard
          icon={<Inbox className="w-5 h-5" />}
          label="Backlog Atual"
          value={backlogFlow.currentBacklog.tasks.toString()}
          subtitle={`${formatHours(backlogFlow.currentBacklog.estimatedHours)} estimadas`}
          color="yellow"
          onClick={() => setActiveFilter(activeFilter?.type === 'currentBacklog' ? null : { type: 'currentBacklog' })}
          isClickable={true}
          isActive={activeFilter?.type === 'currentBacklog'}
        />
        <SummaryCard
          icon={<Calendar className="w-5 h-5" />}
          label="Alocado em Sprints"
          value={backlogFlow.allocation.totalAllocated.tasks.toString()}
          subtitle={`${backlogFlow.allocation.currentSprint.tasks} atual + ${backlogFlow.allocation.futureSprints.tasks} futuros`}
          color="indigo"
          onClick={() => setActiveFilter(activeFilter?.type === 'allocation' && activeFilter.subType === 'total' ? null : { type: 'allocation', subType: 'total' })}
          isClickable={true}
          isActive={activeFilter?.type === 'allocation' && activeFilter.subType === 'total'}
        />
      </div>

      {/* KPIs - Hours */}
      <div ref={kpisHoursRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Clock className="w-5 h-5" />}
          label="Entrada no Backlog (méd.)"
          value={formatHours(backlogFlow.averages.avgInflowHours)}
          subtitle={`Bugs: ${formatHours(backlogFlow.averages.avgInflowByType.bugsHours)}, D. Oculta: ${formatHours(backlogFlow.averages.avgInflowByType.duvidasOcultasHours)}, Tarefas: ${formatHours(backlogFlow.averages.avgInflowByType.tarefasHours)}`}
          color="gray"
          onClick={() => setActiveFilter(activeFilter?.type === 'avgInflow' ? null : { type: 'avgInflow' })}
          isClickable={true}
          isActive={activeFilter?.type === 'avgInflow'}
        />
        <SummaryCard
          icon={<CheckSquare className="w-5 h-5" />}
          label="Outflow (médio)"
          value={formatHours(backlogFlow.averages.avgOutflowHours)}
          subtitle={`Bugs: ${formatHours(backlogFlow.averages.avgOutflowByType.bugsHours)}, D. Oculta: ${formatHours(backlogFlow.averages.avgOutflowByType.duvidasOcultasHours)}, Tarefas: ${formatHours(backlogFlow.averages.avgOutflowByType.tarefasHours)}`}
          color="green"
          onClick={() => setActiveFilter(activeFilter?.type === 'avgOutflow' ? null : { type: 'avgOutflow' })}
          isClickable={true}
          isActive={activeFilter?.type === 'avgOutflow'}
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Net Flow (médio)"
          value={formatHours(backlogFlow.averages.avgNetFlowHours)}
          subtitle="saídas − entradas (horas)"
          color="blue"
          onClick={() => setActiveFilter(activeFilter?.type === 'avgNetFlow' ? null : { type: 'avgNetFlow' })}
          isClickable={true}
          isActive={activeFilter?.type === 'avgNetFlow'}
        />
        <SummaryCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Exit Ratio (méd.)"
          value={Number.isFinite(backlogFlow.averages.avgExitRatioHours) ? backlogFlow.averages.avgExitRatioHours.toFixed(2) : '∞'}
          subtitle="outflow / inflow (horas)"
          color="purple"
          onClick={() => setActiveFilter(activeFilter?.type === 'avgExitRatio' ? null : { type: 'avgExitRatio' })}
          isClickable={true}
          isActive={activeFilter?.type === 'avgExitRatio'}
        />
      </div>

      {/* Chart */}
      {backlogFlow.series.length > 0 && (
        <div ref={chartRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Entradas vs Saídas por Período (análise completa)</h4>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  // Add "Anterior" column before sprints if legacy inflow exists
                  ...(backlogFlow.legacyInflow ? [{
                    sprint: 'Anterior',
                    'Entradas no Backlog': backlogFlow.legacyInflow.tasks,
                    'Entradas - Bugs': backlogFlow.legacyInflow.byType.bugs,
                    'Entradas - Dúvidas Ocultas': backlogFlow.legacyInflow.byType.duvidasOcultas,
                    'Entradas - Tarefas': backlogFlow.legacyInflow.byType.tarefas,
                    Saídas: null,
                    'Saídas - Bugs': null,
                    'Saídas - Dúvidas Ocultas': null,
                    'Saídas - Tarefas': null,
                    filterType: 'legacyInflow' as const,
                  }] : []),
                  // Sprint series
                  ...backlogFlow.series.map(s => ({
                    sprint: s.sprintName,
                    'Entradas no Backlog': s.inflow,
                    'Entradas - Bugs': s.inflowByType.bugs,
                    'Entradas - Dúvidas Ocultas': s.inflowByType.duvidasOcultas,
                    'Entradas - Tarefas': s.inflowByType.tarefas,
                    Saídas: s.outflow,
                    'Saídas - Bugs': s.outflowByType.bugs,
                    'Saídas - Dúvidas Ocultas': s.outflowByType.duvidasOcultas,
                    'Saídas - Tarefas': s.outflowByType.tarefas,
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
                    setActiveFilter({ type: 'inflow', sprintName: payload.sprintName });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="sprint" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    
                    // Calcular totais
                    const totalEntradas = (data['Entradas - Bugs'] || 0) + 
                                         (data['Entradas - Dúvidas Ocultas'] || 0) + 
                                         (data['Entradas - Tarefas'] || 0);
                    const totalSaidas = (data['Saídas - Bugs'] || 0) + 
                                       (data['Saídas - Dúvidas Ocultas'] || 0) + 
                                       (data['Saídas - Tarefas'] || 0);
                    
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                          {data.sprint}
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold text-gray-700 dark:text-gray-300">
                            Entradas: <span className="text-gray-900 dark:text-white">{totalEntradas}</span>
                          </div>
                          {data['Entradas - Bugs'] !== null && data['Entradas - Bugs'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Bugs: {data['Entradas - Bugs']}
                            </div>
                          )}
                          {data['Entradas - Dúvidas Ocultas'] !== null && data['Entradas - Dúvidas Ocultas'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Dúvidas Ocultas: {data['Entradas - Dúvidas Ocultas']}
                            </div>
                          )}
                          {data['Entradas - Tarefas'] !== null && data['Entradas - Tarefas'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Tarefas: {data['Entradas - Tarefas']}
                            </div>
                          )}
                          <div className="font-semibold text-gray-700 dark:text-gray-300 mt-2">
                            Saídas: <span className="text-gray-900 dark:text-white">{totalSaidas}</span>
                          </div>
                          {data['Saídas - Bugs'] !== null && data['Saídas - Bugs'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Bugs: {data['Saídas - Bugs']}
                            </div>
                          )}
                          {data['Saídas - Dúvidas Ocultas'] !== null && data['Saídas - Dúvidas Ocultas'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Dúvidas Ocultas: {data['Saídas - Dúvidas Ocultas']}
                            </div>
                          )}
                          {data['Saídas - Tarefas'] !== null && data['Saídas - Tarefas'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Tarefas: {data['Saídas - Tarefas']}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                {/* Entradas - apenas barra total */}
                <Bar dataKey="Entradas no Backlog" fill="#6b7280" radius={[4,4,0,0]} style={{ cursor: 'pointer' }} />
                {/* Saídas - apenas barra total */}
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

      {/* Chart - Hours */}
      {backlogFlow.series.length > 0 && (
        <div ref={chartHoursRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Entradas vs Saídas por Período (horas estimadas)</h4>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  // Add "Anterior" column before sprints if legacy inflow exists
                  ...(backlogFlow.legacyInflow ? [{
                    sprint: 'Anterior',
                    'Entradas no Backlog': backlogFlow.legacyInflow.estimatedHours,
                    'Entradas - Bugs': backlogFlow.legacyInflow.byType.bugsHours,
                    'Entradas - Dúvidas Ocultas': backlogFlow.legacyInflow.byType.duvidasOcultasHours,
                    'Entradas - Tarefas': backlogFlow.legacyInflow.byType.tarefasHours,
                    Saídas: null,
                    'Saídas - Bugs': null,
                    'Saídas - Dúvidas Ocultas': null,
                    'Saídas - Tarefas': null,
                    filterType: 'legacyInflow' as const,
                  }] : []),
                  // Sprint series
                  ...backlogFlow.series.map(s => ({
                    sprint: s.sprintName,
                    'Entradas no Backlog': s.inflowHours,
                    'Entradas - Bugs': s.inflowByType.bugsHours,
                    'Entradas - Dúvidas Ocultas': s.inflowByType.duvidasOcultasHours,
                    'Entradas - Tarefas': s.inflowByType.tarefasHours,
                    Saídas: s.outflowHours,
                    'Saídas - Bugs': s.outflowByType.bugsHours,
                    'Saídas - Dúvidas Ocultas': s.outflowByType.duvidasOcultasHours,
                    'Saídas - Tarefas': s.outflowByType.tarefasHours,
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
                    setActiveFilter({ type: 'inflow', sprintName: payload.sprintName });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="sprint" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(value) => formatHours(value)}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    
                    // Calcular totais
                    const totalEntradas = (data['Entradas - Bugs'] || 0) + 
                                         (data['Entradas - Dúvidas Ocultas'] || 0) + 
                                         (data['Entradas - Tarefas'] || 0);
                    const totalSaidas = (data['Saídas - Bugs'] || 0) + 
                                       (data['Saídas - Dúvidas Ocultas'] || 0) + 
                                       (data['Saídas - Tarefas'] || 0);
                    
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                          {data.sprint}
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold text-gray-700 dark:text-gray-300">
                            Entradas: <span className="text-gray-900 dark:text-white">{formatHours(totalEntradas)}</span>
                          </div>
                          {data['Entradas - Bugs'] !== null && data['Entradas - Bugs'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Bugs: {formatHours(data['Entradas - Bugs'])}
                            </div>
                          )}
                          {data['Entradas - Dúvidas Ocultas'] !== null && data['Entradas - Dúvidas Ocultas'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Dúvidas Ocultas: {formatHours(data['Entradas - Dúvidas Ocultas'])}
                            </div>
                          )}
                          {data['Entradas - Tarefas'] !== null && data['Entradas - Tarefas'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Tarefas: {formatHours(data['Entradas - Tarefas'])}
                            </div>
                          )}
                          <div className="font-semibold text-gray-700 dark:text-gray-300 mt-2">
                            Saídas: <span className="text-gray-900 dark:text-white">{formatHours(totalSaidas)}</span>
                          </div>
                          {data['Saídas - Bugs'] !== null && data['Saídas - Bugs'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Bugs: {formatHours(data['Saídas - Bugs'])}
                            </div>
                          )}
                          {data['Saídas - Dúvidas Ocultas'] !== null && data['Saídas - Dúvidas Ocultas'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Dúvidas Ocultas: {formatHours(data['Saídas - Dúvidas Ocultas'])}
                            </div>
                          )}
                          {data['Saídas - Tarefas'] !== null && data['Saídas - Tarefas'] !== undefined && (
                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                              • Tarefas: {formatHours(data['Saídas - Tarefas'])}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                {/* Entradas - apenas barra total */}
                <Bar dataKey="Entradas no Backlog" fill="#6b7280" radius={[4,4,0,0]} style={{ cursor: 'pointer' }} />
                {/* Saídas - apenas barra total */}
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
        <div ref={capacityRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recomendação de Capacidade</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDevSelector(!showDevSelector)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Selecionar desenvolvedores para análise"
              >
                {showDevSelector ? 'Ocultar' : 'Selecionar Devs'}
              </button>
              <button
                onClick={() => setShowCapacityHelp(!showCapacityHelp)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Como usar essas métricas"
              >
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          </div>
          
          {/* Developer Selector */}
          {showDevSelector && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selecionar desenvolvedores para análise de capacidade:
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDevs(new Set(allDevs))}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Selecionar todos
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => setSelectedDevs(new Set())}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Desmarcar todos
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {allDevs.map(dev => (
                    <label
                      key={dev}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDevs.has(dev)}
                        onChange={(e) => {
                          const newSet = new Set(selectedDevs);
                          if (e.target.checked) {
                            newSet.add(dev);
                          } else {
                            newSet.delete(dev);
                          }
                          setSelectedDevs(newSet);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{dev}</span>
                    </label>
                  ))}
                </div>
              </div>
              {selectedDevs.size === 0 ? (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-300">
                  ℹ️ Nenhum desenvolvedor selecionado. A análise considerará todos os {allDevs.length} desenvolvedores.
                </div>
              ) : (
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  {selectedDevs.size} de {allDevs.length} desenvolvedores selecionados
                </div>
              )}
            </div>
          )}
          
          {showCapacityHelp && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <h5 className="font-bold text-blue-900 dark:text-blue-100 mb-3">O que cada métrica significa:</h5>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">Capacidade Atual</p>
                      <p className="text-gray-600 dark:text-gray-400">Número de desenvolvedores selecionados para análise (ou média dos últimos sprints se nenhum foi selecionado).</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">Throughput (P50 e P80)</p>
                      <p className="text-gray-600 dark:text-gray-400">Quantos tickets cada desenvolvedor finaliza por sprint, em média. P50 = performance mediana (pior), P80 = performance melhor.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">Inflow Médio</p>
                      <p className="text-gray-600 dark:text-gray-400">Média de tarefas novas que chegam no backlog a cada sprint.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">Capacidade (P50 e P80)</p>
                      <p className="text-gray-600 dark:text-gray-400">Quantos desenvolvedores adicionais você precisa contratar. P50 assume performance pior (precisa de mais devs), P80 assume performance melhor (precisa de menos devs).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Informações da Capacidade Atual */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Capacidade Atual</p>
              </div>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                {capacityReco.avgCurrentDevs}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {selectedDevs.size > 0 
                  ? `desenvolvedores selecionados para análise`
                  : `desenvolvedores ativos (média dos últimos sprints)`}
              </p>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Throughput Atual</p>
              </div>
              <div className="flex items-baseline gap-3">
                <div>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {capacityReco.throughputPerDevP80.toFixed(1)}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">tickets/dev/sprint (P80)</p>
                </div>
                <div className="text-gray-400">|</div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {capacityReco.throughputPerDevP50.toFixed(1)}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">tickets/dev/sprint (P50)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Capacidade (P50)"
              value={`+${capacityReco.suggestedDevsP50}`}
              subtitle={`${capacityReco.totalDevsNeededP50} devs no total | ${capacityReco.throughputPerDevP50.toFixed(2)} tickets/dev/sprint`}
              color="green"
              onClick={() => setSelectedCapacityPercentile(selectedCapacityPercentile === 'P50' ? null : 'P50')}
              isClickable={true}
              isActive={selectedCapacityPercentile === 'P50'}
            />
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Capacidade (P80)"
              value={`+${capacityReco.suggestedDevsP80}`}
              subtitle={`${capacityReco.totalDevsNeededP80} devs no total | ${capacityReco.throughputPerDevP80.toFixed(2)} tickets/dev/sprint`}
              color="blue"
              onClick={() => setSelectedCapacityPercentile(selectedCapacityPercentile === 'P80' ? null : 'P80')}
              isClickable={true}
              isActive={selectedCapacityPercentile === 'P80'}
            />
            <SummaryCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Inflow Médio"
              value={capacityReco.avgInflow.toFixed(1)}
              subtitle="tickets/sprint (base p/ capacidade)"
              color="purple"
            />
          </div>
          
          {/* Detalhes por Sprint */}
          {selectedCapacityPercentile && capacityReco.sprintData.length > 0 && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  Detalhes por Sprint - {selectedCapacityPercentile}
                </h4>
                <button
                  onClick={() => setSelectedCapacityPercentile(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Fechar"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Média ({selectedCapacityPercentile}):</strong>{' '}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedCapacityPercentile === 'P50' 
                      ? capacityReco.throughputPerDevP50.toFixed(2) 
                      : capacityReco.throughputPerDevP80.toFixed(2)} tickets/dev/sprint
                  </span>
                </p>
                {(() => {
                  const percentileValue = selectedCapacityPercentile === 'P50' 
                    ? capacityReco.throughputPerDevP50 
                    : capacityReco.throughputPerDevP80;
                  const contributingSprints = capacityReco.sprintData.filter(
                    sprint => sprint.throughputPerDev <= percentileValue
                  );
                  return (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Calculado com base em {contributingSprints.length} sprint(s) que contribuíram para o {selectedCapacityPercentile}
                    </p>
                  );
                })()}
              </div>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {capacityReco.sprintData
                  .filter((sprint) => {
                    const percentileValue = selectedCapacityPercentile === 'P50' 
                      ? capacityReco.throughputPerDevP50 
                      : capacityReco.throughputPerDevP80;
                    return sprint.throughputPerDev <= percentileValue;
                  })
                  .sort((a, b) => {
                    // Sort by period (date inicio)
                    return a.dateInicio.getTime() - b.dateInicio.getTime();
                  })
                  .map((sprint) => (
                      <div
                        key={sprint.sprintName}
                        className="bg-green-50 dark:bg-green-900/10 rounded-lg border-2 border-green-300 dark:border-green-700 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {sprint.sprintName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {sprint.dateInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {' '}
                              {sprint.dateFim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {sprint.throughputPerDev.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              tickets/dev/sprint
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Tarefas concluídas:</span>{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">{sprint.completedTasks}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Desenvolvedores:</span>{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">{sprint.devCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task List for Audit */}
      {activeFilter && (() => {
        // Helper function to format period label
        const getPeriodLabel = (periodName: string): string => {
          const metadata = sprintMetadata.find(m => m.sprint === periodName);
          if (metadata) {
            const startStr = metadata.dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const endStr = metadata.dataFim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            return `${periodName} (${startStr} - ${endStr})`;
          }
          return periodName;
        };

        // Se o filtro é de um período (inflow ou outflow), mostrar opções para alternar
        const isPeriodFilter = activeFilter.type === 'inflow' || activeFilter.type === 'outflow';
        const periodName = isPeriodFilter ? activeFilter.sprintName : null;
        const periodItem = periodName ? backlogFlow.series.find(s => s.sprintName === periodName) : null;

        const filterLabel = 
          activeFilter.type === 'legacyInflow' && 'Anterior'
          || activeFilter.type === 'inflow' && `Entradas - ${getPeriodLabel(activeFilter.sprintName)}`
          || activeFilter.type === 'outflow' && `Saídas - ${getPeriodLabel(activeFilter.sprintName)}`
          || activeFilter.type === 'completedWithoutSprint' && 'Concluídas sem Sprint'
          || activeFilter.type === 'avgInflow' && `Entrada no Backlog (méd.) - Detalhes por Sprint`
          || activeFilter.type === 'avgOutflow' && `Outflow (médio) - Detalhes por Sprint`
          || activeFilter.type === 'avgNetFlow' && `Net Flow (médio) - Detalhes por Sprint`
          || activeFilter.type === 'avgExitRatio' && `Exit Ratio (méd.) - Detalhes por Sprint`
          || activeFilter.type === 'currentBacklog' && `Backlog Atual - Tarefas Pendentes`
          || activeFilter.type === 'allocation' && activeFilter.subType === 'total' && `Alocado em Sprints - Total`
          || activeFilter.type === 'allocation' && activeFilter.subType === 'current' && `Alocado em Sprints - Sprint Atual`
          || activeFilter.type === 'allocation' && activeFilter.subType === 'future' && `Alocado em Sprints - Sprints Futuros`
          || 'Detalhes';

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
          
          {/* Botões para alternar entre Entradas e Saídas quando um período está selecionado */}
          {isPeriodFilter && periodItem && (
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setActiveFilter({ type: 'inflow', sprintName: periodName! })}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter.type === 'inflow'
                    ? 'bg-gray-600 dark:bg-gray-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📥 Entradas ({periodItem.inflow})
              </button>
              <button
                onClick={() => setActiveFilter({ type: 'outflow', sprintName: periodName! })}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter.type === 'outflow'
                    ? 'bg-green-600 dark:bg-green-500 text-white'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40'
                }`}
              >
                📤 Saídas ({periodItem.outflow})
              </button>
            </div>
          )}

          {/* Botões para alternar entre Total/Atual/Futuros quando allocation está selecionado */}
          {activeFilter.type === 'allocation' && (
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setActiveFilter({ type: 'allocation', subType: 'total' })}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter.subType === 'total'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                    : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/40'
                }`}
              >
                Total ({backlogFlow.allocation.totalAllocated.tasks})
              </button>
              <button
                onClick={() => setActiveFilter({ type: 'allocation', subType: 'current' })}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter.subType === 'current'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                    : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/40'
                }`}
              >
                Sprint Atual ({backlogFlow.allocation.currentSprint.tasks})
              </button>
              <button
                onClick={() => setActiveFilter({ type: 'allocation', subType: 'future' })}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter.subType === 'future'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                    : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/40'
                }`}
              >
                Sprints Futuros ({backlogFlow.allocation.futureSprints.tasks})
              </button>
            </div>
          )}
          
          {/* Renderizar conteúdo baseado no tipo de filtro */}
          {activeFilter.type === 'avgInflow' || activeFilter.type === 'avgOutflow' || activeFilter.type === 'avgNetFlow' || activeFilter.type === 'avgExitRatio' ? (
            <AverageDetailsView filter={activeFilter} backlogFlow={backlogFlow} sprintMetadata={sprintMetadata} />
          ) : activeFilter.type === 'currentBacklog' || activeFilter.type === 'allocation' ? (
            <AllocationDetailsView filter={activeFilter} backlogFlow={backlogFlow} tasks={tasks} sprintMetadata={sprintMetadata} />
          ) : (
            <TaskFilterList filter={activeFilter} backlogFlow={backlogFlow} />
          )}
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
  color: 'gray' | 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'indigo';
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
    indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
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
      <p className="text-xs opacity-70 leading-relaxed">{subtitle}</p>
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
          
          {/* Período */}
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

// Component to show average details breakdown by sprint
interface AverageDetailsViewProps {
  filter: { type: 'avgInflow' | 'avgOutflow' | 'avgNetFlow' | 'avgExitRatio' };
  backlogFlow: ReturnType<typeof calculateBacklogFlowBySprint>;
  sprintMetadata: any[];
}

const AverageDetailsView: React.FC<AverageDetailsViewProps> = ({ filter, backlogFlow, sprintMetadata }) => {
  const getPeriodLabel = (periodName: string): string => {
    const metadata = sprintMetadata.find(m => m.sprint === periodName);
    if (metadata) {
      const startStr = metadata.dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const endStr = metadata.dataFim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${periodName} (${startStr} - ${endStr})`;
    }
    return periodName;
  };

  const getValueForSprint = (sprintItem: typeof backlogFlow.series[0]) => {
    switch (filter.type) {
      case 'avgInflow':
        return sprintItem.inflow;
      case 'avgOutflow':
        return sprintItem.outflow;
      case 'avgNetFlow':
        return sprintItem.netFlow;
      case 'avgExitRatio':
        return Number.isFinite(sprintItem.exitRatio) ? sprintItem.exitRatio : '∞';
      default:
        return 0;
    }
  };

  const getAverageValue = () => {
    switch (filter.type) {
      case 'avgInflow':
        return backlogFlow.averages.avgInflow;
      case 'avgOutflow':
        return backlogFlow.averages.avgOutflow;
      case 'avgNetFlow':
        return backlogFlow.averages.avgNetFlow;
      case 'avgExitRatio':
        return backlogFlow.averages.avgExitRatio;
      default:
        return 0;
    }
  };

  const getLabel = () => {
    switch (filter.type) {
      case 'avgInflow':
        return 'Inflow';
      case 'avgOutflow':
        return 'Outflow';
      case 'avgNetFlow':
        return 'Net Flow';
      case 'avgExitRatio':
        return 'Exit Ratio';
      default:
        return '';
    }
  };

  const avgValue = getAverageValue();
  const label = getLabel();

  // Filtrar apenas sprints COMPLETAMENTE FINALIZADOS (data de fim no passado)
  // Excluindo sprint atual para evitar distorções no início do sprint
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const validSprintsForAverage = backlogFlow.series.filter(sprintItem => {
    const sprintMeta = sprintMetadata.find(m => m.sprint === sprintItem.sprintName);
    if (!sprintMeta) return false;
    
    const sprintEnd = new Date(sprintMeta.dataFim);
    sprintEnd.setHours(23, 59, 59, 999);
    
    // Apenas sprints passados: data de fim já passou
    return sprintEnd.getTime() < now.getTime();
  });

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label} Médio:
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {typeof avgValue === 'number' && filter.type === 'avgExitRatio' 
              ? avgValue.toFixed(2) 
              : typeof avgValue === 'number' 
                ? avgValue.toFixed(1) 
                : avgValue}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Calculado com base em {validSprintsForAverage.length} sprint(s) concluído(s)
        </p>
        {backlogFlow.series.length > validSprintsForAverage.length && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            ⚠️ {backlogFlow.series.length - validSprintsForAverage.length} sprint(s) em andamento ou futuro não incluído(s) no cálculo
          </p>
        )}
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {validSprintsForAverage.map((sprintItem) => {
          const value = getValueForSprint(sprintItem);
          return (
            <div
              key={sprintItem.sprintName}
              className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {getPeriodLabel(sprintItem.sprintName)}
                  </p>
                  {filter.type === 'avgInflow' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {sprintItem.inflowTasks.length} tarefa(s) criada(s) no período
                    </p>
                  )}
                  {filter.type === 'avgOutflow' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {sprintItem.outflowTasks.length} tarefa(s) concluída(s) no período
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {typeof value === 'number' && filter.type === 'avgExitRatio'
                      ? value.toFixed(2)
                      : typeof value === 'number'
                        ? value.toFixed(1)
                        : value}
                  </p>
                  {filter.type === 'avgNetFlow' && (
                    <p className={`text-xs mt-1 ${
                      value > 0 ? 'text-green-600 dark:text-green-400' : value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {value > 0 ? 'Positivo' : value < 0 ? 'Negativo' : 'Neutro'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Component to show allocation details (backlog and allocated tasks)
interface AllocationDetailsViewProps {
  filter: { type: 'currentBacklog' | 'allocation'; subType?: 'total' | 'current' | 'future' };
  backlogFlow: ReturnType<typeof calculateBacklogFlowBySprint>;
  tasks: TaskItem[];
  sprintMetadata: any[];
}

const AllocationDetailsView: React.FC<AllocationDetailsViewProps> = ({ filter, backlogFlow, tasks, sprintMetadata }) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Excluir tarefas de auxílio, reunião, treinamento e impedimento de trabalho
  // Impedimento de trabalho: importado para contabilizar horas, mas não usado para análise de capacidade/performance
  const filteredTasks = tasks.filter(t => 
    !isAuxilioTask(t) && 
    !isNeutralTask(t) && 
    !isImpedimentoTrabalhoTask(t)
  );

  const getTasks = () => {
    if (filter.type === 'currentBacklog') {
      // Backlog atual: APENAS tarefas sem sprint (backlog tradicional)
      // Tarefas alocadas a sprints (atuais ou futuros) NÃO devem entrar no backlog atual
      // Excluir tarefas de auxílio, reunião e treinamento
      const backlogTasks = filteredTasks.filter(t => !t.sprint || t.sprint.trim() === '' || isBacklogSprintValue(t.sprint));
      const pendingBacklogTasks = backlogTasks.filter(t => !isCompletedStatus(t.status));
      
      return pendingBacklogTasks;
    } else if (filter.type === 'allocation') {
      // Excluir tarefas de auxílio, reunião e treinamento
      const tasksWithSprint = filteredTasks.filter(t => t.sprint && t.sprint.trim() !== '' && !isBacklogSprintValue(t.sprint));
      const pendingTasks = tasksWithSprint.filter(t => !isCompletedStatus(t.status));
      
      if (filter.subType === 'total') {
        return pendingTasks;
      } else if (filter.subType === 'current') {
        return pendingTasks.filter(t => {
          const sprintMeta = sprintMetadata.find(m => m.sprint === t.sprint);
          if (!sprintMeta) return false;
          const sprintStart = new Date(sprintMeta.dataInicio);
          sprintStart.setHours(0, 0, 0, 0);
          const sprintEnd = new Date(sprintMeta.dataFim);
          sprintEnd.setHours(23, 59, 59, 999);
          return now.getTime() >= sprintStart.getTime() && now.getTime() <= sprintEnd.getTime();
        });
      } else if (filter.subType === 'future') {
        return pendingTasks.filter(t => {
          const sprintMeta = sprintMetadata.find(m => m.sprint === t.sprint);
          if (!sprintMeta) return false;
          const sprintStart = new Date(sprintMeta.dataInicio);
          sprintStart.setHours(0, 0, 0, 0);
          return sprintStart.getTime() > now.getTime();
        });
      }
    }
    return [];
  };

  const resultTasks = getTasks();
  const sortedTasks = [...resultTasks].sort((a, b) => {
    const codeA = (a.chave || a.id || '').toUpperCase();
    const codeB = (b.chave || b.id || '').toUpperCase();
    return codeA.localeCompare(codeB);
  });

  if (sortedTasks.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
        Nenhuma tarefa encontrada.
      </p>
    );
  }

  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto">
      {sortedTasks.map((task) => (
        <div
          key={task.id || task.chave}
          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-4 text-sm"
        >
          <div className="flex-shrink-0 font-mono font-semibold text-gray-700 dark:text-gray-300 w-24">
            {task.chave || task.id || '-'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white truncate" title={task.resumo}>
              {task.resumo || '-'}
            </p>
          </div>
          <div className="flex-shrink-0 w-24">
            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
              {task.tipo || '-'}
            </span>
          </div>
          <div className="flex-shrink-0 w-32">
            {task.sprint ? (
              <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">
                {task.sprint}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-xs">Sem Sprint</span>
            )}
          </div>
          <div className="flex-shrink-0 w-32">
            {task.status ? (
              <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs">
                {task.status}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
            )}
          </div>
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


