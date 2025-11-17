# Configuração e Análise Híbrida

Especificação técnica do sistema de configuração de sprints e análise híbrida com worklog.

## Configuração de Sprints

Sistema requer configuração de períodos de sprints para análise híbrida precisa com múltiplos sprints.

### Estrutura da Planilha de Sprints

Arquivo Excel (`sprints.xlsx`) com 3 colunas obrigatórias:

| Sprint | Data Início | Data Fim |
|--------|-------------|----------|
| OUT25 - Semana 4 | 28/10/2025 | 01/11/2025 |
| NOV25 - Semana 1 | 04/11/2025 | 08/11/2025 |
| NOV25 - Semana 2 | 11/11/2025 | 15/11/2025 |

### Reconhecimento de Colunas

Sistema reconhece automaticamente as seguintes variações de nomes de colunas:

**Coluna Sprint:**
- `Sprint`, `sprint`, `Nome do Sprint`, `Sprint Name`, `ID`

**Coluna Data Início:**
- `Data Início`, `Data Inicio`, `Data início`, `Data inicio`, `Start Date`, `Data Inicial`, `Data inicial`, `Início`, `Inicio`

**Coluna Data Fim:**
- `Data Fim`, `Data fim`, `End Date`, `Data Final`, `Data final`, `Fim`

### Formatos de Data Aceitos

- DD/MM/YYYY: `28/10/2025`
- YYYY-MM-DD: `2025-10-28`
- DD-MM-YYYY: `28-10-2025`

### Regras de Validação

- Nome do sprint na planilha deve corresponder exatamente ao nome no layout.xlsx
- Períodos de sprints não devem se sobrepor
- Primeira linha do arquivo deve conter os cabeçalhos
- Datas devem estar em formato válido

## Análise Híbrida com Worklog

Sistema utiliza worklog para calcular tempo gasto com precisão, separando tempo por sprint para tarefas que atravessam múltiplos sprints.

### REGRA FUNDAMENTAL

**O tempo gasto nos cálculos SEMPRE vem do worklog, NUNCA da planilha de sprint.**

**Campos utilizados (calculados do worklog):**
- `tempoGastoTotal`: Tempo total acumulado em todos os sprints
- `tempoGastoNoSprint`: Tempo gasto apenas no sprint atual
- `tempoGastoOutrosSprints`: Tempo gasto em sprints anteriores

**Campo NUNCA utilizado em cálculos:**
- `tempoGasto`: Campo da planilha de sprint (deprecated)

**Comportamento:** Se não houver worklog, o tempo gasto é 0 (zero), independente do valor na planilha.

### Estrutura de Campos Híbridos

O sistema calcula os seguintes campos para cada tarefa:

- `estimativa`: Estimativa original (nunca muda)
- `estimativaRestante`: Estimativa original - tempo gasto em outros sprints (min 0)
- `tempoGastoNoSprint`: Soma de worklogs cuja data está dentro do período do sprint atual
- `tempoGastoOutrosSprints`: Soma de worklogs cuja data está fora do período do sprint atual
- `tempoGastoTotal`: `tempoGastoNoSprint + tempoGastoOutrosSprints`

### Visões de Análise

Sistema mantém duas visões separadas:

**1. Capacidade do Sprint Atual (planejamento)**
- Campo utilizado: `estimativaRestante`
- Campo utilizado: `tempoGastoNoSprint`
- Uso: Alocação de desenvolvedor, cálculo de horas disponíveis

**2. Performance Histórica (avaliação)**
- Campo utilizado: `estimativa`
- Campo utilizado: `tempoGastoTotal`
- Uso: Cálculo de eficiência, acurácia, performance score

### Estrutura do Arquivo Worklog

Arquivo Excel com 3 colunas obrigatórias:

| Coluna | Obrigatório | Tipo | Exemplo |
|--------|------------|------|---------|
| ID da tarefa | Sim | String | PROJ-101 |
| Tempo gasto | Sim | Number/String | 2h ou 7200 |
| Data | Sim | Date | 2025-10-15 |

**Variações de nomes de colunas aceitas:**

**ID da tarefa:**
- `ID da tarefa`, `Task ID`, `Chave`, `Chave da item`, `Issue Key`, `Issue`

**Tempo gasto:**
- `Tempo gasto`, `Time Spent`, `Time spent`, `Hours`, `Horas`, `Duration`

**Data:**
- `Data`, `Date`, `Data de registro`, `Log Date`, `Started`

### Formato de Dados Worklog

**ID da tarefa:**
- Aceita chave completa (ex: PROJ-101) ou ID numérico (ex: 101)
- Deve corresponder ao campo "Chave da item" ou "ID da item" do layout.xlsx

**Tempo gasto:**
- Aceita formato texto: `2h`, `2h 30m`, `45m`, `0.5h`
- Aceita número: interpretado como segundos (ex: 7200 = 2h)
- Aceita decimal sem sufixo: interpretado como segundos

**Data:**
- Aceita formato ISO: `2025-10-15`
- Aceita formato BR: `15/10/2025`
- Aceita formato com hora: `2025-10-15 14:30:00`

### Processamento de Worklog

**Algoritmo de cálculo híbrido:**

1. Para cada tarefa no layout.xlsx:
   - Buscar worklogs correspondentes (match por ID ou chave)
   - Se não houver worklogs: `tempoGastoTotal = 0`, `tempoGastoNoSprint = 0`, `tempoGastoOutrosSprints = 0`, `estimativaRestante = estimativa`

2. Se houver worklogs:
   - Filtrar worklogs por data do sprint atual (se período definido)
   - `tempoGastoNoSprint` = soma de worklogs dentro do período do sprint atual
   - `tempoGastoOutrosSprints` = soma de worklogs fora do período do sprint atual
   - `tempoGastoTotal` = `tempoGastoNoSprint + tempoGastoOutrosSprints`
   - `estimativaRestante` = `max(0, estimativa - tempoGastoOutrosSprints)`

3. Se período do sprint não definido:
   - Todos os worklogs são considerados do sprint atual
   - `tempoGastoNoSprint = tempoGastoTotal`
   - `tempoGastoOutrosSprints = 0`

### Exemplo de Cálculo Híbrido

**Dados de entrada:**
```
Tarefa: PROJ-101
- Estimativa Original: 15h
- Sprint do Layout: "Sprint 4"
- Worklogs:
  - 2025-10-15: 2h (fora do período Sprint 4)
  - 2025-10-16: 3h (fora do período Sprint 4)
  - 2025-10-22: 5h (dentro do período Sprint 4)
  - 2025-10-23: 5h (dentro do período Sprint 4)

Período Sprint 4: 2025-10-21 a 2025-10-27
```

**Cálculo:**
```
tempoGastoOutrosSprints = 2h + 3h = 5h
tempoGastoNoSprint = 5h + 5h = 10h
tempoGastoTotal = 5h + 10h = 15h
estimativaRestante = max(0, 15h - 5h) = 10h
```

**Resultado para métricas:**
- Alocação (sprint atual): `estimativaRestante = 10h`
- Gasto (sprint atual): `tempoGastoNoSprint = 10h`
- Disponível: `40h - 10h = 30h`
- Performance (histórico): `estimativa = 15h`, `tempoGastoTotal = 15h`, Acurácia = 0%

### Comportamento do Sistema

**Arquivos:**
- `layout.xlsx`: Obrigatório
- `worklog.xlsx`: Opcional. Se ausente, `tempoGastoTotal = 0` para todas as tarefas
- `sprints.xlsx`: Opcional. Se ausente, usa semana atual (segunda a sexta) como período padrão

**Período Padrão (quando sprints.xlsx não fornecido):**
- Sistema calcula automaticamente a semana atual
- Início: Segunda-feira (00:00:00)
- Fim: Sexta-feira (23:59:59.999)
- Todos os worklogs são considerados do sprint atual quando período não definido

**Validações:**
- IDs/chaves do worklog devem corresponder ao layout.xlsx (match por ID ou chave completa)
- Nome do sprint na planilha de sprints deve corresponder exatamente ao nome no layout.xlsx (comparação case-sensitive após trim)
- Worklogs com datas inválidas são ignorados (continua processamento de outras linhas)
- Worklogs com tempo gasto ≤ 0 são ignorados
- Linhas vazias no meio dos dados são ignoradas
- Tarefas sem ID nem chave são ignoradas

**Processamento de Datas:**
- Data de início do sprint: 00:00:00 (início do dia)
- Data de fim do sprint: 23:59:59.999 (fim do dia, inclui dia inteiro)
- Worklogs são filtrados por inclusão dentro do intervalo [data início, data fim]

**Tarefas de Backlog (sem sprint):**
- Tarefas sem sprint definido (campo vazio, null ou string vazia após trim) NÃO são processadas para métricas híbridas
- Worklog de tarefas sem sprint é ignorado (não faz match, não processado)
- Tarefas sem sprint são exibidas apenas na análise de backlog (aba multi-sprint)
- Tarefas sem sprint NÃO interferem em métricas de performance
- Horas de backlog são calculadas apenas pela estimativa original (não usa worklog)

## Referências

- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura completa dos arquivos
- [Métricas de Performance](METRICAS_PERFORMANCE.md) - Especificações de cálculo de métricas
