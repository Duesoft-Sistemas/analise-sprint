import React, { useState } from 'react';
import { Layers, Users, Filter, BarChart2, List } from 'lucide-react';
import { SprintAnalytics } from '../types';
import { AnalyticsChart } from './AnalyticsCharts';
import { formatHours } from '../utils/calculations';
import { Totalizer } from '../types';
import { useSprintStore } from '../store/useSprintStore';


interface SprintAnalysisDetailsProps {
  analytics: SprintAnalytics;
  focusSection?: 'feature' | 'client';
  isPresentation?: boolean;
  chartHeight?: number;
  featureAnchorRef?: React.RefObject<HTMLDivElement>;
  clientAnchorRef?: React.RefObject<HTMLDivElement>;
}

const TOP_OPTIONS = [10, 15, 20, 40, null]; // null = todos

const SprintAnalysisDetails: React.FC<SprintAnalysisDetailsProps> = ({ analytics, focusSection, isPresentation, chartHeight, featureAnchorRef, clientAnchorRef }) => {
  const [topFeatureLimit, setTopFeatureLimit] = useState<number | null>(15);
  const [topClientLimit, setTopClientLimit] = useState<number | null>(15);
  const [featureViewMode, setFeatureViewMode] = useState<'chart' | 'list'>('chart');
  const [clientViewMode, setClientViewMode] = useState<'chart' | 'list'>('chart');
  const setAnalyticsFilter = useSprintStore((state) => state.setAnalyticsFilter);

  const featuresData = analytics.byFeature.slice(0, topFeatureLimit ?? undefined);
  const clientsData = analytics.byClient.slice(0, topClientLimit ?? undefined);

  const showFeature = !focusSection || focusSection === 'feature';
  const showClient = !focusSection || focusSection === 'client';

  return (
    <div className="space-y-6">
      {showClient && (
      <div ref={clientAnchorRef}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sprint Ativo • Por Cliente
          </h3>
          {!isPresentation && (
            <div className="flex items-center gap-2">
              <button onClick={() => setClientViewMode('chart')} className={`p-1.5 rounded-md ${clientViewMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><BarChart2 size={16} /></button>
              <button onClick={() => setClientViewMode('list')} className={`p-1.5 rounded-md ${clientViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><List size={16} /></button>
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={topClientLimit === null ? 'all' : topClientLimit.toString()}
                onChange={(e) => setTopClientLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              >
                {TOP_OPTIONS.map((option) => (
                  <option key={option ?? 'all'} value={option ?? 'all'}>
                    Top {option ?? 'Todos'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {clientViewMode === 'chart' || isPresentation ? (
          <AnalyticsChart data={clientsData} title="" onBarClick={(value) => setAnalyticsFilter({ type: 'client', value })} height={chartHeight} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientsData.map((totalizer) => (
              <DimensionCard key={totalizer.label} totalizer={totalizer} />
            ))}
          </div>
        )}
      </div>
      )}

      {showFeature && (
      <div ref={featureAnchorRef}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Sprint Ativo • Por Feature
          </h3>
          {!isPresentation && (
            <div className="flex items-center gap-2">
              <button onClick={() => setFeatureViewMode('chart')} className={`p-1.5 rounded-md ${featureViewMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><BarChart2 size={16} /></button>
              <button onClick={() => setFeatureViewMode('list')} className={`p-1.5 rounded-md ${featureViewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><List size={16} /></button>
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={topFeatureLimit === null ? 'all' : topFeatureLimit.toString()}
                onChange={(e) => setTopFeatureLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              >
                {TOP_OPTIONS.map((option) => (
                  <option key={option ?? 'all'} value={option ?? 'all'}>
                    Top {option ?? 'Todos'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {featureViewMode === 'chart' || isPresentation ? (
          <AnalyticsChart data={featuresData} title="" onBarClick={(value) => setAnalyticsFilter({ type: 'feature', value })} height={chartHeight} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuresData.map((totalizer) => (
              <DimensionCard key={totalizer.label} totalizer={totalizer} />
            ))}
          </div>
        )}
      </div>
      )}
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
