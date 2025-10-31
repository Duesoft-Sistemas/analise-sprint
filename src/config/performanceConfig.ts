/**
 * Configurações centralizadas de métricas de performance
 * 
 * Este arquivo contém todos os parâmetros fixos usados no cálculo de performance.
 * Qualquer alteração nestes valores afeta diretamente os cálculos e análises.
 */

// =============================================================================
// ZONA DE EFICIÊNCIA POR COMPLEXIDADE
// =============================================================================
// Define os limites esperados de horas para tarefas (complexidade 1-4)
// Usado para detectar tarefas simples que levaram tempo excessivo
// 
// SISTEMA UNIFICADO: Aplica para TODAS as tarefas (bugs e não-bugs)
// Se horas gastas ou estimadas excedem o limite esperado para aquela complexidade,
// a tarefa é considerada ineficiente, independente do desvio percentual.
// 
// IMPORTANTE: Complexidade 5 NÃO tem limites de zona de eficiência.
// Ela recebe apenas bonus de complexidade, sem penalizações por tempo excessivo.
// Isso reconhece que tarefas muito complexas são naturalmente imprevisíveis.
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
    maxEfficientHours: 2,
    maxAcceptableHours: 4,
  },
  {
    complexity: 2,
    name: 'Simples',
    maxEfficientHours: 4,
    maxAcceptableHours: 8,
  },
    {
      complexity: 3,
      name: 'Média',
      maxEfficientHours: 8,
      maxAcceptableHours: 16,
    },
  {
    complexity: 4,
    name: 'Complexa',
    maxEfficientHours: 16,
    maxAcceptableHours: 32,
  },
  // Complexidade 5 não tem limites de zona de eficiência
  // Apenas recebe bonus de complexidade, sem penalizações
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
  { complexity: 1, faster: 50, slower: -15 },  // Simples: mais rigoroso
  { complexity: 2, faster: 50, slower: -18 },
  { complexity: 3, faster: 50, slower: -20 },  // Média (padrão)
  { complexity: 4, faster: 50, slower: -30 },  // Complexa: mais tolerante
  { complexity: 5, faster: 50, slower: -40 },  // Muito complexa: muito tolerante
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

/** Bonus máximo por trabalhar em tarefas complexas (níveis 4-5) */
export const MAX_COMPLEXITY_BONUS = 10;

/** Bonus máximo por executar tarefas complexas com alta eficiência (seniority) */
export const MAX_SENIORITY_EFFICIENCY_BONUS = 15;

// =============================================================================
// CLASSIFICAÇÕES DE PERFORMANCE SCORE
// =============================================================================
// Limites para classificação do score final
// =============================================================================

export const PERFORMANCE_SCORE_CLASSIFICATIONS = {
  exceptional: { min: 115, label: '🏆 Excepcional', color: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700' },
  excellent: { min: 90, label: '⭐⭐⭐⭐⭐ Excelente', color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700' },
  veryGood: { min: 75, label: '⭐⭐⭐⭐ Muito Bom', color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700' },
  good: { min: 60, label: '⭐⭐⭐ Bom', color: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700' },
  adequate: { min: 45, label: '⭐⭐ Adequado', color: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-300 dark:border-orange-700' },
  needsAttention: { min: 0, label: '⭐ Precisa Atenção', color: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700' },
};

// =============================================================================
// AVALIAÇÃO DE EFICIÊNCIA POR COMPLEXIDADE
// =============================================================================
// Sistema unificado que verifica se horas gastas/estimadas excedem
// os limites esperados para aquela complexidade
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
 * SISTEMA UNIFICADO: Aplica para complexidades 1-4 apenas
 * 
 * Se horas gastas excedem o limite esperado para aquela complexidade,
 * a tarefa é considerada ineficiente, independente do desvio percentual.
 * 
 * IMPORTANTE: Complexidade 5 NÃO tem zona de eficiência.
 * Para complexidade 5, usa-se APENAS desvio percentual (compara estimativa vs horas gastas).
 * Esta função retorna type: 'normal' para complexidade 5, indicando que deve ser avaliada
 * por desvio percentual (limites de tolerância) em vez de zona de eficiência.
 */
export function checkComplexityZoneEfficiency(
  complexity: number,
  hoursSpent: number,
  _hoursEstimated?: number // Para complexidade 5, a estimativa é necessária para avaliação por desvio percentual (não usado aqui, apenas documentação)
): EfficiencyImpactReason {
  // Complexidade 5 não tem zona de eficiência - deve ser avaliada por desvio percentual
  // Retornamos type: 'normal' para indicar que não foi avaliada por zona e deve usar desvio percentual
  // IMPORTANTE: Para complexidade 5, é necessário ter estimativa para avaliar eficiência por desvio percentual
  if (complexity >= 5) {
    return {
      type: 'normal',
      description: `Complexidade ${complexity} não tem limites de zona de eficiência. Deve ser avaliada por desvio percentual (compara estimativa vs horas gastas).`,
      isEfficient: false, // Não marcamos como eficiente aqui - será avaliado por desvio percentual no código que chama
      hoursSpent,
    };
  }

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
  const maxHours = hoursSpent;
  
  if (maxHours <= zone.maxEfficientHours) {
    return {
      type: 'complexity_zone',
      description: `${maxHours}h gastas para complexidade ${complexity} está dentro da zona eficiente (máx ${zone.maxEfficientHours}h)`,
      isEfficient: true,
      zone: 'efficient',
      hoursSpent,
      expectedMaxHours: zone.maxEfficientHours,
    };
  } else if (maxHours <= zone.maxAcceptableHours) {
    return {
      type: 'complexity_zone',
      description: `${maxHours}h gastas para complexidade ${complexity} está na zona aceitável (máx ${zone.maxAcceptableHours}h)`,
      isEfficient: false,
      zone: 'acceptable',
      hoursSpent,
      expectedMaxHours: zone.maxAcceptableHours,
    };
  } else {
    return {
      type: 'complexity_zone',
      description: `${maxHours}h gastas para complexidade ${complexity} excede o esperado (máx ${zone.maxAcceptableHours}h). Tempo gasto excessivo para a complexidade da tarefa.`,
      isEfficient: false,
      zone: 'inefficient',
      hoursSpent,
      expectedMaxHours: zone.maxAcceptableHours,
    };
  }
}

