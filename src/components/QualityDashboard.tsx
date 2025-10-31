import React, { useState, useMemo } from 'react';
import { CheckCircle2, Filter, FileDown, AlertCircle } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import {
  calculateQualityAnalytics,
  getQualityAnalysisByType,
  filterAnalysisByQuality,
  QualityTask,
} from '../services/qualityAnalytics';
import jsPDF from 'jspdf';

export const QualityDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);

  const [qualityFilter, setQualityFilter] = useState<string>('Todas');

  // Calcular análise de qualidade
  const analytics = useMemo(() => {
    if (tasks.length === 0) return null;
    return calculateQualityAnalytics(tasks);
  }, [tasks]);

  // Obter análises agrupadas por tipo
  const analyses = useMemo(() => {
    if (!analytics) return [];
    const allAnalyses = getQualityAnalysisByType(analytics);
    return filterAnalysisByQuality(allAnalyses, qualityFilter);
  }, [analytics, qualityFilter]);

  // Obter todas as qualidades disponíveis para o filtro
  const availableQualities = useMemo(() => {
    if (!analytics) return [];
    return ['Todas', ...analytics.allQualities];
  }, [analytics]);

  // Estatísticas resumidas
  const summaryStats = useMemo(() => {
    if (!analytics) return null;
    
    const totalTasks = analytics.allTasks.length;
    const byType = new Map<string, number>();
    
    analytics.allTasks.forEach(task => {
      const count = byType.get(task.tipo) || 0;
      byType.set(task.tipo, count + 1);
    });

    const byQuality = new Map<string, number>();
    analytics.allTasks.forEach(task => {
      const count = byQuality.get(task.qualidade) || 0;
      byQuality.set(task.qualidade, count + 1);
    });

    return {
      totalTasks,
      byType: Array.from(byType.entries()).map(([tipo, count]) => ({ tipo, count })),
      byQuality: Array.from(byQuality.entries()).map(([qualidade, count]) => ({ qualidade, count })),
    };
  }, [analytics]);

  // Função de exportação para PDF
  const exportToPDF = () => {
    if (!analytics) return;

    // Agrupar tarefas por qualidade primeiro
    const tasksByQuality = new Map<string, QualityTask[]>();
    const filteredTasks = qualityFilter === 'Todas' 
      ? analytics.allTasks 
      : analytics.allTasks.filter(t => t.qualidade === qualityFilter);

    filteredTasks.forEach(task => {
      if (!tasksByQuality.has(task.qualidade)) {
        tasksByQuality.set(task.qualidade, []);
      }
      tasksByQuality.get(task.qualidade)!.push(task);
    });

    // Ordenar qualidades
    const sortedQualities = Array.from(tasksByQuality.keys()).sort();

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;
    const lineHeight = 6;
    const sectionSpacing = 8;
    const tableMargin = margin;

    // Cabeçalho com fundo colorido elegante (mais compacto)
    pdf.setFillColor(59, 130, 246); // Azul bonito
    pdf.rect(0, 0, pageWidth, 38, 'F');
    
    // Título no cabeçalho
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('Análise de Qualidade dos Chamados', margin, yPosition + 12);
    
    // Data e filtro no cabeçalho (compacto)
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    const infoY = yPosition + 20;
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, infoY);
    
    if (qualityFilter !== 'Todas') {
      pdf.text(`Filtro: ${qualityFilter}`, margin + 80, infoY);
    }
    
    yPosition = 42;
    pdf.setTextColor(0, 0, 0);

    // Agrupar por qualidade
    sortedQualities.forEach((qualidade, qualityIndex) => {
      const tasksInQuality = tasksByQuality.get(qualidade)!;
      
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }

      // Título da qualidade com design elegante (mais compacto)
      const qualityHeaderHeight = lineHeight + 4;
      pdf.setFillColor(37, 99, 235); // Azul mais escuro
      pdf.setDrawColor(37, 99, 235);
      pdf.rect(tableMargin, yPosition - 2, pageWidth - 2 * tableMargin, qualityHeaderHeight, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      const qualityTitle = `${qualidade} (${tasksInQuality.length} tarefa${tasksInQuality.length !== 1 ? 's' : ''})`;
      pdf.text(qualityTitle, tableMargin + 3, yPosition + 2);
      yPosition += qualityHeaderHeight + 3;
      pdf.setTextColor(0, 0, 0);

      // Lista de tarefas em formato de tabela (uma linha por tarefa)
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      
      tasksInQuality.forEach((task, taskIndex) => {
        // Calcular altura da linha baseado no assunto (que pode quebrar em múltiplas linhas)
        const assuntoX = tableMargin + 70;
        const maxAssuntoWidth = pageWidth - assuntoX - tableMargin - 5;
        const assuntoLines = pdf.splitTextToSize(task.assunto, maxAssuntoWidth);
        const rowHeight = Math.max(lineHeight + 2, assuntoLines.length * lineHeight + 2);
        
        // Verificar se precisa de nova página
        if (yPosition + rowHeight > pageHeight - 10) {
          // Borda inferior da tabela anterior
          pdf.setDrawColor(226, 232, 240);
          pdf.line(tableMargin, yPosition - 1, pageWidth - tableMargin, yPosition - 1);
          
          pdf.addPage();
          yPosition = 15;
          
          // Repetir título da qualidade
          pdf.setFillColor(37, 99, 235);
          pdf.rect(tableMargin, yPosition - 2, pageWidth - 2 * tableMargin, qualityHeaderHeight, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(11);
          pdf.setFont(undefined, 'bold');
          pdf.text(qualityTitle, tableMargin + 3, yPosition + 2);
          yPosition += qualityHeaderHeight + 3;
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(8);
          pdf.setFont(undefined, 'normal');
        }

        // Fundo alternado suave para melhor legibilidade
        if (taskIndex % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(249, 250, 251);
        }
        pdf.rect(tableMargin, yPosition - rowHeight + 1, pageWidth - 2 * tableMargin, rowHeight, 'F');

        // ID da tarefa (na primeira linha)
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text(task.id, tableMargin + 3, yPosition - 1);
        pdf.setTextColor(0, 0, 0);
        
        // Tipo (na primeira linha, alinhado verticalmente ao meio)
        pdf.setFont(undefined, 'normal');
        const tipoX = tableMargin + 38;
        pdf.text(task.tipo, tipoX, yPosition - 1);
        
        // Assunto (pode quebrar em múltiplas linhas) - exibir todas as linhas
        let assuntoY = yPosition - 1;
        assuntoLines.forEach((line: string) => {
          pdf.text(line, assuntoX, assuntoY);
          assuntoY += lineHeight;
        });
        
        // Linha separadora inferior (mais sutil)
        if (taskIndex < tasksInQuality.length - 1) {
          pdf.setDrawColor(243, 244, 246);
          pdf.setLineWidth(0.2);
          pdf.line(tableMargin + 5, yPosition, pageWidth - tableMargin - 5, yPosition);
        }
        
        yPosition += rowHeight;
      });
      
      // Borda inferior da tabela
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(tableMargin, yPosition - 1, pageWidth - tableMargin, yPosition - 1);
      yPosition += 2;

      // Espaçamento entre qualidades (reduzido)
      if (qualityIndex < sortedQualities.length - 1) {
        yPosition += sectionSpacing;
      }
    });

    // Salvar PDF
    const fileName = `analise-qualidade-chamados-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum dado disponível. Faça upload de um arquivo Excel para começar.
        </p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Calculando análises de qualidade...</p>
      </div>
    );
  }

  if (analytics.allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        <p className="text-gray-500 dark:text-gray-400">
          Nenhuma tarefa com análise de qualidade encontrada.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Verifique se o campo "Campo personalizado (Qualidade do Chamado)" está preenchido no arquivo Excel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            Análise de Qualidade dos Chamados
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Análise de qualidade agrupada por tipo de tarefa
          </p>
        </div>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <select
          value={qualityFilter}
          onChange={(e) => setQualityFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
        >
          {availableQualities.map((quality) => (
            <option key={quality} value={quality}>
              {quality}
            </option>
          ))}
        </select>
      </div>

      {/* Estatísticas Resumidas */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total de Tarefas
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summaryStats.totalTasks}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipos Diferentes
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summaryStats.byType.length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Qualidades Diferentes
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summaryStats.byQuality.length}
            </p>
          </div>
        </div>
      )}

      {/* Análise por Tipo */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Análise Agrupada por Tipo e Qualidade
        </h2>
        
        {analyses.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              Nenhuma análise encontrada com o filtro selecionado.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {analyses.map((analysis, index) => (
              <div
                key={`${analysis.tipo}-${analysis.qualidade}-${index}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {analysis.tipo} - {analysis.qualidade}
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    {analysis.total} tarefa{analysis.total !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {analysis.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                              {task.id}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs">
                              {task.tipo}
                            </span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 font-medium mb-1">
                            {task.assunto}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Qualidade: <span className="font-semibold">{task.qualidade}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

