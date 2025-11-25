import React, { useState } from 'react';
import { User, TrendingUp, AlertTriangle, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { DeveloperMetrics } from '../types';
import { formatHours, getSprintHoursPerDeveloper, getSprintHoursForIntern } from '../utils/calculations';
import { useSprintStore } from '../store/useSprintStore';
import { isInternDeveloper } from '../services/configService';

interface DeveloperCardProps {
  developer: DeveloperMetrics;
  isHistorical?: boolean; // Flag indicating this is a historical analysis (completed sprint)
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ developer, isHistorical = false }) => {
  const selectedDeveloper = useSprintStore((state) => state.selectedDeveloper);
  const setSelectedDeveloper = useSprintStore(
    (state) => state.setSelectedDeveloper
  );
  const openBreakdownModal = useSprintStore((state) => state.openBreakdownModal);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);
  const [isComplexityExpanded, setIsComplexityExpanded] = useState(false);

  const isSelected = selectedDeveloper === developer.name;

  // Get hours per developer for this sprint (considering if developer is intern)
  const isIntern = isInternDeveloper(developer.name);
  const sprintHours = selectedSprint
    ? (isIntern
        ? getSprintHoursForIntern(selectedSprint, sprintMetadata)
        : getSprintHoursPerDeveloper(selectedSprint, sprintMetadata))
    : 40; // Fallback to 40 if no sprint selected

  const handleCardClick = () => {
    if (isSelected) {
      setSelectedDeveloper(null);
    } else {
      setSelectedDeveloper(developer.name);
    }
  };

  const riskColors = {
    low: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      badge: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    },
    medium: {
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
    },
    high: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    },
  };

  const colors = riskColors[developer.riskLevel];

  // Calcular distribuição por complexidade
  const complexityDistribution = [1, 2, 3, 4, 5].map(level => ({
    level,
    count: developer.tasks.filter(t => t.complexidade === level).length,
  }));

  const totalTasks = developer.tasks.length;
  const maxComplexityCount = Math.max(...complexityDistribution.map(c => c.count), 1);

  return (
    <div
      className={`
        rounded-xl border p-4 cursor-pointer transition-all duration-300
        ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg scale-105' : 'shadow-md hover:shadow-lg'}
        ${colors.bg} ${colors.border}
      `}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${colors.badge}`}>
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{developer.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{developer.tasks.length} tarefas</p>
          </div>
        </div>
        {developer.riskLevel === 'high' && (
          <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
        )}
      </div>

      {/* Utilization Bar - Allocation for the current sprint (only show for active sprints) */}
      {!isHistorical && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Alocado no sprint</span>
              <span className="text-[9px] opacity-60" title="Soma do que falta executar neste sprint (estimativa restante)">ⓘ</span>
            </div>
            <span className={`text-sm font-bold ${colors.text}`}>
              {developer.utilizationPercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                developer.riskLevel === 'high'
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : developer.riskLevel === 'medium'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-r from-green-500 to-green-600'
              }`}
              style={{ width: `${Math.min(developer.utilizationPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
            {formatHours(developer.totalAllocatedHours)} de {formatHours(sprintHours)} (sprint)
          </p>
        </div>
      )}

      {/* Sprint Current Status */}
      {!isHistorical && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span>Gasto</span>
              <span className="text-[9px] opacity-60" title="Tempo total registrado neste sprint através de worklogs">
                ⓘ
              </span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatHours(developer.totalSpentHours)}
            </span>
          </div>
        </div>
      )}

      {/* Available Hours */}
      {!isHistorical && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Horas Disponíveis</span>
              <span className="text-[9px] opacity-60" title={`Capacidade restante do sprint (${formatHours(sprintHours)}). Considera o maior valor entre estimativa restante e tempo gasto para cada tarefa`}>
                ⓘ
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openBreakdownModal(developer);
                }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                title="Ver detalhe do cálculo"
              >
                <Calculator className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatHours(developer.totalAvailableHours)}
            </span>
          </div>
        </div>
      )}

      {/* Complexity Distribution */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsComplexityExpanded(!isComplexityExpanded);
          }}
          className="w-full flex justify-between items-center text-left"
        >
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Distribuição por Complexidade
            </span>
            <span className="text-[9px] opacity-60" title="Quantidade e percentual de tarefas do desenvolvedor em cada nível de complexidade (1=muito simples, 5=muito complexa)">
              ⓘ
            </span>
          </div>
          {isComplexityExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isComplexityExpanded && (
          <div className="mt-2 space-y-1.5 animate-in fade-in-50">
            {complexityDistribution.map(({ level, count }) => {
              const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
              const barWidth = maxComplexityCount > 0 ? (count / maxComplexityCount) * 100 : 0;
              
              // Cores por nível de complexidade
              const getComplexityColor = (lvl: number) => {
                if (lvl <= 2) return 'bg-green-500 dark:bg-green-400';
                if (lvl === 3) return 'bg-yellow-500 dark:bg-yellow-400';
                return 'bg-red-500 dark:bg-red-400';
              };

              return (
                <div key={level} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-4">
                    {level}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getComplexityColor(level)}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                    {count > 0 ? `${count} (${Math.round(percentage)}%)` : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium text-center animate-pulse">
            Clique novamente para fechar • Ver tarefas abaixo
          </p>
        </div>
      )}

    </div>
  );
};

