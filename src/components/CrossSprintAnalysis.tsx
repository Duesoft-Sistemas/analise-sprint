import React from 'react';
import { Inbox, Calendar, Users, Building2 } from 'lucide-react';
import { CrossSprintAnalytics } from '../types';
import { formatHours } from '../utils/calculations';

interface CrossSprintAnalysisProps {
  analytics: CrossSprintAnalytics;
}

export const CrossSprintAnalysis: React.FC<CrossSprintAnalysisProps> = ({ analytics }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        Análise Multi-Sprint
      </h2>

      {/* Backlog */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
            <Inbox className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Backlog</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tarefas sem sprint definido</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Tarefas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.backlogTasks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Horas Estimadas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatHours(analytics.backlogHours)}
            </p>
          </div>
        </div>
      </div>

      {/* Sprint Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          Distribuição por Sprint
        </h3>
        <div className="space-y-3">
          {analytics.sprintDistribution.map((sprint) => (
            <div
              key={sprint.sprintName}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-all duration-300"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{sprint.sprintName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sprint.tasks} tarefas</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {formatHours(sprint.hours)} / {formatHours(sprint.estimatedHours)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">gasto / estimado</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Allocation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <Users className="w-4 h-4 text-white" />
          </div>
          Alocação por Desenvolvedor (Todos os Sprints)
        </h3>
        <div className="space-y-4">
          {analytics.developerAllocation
            .sort((a, b) => b.totalHours - a.totalHours)
            .map((dev) => (
              <div key={dev.name} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{dev.name}</h4>
                  <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                    {formatHours(dev.totalHours)} total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {dev.sprints.map((sprint) => (
                    <div
                      key={sprint.sprintName}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg px-3 py-2 flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{sprint.sprintName}</span>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        {formatHours(sprint.hours)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Client Allocation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          Alocação por Cliente (Todos os Sprints)
        </h3>
        <div className="space-y-4">
          {analytics.clientAllocation
            .sort((a, b) => b.totalHours - a.totalHours)
            .map((client) => (
              <div key={client.client} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{client.client}</h4>
                  <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                    {formatHours(client.totalHours)} total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {client.sprints.map((sprint) => (
                    <div
                      key={sprint.sprintName}
                      className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg px-3 py-2 flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{sprint.sprintName}</span>
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
                        {formatHours(sprint.hours)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

