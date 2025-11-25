/**
 * Configurações centralizadas de métricas de performance
 * 
 * Este arquivo contém todos os parâmetros fixos usados no cálculo de performance.
 * Qualquer alteração nestes valores afeta diretamente os cálculos e análises.
 */

// =============================================================================
// ZONA DE EFICIÊNCIA POR COMPLEXIDADE
// =============================================================================
// Define os limites esperados de horas para tarefas (complexidade 1-5)
// Usado para detectar tarefas simples que levaram tempo excessivo
// 
// SISTEMA SEPARADO: Zonas aplicam APENAS para bugs
// Features/Outros: usam apenas desvio percentual
// Bugs: usam zona de eficiência para todas as complexidades (1-5)
// 
// IMPORTANTE: Para bugs, todas as complexidades usam zona de eficiência
// baseada apenas em horas gastas (não na estimativa original).
// =============================================================================

export interface ComplexityEfficiencyZone {
  /** Nível de complexidade (1-5) */
  complexity: number;
  /** Nome descritivo do nível */
  name: string;
  /** Limite máximo esperado na zona verde (eficiente) - até este valor, a tarefa é considerada eficiente */
  maxEfficientHours: number;
  /** Limite máximo na zona amarela (aceitável) - acima de maxEfficientHours e até este valor, ainda é aceitável */
  maxAcceptableHours: number;
}

export const COMPLEXITY_EFFICIENCY_ZONES: ComplexityEfficiencyZone[] = [
  {
    complexity: 1,
    name: 'Muito Simples',
    maxEfficientHours: 1.5,
    maxAcceptableHours: 3,
  },
  {
    complexity: 2,
    name: 'Simples',
    maxEfficientHours: 3,
    maxAcceptableHours: 5,
  },
    {
      complexity: 3,
      name: 'Média',
      maxEfficientHours: 5,
      maxAcceptableHours: 9,
    },
  {
    complexity: 4,
    name: 'Complexa',
    maxEfficientHours: 9,
    maxAcceptableHours: 17,
  },
  {
    complexity: 5,
    name: 'Muito Complexa',
    maxEfficientHours: 17,
    maxAcceptableHours: 30,
  },
];

// Função auxiliar para obter a zona de eficiência de uma complexidade
export function getEfficiencyZone(complexity: number): ComplexityEfficiencyZone | null {
  return COMPLEXITY_EFFICIENCY_ZONES.find(z => z.complexity === complexity) || null;
}

// =============================================================================
// THRESHOLDS DE EFICIÊNCIA (Desvio Estimativa vs Tempo Gasto)
// =============================================================================
// Limites de tolerância para desvios entre estimativa e tempo gasto
// Valores positivos = executou mais rápido que estimado
// Valores negativos = executou mais devagar que estimado
// =============================================================================

export interface EfficiencyThreshold {
  /** Complexidade (1-5) */
  complexity: number;
  /** Limite superior de desvio (quando executou mais rápido) - sempre positivo */
  faster: number;
  /** Limite inferior de desvio (quando executou mais devagar) - sempre negativo */
  slower: number;
}

export const EFFICIENCY_THRESHOLDS: EfficiencyThreshold[] = [
  { complexity: 1, faster: Infinity, slower: -15 },
  { complexity: 2, faster: Infinity, slower: -20 },
  { complexity: 3, faster: Infinity, slower: -25 },
  { complexity: 4, faster: Infinity, slower: -30 },
  { complexity: 5, faster: Infinity, slower: -35 },
];

// Função auxiliar para obter o threshold de uma complexidade
export function getEfficiencyThreshold(complexity: number): EfficiencyThreshold {
  return EFFICIENCY_THRESHOLDS.find(t => t.complexity === complexity) || EFFICIENCY_THRESHOLDS[2]; // Default: média
}

// =============================================================================
// CONFIGURAÇÕES DO PERFORMANCE SCORE
// =============================================================================
// Pesos relativos de cada componente do score final
// =============================================================================

export const PERFORMANCE_SCORE_WEIGHTS = {
  /** Peso do Score de Qualidade (0-1) */
  quality: 0.50,
  /** Peso da Eficiência de Execução (0-1) */
  efficiency: 0.50,
  /** Peso da Taxa de Conclusão (0-1) - REMOVIDO: não faz mais parte do score */
  // completion: 0.25, // Removido: pode ser afetada por interrupções/realocações (não é culpa do dev)
};

/** Bonus máximo por executar tarefas complexas com alta eficiência (seniority) */
export const MAX_SENIORITY_EFFICIENCY_BONUS = 15;

/** Bonus máximo por executar tarefas de complexidade média (3) com alta eficiência */
export const MAX_COMPLEXITY_3_BONUS = 5;

/** Bonus máximo por ajudar outros desenvolvedores (auxílio) */
export const MAX_AUXILIO_BONUS = 10;

// =============================================================================
// ESCALAS DE BÔNUS PROGRESSIVO
// =============================================================================

export interface BonusScale {
  /** Horas mínimas para atingir o bônus */
  minHours: number;
  /** Pontos de bônus concedidos */
  points: number;
}

/** Escala de bônus para horas de auxílio */
export const AUXILIO_BONUS_SCALE: BonusScale[] = [
  { minHours: 16, points: 10 },
  { minHours: 12, points: 9 },
  { minHours: 8, points: 7 },
  { minHours: 6, points: 5 },
  { minHours: 4, points: 4 },
  { minHours: 2, points: 2 },
  { minHours: 0.5, points: 1 },
];

// =============================================================================
// CLASSIFICAÇÕES DE PERFORMANCE SCORE
// =============================================================================
// Limites para classificação do score final
// =============================================================================

export const PERFORMANCE_SCORE_CLASSIFICATIONS = {
  exceptional: { min: 115, max: 130, label: '🏆 Excepcional', color: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700' },
  excellent: { min: 90, max: 114, label: '⭐⭐⭐⭐⭐ Excelente', color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700' },
  veryGood: { min: 75, max: 89, label: '⭐⭐⭐⭐ Muito Bom', color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700' },
  good: { min: 60, max: 74, label: '⭐⭐⭐ Bom', color: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700' },
  adequate: { min: 45, max: 59, label: '⭐⭐ Adequado', color: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-300 dark:border-orange-700' },
  needsAttention: { min: 0, max: 44, label: '⭐ Precisa Atenção', color: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700' },
};

// =============================================================================
// AVALIAÇÃO DE EFICIÊNCIA POR COMPLEXIDADE
// =============================================================================
// Sistema separado que verifica eficiência baseado no tipo de tarefa
// Bugs: usa zonas de eficiência para todas as complexidades (1-5)
// Features/Outros: usa apenas desvio
// =============================================================================

export interface EfficiencyImpactReason {
  /** Tipo de impacto */
  type: 'normal' | 'complexity_zone';
  /** Descrição do motivo */
  description: string;
  /** Se a tarefa foi considerada eficiente ou não */
  isEfficient: boolean;
  /** Zona de eficiência aplicada */
  zone?: 'efficient' | 'acceptable' | 'inefficient';
  /** Horas gastas */
  hoursSpent: number;
  /** Limite esperado para a complexidade */
  expectedMaxHours?: number;
}

/**
 * Verifica se uma tarefa é eficiente baseado na zona de complexidade
 * SISTEMA SEPARADO: Aplica zonas APENAS para bugs
 * 
 * - BUGS: Usam zona de complexidade para todas as complexidades (1-5)
 * - FEATURES/OUTROS: Sempre usam apenas desvio percentual
 * 
 * Se horas gastas excedem o limite esperado para aquela complexidade,
 * a tarefa é considerada ineficiente, independente do desvio percentual.
 * 
 * IMPORTANTE: Para bugs, todas as complexidades (1-5) usam zona de eficiência
 * baseada apenas em horas gastas (não na estimativa original).
 */
export function checkComplexityZoneEfficiency(
  complexity: number,
  hoursSpent: number,
  _hoursEstimated?: number, // Não usado para bugs (avaliação baseada apenas em horas gastas)
  taskType?: 'Bug' | 'Tarefa' | 'História' | 'Outro' // Tipo da tarefa
): EfficiencyImpactReason {
  // Se não é bug, retornar type: 'normal' imediatamente (avaliado por desvio percentual)
  if (taskType && taskType !== 'Bug') {
    return {
      type: 'normal',
      description: `Tarefas não-bugs (${taskType}) usam apenas desvio percentual, não zona de complexidade`,
      isEfficient: false, // Não marcamos como eficiente aqui - será avaliado por desvio percentual no código que chama
      hoursSpent,
    };
  }

  // Complexidade 5 agora também usa zona de eficiência para bugs (padronizado)

  const zone = getEfficiencyZone(complexity);
  
  if (!zone) {
    return {
      type: 'normal',
      description: 'Complexidade não encontrada',
      isEfficient: true,
      hoursSpent,
    };
  }

  // Verificar se horas gastas excedem o limite esperado para aquela complexidade
  // IMPORTANTE: Usa apenas horas gastas, não a estimativa original
  // A estimativa não é responsabilidade só do dev, então não deve penalizar por estimativa ruim
  // A estimativa original ainda é usada no cálculo do desvio percentual (fallback)
  
  if (hoursSpent <= zone.maxEfficientHours) {
    return {
      type: 'complexity_zone',
      description: `${hoursSpent}h gastas para complexidade ${complexity} está dentro da zona eficiente (máx ${zone.maxEfficientHours}h)`,
      isEfficient: true,
      zone: 'efficient',
      hoursSpent,
      expectedMaxHours: zone.maxEfficientHours,
    };
  } else if (hoursSpent <= zone.maxAcceptableHours) {
    return {
      type: 'complexity_zone',
      description: `${hoursSpent}h gastas para complexidade ${complexity} está na zona aceitável (máx ${zone.maxAcceptableHours}h)`,
      isEfficient: false,
      zone: 'acceptable',
      hoursSpent,
      expectedMaxHours: zone.maxAcceptableHours,
    };
  } else {
    return {
      type: 'complexity_zone',
      description: `${hoursSpent}h gastas para complexidade ${complexity} excede o esperado (máx ${zone.maxAcceptableHours}h). Tempo gasto excessivo para a complexidade da tarefa.`,
      isEfficient: false,
      zone: 'inefficient',
      hoursSpent,
      expectedMaxHours: zone.maxAcceptableHours,
    };
  }
}

