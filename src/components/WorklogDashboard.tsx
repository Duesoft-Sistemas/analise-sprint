import React, { useMemo, useState, useEffect } from 'react';
import { Clock, TrendingUp, Calendar, Users, Activity, FileText } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { SprintSelector } from './SprintSelector';
import { formatHours, getLocalDateKey, parseDate } from '../utils/calculations';
import { WorklogEntry } from '../types';
import { isDateInSprint } from '../services/hybridCalculations';
import { getDefaultSelectedDevelopers } from '../services/configService';
import { WorklogDescriptionsModal } from './WorklogDescriptionsModal';

interface WorklogStats {
  totalHours: number;
  totalEntries: number;
  averageHoursPerDay: number;
  daysWithWork: number;
  maxDailyHours: number;
  minDailyHours: number;
}

interface DeveloperWorklogStats extends WorklogStats {
  developerName: string;
  worklogs: WorklogEntry[];
  dailyBreakdown: Array<{ date: Date; hours: number; entries: number }>;
}

interface DailyWorklogData {
  date: Date;
  totalHours: number;
  entries: number;
  byDeveloper: Array<{ developer: string; hours: number }>;
}

interface WorklogDashboardProps {
  dailyRef?: React.RefObject<HTMLDivElement>;
  developersRef?: React.RefObject<HTMLDivElement>;
}

export const WorklogDashboard: React.FC<WorklogDashboardProps> = ({ dailyRef, developersRef }) => {
  const worklogs = useSprintStore((state) => state.worklogs);
  const tasks = useSprintStore((state) => state.tasks);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const sprints = useSprintStore((state) => state.sprints);
  const getSprintPeriod = useSprintStore((state) => state.getSprintPeriod);
  const presentation = useSprintStore((state) => state.presentation);
  const openWorklogDeveloperModal = useSprintStore((state) => state.openWorklogDeveloperModal);

  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'developers' | 'tasks'>('developers');
  const [descriptionModal, setDescriptionModal] = useState<{ developerName: string; worklogs: WorklogEntry[] } | null>(null);

  // Sync viewMode with presentation step
  useEffect(() => {
    if (presentation.isActive && presentation.steps.length > 0) {
      const currentStep = presentation.steps[presentation.currentStepIndex];
      if (currentStep && 'worklogSection' in currentStep && currentStep.worklogSection) {
        setViewMode(currentStep.worklogSection);
      }
    }
  }, [presentation.isActive, presentation.currentStepIndex, presentation.steps]);

  // Calcular período de análise - sempre usar sprint selecionado
  const analysisPeriod = useMemo(() => {
    if (selectedSprint) {
      const period = getSprintPeriod(selectedSprint);
      if (period) return period;
    }
    
    return null;
  }, [selectedSprint, getSprintPeriod]);

  // Filtrar worklogs pelo período
  const filteredWorklogs = useMemo(() => {
    if (!analysisPeriod) return [];
    
    return worklogs.filter(w => 
      isDateInSprint(w.data, analysisPeriod.startDate, analysisPeriod.endDate)
    );
  }, [worklogs, analysisPeriod]);

  // Mapear worklogs para desenvolvedores (usando responsável da tarefa)
  const worklogsByDeveloper = useMemo(() => {
    const devMap = new Map<string, WorklogEntry[]>();
    
    filteredWorklogs.forEach(worklog => {
      // Tentar encontrar a tarefa correspondente para obter o desenvolvedor
      const task = tasks.find(t => 
        String(t.id || '').trim() === String(worklog.taskId).trim() ||
        String(t.chave || '').trim() === String(worklog.taskId).trim()
      );
      
      const developer = task?.responsavel || worklog.responsavel || '(Sem Responsável)';
      
      if (!devMap.has(developer)) {
        devMap.set(developer, []);
      }
      devMap.get(developer)!.push(worklog);
    });
    
    return devMap;
  }, [filteredWorklogs, tasks]);

  // Estatísticas gerais
  const overallStats = useMemo((): WorklogStats => {
    const dailyHours = new Map<string, number>();
    
    filteredWorklogs.forEach(w => {
      const dateKey = getLocalDateKey(w.data);
      dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + w.tempoGasto);
    });
    
    const hoursArray = Array.from(dailyHours.values());
    const daysWithWork = dailyHours.size;
    
    return {
      totalHours: filteredWorklogs.reduce((sum, w) => sum + w.tempoGasto, 0),
      totalEntries: filteredWorklogs.length,
      averageHoursPerDay: daysWithWork > 0 
        ? filteredWorklogs.reduce((sum, w) => sum + w.tempoGasto, 0) / daysWithWork 
        : 0,
      daysWithWork,
      maxDailyHours: hoursArray.length > 0 ? Math.max(...hoursArray) : 0,
      minDailyHours: hoursArray.length > 0 ? Math.min(...hoursArray) : 0,
    };
  }, [filteredWorklogs]);

  // Estatísticas por desenvolvedor
  const developerStats = useMemo((): DeveloperWorklogStats[] => {
    return Array.from(worklogsByDeveloper.entries()).map(([developerName, devWorklogs]) => {
      const dailyMap = new Map<string, { hours: number; entries: number }>();
      
      devWorklogs.forEach(w => {
        const dateKey = getLocalDateKey(w.data);
        const current = dailyMap.get(dateKey) || { hours: 0, entries: 0 };
        dailyMap.set(dateKey, {
          hours: current.hours + w.tempoGasto,
          entries: current.entries + 1,
        });
      });
      
      const dailyBreakdown = Array.from(dailyMap.entries())
        .map(([dateKey, data]) => ({
          date: parseDate(dateKey), // Parse as local date to avoid timezone issues
          hours: data.hours,
          entries: data.entries,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const hoursArray = dailyBreakdown.map(d => d.hours);
      
      return {
        developerName,
        totalHours: devWorklogs.reduce((sum, w) => sum + w.tempoGasto, 0),
        totalEntries: devWorklogs.length,
        averageHoursPerDay: dailyBreakdown.length > 0
          ? devWorklogs.reduce((sum, w) => sum + w.tempoGasto, 0) / dailyBreakdown.length
          : 0,
        daysWithWork: dailyBreakdown.length,
        maxDailyHours: hoursArray.length > 0 ? Math.max(...hoursArray) : 0,
        minDailyHours: hoursArray.length > 0 ? Math.min(...hoursArray) : 0,
        worklogs: devWorklogs,
        dailyBreakdown,
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [worklogsByDeveloper]);

  // Dados diários agregados
  const dailyData = useMemo((): DailyWorklogData[] => {
    const dailyMap = new Map<string, {
      hours: number;
      entries: number;
      byDeveloper: Map<string, number>;
    }>();
    
    filteredWorklogs.forEach(w => {
      const dateKey = getLocalDateKey(w.data);
      const current = dailyMap.get(dateKey) || {
        hours: 0,
        entries: 0,
        byDeveloper: new Map(),
      };
      
      const task = tasks.find(t => 
        String(t.id || '').trim() === String(w.taskId).trim() ||
        String(t.chave || '').trim() === String(w.taskId).trim()
      );
      const developer = task?.responsavel || w.responsavel || '(Sem Responsável)';
      
      const devHours = current.byDeveloper.get(developer) || 0;
      current.byDeveloper.set(developer, devHours + w.tempoGasto);
      
      dailyMap.set(dateKey, {
        hours: current.hours + w.tempoGasto,
        entries: current.entries + 1,
        byDeveloper: current.byDeveloper,
      });
    });
    
    return Array.from(dailyMap.entries())
      .map(([dateKey, data]) => ({
        date: parseDate(dateKey), // Parse as local date to avoid timezone issues
        totalHours: data.hours,
        entries: data.entries,
        byDeveloper: Array.from(data.byDeveloper.entries())
          .map(([developer, hours]) => ({ developer, hours }))
          .sort((a, b) => b.hours - a.hours),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredWorklogs, tasks]);

  const allDevelopers = useMemo(() => 
    Array.from(worklogsByDeveloper.keys()).sort(),
    [worklogsByDeveloper]
  );

  // Initialize selected developers based on default config
  useEffect(() => {
    if (allDevelopers.length > 0 && selectedDevelopers.length === 0) {
      const defaultDevs = getDefaultSelectedDevelopers();
      
      // If there are default devs configured, filter to only include available developers
      if (defaultDevs.length > 0) {
        const matchedDevs = defaultDevs.filter(dev => allDevelopers.includes(dev));
        // Use matched devs if any found, otherwise use all
        setSelectedDevelopers(matchedDevs.length > 0 ? matchedDevs : allDevelopers);
      } else {
        // No defaults configured, select all by default
        setSelectedDevelopers([...allDevelopers]);
      }
    }
  }, [allDevelopers.length, selectedDevelopers.length]);

  const displayedDevelopers = selectedDevelopers.length > 0 
    ? developerStats.filter(s => selectedDevelopers.includes(s.developerName))
    : developerStats;

  if (worklogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
        <Clock className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
          Nenhum worklog carregado
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Faça upload de um arquivo de worklog para visualizar as análises
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Análise de Worklogs
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Análise detalhada de lançamentos de horas por desenvolvedor
          </p>
        </div>
      </div>

      {/* Sprint Selector */}
      {sprints.length > 0 && (
        <div className="mb-4">
          <SprintSelector />
        </div>
      )}

      {/* Período do Sprint */}
      {analysisPeriod && selectedSprint && (
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              <span className="font-medium">{selectedSprint}</span>
              {' • '}
              {analysisPeriod.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} -{' '}
              {analysisPeriod.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      )}

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 opacity-80" />
            <span className="text-xs opacity-80">Total</span>
          </div>
          <div className="text-3xl font-bold mb-1">{formatHours(overallStats.totalHours)}</div>
          <div className="text-xs opacity-80">{overallStats.totalEntries} lançamentos</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 opacity-80" />
            <span className="text-xs opacity-80">Média Diária</span>
          </div>
          <div className="text-3xl font-bold mb-1">{formatHours(overallStats.averageHoursPerDay)}</div>
          <div className="text-xs opacity-80">{overallStats.daysWithWork} dias com trabalho</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 opacity-80" />
            <span className="text-xs opacity-80">Máximo Diário</span>
          </div>
          <div className="text-3xl font-bold mb-1">{formatHours(overallStats.maxDailyHours)}</div>
          <div className="text-xs opacity-80">Maior lançamento em um dia</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 opacity-80" />
            <span className="text-xs opacity-80">Desenvolvedores</span>
          </div>
          <div className="text-3xl font-bold mb-1">{developerStats.length}</div>
          <div className="text-xs opacity-80">Com lançamentos</div>
        </div>
      </div>

      {/* Tabs de Visualização */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setViewMode('developers')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'developers'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Por Desenvolvedor
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'daily'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Análise Diária
          </button>
        </div>

        {/* Análise Diária */}
        {viewMode === 'daily' && (
          <div ref={dailyRef}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lançamentos por Dia
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {dailyData.map((day) => {
                const maxDayHours = Math.max(...dailyData.map(d => d.totalHours), 1);
                const barWidth = (day.totalHours / maxDayHours) * 100;
                const dateStr = day.date.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                });

                return (
                  <div
                    key={day.date.toISOString()}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white capitalize">
                          {dateStr}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {day.entries} lançamento{day.entries !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {formatHours(day.totalHours)}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {day.byDeveloper.slice(0, 8).map((dev) => (
                        <div
                          key={dev.developer}
                          className="text-xs bg-white dark:bg-gray-700 rounded px-2 py-1 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="font-medium text-gray-700 dark:text-gray-300 truncate">
                            {dev.developer}
                          </div>
                          <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {formatHours(dev.hours)}
                          </div>
                        </div>
                      ))}
                      {day.byDeveloper.length > 8 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          +{day.byDeveloper.length - 8} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        )}

        {/* Por Desenvolvedor */}
        {viewMode === 'developers' && (
          <div ref={developersRef}>
          <div className="space-y-6">
            {/* Filtro de Desenvolvedores */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrar Desenvolvedores:
              </label>
              <div className="flex flex-wrap gap-2">
                {allDevelopers.map((dev) => (
                  <button
                    key={dev}
                    onClick={() => {
                      if (selectedDevelopers.includes(dev)) {
                        setSelectedDevelopers(selectedDevelopers.filter(d => d !== dev));
                      } else {
                        setSelectedDevelopers([...selectedDevelopers, dev]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedDevelopers.includes(dev)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {dev}
                  </button>
                ))}
                {selectedDevelopers.length > 0 && (
                  <button
                    onClick={() => setSelectedDevelopers([])}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Cards de Desenvolvedores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedDevelopers.map((dev) => {
                const maxDaily = Math.max(...dev.dailyBreakdown.map(d => d.hours), 1);
                const worklogsWithDescription = dev.worklogs.filter(
                  (w) => w.descricao && w.descricao.trim().length > 0
                );
                const hasWorklogsWithDescription = worklogsWithDescription.length > 0;

                return (
                  <div
                    key={dev.developerName}
                    onClick={() => openWorklogDeveloperModal(dev.developerName)}
                    className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          {dev.developerName}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {dev.totalEntries} lançamento{dev.totalEntries !== 1 ? 's' : ''} • {formatHours(dev.totalHours)}
                        </p>
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          if (hasWorklogsWithDescription) {
                            setDescriptionModal({
                              developerName: dev.developerName,
                              worklogs: dev.worklogs,
                            });
                          }
                        }}
                        disabled={!hasWorklogsWithDescription}
                        title={
                          hasWorklogsWithDescription
                            ? 'Ver worklogs com descrição'
                            : 'Nenhuma descrição registrada neste sprint'
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border transition ${
                          hasWorklogsWithDescription
                            ? 'bg-white/80 dark:bg-gray-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-800/50'
                            : 'cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          Descrições
                          {hasWorklogsWithDescription ? ` (${worklogsWithDescription.length})` : ''}
                        </span>
                      </button>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Dias trabalhados:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{dev.daysWithWork}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Média diária:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatHours(dev.averageHoursPerDay)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Distribuição Diária:
                      </div>
                      {dev.dailyBreakdown.slice(-7).map((day) => {
                        const barWidth = (day.hours / maxDaily) * 100;
                        const dateStr = day.date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          weekday: 'short',
                        });

                        return (
                          <div key={day.date.toISOString()} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400 w-16 text-left">
                              {dateStr}
                            </span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                              {formatHours(day.hours)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        )}
      </div>

      {descriptionModal && (
        <WorklogDescriptionsModal
          isOpen={Boolean(descriptionModal)}
          developerName={descriptionModal.developerName}
          worklogs={descriptionModal.worklogs}
          tasks={tasks}
          onClose={() => setDescriptionModal(null)}
        />
      )}
    </div>
  );
};

