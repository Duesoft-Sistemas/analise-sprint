import { useState } from 'react';
import { BarChart3, Moon, Sun, ArrowRight } from 'lucide-react';
import { useSprintStore } from './store/useSprintStore';
import { XlsUploader } from './components/XlsUploader';
import { Dashboard } from './components/Dashboard';
import { useTheme } from './contexts/ThemeContext';
import { AvailableHoursBreakdownModal } from './components/AvailableHoursBreakdownModal';

function App() {
  const tasks = useSprintStore((state) => state.tasks);
  const worklogs = useSprintStore((state) => state.worklogs);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);
  const layoutFileName = useSprintStore((state) => state.layoutFileName);
  const worklogFileName = useSprintStore((state) => state.worklogFileName);
  const sprintsFileName = useSprintStore((state) => state.sprintsFileName);
  const clearData = useSprintStore((state) => state.clearData);
  const { theme, toggleTheme } = useTheme();
  const [showDashboard, setShowDashboard] = useState(false);
  const canAnalyze = tasks.length > 0 && worklogs.length > 0 && sprintMetadata.length > 0;
  const [currentViewLabel, setCurrentViewLabel] = useState<string>('');

  // State for breakdown modal from store
  const isBreakdownModalOpen = useSprintStore((state) => state.isBreakdownModalOpen);
  const developerForBreakdown = useSprintStore((state) => state.developerForBreakdown);
  const closeBreakdownModal = useSprintStore((state) => state.closeBreakdownModal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Sprint Analysis Dashboard
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Análise e controle de sprints semanais
                  </p>
                  {showDashboard && currentViewLabel && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                      <BarChart3 className="w-3.5 h-3.5" />
                      {currentViewLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
              {canAnalyze && (
                <>
                  {!showDashboard && (
                    <button
                      onClick={() => setShowDashboard(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Ver Análise
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      clearData();
                      setShowDashboard(false);
                    }}
                    className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                  >
                    Limpar Dados
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showDashboard ? (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-6 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Bem-vindo!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Para começar, faça upload dos arquivos Excel com os dados do seu sprint.
              </p>
            </div>
            <XlsUploader />
            
            {/* Analysis gating and alert */}
            {(layoutFileName || worklogFileName || sprintsFileName) && !canAnalyze && (
              <div className="mt-6 max-w-2xl mx-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
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
        ) : (
          <Dashboard onViewLabelChange={setCurrentViewLabel} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors duration-300">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Sprint Analysis Dashboard - Controle e análise de sprints semanais
          </p>
        </div>
      </footer>

      {/* Global Modal */}
      {developerForBreakdown && (
        <AvailableHoursBreakdownModal
          isOpen={isBreakdownModalOpen}
          onClose={closeBreakdownModal}
          developer={developerForBreakdown}
        />
      )}
    </div>
  );
}

export default App;

