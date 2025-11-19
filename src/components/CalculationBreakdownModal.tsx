import React from 'react';
import { X, Calculator, Info, Award, Target } from 'lucide-react';
import { SprintPerformanceMetrics, TaskItem } from '../types';
import { formatHours, isCompletedStatus, normalizeForComparison, isNeutralTask } from '../utils/calculations';
import { getEfficiencyThreshold } from '../config/performanceConfig';

// Helper functions for task types
function isAuxilioTask(task: TaskItem): boolean {
  if (!task.detalhesOcultos || task.detalhesOcultos.length === 0) return false;
  return task.detalhesOcultos.some(d => normalizeForComparison(d) === 'auxilio');
}

function isReuniaoTask(task: TaskItem): boolean {
  if (!task.detalhesOcultos || task.detalhesOcultos.length === 0) return false;
  return task.detalhesOcultos.some(d => normalizeForComparison(d) === 'reuniao');
}

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
    const completedWithEstimates = completedTasks.filter(t => t.hoursEstimated > 0);

    // Separate bugs and features
    const bugs = completedWithEstimates.filter(t => t.task.tipo === 'Bug');
    const features = completedWithEstimates.filter(t => t.task.tipo !== 'Bug');

    // Calculate efficient tasks for each category
    const efficientBugs = bugs.filter(t => t.efficiencyImpact?.zone === 'efficient');
    const acceptableBugs = bugs.filter(t => t.efficiencyImpact?.zone === 'acceptable');
    const efficientFeatures = features.filter(t => {
      const deviation = t.estimationAccuracy;
      const threshold = getEfficiencyThreshold(t.complexityScore);
      return deviation > 0 ? true : deviation >= threshold.slower;
    });

    const weightedScore = efficientBugs.length + (acceptableBugs.length * 0.5) + efficientFeatures.length;

    // 1. Eficiência de Execução
    sections.push({
      title: 'Eficiência de Execução',
      icon: <Target className="w-5 h-5" />,
      color: 'green',
      items: [
        {
          label: 'Eficiência Geral (para Performance Score)',
          value: `${(metrics.accuracyRate ?? 0).toFixed(1)}%`,
          formula: `(Pontos de Eficiência / Total de Tarefas) × 100 = (${weightedScore} / ${completedWithEstimates.length}) × 100`,
          explanation: 'Esta é a métrica de eficiência consolidada usada no cálculo do seu Performance Score. Bugs aceitáveis valem 0.5 pontos.',
          subItems: [
            {
              label: 'Bugs Eficientes',
              value: `${efficientBugs.length} de ${bugs.length}`,
              formula: `(${efficientBugs.length} × 1.0) + (${acceptableBugs.length} × 0.5) = ${efficientBugs.length + (acceptableBugs.length * 0.5)} pts`
            },
            {
              label: 'Features Eficientes',
              value: `${efficientFeatures.length} de ${features.length}`,
            },
            {
              label: 'Pontuação Total de Eficiência',
              value: `${weightedScore} de ${completedWithEstimates.length}`,
            },
            {
              label: 'Contribuição para Score Base',
              value: `${((metrics.accuracyRate ?? 0) * 0.5).toFixed(1)} pontos`,
              formula: `50% de ${(metrics.accuracyRate ?? 0).toFixed(1)}%`
            }
          ]
        },
        {
          label: 'Taxa de Eficiência (Bugs)',
          value: `${(metrics.bugAccuracyRate ?? 0).toFixed(1)}%`,
          formula: `(Bugs Eficientes / Total de Bugs) × 100 = (${efficientBugs.length} / ${bugs.length}) × 100`,
          explanation: 'Percentual de BUGS executados de forma eficiente, usando a zona de complexidade (baseado apenas nas horas gastas).',
          tasks: bugs.map(t => {
            const isEfficient = efficientBugs.includes(t);
            const isAcceptable = acceptableBugs.includes(t);
            const zone = t.efficiencyImpact;
            let impact = '';
            
            if (zone && zone.type === 'complexity_zone') {
              let statusLabel = '';
              let statusIcon = '';

              switch (zone.zone) {
                case 'efficient':
                  statusLabel = 'Eficiente (1.0 pts)';
                  statusIcon = '✅';
                  break;
                case 'acceptable':
                  statusLabel = 'Aceitável (0.5 pts)';
                  statusIcon = '⚠️';
                  break;
                case 'inefficient':
                  statusLabel = 'Fora da Zona';
                  statusIcon = '❌';
                  break;
                default:
                  statusLabel = isEfficient ? 'Eficiente' : 'Não Eficiente';
                  statusIcon = isEfficient ? '✅' : '❌';
              }
              impact = `${zone.description} → ${statusIcon} ${statusLabel}`;
            } else {
              // Fallback if not evaluated by zone (should not happen for bugs)
              impact = `Avaliado por desvio: ${t.estimationAccuracy.toFixed(1)}%`;
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
          label: 'Desvio Médio de Estimativa (Features)',
          value: `${(metrics.featureEstimationAccuracy ?? 0) > 0 ? '+' : ''}${(metrics.featureEstimationAccuracy ?? 0).toFixed(1)}%`,
          formula: 'Média do desvio percentual para TAREFAS e HISTÓRIAS com estimativa.',
          explanation: `Média do desvio de todas as features e histórias. ${
            (metrics.featureEstimationAccuracy ?? 0) < -10
            ? 'Tendência a subestimar (gastou mais que estimado)' 
            : (metrics.featureEstimationAccuracy ?? 0) > 10
            ? 'Tendência a superestimar (gastou menos que estimado)'
            : 'Estimativas balanceadas'}. A lista abaixo detalha o desvio de cada tarefa.`,
          tasks: features.map(t => {
            const isEfficient = efficientFeatures.includes(t);
            const threshold = getEfficiencyThreshold(t.complexityScore);
            const efficientLabel = '✅ Eficiente';
            const inefficientLabel = '❌ Não Eficiente';
            let impact = '';
            const deviation = t.estimationAccuracy;
            const complexity = t.task.complexidade;

            if (deviation >= 0) { // No prazo ou mais rápido
              impact = `Desvio de +${deviation.toFixed(1)}% para complexidade ${complexity}. → ${efficientLabel}`;
            } else { // Mais lento
              const limit = threshold.slower;
              if (isEfficient) {
                impact = `Desvio de ${deviation.toFixed(1)}% para complexidade ${complexity} está dentro da tolerância (${limit}%). → ${efficientLabel}`;
              } else {
                impact = `Desvio de ${deviation.toFixed(1)}% para complexidade ${complexity} excede a tolerância de atraso (${limit}%). → ${inefficientLabel}`;
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
      ],
    });

    // =============================================================================
    // 4. CALCULAR MÉTRICAS DE QUALIDADE (baseado em nota de teste)
    // =============================================================================
    const qualityTasks = completedTasks.filter(t => !isNeutralTask(t.task) && t.task.notaTeste !== null && t.task.notaTeste !== undefined);
    const testNotes = qualityTasks.map(t => t.task.notaTeste as number);
    const avgTestNote = testNotes.length > 0 ? (testNotes.reduce((s, n) => s + n, 0) / testNotes.length) : 0;
    const qualityScore = testNotes.length > 0 ? Math.max(0, Math.min(100, avgTestNote * 20)) : 0;

    sections.push({
      title: 'Qualidade',
      icon: <Award className="w-5 h-5" />,
      color: 'purple',
      items: [
        {
          label: 'Score de Qualidade',
          value: qualityScore > 0 ? qualityScore.toFixed(1) : 'N/A',
          formula: qualityScore > 0 ? `Nota de Teste Média × 20 = ${avgTestNote.toFixed(1)} × 20` : 'Nenhuma tarefa com nota de teste.',
          explanation: 'Baseado na Nota de Teste (1-5). Tarefas sem nota, de "Auxílio" ou "Reunião" são desconsideradas.',
          tasks: completedTasks.map(t => ({
            taskKey: t.task.chave || t.task.id,
            taskSummary: t.task.resumo || 'Sem resumo',
            complexity: t.task.complexidade,
            hoursEstimated: t.hoursEstimated,
            hoursSpent: t.hoursSpent,
            status: t.task.status,
            impact:
              isNeutralTask(t.task) || t.task.notaTeste === null || t.task.notaTeste === undefined
                ? `Nota: N/A (Ignorado)`
                : `Nota: ${t.task.notaTeste}/5 (contribui: ${(t.task.notaTeste * 20).toFixed(1)})`,
          })),
        },
        {
          label: 'Nota de Teste Média',
          value: avgTestNote > 0 ? `${avgTestNote.toFixed(1)}/5` : 'N/A',
          formula:
            testNotes.length > 0
              ? `Soma das notas / Total = ${testNotes.reduce((sum, n) => sum + n, 0)} / ${testNotes.length}`
              : 'Nenhuma tarefa com nota.',
        },
      ],
    });

    // =============================================================================
    // 5. CALCULAR PERFORMANCE SCORE
    // =============================================================================
    const executionEfficiency = metrics.accuracyRate ?? 0;

    const scoreHasQuality = qualityTasks.length > 0;

    const baseScore = scoreHasQuality
        ? ((qualityScore * 0.50) + (executionEfficiency * 0.50))
        : executionEfficiency;
    
    sections.push({
        title: 'Score de Performance',
        icon: <Calculator className="w-5 h-5" />,
        color: 'yellow',
        items: [
            {
                label: 'Score Base',
                value: baseScore.toFixed(1),
                formula: scoreHasQuality
                    ? `(50% × Qualidade) + (50% × Eficiência) = (0.5 × ${qualityScore.toFixed(1)}) + (0.5 × ${(metrics.accuracyRate ?? 0).toFixed(1)})`
                    : `Eficiência = ${(metrics.accuracyRate ?? 0).toFixed(1)} (sem componente de qualidade)`,
                subItems: scoreHasQuality ? [
                    {
                        label: 'Componente Qualidade',
                        value: `${(qualityScore * 0.5).toFixed(1)}`,
                        formula: `50% × ${qualityScore.toFixed(1)}`,
                    },
                    {
                        label: 'Componente Eficiência',
                        value: `${((metrics.accuracyRate ?? 0) * 0.5).toFixed(1)}`,
                        formula: `50% × ${(metrics.accuracyRate ?? 0).toFixed(1)}`,
                    },
                ] : [],
            },
            {
                label: 'Bonus de Senioridade',
                value: `+${metrics.seniorityEfficiencyBonus}`,
                formula: (() => {
                    const complexTasks = completedTasks.filter(t => t.complexityScore >= 4 && t.hoursEstimated > 0);
                    if (complexTasks.length === 0) return 'Nenhuma tarefa complexa executada';
                    
                    const efficientWithQuality = metrics.seniorityBonusTasks?.length || 0;
                    
                    if (complexTasks.length === 0) return '0 (sem tarefas complexas)';
                    const efficiencyScore = efficientWithQuality / complexTasks.length;
                    return `${efficientWithQuality} eficientes com qualidade / ${complexTasks.length} total = ${(efficiencyScore * 100).toFixed(1)}% × 15`;
                })(),
                explanation: `Recompensa executar tarefas complexas (nível 4-5) com alta eficiência E alta qualidade (nota ≥ 4).`,
                tasks: metrics.seniorityBonusTasks?.map(task => ({
                  taskKey: task.chave || task.id,
                  taskSummary: task.resumo || 'Sem resumo',
                  complexity: task.complexidade,
                  hoursEstimated: task.estimativa || 0,
                  hoursSpent: task.tempoGastoTotal || 0,
                  status: task.status,
                  impact: `Nota: ${task.notaTeste}/5 ✅`,
                })),
            },
            {
                label: 'Bônus de Competência',
                value: `+${metrics.competenceBonus || 0}`,
                formula: (() => {
                    const mediumTasks = completedTasks.filter(t => t.complexityScore === 3 && t.hoursEstimated > 0);
                    if (mediumTasks.length === 0) return 'Nenhuma tarefa de complexidade média executada';
                    
                    const efficientWithQuality = metrics.competenceBonusTasks?.length || 0;
                    
                    const efficiencyScore = efficientWithQuality / mediumTasks.length;
                    return `${efficientWithQuality} eficientes com qualidade / ${mediumTasks.length} total = ${(efficiencyScore * 100).toFixed(1)}% × 5`;
                })(),
                explanation: `Recompensa executar tarefas de média complexidade (nível 3) com alta eficiência E alta qualidade (nota ≥ 4).`,
                tasks: metrics.competenceBonusTasks?.map(task => ({
                  taskKey: task.chave || task.id,
                  taskSummary: task.resumo || 'Sem resumo',
                  complexity: task.complexidade,
                  hoursEstimated: task.estimativa || 0,
                  hoursSpent: task.tempoGastoTotal || 0,
                  status: task.status,
                  impact: `Nota: ${task.notaTeste}/5 ✅`,
                })),
            },
            {
                label: 'Bonus de Auxílio',
                value: `+${metrics.auxilioBonus}`,
                formula: (() => {
                    const auxilioTasks = metrics.tasks.filter(t => isAuxilioTask(t.task));
                    if (auxilioTasks.length === 0) return '0h de auxílio = 0 pontos';
                    const totalHours = auxilioTasks.reduce((sum, t) => sum + t.hoursSpent, 0);
                    return `${formatHours(totalHours)} de ajuda = ${metrics.auxilioBonus} pontos`;
                })(),
                explanation: `Recompensa ajudar outros desenvolvedores (campo "Detalhes Ocultos" = "Auxilio"). Escala progressiva. ${metrics.auxilioBonus === 0 ? 'Nenhuma tarefa de auxílio registrada.' : 'Excelente colaboração!'}`,
            },
            {
                label: 'Bonus de Horas Extras',
                value: `+${metrics.overtimeBonus}`,
                formula: (() => {
                    const workTasks = metrics.tasks.filter(t => isCompletedStatus(t.task.status));
                    
                    const totalWorkHours = workTasks.reduce((sum, t) => sum + (t.task.tempoGastoNoSprint ?? 0), 0);
                    const overtimeHours = Math.max(0, totalWorkHours - 40);

                    if (overtimeHours === 0) return 'Total de horas não excedeu 40h = 0 pontos';

                    const overtimeTasks = workTasks.filter(t => t.task.detalhesOcultos.some(d => ['horaextra', 'hora extra', 'horas extras', 'horasextras'].includes(normalizeForComparison(d))));

                    if (overtimeTasks.length === 0) return 'Horas extras trabalhadas, mas nenhuma tarefa marcada como "HoraExtra" = 0 pontos';

                    const qualityOvertimeTasks = overtimeTasks.filter(t => !isAuxilioTask(t.task) && !isNeutralTask(t.task) && t.task.notaTeste !== null && t.task.notaTeste !== undefined);

                    if (qualityOvertimeTasks.length === 0) {
                        return `(${formatHours(totalWorkHours)} trab. - 40h) = ${formatHours(overtimeHours)} extras (sem tarefas com nota) → ${metrics.overtimeBonus} pontos`;
                    }

                    const avgNote = qualityOvertimeTasks.reduce((sum, t) => sum + (t.task.notaTeste ?? 0), 0) / qualityOvertimeTasks.length;

                    if (avgNote < 3) {
                        return `Média de ${avgNote.toFixed(1)} nas tarefas de HE < 3.0 = 0 pontos`;
                    }

                    return `(${formatHours(totalWorkHours)} trab. - 40h) = ${formatHours(overtimeHours)} extras com média ${avgNote.toFixed(1)} ≥ 3.0 → ${metrics.overtimeBonus} pontos`;
                })(),
                explanation: `Reconhece esforço adicional com qualidade adequada (média de nota ≥ 3.0).`,
                tasks: metrics.overtimeBonusTasks?.map(task => ({
                  taskKey: task.chave || task.id,
                  taskSummary: task.resumo || 'Sem resumo',
                  complexity: task.complexidade,
                  hoursEstimated: task.estimativa || 0,
                  hoursSpent: task.tempoGastoTotal || 0,
                  status: task.status,
                  impact: `Nota: ${task.notaTeste !== null ? task.notaTeste : 'N/A'}/5`,
                })),
            },
            {
                label: 'Score Final',
                value: `${(metrics.performanceScore ?? 0).toFixed(1)}`,
                formula: `Score Base + Bônus = ${baseScore.toFixed(1)} + ${metrics.seniorityEfficiencyBonus} + ${metrics.competenceBonus || 0} + ${metrics.auxilioBonus} + ${metrics.overtimeBonus}`,
                explanation: `Score máximo: 140.`,
            },
        ],
    });

    // 4. Métricas Informativas
    sections.push({
      title: 'Métricas Informativas',
      icon: <Info className="w-5 h-5" />,
      color: 'gray',
      items: [
        {
          label: 'Taxa de Utilização',
          value: `${(metrics.utilizationRate ?? 0).toFixed(1)}%`,
          formula: `(Total Horas Trabalhadas / 40h) × 100 = (${formatHours(metrics.totalHoursWorked)} / 40h) × 100`,
          explanation: 'Métrica de contexto - não impacta o score. Todos os devs trabalham ~40h.',
        },
        {
          label: 'Taxa de Conclusão',
          value: `${(metrics.completionRate ?? 0).toFixed(1)}%`,
          formula: `(Tarefas Concluídas / Tarefas Iniciadas) × 100 = (${metrics.tasksCompleted} / ${metrics.tasksStarted}) × 100`,
          explanation: 'Métrica informativa - não impacta o score. Pode ser afetada por interrupções/realocações.',
        },
        {
          label: 'Percentual de Bugs',
          value: `${(metrics.bugRate ?? 0).toFixed(1)}%`,
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
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
                          {[...item.tasks].sort((a, b) => {
                            const codeA = (a.taskKey || '').toUpperCase();
                            const codeB = (b.taskKey || '').toUpperCase();
                            return codeA.localeCompare(codeB);
                          }).map((task, taskIdx) => (
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
                                        : task.impact.includes('⚠️')
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
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
