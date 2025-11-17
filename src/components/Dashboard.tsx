import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Users, Target, Calendar, FileSpreadsheet, Clock, TrendingUp, CheckCircle2, Settings, AlertTriangle, Inbox, PlayCircle } from 'lucide-react';
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
import { BacklogFlowDashboard } from './BacklogFlowDashboard';
import { WorklogDashboard } from './WorklogDashboard';
import { SettingsPanel } from './SettingsPanel';
import SprintAnalysisDetails from './SprintAnalysisDetails';
import { PresentationSettingsModal } from './PresentationSettingsModal';

type ViewMode = 'sprint' | 'multiSprint' | 'performance' | 'evolution' | 'quality' | 'inconsistencies' | 'backlog' | 'backlogFlow' | 'worklog';

interface DashboardProps {
  onViewLabelChange?: (label: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewLabelChange }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
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

  // Presentation
  const presentation = useSprintStore((s) => s.presentation);
  const setPresentationConfig = useSprintStore((s) => s.setPresentationConfig);
  const nextPresentationStep = useSprintStore((s) => s.nextPresentationStep);
  
  // Get current sprint period from metadata
  const currentSprintPeriod = selectedSprint ? getSprintPeriod(selectedSprint) : null;

  const [viewMode, setViewMode] = useState<ViewMode>('sprint');
  // Refs para rolagem no modo apresentação
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const analysisRef = useRef<HTMLDivElement | null>(null);
  const devsRef = useRef<HTMLDivElement | null>(null);
  const tasksRef = useRef<HTMLDivElement | null>(null);
  const featureRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<HTMLDivElement | null>(null);
  const managementRef = useRef<HTMLDivElement | null>(null);
  const backlogRef = useRef<HTMLDivElement | null>(null);
  const backlogFlowRef = useRef<HTMLDivElement | null>(null);

  // Sync view with current presentation step
  const currentStep = useMemo(() => {
    if (!presentation.steps.length) return null;
    return presentation.steps[Math.min(presentation.currentStepIndex, presentation.steps.length - 1)];
  }, [presentation.steps, presentation.currentStepIndex]);

  useEffect(() => {
    if (!currentStep || !presentation.isActive) return;
    if (currentStep.view !== viewMode) {
      setViewMode(currentStep.view as any);
    }
  }, [currentStep, presentation.isActive]);

  // Rolagem automática para a seção da etapa atual
  useEffect(() => {
    if (!presentation.isActive || !currentStep) return;
    const scrollTo = (el: HTMLElement | null) => {
      if (!el) return;
      // Compensar cabeçalho/linha de toggles
      // Nas seções de Feature e Cliente do Sprint Ativo usamos um offset maior
      const headerOffset =
        currentStep.view === 'sprint' &&
        (currentStep.section === 'byFeature' || currentStep.section === 'byClient')
          ? 140
          : 96;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    };
    if (currentStep.view === 'sprint') {
      if (currentStep.section === 'summary') scrollTo(summaryRef.current);
      else if (currentStep.section === 'byFeature') scrollTo(featureRef.current || analysisRef.current);
      else if (currentStep.section === 'byClient') scrollTo(clientRef.current || analysisRef.current);
      else if (currentStep.section === 'developers') scrollTo(devsRef.current);
      else if (currentStep.section === 'tasks') scrollTo(tasksRef.current);
    } else if (currentStep.view === 'multiSprint') {
      if (currentStep.multiSection === 'sprintDistribution') scrollTo(summaryRef.current);
      else if (currentStep.multiSection === 'developerAllocation') scrollTo(devsRef.current);
      else if (currentStep.multiSection === 'clientAllocation') scrollTo(analysisRef.current);
      else if (currentStep.multiSection === 'featureAnalysis') scrollTo(tasksRef.current);
      else if (currentStep.multiSection === 'managementKPIs') scrollTo(managementRef.current);
    } else if (currentStep.view === 'backlog') {
      scrollTo(backlogRef.current);
    } else if (currentStep.view === 'backlogFlow') {
      scrollTo(backlogFlowRef.current);
    }
  }, [presentation.isActive, currentStep]);

  // Autoplay timer
  useEffect(() => {
    if (!presentation.isActive || !presentation.isPlaying || presentation.steps.length === 0) return;
    const stepMs = currentStep?.durationMs ?? presentation.intervalMs;
    const t = setTimeout(() => nextPresentationStep(), stepMs);
    return () => clearTimeout(t);
  }, [presentation.isActive, presentation.isPlaying, presentation.intervalMs, presentation.currentStepIndex, presentation.steps, currentStep, nextPresentationStep]);

  // Query param bootstrap (?presentation=1&interval=60000)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('presentation') === '1') {
      const interval = params.get('interval');
      setPresentationConfig({
        isActive: true,
        isPlaying: true,
        intervalMs: interval ? parseInt(interval, 10) : 60000,
      });
    }
  }, [setPresentationConfig]);

  if (!sprintAnalytics || !crossSprintAnalytics) {
    return null;
  }

  const currentViewLabel = useMemo(() => {
    switch (viewMode) {
      case 'sprint':
        return selectedSprint ? `Sprint Ativo • ${selectedSprint}` : 'Sprint Ativo';
      case 'multiSprint':
        return 'Multi-Sprint';
      case 'performance':
        return 'Performance';
      case 'evolution':
        return 'Evolução Temporal';
      case 'quality':
        return 'Qualidade dos Chamados';
      case 'inconsistencies':
        return 'Inconsistências';
      case 'backlog':
        return 'Backlog';
      case 'backlogFlow':
        return 'Fluxo & Capacidade';
      case 'worklog':
        return 'Análise de Worklogs';
      default:
        return '';
    }
  }, [viewMode, selectedSprint]);

  // Publish current view label to header
  useEffect(() => {
    if (onViewLabelChange) {
      onViewLabelChange(currentViewLabel);
    }
  }, [currentViewLabel, onViewLabelChange]);

  return (
    <div className="space-y-6 animate-fade-in mt-2">
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
        {viewMode !== 'performance' && viewMode !== 'evolution' && viewMode !== 'quality' && viewMode !== 'inconsistencies' && viewMode !== 'multiSprint' && viewMode !== 'backlog' && viewMode !== 'worklog' && <SprintSelector />}
        
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
            onClick={() => setViewMode('backlogFlow')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${
              viewMode === 'backlogFlow'
                ? 'bg-gradient-to-r from-slate-600 to-slate-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Fluxo & Capacidade
          </button>
          
          <button
            onClick={() => setViewMode('worklog')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${
              viewMode === 'worklog'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Worklogs
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

          <button
            onClick={() => setShowPresentation(true)}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 ${presentation.isPlaying ? 'bg-gradient-to-r from-red-600 to-red-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            title="Modo Apresentação"
          >
            <PlayCircle className="w-4 h-4" />
            Apresentação
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Presentation settings */}
      <PresentationSettingsModal isOpen={showPresentation} onClose={() => setShowPresentation(false)} />

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
        <div ref={backlogRef}>
          <BacklogDashboard />
        </div>
      ) : viewMode === 'backlogFlow' ? (
        <div ref={backlogFlowRef}>
          <BacklogFlowDashboard />
        </div>
      ) : viewMode === 'worklog' ? (
        <WorklogDashboard />
      ) : viewMode === 'multiSprint' ? (
        <CrossSprintAnalysis
          analytics={crossSprintAnalytics}
          sprints={sprints}
          tasks={tasks}
          sprintDistributionRef={summaryRef /* reuse top anchor */}
          developerAllocationRef={devsRef}
          clientAllocationRef={analysisRef}
          featureAnalysisRef={tasksRef}
          managementKpisRef={managementRef}
        />
      ) : (
        <>
          {/* Alerts */}
          <AlertPanel alerts={riskAlerts} />

          {/* Totalizer Cards */}
          <div ref={summaryRef} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Resumo do Sprint
            </h2>
            <TotalizerCards analytics={sprintAnalytics} />
          </div>

          <div ref={analysisRef} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <SprintAnalysisDetails
              analytics={sprintAnalytics}
              isPresentation={presentation.isActive}
              focusSection={currentStep?.view === 'sprint' ? (currentStep.section === 'byFeature' ? 'feature' : currentStep.section === 'byClient' ? 'client' : undefined) : undefined}
              chartHeight={presentation.isActive ? 600 : undefined}
              featureAnchorRef={featureRef}
              clientAnchorRef={clientRef}
            />
          </div>

          {/* Developer Cards */}
          <div ref={devsRef} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              Sprint Ativo • Desenvolvedores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sprintAnalytics.developers.map((dev) => (
                <DeveloperCard key={dev.name} developer={dev} />
              ))}
            </div>
          </div>

          {/* Task List */}
          <div ref={tasksRef}>
            {selectedDeveloper && (
              <div className="border-t-4 border-blue-500 dark:border-blue-400 pt-6">
                <TaskList />
              </div>
            )}

            {!selectedDeveloper && <TaskList />}
          </div>
        </>
      )}
    </div>
  );
};

