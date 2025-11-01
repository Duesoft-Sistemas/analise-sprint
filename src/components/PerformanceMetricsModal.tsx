import React from 'react';
import { X, HelpCircle, Target, Award, Zap, CheckCircle, BarChart3 } from 'lucide-react';
import { MetricExplanation } from '../types';
import { METRIC_EXPLANATIONS } from '../services/performanceAnalytics';

interface PerformanceMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const METRIC_ICONS: Record<string, React.ReactNode> = {
  estimationAccuracy: <Target className="w-5 h-5" />,
  accuracyRate: <CheckCircle className="w-5 h-5" />,
  bugRate: <Award className="w-5 h-5" />,
  qualityScore: <Award className="w-5 h-5" />,
  utilizationRate: <Zap className="w-5 h-5" />,
  completionRate: <CheckCircle className="w-5 h-5" />,
  consistencyScore: <BarChart3 className="w-5 h-5" />,
  performanceScore: <Award className="w-5 h-5" />,
  bugsVsFeatures: <BarChart3 className="w-5 h-5" />,
};


export const PerformanceMetricsModal: React.FC<PerformanceMetricsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const getMetricTitle = (key: string): string => {
    const titles: Record<string, string> = {
      estimationAccuracy: 'Desvio de Estimativa (por tarefa)',
      accuracyRate: 'Eficiência de Execução ⭐',
      bugRate: 'Taxa de Bugs',
      qualityScore: 'Score de Qualidade (Nota de Teste)',
      utilizationRate: 'Taxa de Utilização ⚠️ (Contexto)',
      completionRate: 'Taxa de Conclusão',
      consistencyScore: 'Score de Consistência',
      performanceScore: 'Score de Performance',
      bugsVsFeatures: 'Ratio Bugs vs Features',
    };
    return titles[key] || key;
  };

  const renderMetric = (metricKey: string, explanation: MetricExplanation) => {
    const icon = METRIC_ICONS[metricKey] || <HelpCircle className="w-5 h-5" />;
    
    return (
      <div
        key={metricKey}
        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            {icon}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              {getMetricTitle(metricKey)}
            </h4>
            
            {/* Formula */}
            <div className="mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Fórmula:</span>
              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                {explanation.formula}
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Descrição:</span>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {explanation.description}
              </p>
            </div>
            
            {/* Interpretation */}
            <div className="mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Interpretação:</span>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {explanation.interpretation}
              </p>
            </div>
            
            {/* Example */}
            {explanation.example && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Exemplo:</span>
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 italic">
                  {explanation.example}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Guia de Métricas de Performance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Entenda como cada métrica é calculada e interpretada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ============================================ */}
          {/* SEÇÃO 1: O QUE IMPACTA NO SCORE */}
          {/* ============================================ */}
          <div className="mb-10">
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <Award className="w-7 h-7" />
                O Que Impacta no Performance Score
              </h3>
              <p className="text-blue-100 text-sm">
                Estas são as métricas que determinam seu score final. Tudo que não está aqui é apenas informativo.
              </p>
            </div>

            {/* Performance Score Geral */}
            {METRIC_EXPLANATIONS.performanceScore && (
              <div className="mb-6 p-5 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl border-2 border-purple-300 dark:border-purple-700">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-3 bg-purple-500 rounded-lg text-white">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Score de Performance (Score Final)
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">📐 Como é Calculado:</p>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          <strong>Base Score</strong> = (50% × Qualidade) + (50% × Eficiência)
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Score Final</strong> = Base Score + Bonus de Complexidade (0-10 pontos) + Bonus de Senioridade (0-15 pontos) + Bonus de Auxílio (0-10 pontos)
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mt-2 text-xs italic">
                          💡 <strong>Bonus de Senioridade:</strong> Este é o indicador principal de senioridade! Recompensa executar tarefas complexas com alta eficiência (dentro dos limites de horas esperados).
                        </p>
                      </div>
                      
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">💡 Exemplo Simples:</p>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          • Qualidade: 80 pontos (nota média 4/5)
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          • Eficiência: 70 pontos (executou bem dentro do estimado)
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          • Base Score = (80 × 0.5) + (70 × 0.5) = <strong>75 pontos</strong>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          • Se trabalhou em tarefas complexas: +5 pontos de bonus (complexidade)
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          • Se executou complexas com alta eficiência: +10 pontos de bonus (senioridade) ⭐
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 font-bold mt-2">
                          • Score Final = <strong>90 pontos</strong> 🏆⭐
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Interpretação:</p>
                        <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                          <li>• <strong>115+ pontos</strong> = Excepcional (com bonuses) ⭐⭐⭐</li>
                          <li>• <strong>90-114 pontos</strong> = Excelente ⭐⭐</li>
                          <li>• <strong>75-89 pontos</strong> = Muito Bom ⭐</li>
                          <li>• <strong>60-74 pontos</strong> = Bom</li>
                          <li>• <strong>45-59 pontos</strong> = Adequado</li>
                          <li>• <strong>&lt;45 pontos</strong> = Precisa Melhorias</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Score - 50% do Score */}
            {METRIC_EXPLANATIONS.qualityScore && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-12 bg-green-500 rounded-full" />
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    1. Qualidade (50% do Score)
                  </h4>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold">
                    50% do Score
                  </span>
                </div>
                {renderMetric('qualityScore', METRIC_EXPLANATIONS.qualityScore)}
                
                {/* Exemplo Prático Qualidade */}
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    📊 Exemplo Prático:
                  </p>
                  <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                    <p>Você fez 10 tarefas com as seguintes notas:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• 5 tarefas com nota 5 → (5 × 20) = 100 pontos cada</li>
                      <li>• 3 tarefas com nota 4 → (4 × 20) = 80 pontos cada</li>
                      <li>• 2 tarefas com nota 3 → (3 × 20) = 60 pontos cada</li>
                    </ul>
                    <p className="mt-2 font-medium">
                      Média: ((5×100) + (3×80) + (2×60)) / 10 = <strong>86 pontos de Qualidade</strong>
                    </p>
                    <p className="text-xs italic mt-2">
                      💡 Lembre-se: Se a nota estiver vazia, conta como 5 (100 pontos)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Accuracy Rate - 50% do Score */}
            {METRIC_EXPLANATIONS.accuracyRate && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-12 bg-blue-500 rounded-full" />
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    2. Eficiência de Execução (50% do Score)
                  </h4>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
                    50% do Score
                  </span>
                </div>
                {renderMetric('accuracyRate', METRIC_EXPLANATIONS.accuracyRate)}
                
                {/* Exemplo Prático Eficiência */}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📊 Exemplo Prático:
                  </p>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <p>Você fez 10 tarefas. Vejamos quais foram eficientes:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• <strong>Complexidades 1-4:</strong> Avaliadas por zona de eficiência (APENAS horas gastas, não usa estimativa)</li>
                      <li>• 5 tarefas complexidade 1-4 com horas gastas ≤ limite aceitável → ✅ Eficientes</li>
                      <li>• 3 tarefas complexidade 1-4 com horas gastas {'>'} limite aceitável → ❌ Ineficientes</li>
                      <li>• <strong>Complexidade 5:</strong> Avaliada por desvio percentual (usa estimativa vs horas gastas)</li>
                      <li>• 2 tarefas complexidade 5 dentro dos limites de desvio → ✅ Eficientes</li>
                    </ul>
                    <p className="mt-2 font-medium">
                      Eficiência: 7 tarefas eficientes de 10 = <strong>70% de Eficiência</strong>
                    </p>
                    <p className="text-xs italic mt-2 font-semibold text-blue-600 dark:text-blue-400">
                      💡 IMPORTANTE: Complexidades 1-4 usam APENAS horas gastas (estimativa não é considerada). Complexidade 5 usa desvio percentual (usa estimativa).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bonus de Complexidade */}
            <div className="mb-6 p-5 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-xl border-2 border-orange-300 dark:border-orange-700">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-orange-500 rounded-lg text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Bonus de Complexidade (+10 pontos) 🏆
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">📐 Como é Calculado:</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        Trabalhar em tarefas complexas (nível 4-5) te dá um bonus!
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-2">
                        <strong>Bonus</strong> = (% de tarefas complexas) × 10 pontos
                      </p>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">💡 Exemplo Simples:</p>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        • Você fez 10 tarefas no sprint
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        • 5 tarefas foram complexas (nível 4-5) = 50% complexas
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 font-bold">
                        • Bonus = 50% × 10 = <strong>+5 pontos</strong> 🏆
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Tabela de Bonus:</p>
                      <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• 0% de tarefas complexas → +0 pontos</li>
                        <li>• 25% de tarefas complexas → +2.5 pontos</li>
                        <li>• 50% de tarefas complexas → +5 pontos</li>
                        <li>• 75% de tarefas complexas → +7.5 pontos</li>
                        <li>• 100% de tarefas complexas → +10 pontos (máximo)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus de Senioridade */}
            <div className="mb-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-indigo-300 dark:border-indigo-700">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-indigo-500 rounded-lg text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Bonus de Senioridade (+15 pontos) ⭐
                  </h4>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3 font-semibold">
                    🎯 Este é o indicador principal de senioridade!
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">📐 Como é Calculado:</p>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        Executar tarefas complexas (nível 4-5) <strong>com alta eficiência</strong> te dá um bonus ainda maior!
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-2">
                        <strong>Bonus</strong> = (% de eficiência em tarefas complexas) × 15 pontos
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-2 text-xs italic">
                        • Tarefas na zona <strong>eficiente</strong> (ex: Complexidade 4 gastou ≤16h) = peso 1.0
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-xs italic">
                        • Tarefas na zona <strong>aceitável</strong> (ex: Complexidade 4 gastou ≤32h) = peso 0.5
                      </p>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">💡 Exemplo Simples:</p>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        • Você fez 3 tarefas complexas (nível 4)
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        • 2 tarefas executadas com alta eficiência (≤16h cada) = 2 × 1.0 = 2.0
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        • 1 tarefa executada com eficiência moderada (≤32h) = 1 × 0.5 = 0.5
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        • Eficiência: (2.0 + 0.5) / 3 tarefas = 83% de eficiência
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 font-bold">
                        • Bonus = 83% × 15 = <strong>+12 pontos</strong> ⭐
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Por que este bonus é maior?</p>
                      <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                        <li>• <strong>Executar bem</strong> é mais difícil que apenas <strong>pegar</strong> tarefas complexas</li>
                        <li>• Indica <strong>senioridade real</strong>: não só aceita desafios, mas os resolve com maestria</li>
                        <li>• Recompensa a <strong>eficiência na execução</strong>, não apenas a disponibilidade</li>
                        <li>• Este é o indicador de que o dev está <strong>atingindo o ápice</strong> 🏆</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exemplo Completo do Cálculo */}
            <div className="mb-8 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-indigo-300 dark:border-indigo-700">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Exemplo Completo: Como Seu Score é Calculado
              </h4>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white mb-3">📊 Cenário Real:</p>
                  <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    <p><strong>1. Qualidade:</strong> Você teve nota média de 4.2 → <strong>84 pontos</strong></p>
                    <p><strong>2. Eficiência:</strong> 8 de 10 tarefas foram eficientes → <strong>80 pontos</strong></p>
                    <p><strong>3. Bonus Complexidade:</strong> 60% das tarefas foram complexas → <strong>+6 pontos</strong></p>
                    <p><strong>4. Bonus Senioridade:</strong> Executou complexas com 80% eficiência → <strong>+12 pontos</strong> ⭐</p>
                  </div>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white mb-3">🧮 Cálculo:</p>
                  <div className="space-y-2 text-gray-700 dark:text-gray-300 font-mono">
                    <p>Base Score = (84 × 0.5) + (80 × 0.5)</p>
                    <p>Base Score = 42 + 40</p>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      Base Score = 82 pontos
                    </p>
                    <p className="mt-3">Score Final = 82 + 6 (complexidade) + 12 (senioridade)</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      Score Final = 100 pontos 🏆⭐
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SEÇÃO 2: MÉTRICAS INFORMATIVAS */}
          {/* ============================================ */}
          <div className="mb-8">
            <div className="mb-6 p-4 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <BarChart3 className="w-6 h-6" />
                Métricas Informativas (Não Impactam o Score)
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Estas métricas são apenas para contexto e informação. Elas não fazem parte do cálculo do Performance Score.
              </p>
            </div>

            <div className="grid gap-4">
              {/* Desvio de Estimativa */}
              {METRIC_EXPLANATIONS.estimationAccuracy && renderMetric('estimationAccuracy', METRIC_EXPLANATIONS.estimationAccuracy)}
              
              {/* Score de Consistência */}
              {METRIC_EXPLANATIONS.consistencyScore && renderMetric('consistencyScore', METRIC_EXPLANATIONS.consistencyScore)}
              
              {/* Taxa de Bugs */}
              {METRIC_EXPLANATIONS.bugRate && renderMetric('bugRate', METRIC_EXPLANATIONS.bugRate)}
              
              {/* Bugs vs Features */}
              {METRIC_EXPLANATIONS.bugsVsFeatures && renderMetric('bugsVsFeatures', METRIC_EXPLANATIONS.bugsVsFeatures)}
              
              {/* Taxa de Conclusão */}
              {METRIC_EXPLANATIONS.completionRate && renderMetric('completionRate', METRIC_EXPLANATIONS.completionRate)}
              
              {/* Taxa de Utilização */}
              {METRIC_EXPLANATIONS.utilizationRate && renderMetric('utilizationRate', METRIC_EXPLANATIONS.utilizationRate)}
            </div>
          </div>

          {/* Detalhamento da Eficiência por Complexidade */}
          <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-lg">
              ⚡ Detalhes: Como a Eficiência é Ajustada por Complexidade
            </h4>
            <div className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="font-medium mb-2">📘 Tarefa Simples (nível 1-2) estimada em 10h:</p>
                <ul className="ml-4 space-y-1">
                  <li>✅ Gastou 5h-10h → <strong>EFICIENTE!</strong> (até 50% mais rápido é excelente)</li>
                  <li>✅ Gastou 11h-11.5h (até -15% de atraso) → <strong>Aceitável</strong></li>
                  <li>❌ Gastou 12h+ → <strong>Ineficiente</strong></li>
                </ul>
              </div>
              
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="font-medium mb-2">📗 Tarefa Média (nível 3) estimada em 10h:</p>
                <ul className="ml-4 space-y-1">
                  <li>✅ Gastou 5h-10h → <strong>EFICIENTE!</strong> (até 50% mais rápido é excelente)</li>
                  <li>✅ Gastou 11h-12h (até -20% de atraso) → <strong>Aceitável</strong></li>
                  <li>❌ Gastou 13h+ → <strong>Ineficiente</strong></li>
                </ul>
              </div>
              
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="font-medium mb-2">📕 Tarefa Complexa (nível 4-5) estimada em 10h:</p>
                <ul className="ml-4 space-y-1">
                  <li>✅ Gastou 5h-10h → <strong>EFICIENTE!</strong> (até 50% mais rápido é excelente)</li>
                  <li>✅ Gastou 11h-14h (até -40% de atraso) → <strong>Aceitável</strong> 🏆</li>
                  <li>❌ Gastou 15h+ → <strong>Ineficiente</strong></li>
                </ul>
                <p className="mt-2 text-xs italic text-blue-700 dark:text-blue-300">
                  💡 Tarefas complexas têm mais tolerância porque imprevistos são mais comuns!
                </p>
              </div>
              
              <p className="mt-3 font-medium bg-blue-100 dark:bg-blue-800/30 p-3 rounded-lg">
                💡 <strong>Importante:</strong> Ser rápido é sempre valorizado! Até 50% mais rápido que o estimado é considerado excelente. Tarefas complexas têm mais tolerância para atrasos porque reconhecemos que imprevistos são mais comuns. 🚀
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Entendi, Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

