import React, { useState } from 'react';
import {
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { SprintPerformanceMetrics, PerformanceInsight } from '../types';
import { formatHours } from '../utils/calculations';

interface DeveloperPerformanceCardProps {
  metrics: SprintPerformanceMetrics;
  insights: PerformanceInsight[];
  rank?: {
    overall: number;
    total: number;
  };
  onShowDetails?: () => void;
}

export const DeveloperPerformanceCard: React.FC<DeveloperPerformanceCardProps> = ({
  metrics,
  insights,
  rank,
  onShowDetails,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine card color based on performance score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700';
    if (score >= 75) return 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700';
    if (score >= 60) return 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700';
    if (score >= 45) return 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-300 dark:border-orange-700';
    return 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 75) return 'Muito Bom';
    if (score >= 60) return 'Bom';
    if (score >= 45) return 'Adequado';
    return 'Precisa Atenção';
  };

  const getTrendIcon = (tendency: boolean, isPositive: boolean) => {
    if (!tendency) return <Minus className="w-4 h-4" />;
    return isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getInsightIcon = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'negative':
        return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const cardColor = getScoreColor(metrics.performanceScore);

  return (
    <div
      className={`rounded-xl border-2 shadow-lg bg-gradient-to-br ${cardColor} transition-all duration-300 overflow-hidden`}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        {/* Disclaimer */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <Info className="w-3 h-3 inline mr-1" />
            <strong>Ferramenta de coaching:</strong> Use estas métricas para autoconhecimento e melhoria contínua, não como avaliação isolada.
          </p>
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {metrics.developerName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metrics.tasksStarted} tarefas • {formatHours(metrics.totalHoursWorked)}
              </p>
            </div>
          </div>
          {rank && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  #{rank.overall}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                de {rank.total} devs
              </p>
            </div>
          )}
        </div>

        {/* Performance Score */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Score de Performance
            </span>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.performanceScore.toFixed(0)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ 100</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                metrics.performanceScore >= 75
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : metrics.performanceScore >= 60
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                  : metrics.performanceScore >= 45
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{ width: `${metrics.performanceScore}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">
            {getScoreLabel(metrics.performanceScore)}
          </p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Accuracy - Informative Only */}
        <div className="space-y-1 relative">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Target className="w-3 h-3" />
            <span>Acurácia</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
              Info
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {metrics.accuracyRate.toFixed(0)}%
          </div>
          <div className="flex items-center gap-1 text-xs">
            {metrics.tendsToUnderestimate ? (
              <>
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Subestima</span>
              </>
            ) : metrics.tendsToOverestimate ? (
              <>
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span className="text-blue-600 dark:text-blue-400">Superestima</span>
              </>
            ) : (
              <>
                <Minus className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Balanceado</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-500 italic">
            Responsabilidade da equipe/analista
          </p>
        </div>

        {/* Quality */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Award className="w-3 h-3" />
            <span>Qualidade</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {metrics.qualityScore.toFixed(0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {metrics.reworkRate.toFixed(0)}% retrabalho
          </div>
        </div>

        {/* Utilization */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Zap className="w-3 h-3" />
            <span>Utilização</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {metrics.utilizationRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {formatHours(metrics.totalHoursWorked)} / 40h
          </div>
        </div>

        {/* Completion */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <CheckCircle className="w-3 h-3" />
            <span>Conclusão</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {metrics.completionRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {metrics.tasksCompleted} de {metrics.tasksStarted}
          </div>
        </div>
      </div>

      {/* Insights Preview (top 3) */}
      {insights.length > 0 && (
        <div className="px-5 pb-5">
          <div className="space-y-2">
            {insights.slice(0, isExpanded ? insights.length : 2).map((insight, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  insight.type === 'positive'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : insight.type === 'negative'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : insight.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {insight.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {insight.description}
                    </p>
                    {insight.recommendation && (
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 italic">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand/Collapse Button */}
      <div className="px-5 pb-5 flex gap-3">
        {insights.length > 2 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ver Menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Ver Mais ({insights.length - 2} insights)
              </>
            )}
          </button>
        )}
        {onShowDetails && (
          <button
            onClick={onShowDetails}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Ver Detalhes
          </button>
        )}
      </div>

      {/* Complexity Distribution (when expanded) */}
      {isExpanded && (
        <div className="px-5 pb-5">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Distribuição por Complexidade
          </h4>
          <div className="space-y-2">
            {metrics.complexityDistribution.map(({ level, count, avgAccuracy }) => {
              if (count === 0) return null;
              
              const percentage = (count / metrics.tasksStarted) * 100;
              const getComplexityColor = (lvl: number) => {
                if (lvl <= 2) return 'bg-green-500 dark:bg-green-400';
                if (lvl === 3) return 'bg-yellow-500 dark:bg-yellow-400';
                return 'bg-red-500 dark:bg-red-400';
              };

              return (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                    Nível {level}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${getComplexityColor(level)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-20 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500 w-24 text-right">
                    Acurácia: {avgAccuracy.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

