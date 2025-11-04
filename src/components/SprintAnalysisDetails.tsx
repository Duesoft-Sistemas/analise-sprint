import React, { useState } from 'react';
import { Layers, Users, Filter } from 'lucide-react';
import { SprintAnalytics, Totalizer } from '../types';
import { formatHours } from '../utils/calculations';

interface SprintAnalysisDetailsProps {
  analytics: SprintAnalytics;
}

const TOP_OPTIONS = [10, 20, 40, null]; // null = todos

const DimensionSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  data: Totalizer[];
  topLimit: number | null;
  setTopLimit: (limit: number | null) => void;
}> = ({ title, icon, data, topLimit, setTopLimit }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <select
          value={topLimit === null ? 'all' : topLimit.toString()}
          onChange={(e) => setTopLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
          className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
        >
          {TOP_OPTIONS.map((option) => (
            <option key={option ?? 'all'} value={option ?? 'all'}>
              Top {option ?? 'Todos'}
            </option>
          ))}
        </select>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.slice(0, topLimit ?? undefined).map((totalizer) => (
        <DimensionCard key={totalizer.label} totalizer={totalizer} />
      ))}
    </div>
  </div>
);

const SprintAnalysisDetails: React.FC<SprintAnalysisDetailsProps> = ({ analytics }) => {
  const [topFeatureLimit, setTopFeatureLimit] = useState<number | null>(10);
  const [topClientLimit, setTopClientLimit] = useState<number | null>(10);

  return (
    <div className="space-y-6">
      <DimensionSection
        title="Por Feature"
        icon={<Layers className="w-5 h-5" />}
        data={analytics.byFeature}
        topLimit={topFeatureLimit}
        setTopLimit={setTopFeatureLimit}
      />
      <DimensionSection
        title="Por Cliente"
        icon={<Users className="w-5 h-5" />}
        data={analytics.byClient}
        topLimit={topClientLimit}
        setTopLimit={setTopClientLimit}
      />
    </div>
  );
};

interface DimensionCardProps {
  totalizer: Totalizer;
}

const DimensionCard: React.FC<DimensionCardProps> = ({ totalizer }) => {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={totalizer.label}>
        {totalizer.label}
      </p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-xl font-bold text-gray-900 dark:text-white">{totalizer.count}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">tarefas</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {formatHours(totalizer.hours)} / {formatHours(totalizer.estimatedHours)}
      </p>
    </div>
  );
};

export default SprintAnalysisDetails;
