import { BarChart3, Moon, Sun } from 'lucide-react';
import { useSprintStore } from './store/useSprintStore';
import { XlsUploader } from './components/XlsUploader';
import { Dashboard } from './components/Dashboard';
import { useTheme } from './contexts/ThemeContext';

function App() {
  const tasks = useSprintStore((state) => state.tasks);
  const clearData = useSprintStore((state) => state.clearData);
  const { theme, toggleTheme } = useTheme();

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
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Análise e controle de sprints semanais
                </p>
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
              {tasks.length > 0 && (
                <button
                  onClick={clearData}
                  className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                >
                  Limpar Dados
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tasks.length === 0 ? (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-6 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Bem-vindo!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Para começar, faça upload de um arquivo Excel (.xlsx ou .xls) com os dados do seu sprint.
              </p>
              <div className="space-y-4">
                {/* Layout Columns */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    📊 Colunas esperadas no arquivo de Layout:
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                    <li>Tipo de item</li>
                    <li>Chave da item</li>
                    <li>ID da item</li>
                    <li>Resumo</li>
                    <li>Tempo gasto (formato: "1h 30m" ou "2h")</li>
                    <li>Sprint</li>
                    <li>Criado</li>
                    <li>Estimativa original</li>
                    <li>Responsável</li>
                    <li>ID do responsável</li>
                    <li>Status</li>
                    <li>Campo personalizado (Modulo)</li>
                    <li>Campo personalizado (Feature)</li>
                    <li>Categorias</li>
                    <li>Campo personalizado (Detalhes Ocultos)</li>
                  </ul>
                </div>

                {/* Worklog Columns */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                    ⏱️ Colunas esperadas no arquivo de Worklog (Opcional):
                  </h3>
                  <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1 list-disc list-inside">
                    <li><strong>Issue</strong> ou "ID da tarefa" ou "Chave" - ID da tarefa (ex: DM-2018)</li>
                    <li><strong>Created date (worklog)</strong> ou "Data" - Data do registro (ex: 29/10/2025 19:35)</li>
                    <li><strong>Responsável</strong> ou "Author" - Nome do desenvolvedor (ex: Paulo Anjos)</li>
                    <li><strong>Time spent</strong> ou "Tempo gasto" - Tempo trabalhado (ex: 1h, 0.5h, 2h 30m)</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-purple-300 dark:border-purple-700">
                    <p className="text-xs text-purple-700 dark:text-purple-400">
                      💡 <strong>Dica:</strong> O worklog permite análise detalhada por período, separando tempo entre sprints.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <XlsUploader />
          </div>
        ) : (
          <Dashboard />
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
    </div>
  );
}

export default App;

