import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, Building2, Bug, HelpCircle, Code, AlertTriangle, Filter, CheckSquare } from 'lucide-react';
import { CrossSprintAnalytics, TaskItem as TaskItemType } from '../types';
import { formatHours } from '../utils/calculations';
import { calculateProblemAnalysisByFeature } from '../services/analytics';

interface CrossSprintAnalysisProps {
  analytics: CrossSprintAnalytics;
  sprints: string[];
  tasks: TaskItemType[];
}

export const CrossSprintAnalysis: React.FC<CrossSprintAnalysisProps> = ({ analytics, sprints, tasks }) => {
  const [topFeatureLimit, setTopFeatureLimit] = useState<number | null>(10);
  const [topSprintLimit, setTopSprintLimit] = useState<number | null>(10);
  const [topDeveloperLimit, setTopDeveloperLimit] = useState<number | null>(10);
  const [topClientLimit, setTopClientLimit] = useState<number | null>(10);
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const [selectedSprints, setSelectedSprints] = useState<string[]>(sprints);
  const sprintSelectorRef = useRef<HTMLDivElement>(null);
  
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


      {/* Sprint Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Distribuição por Sprint</h3>
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
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    {formatHours(sprint.hours)}
                  </span>
                  <span className="text-xs text-gray-400">/</span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {formatHours(sprint.estimatedHours)}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-xs text-gray-500 dark:text-gray-400">gasto / estimado</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Allocation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Alocação por Desenvolvedor (Todos os Sprints)</h3>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="space-y-2">
          {filteredAnalytics.developerAllocation
            .sort((a, b) => b.totalHours - a.totalHours)
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
                      title={`${sprint.sprintName}: ${formatHours(sprint.hours)}`}
                    >
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[120px]">
                        {sprint.sprintName}
                      </span>
                      <span className="text-blue-700 dark:text-blue-400 font-semibold whitespace-nowrap">
                        {formatHours(sprint.hours)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs font-bold text-gray-900 dark:text-white bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-2.5 py-1.5 rounded-md whitespace-nowrap">
                    {formatHours(dev.totalHours)} total
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Client Allocation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Alocação por Cliente (Todos os Sprints)</h3>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="space-y-2">
          {filteredAnalytics.clientAllocation
            .sort((a, b) => b.totalHours - a.totalHours)
            .slice(0, topClientLimit ?? undefined)
            .map((client, index) => (
              <div 
                key={client.client} 
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              >
                <div className="flex-shrink-0 w-8 text-center">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                </div>
                <div className="flex-shrink-0 min-w-[180px]">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{client.client}</h4>
                </div>
                <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
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
                <div className="flex-shrink-0">
                  <span className="text-xs font-bold text-gray-900 dark:text-white bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-2.5 py-1.5 rounded-md whitespace-nowrap">
                    {formatHours(client.totalHours)} total
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Análise de Features */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <Code className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Análise de Features</h3>
          </div>
          <div className="flex items-center gap-2">
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
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Distribuição de tarefas, bugs e dúvidas ocultas por feature
        </p>
        <div className="space-y-2">
          {filteredAnalytics.byFeature.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma feature registrada.</p>
          ) : (
            filteredAnalytics.byFeature
              .slice(0, topFeatureLimit ?? undefined)
              .map((feature, index) => {
                return (
              <div 
                key={feature.label} 
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              >
                <div className="flex-shrink-0 w-8 text-center">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                </div>
                <div className="flex-shrink-0 min-w-[200px]">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{feature.label}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                      {feature.totalTasks} tarefa{feature.totalTasks !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                      {formatHours(feature.totalHours)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-400/20 dark:to-blue-500/20 border border-blue-200/50 dark:border-blue-700/50 rounded-md px-2 py-1.5">
                    <CheckSquare className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{feature.totalTarefas}</span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">
                      ({feature.totalTasks > 0 ? Math.round((feature.totalTarefas / feature.totalTasks) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gradient-to-br from-red-500/10 to-red-600/10 dark:from-red-400/20 dark:to-red-500/20 border border-red-200/50 dark:border-red-700/50 rounded-md px-2 py-1.5">
                    <Bug className="w-3 h-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">{feature.realBugs}</span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">
                      ({feature.totalTasks > 0 ? Math.round((feature.realBugs / feature.totalTasks) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 dark:from-yellow-400/20 dark:to-yellow-500/20 border border-yellow-200/50 dark:border-yellow-700/50 rounded-md px-2 py-1.5">
                    <HelpCircle className="w-3 h-3 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{feature.dubidasOcultas}</span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">
                      ({feature.totalTasks > 0 ? Math.round((feature.dubidasOcultas / feature.totalTasks) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                {feature.realBugs + feature.dubidasOcultas > 0 && (
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="font-medium whitespace-nowrap">
                        {feature.realBugs + feature.dubidasOcultas} problema{(feature.realBugs + feature.dubidasOcultas) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              );
              })
          )}
        </div>
      </div>

    </div>
  );
};

