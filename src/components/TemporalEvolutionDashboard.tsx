import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Award,
  Target,
  Zap,
  BarChart3,
  Info,
  LineChart,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSprintStore } from '../store/useSprintStore';
import { calculateTemporalEvolution } from '../services/temporalAnalytics';
import {
  TemporalAggregation,
  DeveloperTemporalEvolution,
} from '../types';
import { getDefaultSelectedDevelopers } from '../services/configService';

export const TemporalEvolutionDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);
  const worklogs = useSprintStore((state) => state.worklogs);
  
  const [aggregationType, setAggregationType] = useState<TemporalAggregation>('sprint');
  const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);
  const [showBonuses, setShowBonuses] = useState<boolean>(true); // Default: show bonuses

  // Calculate temporal evolution
  const temporalAnalytics = useMemo(() => {
    if (tasks.length === 0 || !sprintMetadata || sprintMetadata.length === 0) {
      return null;
    }
    return calculateTemporalEvolution(tasks, sprintMetadata, aggregationType, worklogs);
  }, [tasks, sprintMetadata, aggregationType, worklogs]);

  // Get current developer data
  const currentDeveloper = useMemo(() => {
    if (!temporalAnalytics || !selectedDeveloper) return null;
    return temporalAnalytics.developers.find(d => d.developerId === selectedDeveloper) || null;
  }, [temporalAnalytics, selectedDeveloper]);

  // Auto-select developer based on default config or first available
  useEffect(() => {
    if (temporalAnalytics && !selectedDeveloper && temporalAnalytics.developers.length > 0) {
      const defaultDevs = getDefaultSelectedDevelopers();
      
      // If there are default devs configured, try to match them with available developers
      if (defaultDevs.length > 0) {
        // Try to find a matching developer by name or id
        const matchedDev = temporalAnalytics.developers.find(dev => 
          defaultDevs.includes(dev.developerName) || 
          defaultDevs.includes(dev.developerId)
        );
        
        // Use matched dev if found, otherwise use first available
        setSelectedDeveloper(matchedDev?.developerId || temporalAnalytics.developers[0].developerId);
      } else {
        // No defaults configured, select first developer
        setSelectedDeveloper(temporalAnalytics.developers[0].developerId);
      }
    }
  }, [temporalAnalytics, selectedDeveloper]);

  if (tasks.length === 0 || !sprintMetadata || sprintMetadata.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Info className="w-12 h-12 text-gray-400 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Para visualizar a evolução temporal, é necessário fazer upload das três planilhas:
          <br />
          <strong>Layout, Worklog e Sprints</strong>
        </p>
      </div>
    );
  }

  if (!temporalAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Calculando evolução temporal...</p>
      </div>
    );
  }

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'stable':
        return <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendLabel = (trend: 'improving' | 'declining' | 'stable' | 'increasing' | 'decreasing') => {
    switch (trend) {
      case 'improving':
      case 'increasing':
        return 'Melhorando';
      case 'declining':
      case 'decreasing':
        return 'Declinando';
      case 'stable':
        return 'Estável';
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 10) return 'text-green-600 dark:text-green-400';
    if (growth < -10) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Prepare chart data for recharts
  const prepareChartData = (dev: DeveloperTemporalEvolution) => {
    const teamAvgMap = new Map(temporalAnalytics.teamAverages.map(t => [t.periodId, t]));
    
    return dev.periods.map(period => {
      const teamAvg = teamAvgMap.get(period.periodId);
      // Use avgPerformanceScoreWithBonus if available and showBonuses is true, otherwise use avgPerformanceScore
      const performanceScore = showBonuses && period.avgPerformanceScoreWithBonus !== undefined
        ? period.avgPerformanceScoreWithBonus
        : period.avgPerformanceScore;
      // Team average: for now, we'll use the same logic (without bonus) since team averages don't have bonus info
      // TODO: In the future, we might want to calculate team averages with bonuses too
      const teamPerformanceScore = teamAvg ? teamAvg.avgPerformanceScore : null;
      
      return {
        period: period.periodLabel,
        periodId: period.periodId,
        performance: Math.round(performanceScore),
        teamPerformance: teamPerformanceScore !== null ? Math.round(teamPerformanceScore) : null,
        quality: Math.round(period.avgQualityScore),
        teamQuality: teamAvg ? Math.round(teamAvg.avgQualityScore) : null,
        accuracy: Math.round(period.avgAccuracyRate),
        teamAccuracy: teamAvg ? Math.round(teamAvg.avgAccuracyRate) : null,
        complexity: parseFloat(period.avgComplexity.toFixed(1)),
        tasks: period.totalTasksCompleted,
        sprints: period.totalSprints,
      };
    });
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
              {(entry.dataKey === 'performance' || entry.dataKey === 'quality' || entry.dataKey === 'accuracy' || entry.dataKey === 'teamPerformance' || entry.dataKey === 'teamQuality' || entry.dataKey === 'teamAccuracy') ? '' : 
               entry.dataKey === 'complexity' ? ' (média)' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate trend based on time series data using linear regression
  const calculateTrend = (values: number[]): 'improving' | 'declining' | 'stable' => {
    if (values.length < 2) return 'stable';

    // Simple linear regression
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = values[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;

    // Threshold for considering a trend significant
    const threshold = 0.5;

    if (slope > threshold) return 'improving';
    if (slope < -threshold) return 'declining';
    return 'stable';
  };

  // Calculate statistics based on showBonuses toggle
  const calculateDisplayStatistics = (dev: DeveloperTemporalEvolution) => {
    const scores = dev.periods.map(p => 
      showBonuses && p.avgPerformanceScoreWithBonus !== undefined
        ? p.avgPerformanceScoreWithBonus
        : p.avgPerformanceScore
    );
    const sortedScores = [...scores].sort((a, b) => a - b);
    
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const median = sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)];
    
    // Standard deviation
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Consistency score (inverse of coefficient of variation)
    const coefficientOfVariation = avg === 0 ? 0 : stdDev / avg;
    const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100));
    
    return {
      avgPerformanceScore: avg,
      medianPerformanceScore: median,
      minPerformanceScore: min,
      maxPerformanceScore: max,
      performanceStdDev: stdDev,
      consistencyScore,
    };
  };

  // Generate career insights based on recalculated metrics
  const generateDisplayInsights = (
    dev: DeveloperTemporalEvolution,
    displayTrendAndGrowth: ReturnType<typeof calculateDisplayTrendAndGrowth>,
    displayStats: ReturnType<typeof calculateDisplayStatistics>
  ) => {
    const insights: typeof dev.careerInsights = [];
    const { trend, growth } = displayTrendAndGrowth;

    // Performance trend insights
    if (trend.performance === 'improving') {
      insights.push({
        type: 'positive',
        title: 'Evolução Positiva de Performance',
        description: `Performance melhorou ${growth.performanceGrowth.toFixed(1)}% ao longo do período analisado.`,
        metric: 'Performance',
        recommendation: 'Continue o excelente trabalho! Considere compartilhar suas práticas com a equipe.'
      });
    } else if (trend.performance === 'declining') {
      insights.push({
        type: 'negative',
        title: 'Declínio na Performance',
        description: `Performance diminuiu ${Math.abs(growth.performanceGrowth).toFixed(1)}% no período.`,
        metric: 'Performance',
        recommendation: 'Recomendamos uma conversa 1:1 para identificar possíveis bloqueios ou necessidades de suporte.'
      });
    }

    // Quality trend insights
    if (trend.quality === 'improving') {
      insights.push({
        type: 'positive',
        title: 'Melhoria Contínua na Qualidade',
        description: `Qualidade do código melhorou ${growth.qualityGrowth.toFixed(1)}% ao longo do tempo.`,
        metric: 'Qualidade',
      });
    } else if (trend.quality === 'declining') {
      insights.push({
        type: 'negative',
        title: 'Qualidade Precisa Atenção',
        description: `Qualidade (nota de teste) diminuiu ao longo do período.`,
        metric: 'Qualidade',
        recommendation: 'Considere revisar processos de code review e aumentar cobertura de testes.'
      });
    }

    // Complexity growth insights
    if (trend.complexity === 'increasing') {
      insights.push({
        type: 'positive',
        title: 'Assumindo Tarefas Mais Complexas',
        description: `Complexidade média aumentou ${growth.complexityGrowth.toFixed(1)}%, indicando crescimento técnico.`,
        metric: 'Complexidade',
        recommendation: 'Excelente! Está assumindo desafios maiores. Considere para promoção ou tarefas de liderança técnica.'
      });
    }

    // Consistency insights
    if (displayStats.consistencyScore >= 80) {
      insights.push({
        type: 'positive',
        title: 'Performance Consistente',
        description: `Mantém performance estável com score de consistência de ${displayStats.consistencyScore.toFixed(0)}/100.`,
        metric: 'Consistência',
      });
    } else if (displayStats.consistencyScore < 60) {
      insights.push({
        type: 'neutral',
        title: 'Variação na Performance',
        description: `Performance varia significativamente entre períodos (consistência: ${displayStats.consistencyScore.toFixed(0)}/100).`,
        metric: 'Consistência',
        recommendation: 'Identifique fatores que causam variação (tipo de tarefa, carga, etc) para estabilizar performance.'
      });
    }

    // Overall growth insights
    if (growth.totalGrowthScore >= 20) {
      insights.push({
        type: 'positive',
        title: '🏆 Crescimento Excepcional',
        description: `Crescimento total de ${growth.totalGrowthScore.toFixed(1)}% em múltiplas dimensões.`,
        recommendation: 'Forte candidato para promoção ou aumento de responsabilidades.'
      });
    } else if (growth.totalGrowthScore < -10) {
      insights.push({
        type: 'negative',
        title: 'Regressão nas Métricas',
        description: `Métricas gerais diminuíram ${Math.abs(growth.totalGrowthScore).toFixed(1)}% no período.`,
        recommendation: 'Agende reunião para discutir desafios e plano de desenvolvimento individual.'
      });
    }

    // Recent performance check (last period vs average)
    if (dev.periods.length >= 2) {
      const lastPeriod = dev.periods[dev.periods.length - 1];
      const lastPeriodScore = showBonuses && lastPeriod.avgPerformanceScoreWithBonus !== undefined
        ? lastPeriod.avgPerformanceScoreWithBonus
        : lastPeriod.avgPerformanceScore;
      const avgScore = displayStats.avgPerformanceScore;
      const difference = avgScore > 0 ? ((lastPeriodScore - avgScore) / avgScore) * 100 : 0;

      if (difference > 15) {
        insights.push({
          type: 'positive',
          title: 'Performance Recente Acima da Média',
          description: `Última performance (${lastPeriodScore.toFixed(0)}) está ${difference.toFixed(0)}% acima da média pessoal.`,
        });
      } else if (difference < -15) {
        insights.push({
          type: 'negative',
          title: 'Performance Recente Abaixo da Média',
          description: `Última performance está ${Math.abs(difference).toFixed(0)}% abaixo da média pessoal.`,
          recommendation: 'Verifique se há bloqueios ou desafios específicos no período recente.'
        });
      }
    }

    return insights;
  };

  // Calculate trend and growth metrics based on showBonuses toggle
  const calculateDisplayTrendAndGrowth = (dev: DeveloperTemporalEvolution) => {
    const performanceScores = dev.periods.map(p => 
      showBonuses && p.avgPerformanceScoreWithBonus !== undefined
        ? p.avgPerformanceScoreWithBonus
        : p.avgPerformanceScore
    );
    const accuracyScores = dev.periods.map(p => p.avgAccuracyRate);
    const qualityScores = dev.periods.map(p => p.avgQualityScore);
    const complexityScores = dev.periods.map(p => p.avgComplexity);
    
    const performanceTrend = calculateTrend(performanceScores);
    const accuracyTrend = calculateTrend(accuracyScores);
    const qualityTrend = calculateTrend(qualityScores);
    const complexityTrend = calculateTrend(complexityScores);
    
    // Calculate growth metrics (first to last period)
    if (dev.periods.length === 0) {
      return {
        trend: {
          performance: 'stable' as const,
          accuracy: 'stable' as const,
          quality: 'stable' as const,
          complexity: 'stable' as const,
        },
        growth: {
          performanceGrowth: 0,
          accuracyGrowth: 0,
          qualityGrowth: 0,
          complexityGrowth: 0,
          totalGrowthScore: 0,
        },
      };
    }
    
    const firstPeriod = dev.periods[0];
    const lastPeriod = dev.periods[dev.periods.length - 1];
    
    const firstPerformanceScore = showBonuses && firstPeriod.avgPerformanceScoreWithBonus !== undefined
      ? firstPeriod.avgPerformanceScoreWithBonus
      : firstPeriod.avgPerformanceScore;
    const lastPerformanceScore = showBonuses && lastPeriod.avgPerformanceScoreWithBonus !== undefined
      ? lastPeriod.avgPerformanceScoreWithBonus
      : lastPeriod.avgPerformanceScore;
    
    const performanceGrowth = firstPerformanceScore > 0
      ? ((lastPerformanceScore - firstPerformanceScore) / firstPerformanceScore) * 100
      : 0;
    const accuracyGrowth = firstPeriod.avgAccuracyRate > 0
      ? ((lastPeriod.avgAccuracyRate - firstPeriod.avgAccuracyRate) / firstPeriod.avgAccuracyRate) * 100
      : 0;
    const qualityGrowth = firstPeriod.avgQualityScore > 0
      ? ((lastPeriod.avgQualityScore - firstPeriod.avgQualityScore) / firstPeriod.avgQualityScore) * 100
      : 0;
    const complexityGrowth = firstPeriod.avgComplexity > 0
      ? ((lastPeriod.avgComplexity - firstPeriod.avgComplexity) / firstPeriod.avgComplexity) * 100
      : 0;
    
    // Weighted total growth score (performance and quality are more important)
    const totalGrowthScore = (
      performanceGrowth * 0.4 +
      qualityGrowth * 0.3 +
      accuracyGrowth * 0.2 +
      complexityGrowth * 0.1
    );
    
    return {
      trend: {
        performance: performanceTrend,
        accuracy: accuracyTrend,
        quality: qualityTrend,
        complexity: complexityTrend === 'improving' ? 'increasing' as const :
                   complexityTrend === 'declining' ? 'decreasing' as const : 'stable' as const,
      },
      growth: {
        performanceGrowth,
        accuracyGrowth,
        qualityGrowth,
        complexityGrowth,
        totalGrowthScore,
      },
    };
  };

  const renderDeveloperEvolution = (dev: DeveloperTemporalEvolution) => {
    const chartData = prepareChartData(dev);
    const displayStats = calculateDisplayStatistics(dev);
    const displayTrendAndGrowth = calculateDisplayTrendAndGrowth(dev);
    const displayInsights = generateDisplayInsights(dev, displayTrendAndGrowth, displayStats);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall Trend */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tendência Geral
              </span>
              {getTrendIcon(displayTrendAndGrowth.trend.performance)}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {getTrendLabel(displayTrendAndGrowth.trend.performance)}
            </p>
            <p className={`text-sm mt-1 ${getGrowthColor(displayTrendAndGrowth.growth.performanceGrowth)}`}>
              {displayTrendAndGrowth.growth.performanceGrowth > 0 ? '+' : ''}
              {displayTrendAndGrowth.growth.performanceGrowth.toFixed(1)}% no período
            </p>
          </div>

          {/* Average Score */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Score Médio
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {displayStats.avgPerformanceScore.toFixed(0)}
              <span className="text-lg text-gray-500 dark:text-gray-400">/{showBonuses ? 130 : 100}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Variação: {displayStats.minPerformanceScore.toFixed(0)} - {displayStats.maxPerformanceScore.toFixed(0)}
            </p>
          </div>

          {/* Consistency */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Consistência
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {displayStats.consistencyScore.toFixed(0)}
              <span className="text-lg text-gray-500 dark:text-gray-400">/100</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {displayStats.consistencyScore >= 80 ? 'Muito consistente' :
               displayStats.consistencyScore >= 60 ? 'Consistente' : 'Variável'}
            </p>
          </div>

          {/* Growth Score */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Crescimento Total
              </span>
            </div>
            <p className={`text-2xl font-bold ${getGrowthColor(displayTrendAndGrowth.growth.totalGrowthScore)}`}>
              {displayTrendAndGrowth.growth.totalGrowthScore > 0 ? '+' : ''}
              {displayTrendAndGrowth.growth.totalGrowthScore.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {dev.periods.length} {aggregationType === 'monthly' ? 'meses' :
               aggregationType === 'quarterly' ? 'trimestres' :
               aggregationType === 'semiannual' ? 'semestres' : 'anos'}
            </p>
          </div>
        </div>

        {/* Main Performance Chart with Team Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Evolução do Performance Score
              {showBonuses && (
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  (Com Bônus - máx 130)
                </span>
              )}
              {!showBonuses && (
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  (Sem Bônus - máx 100)
                </span>
              )}
            </h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis 
                dataKey="period" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                style={{ fill: 'currentColor' }}
              />
              <YAxis 
                domain={showBonuses ? [0, 130] : [0, 100]}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                style={{ fill: 'currentColor' }}
                label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'currentColor' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="performance" 
                name="Desenvolvedor"
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line 
                type="monotone" 
                dataKey="teamPerformance" 
                name="Média da Equipe"
                stroke="#9ca3af" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#9ca3af', r: 4 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>

        {/* Combined Metrics Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Evolução de Métricas Principais
          </h3>
          
          <ResponsiveContainer width="100%" height={350}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis 
                dataKey="period" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                style={{ fill: 'currentColor' }}
              />
              <YAxis 
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                style={{ fill: 'currentColor' }}
                label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'currentColor' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="performance" 
                name="Performance"
                stroke="#3b82f6" 
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="quality" 
                name="Qualidade"
                stroke="#10b981" 
                strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                name="Acurácia"
                stroke="#f59e0b" 
                strokeWidth={2.5}
                dot={{ fill: '#f59e0b', r: 4 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>

        {/* Quality and Accuracy Charts Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Evolution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Evolução da Qualidade
            </h3>
            
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="period" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  style={{ fill: 'currentColor' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  style={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="quality" 
                  name="Qualidade"
                  stroke="#10b981" 
                  fill="url(#colorQuality)"
                  strokeWidth={2}
                />
                {chartData.some(d => d.teamQuality !== null) && (
                  <Line 
                    type="monotone" 
                    dataKey="teamQuality" 
                    name="Média da Equipe"
                    stroke="#9ca3af" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#9ca3af', r: 3 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getTrendIcon(displayTrendAndGrowth.trend.quality)}
                <span className="text-gray-700 dark:text-gray-300">
                  {getTrendLabel(displayTrendAndGrowth.trend.quality)}
                </span>
              </div>
              <span className={`font-medium ${getGrowthColor(displayTrendAndGrowth.growth.qualityGrowth)}`}>
                {displayTrendAndGrowth.growth.qualityGrowth > 0 ? '+' : ''}
                {displayTrendAndGrowth.growth.qualityGrowth.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Accuracy Evolution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Evolução da Acurácia
            </h3>
            
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="period" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  style={{ fill: 'currentColor' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  style={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  name="Acurácia"
                  stroke="#f59e0b" 
                  fill="url(#colorAccuracy)"
                  strokeWidth={2}
                />
                {chartData.some(d => d.teamAccuracy !== null) && (
                  <Line 
                    type="monotone" 
                    dataKey="teamAccuracy" 
                    name="Média da Equipe"
                    stroke="#9ca3af" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#9ca3af', r: 3 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getTrendIcon(displayTrendAndGrowth.trend.accuracy)}
                <span className="text-gray-700 dark:text-gray-300">
                  {getTrendLabel(displayTrendAndGrowth.trend.accuracy)}
                </span>
              </div>
              <span className={`font-medium ${getGrowthColor(displayTrendAndGrowth.growth.accuracyGrowth)}`}>
                {displayTrendAndGrowth.growth.accuracyGrowth > 0 ? '+' : ''}
                {displayTrendAndGrowth.growth.accuracyGrowth.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Complexity Evolution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Evolução de Complexidade das Tarefas
          </h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorComplexity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis 
                dataKey="period" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                style={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                style={{ fill: 'currentColor' }}
                label={{ value: 'Complexidade', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'currentColor' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="complexity" 
                name="Complexidade Média"
                stroke="#8b5cf6" 
                fill="url(#colorComplexity)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {getTrendIcon(
                displayTrendAndGrowth.trend.complexity === 'increasing' ? 'improving' :
                displayTrendAndGrowth.trend.complexity === 'decreasing' ? 'declining' : 'stable'
              )}
              <span className="text-gray-700 dark:text-gray-300">
                {getTrendLabel(displayTrendAndGrowth.trend.complexity)}
              </span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              {displayTrendAndGrowth.growth.complexityGrowth > 0 ? '+' : ''}
              {displayTrendAndGrowth.growth.complexityGrowth.toFixed(1)}% 
              {displayTrendAndGrowth.growth.complexityGrowth > 10 && (
                <span className="text-green-600 dark:text-green-400 ml-2">✨ Desafiador!</span>
              )}
            </span>
          </div>
        </div>

        {/* Career Insights */}
        {displayInsights.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💡 Insights para Plano de Carreira
            </h3>
            
            <div className="space-y-3">
              {displayInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'positive' 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                      : insight.type === 'negative'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {insight.description}
                  </p>
                  {insight.recommendation && (
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      💡 {insight.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          Evolução Temporal
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Análise de evolução de performance ao longo do tempo para avaliação de plano de carreira
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Aggregation Type Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Agregação:
          </span>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['sprint', 'monthly', 'quarterly', 'semiannual', 'annual'] as TemporalAggregation[]).map((type) => (
              <button
                key={type}
                onClick={() => setAggregationType(type)}
                className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                  aggregationType === type
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {type === 'monthly' ? 'Mensal' :
                 type === 'quarterly' ? 'Trimestral' :
                 type === 'semiannual' ? 'Semestral' :
                 type === 'annual' ? 'Anual' : 'Por Sprint'}
              </button>
            ))}
          </div>
        </div>

        {/* Developer Selector */}
        {temporalAnalytics.developers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Desenvolvedor:
            </span>
            <select
              value={selectedDeveloper || ''}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm font-medium"
            >
              {temporalAnalytics.developers.map((dev) => (
                <option key={dev.developerId} value={dev.developerId}>
                  {dev.developerName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bonus Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <Award className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bônus:
          </span>
          <button
            onClick={() => setShowBonuses(!showBonuses)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              showBonuses
                ? 'bg-blue-600 dark:bg-blue-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            title={showBonuses ? 'Mostrando com bônus (score até 130)' : 'Mostrando sem bônus (score até 100)'}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                showBonuses ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {showBonuses ? 'Com Bônus' : 'Sem Bônus'}
          </span>
        </div>
      </div>

      {/* Developer Evolution Content */}
      {currentDeveloper ? (
        renderDeveloperEvolution(currentDeveloper)
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Selecione um desenvolvedor para ver a evolução temporal
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">Sobre esta análise</p>
            <p>
              Esta ferramenta agrega métricas de performance em períodos de tempo para facilitar a 
              avaliação de evolução profissional e plano de carreira. Use os insights gerados para 
              conversas 1:1, avaliações de desempenho e identificação de oportunidades de crescimento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

