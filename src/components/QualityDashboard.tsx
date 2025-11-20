import React, { useMemo } from 'react';
import { AlertCircle, FileDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import {
  calculateQualityAnalytics,
  QualityTask,
} from '../services/qualityAnalytics';
import jsPDF from 'jspdf';

// Função auxiliar para verificar se uma qualidade é "informações claras"
const isInformacoesClaras = (qualidade: string): boolean => {
  const normalized = qualidade.trim().toLowerCase();
  return normalized === 'informações claras' || 
         normalized === 'informacoes claras' ||
         normalized === 'informação clara' ||
         normalized === 'informacao clara';
};

export const QualityDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);

  // Calcular análise de qualidade
  const analytics = useMemo(() => {
    if (tasks.length === 0) return null;
    return calculateQualityAnalytics(tasks);
  }, [tasks]);

  // Filtrar apenas tickets com problemas (não são "informações claras")
  const problemTasks = useMemo(() => {
    if (!analytics) return [];
    return analytics.allTasks.filter(task => !isInformacoesClaras(task.qualidade));
  }, [analytics]);

  // Estatísticas resumidas
  const summaryStats = useMemo(() => {
    if (!analytics || problemTasks.length === 0) return null;
    
    const byQuality = new Map<string, number>();
    problemTasks.forEach(task => {
      const count = byQuality.get(task.qualidade) || 0;
      byQuality.set(task.qualidade, count + 1);
    });

    return {
      totalTasks: problemTasks.length,
      byQuality: Array.from(byQuality.entries()).map(([qualidade, count]) => ({ qualidade, count })),
    };
  }, [analytics, problemTasks]);

  // Função de exportação para PDF
  const exportToPDF = () => {
    if (!analytics || problemTasks.length === 0) return;

    // Ordenar tarefas por ID
    const sortedTasks = [...problemTasks].sort((a, b) => {
      const codeA = (a.id || '').toUpperCase();
      const codeB = (b.id || '').toUpperCase();
      return codeA.localeCompare(codeB);
    });

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;
    const lineHeight = 6;
    const tableMargin = margin;

    // Cabeçalho com fundo colorido elegante (mais compacto)
    pdf.setFillColor(220, 38, 38); // Vermelho para indicar problemas
    pdf.rect(0, 0, pageWidth, 38, 'F');
    
    // Título no cabeçalho
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('Tickets com Problemas', margin, yPosition + 12);
    
    // Data no cabeçalho (compacto)
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    const infoY = yPosition + 20;
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, infoY);
    pdf.text(`Total: ${sortedTasks.length} ticket${sortedTasks.length !== 1 ? 's' : ''}`, margin + 80, infoY);
    
    yPosition = 42;
    pdf.setTextColor(0, 0, 0);

    // Lista de tarefas em formato de tabela (uma linha por tarefa)
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    
    sortedTasks.forEach((task, taskIndex) => {
      // Calcular altura da linha baseado no assunto (que pode quebrar em múltiplas linhas)
      const idX = tableMargin + 3;
      const tipoX = tableMargin + 45;
      const qualidadeX = tableMargin + 75;
      const assuntoX = tableMargin + 120;
      const maxAssuntoWidth = pageWidth - assuntoX - tableMargin - 5;
      const assuntoLines = pdf.splitTextToSize(task.assunto, maxAssuntoWidth);
      const qualidadeLines = pdf.splitTextToSize(task.qualidade, 30); // Limitar largura da qualidade
      const rowHeight = Math.max(
        lineHeight + 2, 
        Math.max(assuntoLines.length, qualidadeLines.length) * lineHeight + 2
      );
      
      // Verificar se precisa de nova página
      if (yPosition + rowHeight > pageHeight - 10) {
        // Borda inferior da tabela anterior
        pdf.setDrawColor(226, 232, 240);
        pdf.line(tableMargin, yPosition - 1, pageWidth - tableMargin, yPosition - 1);
        
        pdf.addPage();
        yPosition = 15;
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
      pdf.setTextColor(220, 38, 38);
      pdf.text(task.id, idX, yPosition - 1);
      pdf.setTextColor(0, 0, 0);
      
      // Tipo (na primeira linha)
      pdf.setFont(undefined, 'normal');
      pdf.text(task.tipo, tipoX, yPosition - 1);
      
      // Qualidade (pode quebrar em múltiplas linhas)
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(150, 0, 0);
      let qualidadeY = yPosition - 1;
      qualidadeLines.forEach((line: string) => {
        pdf.text(line, qualidadeX, qualidadeY);
        qualidadeY += lineHeight;
      });
      pdf.setTextColor(0, 0, 0);
      
      // Assunto (pode quebrar em múltiplas linhas) - exibir todas as linhas
      let assuntoY = yPosition - 1;
      assuntoLines.forEach((line: string) => {
        pdf.text(line, assuntoX, assuntoY);
        assuntoY += lineHeight;
      });
      
      // Linha separadora inferior (mais sutil)
      if (taskIndex < sortedTasks.length - 1) {
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

    // Salvar PDF
    const fileName = `tickets-com-problemas-${new Date().toISOString().split('T')[0]}.pdf`;
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

  if (analytics && analytics.allTasks.length === 0) {
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

  if (problemTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 dark:text-green-400" />
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum ticket com problema encontrado.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Todos os tickets estão marcados como "Informações Claras".
        </p>
      </div>
    );
  }

  // Ordenar tarefas por ID
  const sortedTasks = [...problemTasks].sort((a, b) => {
    const codeA = (a.id || '').toUpperCase();
    const codeB = (b.id || '').toUpperCase();
    return codeA.localeCompare(codeB);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            Tickets com Problemas
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Lista de tickets que não estão marcados como "Informações Claras"
          </p>
        </div>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Estatísticas Resumidas */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total de Tickets com Problemas
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summaryStats.totalTasks}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipos de Problemas Diferentes
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summaryStats.byQuality.length}
            </p>
          </div>
        </div>
      )}

      {/* Lista de Tickets com Problemas */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Lista de Tickets
        </h2>
        
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                      {task.id}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {task.tipo}
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded text-xs font-semibold">
                      {task.qualidade}
                    </span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    {task.assunto}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

