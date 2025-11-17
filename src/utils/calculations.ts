// Parse time string from CSV (format: "1h 30m" or "2h" or "45m") or numeric seconds
export function parseTimeToHours(timeString: string | number): number {
  if (timeString === null || timeString === undefined || timeString === '') return 0;
  
  // Se for número, assumir que está em segundos e converter para horas
  if (typeof timeString === 'number') {
    // Verificar se é um número válido
    if (isNaN(timeString)) return 0;
    return timeString / 3600;
  }
  
  // Converter para string se ainda não for
  const timeStr = String(timeString).trim();
  
  // Se for string vazia após trim
  if (timeStr === '') return 0;
  
  // Tentar converter string para número (caso seja número em formato string)
  const numericValue = parseFloat(timeStr);
  if (!isNaN(numericValue) && !timeStr.includes('h') && !timeStr.includes('m')) {
    // É um número em formato string, assumir que está em segundos
    return numericValue / 3600;
  }
  
  // Processar formato de texto "1h 30m" ou "2h" ou "45m" ou "0.5h"
  // Regex que aceita decimais: (\d+\.?\d*) pega números inteiros e decimais
  const hoursMatch = timeStr.match(/(\d+\.?\d*)h/);
  const minutesMatch = timeStr.match(/(\d+\.?\d*)m/);
  
  const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseFloat(minutesMatch[1]) : 0;
  
  return hours + minutes / 60;
}

// Normalize text: remove accents and convert to lowercase for comparison
export function normalizeForComparison(text: string): string {
  if (!text) return '';
  // Remove accents and convert to lowercase
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Format hours to readable string
export function formatHours(hours: number): string {
  if (hours === null || hours === undefined || isNaN(hours)) return '0h';

  const sign = hours < 0 ? '-' : '';
  const absHours = Math.abs(hours);

  const totalMinutes = Math.round(absHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0 && m > 0) {
    return `${sign}${h}h ${m}m`;
  }
  if (h > 0) {
    return `${sign}${h}h`;
  }
  return `${sign}${m}m`;
}

// Check if status indicates task is completed by the developer
// Includes: teste, teste dev, teste gap, compilar, concluído/concluido
// Rationale: Once dev moves to test, they've delivered their part
// If issues arise, rework column will track quality impact
export function isCompletedStatus(status: string): boolean {
  const completedStatuses = [
    'teste',        // In testing - dev has delivered
    'teste dev',    // Dev testing - dev has delivered
    'teste gap',    // Gap testing - dev has delivered
    'compilar',     // Ready to compile/deploy
    'concluído',    // Completed (with accent)
    'concluido'     // Completed (without accent)
  ];
  return completedStatuses.some(s => 
    status.toLowerCase().includes(s.toLowerCase())
  );
}

// Check if status indicates task is blocked
export function isBlockedStatus(status: string): boolean {
  const blockedStatuses = ['bloqueada', 'bloqueado', 'blocked'];
  return blockedStatuses.some(s => 
    status.toLowerCase().includes(s.toLowerCase())
  );
}

// Determine task type from summary or key
export function determineTaskType(chave: string, resumo: string): 'Bug' | 'Tarefa' | 'História' | 'Outro' {
  const text = `${chave} ${resumo}`.toLowerCase();
  
  if (text.includes('bug')) return 'Bug';
  if (text.includes('história') || text.includes('historia') || text.includes('story')) return 'História';
  if (text.includes('tarefa') || text.includes('task')) return 'Tarefa';
  
  return 'Outro';
}

// Calculate risk level based on utilization
export function calculateRiskLevel(utilizationPercent: number): 'low' | 'medium' | 'high' {
  if (utilizationPercent >= 90) return 'high';
  if (utilizationPercent >= 70) return 'medium';
  return 'low';
}

// Parse date from CSV or Excel
export function parseDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  const str = dateString.trim();
  
  // Try ISO format first (YYYY-MM-DD) - parse as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  
  // Try Brazilian format (DD/MM/YYYY) - most common in this application
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  
  // Try with time component (YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ss)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.split(/[\s T]/);
    const [year, month, day] = parts[0].split('-').map(Number);
    
    // If time component exists, parse it (format: HH:mm or HH:mm:ss)
    if (parts[1]) {
      const timeParts = parts[1].split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0;
      return new Date(year, month - 1, day, hours, minutes, seconds, 0);
    }
    
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  
  // Try DD/MM/YYYY with time component
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const parts = str.split(/[\s T]/);
    const [day, month, year] = parts[0].split('/').map(Number);
    
    // If time component exists, parse it (format: HH:mm or HH:mm:ss)
    if (parts[1]) {
      const timeParts = parts[1].split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0;
      return new Date(year, month - 1, day, hours, minutes, seconds, 0);
    }
    
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  
  // Fallback: try native Date parsing but be aware of timezone issues
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
}

// Parse categories (may be comma-separated or semicolon-separated)
export function parseCategories(categoriesString: string): string[] {
  if (!categoriesString || categoriesString.trim() === '') return [];
  
  const separators = [',', ';', '|'];
  for (const sep of separators) {
    if (categoriesString.includes(sep)) {
      return categoriesString.split(sep).map(c => c.trim()).filter(c => c !== '');
    }
  }
  
  return [categoriesString.trim()];
}

// Parse detalhes ocultos (may be comma-separated or semicolon-separated)
// Similar to parseCategories but also normalizes values for comparison
export function parseDetalhesOcultos(detalhesOcultosString: string): string[] {
  if (!detalhesOcultosString || detalhesOcultosString.trim() === '') return [];
  
  const separators = [',', ';', '|'];
  for (const sep of separators) {
    if (detalhesOcultosString.includes(sep)) {
      return detalhesOcultosString.split(sep).map(c => c.trim()).filter(c => c !== '');
    }
  }
  
  return [detalhesOcultosString.trim()];
}

// Calculate percentage safely
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

 

/**
 * Check if a task has a sprint assigned (not backlog or placeholder)
 * IMPORTANT: Backlog tasks should NOT interfere in performance metrics
 * They are ONLY used for backlog analysis in multi-sprint view
 */
export function hasSprint(task: { sprint?: string }): boolean {
  return !!(task.sprint && task.sprint.trim() !== '') && !isBacklogSprintValue(task.sprint);
}

/**
 * Check if a task is neutral for performance calculations (e.g., meeting, training)
 * These tasks are excluded from quality and efficiency metrics
 */
export function isNeutralTask(task: { detalhesOcultos?: string[] }): boolean {
  if (!task.detalhesOcultos || task.detalhesOcultos.length === 0) return false;
  
  const neutralTypes = ['reuniao', 'reunioes', 'treinamento'];
  
  return task.detalhesOcultos.some(d => {
    const normalized = normalizeForComparison(d);
    return neutralTypes.includes(normalized);
  });
}

/**
 * Check if a task is an auxilio task
 */
export function isAuxilioTask(task: { detalhesOcultos?: string[] }): boolean {
  if (!task.detalhesOcultos || task.detalhesOcultos.length === 0) return false;
  return task.detalhesOcultos.some(d => normalizeForComparison(d) === 'auxilio');
}

/**
 * Detect if a Sprint cell value should be treated as Backlog.
 * Accepts common placeholders besides empty string: "backlog", "sem sprint", "-", "n/a", "na",
 * "não alocado"/"nao alocado", "none", "null", "undefined".
 */
export function isBacklogSprintValue(sprint: string | null | undefined): boolean {
  const raw = (sprint ?? '').trim();
  if (raw === '') return true;
  const normalized = normalizeForComparison(raw);
  const backlogAliases = new Set<string>([
    'backlog',
    'semsprint',
    'sem sprint',
    '-',
    '—',
    'n/a',
    'na',
    'nao alocado',
    'não alocado',
    'naoalocado',
    'nao-allocado',
    'nao_alocado',
    'none',
    'null',
    'undefined',
  ]);
  return backlogAliases.has(normalized);
}

