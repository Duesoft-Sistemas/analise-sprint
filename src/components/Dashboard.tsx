import React, { useState } from 'react';
import { BarChart3, Users, Target, Calendar, FileSpreadsheet, Clock, TrendingUp, CheckCircle2, Settings, AlertTriangle, Inbox } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { SprintSelector } from './SprintSelector';
import { TotalizerCards } from './TotalizerCards';
import { DeveloperCard } from './DeveloperCard';
import { AlertPanel } from './AlertPanel';
import { TaskList } from './TaskList';
import { CrossSprintAnalysis } from './CrossSprintAnalysis';
import { PerformanceDashboard } from './PerformanceDashboard';
import { TemporalEvolutionDashboard } from './TemporalEvolutionDashboard';
import { QualityDashboard } from './QualityDashboard';
import { InconsistenciesDashboard } from './InconsistenciesDashboard';
import { BacklogDashboard } from './BacklogDashboard';
import { SettingsPanel } from './SettingsPanel';
import SprintAnalysisDetails from './SprintAnalysisDetails';

type ViewMode = 'sprint' | 'multiSprint' | 'performance' | 'evolution' | 'quality' | 'inconsistencies' | 'backlog';

export const Dashboard: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const sprintAnalytics = useSprintStore((state) => state.sprintAnalytics);
  const crossSprintAnalytics = useSprintStore((state) => state.crossSprintAnalytics);
  const riskAlerts = useSprintStore((state) => state.riskAlerts);
  const selectedDeveloper = useSprintStore((state) => state.selectedDeveloper);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);
  const sprintsFileName = useSprintStore((state) => state.sprintsFileName);
  const getSprintPeriod = useSprintStore((state) => state.getSprintPeriod);
  const layoutFileName = useSprintStore((state) => state.layoutFileName);
  const worklogFileName = useSprintStore((state) => state.worklogFileName);
  const worklogs = useSprintStore((state) => state.worklogs);
  const sprints = useSprintStore((state) => state.sprints);
  const tasks = useSprintStore((state) => state.tasks);
  
  // Get current sprint period from metadata
  const currentSprintPeriod = selectedSprint ? getSprintPeriod(selectedSprint) : null;

  const [viewMode, setViewMode] = useState<ViewMode>('sprint');

  if (!sprintAnalytics || !crossSprintAnalytics) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sprint Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sprints Configuration */}
        {sprintsFileName ? (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-2xl p-5 shadow-xl border-2 border-blue-400 dark:border-blue-500">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-white" />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-medium text-blue-100 uppercase tracking-wide">Configuração de Sprints</h3>
                <p className="text-sm font-bold text-white mt-0.5 truncate" title={sprintsFileName}>
                  {sprintsFileName}
                </p>
                <p className="text-xs text-blue-100 mt-0.5">
                  {sprintMetadata.length} sprint{sprintMetadata.length !== 1 ? 's' : ''} configurado{sprintMetadata.length !== 1 ? 's' : ''}
                </p>
                {currentSprintPeriod && (
                  <p className="text-xs text-blue-100 mt-1">
                    🗓️ Atual: {currentSprintPeriod.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a{' '}
                    {currentSprintPeriod.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Layout File */}
        {layoutFileName && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 rounded-2xl p-5 shadow-xl border-2 border-green-400 dark:border-green-500">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-white" />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-medium text-green-100 uppercase tracking-wide">Layout do Sprint</h3>
                <p className="text-sm font-bold text-white mt-0.5 truncate" title={layoutFileName}>
                  {layoutFileName}
                </p>
                <p className="text-xs text-green-100 mt-0.5">
                  {sprintAnalytics.totalTasks} tarefas carregadas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Worklog File */}
        {worklogFileName ? (
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-700 dark:to-violet-700 rounded-2xl p-5 shadow-xl border-2 border-purple-400 dark:border-purple-500">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-white" />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-medium text-purple-100 uppercase tracking-wide">Worklog Detalhado</h3>
                <p className="text-sm font-bold text-white mt-0.5 truncate" title={worklogFileName}>
                  {worklogFileName}
                </p>
                <p className="text-xs text-purple-100 mt-0.5">
                  {worklogs.length} registros de tempo
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 shadow-md border-2 border-gray-300 dark:border-gray-600 border-dashed">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              <div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Worklog</h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">
                  Não carregado
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  Usando tempo do layout
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header with Sprint Selector and View Toggles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {viewMode !== 'performance' && viewMode !== 'evolution' && viewMode !== 'quality' && viewMode !== 'inconsistencies' && viewMode !== 'multiSprint' && viewMode !== 'backlog' && <SprintSelector />}
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setViewMode('sprint')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${
              viewMode === 'sprint'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Sprint Ativo
          </button>
          
          <button
            onClick={() => setViewMode('multiSprint')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${
              viewMode === 'multiSprint'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Multi-Sprint
          </button>
          
          <button
            onClick={() => setViewMode('performance')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${
              viewMode === 'performance'
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Target className="w-4 h-4" />
            Performance
          </button>
          
          <button
            onClick={() => setViewMode('evolution')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${
              viewMode === 'evolution'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Evolução Temporal
          </button>
          
          <button
            onClick={() => setViewMode('quality')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${
              viewMode === 'quality'
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Qualidade dos Chamados
          </button>
          
          <button
            onClick={() => setViewMode('backlog')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${
              viewMode === 'backlog'
                ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Backlog
          </button>
          
          <button
            onClick={() => setViewMode('inconsistencies')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${
              viewMode === 'inconsistencies'
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Inconsistências
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Configurações de Métricas"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Content based on view mode */}
      {viewMode === 'evolution' ? (
        <TemporalEvolutionDashboard />
      ) : viewMode === 'performance' ? (
        <PerformanceDashboard />
      ) : viewMode === 'quality' ? (
        <QualityDashboard />
      ) : viewMode === 'inconsistencies' ? (
        <InconsistenciesDashboard />
      ) : viewMode === 'backlog' ? (
        <BacklogDashboard />
      ) : viewMode === 'multiSprint' ? (
        <CrossSprintAnalysis analytics={crossSprintAnalytics} sprints={sprints} tasks={tasks} />
      ) : (
        <>
          {/* Alerts */}
          <AlertPanel alerts={riskAlerts} />

          {/* Totalizer Cards */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Resumo do Sprint
            </h2>
            <TotalizerCards analytics={sprintAnalytics} />
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <SprintAnalysisDetails analytics={sprintAnalytics} />
          </div>

          {/* Developer Cards */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              Desenvolvedores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sprintAnalytics.developers.map((dev) => (
                <DeveloperCard key={dev.name} developer={dev} />
              ))}
            </div>
          </div>

          {/* Task List */}
          {selectedDeveloper && (
            <div className="border-t-4 border-blue-500 dark:border-blue-400 pt-6">
              <TaskList />
            </div>
          )}

          {!selectedDeveloper && <TaskList />}
        </>
      )}
    </div>
  );
};

