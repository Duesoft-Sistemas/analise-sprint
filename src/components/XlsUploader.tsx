import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Clock, Calendar, X, Folder } from 'lucide-react';
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
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const [layoutFileName, setLayoutFileName] = useState<string | null>(null);
  const [worklogFileName, setWorklogFileName] = useState<string | null>(null);
  const [sprintsFileName, setSprintsFileName] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<string | null>(null);
  
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
    [addSprintMetadata]
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

  // Folder import handler
  const handleFolderImport = useCallback(
    async (files: FileList | File[]) => {
      setIsLoadingFolder(true);
      setError(null);

      const fileArray = Array.from(files);
      
      // Organizar arquivos por tipo
      // Procurar data.xlsx e work.xlsx apenas na raiz (não dentro de subpastas)
      const dataFile = fileArray.find(f => {
        const path = (f as any).webkitRelativePath || '';
        const isInRoot = !path.includes('/') && !path.includes('\\');
        const isDataFile = f.name.toLowerCase() === 'data.xlsx' || f.name.toLowerCase() === 'data.xls';
        return isInRoot && isDataFile;
      });
      const workFile = fileArray.find(f => {
        const path = (f as any).webkitRelativePath || '';
        const isInRoot = !path.includes('/') && !path.includes('\\');
        const isWorkFile = f.name.toLowerCase() === 'work.xlsx' || f.name.toLowerCase() === 'work.xls';
        return isInRoot && isWorkFile;
      });
      
      // Encontrar arquivos dentro da pasta sprint/ (caminho relativo contém 'sprint/')
      const sprintFiles = fileArray.filter(f => {
        // Verificar se o arquivo está dentro de uma pasta chamada 'sprint'
        const path = (f as any).webkitRelativePath || '';
        // Verificar se o caminho contém 'sprint/' ou 'sprint\\' e não é o arquivo data.xlsx ou work.xlsx
        const isInSprintFolder = path.toLowerCase().includes('sprint/') || 
                                  path.toLowerCase().includes('sprint\\');
        const isExcelFile = f.name.endsWith('.xlsx') || f.name.endsWith('.xls');
        const isNotDataOrWork = !['data.xlsx', 'data.xls', 'work.xlsx', 'work.xls'].includes(f.name.toLowerCase());
        return isInSprintFolder && isExcelFile && isNotDataOrWork;
      });

      const errors: string[] = [];

      // Processar data.xlsx (sprints)
      if (dataFile) {
        try {
          // Verificar se o arquivo é válido antes de processar
          if (!(dataFile instanceof File) && !(dataFile instanceof Blob)) {
            errors.push(`Erro: data.xlsx não é um arquivo válido.`);
          } else {
            const isValidStructure = await validateSprintsStructure(dataFile);
            if (isValidStructure) {
              const result = await parseSprintsFile(dataFile);
              if (result.success && result.data) {
                addSprintMetadata(result.data, dataFile.name);
                setSprintsFileName(dataFile.name);
              } else {
                errors.push(`Erro ao processar data.xlsx: ${result.error || 'Erro desconhecido'}`);
              }
            } else {
              errors.push('Estrutura inválida no arquivo data.xlsx. Verifique as colunas obrigatórias: Sprint, Data Início, Data Fim.');
            }
          }
        } catch (err) {
          errors.push(`Erro ao processar data.xlsx: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      } else {
        errors.push('Arquivo data.xlsx não encontrado na pasta selecionada.');
      }

      // Processar work.xlsx (worklog) - obrigatório
      if (workFile) {
        try {
          // Verificar se o arquivo é válido antes de processar
          if (!(workFile instanceof File) && !(workFile instanceof Blob)) {
            errors.push(`Erro: work.xlsx não é um arquivo válido.`);
          } else {
            const isValidStructure = await validateWorklogStructure(workFile);
            if (isValidStructure) {
              const result = await parseWorklogFile(workFile);
              if (result.success && result.data) {
                const currentWorklogs = useSprintStore.getState().worklogs;
                const currentWorklogFileNames = useSprintStore.getState().worklogFileNames;
                const hasExisting = currentWorklogs.length > 0 || currentWorklogFileNames.length > 0;
                
                if (hasExisting) {
                  addWorklogs(result.data, workFile.name);
                } else {
                  setWorklogs(result.data, workFile.name);
                }
                // Atualizar o estado do card para mostrar o arquivo carregado
                setWorklogFileName(workFile.name);
              } else {
                errors.push(`Erro ao processar work.xlsx: ${result.error || 'Erro desconhecido'}`);
              }
            } else {
              errors.push('Estrutura inválida no arquivo work.xlsx. Verifique as colunas obrigatórias: ID da tarefa, Tempo gasto, Data.');
            }
          }
        } catch (err) {
          errors.push(`Erro ao processar work.xlsx: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      } else {
        errors.push('Arquivo work.xlsx não encontrado na pasta selecionada.');
      }

      // Processar arquivos da pasta sprint/
      if (sprintFiles.length > 0) {
        let firstLayoutFile: string | null = null;
        let successCount = 0;
        for (const file of sprintFiles) {
          try {
            // Verificar se o arquivo é válido antes de processar
            if (!(file instanceof File) && !(file instanceof Blob)) {
              errors.push(`Erro: ${file.name} não é um arquivo válido.`);
              continue;
            }
            const isValidStructure = await validateXLSStructure(file);
            if (isValidStructure) {
              const result = await parseXLSFile(file);
              if (result.success && result.data) {
                const currentTasks = useSprintStore.getState().tasks;
                const currentLayoutFileNames = useSprintStore.getState().layoutFileNames;
                const hasExisting = currentTasks.length > 0 || currentLayoutFileNames.length > 0;
                
                if (hasExisting) {
                  addTasks(result.data, file.name);
                } else {
                  setTasks(result.data, file.name);
                }
                // Guardar o primeiro arquivo para atualizar o estado do card
                if (!firstLayoutFile) {
                  firstLayoutFile = file.name;
                }
                successCount++;
              } else {
                errors.push(`Erro ao processar ${file.name}: ${result.error || 'Erro desconhecido'}`);
              }
            } else {
              errors.push(`Estrutura inválida no arquivo ${file.name}. Verifique as colunas obrigatórias.`);
            }
          } catch (err) {
            errors.push(`Erro ao processar ${file.name}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          }
        }
        // Atualizar o estado do card para mostrar que arquivos foram carregados
        // Se não houver layoutFileName definido, usar o primeiro arquivo processado
        if (firstLayoutFile) {
          setLayoutFileName(firstLayoutFile);
        }
        if (successCount === 0 && sprintFiles.length > 0) {
          errors.push('Nenhum arquivo da pasta sprint/ foi processado com sucesso.');
        }
      } else {
        errors.push('Nenhum arquivo Excel encontrado na pasta sprint/.');
      }

      if (errors.length > 0) {
        setError(errors.join(' '));
      } else {
        setError(null);
      }

      setIsLoadingFolder(false);
    },
    [addSprintMetadata, setSprintsFileName, addWorklogs, setWorklogs, addTasks, setTasks]
  );

  const handleFolderInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        // Obter o caminho da pasta (primeiro arquivo)
        const firstFile = files[0];
        const path = (firstFile as any).webkitRelativePath || '';
        const folderName = path.split('/')[0] || path.split('\\')[0] || 'Pasta selecionada';
        setFolderPath(folderName);
        await handleFolderImport(files);
      }
      e.target.value = '';
    },
    [handleFolderImport]
  );

  const handleFolderButtonClick = useCallback(() => {
    // Tentar usar File System Access API se disponível
    if ('showDirectoryPicker' in window) {
      (window as any).showDirectoryPicker().then(async (dirHandle: any) => {
        setFolderPath(dirHandle.name);
        setIsLoadingFolder(true);
        setError(null);

        const files: File[] = [];
        
        // Função recursiva para ler arquivos
        const readDirectory = async (dir: any, path = '') => {
          for await (const entry of dir.values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              // Verificar se o arquivo é válido
              if (!(file instanceof File)) {
                console.warn(`Arquivo inválido: ${entry.name}`);
                continue;
              }
              // Adicionar caminho relativo ao arquivo usando defineProperty para não quebrar instanceof
              const relativePath = path ? `${path}/${file.name}` : file.name;
              Object.defineProperty(file, 'webkitRelativePath', {
                value: relativePath,
                writable: false,
                enumerable: true,
                configurable: true
              });
              files.push(file);
            } else if (entry.kind === 'directory') {
              // entry já é um FileSystemDirectoryHandle, usar diretamente
              await readDirectory(entry, path ? `${path}/${entry.name}` : entry.name);
            }
          }
        };

        try {
          await readDirectory(dirHandle);
          await handleFolderImport(files);
        } catch (err) {
          setError(`Erro ao ler pasta: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          setIsLoadingFolder(false);
        }
      }).catch((err: any) => {
        // Usuário cancelou ou erro
        if (err.name !== 'AbortError') {
          setError(`Erro ao selecionar pasta: ${err.message || 'Erro desconhecido'}`);
        }
      });
    } else {
      // Fallback: usar input com webkitdirectory
      document.getElementById('folder-input')?.click();
    }
  }, [handleFolderImport]);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Upload de Arquivos</h2>
      </div>

      {/* Folder Import Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📁 Importar de Pasta (Estrutura Completa)
        </label>
        <div
          className={`
            border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300
            ${isLoadingFolder 
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
              : 'border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800'
            }
            ${isLoadingFolder ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg'}
          `}
          onClick={handleFolderButtonClick}
        >
          <input
            id="folder-input"
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            {isLoadingFolder ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processando pasta...</p>
              </>
            ) : folderPath ? (
              <>
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <Folder className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">✓ Pasta importada:</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded">
                    {folderPath}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clique para selecionar outra pasta</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg">
                  <Folder className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Clique para selecionar uma pasta
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Importa todos os arquivos da estrutura esperada
                  </p>
                  <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-left">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">📋 Estrutura necessária:</p>
                    <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">data.xlsx</span>
                        <span className="flex-1">→ Sprints (Sprint | Data Início | Data Fim)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">work.xlsx</span>
                        <span className="flex-1">→ Worklog obrigatório (ID tarefa | Tempo | Data)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">sprint/</span>
                        <span className="flex-1">→ Pasta com tarefas (.xlsx/.xls)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Individual File Uploads - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sprints Configuration File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            1. Sprints (Obrigatório)
          </label>
          <div
            className={`
              border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 h-full
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

          <div className="flex flex-col items-center gap-2">
            {isLoadingSprints ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processando...</p>
              </>
            ) : sprintsFileName ? (
              <>
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">✓ Carregado:</p>
                  <div className="space-y-1">
                    {(sprintsFileName ? [sprintsFileName] : []).map((fileName) => (
                      <div key={fileName} className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{fileName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSprintMetadataByFileName(fileName);
                            if (fileName === sprintsFileName) {
                              setSprintsFileName(null);
                            }
                          }}
                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors ml-1"
                          title="Remover arquivo"
                        >
                          <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Arraste ou clique
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Sprint | Data Início | Data Fim
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        </div>

        {/* Worklog File Upload */}
        <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          2. Worklog (Obrigatório)
        </label>
        <div
          className={`
            border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 h-full
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

          <div className="flex flex-col items-center gap-2">
            {isLoadingWorklog ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processando...</p>
              </>
            ) : (worklogFileName || storeWorklogFileNames.length > 0) ? (
              <>
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">✓ Carregado:</p>
                  <div className="space-y-1">
                    {[...(worklogFileName ? [worklogFileName] : []), ...storeWorklogFileNames].filter((v, i, a) => a.indexOf(v) === i).map((fileName) => (
                      <div key={fileName} className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{fileName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWorklogsByFileName(fileName);
                            if (fileName === worklogFileName) {
                              setWorklogFileName(null);
                            }
                          }}
                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors ml-1"
                          title="Remover arquivo"
                        >
                          <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Arraste ou clique
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ID tarefa | Tempo | Data
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
          3. Tarefas (Obrigatório)
        </label>
        <div
          className={`
            border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 h-full
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

          <div className="flex flex-col items-center gap-2">
            {isLoadingLayout ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processando...</p>
              </>
            ) : (layoutFileName || storeLayoutFileNames.length > 0) ? (
              <>
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">✓ Carregado:</p>
                  <div className="space-y-1">
                    {[...(layoutFileName ? [layoutFileName] : []), ...storeLayoutFileNames].filter((v, i, a) => a.indexOf(v) === i).map((fileName) => (
                      <div key={fileName} className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{fileName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTasksByFileName(fileName);
                            if (fileName === layoutFileName) {
                              setLayoutFileName(null);
                            }
                          }}
                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors ml-1"
                          title="Remover arquivo"
                        >
                          <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                  <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Arraste ou clique
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Chave | Resumo | Tempo | Sprint
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Success Messages */}
      {!error && (sprintsFileName || worklogFileName || layoutFileName || storeLayoutFileNames.length > 0 || storeWorklogFileNames.length > 0) && (
        <div className="space-y-2">
          {sprintsFileName && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-full">
                <Calendar className="w-4 h-4 text-green-600 dark:text-green-300 flex-shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Sprints carregados
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 truncate">
                  {sprintsFileName}
                </p>
              </div>
            </div>
          )}
          {(worklogFileName || storeWorklogFileNames.length > 0) && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-full">
                <Clock className="w-4 h-4 text-green-600 dark:text-green-300 flex-shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Worklog carregado
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  {[...(worklogFileName ? [worklogFileName] : []), ...storeWorklogFileNames].filter((v, i, a) => a.indexOf(v) === i).length} arquivo(s)
                </p>
              </div>
            </div>
          )}
          {(layoutFileName || storeLayoutFileNames.length > 0) && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-full">
                <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-300 flex-shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Tarefas carregadas
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  {[...(layoutFileName ? [layoutFileName] : []), ...storeLayoutFileNames].filter((v, i, a) => a.indexOf(v) === i).length} arquivo(s)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 animate-slide-in">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-red-800 dark:text-red-300">Erro ao carregar arquivo</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 break-words">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
            title="Fechar erro"
          >
            <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </button>
        </div>
      )}
    </div>
  );
};

