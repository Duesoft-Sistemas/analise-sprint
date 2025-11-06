import React, { useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Totalizer } from '../types';
import { formatHours } from '../utils/calculations';

interface AnalyticsChartProps {
  data: Totalizer[];
  title: string;
  onBarClick: (value: string) => void;
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
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
        <p className="font-bold text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">{label}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">{data.count}</span> tarefas</p>
        <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">{formatHours(data.estimatedHours)}</span> estimadas</p>
      </div>
    );
  }
  return null;
};

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, title, onBarClick }) => {
  const chartData = data
    .map(item => ({
      name: item.label,
      'Horas Estimadas': item.estimatedHours,
      count: item.count,
      estimatedHours: item.estimatedHours,
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
      <div className="h-[400px]">
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
