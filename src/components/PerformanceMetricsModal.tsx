import React from 'react';
import { X, HelpCircle, TrendingUp, Target, Award, Zap, CheckCircle, BarChart3 } from 'lucide-react';
import { MetricExplanation } from '../types';
import { METRIC_EXPLANATIONS } from '../services/performanceAnalytics';

interface PerformanceMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const METRIC_ICONS: Record<string, React.ReactNode> = {
  estimationAccuracy: <Target className="w-5 h-5" />,
  accuracyRate: <CheckCircle className="w-5 h-5" />,
  reworkRate: <TrendingUp className="w-5 h-5" />,
  bugRate: <Award className="w-5 h-5" />,
  qualityScore: <Award className="w-5 h-5" />,
  utilizationRate: <Zap className="w-5 h-5" />,
  completionRate: <CheckCircle className="w-5 h-5" />,
  consistencyScore: <BarChart3 className="w-5 h-5" />,
  performanceScore: <Award className="w-5 h-5" />,
  bugsVsFeatures: <BarChart3 className="w-5 h-5" />,
};

const METRIC_CATEGORIES = {
  'Eficiência de Execução': ['accuracyRate', 'estimationAccuracy', 'consistencyScore'],
  'Qualidade': ['reworkRate', 'bugRate', 'qualityScore', 'bugsVsFeatures'],
  'Conclusão': ['completionRate'],
  'Contexto (não pontua)': ['utilizationRate'],
  'Score Geral': ['performanceScore'],
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
      reworkRate: 'Taxa de Retrabalho',
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
          {Object.entries(METRIC_CATEGORIES).map(([category, metricKeys]) => (
            <div key={category} className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                {category}
              </h3>
              <div className="grid gap-4">
                {metricKeys.map(key => {
                  const explanation = METRIC_EXPLANATIONS[key];
                  return explanation ? renderMetric(key, explanation) : null;
                })}
              </div>
            </div>
          ))}

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Dica: Como Usar Essas Métricas
            </h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• <strong>Qualidade (40% do score):</strong> Agora baseada na <strong>Nota de Teste (1–5)</strong> por tarefa, escalada para 0–100. Vazio conta como 5.</li>
              <li>• <strong>Eficiência de Execução (35% do score):</strong> Capacidade de executar dentro do estimado ajustado por complexidade. Tarefas complexas têm mais tolerância</li>
              <li>• <strong>Conclusão (25% do score):</strong> Foque em finalizar tarefas iniciadas antes de começar novas</li>
              <li>• <strong>Utilização (não pontua):</strong> Métrica de contexto para identificar sobrecarga. Todos registram ~40h, então não diferencia performance</li>
              <li>• <strong>Bonus de Complexidade (+10 pontos):</strong> Trabalhar em tarefas complexas (nível 4-5) adiciona até +10 pontos ao score final</li>
              <li>• <strong>Score Total:</strong> Base (0-100) + Bonus de Complexidade (0-10) = Máximo 110 pontos 🏆</li>
            </ul>
          </div>
          
          {/* New Features Notice */}
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              🆕 Novidades (v1.3 - Atual)
            </h4>
            <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
              <li>• 🎯 <strong>Score mais justo:</strong> Utilização removida (não diferencia quem registra ~40h)</li>
              <li>• 📊 <strong>Nova distribuição:</strong> 40% Qualidade + 35% Eficiência + 25% Conclusão</li>
              <li>• 🏆 Qualidade agora vale mais (35% → 40%)</li>
              <li>• ⚡ Eficiência ganha peso (25% → 35%)</li>
            </ul>
            
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mt-3 mb-2">
              Recursos (v1.2)
            </h4>
            <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
              <li>• 🏆 <strong>Bonus de Complexidade:</strong> Até +10 pontos por trabalhar em tarefas complexas!</li>
              <li>• 🎯 <strong>Limites dinâmicos:</strong> Tarefas complexas têm mais tolerância para atrasos (-40% vs -15%)</li>
              <li>• ⚡ <strong>Executar mais rápido não penaliza!</strong> Até +50% mais rápido é excelente</li>
              <li>• 📊 Gráfico visual de Estimado vs Gasto + Perfil de Complexidade</li>
              <li>• 👥 Comparação com média da equipe (modo "Por Sprint")</li>
              <li>• 📈 Gráficos de evolução histórica de eficiência e score</li>
            </ul>
          </div>
          
          {/* Efficiency Logic Explanation */}
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              ⚡ Como a Eficiência é Calculada (Ajustada por Complexidade)
            </h4>
            <div className="space-y-3 text-sm text-green-800 dark:text-green-200">
              <div>
                <p className="font-medium">📘 Tarefa Simples (nível 1-2) estimada em 10h:</p>
                <ul className="ml-4 space-y-1 mt-1">
                  <li>✅ 5h-10h → <strong>EFICIENTE!</strong></li>
                  <li>✅ 11h-11.5h (até -15% de atraso) → <strong>Aceitável</strong></li>
                  <li>❌ 12h+ → <strong>Ineficiente</strong></li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium">📗 Tarefa Média (nível 3) estimada em 10h:</p>
                <ul className="ml-4 space-y-1 mt-1">
                  <li>✅ 5h-10h → <strong>EFICIENTE!</strong></li>
                  <li>✅ 11h-12h (até -20% de atraso) → <strong>Aceitável</strong></li>
                  <li>❌ 13h+ → <strong>Ineficiente</strong></li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium">📕 Tarefa Complexa (nível 4-5) estimada em 10h:</p>
                <ul className="ml-4 space-y-1 mt-1">
                  <li>✅ 5h-10h → <strong>EFICIENTE!</strong></li>
                  <li>✅ 11h-14h (até -30% a -40% de atraso) → <strong>Aceitável</strong> 🏆</li>
                  <li>❌ 15h+ → <strong>Ineficiente</strong></li>
                </ul>
                <p className="mt-1 text-xs italic">+ Ganhe até +10 pontos de bonus no score final!</p>
              </div>
              
              <p className="mt-2 font-medium bg-green-100 dark:bg-green-800/30 p-2 rounded">
                💡 Ser rápido é sempre valorizado! Tarefas complexas têm mais tolerância para imprevistos 🚀
              </p>
            </div>
          </div>

          {/* Legend for Score Interpretation */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              📊 Interpretação de Scores (0-100)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-700 dark:text-gray-300">90+: Excelente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-700 dark:text-gray-300">75-90: Muito Bom</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm text-gray-700 dark:text-gray-300">60-75: Bom</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-sm text-gray-700 dark:text-gray-300">45-60: Adequado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm text-gray-700 dark:text-gray-300">&lt;45: Atenção</span>
              </div>
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

