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
  Calendar,
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBreakdown(true)}
              className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2 border border-blue-200 dark:border-blue-800"
              title="Ver breakdown detalhado dos cálculos"
            >
              <Calculator className="w-4 h-4" />
              Ver Cálculos
            </button>
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
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ 140</span>
              {(metrics.complexityBonus > 0 || (metrics.intermediateComplexityBonus || 0) > 0 || metrics.seniorityEfficiencyBonus > 0) && (
                <div className="text-xs space-y-0.5">
                  {metrics.complexityBonus > 0 && (
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      +{metrics.complexityBonus} bonus complexidade (4-5) 🏆
                    </div>
                  )}
                  {(metrics.intermediateComplexityBonus || 0) > 0 && (
                    <div className="text-blue-600 dark:text-blue-400 font-medium">
                      +{metrics.intermediateComplexityBonus} bonus complexidade 3 🎯
                    </div>
                  )}
                  {metrics.seniorityEfficiencyBonus > 0 && (
                    <div className="text-purple-600 dark:text-purple-400 font-medium">
                      +{metrics.seniorityEfficiencyBonus} bonus senioridade ⭐
                    </div>
                  )}
                </div>
              )}
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
              style={{ width: `${Math.min(100, (metrics.performanceScore / 140) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">
            {getScoreLabel(metrics.performanceScore)}
          </p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Execution Efficiency (formerly Accuracy) */}
        <div className="space-y-1 relative">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Target className="w-3 h-3" />
            <span>Eficiência</span>
            {metrics.tasksImpactedByComplexityZone && metrics.tasksImpactedByComplexityZone > 0 && (
              <span
                className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded border border-yellow-300 dark:border-yellow-700"
                title={metrics.complexityZoneImpactDetails}
              >
                ⚠️ {metrics.tasksImpactedByComplexityZone}
              </span>
            )}
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
          {metrics.tasksImpactedByComplexityZone && metrics.tasksImpactedByComplexityZone > 0 && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-[10px] text-yellow-800 dark:text-yellow-200">
              <Info className="w-3 h-3 inline mr-1" />
              {metrics.complexityZoneImpactDetails}
            </div>
          )}
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
            {metrics.avgTestNote !== undefined
              ? <>Nota média {metrics.avgTestNote.toFixed(1)}/5</>
              : <>Nota média 5/5</>}
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

      {/* Reunioes Hours - Informative Only */}
      {metrics.reunioesHours > 0 && (
        <div className="px-5 pb-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 font-semibold">Reuniões:</span>
              <span className="text-blue-800 dark:text-blue-200 font-bold">
                {formatHours(metrics.reunioesHours)}
              </span>
              <span className="text-blue-600 dark:text-blue-400 opacity-75">
                ⓘ Informativo - não impacta o score
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Complexity Profile */}
      <div className="px-5 pb-3">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Perfil de Complexidade
            </h4>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Média: {metrics.avgComplexity.toFixed(1)}/5
              </div>
            </div>
          </div>
          
          {/* Complexity Distribution */}
          <div className="space-y-2 mb-3">
            {metrics.complexityDistribution.map(({ level, count }) => {
              const total = metrics.complexityDistribution.reduce((sum, d) => sum + d.count, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-12">
                    Nível {level}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        level >= 4 
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
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

          {/* Complexity, Seniority and Auxilio Bonuses */}
          {(metrics.complexityBonus > 0 || (metrics.intermediateComplexityBonus || 0) > 0 || metrics.seniorityEfficiencyBonus > 0 || metrics.auxilioBonus > 0) && (
            <div className="space-y-2">
              {metrics.complexityBonus > 0 && (
                <div className="bg-white/50 dark:bg-black/20 rounded-md p-3 border border-purple-300/50 dark:border-purple-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                          Bonus de Complexidade (4-5)
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {(() => {
                            const total = metrics.complexityDistribution.reduce((sum, d) => sum + d.count, 0);
                            const complex = metrics.complexityDistribution
                              .filter(d => d.level >= 4)
                              .reduce((sum, d) => sum + d.count, 0);
                            const pct = total > 0 ? ((complex / total) * 100).toFixed(0) : '0';
                            return `${pct}% tarefas complexas`;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      +{metrics.complexityBonus}
                    </div>
                  </div>
                </div>
              )}
              {(metrics.intermediateComplexityBonus || 0) > 0 && (
                <div className="bg-white/50 dark:bg-black/20 rounded-md p-3 border border-blue-300/50 dark:border-blue-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                          Bonus de Complexidade 3
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Executou tarefas complexidade 3 com alta eficiência
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      +{metrics.intermediateComplexityBonus}
                    </div>
                  </div>
                </div>
              )}
              {metrics.seniorityEfficiencyBonus > 0 && (
                <div className="bg-white/50 dark:bg-black/20 rounded-md p-3 border border-indigo-300/50 dark:border-indigo-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          Bonus de Senioridade
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Executou tarefas complexas com alta eficiência
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      +{metrics.seniorityEfficiencyBonus}
                    </div>
                  </div>
                </div>
              )}
              {metrics.auxilioBonus > 0 && (
                <div className="bg-white/50 dark:bg-black/20 rounded-md p-3 border border-green-300/50 dark:border-green-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🤝</span>
                      <div>
                        <div className="text-xs font-semibold text-green-700 dark:text-green-300">
                          Bonus de Auxílio
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Ajudou outros desenvolvedores
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      +{metrics.auxilioBonus}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Team Comparison (if available) */}
      {teamAverage && (
        <div className="px-5 pb-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Comparação com Média da Equipe
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Efficiency Comparison */}
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">Eficiência</div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {metrics.accuracyRate.toFixed(0)}%
                  </span>
                  <span className={`text-xs ${
                    metrics.accuracyRate > teamAverage.accuracyRate
                      ? 'text-green-600 dark:text-green-400'
                      : metrics.accuracyRate < teamAverage.accuracyRate
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {metrics.accuracyRate > teamAverage.accuracyRate ? '▲' : metrics.accuracyRate < teamAverage.accuracyRate ? '▼' : '='} {Math.abs(metrics.accuracyRate - teamAverage.accuracyRate).toFixed(0)}pts
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-500 text-[10px]">
                  Média: {teamAverage.accuracyRate.toFixed(0)}%
                </div>
              </div>

              {/* Performance Score Comparison */}
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">Score Geral</div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {metrics.performanceScore.toFixed(0)}
                  </span>
                  <span className={`text-xs ${
                    metrics.performanceScore > teamAverage.performanceScore
                      ? 'text-green-600 dark:text-green-400'
                      : metrics.performanceScore < teamAverage.performanceScore
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {metrics.performanceScore > teamAverage.performanceScore ? '▲' : metrics.performanceScore < teamAverage.performanceScore ? '▼' : '='} {Math.abs(metrics.performanceScore - teamAverage.performanceScore).toFixed(0)}pts
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-500 text-[10px]">
                  Média: {teamAverage.performanceScore.toFixed(0)}
                </div>
              </div>

              {/* Auxilio Bonus Comparison */}
              {teamAverage.auxilioBonus !== undefined && (
                <div className="col-span-2 mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Bonus de Auxílio</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-900 dark:text-white font-medium">Você: </span>
                      <span className="text-green-600 dark:text-green-400">
                        +{metrics.auxilioBonus}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Média: </span>
                      <span className="text-green-600 dark:text-green-400">
                        +{teamAverage.auxilioBonus.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
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

      {/* Sprint Evolution Chart (when expanded and history available) */}
      {isExpanded && sprintHistory && sprintHistory.length > 1 && (
        <div className="px-5 pb-5">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Evolução ao Longo dos Sprints
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Efficiency Evolution */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Eficiência de Execução
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {sprintHistory[0].accuracyRate.toFixed(0)}% → {sprintHistory[sprintHistory.length - 1].accuracyRate.toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-16">
                  {/* Grid lines */}
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
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            {sprint.sprintName}: {sprint.accuracyRate.toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Performance Score Evolution */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Score de Performance
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {sprintHistory[0].performanceScore.toFixed(0)} → {sprintHistory[sprintHistory.length - 1].performanceScore.toFixed(0)}
                  </span>
                </div>
                <div className="relative h-16">
                  {sprintHistory.map((sprint, idx) => {
                    const maxScore = Math.max(...sprintHistory.map(s => s.performanceScore), 100);
                    const height = (sprint.performanceScore / maxScore) * 100;
                    
                    return (
                      <div key={idx} className="flex-1 px-0.5 flex flex-col items-center justify-end group relative inline-block" style={{ width: `${100 / sprintHistory.length}%` }}>
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
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          {sprint.sprintName}: {sprint.performanceScore.toFixed(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
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

