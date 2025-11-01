import * as XLSX from 'xlsx';
import { TaskItem } from '../types';
import {
  parseTimeToHours,
  determineTaskType,
  parseDate,
} from '../utils/calculations';

export interface ParseResult {
  success: boolean;
  data?: TaskItem[];
  error?: string;
}

interface XlsRow {
  [key: string]: any;
}

// Mapeamento de colunas para lidar com diferentes encodings
const COLUMN_MAPPINGS: { [key: string]: string[] } = {
  'Tipo de item': ['Tipo de item', 'Tipo'],
  'Chave da item': ['Chave da item'],
  'ID da item': ['ID da item'],
  'Resumo': ['Resumo'],
  'Tempo gasto': ['Tempo gasto'],
  'Sprint': ['Sprint'],
  'Criado': ['Criado'],
  'Estimativa original': ['Estimativa original'],
  'Responsável': ['Responsável', 'ResponsÃ¡vel', 'Responsavel'],
  'ID do responsável': ['ID do responsável', 'ID do responsÃ¡vel', 'ID do responsavel'],
  'Status': ['Status'],
  'Campo personalizado (Modulo)': ['Campo personalizado (Modulo)', 'Campo personalizado (MÃ³dulo)', 'Campo personalizado (Módulo)'],
  'Campo personalizado (Feature)': ['Campo personalizado (Feature)'],
  'Categorias': ['Categorias'],
  'Campo personalizado (Detalhes Ocultos)': ['Campo personalizado (Detalhes Ocultos)'],
  'Campo personalizado (Complexidade)': ['Campo personalizado (Complexidade)'],
  'Campo personalizado (Nota Teste)': ['Campo personalizado (Nota Teste)', 'Campo personalizado (Nota de Teste)'],
  'Campo personalizado (Qualidade do Chamado)': ['Campo personalizado (Qualidade do Chamado)'],
};

/**
 * Busca o valor de uma coluna tentando diferentes variações de encoding
 */
function getColumnValue(row: XlsRow, columnName: string): string {
  const variations = COLUMN_MAPPINGS[columnName] || [columnName];
  
  for (const variation of variations) {
    if (row[variation] !== undefined && row[variation] !== null) {
      return String(row[variation]);
    }
  }
  
  return '';
}

/**
 * Busca o valor bruto de uma coluna (sem converter para string)
 * Útil para colunas numéricas como tempo em segundos
 */
function getRawColumnValue(row: XlsRow, columnName: string): any {
  const variations = COLUMN_MAPPINGS[columnName] || [columnName];
  
  for (const variation of variations) {
    if (row[variation] !== undefined && row[variation] !== null) {
      return row[variation];
    }
  }
  
  return '';
}

function parseNotaTeste(value: any): number {
  if (value === undefined || value === null || value === '') return 5;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return 5;
  // clamp to 1-5, default already handled
  return Math.max(1, Math.min(5, num));
}

/**
 * Normaliza texto corrigindo problemas de encoding UTF-8 mal interpretado
 */
function normalizeText(text: string): string {
  if (!text) return text;
  
  // Array de substituições para garantir ordem correta
  // (mais específicos primeiro para evitar substituições parciais)
  const replacements: [string, string][] = [
    // Minúsculas acentuadas
    ['Ã¡', 'á'],
    ['Ã©', 'é'],
    ['Ã­', 'í'],
    ['Ã³', 'ó'],
    ['Ãº', 'ú'],
    ['Ã¢', 'â'],
    ['Ãª', 'ê'],
    ['Ã´', 'ô'],
    ['Ã£', 'ã'],
    ['Ãµ', 'õ'],
    ['Ã§', 'ç'],
    // Maiúsculas acentuadas
    ['Ã‰', 'É'],
    ['Ãš', 'Ú'],
    ['Ã‚', 'Â'],
    ['ÃŠ', 'Ê'],
    ['Ãƒ', 'Ã'],
    ['Ã•', 'Õ'],
    ['Ã‡', 'Ç'],
  ];
  
  let normalized = text;
  for (const [bad, good] of replacements) {
    normalized = normalized.replace(new RegExp(bad, 'g'), good);
  }
  
  return normalized;
}

/**
 * Normaliza o tipo da tarefa lido do Excel
 */
function normalizeTaskType(tipo: string): 'Bug' | 'Tarefa' | 'História' | 'Outro' {
  if (!tipo) return 'Outro';
  
  const normalized = normalizeText(tipo.trim().toLowerCase());
  
  if (normalized === 'bug') return 'Bug';
  if (normalized === 'tarefa' || normalized === 'task') return 'Tarefa';
  if (normalized === 'história' || normalized === 'historia' || normalized === 'story') return 'História';
  
  return 'Outro';
}

/**
 * Converte o valor de Complexidade para número (1-5)
 */
function parseComplexidade(value: any): number {
  if (!value) return 1; // Default para complexidade baixa
  
  // Se já for número, garantir que está no range 1-5
  if (typeof value === 'number') {
    return Math.max(1, Math.min(5, Math.round(value)));
  }
  
  // Se for string, tentar converter
  const num = parseInt(String(value), 10);
  if (isNaN(num)) return 1;
  
  return Math.max(1, Math.min(5, num));
}

export async function parseXLSFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            error: 'Não foi possível ler o arquivo',
          });
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Ler primeiro para obter os cabeçalhos completos (incluindo duplicatas)
        // Usar header: 1 para obter arrays e poder identificar posições das colunas
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet, {
          header: 1,
          defval: '',
        }) as any[][];

        if (rawData.length === 0) {
          resolve({ success: true, data: [] });
          return;
        }

        // Primeira linha são os cabeçalhos
        const headers = rawData[0] as string[];
        
        // Encontrar todas as colunas que correspondem a Feature e Categorias
        const featureColumnIndices: number[] = [];
        const categoriasColumnIndices: number[] = [];
        
        headers.forEach((header, index) => {
          const headerStr = String(header || '').trim();
          const normalizedHeader = normalizeText(headerStr).toLowerCase();
          
          // Verificar se é uma coluna de Feature - usar contains para pegar variações
          if (normalizedHeader.includes('feature')) {
            featureColumnIndices.push(index);
          }
          
          // Verificar se é uma coluna de Categorias - usar contains para pegar variações
          if (normalizedHeader.includes('categoria')) {
            categoriasColumnIndices.push(index);
          }
        });

        // Converter para formato com objetos (para compatibilidade com código existente)
        // Mas processar manualmente features e categorias para capturar todas as colunas
        const jsonData = XLSX.utils.sheet_to_json<XlsRow>(worksheet, {
          raw: false,
          defval: '',
        });

        // Processar dados linha por linha para capturar todas as colunas de features e categorias
        const tasks = parseXlsDataWithMultipleColumns(jsonData, rawData, headers, featureColumnIndices, categoriasColumnIndices);
        resolve({ success: true, data: tasks });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido ao processar o arquivo',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Erro ao ler o arquivo',
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Busca valores de múltiplas colunas que correspondem a um padrão
 * Útil para colunas que podem se repetir (ex: múltiplas colunas de Feature ou Categorias)
 */
function getMultipleColumnValues(row: XlsRow, patternVariations: string[]): string[] {
  const values: string[] = [];
  const foundKeys = new Set<string>();
  
  // Percorrer todas as chaves do row
  for (const key of Object.keys(row)) {
    const normalizedKey = normalizeText(key);
    
    // Verificar se a chave corresponde a alguma variação do padrão
    for (const variation of patternVariations) {
      const normalizedVariation = normalizeText(variation);
      
      // Verificar se a chave contém a variação (permitindo variações como "Feature", "feature", etc.)
      if (normalizedKey.toLowerCase().includes(normalizedVariation.toLowerCase())) {
        // Evitar duplicatas
        if (!foundKeys.has(key)) {
          const value = normalizeText(String(row[key] || ''));
          if (value && value.trim() !== '') {
            values.push(value.trim());
            foundKeys.add(key);
          }
        }
      }
    }
  }
  
  return values;
}

/**
 * Processa dados Excel capturando todas as colunas de Features e Categorias,
 * mesmo quando há colunas duplicadas com o mesmo nome
 */
function parseXlsDataWithMultipleColumns(
  jsonData: XlsRow[],
  rawData: any[][],
  headers: string[],
  featureColumnIndices: number[],
  categoriasColumnIndices: number[]
): TaskItem[] {
  const tasks: TaskItem[] = [];

  // Processar cada linha de dados (pular a primeira que são os cabeçalhos)
  for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
    try {
      const rawRow = rawData[rowIndex];
      const jsonRow = jsonData[rowIndex - 1]; // jsonData não inclui a linha de cabeçalho
      
      if (!jsonRow) continue;

      // Obter valores das colunas (tentando diferentes variações de encoding)
      const chave = getColumnValue(jsonRow, 'Chave da item');
      const id = getColumnValue(jsonRow, 'ID da item');
      
      // Pular linhas vazias
      if (!chave && !id) {
        continue;
      }

      const resumo = normalizeText(getColumnValue(jsonRow, 'Resumo'));
      const tempoGasto = getRawColumnValue(jsonRow, 'Tempo gasto'); // Manter como número se for segundos
      const sprint = normalizeText(getColumnValue(jsonRow, 'Sprint'));
      const criado = getColumnValue(jsonRow, 'Criado');
      const estimativa = getRawColumnValue(jsonRow, 'Estimativa original'); // Manter como número se for segundos
      const responsavel = normalizeText(getColumnValue(jsonRow, 'Responsável'));
      const idResponsavel = getColumnValue(jsonRow, 'ID do responsável');
      const status = normalizeText(getColumnValue(jsonRow, 'Status'));
      const modulo = normalizeText(getColumnValue(jsonRow, 'Campo personalizado (Modulo)'));
      
      // Ler múltiplas colunas de Feature diretamente dos índices
      // Isso captura TODAS as colunas, mesmo que tenham o mesmo nome
      const featuresSet = new Set<string>();
      featureColumnIndices.forEach(colIndex => {
        if (rawRow && rawRow[colIndex] !== undefined && rawRow[colIndex] !== null) {
          const value = rawRow[colIndex];
          const valueStr = String(value).trim();
          if (valueStr !== '' && valueStr !== 'undefined' && valueStr !== 'null') {
            const normalizedValue = normalizeText(valueStr);
            if (normalizedValue && normalizedValue.trim() !== '') {
              featuresSet.add(normalizedValue.trim());
            }
          }
        }
      });
      const features = Array.from(featuresSet);
      
      // Ler múltiplas colunas de Categorias diretamente dos índices
      // Isso captura TODAS as colunas, mesmo que tenham o mesmo nome
      const categoriasSet = new Set<string>();
      categoriasColumnIndices.forEach(colIndex => {
        if (rawRow && rawRow[colIndex] !== undefined && rawRow[colIndex] !== null) {
          const value = rawRow[colIndex];
          const valueStr = String(value).trim();
          if (valueStr !== '' && valueStr !== 'undefined' && valueStr !== 'null') {
            const normalizedValue = normalizeText(valueStr);
            if (normalizedValue && normalizedValue.trim() !== '') {
              categoriasSet.add(normalizedValue.trim());
            }
          }
        }
      });
      const categorias = Array.from(categoriasSet);
      
      const detalhesOcultos = normalizeText(getColumnValue(jsonRow, 'Campo personalizado (Detalhes Ocultos)'));
      const complexidadeRaw = getRawColumnValue(jsonRow, 'Campo personalizado (Complexidade)');
      const notaTesteRaw = getRawColumnValue(jsonRow, 'Campo personalizado (Nota Teste)');
      const qualidadeChamado = normalizeText(getColumnValue(jsonRow, 'Campo personalizado (Qualidade do Chamado)'));
      
      // Ler o tipo diretamente da coluna, se existir
      const tipoRaw = getColumnValue(jsonRow, 'Tipo de item');
      let tipo: 'Bug' | 'Tarefa' | 'História' | 'Outro';
      
      if (tipoRaw) {
        // Se a coluna existe, usar o valor dela
        tipo = normalizeTaskType(tipoRaw);
      } else {
        // Fallback: determinar tipo baseado no conteúdo (para compatibilidade com arquivos antigos)
        tipo = determineTaskType(chave, resumo);
      }

      const task: TaskItem = {
        chave,
        id,
        resumo,
        tempoGasto: parseTimeToHours(tempoGasto),
        sprint,
        criado: parseDate(criado),
        estimativa: parseTimeToHours(estimativa),
        responsavel,
        idResponsavel,
        status,
        modulo,
        feature: features,
        categorias: categorias,
        detalhesOcultos,
        tipo,
        complexidade: parseComplexidade(complexidadeRaw),
        notaTeste: parseNotaTeste(notaTesteRaw),
        qualidadeChamado: qualidadeChamado || undefined,
      };

      tasks.push(task);
    } catch (error) {
      console.warn('Erro ao processar linha:', rowIndex, error);
      // Continuar processando outras linhas
    }
  }

  return tasks;
}

export function validateXLSStructure(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve(false);
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Ler apenas a primeira linha (cabeçalhos)
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        range.e.r = 0; // Limitar à primeira linha
        
        const headers = XLSX.utils.sheet_to_json<any>(worksheet, {
          range: 0,
          header: 1,
        })[0] || [];

        const requiredColumns = [
          'Chave da item',
          'Resumo',
          'Tempo gasto',
          'Sprint',
          'Estimativa original',
          'Status',
        ];

        // Verificar se todas as colunas obrigatórias estão presentes
        // (considerando variações de encoding)
        const hasAllRequired = requiredColumns.every((columnName) => {
          const variations = COLUMN_MAPPINGS[columnName] || [columnName];
          return variations.some((variation) => headers.includes(variation));
        });
        
        resolve(hasAllRequired);
      } catch (error) {
        console.error('Erro ao validar estrutura:', error);
        resolve(false);
      }
    };

    reader.onerror = () => resolve(false);

    reader.readAsBinaryString(file);
  });
}

