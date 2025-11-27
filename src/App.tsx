import { useState } from 'react';
import { BarChart3, ArrowRight } from 'lucide-react';
import { useSprintStore } from './store/useSprintStore';
import { XlsUploader } from './components/XlsUploader';
import { Dashboard } from './components/Dashboard';
import { AvailableHoursBreakdownModal } from './components/AvailableHoursBreakdownModal';
import { WorklogDeveloperDetailsModal } from './components/WorklogDeveloperDetailsModal';

function App() {
  const tasks = useSprintStore((state) => state.tasks);
  const worklogs = useSprintStore((state) => state.worklogs);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);
  const layoutFileName = useSprintStore((state) => state.layoutFileName);
  const worklogFileName = useSprintStore((state) => state.worklogFileName);
  const sprintsFileName = useSprintStore((state) => state.sprintsFileName);
  const [showDashboard, setShowDashboard] = useState(false);
  const canAnalyze = tasks.length > 0 && worklogs.length > 0 && sprintMetadata.length > 0;

  // State for breakdown modal from store
  const isBreakdownModalOpen = useSprintStore((state) => state.isBreakdownModalOpen);
  const developerForBreakdown = useSprintStore((state) => state.developerForBreakdown);
  const closeBreakdownModal = useSprintStore((state) => state.closeBreakdownModal);
  
  // State for worklog developer modal
  const isWorklogDeveloperModalOpen = useSprintStore((state) => state.isWorklogDeveloperModalOpen);
  const worklogDeveloperName = useSprintStore((state) => state.worklogDeveloperName);
  const closeWorklogDeveloperModal = useSprintStore((state) => state.closeWorklogDeveloperModal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {!showDashboard ? (
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="w-full animate-fade-in">
              <XlsUploader />
              
              {/* Analysis gating and alert */}
              {(layoutFileName || worklogFileName || sprintsFileName) && !canAnalyze && (
                <div className="mt-6 w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                  <p className="font-medium">Não é possível iniciar a análise. Corrija os itens pendentes:</p>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    {sprintMetadata.length === 0 && <li>Carregue a planilha de sprints válida.</li>}
                    {tasks.length === 0 && <li>Carregue a planilha de layout/tarefas válida.</li>}
                    {worklogs.length === 0 && <li>Carregue a planilha de worklog válida.</li>}
                  </ul>
                </div>
              )}
              {canAnalyze && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setShowDashboard(true)}
                    className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 mx-auto"
                  >
                    <BarChart3 className="w-6 h-6" />
                    Ver Análise Completa
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Dashboard onReturnToHome={() => setShowDashboard(false)} />
        )}
      </main>

      {/* Footer */}
      {!showDashboard && (
        <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors duration-300">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Sprint Analysis Dashboard - Controle e análise de sprints semanais
            </p>
          </div>
        </footer>
      )}

      {/* Global Modals */}
      {developerForBreakdown && (
        <AvailableHoursBreakdownModal
          isOpen={isBreakdownModalOpen}
          onClose={closeBreakdownModal}
          developer={developerForBreakdown}
        />
      )}
      
      {worklogDeveloperName && (
        <WorklogDeveloperDetailsModal
          isOpen={isWorklogDeveloperModalOpen}
          onClose={closeWorklogDeveloperModal}
          developerName={worklogDeveloperName}
        />
      )}
    </div>
  );
}

export default App;

