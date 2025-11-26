import * as XLSX from 'xlsx';
import { WorklogEntry } from '../types';
import { parseTimeToHours, parseDate } from '../utils/calculations';

export interface WorklogParseResult {
  success: boolean;
  data?: WorklogEntry[];
  error?: string;
}

interface WorklogRow {
  [key: string]: any;
}

// Column mappings for different encodings
const WORKLOG_COLUMN_MAPPINGS: { [key: string]: string[] } = {
  'ID da tarefa': ['ID da tarefa', 'Task ID', 'Chave', 'Chave da item', 'Issue Key', 'Issue'],
  'Tempo gasto': ['Tempo gasto', 'Time Spent', 'Time spent', 'Hours', 'Horas', 'Duration'],
  'Data': ['Data', 'Date', 'Data de registro', 'Log Date', 'Started'],
  'Descrição': [
    'Descrição',
    'Description',
    'Descrição do Worklog',
    'Work Description',
    'Work description',
    'Comment',
    'Comments',
    'Comentário',
    'Comentários',
  ],
};

/**
 * Get column value trying different encoding variations
 */
function getWorklogColumnValue(row: WorklogRow, columnName: string): string {
  const variations = WORKLOG_COLUMN_MAPPINGS[columnName] || [columnName];
  
  for (const variation of variations) {
    if (row[variation] !== undefined && row[variation] !== null) {
      return String(row[variation]);
    }
  }
  
  return '';
}

/**
 * Get raw column value (without converting to string)
 */
function getRawWorklogColumnValue(row: WorklogRow, columnName: string): any {
  const variations = WORKLOG_COLUMN_MAPPINGS[columnName] || [columnName];
  
  for (const variation of variations) {
    if (row[variation] !== undefined && row[variation] !== null) {
      return row[variation];
    }
  }
  
  return '';
}

/**
 * Parse worklog Excel file
 */
export async function parseWorklogFile(file: File): Promise<WorklogParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            error: 'Não foi possível ler o arquivo de worklog',
          });
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<WorklogRow>(worksheet, {
          raw: false,
          defval: '',
        });

        const worklogs = parseWorklogData(jsonData);
        resolve({ success: true, data: worklogs });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido ao processar o arquivo de worklog',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Erro ao ler o arquivo de worklog',
      });
    };

    reader.readAsBinaryString(file);
  });
}

function parseWorklogData(rows: WorklogRow[]): WorklogEntry[] {
  const worklogs: WorklogEntry[] = [];

  for (const row of rows) {
    try {
      const taskId = getWorklogColumnValue(row, 'ID da tarefa');
      const tempoGastoRaw = getRawWorklogColumnValue(row, 'Tempo gasto');
      const dataRaw = getWorklogColumnValue(row, 'Data');
      const descricaoRaw = getWorklogColumnValue(row, 'Descrição');
      
      // Skip empty rows
      if (!taskId) {
        continue;
      }

      const worklog: WorklogEntry = {
        taskId: taskId.trim(),
        responsavel: '', // Campo mantido para compatibilidade, mas não é mais obrigatório
        tempoGasto: parseTimeToHours(tempoGastoRaw),
        data: parseDate(dataRaw),
        descricao: descricaoRaw?.trim() ? descricaoRaw.trim() : undefined,
      };

      worklogs.push(worklog);
    } catch (error) {
      console.warn('Erro ao processar linha do worklog:', row, error);
      // Continue processing other rows
    }
  }

  return worklogs;
}

/**
 * Validate worklog file structure
 */
export function validateWorklogStructure(file: File): Promise<boolean> {
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
        
        // Read only the first row (headers)
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        range.e.r = 0; // Limit to first row
        
        const headersRaw = XLSX.utils.sheet_to_json<any>(worksheet, {
          range: 0,
          header: 1,
        })[0] || [];
        
        // Normalize headers: trim whitespace and convert to array if needed
        const headers = Array.isArray(headersRaw) 
          ? headersRaw.map((h: any) => String(h || '').trim())
          : Object.values(headersRaw).map((h: any) => String(h || '').trim());

      const requiredColumns = [
        'ID da tarefa',
        'Tempo gasto',
        'Data',
      ];

        // Check if all required columns are present
        // Compare ignoring case and whitespace
        const hasAllRequired = requiredColumns.every((columnName) => {
          const variations = WORKLOG_COLUMN_MAPPINGS[columnName] || [columnName];
          return variations.some((variation) => 
            headers.some((header: string) => {
              const normalizedHeader = header.toLowerCase().trim();
              const normalizedVariation = variation.toLowerCase().trim();
              return normalizedHeader === normalizedVariation;
            })
          );
        });
        
        // Debug: log if validation fails
        if (!hasAllRequired) {
          console.log('Headers encontrados:', headers);
          console.log('Colunas obrigatórias:', requiredColumns);
        }
        
        resolve(hasAllRequired);
      } catch (error) {
        console.error('Erro ao validar estrutura do worklog:', error);
        resolve(false);
      }
    };

    reader.onerror = () => resolve(false);

    reader.readAsBinaryString(file);
  });
}

