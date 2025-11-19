import React from 'react';
import { X, AlertTriangle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { RiskAlert } from '../types';

interface AlertsModalProps {
  alerts: RiskAlert[];
  isOpen: boolean;
  onClose: () => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({ alerts, isOpen, onClose }) => {
  if (!isOpen) return null;

  const highAlerts = alerts.filter((a) => a.severity === 'high');
  const mediumAlerts = alerts.filter((a) => a.severity === 'medium');
  const lowAlerts = alerts.filter((a) => a.severity === 'low');

  const severityConfig = {
    high: {
      border: 'border-l-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    },
    medium: {
      border: 'border-l-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
      badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    },
    low: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    },
  };

  const typeIcons = {
    overAllocated: <TrendingUp className="w-4 h-4 text-gray-500" />,
    overTime: <Clock className="w-4 h-4 text-gray-500" />,
    noProgress: <AlertCircle className="w-4 h-4 text-gray-500" />,
    sprintEndingSoon: <AlertTriangle className="w-4 h-4 text-gray-500" />,
  };

  const getSeverityLabel = (severity: 'high' | 'medium' | 'low') => {
    return severity === 'high' ? 'Alto' : severity === 'medium' ? 'Médio' : 'Baixo';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-4 border-red-500 dark:border-red-400 w-full max-w-[95vw] min-w-[90vw] max-h-[95vh] my-auto overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b-2 border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 dark:bg-red-600 rounded-lg shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Alertas e Riscos
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} encontrado{alerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border-2 border-transparent hover:border-red-300 dark:hover:border-red-700"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
          <div className="space-y-0 divide-y divide-gray-200 dark:divide-gray-700">
            {alerts.map((alert, index) => {
              const config = severityConfig[alert.severity];
              return (
                <div
                  key={index}
                  className={`border-l-4 ${config.border} ${config.bg} px-4 py-3 hover:bg-opacity-80 transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {alert.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${config.badge}`}>
                          {getSeverityLabel(alert.severity)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">{typeIcons[alert.type]}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400" title={alert.taskOrDeveloper}>
                          {alert.taskOrDeveloper}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

