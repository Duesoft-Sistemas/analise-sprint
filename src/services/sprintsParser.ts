import * as XLSX from 'xlsx';
import { SprintMetadata } from '../types';
import { parseDate } from '../utils/calculations';

export interface SprintsParseResult {
  success: boolean;
  data?: SprintMetadata[];
  error?: string;
}

interface SprintsRow {
  [key: string]: any;
}

// Column mappings for different encodings
const SPRINTS_COLUMN_MAPPINGS: { [key: string]: string[] } = {
  'Sprint': ['Sprint', 'sprint', 'Nome do Sprint', 'Sprint Name', 'ID'],
  'Data Início': ['Data Início', 'Data Inicio', 'Data início', 'Data inicio', 'Data Inicial', 'Data inicial', 'Start Date', 'Início', 'Inicio'],
  'Data Fim': ['Data Fim', 'Data fim', 'Data Final', 'Data final', 'End Date', 'Fim'],
};

/**
 * Get column value trying different encoding variations
 */
function getSprintsColumnValue(row: SprintsRow, columnName: string): string {
  const variations = SPRINTS_COLUMN_MAPPINGS[columnName] || [columnName];
  
  for (const variation of variations) {
    if (row[variation] !== undefined && row[variation] !== null) {
      return String(row[variation]);
    }
  }
  
  return '';
}

/**
 * Parse sprints Excel file
 */
export async function parseSprintsFile(file: File): Promise<SprintsParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            error: 'Não foi possível ler o arquivo de sprints',
          });
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<SprintsRow>(worksheet, {
          raw: false,
          defval: '',
        });

        const sprints = parseSprintsData(jsonData);
        
        if (sprints.length === 0) {
          resolve({
            success: false,
            error: 'Nenhum sprint válido encontrado no arquivo',
          });
          return;
        }
        
        resolve({ success: true, data: sprints });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido ao processar o arquivo de sprints',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Erro ao ler o arquivo de sprints',
      });
    };

    reader.readAsBinaryString(file);
  });
}

function parseSprintsData(rows: SprintsRow[]): SprintMetadata[] {
  const sprints: SprintMetadata[] = [];

  for (const row of rows) {
    try {
      const sprint = getSprintsColumnValue(row, 'Sprint');
      const dataInicioRaw = getSprintsColumnValue(row, 'Data Início');
      const dataFimRaw = getSprintsColumnValue(row, 'Data Fim');
      
      // Skip empty rows
      if (!sprint || !dataInicioRaw || !dataFimRaw) {
        continue;
      }

      // Parse start date at beginning of day (00:00:00)
      const dataInicio = parseDate(dataInicioRaw);
      dataInicio.setHours(0, 0, 0, 0);
      
      // Parse end date at end of day (23:59:59.999) to include the entire last day
      const dataFim = parseDate(dataFimRaw);
      dataFim.setHours(23, 59, 59, 999);

      const sprintMetadata: SprintMetadata = {
        sprint: sprint.trim(),
        dataInicio,
        dataFim,
      };

      sprints.push(sprintMetadata);
    } catch (error) {
      console.warn('Erro ao processar linha do arquivo de sprints:', row, error);
      // Continue processing other rows
    }
  }

  return sprints;
}

/**
 * Validate sprints file structure
 */
export function validateSprintsStructure(file: File): Promise<boolean> {
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
        
        const headers = XLSX.utils.sheet_to_json<any>(worksheet, {
          range: 0,
          header: 1,
        })[0] || [];

        const requiredColumns = [
          'Sprint',
          'Data Início',
          'Data Fim',
        ];

        // Check if all required columns are present
        const hasAllRequired = requiredColumns.every((columnName) => {
          const variations = SPRINTS_COLUMN_MAPPINGS[columnName] || [columnName];
          return variations.some((variation) => headers.includes(variation));
        });
        
        resolve(hasAllRequired);
      } catch (error) {
        console.error('Erro ao validar estrutura do arquivo de sprints:', error);
        resolve(false);
      }
    };

    reader.onerror = () => resolve(false);

    reader.readAsBinaryString(file);
  });
}

