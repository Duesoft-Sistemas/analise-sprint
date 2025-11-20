import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Users, Square } from 'lucide-react';
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
import { DeliveryDashboard } from './DeliveryDashboard';
import { TasksDashboard } from './TasksDashboard';
import { SettingsPanel } from './SettingsPanel';
import SprintAnalysisDetails from './SprintAnalysisDetails';
import { PresentationSettingsModal } from './PresentationSettingsModal';
import { SidebarNavigation } from './SidebarNavigation';

type ViewMode = 'sprint' | 'multiSprint' | 'performance' | 'evolution' | 'quality' | 'inconsistencies' | 'backlog' | 'backlogFlow' | 'worklog' | 'delivery' | 'tasks';

interface DashboardProps {
  onViewLabelChange?: (label: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const clearData = useSprintStore((state) => state.clearData);
  const sprintAnalytics = useSprintStore((state) => state.sprintAnalytics);
  const crossSprintAnalytics = useSprintStore((state) => state.crossSprintAnalytics);
  const riskAlerts = useSprintStore((state) => state.riskAlerts);
  const selectedDeveloper = useSprintStore((state) => state.selectedDeveloper);
  const sprints = useSprintStore((state) => state.sprints);
  const tasks = useSprintStore((state) => state.tasks);

  // Presentation
  const presentation = useSprintStore((s) => s.presentation);
  const setPresentationConfig = useSprintStore((s) => s.setPresentationConfig);
  const nextPresentationStep = useSprintStore((s) => s.nextPresentationStep);
  const stopPresentation = useSprintStore((s) => s.stopPresentation);

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
  // Refs para seções de backlog
  const backlogSummaryRef = useRef<HTMLDivElement | null>(null);
  const backlogComplexityRef = useRef<HTMLDivElement | null>(null);
  const backlogFeatureRef = useRef<HTMLDivElement | null>(null);
  const backlogClientRef = useRef<HTMLDivElement | null>(null);
  const backlogStatusRef = useRef<HTMLDivElement | null>(null);
  const backlogInsightsRef = useRef<HTMLDivElement | null>(null);
  const backlogTaskListRef = useRef<HTMLDivElement | null>(null);
  // Refs para seções de backlogFlow
  const backlogFlowKpisRef = useRef<HTMLDivElement | null>(null);
  const backlogFlowKpisHoursRef = useRef<HTMLDivElement | null>(null);
  const backlogFlowChartRef = useRef<HTMLDivElement | null>(null);
  const backlogFlowChartHoursRef = useRef<HTMLDivElement | null>(null);
  const backlogFlowCapacityRef = useRef<HTMLDivElement | null>(null);
  const backlogFlowHelpRef = useRef<HTMLDivElement | null>(null);
  // Refs para seções de delivery
  const deliveryRef = useRef<HTMLDivElement | null>(null);
  const deliveryDataLimiteRef = useRef<HTMLDivElement | null>(null);
  const deliveryPrevisaoRef = useRef<HTMLDivElement | null>(null);
  const deliveryCronogramaRef = useRef<HTMLDivElement | null>(null);
  const deliveryTaskListRef = useRef<HTMLDivElement | null>(null);

  // Sync view with current presentation step
  const currentStep = useMemo(() => {
    if (!presentation.steps.length) return null;
    return presentation.steps[Math.min(presentation.currentStepIndex, presentation.steps.length - 1)];
  }, [presentation.steps, presentation.currentStepIndex]);

  // Sync view with current presentation step
  useEffect(() => {
    if (!presentation.isActive || !presentation.steps.length) return;
    const step = presentation.steps[presentation.currentStepIndex];
    if (step) {
      const newView = step.view as ViewMode;
      setViewMode(newView);
    }
  }, [presentation.currentStepIndex, presentation.isActive, presentation.steps]);

  // Rolagem automática para a seção da etapa atual
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!presentation.isActive || !currentStep) return;
    
    // Wait a bit for the view to render before scrolling
    const timeoutId = setTimeout(() => {
      const scrollTo = (el: HTMLElement | null) => {
        if (!el) return;
        
        // Get the scrollable container (main content div)
        const container = mainContentRef.current;
        if (!container) return;
        
        // Calculate position relative to container
        const containerRect = container.getBoundingClientRect();
        const elementRect = el.getBoundingClientRect();
        
        // Calculate scroll position
        const offset = 20; // Offset mínimo para espaçamento
        const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - offset;
        
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
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
        if (currentStep.backlogSection === 'summary') scrollTo(backlogSummaryRef.current || backlogRef.current);
        else if (currentStep.backlogSection === 'byComplexity') scrollTo(backlogComplexityRef.current || backlogRef.current);
        else if (currentStep.backlogSection === 'byFeature') scrollTo(backlogFeatureRef.current || backlogRef.current);
        else if (currentStep.backlogSection === 'byClient') scrollTo(backlogClientRef.current || backlogRef.current);
        else if (currentStep.backlogSection === 'byStatus') scrollTo(backlogStatusRef.current || backlogRef.current);
        else if (currentStep.backlogSection === 'insights') scrollTo(backlogInsightsRef.current || backlogRef.current);
        else if (currentStep.backlogSection === 'taskList') scrollTo(backlogTaskListRef.current || backlogRef.current);
        else scrollTo(backlogRef.current);
      } else if (currentStep.view === 'backlogFlow') {
        if (currentStep.backlogFlowSection === 'kpis') scrollTo(backlogFlowKpisRef.current || backlogFlowRef.current);
        else if (currentStep.backlogFlowSection === 'kpisHours') scrollTo(backlogFlowKpisHoursRef.current || backlogFlowRef.current);
        else if (currentStep.backlogFlowSection === 'chart') scrollTo(backlogFlowChartRef.current || backlogFlowRef.current);
        else if (currentStep.backlogFlowSection === 'chartHours') scrollTo(backlogFlowChartHoursRef.current || backlogFlowRef.current);
        else if (currentStep.backlogFlowSection === 'capacity') scrollTo(backlogFlowCapacityRef.current || backlogFlowRef.current);
        else if (currentStep.backlogFlowSection === 'help') scrollTo(backlogFlowHelpRef.current || backlogFlowRef.current);
        else scrollTo(backlogFlowRef.current);
      }
    }, 300); // Wait 300ms for view to render
    
    return () => clearTimeout(timeoutId);
  }, [presentation.isActive, currentStep, viewMode]);

  // Autoplay timer
  useEffect(() => {
    if (!presentation.isActive || !presentation.isPlaying || presentation.steps.length === 0) return;
    
    const step = presentation.steps[presentation.currentStepIndex];
    const stepMs = step?.durationMs ?? presentation.intervalMs;
    
    const t = setTimeout(() => {
      nextPresentationStep();
    }, stepMs);
    
    return () => clearTimeout(t);
  }, [presentation.isActive, presentation.isPlaying, presentation.intervalMs, presentation.currentStepIndex, presentation.steps.length, nextPresentationStep]);

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

  // Get current step label for presentation indicator
  const getStepLabel = (step: typeof currentStep) => {
    if (!step) return '';
    
    const viewLabels: Record<string, string> = {
      sprint: 'Sprint Ativo',
      multiSprint: 'Multi-Sprint',
      performance: 'Performance',
      evolution: 'Evolução Temporal',
      quality: 'Qualidade dos Chamados',
      inconsistencies: 'Inconsistências',
      backlog: 'Backlog',
      backlogFlow: 'Fluxo & Capacidade',
      worklog: 'Worklogs',
      delivery: 'Gestão de Entregas',
      tasks: 'Tarefas',
    };

    const sectionLabels: Record<string, string> = {
      summary: 'Resumo',
      byFeature: 'Por Feature',
      byClient: 'Por Cliente',
      developers: 'Desenvolvedores',
      tasks: 'Tarefas',
      sprintDistribution: 'Distribuição por Sprint',
      developerAllocation: 'Alocação por Dev',
      clientAllocation: 'Alocação por Cliente',
      featureAnalysis: 'Análise de Features',
      managementKPIs: 'KPIs de Gestão',
      byComplexity: 'Por Complexidade',
      byStatus: 'Por Status',
      insights: 'Insights',
      taskList: 'Lista de Tarefas',
      kpis: 'KPIs (Tickets)',
      kpisHours: 'KPIs (Horas)',
      chart: 'Gráfico (Tickets)',
      chartHours: 'Gráfico (Horas)',
      capacity: 'Recomendação de Capacidade',
      help: 'Ajuda',
      dataLimite: 'Tarefas com Data Limite',
      previsao: 'Tarefas com Previsão',
      cronograma: 'Cronograma por Cliente',
    };

    let label = viewLabels[step.view] || step.view;
    
    if (step.section) {
      label += ` • ${sectionLabels[step.section] || step.section}`;
    } else if (step.multiSection) {
      label += ` • ${sectionLabels[step.multiSection] || step.multiSection}`;
    } else if (step.backlogSection) {
      label += ` • ${sectionLabels[step.backlogSection] || step.backlogSection}`;
    } else if (step.backlogFlowSection) {
      label += ` • ${sectionLabels[step.backlogFlowSection] || step.backlogFlowSection}`;
    } else if (step.deliverySection) {
      label += ` • ${sectionLabels[step.deliverySection] || step.deliverySection}`;
    }
    
    return label;
  };

  const currentStepLabel = currentStep ? getStepLabel(currentStep) : '';
  const currentStepNumber = presentation.currentStepIndex + 1;
  const totalSteps = presentation.steps.length;



  return (
    <div className="flex h-screen animate-fade-in">
      {/* Sidebar Navigation - Hidden during presentation */}
      {!presentation.isActive && (
        <SidebarNavigation
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSettingsClick={() => setShowSettings(true)}
          onPresentationClick={() => setShowPresentation(true)}
          presentationIsPlaying={presentation.isPlaying}
        />
      )}

      {/* Presentation Indicator - Only visible during presentation */}
      {presentation.isActive && currentStep && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3">
          {/* Current Step Info */}
          <div className="px-4 py-2.5 rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentStepLabel}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {currentStepNumber} / {totalSteps}
            </span>
          </div>
          
          {/* Stop Button */}
          <button
            onClick={() => {
              stopPresentation();
              setPresentationConfig({ isActive: false, isPlaying: false });
            }}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xl border border-red-500 transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
            title="Parar apresentação"
          >
            <Square className="w-4 h-4" />
            <span className="font-medium">Parar</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div ref={mainContentRef} className="flex-1 overflow-y-auto space-y-6 px-4 sm:px-6 py-4 lg:pl-6">
        {/* Sprint Selector - Only show when relevant */}
        {viewMode !== 'performance' && viewMode !== 'evolution' && viewMode !== 'quality' && viewMode !== 'inconsistencies' && viewMode !== 'multiSprint' && viewMode !== 'backlog' && viewMode !== 'backlogFlow' && viewMode !== 'worklog' && viewMode !== 'delivery' && viewMode !== 'tasks' && (
          <div className="mb-4">
            <SprintSelector />
          </div>
        )}

        {/* Settings Panel */}
        <SettingsPanel 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          onClearData={() => {
            clearData();
            setShowSettings(false);
          }}
        />

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
          <BacklogDashboard
            summaryRef={backlogSummaryRef}
            byComplexityRef={backlogComplexityRef}
            byFeatureRef={backlogFeatureRef}
            byClientRef={backlogClientRef}
            byStatusRef={backlogStatusRef}
            insightsRef={backlogInsightsRef}
            taskListRef={backlogTaskListRef}
          />
        </div>
      ) : viewMode === 'backlogFlow' ? (
        <div ref={backlogFlowRef}>
          <BacklogFlowDashboard
            kpisRef={backlogFlowKpisRef}
            kpisHoursRef={backlogFlowKpisHoursRef}
            chartRef={backlogFlowChartRef}
            chartHoursRef={backlogFlowChartHoursRef}
            capacityRef={backlogFlowCapacityRef}
            helpRef={backlogFlowHelpRef}
          />
        </div>
      ) : viewMode === 'worklog' ? (
        <WorklogDashboard />
      ) : viewMode === 'delivery' ? (
        <div ref={deliveryRef}>
          <DeliveryDashboard
            dataLimiteRef={deliveryDataLimiteRef}
            previsaoRef={deliveryPrevisaoRef}
            cronogramaRef={deliveryCronogramaRef}
            taskListRef={deliveryTaskListRef}
          />
        </div>
      ) : viewMode === 'tasks' ? (
        <TasksDashboard />
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
    </div>
  );
};

