import React from 'react';
import { AlertTriangle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { RiskAlert } from '../types';

interface AlertPanelProps {
  alerts: RiskAlert[];
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">Nenhum alerta no momento</p>
        </div>
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
          Todas as tarefas e desenvolvedores estão dentro do esperado.
        </p>
      </div>
    );
  }

  const highAlerts = alerts.filter((a) => a.severity === 'high');
  const mediumAlerts = alerts.filter((a) => a.severity === 'medium');
  const lowAlerts = alerts.filter((a) => a.severity === 'low');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          Alertas e Riscos
        </h3>
        <div className="flex items-center gap-3 text-sm">
          {highAlerts.length > 0 && (
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg font-medium">
              {highAlerts.length} alto
            </span>
          )}
          {mediumAlerts.length > 0 && (
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-lg font-medium">
              {mediumAlerts.length} médio
            </span>
          )}
          {lowAlerts.length > 0 && (
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
              {lowAlerts.length} baixo
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alerts.map((alert, index) => (
          <AlertCard key={index} alert={alert} />
        ))}
      </div>
    </div>
  );
};

interface AlertCardProps {
  alert: RiskAlert;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const severityConfig = {
    high: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      border: 'border-red-200 dark:border-red-800',
      icon: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />,
      badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    },
    medium: {
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />,
      badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    },
    low: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    },
  };

  const typeIcons = {
    overAllocated: <TrendingUp className="w-4 h-4" />,
    overTime: <Clock className="w-4 h-4" />,
    noProgress: <AlertCircle className="w-4 h-4" />,
    sprintEndingSoon: <AlertTriangle className="w-4 h-4" />,
  };

  const config = severityConfig[alert.severity];

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all duration-300`}
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{alert.title}</h4>
          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${config.badge}`}>
            {alert.severity === 'high' ? 'Alto' : alert.severity === 'medium' ? 'Médio' : 'Baixo'}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{alert.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-shrink-0">{typeIcons[alert.type]}</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={alert.taskOrDeveloper}>
            {alert.taskOrDeveloper}
          </p>
        </div>
      </div>
    </div>
  );
};

