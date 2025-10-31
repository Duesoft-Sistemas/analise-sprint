import React, { useState } from 'react';
import {
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Award,
} from 'lucide-react';
import {
  COMPLEXITY_EFFICIENCY_ZONES,
  EFFICIENCY_THRESHOLDS,
  PERFORMANCE_SCORE_WEIGHTS,
  MAX_COMPLEXITY_BONUS,
  MAX_SENIORITY_EFFICIENCY_BONUS,
  PERFORMANCE_SCORE_CLASSIFICATIONS,
} from '../config/performanceConfig';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Configurações de Métricas</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <Info className="w-4 h-4 inline mr-1" />
                <strong>Configurações Fixas do Sistema:</strong> Estes são os parâmetros usados em todos os cálculos de performance. 
                Qualquer alteração aqui afeta diretamente as análises e métricas.
              </p>
            </div>

            {/* Zona de Eficiência por Complexidade */}
            <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => toggleSection('complexity-zones')}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Zona de Eficiência por Complexidade
                  </span>
                </div>
                {expandedSections.has('complexity-zones') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.has('complexity-zones') && (
                <div className="p-4 bg-white dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Define os limites esperados de horas para tarefas <strong>(complexidade 1-4)</strong>.
                    <strong>SISTEMA UNIFICADO:</strong> Aplica para TODAS as tarefas complexidades 1-4 (bugs e não-bugs).
                  </p>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                      💡 <strong>IMPORTANTE:</strong> Para complexidades 1-4, usa APENAS horas gastas, NÃO usa a estimativa original. A estimativa não é responsabilidade só do dev, então não é considerada nesta avaliação.
                    </p>
                  </div>
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <Info className="w-4 h-4 inline mr-1" />
                      <strong>Complexidade 5:</strong> Não tem limites de zona de eficiência (só recebe bonus de complexidade). Usa desvio percentual para avaliar eficiência (compara estimativa vs horas gastas).
                    </p>
                  </div>
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <Info className="w-4 h-4 inline mr-1" />
                      <strong>Como funciona:</strong>
                    </p>
                    <ul className="text-sm text-green-800 dark:text-green-200 mt-2 ml-6 space-y-1 list-disc">
                      <li><strong>Complexidades 1-4:</strong> Avaliadas por zona de eficiência (APENAS horas gastas, não usa estimativa)</li>
                      <li><strong>Complexidade 5:</strong> Avaliada por desvio percentual (compara estimativa vs horas gastas)</li>
                    </ul>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">Complexidade</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">Nome</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center bg-green-100 dark:bg-green-900/20">Máx. Eficiente</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center bg-yellow-100 dark:bg-yellow-900/20">Máx. Aceitável</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COMPLEXITY_EFFICIENCY_ZONES.map((zone) => (
                          <tr key={zone.complexity} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-center">
                              {zone.complexity}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                              {zone.name}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center bg-green-50 dark:bg-green-900/10 font-semibold text-green-700 dark:text-green-400">
                              ≤ {zone.maxEfficientHours}h
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center bg-yellow-50 dark:bg-yellow-900/10 font-semibold text-yellow-700 dark:text-yellow-400">
                              ≤ {zone.maxAcceptableHours}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      <strong>Nota:</strong> Tarefas acima do limite "Máx. Aceitável" são consideradas ineficientes para aquela complexidade.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Thresholds de Eficiência */}
            <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => toggleSection('efficiency-thresholds')}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Limites de Tolerância (Desvio Estimativa vs Tempo Gasto) - Complexidade 5
                  </span>
                </div>
                {expandedSections.has('efficiency-thresholds') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.has('efficiency-thresholds') && (
                <div className="p-4 bg-white dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Limites de tolerância para desvios entre estimativa e tempo gasto.
                    <strong>USADO APENAS PARA COMPLEXIDADE 5.</strong>
                    Valores positivos = executou mais rápido. Valores negativos = executou mais devagar.
                  </p>
                  <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      <Info className="w-4 h-4 inline mr-1" />
                      <strong>IMPORTANTE:</strong> Complexidades 1-4 usam zona de eficiência (APENAS horas gastas, não usa estimativa). Complexidade 5 não tem limites absolutos, então usa desvio percentual (compara estimativa vs horas gastas).
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">Complexidade</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center bg-green-100 dark:bg-green-900/20">Mais Rápido (máx)</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center bg-yellow-100 dark:bg-yellow-900/20">Mais Devagar (mín)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {EFFICIENCY_THRESHOLDS.map((threshold) => (
                          <tr key={threshold.complexity} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-center">
                              {threshold.complexity}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center bg-green-50 dark:bg-green-900/10 font-semibold text-green-700 dark:text-green-400">
                              +{threshold.faster}%
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center bg-yellow-50 dark:bg-yellow-900/10 font-semibold text-yellow-700 dark:text-yellow-400">
                              {threshold.slower}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Score Weights */}
            <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => toggleSection('score-weights')}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Pesos do Performance Score
                  </span>
                </div>
                {expandedSections.has('score-weights') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.has('score-weights') && (
                <div className="p-4 bg-white dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Distribuição de peso dos componentes no cálculo do Performance Score final (Base Score).
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-white">Score de Qualidade</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {(PERFORMANCE_SCORE_WEIGHTS.quality * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-white">Eficiência de Execução</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {(PERFORMANCE_SCORE_WEIGHTS.efficiency * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      <Info className="w-4 h-4 inline mr-1" />
                      <strong>Taxa de Conclusão:</strong> Removida do score porque pode ser afetada por interrupções/realocações (não é responsabilidade só do dev). Ainda é exibida como métrica informativa.
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          <Info className="w-4 h-4 inline mr-1" />
                          <strong>Bonus de Complexidade:</strong> até +{MAX_COMPLEXITY_BONUS} pontos por trabalhar em tarefas complexas (níveis 4-5)
                        </p>
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                          <Info className="w-4 h-4 inline mr-1" />
                          <strong>Bonus de Senioridade:</strong> até +{MAX_SENIORITY_EFFICIENCY_BONUS} pontos por executar tarefas complexas com alta eficiência (dentro dos limites de horas esperados)
                        </p>
                      </div>
                    </div>
                </div>
              )}
            </div>

            {/* Classificações de Score */}
            <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => toggleSection('score-classifications')}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Classificações do Performance Score
                  </span>
                </div>
                {expandedSections.has('score-classifications') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.has('score-classifications') && (
                <div className="p-4 bg-white dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Limites para classificação do Performance Score final.
                  </p>
                  <div className="space-y-2">
                    {Object.entries(PERFORMANCE_SCORE_CLASSIFICATIONS).map(([key, classification]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">{classification.label}</span>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Score ≥ {classification.min}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

