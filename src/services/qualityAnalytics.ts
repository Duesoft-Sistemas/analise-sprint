import { TaskItem } from '../types';

// Análise de qualidade agrupada por tipo de tarefa
export interface QualityAnalysis {
  tipo: 'Bug' | 'Tarefa' | 'História' | 'Outro';
  qualidade: string;
  tasks: QualityTask[];
  total: number;
}

// Tarefa com análise de qualidade para exportação
export interface QualityTask {
  id: string;
  assunto: string; // resumo da tarefa
  qualidade: string;
  tipo: 'Bug' | 'Tarefa' | 'História' | 'Outro';
}

// Resultado completo da análise de qualidade
export interface QualityAnalytics {
  // Agrupado por tipo -> qualidade -> tarefas
  byType: Map<'Bug' | 'Tarefa' | 'História' | 'Outro', Map<string, QualityTask[]>>;
  // Todas as qualidades únicas encontradas
  allQualities: string[];
  // Todas as tarefas com qualidade
  allTasks: QualityTask[];
}

/**
 * Calcula análise de qualidade dos chamados agrupados por tipo de tarefa
 */
export function calculateQualityAnalytics(tasks: TaskItem[]): QualityAnalytics {
  // IMPORTANT: Exclude tasks without sprint (backlog) - they don't interfere in quality analytics
  // Filtrar apenas tarefas que têm qualidade do chamado definida E têm sprint
  const tasksWithQuality = tasks.filter(t => 
    t.qualidadeChamado && 
    t.qualidadeChamado.trim() !== '' &&
    t.sprint &&
    t.sprint.trim() !== ''
  );
  
  // Mapear tarefas para formato QualityTask
  const allTasks: QualityTask[] = tasksWithQuality.map(task => ({
    id: task.id || task.chave,
    assunto: task.resumo,
    qualidade: task.qualidadeChamado!,
    tipo: task.tipo,
  }));

  // Agrupar por tipo -> qualidade
  const byType = new Map<'Bug' | 'Tarefa' | 'História' | 'Outro', Map<string, QualityTask[]>>();
  const allQualities = new Set<string>();

  // Inicializar mapa por tipo
  const tipos: Array<'Bug' | 'Tarefa' | 'História' | 'Outro'> = ['Bug', 'Tarefa', 'História', 'Outro'];
  tipos.forEach(tipo => {
    byType.set(tipo, new Map<string, QualityTask[]>());
  });

  // Agrupar tarefas
  allTasks.forEach(task => {
    const typeMap = byType.get(task.tipo);
    if (!typeMap) return;

    const quality = task.qualidade.trim();
    allQualities.add(quality);

    if (!typeMap.has(quality)) {
      typeMap.set(quality, []);
    }
    typeMap.get(quality)!.push(task);
  });

  return {
    byType,
    allQualities: Array.from(allQualities).sort(),
    allTasks,
  };
}

/**
 * Obtém análises de qualidade agrupadas por tipo
 */
export function getQualityAnalysisByType(
  analytics: QualityAnalytics
): QualityAnalysis[] {
  const result: QualityAnalysis[] = [];
  
  const tipos: Array<'Bug' | 'Tarefa' | 'História' | 'Outro'> = ['Bug', 'Tarefa', 'História', 'Outro'];
  
  tipos.forEach(tipo => {
    const typeMap = analytics.byType.get(tipo);
    if (!typeMap || typeMap.size === 0) return;

    // Criar entrada para cada qualidade neste tipo
    typeMap.forEach((tasks, qualidade) => {
      result.push({
        tipo,
        qualidade,
        tasks,
        total: tasks.length,
      });
    });
  });

  return result.sort((a, b) => {
    // Ordenar por tipo primeiro, depois por qualidade
    if (a.tipo !== b.tipo) {
      const tipoOrder = { Bug: 0, Tarefa: 1, História: 2, Outro: 3 };
      return tipoOrder[a.tipo] - tipoOrder[b.tipo];
    }
    return a.qualidade.localeCompare(b.qualidade);
  });
}

/**
 * Filtra tarefas por qualidade
 */
export function filterTasksByQuality(
  tasks: QualityTask[],
  qualityFilter?: string
): QualityTask[] {
  if (!qualityFilter || qualityFilter === 'Todas') {
    return tasks;
  }
  return tasks.filter(task => task.qualidade === qualityFilter);
}

/**
 * Filtra análises por qualidade
 */
export function filterAnalysisByQuality(
  analyses: QualityAnalysis[],
  qualityFilter?: string
): QualityAnalysis[] {
  if (!qualityFilter || qualityFilter === 'Todas') {
    return analyses;
  }
  return analyses.filter(analysis => analysis.qualidade === qualityFilter);
}

