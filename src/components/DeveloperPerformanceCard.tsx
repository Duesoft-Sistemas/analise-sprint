import React, { useState } from 'react';
import {
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Calculator,
} from 'lucide-react';
import { SprintPerformanceMetrics, PerformanceInsight } from '../types';
import { formatHours } from '../utils/calculations';
import { CalculationBreakdownModal } from './CalculationBreakdownModal';

interface DeveloperPerformanceCardProps {
  metrics: SprintPerformanceMetrics;
  insights: PerformanceInsight[];
  rank?: {
    overall: number;
    total: number;
  };
  teamAverage?: {
    accuracyRate: number;
    totalHoursWorked: number;
    totalHoursEstimated: number;
    performanceScore: number;
    auxilioBonus?: number;
    overtimeBonus?: number;
  };
  sprintHistory?: Array<{
    sprintName: string;
    accuracyRate: number;
    performanceScore: number;
  }>;
}

export const DeveloperPerformanceCard: React.FC<DeveloperPerformanceCardProps> = ({
  metrics,
  insights,
  rank,
  teamAverage,
  sprintHistory,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

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
  
  // Calculate total bonuses
  const totalBonuses = 
    (metrics.complexityBonus || 0) + 
    (metrics.intermediateComplexityBonus || 0) + 
    (metrics.seniorityEfficiencyBonus || 0) + 
    (metrics.auxilioBonus || 0) +
    (metrics.overtimeBonus || 0);

  return (
    <div
      className={`rounded-xl border-2 shadow-lg bg-gradient-to-br ${cardColor} transition-all duration-300 overflow-hidden`}
    >
      {/* Header - Clean and Elegant */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm backdrop-blur-sm">
              <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {metrics.developerName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metrics.tasksCompleted} tarefas • {formatHours(metrics.totalHoursWorked)}
              </p>
            </div>
          </div>
          {rank && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  #{rank.overall}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                de {rank.total}
              </p>
            </div>
          )}
        </div>

        {/* Performance Score - Prominent */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Performance Score
            </span>
            <div className="text-right">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.performanceScore.toFixed(0)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ 150</span>
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-700 ${
                  metrics.performanceScore >= 75
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : metrics.performanceScore >= 60
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : metrics.performanceScore >= 45
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${Math.min(100, (metrics.performanceScore / 150) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {getScoreLabel(metrics.performanceScore)}
              </span>
              {totalBonuses > 0 && (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  +{totalBonuses} bonus
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics - Clean Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Execution Efficiency */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Eficiência
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {metrics.accuracyRate.toFixed(0)}%
            </div>
            <div className="flex items-center gap-1.5 text-xs">
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
          </div>

          {/* Quality */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Qualidade
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {metrics.qualityScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {metrics.avgTestNote !== undefined
                ? `Nota ${metrics.avgTestNote.toFixed(1)}/5`
                : 'Nota 5/5'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBreakdown(true)}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200/50 dark:border-gray-700/50"
            title="Ver breakdown detalhado dos cálculos"
          >
            <Calculator className="w-4 h-4" />
            Ver Cálculos
          </button>
          {(insights.length > 0 || teamAverage || (metrics.complexityBonus > 0 || metrics.seniorityEfficiencyBonus > 0 || metrics.auxilioBonus > 0 || metrics.overtimeBonus > 0)) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-lg transition-colors flex items-center gap-2 border border-gray-200/50 dark:border-gray-700/50"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Detalhes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
          {/* Team Comparison */}
          {teamAverage && (
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Comparação com Equipe
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Eficiência</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {metrics.accuracyRate.toFixed(0)}%
                    </span>
                    <span className={`text-xs font-medium ${
                      metrics.accuracyRate > teamAverage.accuracyRate
                        ? 'text-green-600 dark:text-green-400'
                        : metrics.accuracyRate < teamAverage.accuracyRate
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {metrics.accuracyRate > teamAverage.accuracyRate ? '▲' : metrics.accuracyRate < teamAverage.accuracyRate ? '▼' : '='} {Math.abs(metrics.accuracyRate - teamAverage.accuracyRate).toFixed(0)}pts
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Média: {teamAverage.accuracyRate.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Score</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {metrics.performanceScore.toFixed(0)}
                    </span>
                    <span className={`text-xs font-medium ${
                      metrics.performanceScore > teamAverage.performanceScore
                        ? 'text-green-600 dark:text-green-400'
                        : metrics.performanceScore < teamAverage.performanceScore
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {metrics.performanceScore > teamAverage.performanceScore ? '▲' : metrics.performanceScore < teamAverage.performanceScore ? '▼' : '='} {Math.abs(metrics.performanceScore - teamAverage.performanceScore).toFixed(0)}pts
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Média: {teamAverage.performanceScore.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bonuses Detail */}
          {(metrics.complexityBonus > 0 || (metrics.intermediateComplexityBonus || 0) > 0 || metrics.seniorityEfficiencyBonus > 0 || metrics.auxilioBonus > 0 || metrics.overtimeBonus > 0) && (
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                Bonuses Detalhados
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {metrics.complexityBonus > 0 && (
                  <div className="flex items-center justify-between p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded">
                    <span className="text-xs text-gray-700 dark:text-gray-300">🏆 Complexidade</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">+{metrics.complexityBonus}</span>
                  </div>
                )}
                {(metrics.intermediateComplexityBonus || 0) > 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded">
                    <span className="text-xs text-gray-700 dark:text-gray-300">🎯 Complexidade 3</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">+{metrics.intermediateComplexityBonus}</span>
                  </div>
                )}
                {metrics.seniorityEfficiencyBonus > 0 && (
                  <div className="flex items-center justify-between p-2 bg-indigo-50/50 dark:bg-indigo-900/20 rounded">
                    <span className="text-xs text-gray-700 dark:text-gray-300">⭐ Senioridade</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">+{metrics.seniorityEfficiencyBonus}</span>
                  </div>
                )}
                {metrics.auxilioBonus > 0 && (
                  <div className="flex items-center justify-between p-2 bg-green-50/50 dark:bg-green-900/20 rounded">
                    <span className="text-xs text-gray-700 dark:text-gray-300">🤝 Auxílio</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">+{metrics.auxilioBonus}</span>
                  </div>
                )}
                {metrics.overtimeBonus > 0 && (
                  <div className="flex items-center justify-between p-2 bg-orange-50/50 dark:bg-orange-900/20 rounded">
                    <span className="text-xs text-gray-700 dark:text-gray-300">⏰ Horas Extras</span>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">+{metrics.overtimeBonus}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                Insights
              </h4>
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      insight.type === 'positive'
                        ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : insight.type === 'negative'
                        ? 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : insight.type === 'warning'
                        ? 'bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
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

          {/* Complexity Distribution */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
              Distribuição por Complexidade
            </h4>
            <div className="space-y-2">
              {metrics.complexityDistribution.map(({ level, count }) => {
                if (count === 0) return null;
                const total = metrics.complexityDistribution.reduce((sum, d) => sum + d.count, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={level} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-12">
                      Nível {level}
                    </span>
                    <div className="flex-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          level >= 4 
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                            : level === 3
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sprint Evolution Chart */}
          {sprintHistory && sprintHistory.length > 1 && (
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                Evolução
              </h4>
              <div className="space-y-4">
                {/* Efficiency Evolution */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Eficiência
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {sprintHistory[0].accuracyRate.toFixed(0)}% → {sprintHistory[sprintHistory.length - 1].accuracyRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative h-12">
                    <div className="absolute inset-0 flex items-end">
                      {sprintHistory.map((sprint, idx) => {
                        const maxAccuracy = Math.max(...sprintHistory.map(s => s.accuracyRate), 100);
                        const height = (sprint.accuracyRate / maxAccuracy) * 100;
                        const isFirst = idx === 0;
                        const isLast = idx === sprintHistory.length - 1;
                        
                        return (
                          <div key={idx} className="flex-1 px-0.5 flex flex-col items-center justify-end group relative">
                            <div
                              className={`w-full rounded-t transition-all ${
                                sprint.accuracyRate >= 70 
                                  ? 'bg-green-500 dark:bg-green-400'
                                  : sprint.accuracyRate >= 50
                                  ? 'bg-yellow-500 dark:bg-yellow-400'
                                  : 'bg-red-500 dark:bg-red-400'
                              }`}
                              style={{ height: `${height}%` }}
                            />
                            {(isFirst || isLast || sprintHistory.length <= 5) && (
                              <div className="text-[8px] text-gray-500 dark:text-gray-500 mt-1 truncate w-full text-center">
                                {sprint.sprintName.slice(-3)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Performance Score Evolution */}
                <div className="pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Score
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {sprintHistory[0].performanceScore.toFixed(0)} → {sprintHistory[sprintHistory.length - 1].performanceScore.toFixed(0)}
                    </span>
                  </div>
                  <div className="relative h-12">
                    <div className="absolute inset-0 flex items-end">
                      {sprintHistory.map((sprint, idx) => {
                        const maxScore = Math.max(...sprintHistory.map(s => s.performanceScore), 100);
                        const height = (sprint.performanceScore / maxScore) * 100;
                        
                        return (
                          <div key={idx} className="flex-1 px-0.5 flex flex-col items-center justify-end group relative">
                            <div
                              className={`w-full rounded-t transition-all ${
                                sprint.performanceScore >= 75 
                                  ? 'bg-blue-500 dark:bg-blue-400'
                                  : sprint.performanceScore >= 60
                                  ? 'bg-yellow-500 dark:bg-yellow-400'
                                  : 'bg-orange-500 dark:bg-orange-400'
                              }`}
                              style={{ height: `${height}%` }}
                            />
                            {(idx === 0 || idx === sprintHistory.length - 1 || sprintHistory.length <= 5) && (
                              <div className="text-[8px] text-gray-500 dark:text-gray-500 mt-1 truncate w-full text-center">
                                {sprint.sprintName.slice(-3)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calculation Breakdown Modal */}
      <CalculationBreakdownModal
        metrics={metrics}
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
      />
    </div>
  );
};

