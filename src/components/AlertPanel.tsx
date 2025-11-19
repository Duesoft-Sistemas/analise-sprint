import React, { useState } from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { RiskAlert } from '../types';
import { AlertsModal } from './AlertsModal';

interface AlertPanelProps {
  alerts: RiskAlert[];
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Alertas e Riscos
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              {highAlerts.length > 0 && (
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded font-medium">
                  {highAlerts.length} alto
                </span>
              )}
              {mediumAlerts.length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded font-medium">
                  {mediumAlerts.length} médio
                </span>
              )}
              {lowAlerts.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-medium">
                  {lowAlerts.length} baixo
                </span>
              )}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Ver todos os alertas"
            >
              Ver detalhes
            </button>
          </div>
        </div>
      </div>

      <AlertsModal alerts={alerts} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

