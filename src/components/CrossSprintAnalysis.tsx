import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, Building2, Bug, HelpCircle, Code, AlertTriangle, Filter, CheckSquare, Clock, Award, FileSpreadsheet, BarChart2, List } from 'lucide-react';
import { CrossSprintAnalytics, TaskItem as TaskItemType } from '../types';
import { formatHours, normalizeForComparison } from '../utils/calculations';
import { calculateProblemAnalysisByFeature } from '../services/analytics';
import { useSprintStore } from '../store/useSprintStore';
import { AnalyticsChart } from './AnalyticsCharts';

interface CrossSprintAnalysisProps {
  analytics: CrossSprintAnalytics;
  sprints: string[];
  tasks: TaskItemType[];
  // Optional anchors for presentation mode scrolling
  sprintDistributionRef?: React.RefObject<HTMLDivElement>;
  developerAllocationRef?: React.RefObject<HTMLDivElement>;
  clientAllocationRef?: React.RefObject<HTMLDivElement>;
  featureAnalysisRef?: React.RefObject<HTMLDivElement>;
  managementKpisRef?: React.RefObject<HTMLDivElement>;
}

export const CrossSprintAnalysis: React.FC<CrossSprintAnalysisProps> = ({ analytics, sprints, tasks, sprintDistributionRef, developerAllocationRef, clientAllocationRef, featureAnalysisRef, managementKpisRef }) => {
  const [topFeatureLimit, setTopFeatureLimit] = useState<number | null>(20);
  const [topSprintLimit, setTopSprintLimit] = useState<number | null>(20);
  const [topDeveloperLimit, setTopDeveloperLimit] = useState<number | null>(20);
  const [topClientLimit, setTopClientLimit] = useState<number | null>(20);
  const [developerViewMode, setDeveloperViewMode] = useState<'chart' | 'list'>('chart');
  const [clientViewMode, setClientViewMode] = useState<'chart' | 'list'>('chart');
  const [featureViewMode, setFeatureViewMode] = useState<'chart' | 'list'>('chart');
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const [selectedSprints, setSelectedSprints] = useState<string[]>(sprints);
  const sprintSelectorRef = useRef<HTMLDivElement>(null);
  const worklogs = useSprintStore((s) => s.worklogs);
  const getSprintPeriod = useSprintStore((s) => s.getSprintPeriod);
  const setSelectedDeveloper = useSprintStore((s) => s.setSelectedDeveloper);
  const setAnalyticsFilter = useSprintStore((s) => s.setAnalyticsFilter);
  
  const TOP_OPTIONS = [10, 20, 40, null]; // null = todos
  
  // Close sprint selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sprintSelectorRef.current && !sprintSelectorRef.current.contains(event.target as Node)) {
        setShowSprintSelector(false);
      }
    };

    if (showSprintSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSprintSelector]);

  // Reset selected sprints when sprints list changes
  useEffect(() => {
    if (selectedSprints.length === 0 && sprints.length > 0) {
      setSelectedSprints([...sprints]);
    }
  }, [sprints.length]); // Only depend on sprints.length to avoid loops

  // Management KPIs (per sprint and totals) for selected sprints
  const managementKPIs = React.useMemo(() => {
    // Precompute training task IDs (id or key) from all tasks, not only by t.sprint
    const treinamentoKeywords = ['treinamento', 'treinamentos'];
    const trainingTaskIds = new Set<string>();
    tasks.forEach(t => {
      const isTraining = t.detalhesOcultos && t.detalhesOcultos.some(d => treinamentoKeywords.includes(normalizeForComparison(d)));
      if (isTraining) {
        if (t.id) trainingTaskIds.add(t.id);
        if (t.chave) trainingTaskIds.add(t.chave);
      }
    });

    const perSprint = selectedSprints.map((sprintName) => {
      const sprintTasks = tasks.filter(t => t.sprint === sprintName);

      const hasDetalhe = (t: TaskItemType, keywords: string[]) => {
        if (!t.detalhesOcultos || t.detalhesOcultos.length === 0) return false;
        return t.detalhesOcultos.some(d => keywords.includes(normalizeForComparison(d)));
      };

      const auxilioKeywords = ['auxilio'];
      const reuniaoKeywords = ['reuniao', 'reunioes'];
      const overtimeKeywords = ['horaextra', 'hora extra', 'horas extras', 'horasextras'];
      const duvidaOcultaKeywords = ['duvidaoculta', 'duvida oculta'];
      const isFolhaTask = (t: TaskItemType) => t.modulo === 'DSFolha' || (t.feature || []).includes('DSFolha');

      // Sum training hours from worklogs based on sprint period, regardless of task.sprint
      let trainingHours = 0;
      const period = getSprintPeriod ? getSprintPeriod(sprintName) : null;
      if (period) {
        const start = period.startDate.getTime();
        const end = period.endDate.getTime();
        trainingHours = worklogs.reduce((sum, w) => {
          if (!trainingTaskIds.has(w.taskId)) return sum;
          const ts = w.data instanceof Date ? w.data.getTime() : new Date(w.data).getTime();
          if (ts >= start && ts <= end) {
            return sum + (w.tempoGasto || 0);
          }
          return sum;
        }, 0);
      }
      const auxilioHours = sprintTasks.reduce((sum, t) => sum + (hasDetalhe(t, auxilioKeywords) ? (t.tempoGastoNoSprint ?? 0) : 0), 0);
      const reuniaoHours = sprintTasks.reduce((sum, t) => sum + (hasDetalhe(t, reuniaoKeywords) ? (t.tempoGastoNoSprint ?? 0) : 0), 0);
      const overtimeHours = sprintTasks.reduce((sum, t) => sum + (hasDetalhe(t, overtimeKeywords) ? (t.tempoGastoNoSprint ?? 0) : 0), 0);
      const nonBugCount = sprintTasks.filter(t => t.tipo !== 'Bug' && !isFolhaTask(t)).length;
      const realBugsCount = sprintTasks.filter(t => t.tipo === 'Bug' && !hasDetalhe(t, duvidaOcultaKeywords) && !isFolhaTask(t)).length;
      const duvidasOcultasCount = sprintTasks.filter(t => t.tipo === 'Bug' && hasDetalhe(t, duvidaOcultaKeywords) && !isFolhaTask(t)).length;

      return {
        sprintName,
        trainingHours,
        auxilioHours,
        reuniaoHours,
        overtimeHours,
        nonBugCount,
        realBugsCount,
        duvidasOcultasCount,
      };
    });

    const totals = perSprint.reduce(
      (acc, s) => ({
        trainingHours: acc.trainingHours + s.trainingHours,
        auxilioHours: acc.auxilioHours + s.auxilioHours,
        reuniaoHours: acc.reuniaoHours + s.reuniaoHours,
        overtimeHours: acc.overtimeHours + s.overtimeHours,
        nonBugCount: acc.nonBugCount + s.nonBugCount,
        realBugsCount: acc.realBugsCount + s.realBugsCount,
        duvidasOcultasCount: acc.duvidasOcultasCount + s.duvidasOcultasCount,
      }),
      { trainingHours: 0, auxilioHours: 0, reuniaoHours: 0, overtimeHours: 0, nonBugCount: 0, realBugsCount: 0, duvidasOcultasCount: 0 }
    );

    return { perSprint, totals };
  }, [tasks, selectedSprints]);

  // Filter analytics based on selected sprints
  const filteredAnalytics = React.useMemo(() => {
    if (selectedSprints.length === 0) {
      // Quando não há sprints selecionados
      return {
        backlogTasks: 0,
        backlogHours: 0,
        backlogByFeature: [],
        backlogByClient: [],
        sprintDistribution: [],
        developerAllocation: [],
        clientAllocation: [],
        byFeature: [],
      };
    }
    
    const filteredTasks = tasks.filter(t => selectedSprints.includes(t.sprint));
    // IMPORTANT: Backlog foi removido desta análise - agora está em aba separada (Backlog)
    const tasksWithSprint = filteredTasks.filter((t) => t.sprint && t.sprint.trim() !== '');

    // Sprint distribution - apenas sprints selecionados
    const sprintMap = new Map<string, TaskItemType[]>();
    for (const task of tasksWithSprint) {
      if (!sprintMap.has(task.sprint)) {
        sprintMap.set(task.sprint, []);
      }
      sprintMap.get(task.sprint)!.push(task);
    }

    const sprintDistribution = Array.from(sprintMap.entries()).map(
      ([sprintName, sprintTasks]) => ({
        sprintName,
        tasks: sprintTasks.length,
        hours: sprintTasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0),
        estimatedHours: sprintTasks.reduce((sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 0),
      })
    );

    // Developer allocation - apenas sprints selecionados
    const devSprintMap = new Map<string, Map<string, TaskItemType[]>>();
    for (const task of tasksWithSprint) {
      if (!task.responsavel) continue;
      
      if (!devSprintMap.has(task.responsavel)) {
        devSprintMap.set(task.responsavel, new Map());
      }
      const devSprints = devSprintMap.get(task.responsavel)!;
      
      if (!devSprints.has(task.sprint)) {
        devSprints.set(task.sprint, []);
      }
      devSprints.get(task.sprint)!.push(task);
    }

    const developerAllocation = Array.from(devSprintMap.entries()).map(
      ([name, sprints]) => {
        const sprintsData = Array.from(sprints.entries()).map(
          ([sprintName, tasks]) => ({
            sprintName,
            // When showing allocation per sprint, use tempoGastoNoSprint (hours in that specific sprint)
            // Each sprint is analyzed separately, so we need sprint-specific hours
            hours: tasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0),
            estimatedHours: tasks.reduce((sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 0),
          })
        );

        return {
          name,
          sprints: sprintsData,
          totalHours: sprintsData.reduce((sum, s) => sum + s.hours, 0),
          totalEstimatedHours: sprintsData.reduce((sum, s) => sum + s.estimatedHours, 0),
        };
      }
    );

    // Client allocation - apenas sprints selecionados
    // Como categorias é um array, cada categoria deve criar uma entrada separada
    const clientSprintMap = new Map<string, Map<string, TaskItemType[]>>();
    for (const task of tasksWithSprint) {
      // Filtrar categorias vazias e criar entrada para cada categoria válida
      const validClients = task.categorias.filter(c => c && c.trim() !== '');
      const clients = validClients.length > 0 ? validClients : ['(Sem Cliente)'];
      
      for (const client of clients) {
        const key = client.trim();
        if (!clientSprintMap.has(key)) {
          clientSprintMap.set(key, new Map());
        }
        const clientSprints = clientSprintMap.get(key)!;
        
        if (!clientSprints.has(task.sprint)) {
          clientSprints.set(task.sprint, []);
        }
        clientSprints.get(task.sprint)!.push(task);
      }
    }

    const clientAllocation = Array.from(clientSprintMap.entries()).map(
      ([client, sprints]) => {
        const sprintsData = Array.from(sprints.entries()).map(
          ([sprintName, tasks]) => ({
            sprintName,
            // Alocação por cliente usa horas estimadas (tempo alocado) ao invés de tempo gasto
            hours: tasks.reduce((sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 0),
            estimatedHours: tasks.reduce((sum, t) => sum + (t.estimativaRestante ?? t.estimativa), 0),
          })
        );

        return {
          client,
          sprints: sprintsData,
          totalHours: sprintsData.reduce((sum, s) => sum + s.hours, 0),
        };
      }
    );

    // IMPORTANT: Backlog foi removido desta análise - agora está em aba separada (Backlog)
    // Campos mantidos apenas para compatibilidade com tipo CrossSprintAnalytics
    return {
      backlogTasks: 0,
      backlogHours: 0,
      backlogByFeature: [],
      backlogByClient: [],
      sprintDistribution,
      developerAllocation,
      clientAllocation,
      byFeature: calculateProblemAnalysisByFeature(tasksWithSprint),
    };
  }, [analytics, tasks, selectedSprints]);

  // Build chart data (Totalizer[]) across selected sprints for each section
  const selectedSprintTasks = React.useMemo(() => {
    if (selectedSprints.length === 0) return [];
    return tasks.filter(t => selectedSprints.includes(t.sprint));
  }, [tasks, selectedSprints]);

  const developerTotalizers = React.useMemo(() => {
    const map = new Map<string, { count: number; hours: number; estimatedHours: number }>();
    for (const t of selectedSprintTasks) {
      if (!t.responsavel) continue;
      const key = t.responsavel;
      if (!map.has(key)) map.set(key, { count: 0, hours: 0, estimatedHours: 0 });
      const agg = map.get(key)!;
      agg.count += 1;
      agg.hours += t.tempoGastoNoSprint ?? 0;
      agg.estimatedHours += (t.estimativaRestante ?? t.estimativa) ?? 0;
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, count: v.count, hours: v.hours, estimatedHours: v.estimatedHours }))
      .sort((a, b) => b.estimatedHours - a.estimatedHours);
  }, [selectedSprintTasks]);

  const clientTotalizers = React.useMemo(() => {
    const map = new Map<string, { count: number; hours: number; estimatedHours: number }>();
    for (const t of selectedSprintTasks) {
      const validClients = (t.categorias || []).filter(c => c && c.trim() !== '');
      const clients = validClients.length > 0 ? validClients : ['(Sem Cliente)'];
      for (const c of clients) {
        const key = c.trim();
        if (!map.has(key)) map.set(key, { count: 0, hours: 0, estimatedHours: 0 });
        const agg = map.get(key)!;
        agg.count += 1;
        agg.hours += t.tempoGastoNoSprint ?? 0;
        agg.estimatedHours += (t.estimativaRestante ?? t.estimativa) ?? 0;
      }
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, count: v.count, hours: v.hours, estimatedHours: v.estimatedHours }))
      .sort((a, b) => b.estimatedHours - a.estimatedHours);
  }, [selectedSprintTasks]);

  const featureTotalizers = React.useMemo(() => {
    const map = new Map<string, { count: number; hours: number; estimatedHours: number }>();
    for (const t of selectedSprintTasks) {
      const validFeatures = (t.feature || []).filter(f => f && f.trim() !== '');
      const features = validFeatures.length > 0 ? validFeatures : ['(Sem Feature)'];
      for (const f of features) {
        const key = f.trim();
        if (!map.has(key)) map.set(key, { count: 0, hours: 0, estimatedHours: 0 });
        const agg = map.get(key)!;
        agg.count += 1;
        agg.hours += t.tempoGastoNoSprint ?? 0;
        agg.estimatedHours += (t.estimativaRestante ?? t.estimativa) ?? 0;
      }
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, count: v.count, hours: v.hours, estimatedHours: v.estimatedHours }))
      .sort((a, b) => b.estimatedHours - a.estimatedHours);
  }, [selectedSprintTasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          Análise Multi-Sprint
        </h2>
        
        {/* Sprint Selector */}
        <div className="relative" ref={sprintSelectorRef}>
          <button
            onClick={() => setShowSprintSelector(!showSprintSelector)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {selectedSprints.length === 0
              ? 'Selecionar Sprints'
              : selectedSprints.length === sprints.length
              ? 'Todos os Sprints'
              : `${selectedSprints.length} sprint${selectedSprints.length !== 1 ? 's' : ''} selecionado${selectedSprints.length !== 1 ? 's' : ''}`}
          </button>
          
          {showSprintSelector && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[250px] max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSprints([...sprints])}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    Selecionar Todos
                  </button>
                  <button
                    onClick={() => setSelectedSprints([])}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div className="p-2">
                {sprints.map((sprint) => (
                  <label
                    key={sprint}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSprints.includes(sprint)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSprints([...selectedSprints, sprint]);
                        } else {
                          setSelectedSprints(selectedSprints.filter(s => s !== sprint));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{sprint}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPIs de Gestão */}
      <div ref={managementKpisRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
              <Award className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Multi Sprint • KPIs de Gestão (Sprints Selecionados)</h3>
          </div>
        </div>

        {selectedSprints.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Selecione pelo menos um sprint para visualizar os KPIs.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Treinamentos (horas) */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                    <Award className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Treinamentos</span>
                </div>
                <span className="text-lg font-extrabold text-gray-900 dark:text-white">{formatHours(managementKPIs.totals.trainingHours)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {managementKPIs.perSprint.map(s => (
                  <span key={s.sprintName} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    {s.sprintName}: <strong>{formatHours(s.trainingHours)}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Auxílios (horas) */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                    <Users className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Auxílios</span>
                </div>
                <span className="text-lg font-extrabold text-gray-900 dark:text-white">{formatHours(managementKPIs.totals.auxilioHours)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {managementKPIs.perSprint.map(s => (
                  <span key={s.sprintName} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                    {s.sprintName}: <strong>{formatHours(s.auxilioHours)}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Reuniões (horas) */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
                    <Calendar className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reuniões</span>
                </div>
                <span className="text-lg font-extrabold text-gray-900 dark:text-white">{formatHours(managementKPIs.totals.reuniaoHours)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {managementKPIs.perSprint.map(s => (
                  <span key={s.sprintName} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    {s.sprintName}: <strong>{formatHours(s.reuniaoHours)}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Horas Extras (horas) */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
                    <Clock className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Horas Extras</span>
                </div>
                <span className="text-lg font-extrabold text-gray-900 dark:text-white">{formatHours(managementKPIs.totals.overtimeHours)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {managementKPIs.perSprint.map(s => (
                  <span key={s.sprintName} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border border-yellow-200/60 dark:border-yellow-800/60">
                    {s.sprintName}: <strong>{formatHours(s.overtimeHours)}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Tarefas (não-bug) - quantidade */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-sky-100 dark:bg-sky-900/30">
                    <CheckSquare className="w-4 h-4 text-sky-700 dark:text-sky-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tarefas (não‑bug)</span>
                </div>
                <span className="text-xl font-extrabold text-gray-900 dark:text-white">{managementKPIs.totals.nonBugCount}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {managementKPIs.perSprint.map(s => (
                  <span key={s.sprintName} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-sky-50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                    {s.sprintName}: <strong>{s.nonBugCount}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Bugs (reais e dúvidas ocultas) - quantidade */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-rose-100 dark:bg-rose-900/30">
                    <Bug className="w-4 h-4 text-rose-700 dark:text-rose-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bugs</span>
                </div>
                <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {managementKPIs.totals.realBugsCount + managementKPIs.totals.duvidasOcultasCount}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-rose-700 dark:text-rose-300">
                    <Bug className="w-3 h-3" /> Bugs Reais
                  </span>
                  <span className="font-semibold">{managementKPIs.totals.realBugsCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                    <HelpCircle className="w-3 h-3" /> Dúvidas Ocultas
                  </span>
                  <span className="font-semibold">{managementKPIs.totals.duvidasOcultasCount}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {managementKPIs.perSprint.map(s => (
                  <span key={s.sprintName} className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                    <span className="truncate max-w-[120px]">{s.sprintName}</span>
                    <span className="inline-flex items-center gap-1">
                      <Bug className="w-3 h-3" /> <strong>{s.realBugsCount}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> <strong>{s.duvidasOcultasCount}</strong>
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* (Removido) Card de Folha no multi-sprint a pedido do usuário */}
          </div>
        )}
      </div>


      {/* Sprint Distribution */}
      <div ref={sprintDistributionRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Multi Sprint • Distribuição por Sprint</h3>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={topSprintLimit === null ? 'all' : topSprintLimit.toString()}
              onChange={(e) => setTopSprintLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
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
          {filteredAnalytics.sprintDistribution
            .sort((a, b) => b.tasks - a.tasks)
            .slice(0, topSprintLimit ?? undefined)
            .map((sprint, index) => (
            <div
              key={sprint.sprintName}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
            >
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
              </div>
              <div className="flex-shrink-0 min-w-[200px]">
                <p className="font-medium text-gray-900 dark:text-white text-sm">{sprint.sprintName}</p>
              </div>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {sprint.tasks} tarefa{sprint.tasks !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {formatHours(sprint.estimatedHours)}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-xs text-gray-500 dark:text-gray-400">horas estimadas</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Allocation */}
      <div ref={developerAllocationRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Multi Sprint • Alocação por Desenvolvedor (Horas Estimadas)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDeveloperViewMode('chart')} className={`p-1.5 rounded-md ${developerViewMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Gráfico">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button onClick={() => setDeveloperViewMode('list')} className={`p-1.5 rounded-md ${developerViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Lista">
              <List className="w-4 h-4" />
            </button>
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={topDeveloperLimit === null ? 'all' : topDeveloperLimit.toString()}
              onChange={(e) => setTopDeveloperLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
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
        {developerViewMode === 'chart' ? (
          <AnalyticsChart
            data={developerTotalizers.slice(0, topDeveloperLimit ?? undefined)}
            title=""
            onBarClick={(value) => setSelectedDeveloper(value)}
          />
        ) : (
          <div className="space-y-2">
            {filteredAnalytics.developerAllocation
              .sort((a, b) => b.totalEstimatedHours - a.totalEstimatedHours)
              .slice(0, topDeveloperLimit ?? undefined)
              .map((dev, index) => (
                <div 
                  key={dev.name} 
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex-shrink-0 min-w-[180px]">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{dev.name}</h4>
                  </div>
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
                    {dev.sprints.map((sprint) => (
                      <div
                        key={sprint.sprintName}
                        className="inline-flex items-center gap-1.5 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-400/20 dark:to-blue-500/20 border border-blue-200/50 dark:border-blue-700/50 rounded-md px-2 py-1 text-xs"
                        title={`${sprint.sprintName}: ${formatHours(sprint.estimatedHours)}`}
                      >
                        <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[120px]">
                          {sprint.sprintName}
                        </span>
                        <span className="text-blue-700 dark:text-blue-400 font-semibold whitespace-nowrap">
                          {formatHours(sprint.estimatedHours)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-bold text-gray-900 dark:text-white bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-2.5 py-1.5 rounded-md whitespace-nowrap">
                      {formatHours(dev.totalEstimatedHours)} total
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Client Allocation */}
      <div ref={clientAllocationRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Multi Sprint • Alocação por Cliente (Horas Estimadas)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setClientViewMode('chart')} className={`p-1.5 rounded-md ${clientViewMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Gráfico">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button onClick={() => setClientViewMode('list')} className={`p-1.5 rounded-md ${clientViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Lista">
              <List className="w-4 h-4" />
            </button>
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={topClientLimit === null ? 'all' : topClientLimit.toString()}
              onChange={(e) => setTopClientLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
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
        {clientViewMode === 'chart' ? (
          <AnalyticsChart
            data={clientTotalizers.slice(0, topClientLimit ?? undefined)}
            title=""
            onBarClick={(value) => setAnalyticsFilter({ type: 'client', value })}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAnalytics.clientAllocation
              .sort((a, b) => b.totalHours - a.totalHours)
              .slice(0, topClientLimit ?? undefined)
              .map((client) => (
                <div key={client.client} className="bg-white dark:bg-gray-800/50 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-lg hover:border-green-500/50 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-md truncate">{client.client}</h4>
                    <div className="mt-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-2.5 py-1.5 rounded-md whitespace-nowrap">
                        {formatHours(client.totalHours)} total
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Distribuição por Sprint:</p>
                    <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                      {client.sprints.map((sprint) => (
                        <div
                          key={sprint.sprintName}
                          className="inline-flex items-center gap-1.5 bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-400/20 dark:to-green-500/20 border border-green-200/50 dark:border-green-700/50 rounded-md px-2 py-1 text-xs"
                          title={`${sprint.sprintName}: ${formatHours(sprint.hours)}`}
                        >
                          <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[120px]">
                            {sprint.sprintName}
                          </span>
                          <span className="text-green-700 dark:text-green-400 font-semibold whitespace-nowrap">
                            {formatHours(sprint.hours)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Análise de Features */}
      <div ref={featureAnalysisRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <Code className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Multi Sprint • Análise de Features (Horas Gastas)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFeatureViewMode('chart')} className={`p-1.5 rounded-md ${featureViewMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Gráfico">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button onClick={() => setFeatureViewMode('list')} className={`p-1.5 rounded-md ${featureViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`} title="Lista">
              <List className="w-4 h-4" />
            </button>
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={topFeatureLimit === null ? 'all' : topFeatureLimit.toString()}
              onChange={(e) => setTopFeatureLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
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
        {featureViewMode === 'chart' ? (
          <AnalyticsChart
            data={featureTotalizers.slice(0, topFeatureLimit ?? undefined)}
            title=""
            onBarClick={(value) => setAnalyticsFilter({ type: 'feature', value })}
          />
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Distribuição de tarefas, bugs e dúvidas ocultas por feature
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAnalytics.byFeature.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 col-span-full">Nenhuma feature registrada.</p>
              ) : (
                filteredAnalytics.byFeature
                  .sort((a, b) => b.totalHours - a.totalHours)
                  .slice(0, topFeatureLimit ?? undefined)
                  .map((feature) => (
                    <div key={feature.label} className="bg-white dark:bg-gray-800/50 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-lg hover:border-indigo-500/50 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-md truncate">{feature.label}</h4>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/80 px-2 py-1 rounded-full">
                            <CheckSquare className="w-3 h-3" />
                            {feature.totalTasks} tarefa{feature.totalTasks !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/80 px-2 py-1 rounded-full">
                            <Calendar className="w-3 h-3" />
                            {formatHours(feature.totalHours)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                            Tarefas
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {feature.totalTarefas} ({feature.totalTasks > 0 ? Math.round((feature.totalTarefas / feature.totalTasks) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Bug className="w-4 h-4 text-red-500" />
                            Bugs
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {feature.realBugs} ({feature.totalTasks > 0 ? Math.round((feature.realBugs / feature.totalTasks) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <HelpCircle className="w-4 h-4 text-yellow-500" />
                            Dúvidas Ocultas
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {feature.dubidasOcultas} ({feature.totalTasks > 0 ? Math.round((feature.dubidasOcultas / feature.totalTasks) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

