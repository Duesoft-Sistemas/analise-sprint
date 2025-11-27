import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, X, Folder, Trash2 } from 'lucide-react';
import { parseXLSFile, validateXLSStructure } from '../services/xlsParser';
import { parseWorklogFile, validateWorklogStructure } from '../services/worklogParser';
import { parseSprintsFile, validateSprintsStructure } from '../services/sprintsParser';
import { parseCustosFile, validateCustosStructure } from '../services/custosParser';
import { useSprintStore } from '../store/useSprintStore';

export const XlsUploader: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [isLoadingWorklog, setIsLoadingWorklog] = useState(false);
  const [isLoadingSprints, setIsLoadingSprints] = useState(false);
  const [isLoadingCustos, setIsLoadingCustos] = useState(false);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const [layoutFileName, setLayoutFileName] = useState<string | null>(null);
  const [worklogFileName, setWorklogFileName] = useState<string | null>(null);
  const [sprintsFileName, setSprintsFileName] = useState<string | null>(null);
  const [custosFileName, setCustosFileName] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  
  const setTasks = useSprintStore((state) => state.setTasks);
  const addTasks = useSprintStore((state) => state.addTasks);
  const removeTasksByFileName = useSprintStore((state) => state.removeTasksByFileName);
  const setWorklogs = useSprintStore((state) => state.setWorklogs);
  const addWorklogs = useSprintStore((state) => state.addWorklogs);
  const removeWorklogsByFileName = useSprintStore((state) => state.removeWorklogsByFileName);
  const addSprintMetadata = useSprintStore((state) => state.addSprintMetadata);
  const removeSprintMetadataByFileName = useSprintStore((state) => state.removeSprintMetadataByFileName);
  const addCostData = useSprintStore((state) => state.addCostData);
  const setCostData = useSprintStore((state) => state.setCostData);
  const removeCostDataByFileName = useSprintStore((state) => state.removeCostDataByFileName);
  const clearData = useSprintStore((state) => state.clearData);
  // Usar os nomes dos arquivos do store quando disponível - FONTE ÚNICA DE VERDADE
  const storeLayoutFileNames = useSprintStore((state) => state.layoutFileNames);
  const storeWorklogFileNames = useSprintStore((state) => state.worklogFileNames);
  const storeCustosFileNames = useSprintStore((state) => state.custosFileNames);

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
        // Sempre adicionar, pois o store evita duplicatas por nome de sprint
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

  const handleCustosFile = useCallback(
    async (file: File) => {
      console.log('💰 Iniciando upload de custos:', file.name);
      
      const isValidFile = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (!isValidFile) {
        setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
        return;
      }

      setIsLoadingCustos(true);
      setError(null);
      // Validate headers before parsing
      const isValidStructure = await validateCustosStructure(file);
      if (!isValidStructure) {
        setIsLoadingCustos(false);
        setError('Estrutura inválida no arquivo de custos. Verifique as colunas obrigatórias: Responsável, Salário.');
        return;
      }

      const result = await parseCustosFile(file);
      console.log('💰 Resultado do parse de custos:', result);

      if (result.success && result.data) {
        console.log(`✅ Custos carregados com sucesso: ${result.data.length} responsáveis`);
        const currentCostData = useSprintStore.getState().costData;
        const currentCustosFileNames = useSprintStore.getState().custosFileNames;
        const hasExisting = currentCostData.length > 0 || currentCustosFileNames.length > 0;
        
        if (hasExisting) {
          addCostData(result.data, file.name);
        } else {
          setCostData(result.data, file.name);
        }
        setCustosFileName(file.name);
        setError(null);
      } else {
        console.error('❌ Erro ao processar custos:', result.error);
        setError(result.error || 'Erro ao processar o arquivo de custos');
      }

      setIsLoadingCustos(false);
    },
    [addCostData, setCostData]
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
        // Validar sprints contra a planilha de sprints carregada
        const sprintMetadata = useSprintStore.getState().sprintMetadata;
        if (sprintMetadata.length > 0) {
          const invalidSprints = new Set<string>();
          result.data.forEach(task => {
            if (task.sprint && task.sprint.trim() !== '') {
              const sprintExists = sprintMetadata.some(m => m.sprint === task.sprint);
              if (!sprintExists) {
                invalidSprints.add(task.sprint);
              }
            }
          });
          
          if (invalidSprints.size > 0) {
            console.warn(`⚠️ Aviso: ${invalidSprints.size} sprint(s) não encontrado(s) na planilha de sprints:`, Array.from(invalidSprints));
            // Não bloquear a importação, apenas avisar
          }
        }
        
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
      const custosFile = fileArray.find(f => {
        const path = (f as any).webkitRelativePath || '';
        const isInRoot = !path.includes('/') && !path.includes('\\');
        const isCustosFile = f.name.toLowerCase() === 'custos.xlsx' || f.name.toLowerCase() === 'custos.xls';
        return isInRoot && isCustosFile;
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
        } catch (err) {
          errors.push(`Erro ao processar data.xlsx: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      } else {
        errors.push('Arquivo data.xlsx não encontrado na pasta selecionada.');
      }

      // Processar work.xlsx (worklog) - obrigatório
      if (workFile) {
        try {
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
        } catch (err) {
          errors.push(`Erro ao processar work.xlsx: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      } else {
        errors.push('Arquivo work.xlsx não encontrado na pasta selecionada.');
      }

      // Processar custos.xlsx (custos) - opcional
      if (custosFile) {
        try {
          const isValidStructure = await validateCustosStructure(custosFile);
          if (isValidStructure) {
            const result = await parseCustosFile(custosFile);
            if (result.success && result.data) {
              const currentCostData = useSprintStore.getState().costData;
              const currentCustosFileNames = useSprintStore.getState().custosFileNames;
              const hasExisting = currentCostData.length > 0 || currentCustosFileNames.length > 0;
              
              if (hasExisting) {
                addCostData(result.data, custosFile.name);
              } else {
                setCostData(result.data, custosFile.name);
              }
              setCustosFileName(custosFile.name);
            } else {
              errors.push(`Erro ao processar custos.xlsx: ${result.error || 'Erro desconhecido'}`);
            }
          } else {
            errors.push('Estrutura inválida no arquivo custos.xlsx. Verifique as colunas obrigatórias: Responsável, Salário.');
          }
        } catch (err) {
          errors.push(`Erro ao processar custos.xlsx: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      }
      // Nota: custos.xlsx é opcional, então não adicionamos erro se não for encontrado

      // Processar arquivos da pasta sprint/
      if (sprintFiles.length > 0) {
        let firstLayoutFile: string | null = null;
        let successCount = 0;
        for (const file of sprintFiles) {
          try {
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
    [addSprintMetadata, setSprintsFileName, addWorklogs, setWorklogs, addCostData, setCostData, addTasks, setTasks]
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

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  const handleClearAll = useCallback(() => {
    // Limpar todos os dados do store
    clearData();
    // Limpar estados locais do componente
    setLayoutFileName(null);
    setWorklogFileName(null);
    setSprintsFileName(null);
    setCustosFileName(null);
    setFolderPath(null);
    setError(null);
    // Resetar input de pasta
    const folderInput = document.getElementById('folder-input') as HTMLInputElement;
    if (folderInput) folderInput.value = '';
  }, [clearData]);

  return (
    <section className="w-full">
      <div className="w-full space-y-6 px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">Importador inteligente</p>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mt-1">Upload de Arquivos</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Selecione a pasta completa e o sistema importa automaticamente todos os arquivos necessários.
          </p>
        </div>

        {/* Folder Import Section */}
        <div className="rounded-2xl border border-orange-100 dark:border-orange-900/40 bg-white/80 dark:bg-gray-900/40 shadow-sm ring-1 ring-orange-500/10">
          <button
            type="button"
            className={`
              w-full flex flex-col md:flex-row items-center md:items-start gap-4 text-left px-4 sm:px-6 py-5 transition-all
              ${isLoadingFolder ? 'opacity-60 cursor-not-allowed' : 'hover:bg-orange-50/70 dark:hover:bg-orange-900/10'}
            `}
            onClick={isLoadingFolder ? undefined : handleFolderButtonClick}
          >
            <input
              id="folder-input"
              ref={folderInputRef}
              type="file"
              multiple
              onChange={handleFolderInput}
              className="hidden"
            />

            <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/60 dark:to-orange-800/40 text-orange-700 dark:text-orange-200 flex-shrink-0">
              {isLoadingFolder ? (
                <div className="animate-spin rounded-full h-7 w-7 border-3 border-orange-500 border-t-transparent"></div>
              ) : (
                <Folder className="w-7 h-7" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Importar pasta completa</span>
                {folderPath && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    {folderPath}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seleciona automaticamente `data.xlsx`, `work.xlsx` e todos os arquivos de `sprint/`.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex flex-col border border-dashed border-orange-200 dark:border-orange-800 rounded-lg p-2 bg-orange-50/50 dark:bg-orange-900/10">
                  <span className="font-semibold text-orange-700 dark:text-orange-200">data.xlsx</span>
                  <span>Sprints (Sprint, Data Início, Data Fim)</span>
                </div>
                <div className="flex flex-col border border-dashed border-orange-200 dark:border-orange-800 rounded-lg p-2 bg-orange-50/50 dark:bg-orange-900/10">
                  <span className="font-semibold text-orange-700 dark:text-orange-200">work.xlsx</span>
                  <span>Worklog obrigatório</span>
                </div>
                <div className="flex flex-col border border-dashed border-orange-200 dark:border-orange-800 rounded-lg p-2 bg-orange-50/50 dark:bg-orange-900/10">
                  <span className="font-semibold text-orange-700 dark:text-orange-200">sprint/</span>
                  <span>Arquivos de tarefas (.xls[x])</span>
                </div>
                <div className="flex flex-col border border-dashed border-orange-200 dark:border-orange-800 rounded-lg p-2 bg-orange-50/50 dark:bg-orange-900/10">
                  <span className="font-semibold text-orange-700 dark:text-orange-200">custos.xlsx</span>
                  <span>Opcional: Custos</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Clear All Button */}
        {folderPath && (
          <div className="flex justify-center">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 transition-all duration-200 font-medium text-sm"
              title="Limpar todos os arquivos carregados"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Todos os Arquivos
            </button>
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
    </section>
  );
};

