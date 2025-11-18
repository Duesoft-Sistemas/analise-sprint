import React, { useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Totalizer } from '../types';
import { formatHours } from '../utils/calculations';

interface AnalyticsChartProps {
  data: Totalizer[];
  title: string;
  onBarClick: (value: string) => void;
  height?: number; // optional custom height for presentation mode
}

const COLORS = {
  high: '#ef4444', 
  medium: '#8b5cf6',
  low: '#3b82f6',
  veryLow: '#6b7280',
};

const getColor = (hours: number) => {
  if (hours >= 16) return COLORS.high;
  if (hours >= 8) return COLORS.medium;
  if (hours >= 4) return COLORS.low;
  return COLORS.veryLow;
};

const CustomLegend = () => (
  <div className="flex items-center justify-center flex-wrap gap-4 mt-4 text-xs text-gray-600 dark:text-gray-400">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.high }} />
      <span>Muito Alta (&gt;= 16h)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.medium }} />
      <span>Alta (&gt;= 8h)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.low }} />
      <span>Média (&gt;= 4h)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.veryLow }} />
      <span>Baixa (&lt; 4h)</span>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hasBreakdown = data.byType !== undefined && data.byType !== null;
    
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-bold text-sm text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">{label}</p>
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            Total: <span className="text-gray-900 dark:text-white">{data.count}</span> tarefas ({formatHours(data.estimatedHours)} estimadas)
          </div>
          {hasBreakdown && (
            <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-300 dark:border-gray-600">
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium text-red-600 dark:text-red-400">Bugs:</span> {data.byType.bugs} ({formatHours(data.byType.bugsHours)})
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium text-yellow-600 dark:text-yellow-400">Dúvidas Ocultas:</span> {data.byType.duvidasOcultas} ({formatHours(data.byType.duvidasOcultasHours)})
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium text-blue-600 dark:text-blue-400">Tarefas:</span> {data.byType.tarefas} ({formatHours(data.byType.tarefasHours)})
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, title, onBarClick, height }) => {
  const chartData = data
    .map(item => ({
      name: item.label,
      'Horas Estimadas': item.estimatedHours,
      count: item.count,
      estimatedHours: item.estimatedHours,
      byType: item.byType, // Include breakdown by type for tooltip
    }))
    .sort((a, b) => b['Horas Estimadas'] - a['Horas Estimadas']);
  
  const handleChartClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      onBarClick(data.activePayload[0].payload.name);
    }
  }, [onBarClick]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
      <div className={height ? '' : 'h-[400px]'} style={height ? { height } : undefined}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
            onClick={handleChartClick}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              interval={0}
              tick={{ fontSize: 12 }} 
            />
            <YAxis tickFormatter={(value) => `${value}h`} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }} />
            <Bar dataKey="Horas Estimadas" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry['Horas Estimadas'])} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <CustomLegend />
    </div>
  );
};
