import React, { useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  ListTodo,
  Bug,
  Layers,
  Users,
  AlertCircle,
} from 'lucide-react';
import { SprintAnalytics } from '../types';
import { formatHours, isBlockedStatus } from '../utils/calculations';
import { useSprintStore } from '../store/useSprintStore';

interface TotalizerCardsProps {
  analytics: SprintAnalytics;
}

export const TotalizerCards: React.FC<TotalizerCardsProps> = ({ analytics }) => {
  const tasks = useSprintStore((state) => state.tasks);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);

  // Calculate blocked tasks for current sprint
  const blockedTasksData = useMemo(() => {
    if (!selectedSprint) return { count: 0, hours: 0, estimatedHours: 0 };
    
    const sprintTasks = tasks.filter((t) => t.sprint === selectedSprint);
    const blockedTasks = sprintTasks.filter((t) => isBlockedStatus(t.status));
    
    return {
      count: blockedTasks.length,
      // IMPORTANT: Time spent is ALWAYS from worklog (tempoGastoNoSprint)
      hours: blockedTasks.reduce((sum, t) => sum + (t.tempoGastoNoSprint ?? 0), 0),
      estimatedHours: blockedTasks.reduce((sum, t) => sum + t.estimativa, 0),
    };
  }, [tasks, selectedSprint]);
  return (
    <div className="space-y-6">
      {/* Overall Sprint Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<ListTodo className="w-5 h-5" />}
          label="Total de Tarefas"
          value={analytics.totalTasks.toString()}
          subtitle={`${analytics.completedTasks} concluídas`}
          color="blue"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Horas Gastas"
          value={formatHours(analytics.totalHours)}
          subtitle={`${formatHours(analytics.totalEstimatedHours)} estimadas`}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Progresso"
          value={`${analytics.totalTasks > 0 ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0}%`}
          subtitle={`${analytics.completedTasks}/${analytics.totalTasks} tarefas`}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Horas Concluídas"
          value={formatHours(analytics.completedHours)}
          subtitle={`${analytics.totalHours > 0 ? Math.round((analytics.completedHours / analytics.totalHours) * 100) : 0}% do tempo`}
          color="indigo"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="Tarefas Bloqueadas"
          value={blockedTasksData.count.toString()}
          subtitle={`${formatHours(blockedTasksData.estimatedHours)} estimadas`}
          color="orange"
        />
      </div>

      {/* By Type */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Por Tipo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TypeCard
            label="Bugs Reais"
            count={analytics.byType.bugs.realBugs.count}
            hours={analytics.byType.bugs.realBugs.hours}
            estimatedHours={analytics.byType.bugs.realBugs.estimatedHours}
            color="red"
          />
          <TypeCard
            label="Dúvidas Ocultas"
            count={analytics.byType.bugs.dubidasOcultas.count}
            hours={analytics.byType.bugs.dubidasOcultas.hours}
            estimatedHours={analytics.byType.bugs.dubidasOcultas.estimatedHours}
            color="yellow"
          />
          <TypeCard
            label="Tarefas"
            count={analytics.byType.tarefas.count}
            hours={analytics.byType.tarefas.hours}
            estimatedHours={analytics.byType.tarefas.estimatedHours}
            color="blue"
          />
          <TypeCard
            label="Histórias"
            count={analytics.byType.historias.count}
            hours={analytics.byType.historias.hours}
            estimatedHours={analytics.byType.historias.estimatedHours}
            color="green"
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'purple' | 'green' | 'indigo' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-600 dark:text-purple-400',
    green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400',
    indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 text-indigo-600 dark:text-indigo-400',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 p-5">
      <div className={`inline-flex p-2.5 rounded-xl ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
};

interface TypeCardProps {
  label: string;
  count: number;
  hours: number;
  estimatedHours: number;
  color: 'red' | 'yellow' | 'blue' | 'green';
}

const TypeCard: React.FC<TypeCardProps> = ({ label, count, hours, estimatedHours, color }) => {
  const colorClasses = {
    red: 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30',
    yellow: 'border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30',
    blue: 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
    green: 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
  };

  const textColorClasses = {
    red: 'text-red-700 dark:text-red-400',
    yellow: 'text-yellow-700 dark:text-yellow-400',
    blue: 'text-blue-700 dark:text-blue-400',
    green: 'text-green-700 dark:text-green-400',
  };

  return (
    <div className={`rounded-xl border-2 ${colorClasses[color]} p-4 hover:shadow-lg transition-all duration-300`}>
      <p className={`text-sm font-medium ${textColorClasses[color]}`}>{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{count}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
        {formatHours(hours)} / {formatHours(estimatedHours)} estimadas
      </p>
    </div>
  );
};

