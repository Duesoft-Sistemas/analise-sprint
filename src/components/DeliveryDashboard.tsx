import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Package,
  FileText,
  Download,
  Building2,
  Search,
  FileWarning,
  ChevronDown,
} from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { TaskItem, SprintPeriod } from '../types';
import { formatHours, isCompletedStatus, isBacklogSprintValue } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
// IMPORTANTE: Na gestão de entregas por data limite, apenas status "concluído"/"concluido" é considerado concluído
// Outros status como "teste", "compilar", etc. não são considerados concluídos
function isReallyCompletedStatus(status: string): boolean {
  const normalized = (status || '').toLowerCase().trim();
  return normalized === 'concluído' || normalized === 'concluido';
}

interface DeliveryTask extends TaskItem {
  dataLimiteCalculada: Date; // Data limite real ou prevista
  isPrevisao: boolean; // Se a data é uma previsão (sprint + 5 dias)
}

interface DeliveryAnalytics {
  // Tarefas com data limite definida
  comDataLimite: {
    total: number;
    vencidas: number;
    venceHoje: number;
    venceProximos7Dias: number;
    venceProximos30Dias: number;
    noPrazo: number;
    horasVencidas: number;
    horasVenceHoje: number;
    horasProximos7Dias: number;
    horasProximos30Dias: number;
    horasNoPrazo: number;
  };
  
  // Tarefas sem data limite (com previsão)
  semDataLimite: {
    total: number;
    totalHoras: number;
    porSprint: {
      sprint: string;
      quantidade: number;
      horas: number;
      dataPrevisao: Date;
    }[];
  };
  
  // Distribuição por status
  porStatus: {
    status: string;
    quantidade: number;
    horas: number;
  }[];
}

interface ClientDeliverySchedule {
  cliente: string;
  tarefas: DeliveryTask[];
  totalTarefas: number;
  totalHoras: number;
  vencidas: number;
  proximas: number;
  noPrazo: number;
  entregas: {
    data: Date;
    tarefas: DeliveryTask[];
    horas: number;
    isPrevisao: boolean;
  }[];
}

function calculateClientSchedules(
  tasksComDataLimite: DeliveryTask[],
  tasksSemDataLimite: DeliveryTask[]
): ClientDeliverySchedule[] {
  const clientMap = new Map<string, DeliveryTask[]>();
  
  // Agrupar tarefas por cliente (categorias)
  [...tasksComDataLimite, ...tasksSemDataLimite].forEach(task => {
    const categorias = task.categorias || [];
    if (categorias.length === 0) {
      // Tarefas sem categoria vão para "Sem Cliente"
      const cliente = 'Sem Cliente';
      if (!clientMap.has(cliente)) {
        clientMap.set(cliente, []);
      }
      clientMap.get(cliente)!.push(task);
    } else {
      categorias.forEach(categoria => {
        if (categoria && categoria.trim() !== '') {
          if (!clientMap.has(categoria)) {
            clientMap.set(categoria, []);
          }
          clientMap.get(categoria)!.push(task);
        }
      });
    }
  });
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proximos7Dias = new Date(hoje);
  proximos7Dias.setDate(proximos7Dias.getDate() + 7);
  
  return Array.from(clientMap.entries()).map(([cliente, tarefas]) => {
    // Agrupar por data de entrega
    const entregasMap = new Map<string, { tarefas: DeliveryTask[]; horas: number; isPrevisao: boolean }>();
    
    tarefas.forEach(task => {
      const dataLimite = new Date(task.dataLimiteCalculada);
      dataLimite.setHours(0, 0, 0, 0);
      const dataKey = dataLimite.toISOString().split('T')[0];
      
      if (!entregasMap.has(dataKey)) {
        entregasMap.set(dataKey, { tarefas: [], horas: 0, isPrevisao: task.isPrevisao });
      }
      const entrega = entregasMap.get(dataKey)!;
      entrega.tarefas.push(task);
      entrega.horas += task.estimativa || 0;
      // Se houver qualquer tarefa com data limite (não previsão), a entrega não é apenas previsão
      // Só é previsão se TODAS as tarefas daquela data forem previsão
      if (!task.isPrevisao) {
        entrega.isPrevisao = false;
      }
    });
    
    const entregas = Array.from(entregasMap.entries())
      .map(([dataKey, data]) => {
        // Criar data corretamente a partir da string (formato YYYY-MM-DD)
        const [year, month, day] = dataKey.split('-').map(Number);
        const dataEntrega = new Date(year, month - 1, day);
        dataEntrega.setHours(0, 0, 0, 0);
        
        return {
          data: dataEntrega,
          tarefas: data.tarefas,
          horas: data.horas,
          isPrevisao: data.isPrevisao,
        };
      })
      .sort((a, b) => a.data.getTime() - b.data.getTime());
    
    // Contar status
    let vencidas = 0;
    let proximas = 0;
    let noPrazo = 0;
    
    tarefas.forEach(task => {
      const dataLimite = new Date(task.dataLimiteCalculada);
      dataLimite.setHours(0, 0, 0, 0);
      
      // IMPORTANTE: Tarefas com data limite já foram filtradas para excluir as concluídas (status "concluído"/"concluido")
      // Então não precisamos mais verificar o status de conclusão aqui para tarefas com data limite
      // Tarefas com previsão não devem ser marcadas como vencidas (são apenas estimativas)
      if (task.isPrevisao) {
        // Para previsões, só marcamos como próxima se estiver nos próximos 7 dias E no futuro
        // E se a data de previsão for futura (não passada)
        if (dataLimite.getTime() <= proximos7Dias.getTime() && dataLimite.getTime() >= hoje.getTime()) {
          proximas++;
        } else {
          noPrazo++;
        }
      }
      // Tarefas com data limite definida (já filtradas para excluir concluídas)
      else if (dataLimite.getTime() < hoje.getTime()) {
        vencidas++;
      } else if (dataLimite.getTime() <= proximos7Dias.getTime() && dataLimite.getTime() >= hoje.getTime()) {
        proximas++;
      } else {
        noPrazo++;
      }
    });
    
    return {
      cliente,
      tarefas,
      totalTarefas: tarefas.length,
      totalHoras: tarefas.reduce((sum, t) => sum + (t.estimativa || 0), 0),
      vencidas,
      proximas,
      noPrazo,
      entregas,
    };
  }).sort((a, b) => b.totalHoras - a.totalHoras);
}

function calculateDeliveryAnalytics(
  tasks: TaskItem[],
  getSprintPeriod: (sprintName: string) => SprintPeriod | null
): DeliveryAnalytics {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const proximos7Dias = new Date(hoje);
  proximos7Dias.setDate(proximos7Dias.getDate() + 7);
  
  const proximos30Dias = new Date(hoje);
  proximos30Dias.setDate(proximos30Dias.getDate() + 30);
  
  // Separar tarefas com e sem data limite
  // IMPORTANTE: Para tarefas com data limite, incluir apenas as NÃO concluídas (status diferente de "concluído"/"concluido")
  const tasksComDataLimite: DeliveryTask[] = [];
  const tasksSemDataLimite: DeliveryTask[] = [];
  
  tasks.forEach(task => {
    if (task.dataLimite) {
      // IMPORTANTE: Na gestão de entregas por data limite, incluir apenas tarefas NÃO concluídas
      // Status "concluído"/"concluido" são excluídos, mas outros como "teste", "compilar", etc. são incluídos
      if (!isReallyCompletedStatus(task.status || '')) {
        tasksComDataLimite.push({
          ...task,
          dataLimiteCalculada: task.dataLimite,
          isPrevisao: false,
        });
      }
    } else if (task.sprint && task.sprint.trim() !== '') {
      // Calcular previsão: data final do sprint + 5 dias (último dia da semana seguinte)
      // IMPORTANTE: Apenas sprints futuros são considerados na gestão de entregas
      const sprintPeriod = getSprintPeriod(task.sprint);
      if (sprintPeriod) {
        const sprintEndDate = new Date(sprintPeriod.endDate);
        sprintEndDate.setHours(0, 0, 0, 0);
        const sprintJaPassou = sprintEndDate.getTime() < hoje.getTime();
        
        // Só incluir sprints futuros (não passados)
        if (!sprintJaPassou) {
          // Previsão: sexta-feira da semana seguinte (fim do sprint é domingo)
          const dataPrevisao = getSextaFeiraSemanaSeguinte(sprintEndDate);
          
          tasksSemDataLimite.push({
            ...task,
            dataLimiteCalculada: dataPrevisao,
            isPrevisao: true,
          });
        }
      }
    }
  });
  
  // Análise de tarefas com data limite
  const comDataLimite = {
    total: tasksComDataLimite.length,
    vencidas: 0,
    venceHoje: 0,
    venceProximos7Dias: 0,
    venceProximos30Dias: 0,
    noPrazo: 0,
    horasVencidas: 0,
    horasVenceHoje: 0,
    horasProximos7Dias: 0,
    horasProximos30Dias: 0,
    horasNoPrazo: 0,
  };
  
  tasksComDataLimite.forEach(task => {
    const dataLimite = new Date(task.dataLimiteCalculada);
    dataLimite.setHours(0, 0, 0, 0);
    const horas = task.estimativa || 0;
    
    // IMPORTANTE: Neste ponto, todas as tarefas já foram filtradas para excluir as concluídas
    // Então não precisamos mais verificar o status de conclusão aqui
    if (dataLimite.getTime() < hoje.getTime()) {
      comDataLimite.vencidas++;
      comDataLimite.horasVencidas += horas;
    } else if (dataLimite.getTime() === hoje.getTime()) {
      comDataLimite.venceHoje++;
      comDataLimite.horasVenceHoje += horas;
    } else if (dataLimite.getTime() > hoje.getTime() && dataLimite.getTime() <= proximos7Dias.getTime()) {
      comDataLimite.venceProximos7Dias++;
      comDataLimite.horasProximos7Dias += horas;
    } else if (dataLimite.getTime() <= proximos30Dias.getTime()) {
      comDataLimite.venceProximos30Dias++;
      comDataLimite.horasProximos30Dias += horas;
    } else {
      comDataLimite.noPrazo++;
      comDataLimite.horasNoPrazo += horas;
    }
  });
  
  // Análise de tarefas sem data limite (com previsão)
  const semDataLimitePorSprint = new Map<string, { quantidade: number; horas: number; dataPrevisao: Date }>();
  
  tasksSemDataLimite.forEach(task => {
    const sprint = task.sprint;
    if (!semDataLimitePorSprint.has(sprint)) {
      semDataLimitePorSprint.set(sprint, {
        quantidade: 0,
        horas: 0,
        dataPrevisao: task.dataLimiteCalculada,
      });
    }
    const entry = semDataLimitePorSprint.get(sprint)!;
    entry.quantidade++;
    entry.horas += task.estimativa || 0;
  });
  
  const semDataLimite = {
    total: tasksSemDataLimite.length,
    totalHoras: tasksSemDataLimite.reduce((sum, t) => sum + (t.estimativa || 0), 0),
    porSprint: Array.from(semDataLimitePorSprint.entries()).map(([sprint, data]) => ({
      sprint,
      quantidade: data.quantidade,
      horas: data.horas,
      dataPrevisao: data.dataPrevisao,
    })),
  };
  
  // Distribuição por status
  const statusMap = new Map<string, { quantidade: number; horas: number }>();
  [...tasksComDataLimite, ...tasksSemDataLimite].forEach(task => {
    const status = task.status || 'Sem Status';
    if (!statusMap.has(status)) {
      statusMap.set(status, { quantidade: 0, horas: 0 });
    }
    const entry = statusMap.get(status)!;
    entry.quantidade++;
    entry.horas += task.estimativa || 0;
  });
  
  const porStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
    status,
    quantidade: data.quantidade,
    horas: data.horas,
  })).sort((a, b) => b.quantidade - a.quantidade);
  
  return {
    comDataLimite,
    semDataLimite,
    porStatus,
  };
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

interface DeliveryDashboardProps {
  dataLimiteRef?: React.RefObject<HTMLDivElement>;
  previsaoRef?: React.RefObject<HTMLDivElement>;
  cronogramaRef?: React.RefObject<HTMLDivElement>;
  taskListRef?: React.RefObject<HTMLDivElement>;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  dataLimiteRef,
  previsaoRef,
  cronogramaRef,
  taskListRef,
}) => {
  const tasks = useSprintStore((state) => state.tasks);
  const getSprintPeriod = useSprintStore((state) => state.getSprintPeriod);
  const [searchClient, setSearchClient] = useState<string>('');
  const [, setSelectedFilter] = useState<{ type: 'status' | 'client' | 'sprint'; value: string } | null>(null);
  const [taskListFilter, setTaskListFilter] = useState<'dataLimite' | 'previsao' | 'todas'>('todas');
  const [topClients, setTopClients] = useState<string>('20'); // Filtro top N clientes (default: Top 20)
  
  // Filtros para a lista de tarefas
  const [filterDataDe, setFilterDataDe] = useState<string>('');
  const [filterDataAte, setFilterDataAte] = useState<string>('');
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [filterSprint, setFilterSprint] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDescricao, setFilterDescricao] = useState<string>('');
  const [filterCodigo, setFilterCodigo] = useState<string>('');
  
  // Função helper para limpar todos os filtros antes de aplicar novos
  const clearAllFilters = () => {
    setFilterDataDe('');
    setFilterDataAte('');
    setFilterCliente('');
    setFilterSprint('');
    setFilterStatus([]);
    setFilterDescricao('');
    setFilterCodigo('');
    setSelectedFilter(null);
  };
  
  
  // Função helper para formatar data como string YYYY-MM-DD (evita problemas de timezone)
  const formatDateForFilter = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Função helper que replica EXATAMENTE a lógica de classificação dos cards
  // Retorna a categoria da tarefa: 'vencidas', 'venceHoje', 'venceProximos7Dias', 'venceProximos30Dias', 'noPrazo'
  // IMPORTANTE: Esta função assume que as tarefas já foram filtradas para excluir as concluídas
  const classifyTaskByDeadline = (task: DeliveryTask): string | null => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const proximos7Dias = new Date(hoje);
    proximos7Dias.setDate(proximos7Dias.getDate() + 7);
    
    const proximos30Dias = new Date(hoje);
    proximos30Dias.setDate(proximos30Dias.getDate() + 30);
    
    const dataLimite = new Date(task.dataLimiteCalculada);
    dataLimite.setHours(0, 0, 0, 0);
    
    // IMPORTANTE: Neste ponto, todas as tarefas já foram filtradas para excluir as concluídas
    // Então não precisamos mais verificar o status de conclusão aqui
    if (dataLimite.getTime() < hoje.getTime()) {
      return 'vencidas';
    } else if (dataLimite.getTime() === hoje.getTime()) {
      return 'venceHoje';
    } else if (dataLimite.getTime() > hoje.getTime() && dataLimite.getTime() <= proximos7Dias.getTime()) {
      return 'venceProximos7Dias';
    } else if (dataLimite.getTime() <= proximos30Dias.getTime()) {
      return 'venceProximos30Dias';
    } else {
      return 'noPrazo';
    }
  };
  
  const analytics = useMemo(() => {
    return calculateDeliveryAnalytics(tasks, getSprintPeriod);
  }, [tasks, getSprintPeriod]);
  
  // Calcular cronogramas por cliente (apenas tarefas com data limite + previsões de sprints futuros)
  const clientSchedules = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const tasksComDataLimite: DeliveryTask[] = [];
    const tasksComPrevisao: DeliveryTask[] = [];
    
    tasks.forEach(task => {
      if (task.dataLimite) {
        // IMPORTANTE: Na gestão de entregas por data limite, incluir apenas tarefas NÃO concluídas
        // Status "concluído"/"concluido" são excluídos, mas outros como "teste", "compilar", etc. são incluídos
        if (!isReallyCompletedStatus(task.status || '')) {
          // Tarefas com data limite definida (prioritárias)
          tasksComDataLimite.push({
            ...task,
            dataLimiteCalculada: task.dataLimite,
            isPrevisao: false,
          });
        }
      } else if (task.sprint && task.sprint.trim() !== '') {
        const sprintPeriod = getSprintPeriod(task.sprint);
        if (sprintPeriod) {
          const sprintEndDate = new Date(sprintPeriod.endDate);
          sprintEndDate.setHours(0, 0, 0, 0);
          const sprintJaPassou = sprintEndDate.getTime() < hoje.getTime();
          
          // Só incluir sprints FUTUROS (não passados) - a gestão é para o que precisa ser feito
          if (!sprintJaPassou) {
            // Sprint futuro ou atual - usar previsão: sexta-feira da semana seguinte
            const dataPrevisao = getSextaFeiraSemanaSeguinte(sprintEndDate);
            
            tasksComPrevisao.push({
              ...task,
              dataLimiteCalculada: dataPrevisao,
              isPrevisao: true,
            });
          }
          // Sprints passados não são incluídos na gestão de entregas
        }
      }
    });
    
    // Combinar ambas para o cronograma por cliente
    return calculateClientSchedules(tasksComDataLimite, tasksComPrevisao);
  }, [tasks, getSprintPeriod]);

  const clientUnplannedTasks = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const map = new Map<string, TaskItem[]>();

    const addTaskToClient = (cliente: string, task: TaskItem) => {
      const key = cliente && cliente.trim() !== '' ? cliente : 'Sem Cliente';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    };

    tasks.forEach(task => {
      // Tarefas sem previsão são tarefas em aberto que não estão alocadas em sprints e nem têm data limite
      // 1. Deve ser tarefa em aberto (não concluída)
      if (isCompletedStatus(task.status)) {
        return;
      }
      
      // 2. Não deve ter data limite
      if (task.dataLimite) {
        return;
      }

      // 3. Não deve estar alocada em sprint (ou se estiver, o sprint já passou)
      const sprintName = task.sprint?.trim();
      if (sprintName && !isBacklogSprintValue(sprintName)) {
        const sprintPeriod = getSprintPeriod(sprintName);
        if (sprintPeriod) {
          const sprintEndDate = new Date(sprintPeriod.endDate);
          sprintEndDate.setHours(0, 0, 0, 0);
          const sprintAindaVaiAcontecer = sprintEndDate.getTime() >= hoje.getTime();

          if (sprintAindaVaiAcontecer) {
            // Estas tarefas já são consideradas na seção de previsão
            return;
          }
        }
      }
      // Se não tem sprint ou é um valor de backlog, a tarefa é considerada sem previsão

      const categorias = (task.categorias || []).filter(cat => cat && cat.trim() !== '');
      const clientes = categorias.length > 0 ? categorias : ['Sem Cliente'];

      clientes.forEach(cliente => addTaskToClient(cliente, task));
    });

    return map;
  }, [tasks, getSprintPeriod]);
  
  // Separar para as duas áreas principais
  // IMPORTANTE: Para tarefas com data limite, incluir apenas as NÃO concluídas (status diferente de "concluído"/"concluido")
  const tasksComDataLimite = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return tasks
      .filter(task => {
        // Deve ter data limite
        if (!task.dataLimite) return false;
        // IMPORTANTE: Na gestão de entregas por data limite, incluir apenas tarefas NÃO concluídas
        // Status "concluído"/"concluido" são excluídos, mas outros como "teste", "compilar", etc. são incluídos
        if (isReallyCompletedStatus(task.status || '')) return false;
        return true;
      })
      .map(task => ({
        ...task,
        dataLimiteCalculada: task.dataLimite!,
        isPrevisao: false,
      }));
  }, [tasks]);
  
  // Tarefas de backlog (sem sprint ou com valor de backlog)
  const tasksBacklog = useMemo(() => {
    return tasks
      .filter(task => {
        // Tarefas sem sprint ou com valor de backlog
        const sprintName = task.sprint?.trim();
        return !sprintName || isBacklogSprintValue(sprintName);
      })
      .filter(task => !task.dataLimite) // Apenas backlog sem data limite (com data limite já está em tasksComDataLimite)
      .map(task => ({
        ...task,
        // Para backlog sem data limite, usar uma data muito futura como previsão (para ordenação)
        // Isso permite que apareçam no final da lista quando ordenadas por data
        dataLimiteCalculada: new Date(2100, 0, 1), // Data muito futura para ordenação
        isPrevisao: true,
      }));
  }, [tasks]);
  
  const tasksComPrevisao = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return tasks
      .filter(task => {
        // Excluir tarefas com data limite e tarefas de backlog (já estão em tasksBacklog)
        if (task.dataLimite) return false;
        const sprintName = task.sprint?.trim();
        if (!sprintName || isBacklogSprintValue(sprintName)) return false;
        return true;
      })
      .map(task => {
        const sprintPeriod = getSprintPeriod(task.sprint);
        if (sprintPeriod) {
          const sprintEndDate = new Date(sprintPeriod.endDate);
          sprintEndDate.setHours(0, 0, 0, 0);
          const sprintJaPassou = sprintEndDate.getTime() < hoje.getTime();
          
          // Só incluir sprints futuros
          if (!sprintJaPassou) {
            // Previsão: sexta-feira da semana seguinte
            const dataPrevisao = getSextaFeiraSemanaSeguinte(sprintEndDate);
            
            return {
              ...task,
              dataLimiteCalculada: dataPrevisao,
              isPrevisao: true,
            };
          }
        }
        return null;
      })
      .filter((task): task is DeliveryTask => task !== null);
  }, [tasks, getSprintPeriod]);
  
  
  // Dados para gráfico de distribuição temporal
  const timelineData = useMemo(() => {
    return [
      {
        periodo: 'Vencidas',
        quantidade: analytics.comDataLimite.vencidas,
        horas: analytics.comDataLimite.horasVencidas,
      },
      {
        periodo: 'Hoje',
        quantidade: analytics.comDataLimite.venceHoje,
        horas: analytics.comDataLimite.horasVenceHoje,
      },
      {
        periodo: 'Próximos 7 dias',
        quantidade: analytics.comDataLimite.venceProximos7Dias,
        horas: analytics.comDataLimite.horasProximos7Dias,
      },
      {
        periodo: 'Próximos 30 dias',
        quantidade: analytics.comDataLimite.venceProximos30Dias,
        horas: analytics.comDataLimite.horasProximos30Dias,
      },
    ];
  }, [analytics]);
  
  // Calcular tarefas filtradas usando useMemo para recalcular quando os filtros mudarem
  const filteredTasksList = useMemo(() => {
    let filtered: DeliveryTask[] = [];
    
    if (taskListFilter === 'dataLimite') {
      filtered = tasksComDataLimite;
    } else if (taskListFilter === 'previsao') {
      filtered = [...tasksComPrevisao, ...tasksBacklog];
    } else {
      filtered = [...tasksComDataLimite, ...tasksComPrevisao, ...tasksBacklog];
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
  ]);
  
  // Função para exportar PDF do cronograma de um cliente (lista simples)
  const exportClientPDF = async (
    schedule: ClientDeliverySchedule,
    options?: { includeUnplanned?: boolean; unplannedTasks?: TaskItem[] }
  ) => {
    // Criar PDF em paisagem (landscape)
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const includeUnplanned = Boolean(options?.includeUnplanned && options?.unplannedTasks?.length);
    const unplannedTasks = includeUnplanned ? options?.unplannedTasks ?? [] : [];
    
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
    
    // Cabeçalho profissional sem fundo colorido
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
    pdf.text('Programação de Entregas', headerStartX, headerY + 8);
    
    // Nome do cliente
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text(schedule.cliente, headerStartX, headerY + 16);
    
    // Data de geração (alinhada à direita)
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    const dateText = `Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, pageWidth - margin - dateWidth, headerY + 8);
    
    // Resetar cor do texto para preto
    pdf.setTextColor(0, 0, 0);
    
    // Altura do cabeçalho para posicionar a tabela
    const headerHeight = logoHeight + 20;
    
    // Preparar dados da tabela: todas as tarefas ordenadas por data
    const todasTarefas = schedule.tarefas
      .map(task => ({
        codigo: task.chave || task.id,
        descricao: task.resumo || '',
        data: task.dataLimiteCalculada,
        tipo: task.isPrevisao ? 'Previsão' : 'Limite',
        status: task.status || 'Sem Status',
        isPrevisao: task.isPrevisao,
        isCompleted: isCompletedStatus(task.status),
      }))
      .sort((a, b) => a.data.getTime() - b.data.getTime());
    
    // Preparar dados para a tabela (com formatação de tags)
    const tableData = todasTarefas.map(task => [
      task.codigo,
      task.descricao,
      task.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      task.tipo, // Será formatado como tag
      task.status, // Será formatado como tag
    ]);
    
    // Criar tabela (só se houver dados)
    if (tableData.length > 0) {
      autoTable(pdf, {
        startY: headerHeight + 10,
        head: [['Código', 'Descrição', 'Data', 'Tipo', 'Status']],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          lineColor: [229, 231, 235], // Borda cinza suave
          lineWidth: 0.1,
        },
        headStyles: { 
          fillColor: [59, 130, 246], // Azul mais vibrante
          textColor: [255, 255, 255], // Branco
          fontStyle: 'bold',
          fontSize: 10,
        },
        alternateRowStyles: { fillColor: [249, 250, 251] }, // Cinza muito claro
        columnStyles: {
          0: { cellWidth: 40 }, // Código
          1: { cellWidth: pageWidth - 2 * margin - 40 - 35 - 35 - 35 }, // Descrição (resto do espaço)
          2: { cellWidth: 35 }, // Data
          3: { cellWidth: 35 }, // Tipo
          4: { cellWidth: 35 }, // Status
        },
        didParseCell: (data: any) => {
          const colIndex = data.column.index;
          
          // Centralizar texto nas colunas Tipo e Status
          if (colIndex === 3 || colIndex === 4) {
            data.cell.styles.halign = 'center';
          }
        },
      });
    }
    
    if (includeUnplanned) {
      // Calcular a posição Y inicial baseada na última tabela ou no cabeçalho
      let lastTableY: number;
      if ((pdf as any).lastAutoTable?.finalY) {
        lastTableY = (pdf as any).lastAutoTable.finalY + 12;
      } else {
        // Se não houve primeira tabela, começar após o cabeçalho
        lastTableY = headerHeight + 10;
      }
      
      // Verificar se há espaço suficiente na página atual (precisamos de pelo menos 20mm para título + cabeçalho da tabela)
      const spaceNeeded = 20;
      const currentPageHeight = pdf.internal.pageSize.getHeight();
      const spaceAvailable = currentPageHeight - lastTableY - margin;
      
      let startY = lastTableY;
      
      // Se não houver espaço suficiente, adicionar nova página
      if (spaceAvailable < spaceNeeded) {
        pdf.addPage();
        startY = margin + 10;
      }
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tarefas sem previsão definida', margin, startY);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      const backlogTableData = [...unplannedTasks]
        .sort((a, b) => {
          const codeA = (a.chave || a.id || '').toUpperCase();
          const codeB = (b.chave || b.id || '').toUpperCase();
          return codeA.localeCompare(codeB);
        })
        .map(task => [
          task.chave || task.id || '-',
          task.resumo || '',
          '', // Data de previsão em branco
        ]);

      // Só adicionar a tabela se houver dados
      if (backlogTableData.length > 0) {
        autoTable(pdf, {
          startY: startY + 4,
          head: [['Código', 'Descrição', 'Data de Previsão']],
          body: backlogTableData,
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 9,
            cellPadding: 4,
            lineColor: [229, 231, 235],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [99, 102, 241],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
          },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: pageWidth - 2 * margin - 40 - 50 },
            2: { cellWidth: 50 },
          },
          didParseCell: (data: any) => {
            const colIndex = data.column.index;
            if (colIndex === 2) {
              data.cell.styles.halign = 'center';
            }
          },
        });
      }
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
    const sanitizedClient = schedule.cliente.replace(/[^a-z0-9]/gi, '_');
    const suffix = includeUnplanned ? '_com_backlog' : '';
    pdf.save(`Programacao_${sanitizedClient}${suffix}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
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
    
    // Função helper para adicionar logo (reutilizar da função exportClientPDF)
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
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          Gestão de Entregas
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Análise de vencimentos e previsões de entrega das tarefas
        </p>
      </div>
      
      {/* ÁREA 1: Tarefas com Data Limite (Prioritárias) */}
      <div ref={dataLimiteRef} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Tarefas com Data Limite Definida
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Tarefas prioritárias com data limite de entrega definida
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => {
              // Limpar todos os filtros antes de aplicar novos
              clearAllFilters();
              setSelectedFilter({ type: 'status', value: 'vencidas' });
              // Aplicar filtro automático: apenas data limite, data < hoje, não concluídas
              // IMPORTANTE: O card mostra tarefas NÃO concluídas com data < hoje
              // Na lógica de cálculo: vencidas = data < hoje (não concluídas)
              setTaskListFilter('dataLimite');
              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              // Vencidas = data < hoje, então vamos usar hoje como dataAte e depois filtrar com <
              // Mas como filterDataAte usa <=, vamos usar hoje-1 como dataAte
              const ontem = new Date(hoje);
              ontem.setDate(ontem.getDate() - 1);
              setFilterDataAte(formatDateForFilter(ontem));
              setFilterDataDe('');
              setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas
            }}
            className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800 hover:shadow-md transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Vencidas</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {analytics.comDataLimite.vencidas}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              {formatHours(analytics.comDataLimite.horasVencidas)}
            </div>
          </button>
          
          <button
            onClick={() => {
              // Limpar todos os filtros antes de aplicar novos
              clearAllFilters();
              setSelectedFilter({ type: 'status', value: 'proximos7dias' });
              // Aplicar filtro automático: data limite, próximos 7 dias (inclui hoje)
              // IMPORTANTE: O card mostra apenas tarefas NÃO concluídas (venceHoje + venceProximos7Dias)
              setTaskListFilter('dataLimite');
              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              const proximos7Dias = new Date(hoje);
              proximos7Dias.setDate(proximos7Dias.getDate() + 7);
              setFilterDataDe(formatDateForFilter(hoje));
              setFilterDataAte(formatDateForFilter(proximos7Dias));
              setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas para corresponder ao card
            }}
            className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-800 hover:shadow-md transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Próximos 7 dias</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {analytics.comDataLimite.venceHoje + analytics.comDataLimite.venceProximos7Dias}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {formatHours(analytics.comDataLimite.horasVenceHoje + analytics.comDataLimite.horasProximos7Dias)}
            </div>
          </button>
          
          <button
            onClick={() => {
              // Limpar todos os filtros antes de aplicar novos
              clearAllFilters();
              setSelectedFilter({ type: 'status', value: 'proximos30dias' });
              // Aplicar filtro automático: data limite, próximos 30 dias
              // IMPORTANTE: O card mostra apenas tarefas NÃO concluídas (venceProximos30Dias)
              // Na lógica de cálculo: venceProximos30Dias = data > hoje+7 && data <= hoje+30
              // IMPORTANTE: Isso EXCLUI as tarefas dos primeiros 7 dias (que estão em "Próximos 7 dias")
              setTaskListFilter('dataLimite');
              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              const proximos7Dias = new Date(hoje);
              proximos7Dias.setDate(proximos7Dias.getDate() + 7);
              const proximos30Dias = new Date(hoje);
              proximos30Dias.setDate(proximos30Dias.getDate() + 30);
              // Próximos 30 dias = data > hoje+7 && data <= hoje+30
              // Como filterDataDe usa >=, precisamos usar hoje+8 para representar "> hoje+7"
              const proximos8Dias = new Date(hoje);
              proximos8Dias.setDate(proximos8Dias.getDate() + 8);
              setFilterDataDe(formatDateForFilter(proximos8Dias));
              setFilterDataAte(formatDateForFilter(proximos30Dias));
              setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas para corresponder ao card
            }}
            className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Próximos 30 dias</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {analytics.comDataLimite.venceProximos30Dias}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              {formatHours(analytics.comDataLimite.horasProximos30Dias)}
            </div>
          </button>
          
          <button
            onClick={() => {
              // Limpar todos os filtros antes de aplicar novos
              clearAllFilters();
              setSelectedFilter({ type: 'status', value: 'total' });
              // Aplicar filtro automático: apenas tarefas com data limite (sem filtros de data)
              // IMPORTANTE: O card "Total" mostra apenas tarefas com data limite definida
              setTaskListFilter('dataLimite');
              setFilterDataDe('');
              setFilterDataAte('');
            }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {analytics.comDataLimite.total}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {formatHours(
                analytics.comDataLimite.horasVencidas +
                analytics.comDataLimite.horasVenceHoje +
                analytics.comDataLimite.horasProximos7Dias +
                analytics.comDataLimite.horasProximos30Dias +
                analytics.comDataLimite.horasNoPrazo
              )}
            </div>
          </button>
        </div>
      </div>
      
      {/* Gráfico de Distribuição Temporal */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Distribuição por Prazo
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periodo" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId="left" 
              dataKey="quantidade" 
              fill="#3b82f6" 
              name="Quantidade"
              onClick={(data: any, index: number) => {
                if (data && timelineData[index]) {
                  // Limpar todos os filtros antes de aplicar novos
                  clearAllFilters();
                  
                  const periodo = timelineData[index].periodo;
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  
                  // Aplicar filtros baseado no período clicado
                  setTaskListFilter('dataLimite');
                  
                  if (periodo === 'Vencidas') {
                    // Vencidas = data < hoje (não concluídas)
                    const ontem = new Date(hoje);
                    ontem.setDate(ontem.getDate() - 1);
                    setFilterDataAte(formatDateForFilter(ontem));
                    setFilterDataDe('');
                    setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas
                  } else if (periodo === 'Hoje') {
                    // Hoje = data === hoje (não concluídas)
                    setFilterDataDe(formatDateForFilter(hoje));
                    setFilterDataAte(formatDateForFilter(hoje));
                    setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas
                  } else if (periodo === 'Próximos 7 dias') {
                    // Próximos 7 dias = data > hoje && data <= hoje+7 (não concluídas)
                    const proximos7Dias = new Date(hoje);
                    proximos7Dias.setDate(proximos7Dias.getDate() + 7);
                    setFilterDataDe(formatDateForFilter(hoje));
                    setFilterDataAte(formatDateForFilter(proximos7Dias));
                    setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas
                  } else if (periodo === 'Próximos 30 dias') {
                    // Próximos 30 dias = data > hoje+7 && data <= hoje+30 (não concluídas)
                    const proximos7Dias = new Date(hoje);
                    proximos7Dias.setDate(proximos7Dias.getDate() + 7);
                    const proximos30Dias = new Date(hoje);
                    proximos30Dias.setDate(proximos30Dias.getDate() + 30);
                    const proximos8Dias = new Date(hoje);
                    proximos8Dias.setDate(proximos8Dias.getDate() + 8);
                    setFilterDataDe(formatDateForFilter(proximos8Dias));
                    setFilterDataAte(formatDateForFilter(proximos30Dias));
                    setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas
                  }
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            <Bar 
              yAxisId="right" 
              dataKey="horas" 
              fill="#10b981" 
              name="Horas"
              onClick={(data: any, index: number) => {
                if (data && timelineData[index]) {
                  // Limpar todos os filtros antes de aplicar novos
                  clearAllFilters();
                  
                  const periodo = timelineData[index].periodo;
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  
                  // Aplicar filtros baseado no período clicado
                  setTaskListFilter('dataLimite');
                  
                  if (periodo === 'Vencidas') {
                    // Vencidas = data < hoje (não concluídas)
                    const ontem = new Date(hoje);
                    ontem.setDate(ontem.getDate() - 1);
                    setFilterDataAte(formatDateForFilter(ontem));
                    setFilterDataDe('');
                    setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas
                  } else if (periodo === 'Hoje') {
                    // Hoje = data === hoje (não concluídas)
                    setFilterDataDe(formatDateForFilter(hoje));
                    setFilterDataAte(formatDateForFilter(hoje));
                    setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas
                  } else if (periodo === 'Próximos 7 dias') {
                    // Próximos 7 dias = data > hoje && data <= hoje+7 (não concluídas)
                    const proximos7Dias = new Date(hoje);
                    proximos7Dias.setDate(proximos7Dias.getDate() + 7);
                    setFilterDataDe(formatDateForFilter(hoje));
                    setFilterDataAte(formatDateForFilter(proximos7Dias));
                    setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas
                  } else if (periodo === 'Próximos 30 dias') {
                    // Próximos 30 dias = data > hoje+7 && data <= hoje+30 (não concluídas)
                    const proximos7Dias = new Date(hoje);
                    proximos7Dias.setDate(proximos7Dias.getDate() + 7);
                    const proximos30Dias = new Date(hoje);
                    proximos30Dias.setDate(proximos30Dias.getDate() + 30);
                    const proximos8Dias = new Date(hoje);
                    proximos8Dias.setDate(proximos8Dias.getDate() + 8);
                    setFilterDataDe(formatDateForFilter(proximos8Dias));
                    setFilterDataAte(formatDateForFilter(proximos30Dias));
                    setFilterStatus(['nao_concluidas']); // Filtrar apenas não concluídas
                  }
                }
              }}
              style={{ cursor: 'pointer' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* ÁREA 2: Tarefas com Previsão (Sprints Futuros) */}
      <div ref={previsaoRef} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              Tarefas com Previsão (Sprints Futuros)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Previsão: sexta-feira da semana seguinte após o fim do sprint
            </p>
          </div>
          {tasksComPrevisao.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span><strong>{tasksComPrevisao.length}</strong> tarefas</span>
              <span><strong>{formatHours(tasksComPrevisao.reduce((sum, t) => sum + (t.estimativa || 0), 0))}</strong></span>
            </div>
          )}
        </div>
        
        {tasksComPrevisao.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            <p>Nenhuma tarefa com previsão de sprints futuros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {/* Agrupar por sprint */}
            {(() => {
              const porSprint = new Map<string, { tarefas: DeliveryTask[]; horas: number; dataPrevisao: Date }>();
              tasksComPrevisao.forEach(task => {
                const sprint = task.sprint;
                if (!porSprint.has(sprint)) {
                  porSprint.set(sprint, { tarefas: [], horas: 0, dataPrevisao: task.dataLimiteCalculada });
                }
                const entry = porSprint.get(sprint)!;
                entry.tarefas.push(task);
                entry.horas += task.estimativa || 0;
              });
              
              // Ordenar sprints pela data de previsão (ascendente)
              return Array.from(porSprint.entries())
                .sort((a, b) => a[1].dataPrevisao.getTime() - b[1].dataPrevisao.getTime())
                .map(([sprint, data]) => (
                <button
                  key={sprint}
                  onClick={() => {
                    // Limpar todos os filtros antes de aplicar novos
                    clearAllFilters();
                    setSelectedFilter({ type: 'sprint', value: sprint });
                    // Aplicar filtro automático: apenas previsão deste sprint
                    setTaskListFilter('previsao');
                    setFilterSprint(sprint);
                    setFilterDataDe('');
                    setFilterDataAte('');
                  }}
                  className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer text-left w-full"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{sprint}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {data.tarefas.length} • {formatHours(data.horas)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {data.dataPrevisao.toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                </button>
              ));
            })()}
          </div>
        )}
      </div>
      
      {/* Cronograma de Entregas por Cliente */}
      <div ref={cronogramaRef} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Programação de Entregas por Cliente
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Exporte a programação completa de entregas para cada cliente
        </p>
        
        {/* Campo de busca e filtro Top */}
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="w-32">
            <select
              value={topClients}
              onChange={(e) => setTopClients(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
            </select>
          </div>
        </div>
        
         {clientSchedules.length === 0 ? (
           <div className="text-center py-12 text-gray-500 dark:text-gray-400">
             <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
             <p>Nenhum cronograma disponível</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
             {/* Lista de Clientes (cards pequenos) */}
             {(() => {
               // Filtrar e ordenar clientes
               let filtered = clientSchedules
                 .filter(schedule => 
                   schedule.cliente.toLowerCase().includes(searchClient.toLowerCase())
                 )
                 .sort((a, b) => b.totalTarefas - a.totalTarefas);
               
               // Aplicar filtro Top N se selecionado
               if (topClients && !searchClient) {
                 const topN = parseInt(topClients, 10);
                 filtered = filtered.slice(0, topN);
               }
               
               return filtered.map((schedule) => (
                 <div
                   key={schedule.cliente}
                   className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-all flex items-center justify-between gap-2"
                 >
                   <button
                     onClick={() => {
                       // Limpar todos os filtros antes de aplicar novos
                       clearAllFilters();
                       setSelectedFilter({ type: 'client', value: schedule.cliente });
                       // Aplicar filtro automático de cliente
                       setFilterCliente(schedule.cliente);
                       setTaskListFilter('todas');
                     }}
                     className="flex-1 min-w-0 text-left cursor-pointer"
                   >
                     <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                       {schedule.cliente}
                     </h4>
                     <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                       <div>
                         <strong>{schedule.totalTarefas}</strong> com previsão
                       </div>
                       {(() => {
                         const unplanned = clientUnplannedTasks.get(schedule.cliente) || [];
                         if (unplanned.length > 0) {
                           return (
                             <div>
                               <strong>{unplanned.length}</strong> sem previsão
                             </div>
                           );
                         }
                         return null;
                       })()}
                     </div>
                   </button>
                   <div className="flex items-center gap-2">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         exportClientPDF(schedule);
                       }}
                       className="flex-shrink-0 p-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                       title="Exportar PDF (tarefas previstas)"
                     >
                       <Download className="w-4 h-4" />
                     </button>
                     {(() => {
                       const unplanned = clientUnplannedTasks.get(schedule.cliente) || [];
                       const hasUnplanned = unplanned.length > 0;
                       return (
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             if (!hasUnplanned) {
                               return;
                             }
                             exportClientPDF(schedule, {
                               includeUnplanned: true,
                               unplannedTasks: unplanned,
                             });
                           }}
                           className={`flex-shrink-0 p-2 rounded-lg border border-dashed ${
                             hasUnplanned
                               ? 'border-indigo-400 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                               : 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                           } transition-all`}
                           title={
                             hasUnplanned
                               ? 'Exportar PDF incluindo tarefas não previstas'
                               : 'Sem tarefas não previstas para este cliente'
                           }
                           disabled={!hasUnplanned}
                         >
                           <FileWarning className="w-4 h-4" />
                         </button>
                       );
                     })()}
                   </div>
                 </div>
               ));
             })()}
          </div>
        )}
      </div>
      
      {/* Lista de Tarefas de Entrega - Apenas consulta (sem filtros) */}
      <div ref={taskListRef}>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Lista de Tarefas (Entregas)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Consulta de tarefas com data limite ou previsão de entrega
              </p>
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
    </div>
  );
};

