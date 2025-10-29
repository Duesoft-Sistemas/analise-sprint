import React from 'react';
import { Calendar } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';

export const SprintSelector: React.FC = () => {
  const sprints = useSprintStore((state) => state.sprints);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const setSelectedSprint = useSprintStore((state) => state.setSelectedSprint);

  if (sprints.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
        <Calendar className="w-4 h-4 text-white" />
      </div>
      <span className="font-medium text-gray-700 dark:text-gray-200">Sprint Ativo:</span>
      <select
        value={selectedSprint || ''}
        onChange={(e) => setSelectedSprint(e.target.value)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
      >
        {sprints.map((sprint) => (
          <option key={sprint} value={sprint}>
            {sprint}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
        {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} disponível
        {sprints.length !== 1 ? 'is' : ''}
      </span>
    </div>
  );
};

