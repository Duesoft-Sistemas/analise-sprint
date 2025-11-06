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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-4 border-blue-500 dark:border-blue-400 w-full max-w-[95vw] min-w-[90vw] max-h-[95vh] my-auto overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg shadow-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cálculo de Horas Disponíveis
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {developer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border-2 border-transparent hover:border-red-300 dark:hover:border-red-700"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900">
          {/* Formula */}
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/70 dark:to-indigo-950/70 rounded-xl border-2 border-blue-300 dark:border-blue-700 p-5 shadow-lg">
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Fórmula</h3>
            <div className="font-mono p-4 bg-white dark:bg-gray-800 rounded-lg text-center text-lg border-2 border-blue-200 dark:border-blue-800 shadow-md">
              <span className="font-bold">40h</span> (Capacidade Semanal)
              <span className="font-bold mx-2">-</span>
              <span className="font-bold text-red-600 dark:text-red-400">{formatHours(totalConsumedHours)}</span> (Total Horas Consumidas)
              <span className="font-bold mx-2">=</span>
              <span className="font-bold text-green-600 dark:text-green-400">{formatHours(developer.totalAvailableHours)}</span> (Horas Disponíveis)
            </div>
            <p className="text-xs italic text-gray-700 dark:text-gray-300 mt-2">
              O "Total Horas Consumidas" é a soma das horas de todas as tarefas. Para tarefas concluídas, considera-se o "Tempo Gasto na Sprint". Para as demais, o maior valor entre a "Estimativa Restante" e o "Gasto na Sprint".
            </p>
          </div>

          {/* Task Table */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950/30 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Detalhamento por Tarefa ({tasksBreakdown.length})</h3>
            <div className="max-h-[60vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white uppercase bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 sticky top-0 shadow-md">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Tarefa</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Estimativa Restante</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Gasto na Sprint</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Horas a Consumir</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksBreakdown.map(({ task, consumedHours }, index) => (
                    <tr key={index} className="border-b border-blue-100 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white max-w-md">
                        <div className="truncate" title={task.resumo}>
                          {task.chave} - <span className="text-gray-700 dark:text-gray-300">{task.resumo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{task.status}</td>
                      <td className={`px-4 py-2 text-right ${consumedHours === (task.estimativaRestante ?? task.estimativa) ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {formatHours(task.estimativaRestante ?? task.estimativa)}
                      </td>
                      <td className={`px-4 py-2 text-right ${consumedHours === (task.tempoGastoNoSprint ?? 0) ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {formatHours(task.tempoGastoNoSprint ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-blue-700 dark:text-blue-400">
                        {formatHours(consumedHours)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 border-t-2 border-blue-300 dark:border-blue-700">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-right font-bold uppercase text-gray-900 dark:text-white">Total</td>
                    <td className="px-4 py-2 text-right font-bold text-lg text-gray-900 dark:text-white">{formatHours(totalEstimativaRestante)}</td>
                    <td className="px-4 py-2 text-right font-bold text-lg text-gray-900 dark:text-white">{formatHours(totalGastoNoSprint)}</td>
                    <td className="px-4 py-2 text-right font-bold text-lg text-red-600 dark:text-red-400">{formatHours(totalConsumedHours)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              Esta janela mostra exatamente como as horas disponíveis foram calculadas.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
