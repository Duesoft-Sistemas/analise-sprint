import React, { useMemo } from 'react';
import { FileText, X } from 'lucide-react';
import { TaskItem, WorklogEntry } from '../types';
import { formatHours } from '../utils/calculations';

interface WorklogDescriptionsModalProps {
  isOpen: boolean;
  developerName: string;
  worklogs: WorklogEntry[];
  tasks: TaskItem[];
  onClose: () => void;
}

interface DescribedWorklog {
  id: string;
  taskCode: string;
  title: string;
  description: string;
  date: Date;
  hours: number;
}

export const WorklogDescriptionsModal: React.FC<WorklogDescriptionsModalProps> = ({
  isOpen,
  developerName,
  worklogs,
  tasks,
  onClose,
}) => {
  const taskMap = useMemo(() => {
    const map = new Map<string, TaskItem>();
    tasks.forEach((task) => {
      const taskId = String(task.id ?? '').trim();
      const taskKey = String(task.chave ?? '').trim();
      if (taskId) {
        map.set(taskId, task);
      }
      if (taskKey) {
        map.set(taskKey, task);
      }
    });
    return map;
  }, [tasks]);

  const describedWorklogs = useMemo<DescribedWorklog[]>(() => {
    return worklogs
      .filter((worklog) => worklog.descricao && worklog.descricao.trim().length > 0)
      .map((worklog) => {
        const trimmedTaskId = String(worklog.taskId ?? '').trim();
        const task = taskMap.get(trimmedTaskId);
        const taskCode = task?.chave || task?.id?.toString() || trimmedTaskId;
        const title = task?.resumo || 'Título não encontrado';

        return {
          id: `${trimmedTaskId}-${worklog.data.getTime()}`,
          taskCode: taskCode,
          title,
          description: worklog.descricao!.trim(),
          date: worklog.data,
          hours: worklog.tempoGasto,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [worklogs, taskMap]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-100 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500 dark:bg-indigo-600 text-white shadow">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Worklogs com descrição
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {developerName} • {describedWorklogs.length} registro{describedWorklogs.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-gray-900">
          {describedWorklogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Nenhum worklog com descrição foi registrado para este desenvolvedor no sprint selecionado.
            </div>
          ) : (
            <div className="space-y-4">
              {describedWorklogs.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-900 dark:text-white">
                      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                        {entry.taskCode}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">{entry.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {formatHours(entry.hours)}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {entry.date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {entry.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

