import * as XLSX from 'xlsx';
import { CostData } from '../types';

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

export interface CustosParseResult {
  success: boolean;
  data?: CostData[];
  error?: string;
}

interface CustosRow {
  [key: string]: any;
}

// Column mappings for different encodings
const CUSTOS_COLUMN_MAPPINGS: { [key: string]: string[] } = {
  'Responsável': ['Responsável', 'Responsavel', 'ResponsÃ¡vel', 'Nome', 'Name', 'Desenvolvedor', 'Developer'],
  'Salário': ['Salário', 'Salario', 'SalÃ¡rio', 'Salary', 'Salário Bruto', 'Salario Bruto', 'Salário Bruto (R$)', 'Salario Bruto (R$)'],
};

/**
 * Get column value trying different encoding variations
 */
function getCustosColumnValue(row: CustosRow, columnName: string): string {
  const variations = CUSTOS_COLUMN_MAPPINGS[columnName] || [columnName];
  
  for (const variation of variations) {
    if (row[variation] !== undefined && row[variation] !== null) {
      return String(row[variation]);
    }
  }
  
  return '';
}

/**
 * Get numeric column value trying different encoding variations
 * Handles currency format (R$ 1.000,00) and regular numbers
 * IMPORTANT: With raw: false, Excel returns formatted strings, so "4000,00" comes as string "4000,00"
 * We need to properly parse Brazilian number format (comma as decimal separator)
 */
function getCustosNumericValue(row: CustosRow, columnName: string): number | undefined {
  const variations = CUSTOS_COLUMN_MAPPINGS[columnName] || [columnName];
  
  for (const variation of variations) {
    if (row[variation] !== undefined && row[variation] !== null) {
      const value = row[variation];
      
      // If already a number, return it (shouldn't happen with raw: false, but handle it)
      if (typeof value === 'number') {
        // Check if it might be a misread Brazilian format (Excel sometimes reads 4000,00 as 400000)
        // If the number is very large and dividing by 100 gives reasonable salary, use divided value
        if (value > 100000) {
          const divided = value / 100;
          // If divided value is in reasonable salary range (1000-100000), it's likely misread
          if (divided >= 1000 && divided <= 100000) {
            return divided;
          }
        }
        return value > 0 ? value : undefined;
      }
      
      // Parse as string (with raw: false, we get formatted strings like "4000,00")
      const strValue = String(value).trim();
      
      if (!strValue) return undefined;
      
      // Remove currency symbols
      let cleaned = strValue.replace(/R\$\s*/gi, '').trim();
      
      // Handle Brazilian number format:
      // - "1.000,00" -> 1000.00 (point is thousands, comma is decimal)
      // - "4000,00" -> 4000.00 (comma is decimal)
      // - "4000.00" -> 4000.00 (already in US format)
      
      // Check if it has both point and comma (thousands separator + decimal)
      const hasPoint = cleaned.includes('.');
      const hasComma = cleaned.includes(',');
      
      if (hasPoint && hasComma) {
        // Format: "1.000,00" - point is thousands, comma is decimal
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else if (hasComma && !hasPoint) {
        // Format: "4000,00" - comma is decimal separator
        cleaned = cleaned.replace(',', '.');
      } else if (hasPoint && !hasComma) {
        // Format: "4000.00" - already US format, but check if point might be decimal
        // If it has more than 2 digits after point, it's likely thousands separator
        const parts = cleaned.split('.');
        if (parts.length === 2 && parts[1].length <= 2) {
          // Likely decimal: "4000.00"
          // Keep as is
        } else {
          // Likely thousands separator: "4.000"
          cleaned = cleaned.replace(/\./g, '');
        }
      }
      
      const numValue = parseFloat(cleaned);
      if (!isNaN(numValue) && numValue > 0) {
        return numValue;
      }
    }
  }
  
  return undefined;
}

/**
 * Calculate hourly rate: (salarioBruto / 220) * 1.7
 */
function calculateValorHora(salarioBruto: number): number {
  return (salarioBruto / 220) * 1.7;
}

/**
 * Parse custos Excel file
 */
export async function parseCustosFile(file: File): Promise<CustosParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            error: 'Não foi possível ler o arquivo de custos',
          });
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with raw: false to get formatted strings (preserves decimal comma)
        const jsonData = XLSX.utils.sheet_to_json<CustosRow>(worksheet, {
          raw: false, // Get formatted strings to preserve Brazilian number format (4000,00)
          defval: '',
        });

        const custos = parseCustosData(jsonData);
        
        if (custos.length === 0) {
          resolve({
            success: false,
            error: 'Nenhum dado de custo válido encontrado no arquivo',
          });
          return;
        }
        
        resolve({ success: true, data: custos });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido ao processar o arquivo de custos',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Erro ao ler o arquivo de custos',
      });
    };

    reader.readAsBinaryString(file);
  });
}

function parseCustosData(rows: CustosRow[]): CostData[] {
  const custos: CostData[] = [];

  for (const row of rows) {
    try {
      const responsavel = normalizeText(getCustosColumnValue(row, 'Responsável'));
      const salarioBruto = getCustosNumericValue(row, 'Salário');
      
      // Skip empty rows
      if (!responsavel || !salarioBruto) {
        continue;
      }

      const valorHora = calculateValorHora(salarioBruto);

      const costData: CostData = {
        responsavel: responsavel.trim(),
        salarioBruto,
        valorHora,
      };

      custos.push(costData);
    } catch (error) {
      console.warn('Erro ao processar linha do arquivo de custos:', row, error);
      // Continue processing other rows
    }
  }

  return custos;
}

/**
 * Validate custos file structure
 */
export function validateCustosStructure(file: File): Promise<boolean> {
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
          'Responsável',
          'Salário',
        ];

        // Check if all required columns are present
        const hasAllRequired = requiredColumns.every((columnName) => {
          const variations = CUSTOS_COLUMN_MAPPINGS[columnName] || [columnName];
          return variations.some((variation) => headers.includes(variation));
        });
        
        resolve(hasAllRequired);
      } catch (error) {
        console.error('Erro ao validar estrutura do arquivo de custos:', error);
        resolve(false);
      }
    };

    reader.onerror = () => resolve(false);

    reader.readAsBinaryString(file);
  });
}

