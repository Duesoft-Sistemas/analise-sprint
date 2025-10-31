import React, { useMemo } from 'react';
import { X, Package, Layers, TrendingUp, Zap, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { DeveloperDetailedAnalytics } from '../services/detailedDeveloperAnalytics';
import { formatHours } from '../utils/calculations';

interface DeveloperDetailedAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: DeveloperDetailedAnalytics | null;
}

export const DeveloperDetailedAnalysisModal: React.FC<DeveloperDetailedAnalysisModalProps> = ({
  isOpen,
  onClose,
  analytics,
}) => {
  if (!isOpen || !analytics) return null;

  // Prepare chart data for features
  const featureChartData = useMemo(() => {
    return analytics.byFeature.slice(0, 10).map(f => ({
      name: f.feature || 'N/A',
      performance: Math.round(f.avgPerformanceScore),
      accuracy: Math.round(f.avgAccuracyRate),
      quality: Math.round(f.avgQualityScore),
      tasks: f.taskCount,
      hours: Math.round(f.totalHoursWorked),
    }));
  }, [analytics.byFeature]);

  // Prepare chart data for modules
  const moduleChartData = useMemo(() => {
    return analytics.byModule.slice(0, 10).map(m => ({
      name: m.module || 'N/A',
      performance: Math.round(m.avgPerformanceScore),
      accuracy: Math.round(m.avgAccuracyRate),
      quality: Math.round(m.avgQualityScore),
      tasks: m.taskCount,
      hours: Math.round(m.totalHoursWorked),
    }));
  }, [analytics.byModule]);

  // Prepare chart data for complexity
  const complexityChartData = useMemo(() => {
    return analytics.byComplexity
      .filter(c => c.taskCount > 0)
      .map(c => ({
        level: `Nível ${c.level}`,
        performance: Math.round(c.avgPerformanceScore),
        accuracy: Math.round(c.avgAccuracyRate),
        quality: Math.round(c.avgQualityScore),
        tasks: c.taskCount,
        avgHours: c.avgHoursPerTask.toFixed(1),
        best: c.bestPerformance,
      }));
  }, [analytics.byComplexity]);

  // Prepare chart data for workload
  const workloadChartData = useMemo(() => {
    return analytics.workloadAnalysis.map(w => ({
      sprint: w.sprintName.split(' ').pop() || w.sprintName,
      hours: Math.round(w.hoursWorked),
      quality: Math.round(w.qualityScore),
      performance: Math.round(w.performanceScore),
      overcapacity: w.overcapacity,
      threshold: analytics.capacityThreshold,
    }));
  }, [analytics.workloadAnalysis, analytics.capacityThreshold]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getInsightIcon = (type: 'positive' | 'negative' | 'neutral' | 'recommendation') => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'negative':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'recommendation':
        return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-7xl max-h-[95vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Análise Detalhada: {analytics.developerName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Performance por Feature, Módulo, Complexidade e Capacidade
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Insights */}
          {analytics.insights.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Insights e Recomendações
              </h3>
              <div className="space-y-3">
                {analytics.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'positive'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                        : insight.type === 'negative'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : insight.type === 'recommendation'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance by Feature */}
          {analytics.byFeature.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Performance por Feature
              </h3>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: 'currentColor' }}
                    style={{ fill: 'currentColor', fontSize: '12px' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: 'currentColor' }}
                    style={{ fill: 'currentColor' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="performance" name="Performance Score" fill="#3b82f6" />
                  <Bar dataKey="accuracy" name="Acurácia" fill="#10b981" />
                  <Bar dataKey="quality" name="Qualidade" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>

              {/* Feature Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-2 text-gray-700 dark:text-gray-300">Feature</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Tarefas</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Horas</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Performance</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Acurácia</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Qualidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byFeature.slice(0, 10).map((feature, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="p-2 text-gray-900 dark:text-white font-medium">{feature.feature || 'N/A'}</td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{feature.taskCount}</td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{formatHours(feature.totalHoursWorked)}</td>
                        <td className="p-2 text-right">
                          <span className={`font-semibold ${
                            feature.avgPerformanceScore >= 80 ? 'text-green-600 dark:text-green-400' :
                            feature.avgPerformanceScore >= 60 ? 'text-blue-600 dark:text-blue-400' :
                            'text-orange-600 dark:text-orange-400'
                          }`}>
                            {feature.avgPerformanceScore.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{feature.avgAccuracyRate.toFixed(0)}%</td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{feature.avgQualityScore.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance by Module */}
          {analytics.byModule.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Performance por Módulo
              </h3>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moduleChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: 'currentColor' }}
                    style={{ fill: 'currentColor', fontSize: '12px' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: 'currentColor' }}
                    style={{ fill: 'currentColor' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="performance" name="Performance Score" fill="#8b5cf6" />
                  <Bar dataKey="accuracy" name="Acurácia" fill="#10b981" />
                  <Bar dataKey="quality" name="Qualidade" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>

              {/* Module Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-2 text-gray-700 dark:text-gray-300">Módulo</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Tarefas</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Horas</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Performance</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Acurácia</th>
                      <th className="text-right p-2 text-gray-700 dark:text-gray-300">Qualidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byModule.slice(0, 10).map((module, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="p-2 text-gray-900 dark:text-white font-medium">{module.module || 'N/A'}</td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{module.taskCount}</td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{formatHours(module.totalHoursWorked)}</td>
                        <td className="p-2 text-right">
                          <span className={`font-semibold ${
                            module.avgPerformanceScore >= 80 ? 'text-green-600 dark:text-green-400' :
                            module.avgPerformanceScore >= 60 ? 'text-blue-600 dark:text-blue-400' :
                            'text-orange-600 dark:text-orange-400'
                          }`}>
                            {module.avgPerformanceScore.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{module.avgAccuracyRate.toFixed(0)}%</td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{module.avgQualityScore.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Complexity Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Análise Detalhada por Complexidade
            </h3>
            
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nível de Melhor Performance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Nível {analytics.bestComplexityLevel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Preferência</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {analytics.complexityPreference === 'simple' ? 'Simples' :
                     analytics.complexityPreference === 'medium' ? 'Média' :
                     analytics.complexityPreference === 'complex' ? 'Complexa' : 'Mista'}
                  </p>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complexityChartData.filter(c => c.tasks > 0)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="level" 
                  tick={{ fill: 'currentColor' }}
                  style={{ fill: 'currentColor' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: 'currentColor' }}
                  style={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="performance" name="Performance Score" fill="#8b5cf6" />
                <Bar dataKey="accuracy" name="Acurácia" fill="#10b981" />
                <Bar dataKey="quality" name="Qualidade" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>

            {/* Complexity Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-2 text-gray-700 dark:text-gray-300">Nível</th>
                    <th className="text-right p-2 text-gray-700 dark:text-gray-300">Tarefas</th>
                    <th className="text-right p-2 text-gray-700 dark:text-gray-300">Média Horas/Tarefa</th>
                    <th className="text-right p-2 text-gray-700 dark:text-gray-300">Performance</th>
                    <th className="text-right p-2 text-gray-700 dark:text-gray-300">Acurácia</th>
                    <th className="text-right p-2 text-gray-700 dark:text-gray-300">Qualidade</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byComplexity
                    .filter(c => c.taskCount > 0)
                    .map((complexity, idx) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          complexity.bestPerformance ? 'bg-green-50 dark:bg-green-900/20' : ''
                        }`}
                      >
                        <td className="p-2 text-gray-900 dark:text-white font-medium">
                          Nível {complexity.level}
                          {complexity.bestPerformance && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">⭐ Melhor</span>
                          )}
                        </td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{complexity.taskCount}</td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{complexity.avgHoursPerTask.toFixed(1)}h</td>
                        <td className="p-2 text-right">
                          <span className={`font-semibold ${
                            complexity.avgPerformanceScore >= 80 ? 'text-green-600 dark:text-green-400' :
                            complexity.avgPerformanceScore >= 60 ? 'text-blue-600 dark:text-blue-400' :
                            'text-orange-600 dark:text-orange-400'
                          }`}>
                            {complexity.avgPerformanceScore.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{complexity.avgAccuracyRate.toFixed(0)}%</td>
                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{complexity.avgQualityScore.toFixed(0)}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workload and Capacity Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Análise de Capacidade e Workload
            </h3>
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Horas Ideais por Sprint</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.averageOptimalHours.toFixed(0)}h
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Limite de Capacidade</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.capacityThreshold.toFixed(0)}h
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Frequência de Sobrecarga</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overloadFrequency.toFixed(0)}%
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={workloadChartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="sprint" 
                  tick={{ fill: 'currentColor' }}
                  style={{ fill: 'currentColor' }}
                />
                <YAxis 
                  yAxisId="left"
                  label={{ value: 'Horas', angle: -90, position: 'insideLeft', style: { fill: 'currentColor' } }}
                  tick={{ fill: 'currentColor' }}
                  style={{ fill: 'currentColor' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  label={{ value: 'Score', angle: 90, position: 'insideRight', style: { fill: 'currentColor' } }}
                  tick={{ fill: 'currentColor' }}
                  style={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="hours" 
                  name="Horas Trabalhadas"
                  stroke="#3b82f6" 
                  fill="url(#colorHours)"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="threshold" 
                  name="Limite Ideal"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="quality" 
                  name="Qualidade"
                  stroke="#10b981" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="performance" 
                  name="Performance"
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Fechar Análise
          </button>
        </div>
      </div>
    </div>
  );
};

