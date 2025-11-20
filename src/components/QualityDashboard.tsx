import React, { useState, useMemo } from 'react';
import { AlertCircle, FileDown, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { TaskItem } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const sprintMetadata = useSprintStore((state) => state.sprintMetadata);
  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>('Todas');

  // Obter sprints finalizadas e o sprint atual ordenadas por data decrescente
  const availableSprints = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // Incluir sprints finalizadas e o sprint atual (se houver)
    return sprintMetadata
      .filter(meta => {
        const fim = meta.dataFim.getTime();
        const inicio = meta.dataInicio.getTime();
        const hoje = today.getTime();
        // Incluir se já finalizou OU se está em andamento (hoje está entre início e fim)
        return fim < hoje || (inicio <= hoje && fim >= hoje);
      })
      .sort((a, b) => b.dataFim.getTime() - a.dataFim.getTime())
      .map(meta => meta.sprint);
  }, [sprintMetadata]);

  // Opções de filtro de sprint
  const sprintFilterOptions = useMemo(() => {
    return ['Todas', ...availableSprints];
  }, [availableSprints]);

  // Filtrar tarefas com qualidade e problemas
  const problemTasks = useMemo(() => {
    // Filtrar tarefas com qualidade definida
    let filtered = tasks.filter(t => 
      t.qualidadeChamado && 
      t.qualidadeChamado.trim() !== '' &&
      !isInformacoesClaras(t.qualidadeChamado)
    );

    // Aplicar filtro de sprint
    if (selectedSprintFilter !== 'Todas') {
      filtered = filtered.filter(t => t.sprint === selectedSprintFilter);
    }

    // Ordenar por data de criação decrescente
    return filtered.sort((a, b) => {
      const dateA = a.criado?.getTime() || 0;
      const dateB = b.criado?.getTime() || 0;
      return dateB - dateA; // Decrescente
    });
  }, [tasks, selectedSprintFilter]);

  // Estatísticas resumidas
  const summaryStats = useMemo(() => {
    if (problemTasks.length === 0) return null;
    
    const byQuality = new Map<string, number>();
    problemTasks.forEach(task => {
      const qualidade = task.qualidadeChamado || '';
      const count = byQuality.get(qualidade) || 0;
      byQuality.set(qualidade, count + 1);
    });

    return {
      totalTasks: problemTasks.length,
      byQuality: Array.from(byQuality.entries()).map(([qualidade, count]) => ({ qualidade, count })),
    };
  }, [problemTasks]);

  // Função de exportação para PDF
  const exportToPDF = async () => {
    if (problemTasks.length === 0) return;

    // Tarefas já estão ordenadas por data decrescente
    const sortedTasks = problemTasks;

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    // Função helper para adicionar logo
    const addLogo = async (): Promise<{ width: number; height: number } | null> => {
      try {
        // Tentar carregar a logo da pasta imagens (tentativas com diferentes caminhos)
        const logoPaths = [
          './imagens/duesoft.jpg',
          '/imagens/duesoft.jpg',
          'imagens/duesoft.jpg',
          '../imagens/duesoft.jpg',
        ];
        
        // Tentar primeiro com fetch (para converter em base64)
        for (const path of logoPaths) {
          try {
            const response = await fetch(path);
            if (response.ok) {
              const blob = await response.blob();
              const reader = new FileReader();
              
              const result = await new Promise<{ width: number; height: number } | null>((resolve) => {
                reader.onload = (e) => {
                  try {
                    const img = new Image();
                    img.onload = () => {
                      // Calcular dimensões mantendo proporção (altura máxima 20mm)
                      const maxHeight = 20;
                      const aspectRatio = img.width / img.height;
                      const logoHeight = maxHeight;
                      const logoWidth = logoHeight * aspectRatio;
                      
                      // Adicionar logo no topo à esquerda
                      pdf.addImage(img, 'JPEG', margin, margin, logoWidth, logoHeight);
                      resolve({ width: logoWidth, height: logoHeight });
                    };
                    img.onerror = () => resolve(null);
                    img.src = e.target?.result as string;
                  } catch (error) {
                    resolve(null);
                  }
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
              });
              
              if (result) {
                return result;
              }
            }
          } catch (error) {
            // Continua para próximo caminho
            continue;
          }
        }
        
        // Se fetch não funcionar, tentar com Image diretamente
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        return new Promise<{ width: number; height: number } | null>((resolve) => {
          let currentPathIndex = 0;
          
          const tryNextPath = () => {
            if (currentPathIndex >= logoPaths.length) {
              resolve(null);
              return;
            }
            
            img.onload = () => {
              try {
                const maxHeight = 20;
                const aspectRatio = img.width / img.height;
                const logoHeight = maxHeight;
                const logoWidth = logoHeight * aspectRatio;
                
                pdf.addImage(img, 'JPEG', margin, margin, logoWidth, logoHeight);
                resolve({ width: logoWidth, height: logoHeight });
              } catch (error) {
                tryNextPath();
              }
            };
            
            img.onerror = () => {
              currentPathIndex++;
              if (currentPathIndex < logoPaths.length) {
                img.src = logoPaths[currentPathIndex];
              } else {
                resolve(null);
              }
            };
            
            img.src = logoPaths[currentPathIndex];
          };
          
          tryNextPath();
        });
      } catch (error) {
        return null;
      }
    };
    
    const logoInfo = await addLogo();
    const logoWidth = logoInfo ? logoInfo.width : 0;
    const logoHeight = logoInfo ? logoInfo.height : 0;
    const logoRightEdge = logoInfo ? margin + logoWidth + 10 : margin;

    // Cabeçalho profissional
    const headerY = margin;
    const headerStartX = logoRightEdge;
    
    // Linha divisória sutil no topo
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, headerY + logoHeight + 8, pageWidth - margin, headerY + logoHeight + 8);
    
    // Título principal
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Tickets com Problemas', headerStartX, headerY + 8);
    
    // Informações do filtro
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const filterText = selectedSprintFilter === 'Todas' 
      ? 'Todos os sprints' 
      : `Sprint: ${selectedSprintFilter}`;
    pdf.text(filterText, headerStartX, headerY + 16);
    
    // Data de geração (alinhada à direita)
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    const dateText = `Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, pageWidth - margin - dateWidth, headerY + 8);
    
    // Total de tickets (alinhado à direita, abaixo da data)
    const totalText = `Total: ${sortedTasks.length} ticket${sortedTasks.length !== 1 ? 's' : ''}`;
    const totalWidth = pdf.getTextWidth(totalText);
    pdf.text(totalText, pageWidth - margin - totalWidth, headerY + 16);
    
    // Resetar cor do texto para preto
    pdf.setTextColor(0, 0, 0);
    
    // Altura do cabeçalho para posicionar a tabela
    const headerHeight = headerY + logoHeight + 20;
    
    // Preparar dados da tabela - apenas Código e Descrição
    const tableData = sortedTasks.map(task => [
      task.chave || task.id || '-',
      task.resumo || '-',
    ]);
    
    // Criar tabela
    if (tableData.length > 0) {
      autoTable(pdf, {
        startY: headerHeight,
        head: [['Código', 'Descrição']],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        headStyles: { 
          fillColor: [220, 38, 38], // Vermelho para indicar problemas
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 30 }, // Código
          1: { cellWidth: 'auto' }, // Descrição (resto do espaço)
        },
        didParseCell: (data: any) => {
          const colIndex = data.column.index;
          
          // Destacar Código em vermelho
          if (colIndex === 0 && data.row.index >= 0) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
    }
    
    // Rodapé com numeração de páginas
    const totalPages = (pdf as any).internal?.getNumberOfPages() || 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin - 30,
        pageHeight - 10
      );
    }
    
    // Salvar PDF
    const sprintSuffix = selectedSprintFilter === 'Todas' 
      ? '' 
      : `_${selectedSprintFilter.replace(/[^a-z0-9]/gi, '_')}`;
    const fileName = `tickets-com-problemas${sprintSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
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

  if (problemTasks.length === 0) {
    const hasQualityTasks = tasks.some(t => 
      t.qualidadeChamado && t.qualidadeChamado.trim() !== ''
    );

    if (!hasQualityTasks) {
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 dark:text-green-400" />
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum ticket com problema encontrado.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {selectedSprintFilter === 'Todas' 
            ? 'Todos os tickets estão marcados como "Informações Claras".'
            : `Nenhum ticket com problema encontrado para o filtro selecionado.`}
        </p>
      </div>
    );
  }

  // Tarefas já estão ordenadas por data decrescente
  const sortedTasks = problemTasks;

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

      {/* Filtro de Sprint */}
      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <select
          value={selectedSprintFilter}
          onChange={(e) => setSelectedSprintFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
        >
          {sprintFilterOptions.map((sprint) => (
            <option key={sprint} value={sprint}>
              {sprint}
            </option>
          ))}
        </select>
      </div>

      {/* Estatísticas Resumidas */}
      {summaryStats && (
        <div className="grid grid-cols-1 gap-4">
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
        </div>
      )}

      {/* Lista de Tickets com Problemas */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Lista de Tickets
        </h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTasks.map((task, index) => (
              <div
                key={task.id}
                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-white min-w-[80px]">
                    {task.chave || task.id}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs min-w-[60px] text-center">
                    {task.tipo}
                  </span>
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded text-xs font-semibold min-w-[120px] text-center">
                    {task.qualidadeChamado}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs min-w-[100px] text-center">
                    {task.sprint || '-'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-xs min-w-[70px] text-center">
                    Est: {task.estimativa?.toFixed(1) || '0.0'}h
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-xs min-w-[70px] text-center">
                    Gasto: {task.tempoGastoTotal?.toFixed(1) || '0.0'}h
                  </span>
                  <span className="text-gray-800 dark:text-gray-200 text-sm flex-1 min-w-[200px]">
                    {task.resumo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

