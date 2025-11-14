import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Clock, Calendar, X } from 'lucide-react';
import { parseXLSFile, validateXLSStructure } from '../services/xlsParser';
import { parseWorklogFile, validateWorklogStructure } from '../services/worklogParser';
import { parseSprintsFile, validateSprintsStructure } from '../services/sprintsParser';
import { useSprintStore } from '../store/useSprintStore';

export const XlsUploader: React.FC = () => {
  const [isDraggingLayout, setIsDraggingLayout] = useState(false);
  const [isDraggingWorklog, setIsDraggingWorklog] = useState(false);
  const [isDraggingSprints, setIsDraggingSprints] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [isLoadingWorklog, setIsLoadingWorklog] = useState(false);
  const [isLoadingSprints, setIsLoadingSprints] = useState(false);
  const [layoutFileName, setLayoutFileName] = useState<string | null>(null);
  const [worklogFileName, setWorklogFileName] = useState<string | null>(null);
  const [sprintsFileName, setSprintsFileName] = useState<string | null>(null);
  
  const setTasks = useSprintStore((state) => state.setTasks);
  const addTasks = useSprintStore((state) => state.addTasks);
  const removeTasksByFileName = useSprintStore((state) => state.removeTasksByFileName);
  const setWorklogs = useSprintStore((state) => state.setWorklogs);
  const addWorklogs = useSprintStore((state) => state.addWorklogs);
  const removeWorklogsByFileName = useSprintStore((state) => state.removeWorklogsByFileName);
  const setSprintMetadata = useSprintStore((state) => state.setSprintMetadata);
  const addSprintMetadata = useSprintStore((state) => state.addSprintMetadata);
  const removeSprintMetadataByFileName = useSprintStore((state) => state.removeSprintMetadataByFileName);
  // Usar os nomes dos arquivos do store quando disponível - FONTE ÚNICA DE VERDADE
  const storeLayoutFileNames = useSprintStore((state) => state.layoutFileNames);
  const storeWorklogFileNames = useSprintStore((state) => state.worklogFileNames);

  const handleSprintsFile = useCallback(
    async (file: File) => {
      console.log('📅 Iniciando upload de sprints:', file.name);
      
      const isValidFile = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (!isValidFile) {
        setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
        return;
      }

      setIsLoadingSprints(true);
      setError(null);
      // Validate headers before parsing
      const isValidStructure = await validateSprintsStructure(file);
      if (!isValidStructure) {
        setIsLoadingSprints(false);
        setError('Estrutura inválida no arquivo de sprints. Verifique as colunas obrigatórias: Sprint, Data Início, Data Fim.');
        return;
      }

      const result = await parseSprintsFile(file);
      console.log('📅 Resultado do parse de sprints:', result);

      if (result.success && result.data) {
        console.log(`✅ Sprints carregados com sucesso: ${result.data.length} sprints`);
        // Sempre adicionar, pois addSprintMetadata evita duplicatas por nome de sprint
        // setSprintMetadata só deve ser usado para limpar e substituir tudo
        addSprintMetadata(result.data, file.name);
        setSprintsFileName(file.name);
        setError(null);
      } else {
        console.error('❌ Erro ao processar sprints:', result.error);
        setError(result.error || 'Erro ao processar o arquivo de sprints');
      }

      setIsLoadingSprints(false);
    },
    [setSprintMetadata]
  );

  const handleLayoutFile = useCallback(
    async (file: File) => {
      const isValidFile = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (!isValidFile) {
        setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
        return;
      }

      setIsLoadingLayout(true);
      setError(null);
      // Validate headers before parsing
      const isValidStructure = await validateXLSStructure(file);
      if (!isValidStructure) {
        setIsLoadingLayout(false);
        setError('Estrutura inválida no arquivo de layout. Verifique as colunas obrigatórias: Chave, Resumo, Tempo gasto, Sprint, Estimativa original, Status.');
        return;
      }

      const result = await parseXLSFile(file);

      if (result.success && result.data) {
        // Verificar diretamente no store se já existem tarefas ou arquivos carregados
        // IMPORTANTE: Buscar o estado atualizado do store dentro da função para evitar race conditions
        const currentTasks = useSprintStore.getState().tasks;
        const currentLayoutFileNames = useSprintStore.getState().layoutFileNames;
        const hasExisting = currentTasks.length > 0 || currentLayoutFileNames.length > 0;
        
        if (hasExisting) {
          addTasks(result.data, file.name);
        } else {
          setTasks(result.data, file.name);
        }
        // Não precisa setar layoutFileName aqui, pois o store já gerencia através de layoutFileNames
        // e layoutFileName é atualizado automaticamente pelo store
        setError(null);
      } else {
        setError(result.error || 'Erro ao processar o arquivo de layout');
      }

      setIsLoadingLayout(false);
    },
    [setTasks, addTasks]
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
      // Validate headers before parsing
      const isValidStructure = await validateWorklogStructure(file);
      if (!isValidStructure) {
        setIsLoadingWorklog(false);
        setError('Estrutura inválida no arquivo de worklog. Verifique as colunas obrigatórias: ID da tarefa, Tempo gasto, Data.');
        return;
      }

      const result = await parseWorklogFile(file);

      if (result.success && result.data) {
        // Verificar diretamente no store se já existem worklogs ou arquivos carregados
        // IMPORTANTE: Buscar o estado atualizado do store dentro da função para evitar race conditions
        const currentWorklogs = useSprintStore.getState().worklogs;
        const currentWorklogFileNames = useSprintStore.getState().worklogFileNames;
        const hasExisting = currentWorklogs.length > 0 || currentWorklogFileNames.length > 0;
        
        if (hasExisting) {
          addWorklogs(result.data, file.name);
        } else {
          setWorklogs(result.data, file.name);
        }
        // Não precisa setar worklogFileName aqui, pois o store já gerencia através de worklogFileNames
        // e worklogFileName é atualizado automaticamente pelo store
        setError(null);
      } else {
        setError(result.error || 'Erro ao processar o arquivo de worklog');
      }

      setIsLoadingWorklog(false);
    },
    [setWorklogs, addWorklogs]
  );

  // Sprints file handlers
  const handleSprintsDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingSprints(false);

      const files = e.dataTransfer.files;
      if (files) {
        // Processar arquivos sequencialmente para evitar race condition
        for (const file of Array.from(files)) {
          await handleSprintsFile(file);
        }
      }
    },
    [handleSprintsFile]
  );

  const handleSprintsDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSprints(true);
  }, []);

  const handleSprintsDragLeave = useCallback(() => {
    setIsDraggingSprints(false);
  }, []);

  const handleSprintsFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        Array.from(files).forEach(file => {
          handleSprintsFile(file);
        });
      }
      // Reset input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    },
    [handleSprintsFile]
  );

  // Layout file handlers
  const handleLayoutDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingLayout(false);

      const files = e.dataTransfer.files;
      if (files) {
        // Processar arquivos sequencialmente para evitar race condition
        for (const file of Array.from(files)) {
          await handleLayoutFile(file);
        }
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
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        // Processar arquivos sequencialmente para evitar race condition
        for (const file of Array.from(files)) {
          await handleLayoutFile(file);
        }
      }
      // Reset input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    },
    [handleLayoutFile]
  );

  // Worklog file handlers
  const handleWorklogDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingWorklog(false);

      const files = e.dataTransfer.files;
      if (files) {
        // Processar arquivos sequencialmente para evitar race condition
        for (const file of Array.from(files)) {
          await handleWorklogFile(file);
        }
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
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        // Processar arquivos sequencialmente para evitar race condition
        for (const file of Array.from(files)) {
          await handleWorklogFile(file);
        }
      }
      // Reset input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    },
    [handleWorklogFile]
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Upload de Arquivos</h2>
      </div>

      {/* Sprints Configuration File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          1. Configuração de Sprints (Obrigatório)
        </label>
        <div
          className={`
            border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300
            ${isDraggingSprints 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }
            ${isLoadingSprints ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg'}
          `}
          onDrop={handleSprintsDrop}
          onDragOver={handleSprintsDragOver}
          onDragLeave={handleSprintsDragLeave}
          onClick={() => document.getElementById('sprints-file-input')?.click()}
        >
          <input
            id="sprints-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleSprintsFileInput}
            multiple
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            {isLoadingSprints ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-gray-600 dark:text-gray-400">Processando sprints...</p>
              </>
            ) : sprintsFileName ? (
              <>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">✓ Arquivo(s) carregado(s):</p>
                  <div className="space-y-1">
                    {(sprintsFileName ? [sprintsFileName] : []).map((fileName) => (
                      <div key={fileName} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-xs text-gray-600 dark:text-gray-300">{fileName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSprintMetadataByFileName(fileName);
                            if (fileName === sprintsFileName) {
                              setSprintsFileName(null);
                            }
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Remover arquivo"
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Clique para adicionar mais arquivos</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
                  <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                    Arraste o arquivo de sprints
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ou clique para selecionar
                  </p>
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Colunas obrigatórias:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      Sprint | Data Início | Data Fim
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Worklog File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          2. Worklog (Opcional - análise detalhada)
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
            multiple
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            {isLoadingWorklog ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
                <p className="text-gray-600 dark:text-gray-400">Processando worklog...</p>
              </>
            ) : (worklogFileName || storeWorklogFileNames.length > 0) ? (
              <>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">✓ Arquivo(s) carregado(s):</p>
                  <div className="space-y-1">
                    {[...(worklogFileName ? [worklogFileName] : []), ...storeWorklogFileNames].filter((v, i, a) => a.indexOf(v) === i).map((fileName) => (
                      <div key={fileName} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-xs text-gray-600 dark:text-gray-300">{fileName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWorklogsByFileName(fileName);
                            if (fileName === worklogFileName) {
                              setWorklogFileName(null);
                            }
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Remover arquivo"
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Clique para adicionar mais arquivos</p>
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
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Colunas obrigatórias:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      ID da tarefa | Tempo gasto | Data
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Layout File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          3. Layout do Sprint (Obrigatório - tarefas)
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
            multiple
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            {isLoadingLayout ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-gray-600 dark:text-gray-400">Processando layout...</p>
              </>
            ) : (layoutFileName || storeLayoutFileNames.length > 0) ? (
              <>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">✓ Arquivo(s) carregado(s):</p>
                  <div className="space-y-1">
                    {[...(layoutFileName ? [layoutFileName] : []), ...storeLayoutFileNames].filter((v, i, a) => a.indexOf(v) === i).map((fileName) => (
                      <div key={fileName} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-xs text-gray-600 dark:text-gray-300">{fileName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTasksByFileName(fileName);
                            if (fileName === layoutFileName) {
                              setLayoutFileName(null);
                            }
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Remover arquivo"
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Clique para adicionar mais arquivos</p>
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
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Colunas obrigatórias:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      Chave | Resumo | Tempo gasto | Sprint | Estimativa | Status
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {sprintsFileName && !error && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3 animate-slide-in">
          <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-300 flex-shrink-0" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              ✅ Sprints carregados com sucesso!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Arquivo: {sprintsFileName}
            </p>
          </div>
        </div>
      )}

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

