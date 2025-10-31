import React, { useState, useRef, useEffect } from 'react';
import { Inbox, Calendar, Users, Building2, Bug, HelpCircle, Code, AlertTriangle, Filter, CheckSquare } from 'lucide-react';
import { CrossSprintAnalytics, TaskItem as TaskItemType } from '../types';
import { formatHours } from '../utils/calculations';
import { calculateProblemAnalysisByFeature, calculateProblemAnalysisByClient } from '../services/analytics';

interface CrossSprintAnalysisProps {
  analytics: CrossSprintAnalytics;
  sprints: string[];
  tasks: TaskItemType[];
}

export const CrossSprintAnalysis: React.FC<CrossSprintAnalysisProps> = ({ analytics, sprints, tasks }) => {
  const [topFeatureLimit, setTopFeatureLimit] = useState<number | null>(10);
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
      return {
        backlogTasks: 0,
        backlogHours: 0,
        sprintDistribution: [],
        developerAllocation: [],
        clientAllocation: [],
        byFeature: [],
        byClient: [],
      };
    }
    
    const filteredTasks = tasks.filter(t => selectedSprints.includes(t.sprint));
    // Backlog sempre mostra todas as tarefas sem sprint, independente do filtro
    const backlogTasks = tasks.filter((t) => !t.sprint || t.sprint.trim() === '');
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
    const clientSprintMap = new Map<string, Map<string, TaskItemType[]>>();
    for (const task of tasksWithSprint) {
      const clients = task.categorias.length > 0 ? task.categorias : ['(Sem Cliente)'];
      
      for (const client of clients) {
        if (!clientSprintMap.has(client)) {
          clientSprintMap.set(client, new Map());
        }
        const clientSprints = clientSprintMap.get(client)!;
        
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
            hours: tasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0),
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

    return {
      backlogTasks: backlogTasks.length,
      backlogHours: backlogTasks.reduce((sum, t) => sum + t.estimativa, 0),
      sprintDistribution,
      developerAllocation,
      clientAllocation,
      byFeature: calculateProblemAnalysisByFeature(tasksWithSprint),
      byClient: calculateProblemAnalysisByClient(tasksWithSprint),
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

      {/* Backlog */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
            <Inbox className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Backlog</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tarefas sem sprint definido</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Tarefas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAnalytics.backlogTasks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Horas Estimadas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatHours(filteredAnalytics.backlogHours)}
            </p>
          </div>
        </div>
      </div>

      {/* Sprint Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          Distribuição por Sprint
        </h3>
        <div className="space-y-3">
          {filteredAnalytics.sprintDistribution.map((sprint) => (
            <div
              key={sprint.sprintName}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-all duration-300"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{sprint.sprintName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sprint.tasks} tarefas</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {formatHours(sprint.hours)} / {formatHours(sprint.estimatedHours)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">gasto / estimado</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Allocation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <Users className="w-4 h-4 text-white" />
          </div>
          Alocação por Desenvolvedor (Todos os Sprints)
        </h3>
        <div className="space-y-4">
          {filteredAnalytics.developerAllocation
            .sort((a, b) => b.totalHours - a.totalHours)
            .map((dev) => (
              <div key={dev.name} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{dev.name}</h4>
                  <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                    {formatHours(dev.totalHours)} total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {dev.sprints.map((sprint) => (
                    <div
                      key={sprint.sprintName}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg px-3 py-2 flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{sprint.sprintName}</span>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        {formatHours(sprint.hours)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Client Allocation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          Alocação por Cliente (Todos os Sprints)
        </h3>
        <div className="space-y-4">
          {filteredAnalytics.clientAllocation
            .sort((a, b) => b.totalHours - a.totalHours)
            .map((client) => (
              <div key={client.client} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{client.client}</h4>
                  <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                    {formatHours(client.totalHours)} total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {client.sprints.map((sprint) => (
                    <div
                      key={sprint.sprintName}
                      className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg px-3 py-2 flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{sprint.sprintName}</span>
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
                        {formatHours(sprint.hours)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Análise de Problemas por Feature */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <Code className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Análise de Problemas por Feature</h3>
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
          Identificando features com mais bugs reais e dúvidas ocultas para priorizar melhorias
        </p>
        <div className="space-y-4">
          {filteredAnalytics.byFeature.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma feature com problemas registrada.</p>
          ) : (
            filteredAnalytics.byFeature
              .slice(0, topFeatureLimit ?? undefined)
              .map((feature) => (
              <div key={feature.label} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{feature.label}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {feature.totalTasks} tarefa{feature.totalTasks !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                      {formatHours(feature.totalHours)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarefas</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{feature.totalTarefas}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {feature.totalTasks > 0 ? Math.round((feature.totalTarefas / feature.totalTasks) * 100) : 0}% das tarefas
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Bug className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bugs Reais</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{feature.realBugs}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {feature.totalTasks > 0 ? Math.round((feature.realBugs / feature.totalTasks) * 100) : 0}% das tarefas
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dúvidas Ocultas</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{feature.dubidasOcultas}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {feature.totalTasks > 0 ? Math.round((feature.dubidasOcultas / feature.totalTasks) * 100) : 0}% das tarefas
                    </p>
                  </div>
                </div>
                {feature.realBugs + feature.dubidasOcultas > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-medium">
                      Total de {feature.realBugs + feature.dubidasOcultas} problema{(feature.realBugs + feature.dubidasOcultas) !== 1 ? 's' : ''} registrado{(feature.realBugs + feature.dubidasOcultas) !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Análise de Problemas por Cliente */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Análise de Problemas por Cliente</h3>
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
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Identificando clientes com mais bugs reais e dúvidas ocultas para priorizar melhorias
        </p>
        <div className="space-y-4">
          {filteredAnalytics.byClient.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum cliente com problemas registrado.</p>
          ) : (
            filteredAnalytics.byClient
              .slice(0, topClientLimit ?? undefined)
              .map((client) => (
              <div key={client.label} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{client.label}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {client.totalTasks} tarefa{client.totalTasks !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                      {formatHours(client.totalHours)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarefas</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{client.totalTarefas}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {client.totalTasks > 0 ? Math.round((client.totalTarefas / client.totalTasks) * 100) : 0}% das tarefas
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Bug className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bugs Reais</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{client.realBugs}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {client.totalTasks > 0 ? Math.round((client.realBugs / client.totalTasks) * 100) : 0}% das tarefas
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dúvidas Ocultas</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{client.dubidasOcultas}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {client.totalTasks > 0 ? Math.round((client.dubidasOcultas / client.totalTasks) * 100) : 0}% das tarefas
                    </p>
                  </div>
                </div>
                {client.realBugs + client.dubidasOcultas > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-pink-600 dark:text-pink-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-medium">
                      Total de {client.realBugs + client.dubidasOcultas} problema{(client.realBugs + client.dubidasOcultas) !== 1 ? 's' : ''} registrado{(client.realBugs + client.dubidasOcultas) !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

