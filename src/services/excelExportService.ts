import * as XLSX from 'xlsx';
import { TaskItem } from '../types';
import { formatHours } from '../utils/calculations';

export const exportTasksToExcel = (tasks: TaskItem[], sprintName: string) => {
  // Preparar os dados com todas as colunas visíveis na tabela
  const worksheetData = tasks.map((task) => {
    const estimativaRestante = task.estimativaRestante ?? task.estimativa ?? 0;
    const tempoGasto = task.tempoGastoNoSprint ?? 0;
    const notaTeste = task.notaTeste ?? 5;

    return {
      'Chave': task.chave,
      'Resumo': task.resumo,
      'Sprint': task.sprint || '',
      'Responsável': task.responsavel || '',
      'Status': task.status,
      'Tipo': task.tipo,
      'Complexidade': task.complexidade,
      'Nota Teste': notaTeste.toFixed(1),
      'Estimado (h)': estimativaRestante,
      'Gasto (h)': tempoGasto,
      'Detalhes Ocultos': task.detalhesOcultos.join(', ') || '',
      'Módulo': task.modulo || '',
      'Features': task.feature.join(', ') || '',
      'Categorias': task.categorias.join(', ') || '',
      'Estimativa Original (h)': task.estimativa,
      'Tempo Gasto Total (h)': task.tempoGastoTotal ?? 0,
      'Tempo Outros Sprints (h)': task.tempoGastoOutrosSprints ?? 0,
    };
  });

  // Criar workbook e worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 12 }, // Chave
    { wch: 50 }, // Resumo
    { wch: 20 }, // Sprint
    { wch: 15 }, // Responsável
    { wch: 12 }, // Status
    { wch: 12 }, // Tipo
    { wch: 12 }, // Complexidade
    { wch: 12 }, // Nota Teste
    { wch: 12 }, // Estimado (h)
    { wch: 12 }, // Gasto (h)
    { wch: 20 }, // Detalhes Ocultos
    { wch: 15 }, // Módulo
    { wch: 30 }, // Features
    { wch: 20 }, // Categorias
    { wch: 20 }, // Estimativa Original (h)
    { wch: 20 }, // Tempo Gasto Total (h)
    { wch: 22 }, // Tempo Outros Sprints (h)
  ];
  worksheet['!cols'] = columnWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarefas');

  // Gerar arquivo Excel
  const fileName = `tarefas_${sprintName.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
