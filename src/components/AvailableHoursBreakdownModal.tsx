import React from 'react';
import { X, Calculator, Info } from 'lucide-react';
import { DeveloperMetrics, TaskItem } from '../types';
import { formatHours } from '../utils/calculations';

interface AvailableHoursBreakdownModalProps {
  developer: DeveloperMetrics;
  isOpen: boolean;
  onClose: () => void;
}

interface TaskBreakdown {
  task: TaskItem;
  consumedHours: number;
}

export const AvailableHoursBreakdownModal: React.FC<AvailableHoursBreakdownModalProps> = ({
  developer,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const calculateConsumedHours = (task: TaskItem): number => {
    const finalStatuses = ['concluído', 'teste', 'testegap', 'done'];
    const taskStatus = task.status.toLowerCase();

    if (finalStatuses.includes(taskStatus)) {
      return task.tempoGastoNoSprint ?? 0;
    }

    return Math.max(
      task.estimativaRestante ?? task.estimativa,
      task.tempoGastoNoSprint ?? 0
    );
  };

  const tasksBreakdown: TaskBreakdown[] = developer.tasks.map(task => ({
    task,
    consumedHours: calculateConsumedHours(task),
  }));

  const totalConsumedHours = tasksBreakdown.reduce((sum, item) => sum + item.consumedHours, 0);
  const totalEstimativaRestante = developer.tasks.reduce((sum, task) => sum + (task.estimativaRestante ?? task.estimativa), 0);
  const totalGastoNoSprint = developer.tasks.reduce((sum, task) => sum + (task.tempoGastoNoSprint ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col min-w-[800px]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cálculo de Horas Disponíveis
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {developer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Formula */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-lg font-bold mb-2">Fórmula</h3>
            <div className="font-mono p-4 bg-white dark:bg-gray-800 rounded-lg text-center text-lg">
              <span className="font-bold">40h</span> (Capacidade Semanal)
              <span className="font-bold mx-2">-</span>
              <span className="font-bold text-red-500">{formatHours(totalConsumedHours)}</span> (Total Horas Consumidas)
              <span className="font-bold mx-2">=</span>
              <span className="font-bold text-green-500">{formatHours(developer.totalAvailableHours)}</span> (Horas Disponíveis)
            </div>
            <p className="text-xs italic text-gray-600 dark:text-gray-400 mt-2">
              O "Total Horas Consumidas" é a soma das horas de todas as tarefas. Para tarefas concluídas, considera-se o "Tempo Gasto na Sprint". Para as demais, o maior valor entre a "Estimativa Restante" e o "Gasto na Sprint".
            </p>
          </div>

          {/* Task Table */}
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">Detalhamento por Tarefa ({tasksBreakdown.length})</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                  <tr>
                    <th scope="col" className="px-4 py-3">Tarefa</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Estimativa Restante</th>
                    <th scope="col" className="px-4 py-3 text-right">Gasto na Sprint</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">Horas a Consumir</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksBreakdown.map(({ task, consumedHours }, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white max-w-md">
                        <div className="truncate" title={task.resumo}>
                          {task.chave} - <span className="text-gray-600 dark:text-gray-400">{task.resumo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">{task.status}</td>
                      <td className={`px-4 py-2 text-right ${consumedHours === (task.estimativaRestante ?? task.estimativa) ? 'font-bold text-blue-500' : ''}`}>
                        {formatHours(task.estimativaRestante ?? task.estimativa)}
                      </td>
                      <td className={`px-4 py-2 text-right ${consumedHours === (task.tempoGastoNoSprint ?? 0) ? 'font-bold text-blue-500' : ''}`}>
                        {formatHours(task.tempoGastoNoSprint ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatHours(consumedHours)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-right font-bold uppercase">Total</td>
                    <td className="px-4 py-2 text-right font-bold text-lg">{formatHours(totalEstimativaRestante)}</td>
                    <td className="px-4 py-2 text-right font-bold text-lg">{formatHours(totalGastoNoSprint)}</td>
                    <td className="px-4 py-2 text-right font-bold text-lg text-red-500">{formatHours(totalConsumedHours)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>
              Esta janela mostra exatamente como as horas disponíveis foram calculadas.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
