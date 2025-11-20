import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  FileText,
  Download,
  ChevronDown,
} from 'lucide-react';
import { AutocompleteSelect } from './AutocompleteSelect';
import { useSprintStore } from '../store/useSprintStore';
import { TaskItem, SprintPeriod } from '../types';
import { formatHours, isCompletedStatus, isBacklogSprintValue } from '../utils/calculations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função helper: calcular a sexta-feira da semana seguinte após o fim do sprint (domingo)
function getSextaFeiraSemanaSeguinte(sprintEndDate: Date): Date {
  // sprintEndDate é domingo, então sexta-feira da semana seguinte = domingo + 5 dias
  const sexta = new Date(sprintEndDate);
  sexta.setDate(sexta.getDate() + 5);
  sexta.setHours(23, 59, 59, 999);
  return sexta;
}

// Função helper: verificar se o status é realmente concluído (apenas "concluído"/"concluido", não teste/compilar)
function isReallyCompletedStatus(status: string): boolean {
  const normalized = (status || '').toLowerCase().trim();
  return normalized === 'concluído' || normalized === 'concluido';
}

interface DeliveryTask extends TaskItem {
  dataLimiteCalculada: Date; // Data limite real ou prevista
  isPrevisao: boolean; // Se a data é uma previsão (sprint + 5 dias)
}

interface StatusMultiSelectProps {
  selectedStatuses: string[];
  onChange: (statuses: string[]) => void;
  allStatuses: string[];
}

const StatusMultiSelect: React.FC<StatusMultiSelectProps> = ({ selectedStatuses, onChange, allStatuses }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onChange(selectedStatuses.filter(s => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  const specialStatuses = [
    { value: 'nao_concluidas', label: 'Não Concluídas' },
    { value: 'concluidas', label: 'Concluídas' },
  ];

  const displayText = selectedStatuses.length === 0 
    ? 'Todos' 
    : selectedStatuses.length === 1 
      ? selectedStatuses[0] === 'nao_concluidas' ? 'Não Concluídas'
        : selectedStatuses[0] === 'concluidas' ? 'Concluídas'
        : selectedStatuses[0]
      : `${selectedStatuses.length} selecionados`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 space-y-1">
            {specialStatuses.map(status => (
              <label
                key={status.value}
                className="flex items-center px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status.value)}
                  onChange={() => toggleStatus(status.value)}
                  className="mr-2 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-900 dark:text-white">{status.label}</span>
              </label>
            ))}
            {allStatuses.length > 0 && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                {allStatuses.map(status => (
                  <label
                    key={status}
                    className="flex items-center px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="mr-2 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{status}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TasksDashboard: React.FC = () => {
  const tasks = useSprintStore((state) => state.tasks);
  const getSprintPeriod = useSprintStore((state) => state.getSprintPeriod);
  const [taskListFilter, setTaskListFilter] = useState<'dataLimite' | 'previsao' | 'todas'>('todas');
  
  // Filtros para a lista de tarefas
  const [filterDataDe, setFilterDataDe] = useState<string>('');
  const [filterDataAte, setFilterDataAte] = useState<string>('');
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [filterSprint, setFilterSprint] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDescricao, setFilterDescricao] = useState<string>('');
  const [filterCodigo, setFilterCodigo] = useState<string>('');
  const [filterResponsavel, setFilterResponsavel] = useState<string>('');
  const [filterFeature, setFilterFeature] = useState<string>('');
  const [filterModulo, setFilterModulo] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterComplexidade, setFilterComplexidade] = useState<string>('');
  
  // IMPORTANTE: No menu de Tarefas, incluir TODAS as tarefas sem restrições
  // Transformar TODAS as tarefas em DeliveryTask para consistência
  const allTasks = useMemo(() => {
    return tasks.map(task => {
      // Se tem data limite, usar ela
      if (task.dataLimite) {
        return {
          ...task,
          dataLimiteCalculada: task.dataLimite,
          isPrevisao: false,
        };
      }
      
      // Se tem sprint válido, calcular previsão
      const sprintName = task.sprint?.trim();
      if (sprintName && !isBacklogSprintValue(sprintName)) {
        const sprintPeriod = getSprintPeriod(sprintName);
        if (sprintPeriod) {
          const sprintEndDate = new Date(sprintPeriod.endDate);
          sprintEndDate.setHours(0, 0, 0, 0);
          const dataPrevisao = getSextaFeiraSemanaSeguinte(sprintEndDate);
          
          return {
            ...task,
            dataLimiteCalculada: dataPrevisao,
            isPrevisao: true,
          };
        }
      }
      
      // Para tarefas sem data limite e sem sprint válido (backlog ou sem sprint)
      // Usar uma data muito futura para ordenação (aparecem no final)
      return {
        ...task,
        dataLimiteCalculada: new Date(2100, 0, 1),
        isPrevisao: true,
      };
    });
  }, [tasks, getSprintPeriod]);
  
  // Manter compatibilidade com a lógica de filtro de tipo (mas agora todas as tarefas estão disponíveis)
  const tasksComDataLimite = useMemo(() => {
    // Tarefas que têm data limite definida (não são previsão)
    return allTasks.filter(task => task.dataLimite && !task.isPrevisao);
  }, [allTasks]);
  
  const tasksComPrevisao = useMemo(() => {
    // Tarefas que têm previsão calculada (com sprint válido, sem data limite)
    const backlogDate = new Date(2100, 0, 1).getTime();
    return allTasks.filter(task => 
      task.isPrevisao && 
      !task.dataLimite && 
      task.dataLimiteCalculada.getTime() !== backlogDate
    );
  }, [allTasks]);
  
  const tasksBacklog = useMemo(() => {
    // Tarefas de backlog (sem sprint válido ou sem data limite)
    const backlogDate = new Date(2100, 0, 1).getTime();
    return allTasks.filter(task => 
      task.isPrevisao && 
      task.dataLimiteCalculada.getTime() === backlogDate
    );
  }, [allTasks]);
  
  // Calcular tarefas filtradas usando useMemo para recalcular quando os filtros mudarem
  const filteredTasksList = useMemo(() => {
    let filtered: DeliveryTask[] = [];
    
    // IMPORTANTE: Agora todas as tarefas estão disponíveis, então o filtro de tipo funciona com allTasks
    if (taskListFilter === 'dataLimite') {
      filtered = tasksComDataLimite;
    } else if (taskListFilter === 'previsao') {
      filtered = [...tasksComPrevisao, ...tasksBacklog];
    } else {
      // Todas as tarefas
      filtered = allTasks;
    }
    
    // Aplicar filtros de data
    if (filterDataDe) {
      const [year, month, day] = filterDataDe.split('-').map(Number);
      const dataDe = new Date(year, month - 1, day, 0, 0, 0, 0);
      filtered = filtered.filter(task => {
        const taskData = new Date(task.dataLimiteCalculada);
        taskData.setHours(0, 0, 0, 0);
        return taskData.getTime() >= dataDe.getTime();
      });
    }
    
    if (filterDataAte) {
      const [year, month, day] = filterDataAte.split('-').map(Number);
      const dataAte = new Date(year, month - 1, day, 0, 0, 0, 0);
      filtered = filtered.filter(task => {
        const taskData = new Date(task.dataLimiteCalculada);
        taskData.setHours(0, 0, 0, 0);
        return taskData.getTime() <= dataAte.getTime();
      });
    }
    
    // Aplicar filtros adicionais
    if (filterCliente) {
      filtered = filtered.filter(task => 
        task.categorias && task.categorias.some(cat => cat === filterCliente)
      );
    }
    
    if (filterSprint) {
      if (filterSprint === 'backlog') {
        // Filtrar tarefas de backlog (sem sprint ou com valor de backlog)
        filtered = filtered.filter(task => {
          const sprintName = task.sprint?.trim();
          return !sprintName || isBacklogSprintValue(sprintName);
        });
      } else {
        filtered = filtered.filter(task => task.sprint === filterSprint);
      }
    }
    
    if (filterStatus.length > 0) {
      filtered = filtered.filter(task => {
        const taskStatus = task.status || '';
        return filterStatus.some(selectedStatus => {
          if (selectedStatus === 'nao_concluidas') {
            return !isReallyCompletedStatus(taskStatus);
          } else if (selectedStatus === 'concluidas') {
            return isReallyCompletedStatus(taskStatus);
          } else {
            return taskStatus === selectedStatus;
          }
        });
      });
    }
    
    if (filterCodigo) {
      filtered = filtered.filter(task => {
        const codigo = (task.chave || task.id || '').toLowerCase();
        return codigo.includes(filterCodigo.toLowerCase());
      });
    }
    
    if (filterDescricao) {
      filtered = filtered.filter(task => {
        const descricao = (task.resumo || '').toLowerCase();
        return descricao.includes(filterDescricao.toLowerCase());
      });
    }
    
    if (filterResponsavel) {
      filtered = filtered.filter(task => {
        const responsavel = (task.responsavel || '').toLowerCase();
        return responsavel.includes(filterResponsavel.toLowerCase());
      });
    }
    
    if (filterFeature) {
      filtered = filtered.filter(task => {
        const features = task.feature || [];
        return features.some(f => f.toLowerCase().includes(filterFeature.toLowerCase()));
      });
    }
    
    if (filterModulo) {
      filtered = filtered.filter(task => {
        const modulo = (task.modulo || '').toLowerCase();
        return modulo === filterModulo.toLowerCase();
      });
    }
    
    if (filterTipo) {
      filtered = filtered.filter(task => {
        return task.tipo === filterTipo;
      });
    }
    
    if (filterComplexidade) {
      const complexidade = parseInt(filterComplexidade);
      if (!isNaN(complexidade)) {
        filtered = filtered.filter(task => {
          return task.complexidade === complexidade;
        });
      }
    }
    
    // Ordenar por código
    filtered.sort((a, b) => {
      const codeA = (a.chave || a.id || '').toUpperCase();
      const codeB = (b.chave || b.id || '').toUpperCase();
      return codeA.localeCompare(codeB);
    });
    
    return filtered;
  }, [
    taskListFilter,
    tasksComDataLimite,
    tasksComPrevisao,
    tasksBacklog,
    filterDataDe,
    filterDataAte,
    filterCliente,
    filterSprint,
    filterStatus,
    filterCodigo,
    filterDescricao,
    filterResponsavel,
    filterFeature,
    filterModulo,
    filterTipo,
    filterComplexidade,
  ]);
  
  // Função para exportar PDF da lista filtrada
  const exportFilteredListPDF = async () => {
    if (filteredTasksList.length === 0) {
      alert('Não há tarefas para exportar');
      return;
    }
    
    // Criar PDF em paisagem (landscape)
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    
    // Função helper para adicionar logo
    const addLogo = async (): Promise<{ width: number; height: number } | null> => {
      try {
        const logoPaths = [
          './imagens/duesoft.jpg',
          '/imagens/duesoft.jpg',
          'imagens/duesoft.jpg',
          '../imagens/duesoft.jpg',
        ];
        
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
                      const maxHeight = 20;
                      const aspectRatio = img.width / img.height;
                      const logoHeight = maxHeight;
                      const logoWidth = logoHeight * aspectRatio;
                      
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
            continue;
          }
        }
        
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
    
    // Cabeçalho
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
    pdf.text('Lista de Tarefas (Entregas)', headerStartX, headerY + 8);
    
    // Construir descrição dos filtros aplicados
    const filtrosAplicados: string[] = [];
    
    if (taskListFilter === 'dataLimite') {
      filtrosAplicados.push('Tipo: Data Limite');
    } else if (taskListFilter === 'previsao') {
      filtrosAplicados.push('Tipo: Previsão');
    } else {
      filtrosAplicados.push('Tipo: Todas');
    }
    
    if (filterDataDe) {
      const dataDe = new Date(filterDataDe);
      filtrosAplicados.push(`Data De: ${dataDe.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`);
    }
    
    if (filterDataAte) {
      const dataAte = new Date(filterDataAte);
      filtrosAplicados.push(`Data Até: ${dataAte.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`);
    }
    
    if (filterCliente) {
      filtrosAplicados.push(`Cliente: ${filterCliente}`);
    }
    
    if (filterSprint) {
      filtrosAplicados.push(`Sprint: ${filterSprint}`);
    }
    
    if (filterStatus.length > 0) {
      const statusLabels = filterStatus.map(s => {
        if (s === 'nao_concluidas') return 'Não Concluídas';
        if (s === 'concluidas') return 'Concluídas';
        return s;
      });
      filtrosAplicados.push(`Status: ${statusLabels.join(', ')}`);
    }
    
    if (filterCodigo) {
      filtrosAplicados.push(`Código: ${filterCodigo}`);
    }
    
    if (filterDescricao) {
      filtrosAplicados.push(`Descrição: ${filterDescricao}`);
    }
    
    // Exibir filtros aplicados
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    
    let currentY = headerY + 16;
    if (filtrosAplicados.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Filtros Aplicados:', headerStartX, currentY);
      currentY += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      // Dividir filtros em linhas se necessário
      let lineText = '';
      filtrosAplicados.forEach((filtro, idx) => {
        const testText = lineText ? `${lineText} | ${filtro}` : filtro;
        const testWidth = pdf.getTextWidth(testText);
        const maxWidth = pageWidth - headerStartX - margin - 10;
        
        if (testWidth > maxWidth && lineText) {
          pdf.text(lineText, headerStartX, currentY);
          currentY += 4;
          lineText = filtro;
        } else {
          lineText = testText;
        }
        
        // Se for o último, escrever
        if (idx === filtrosAplicados.length - 1) {
          pdf.text(lineText, headerStartX, currentY);
          currentY += 4;
        }
      });
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sem filtros aplicados (mostrando todas as tarefas)', headerStartX, currentY);
      currentY += 4;
    }
    
    // Data de geração (alinhada à direita)
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    const dateText = `Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, pageWidth - margin - dateWidth, headerY + 8);
    
    // Resetar cor do texto para preto
    pdf.setTextColor(0, 0, 0);
    
    // Altura do cabeçalho para posicionar a tabela
    const headerHeight = currentY + 5;
    
    // Preparar dados da tabela
    const tableData = filteredTasksList.map(task => {
      const sprintName = task.sprint?.trim();
      const isBacklog = !sprintName || isBacklogSprintValue(sprintName);
      const sprintDisplay = isBacklog ? 'backlog' : (sprintName || '-');
      
      let dataDisplay = '-';
      if (!(isBacklog && !task.dataLimite)) {
        dataDisplay = task.dataLimiteCalculada.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
      
      return [
        task.chave || task.id || '-',
        task.resumo || '',
        task.isPrevisao ? 'Previsão' : 'Limite',
        sprintDisplay,
        dataDisplay,
        task.status || 'Sem Status',
        task.estimativa ? formatHours(task.estimativa) : '-',
      ];
    });
    
    // Criar tabela
    if (tableData.length > 0) {
      autoTable(pdf, {
        startY: headerHeight + 5,
        head: [['Código', 'Descrição', 'Tipo', 'Sprint', 'Data', 'Status', 'Horas']],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: { 
          fontSize: 9, 
          cellPadding: 2,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 2,
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 30 }, // Código (reduzido)
          1: { cellWidth: pageWidth - 2 * margin - 30 - 30 - 30 - 30 - 25 - 25 }, // Descrição (aumentado)
          2: { cellWidth: 30 }, // Tipo
          3: { cellWidth: 30 }, // Sprint
          4: { cellWidth: 25 }, // Data (reduzido)
          5: { cellWidth: 30 }, // Status
          6: { cellWidth: 25 }, // Horas
        },
        didParseCell: (data: any) => {
          const colIndex = data.column.index;
          
          // Centralizar texto nas colunas Tipo, Status e Horas
          if (colIndex === 2 || colIndex === 5 || colIndex === 6) {
            data.cell.styles.halign = 'center';
          }
        },
      });
    }
    
    // Rodapé
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
    const timestamp = new Date().toISOString().split('T')[0];
    pdf.save(`Lista_Tarefas_Entregas_${timestamp}.pdf`);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          Tarefas
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Lista completa de tarefas com filtros avançados
        </p>
      </div>
      
      {/* Lista de Tarefas */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Lista de Tarefas (Entregas)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Todas as tarefas sem restrições - use os filtros para encontrar o que precisa
            </p>
          </div>
          <button
            onClick={exportFilteredListPDF}
            disabled={filteredTasksList.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg shadow-sm hover:shadow-md transition-all"
            title={filteredTasksList.length === 0 ? 'Não há tarefas para exportar' : 'Exportar lista em PDF'}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Exportar PDF</span>
          </button>
        </div>
        
        {/* Filtros */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros de Busca</span>
            <button
              onClick={() => {
                setTaskListFilter('todas');
                setFilterDataDe('');
                setFilterDataAte('');
                setFilterCliente('');
                setFilterSprint('');
                setFilterStatus([]);
                setFilterDescricao('');
                setFilterCodigo('');
                setFilterResponsavel('');
                setFilterFeature('');
                setFilterModulo('');
                setFilterTipo('');
                setFilterComplexidade('');
              }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Limpar Filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={taskListFilter}
                onChange={(e) => setTaskListFilter(e.target.value as 'dataLimite' | 'previsao' | 'todas')}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todas">Todas</option>
                <option value="dataLimite">Data Limite</option>
                <option value="previsao">Previsão</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data De
              </label>
              <input
                type="date"
                value={filterDataDe}
                onChange={(e) => setFilterDataDe(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Até
              </label>
              <input
                type="date"
                value={filterDataAte}
                onChange={(e) => setFilterDataAte(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <AutocompleteSelect
                value={filterCliente}
                onChange={setFilterCliente}
                options={[
                  '',
                  ...Array.from(new Set(
                    allTasks
                      .flatMap(t => t.categorias || [])
                      .filter(c => c && c.trim() !== '')
                  )).sort()
                ]}
                placeholder="Todos os clientes"
                label="Cliente"
              />
            </div>
            
            <div>
              <AutocompleteSelect
                value={filterSprint}
                onChange={setFilterSprint}
                options={[
                  '',
                  'backlog',
                  ...Array.from(new Set(
                    allTasks.map(t => t.sprint).filter(s => s && s.trim() !== '' && !isBacklogSprintValue(s))
                  )).sort()
                ]}
                placeholder="Todos os sprints"
                label="Sprint"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <StatusMultiSelect
                selectedStatuses={filterStatus}
                onChange={setFilterStatus}
                    allStatuses={Array.from(new Set(
                  allTasks
                    .map(t => t.status)
                    .filter(s => s && s.trim() !== '')
                )).sort()}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código
              </label>
              <input
                type="text"
                value={filterCodigo}
                onChange={(e) => setFilterCodigo(e.target.value)}
                placeholder="Buscar código..."
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={filterDescricao}
              onChange={(e) => setFilterDescricao(e.target.value)}
              placeholder="Buscar na descrição..."
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
            <div>
              <AutocompleteSelect
                value={filterResponsavel}
                onChange={setFilterResponsavel}
                options={[
                  '',
                  ...Array.from(new Set(
                    allTasks
                      .map(t => t.responsavel)
                      .filter(r => r && r.trim() !== '')
                  )).sort()
                ]}
                placeholder="Todos os responsáveis"
                label="Responsável"
              />
            </div>
            
            <div>
              <AutocompleteSelect
                value={filterFeature}
                onChange={setFilterFeature}
                options={[
                  '',
                  ...Array.from(new Set(
                    allTasks
                      .flatMap(t => t.feature || [])
                      .filter(f => f && f.trim() !== '')
                  )).sort()
                ]}
                placeholder="Todas as features"
                label="Feature"
              />
            </div>
            
            <div>
              <AutocompleteSelect
                value={filterModulo}
                onChange={setFilterModulo}
                options={[
                  '',
                  ...Array.from(new Set(
                    allTasks
                      .map(t => t.modulo)
                      .filter(m => m && m.trim() !== '')
                  )).sort()
                ]}
                placeholder="Todos os módulos"
                label="Módulo"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <option value="Bug">Bug</option>
                <option value="Tarefa">Tarefa</option>
                <option value="História">História</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Complexidade
              </label>
              <select
                value={filterComplexidade}
                onChange={(e) => setFilterComplexidade(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas</option>
                <option value="1">1 - Muito Simples</option>
                <option value="2">2 - Simples</option>
                <option value="3">3 - Média</option>
                <option value="4">4 - Complexa</option>
                <option value="5">5 - Muito Complexa</option>
              </select>
            </div>
          </div>
        </div>
        
        {(() => {
          const filteredTasks = filteredTasksList;
          
          if (filteredTasks.length === 0) {
            return (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma tarefa encontrada</p>
              </div>
            );
          }
          
          return (
            <>
              <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Mostrando <strong>{filteredTasks.length}</strong> tarefa{filteredTasks.length !== 1 ? 's' : ''}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Código</th>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Descrição</th>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Tipo</th>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Sprint</th>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Data</th>
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-right p-3 font-semibold text-gray-700 dark:text-gray-300">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="p-3 text-gray-900 dark:text-gray-100 font-medium">
                          {task.chave || task.id}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {task.resumo}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.isPrevisao
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}>
                            {task.isPrevisao ? 'Previsão' : 'Limite'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {(() => {
                            const sprintName = task.sprint?.trim();
                            if (!sprintName || isBacklogSprintValue(sprintName)) {
                              return 'backlog';
                            }
                            return sprintName;
                          })()}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {(() => {
                            const sprintName = task.sprint?.trim();
                            const isBacklog = !sprintName || isBacklogSprintValue(sprintName);
                            // Se for backlog sem data limite, mostrar "-"
                            if (isBacklog && !task.dataLimite) {
                              return '-';
                            }
                            return task.dataLimiteCalculada.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            });
                          })()}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isCompletedStatus(task.status)
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                              : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                          }`}>
                            {task.status || 'Sem Status'}
                          </span>
                        </td>
                        <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                          {task.estimativa ? formatHours(task.estimativa) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

