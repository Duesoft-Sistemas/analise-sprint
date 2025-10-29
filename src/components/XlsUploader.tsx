import React, { useCallback, useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Clock, Calendar } from 'lucide-react';
import { parseXLSFile } from '../services/xlsParser';
import { parseWorklogFile } from '../services/worklogParser';
import { parseSprintPeriod, getDefaultSprintPeriod, formatDateForInput } from '../services/hybridCalculations';
import { useSprintStore } from '../store/useSprintStore';

type FileType = 'layout' | 'worklog';

export const XlsUploader: React.FC = () => {
  const [isDraggingLayout, setIsDraggingLayout] = useState(false);
  const [isDraggingWorklog, setIsDraggingWorklog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [isLoadingWorklog, setIsLoadingWorklog] = useState(false);
  const [layoutFileName, setLayoutFileName] = useState<string | null>(null);
  const [worklogFileName, setWorklogFileName] = useState<string | null>(null);
  
  const setTasks = useSprintStore((state) => state.setTasks);
  const setWorklogs = useSprintStore((state) => state.setWorklogs);
  const setSprintPeriod = useSprintStore((state) => state.setSprintPeriod);
  const selectedSprint = useSprintStore((state) => state.selectedSprint);
  
  // Initialize with default period (Monday to Friday of current week)
  const defaultPeriod = getDefaultSprintPeriod('Sprint Atual');
  const [startDate, setStartDate] = useState(formatDateForInput(defaultPeriod.startDate));
  const [endDate, setEndDate] = useState(formatDateForInput(defaultPeriod.endDate));

  const handleLayoutFile = useCallback(
    async (file: File) => {
      const isValidFile = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (!isValidFile) {
        setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
        return;
      }

      // Validate sprint period dates are filled
      if (!startDate || !endDate) {
        setError('Por favor, preencha as datas do período do sprint antes de fazer upload do layout');
        return;
      }

      setIsLoadingLayout(true);
      setError(null);

      const result = await parseXLSFile(file);

      if (result.success && result.data) {
        setTasks(result.data, file.name);
        setLayoutFileName(file.name);
        setError(null);
      } else {
        setError(result.error || 'Erro ao processar o arquivo de layout');
      }

      setIsLoadingLayout(false);
    },
    [setTasks, startDate, endDate]
  );

  const handleWorklogFile = useCallback(
    async (file: File) => {
      const isValidFile = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (!isValidFile) {
        setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
        return;
      }

      setIsLoadingWorklog(true);
      setError(null);

      const result = await parseWorklogFile(file);

      if (result.success && result.data) {
        setWorklogs(result.data, file.name);
        setWorklogFileName(file.name);
        setError(null);
      } else {
        setError(result.error || 'Erro ao processar o arquivo de worklog');
      }

      setIsLoadingWorklog(false);
    },
    [setWorklogs]
  );

  const handleSprintPeriodChange = useCallback(() => {
    if (startDate && endDate) {
      try {
        const sprintName = selectedSprint || 'Sprint Atual';
        const period = parseSprintPeriod(sprintName, startDate, endDate);
        setSprintPeriod(period);
        setError(null);
      } catch (err) {
        setError('Erro ao definir período do sprint. Verifique as datas.');
      }
    }
  }, [startDate, endDate, selectedSprint, setSprintPeriod]);

  // Layout file handlers
  const handleLayoutDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingLayout(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleLayoutFile(file);
      }
    },
    [handleLayoutFile]
  );

  const handleLayoutDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLayout(true);
  }, []);

  const handleLayoutDragLeave = useCallback(() => {
    setIsDraggingLayout(false);
  }, []);

  const handleLayoutFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleLayoutFile(file);
      }
    },
    [handleLayoutFile]
  );

  // Worklog file handlers
  const handleWorklogDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingWorklog(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleWorklogFile(file);
      }
    },
    [handleWorklogFile]
  );

  const handleWorklogDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingWorklog(true);
  }, []);

  const handleWorklogDragLeave = useCallback(() => {
    setIsDraggingWorklog(false);
  }, []);

  const handleWorklogFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleWorklogFile(file);
      }
    },
    [handleWorklogFile]
  );

  // Update sprint period when dates change
  React.useEffect(() => {
    handleSprintPeriodChange();
  }, [handleSprintPeriodChange]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Upload de Arquivos</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure o período do sprint (obrigatório) e faça upload dos arquivos
        </p>
      </div>

      {/* Sprint Period Configuration - SEMPRE VISÍVEL */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 border-2 border-blue-300 dark:border-blue-700 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6 text-blue-700 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            1. Período do Sprint (Obrigatório)
          </h3>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          📅 Defina o período de análise do sprint. Por padrão, mostra segunda a sexta da semana atual.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Data Início (Segunda-feira) *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Data Fim (Sexta-feira) *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            />
          </div>
        </div>
        {startDate && endDate && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              ✅ Período configurado: {startDate.split('-').reverse().join('/')} a {endDate.split('-').reverse().join('/')}
            </p>
          </div>
        )}
      </div>

      {/* Worklog File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          2. Worklog (Opcional - para análise detalhada por período)
        </label>
        <div
          className={`
            border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300
            ${isDraggingWorklog 
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }
            ${isLoadingWorklog ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg'}
          `}
          onDrop={handleWorklogDrop}
          onDragOver={handleWorklogDragOver}
          onDragLeave={handleWorklogDragLeave}
          onClick={() => document.getElementById('worklog-file-input')?.click()}
        >
          <input
            id="worklog-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleWorklogFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            {isLoadingWorklog ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
                <p className="text-gray-600 dark:text-gray-400">Processando worklog...</p>
              </>
            ) : worklogFileName ? (
              <>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">✓ {worklogFileName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clique para substituir</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl">
                  <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                    Arraste o arquivo de worklog
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ou clique para selecionar
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Layout File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          3. Layout do Sprint (Obrigatório)
        </label>
        <div
          className={`
            border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300
            ${isDraggingLayout 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }
            ${isLoadingLayout ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg'}
          `}
          onDrop={handleLayoutDrop}
          onDragOver={handleLayoutDragOver}
          onDragLeave={handleLayoutDragLeave}
          onClick={() => document.getElementById('layout-file-input')?.click()}
        >
          <input
            id="layout-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleLayoutFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            {isLoadingLayout ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-gray-600 dark:text-gray-400">Processando layout...</p>
              </>
            ) : layoutFileName ? (
              <>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">✓ {layoutFileName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clique para substituir</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
                  <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                    Arraste o arquivo de layout
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ou clique para selecionar
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-slide-in">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Erro ao carregar arquivo</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

