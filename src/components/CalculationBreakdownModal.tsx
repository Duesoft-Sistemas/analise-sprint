import React from 'react';
import { X, Calculator, Info, TrendingUp, Award, Target } from 'lucide-react';
import { SprintPerformanceMetrics, TaskPerformanceMetrics } from '../types';
import { formatHours, isCompletedStatus } from '../utils/calculations';
import { getEfficiencyThreshold } from '../config/performanceConfig';

interface CalculationBreakdownModalProps {
  metrics: SprintPerformanceMetrics;
  isOpen: boolean;
  onClose: () => void;
}

interface BreakdownSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: BreakdownItem[];
}

interface BreakdownItem {
  label: string;
  value: string | number;
  formula?: string;
  explanation?: string;
  tasks?: TaskBreakdown[];
  subItems?: BreakdownItem[];
}

interface TaskBreakdown {
  taskKey: string;
  taskSummary: string;
  complexity: number;
  hoursEstimated: number;
  hoursSpent: number;
  deviation?: number;
  status: string;
  impact?: string;
}

export const CalculationBreakdownModal: React.FC<CalculationBreakdownModalProps> = ({
  metrics,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const generateBreakdown = (): BreakdownSection[] => {
    const sections: BreakdownSection[] = [];

    // Filter completed tasks (used for performance calculations)
    const completedTasks = metrics.tasks.filter(t => isCompletedStatus(t.task.status));

    // 1. Produtividade
    sections.push({
      title: 'Produtividade',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'blue',
      items: [
        {
          label: 'Total de Horas Trabalhadas',
          value: `${formatHours(metrics.totalHoursWorked)}`,
          formula: 'Soma de tempoGastoTotal de todas as tarefas (incluindo pendentes)',
          tasks: metrics.tasks.map(t => ({
            taskKey: t.task.chave || t.task.id,
            taskSummary: t.task.resumo || 'Sem resumo',
            complexity: t.task.complexidade,
            hoursEstimated: t.hoursEstimated,
            hoursSpent: t.hoursSpent,
            status: t.task.status,
            impact: `${formatHours(t.hoursSpent)}`,
          })),
        },
        {
          label: 'Total de Horas Estimadas',
          value: `${formatHours(metrics.totalHoursEstimated)}`,
          formula: 'Soma de estimativa de tarefas concluídas (apenas para cálculos de performance)',
          tasks: completedTasks.map(t => ({
            taskKey: t.task.chave || t.task.id,
            taskSummary: t.task.resumo || 'Sem resumo',
            complexity: t.task.complexidade,
            hoursEstimated: t.hoursEstimated,
            hoursSpent: t.hoursSpent,
            status: t.task.status,
            impact: `${formatHours(t.hoursEstimated)}`,
          })),
        },
        {
          label: 'Tarefas Iniciadas',
          value: metrics.tasksStarted,
          formula: 'Contagem de todas as tarefas do desenvolvedor no sprint',
        },
        {
          label: 'Tarefas Concluídas',
          value: metrics.tasksCompleted,
          formula: 'Contagem de tarefas com status concluído',
        },
        {
          label: 'Média de Horas por Tarefa',
          value: `${formatHours(metrics.averageHoursPerTask)}`,
          formula: `Total de Horas Trabalhadas / Tarefas Concluídas = ${formatHours(metrics.totalHoursWorked)} / ${metrics.tasksCompleted}`,
        },
      ],
    });

    // 2. Eficiência de Execução
    const completedWithEstimates = completedTasks.filter(t => t.hoursEstimated > 0);
    const efficientTasks = completedWithEstimates.filter(t => {
      if (t.efficiencyImpact && t.efficiencyImpact.type === 'complexity_zone') {
        return t.efficiencyImpact.isEfficient;
      }
      const deviation = t.estimationAccuracy;
      const threshold = getEfficiencyThreshold(t.complexityScore);
      if (deviation > 0) {
        return deviation <= threshold.faster;
      }
      return deviation >= threshold.slower;
    });

    sections.push({
      title: 'Eficiência de Execução',
      icon: <Target className="w-5 h-5" />,
      color: 'green',
      items: [
        {
          label: 'Taxa de Eficiência',
          value: `${metrics.accuracyRate.toFixed(1)}%`,
          formula: `(Tarefas Eficientes / Total com Estimativa) × 100 = (${efficientTasks.length} / ${completedWithEstimates.length}) × 100`,
          explanation: 'Percentual de tarefas executadas de forma eficiente. Considera zonas de complexidade para tarefas 1-4 e limites de tolerância para complexidade 5.',
          tasks: completedWithEstimates.map(t => {
            const isEfficient = efficientTasks.includes(t);
            const zone = t.efficiencyImpact;
            let impact = '';
            
            if (zone && zone.type === 'complexity_zone') {
              impact = `${zone.description} → ${isEfficient ? '✅ Eficiente' : '❌ Ineficiente'}`;
            } else {
              const threshold = getEfficiencyThreshold(t.complexityScore);
              if (t.estimationAccuracy > 0) {
                impact = `Desvio: +${t.estimationAccuracy.toFixed(1)}% (limite: +${threshold.faster}%) → ${isEfficient ? '✅ Eficiente' : '❌ Ineficiente'}`;
              } else {
                impact = `Desvio: ${t.estimationAccuracy.toFixed(1)}% (limite: ${threshold.slower}%) → ${isEfficient ? '✅ Eficiente' : '❌ Ineficiente'}`;
              }
            }
            
            return {
              taskKey: t.task.chave || t.task.id,
              taskSummary: t.task.resumo || 'Sem resumo',
              complexity: t.task.complexidade,
              hoursEstimated: t.hoursEstimated,
              hoursSpent: t.hoursSpent,
              deviation: t.estimationAccuracy,
              status: t.task.status,
              impact,
            };
          }),
        },
        {
          label: 'Desvio Médio de Estimativa',
          value: `${metrics.estimationAccuracy > 0 ? '+' : ''}${metrics.estimationAccuracy.toFixed(1)}%`,
          formula: completedWithEstimates.length > 0
            ? `Soma dos desvios / Total = ${completedWithEstimates.reduce((sum, t) => sum + t.estimationAccuracy, 0).toFixed(1)}% / ${completedWithEstimates.length}`
            : '0%',
          explanation: metrics.tendsToUnderestimate 
            ? 'Tendência a subestimar (gastou mais que estimado)' 
            : metrics.tendsToOverestimate 
            ? 'Tendência a superestimar (gastou menos que estimado)'
            : 'Estimativas balanceadas',
          tasks: completedWithEstimates.map(t => ({
            taskKey: t.task.chave || t.task.id,
            taskSummary: t.task.resumo || 'Sem resumo',
            complexity: t.task.complexidade,
            hoursEstimated: t.hoursEstimated,
            hoursSpent: t.hoursSpent,
            deviation: t.estimationAccuracy,
            status: t.task.status,
            impact: `Desvio: ${t.estimationAccuracy > 0 ? '+' : ''}${t.estimationAccuracy.toFixed(1)}% ${t.estimationAccuracy > 0 ? '(acelerou)' : '(atrasou)'}`,
          })),
        },
      ],
    });

    // 3. Qualidade
    const testNotes = completedTasks.map(t => t.task.notaTeste ?? 5);
    const avgTestNote = testNotes.length > 0 
      ? testNotes.reduce((sum, n) => sum + n, 0) / testNotes.length 
      : 5;

    sections.push({
      title: 'Qualidade',
      icon: <Award className="w-5 h-5" />,
      color: 'purple',
      items: [
        {
          label: 'Score de Qualidade',
          value: `${metrics.qualityScore.toFixed(1)}`,
          formula: `Nota de Teste Média × 20 = ${avgTestNote.toFixed(1)} × 20`,
          explanation: 'Baseado exclusivamente na Nota de Teste (1-5). Vazio é tratado como 5.',
          tasks: completedTasks.map(t => ({
            taskKey: t.task.chave || t.task.id,
            taskSummary: t.task.resumo || 'Sem resumo',
            complexity: t.task.complexidade,
            hoursEstimated: t.hoursEstimated,
            hoursSpent: t.hoursSpent,
            status: t.task.status,
            impact: `Nota: ${t.task.notaTeste ?? 5}/5 (contribui: ${((t.task.notaTeste ?? 5) * 20).toFixed(1)})`,
          })),
        },
        {
          label: 'Nota de Teste Média',
          value: `${avgTestNote.toFixed(1)}/5`,
          formula: testNotes.length > 0
            ? `Soma das notas / Total = ${testNotes.reduce((sum, n) => sum + n, 0)} / ${testNotes.length}`
            : '5.0 (padrão)',
        },
      ],
    });

    // 4. Performance Score
    sections.push({
      title: 'Score de Performance',
      icon: <Calculator className="w-5 h-5" />,
      color: 'yellow',
      items: [
        {
          label: 'Score Base',
          value: `${metrics.baseScore.toFixed(1)}`,
          formula: `(50% × Qualidade) + (50% × Eficiência) = (0.5 × ${metrics.qualityScore.toFixed(1)}) + (0.5 × ${metrics.accuracyRate.toFixed(1)})`,
          subItems: [
            {
              label: 'Componente Qualidade',
              value: `${(metrics.qualityScore * 0.5).toFixed(1)}`,
              formula: `50% × ${metrics.qualityScore.toFixed(1)}`,
            },
            {
              label: 'Componente Eficiência',
              value: `${(metrics.accuracyRate * 0.5).toFixed(1)}`,
              formula: `50% × ${metrics.accuracyRate.toFixed(1)}`,
            },
          ],
        },
        {
          label: 'Bonus de Complexidade',
          value: `+${metrics.complexityBonus}`,
          formula: (() => {
            const total = metrics.complexityDistribution.reduce((sum, d) => sum + d.count, 0);
            const complex = metrics.complexityDistribution
              .filter(d => d.level >= 4)
              .reduce((sum, d) => sum + d.count, 0);
            const pct = total > 0 ? ((complex / total) * 100).toFixed(1) : '0';
            return `% de tarefas complexas (4-5) × 10 = ${pct}% × 10 = ${metrics.complexityBonus}`;
          })(),
          explanation: `Recompensa trabalhar em tarefas complexas. ${metrics.complexityBonus === 0 ? 'Nenhuma tarefa complexa (4-5) identificada.' : `${metrics.complexityDistribution.filter(d => d.level >= 4).reduce((sum, d) => sum + d.count, 0)} tarefa(s) de complexidade 4-5.`}`,
        },
        {
          label: 'Bonus de Senioridade',
          value: `+${metrics.seniorityEfficiencyBonus}`,
          formula: (() => {
            const complexTasks = completedTasks.filter(t => t.complexityScore >= 4 && t.hoursEstimated > 0);
            if (complexTasks.length === 0) return 'Nenhuma tarefa complexa executada';
            
            let highlyEfficient = 0;
            let moderatelyEfficient = 0;
            
            complexTasks.forEach(t => {
              if (t.efficiencyImpact && t.efficiencyImpact.type === 'complexity_zone') {
                if (t.efficiencyImpact.zone === 'efficient') highlyEfficient++;
                else if (t.efficiencyImpact.zone === 'acceptable') moderatelyEfficient++;
              } else {
                // Para complexidade 5: avaliar por desvio percentual
                const threshold = getEfficiencyThreshold(t.complexityScore);
                if (t.complexityScore === 5) {
                  if (t.estimationAccuracy > 0 || (t.estimationAccuracy < 0 && t.estimationAccuracy >= threshold.slower)) {
                    highlyEfficient++;
                  }
                } else if (t.complexityScore === 4) {
                  // Complexidade 4 deveria ter zone, mas se não tiver, usar threshold
                  const threshold4 = getEfficiencyThreshold(4);
                  if (t.estimationAccuracy > 0 || (t.estimationAccuracy < 0 && t.estimationAccuracy >= threshold4.slower)) {
                    highlyEfficient++;
                  }
                }
              }
            });
            
            if (complexTasks.length === 0) return '0 (sem tarefas complexas)';
            const efficiencyScore = (highlyEfficient * 1.0 + moderatelyEfficient * 0.5) / complexTasks.length;
            return `${highlyEfficient} altamente eficiente + ${moderatelyEfficient} moderadamente eficiente / ${complexTasks.length} total = ${(efficiencyScore * 100).toFixed(1)}% × 15`;
          })(),
          explanation: `Recompensa executar tarefas complexas (4-5) com alta eficiência dentro dos limites esperados. ${metrics.seniorityEfficiencyBonus === 0 ? 'Nenhum bonus aplicado.' : 'Excelente execução em tarefas complexas!'}`,
        },
        {
          label: 'Score Final',
          value: `${metrics.performanceScore.toFixed(1)}`,
          formula: `Score Base + Bonus Complexidade + Bonus Senioridade = ${metrics.baseScore.toFixed(1)} + ${metrics.complexityBonus} + ${metrics.seniorityEfficiencyBonus}`,
          explanation: `Score máximo: 125 (100 base + 10 complexidade + 15 senioridade)`,
        },
      ],
    });

    // 5. Métricas Informativas
    sections.push({
      title: 'Métricas Informativas',
      icon: <Info className="w-5 h-5" />,
      color: 'gray',
      items: [
        {
          label: 'Taxa de Utilização',
          value: `${metrics.utilizationRate.toFixed(1)}%`,
          formula: `(Total Horas Trabalhadas / 40h) × 100 = (${formatHours(metrics.totalHoursWorked)} / 40h) × 100`,
          explanation: 'Métrica de contexto - não impacta o score. Todos os devs trabalham ~40h.',
        },
        {
          label: 'Taxa de Conclusão',
          value: `${metrics.completionRate.toFixed(1)}%`,
          formula: `(Tarefas Concluídas / Tarefas Iniciadas) × 100 = (${metrics.tasksCompleted} / ${metrics.tasksStarted}) × 100`,
          explanation: 'Métrica informativa - não impacta o score. Pode ser afetada por interrupções/realocações.',
        },
        {
          label: 'Percentual de Bugs',
          value: `${metrics.bugRate.toFixed(1)}%`,
          formula: `(Tarefas tipo Bug / Total Tarefas) × 100`,
          explanation: 'Métrica informativa apenas. Bugs são um tipo de tarefa como qualquer outro.',
        },
      ],
    });

    return sections;
  };

  const breakdown = generateBreakdown();

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
      green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
      gray: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100',
    };
    return colors[color] || colors.gray;
  };

  const getComplexityColor = (level: number) => {
    if (level >= 4) return 'text-purple-600 dark:text-purple-400 font-semibold';
    if (level >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Breakdown de Cálculos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metrics.developerName} • {metrics.sprintName}
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
          {breakdown.map((section, sectionIdx) => (
            <div
              key={sectionIdx}
              className={`rounded-xl border-2 p-5 ${getColorClasses(section.color)}`}
            >
              <div className="flex items-center gap-3 mb-4">
                {section.icon}
                <h3 className="text-xl font-bold">{section.title}</h3>
              </div>

              <div className="space-y-4">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{item.label}</span>
                      <span className="text-lg font-bold">{item.value}</span>
                    </div>

                    {item.formula && (
                      <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded text-xs font-mono">
                        {item.formula}
                      </div>
                    )}

                    {item.explanation && (
                      <div className="mb-3 text-xs italic text-gray-600 dark:text-gray-400">
                        {item.explanation}
                      </div>
                    )}

                    {item.subItems && (
                      <div className="ml-4 space-y-2 mt-2">
                        {item.subItems.map((subItem, subIdx) => (
                          <div key={subIdx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{subItem.label}:</span>
                            <div className="text-right">
                              <span className="font-semibold">{subItem.value}</span>
                              {subItem.formula && (
                                <span className="text-gray-500 dark:text-gray-500 ml-2">({subItem.formula})</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.tasks && item.tasks.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-semibold mb-2">Tarefas Contribuindo:</div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {item.tasks.map((task, taskIdx) => (
                            <div
                              key={taskIdx}
                              className="bg-gray-50 dark:bg-gray-900/50 rounded p-2 text-xs border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-white truncate">
                                    {task.taskKey} - {task.taskSummary}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-gray-600 dark:text-gray-400">
                                    <span className={getComplexityColor(task.complexity)}>
                                      Complexidade {task.complexity}
                                    </span>
                                    <span>Est: {formatHours(task.hoursEstimated)}</span>
                                    <span>Gasto: {formatHours(task.hoursSpent)}</span>
                                    {task.deviation !== undefined && (
                                      <span className={task.deviation >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                        {task.deviation > 0 ? '+' : ''}{task.deviation.toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {task.impact && (
                                  <div className="text-right text-xs">
                                    <div className={`px-2 py-1 rounded ${
                                      task.impact.includes('✅') 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                        : task.impact.includes('❌')
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                    }`}>
                                      {task.impact}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>
              Este breakdown mostra exatamente como cada métrica foi calculada, incluindo todas as tarefas que contribuíram para o resultado final.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
