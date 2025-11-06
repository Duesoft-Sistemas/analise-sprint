# Formato dos Dados

Especificação técnica do formato necessário para os arquivos de dados do Sprint Analysis Dashboard.

## Arquivo de Layout (Obrigatório)

Arquivo Excel (.xlsx ou .xls) contendo as tarefas do sprint. Deve ser exportado do Jira/Azure DevOps.

### Colunas Obrigatórias

| Coluna | Tipo | Descrição | Exemplo | Variações Aceitas |
|--------|------|-----------|---------|-------------------|
| Tipo de item | String | Tipo da tarefa | Bug, Tarefa, História, Outro | "Tipo de item", "Tipo" (fallback para detecção por conteúdo se coluna ausente) |
| Chave da item | String | Identificador único da tarefa | PROJ-101, DM-2018 | "Chave da item" |
| ID da item | String/Number | ID numérico da tarefa | 12345 | "ID da item" |
| Resumo | String | Descrição da tarefa | Implementar API de login | "Resumo" |
| Tempo gasto | Number/String | Tempo trabalhado (deprecated - não usado em cálculos) | 2h, 2h 30m, 7200 | "Tempo gasto" |
| Sprint | String | Nome do sprint | Sprint 4, OUT25 - Semana 4 | "Sprint" |
| Criado | Date | Data de criação | 2025-10-15 | "Criado" |
| Estimativa original | Number/String | Tempo estimado em horas | 4h, 14400 | "Estimativa original" |
| Responsável | String | Nome do desenvolvedor | João Silva | "Responsável", "Responsavel" |
| ID do responsável | String | ID do desenvolvedor | user123 | "ID do responsável", "ID do responsavel" |
| Status | String | Status atual da tarefa | Em progresso, Concluído | "Status" |
| Campo personalizado (Modulo) | String | Módulo da aplicação | Autenticação | "Campo personalizado (Modulo)", "Campo personalizado (Módulo)" |
| Campo personalizado (Feature) | String/Array | Feature relacionada | Login | "Campo personalizado (Feature)" (qualquer coluna contendo "feature") |
| Categorias | String/Array | Cliente(s) | Cliente A, Cliente B | "Categorias" (qualquer coluna contendo "categoria") |
| Campo personalizado (Detalhes Ocultos) | String/Array | Informações adicionais | Auxilio, Reunião, HoraExtra, DuvidaOculta | "Campo personalizado (Detalhes Ocultos)" (qualquer coluna contendo "detalhes ocultos") |

### Comportamento de Tarefas sem Sprint

**Tarefas sem sprint definido** (campo Sprint vazio, null ou string vazia) são tratadas como **tarefas de backlog**.

**Regras:**
- NÃO interferem em métricas de performance
- NÃO são processadas para cálculos híbridos (tempoGastoTotal, tempoGastoNoSprint, etc.)
- Worklog de tarefas sem sprint é ignorado
- São exibidas apenas na análise de backlog (aba multi-sprint)
- São contabilizadas nas horas de backlog (baseado na estimativa apenas)

### Suporte a Múltiplas Colunas

Sistema suporta múltiplas colunas de "Feature", "Categorias" e "Detalhes Ocultos". Todas as colunas que correspondem ao padrão são lidas e combinadas em arrays.

**Exemplos de colunas suportadas:**
- "Campo personalizado (Feature)", "Feature NFCE", "Feature Pedido de Venda"
- "Categorias", "Cliente 1", "Cliente 2"
- "Campo personalizado (Detalhes Ocultos)", "Detalhes Ocultos", "DetalhesOcultos"

**Processamento:**
- Sistema identifica colunas por padrão (header contém "feature", "categoria" ou "detalhes ocultos", case-insensitive, após normalização de encoding)
- Processamento manual por índices de coluna (captura TODAS as colunas, mesmo com mesmo nome)
- Valores de todas as colunas correspondentes são combinados em Set (estrutura de dados que remove duplicatas automaticamente)
- Valores vazios são ignorados (trim, undefined, null, string "undefined", string "null")
- Valores podem ser separados por vírgula, ponto-e-vírgula ou pipe na mesma célula (ex: "Auxilio, HoraExtra")
- Após normalização de encoding, valores são adicionados ao Set
- Resultado final: array único sem duplicatas, ordenado pela ordem de processamento

### Colunas Opcionais (Análise de Performance)

| Coluna | Tipo | Descrição | Valores Aceitos |
|--------|------|-----------|----------------|
| Campo personalizado (Retrabalho) | String | Indica se é retrabalho | "Sim", "Não" |
| Campo personalizado (Complexidade) | Number/String | Nível de complexidade | 1 a 5 |
| Campo personalizado (Nota Teste) | Number/String | Nota nos testes | 1 a 5 |
| Campo personalizado (Qualidade do Chamado) | String | Qualidade do chamado | Texto livre |

**Parsing de Complexidade:**
- Se valor é número: garante range 1-5 (Math.max(1, Math.min(5, Math.round(value))))
- Se valor é string: tenta parseInt, se inválido retorna 1
- Valor padrão: 1 (complexidade baixa)

**Parsing de Nota de Teste:**
- Se valor é undefined, null ou string vazia: retorna null (não aplicável)
- Se valor é número: garante range 1-5 (clamp)
- Se valor é string com vírgula: substitui por ponto antes de parseFloat
- Valores fora do range são automaticamente ajustados para 1-5

**Parsing de Tipo de Tarefa:**
- Se coluna "Tipo de item" existe: usa valor da coluna (normalizado)
- Se coluna não existe: determina tipo baseado no conteúdo (fallback)
- Fallback: verifica se "Bug", "História/Historia/Story", "Tarefa/Task" aparecem em chave ou resumo
- Valores aceitos (case-insensitive): "Bug", "Tarefa", "Task", "História", "Historia", "Story", outros → "Outro"

### Formatos de Tempo Aceitos

Sistema aceita os seguintes formatos para campos de tempo:

- Horas decimais com 'h': `2.5h`, `0.5h`, `1.75h`
- Horas inteiras: `2h`, `8h`, `1h`
- Formato h m: `2h 30m`, `8h 15m`, `1h 45m`
- Somente minutos: `45m`, `120m`, `30m`
- Apenas números (segundos): `7200`, `14400`, `3600`
- Decimais sem sufixo: `2.5`, `8`, `0.5` (interpretado como segundos)

**Algoritmo de conversão:**
1. Se número: assume segundos, converte para horas (divide por 3600)
2. Se string contém 'h' e 'm': extrai horas e minutos
3. Se string contém apenas 'h': extrai horas
4. Se string contém apenas 'm': extrai minutos, converte para horas (divide por 60)
5. Se string numérica: assume segundos, converte para horas

### Formatos de Data Aceitos

- ISO: `2025-10-15`
- BR: `15/10/2025`
- US: `10/15/2025`
- Com hora: `2025-10-15 14:30:00`, `2025-10-15T14:30:00`

**Algoritmo de parsing:**
1. Tenta formato ISO primeiro (YYYY-MM-DD)
2. Tenta formato BR (DD/MM/YYYY)
3. Tenta formato US (MM/DD/YYYY)
4. Tenta parsing nativo do JavaScript Date (fallback)

### Valores Especiais para "Detalhes Ocultos"

#### "Auxilio"

**Propósito:** Identificar tarefas de auxílio a outros desenvolvedores

**Identificação:**
- Campo "Detalhes Ocultos" = "Auxilio" (case-insensitive, normalizado)
- Variantes aceitas: "Auxilio", "auxilio", "Auxílio", etc.

**Impacto:**
- Adiciona bonus de auxílio ao Performance Score (0-10 pontos)
- Usa `tempoGastoNoSprint` para cálculo do bonus
- Escala progressiva: 0.5h+ = 1pt, 2h+ = 2pts, 4h+ = 4pts, 6h+ = 5pts, 8h+ = 7pts, 12h+ = 9pts, 16h+ = 10pts
- **Qualidade Neutra:** Tarefas de auxílio não são consideradas no cálculo da média de qualidade.

#### "HoraExtra" ou "Hora Extra" ou "Horas Extras" ou "HorasExtras"

**Propósito:** Identificar tarefas realizadas em horas extras (acima de 40h/semana)

**Identificação:**
- Campo "Detalhes Ocultos" = "HoraExtra", "Hora Extra", "Horas Extras" ou "HorasExtras" (case-insensitive, normalizado)
- Variantes aceitas: "HoraExtra", "Hora Extra", "Horas Extras", "HorasExtras", "horaextra", etc.

**Impacto:**
- ⚠️ **IMPORTANTE:** Este bônus não é um incentivo para trabalhar horas extras.
- Ele reconhece esforço adicional em momentos difíceis quando a qualidade é mantida alta.
- O bônus é concedido se a **média das notas de teste (≥ 4.0)** de TODAS as tarefas marcadas como "HoraExtra" for alta. Tarefas de "Auxílio", "Reunião" e "Treinamento" marcadas como hora extra são desconsideradas no cálculo desta média.
- O bônus é calculado com base nas horas totais de **todas as tarefas concluídas** que excedem 40h na semana.

#### "DuvidaOculta" ou "Dúvida Oculta"

**Propósito:** Identificar bugs que são na verdade dúvidas ocultas do cliente

**Identificação:**
- Campo "Detalhes Ocultos" = "DuvidaOculta" ou "Dúvida Oculta" (case-insensitive, normalizado)
- Variantes aceitas: "DuvidaOculta", "Dúvida Oculta", "duvidaoculta", etc.

**Impacto:**
- Usado para separar bugs reais de dúvidas ocultas nas análises
- Não afeta Performance Score diretamente
- Aparece separadamente nas métricas de problemas (bugs vs dúvidas ocultas)

### Suporte a Múltiplos Valores e Múltiplas Colunas

**Múltiplos Valores na Mesma Célula:**
- Valores podem ser separados por vírgula (`,`), ponto-e-vírgula (`;`) ou pipe (`|`)
- Exemplo: `"Auxilio, HoraExtra"` ou `"Reunião; Auxilio"` ou `"HoraExtra|Auxilio"`
- Todos os valores são processados e adicionados ao array de detalhes ocultos da tarefa

**Múltiplas Colunas:**
- Sistema suporta múltiplas colunas com nome "Detalhes Ocultos" (ou variações)
- Todas as colunas correspondentes são lidas e combinadas
- Valores de todas as colunas são combinados em um único array (duplicatas removidas automaticamente)
- Exemplo: Se você tem colunas "Detalhes Ocultos" e "Detalhes Ocultos 2", valores de ambas são combinados

### Tratamento Automático de Encoding

Sistema corrige automaticamente problemas de encoding UTF-8 mal interpretado.

**Substituições aplicadas (em ordem de especificidade):**
- **Minúsculas acentuadas:** Ã¡→á, Ã©→é, Ã­→í, Ã³→ó, Ãº→ú, Ã¢→â, Ãª→ê, Ã´→ô, Ã£→ã, Ãµ→õ, Ã§→ç
- **Maiúsculas acentuadas:** Ã‰→É, Ãš→Ú, Ã‚→Â, ÃŠ→Ê, Ãƒ→Ã, Ã•→Õ, Ã‡→Ç

**Algoritmo:**
- Aplica substituições em ordem específica (mais específicos primeiro)
- Substitui todas as ocorrências na string (global)
- Aplicado em todas as colunas de texto lidas do Excel

**Normalização para Comparação (Detalhes Ocultos):**
- Sistema usa normalização NFD (decomposição Unicode)
- Remove diacríticos duplicados
- Converte para lowercase
- Usado para identificar valores (case-insensitive, sem acentos)
- Valores aceitos: "Auxilio", "Reuniao"/"Reunião", "HoraExtra"/"Hora Extra"/"Horas Extras"/"HorasExtras", "DuvidaOculta"/"Dúvida Oculta", "Treinamento"
- Variantes aceitas: "Auxilio", "auxilio", "Auxílio" → todos reconhecidos como "auxilio"
- Variantes aceitas: "Reunião", "Reuniao", "reunião", "reuniao" → todos reconhecidos
- Variantes aceitas: "HoraExtra", "Hora Extra", "Horas Extras", "HorasExtras" → todos reconhecidos como "horaextra"
- Variantes aceitas: "DuvidaOculta", "Dúvida Oculta", "duvidaoculta" → todos reconhecidos como "duvidaoculta"
- Variantes aceitas: "Treinamento", "treinamento" → todos reconhecidos como "treinamento"
- Valores podem ser combinados: uma tarefa pode ter múltiplos valores separados por vírgula/ponto-e-vírgula

### Status Considerados "Concluídos"

Para cálculos de performance e disponibilidade, estes status são considerados concluídos:

- `teste`
- `teste gap`
- `compilar`
- `concluído`
- `concluido`

**Validação:**
- Comparação case-insensitive (status é normalizado antes da comparação)
- Verifica se status contém uma das strings acima (substring match)
- Status é normalizado antes da comparação (após normalização de encoding)

**Comportamento:**
- Tarefas com status concluído liberam capacidade do desenvolvedor
- Apenas tarefas concluídas são consideradas no cálculo de Performance Score
- Tarefas não concluídas aparecem nas métricas informativas mas não afetam score
- Se houver problemas após "teste", a métrica de retrabalho captura o impacto
- Status "teste gap" é considerado concluído (desenvolvedor já entregou sua parte)

## Arquivo de Worklog (Opcional)

Arquivo Excel contendo registros detalhados de tempo trabalhado. Necessário para análise híbrida precisa.

### Regra Fundamental

**IMPORTANTE:** Sem worklog, o sistema considera `tempoGastoTotal = 0` para todas as tarefas, o que significa que todas as tarefas sem worklog serão consideradas ineficientes no cálculo de performance.

### Estrutura Obrigatória

| Coluna | Obrigatório | Tipo | Descrição | Exemplo | Variações Aceitas |
|--------|------------|------|-----------|---------|-------------------|
| ID da tarefa | Sim | String | Chave ou ID da tarefa | PROJ-101, DM-2018 | "ID da tarefa", "Task ID", "Chave", "Chave da item", "Issue Key", "Issue" |
| Tempo gasto | Sim | Number/String | Tempo trabalhado | 1h, 2h 30m, 7200 | "Tempo gasto", "Time Spent", "Time spent", "Hours", "Horas", "Duration" |
| Data | Sim | Date | Data do lançamento do worklog | 2025-10-15 | "Data", "Date", "Data de registro", "Log Date", "Started", "Created date (worklog)", "Created date" |

### Formatos Aceitos

**ID da tarefa:**
- Aceita chave completa (ex: PROJ-101) ou ID numérico (ex: 101)
- Deve corresponder ao campo "Chave da item" ou "ID da item" do layout.xlsx

**Tempo gasto:**
- Mesmos formatos do campo "Tempo gasto" do layout (ver seção Formatos de Tempo Aceitos)

**Data:**
- Mesmos formatos do campo "Criado" do layout (ver seção Formatos de Data Aceitos)

### Processamento de Worklog

**Algoritmo:**
1. Para cada tarefa no layout.xlsx:
   - Buscar worklogs correspondentes (match por ID ou chave)
   - Se não houver worklogs: `tempoGastoTotal = 0`, `tempoGastoNoSprint = 0`, `tempoGastoOutrosSprints = 0`

2. Se houver worklogs e período do sprint definido:
   - Filtrar worklogs por data do sprint atual
   - `tempoGastoNoSprint` = soma de worklogs dentro do período do sprint atual
   - `tempoGastoOutrosSprints` = soma de worklogs fora do período do sprint atual
   - `tempoGastoTotal` = `tempoGastoNoSprint + tempoGastoOutrosSprints`

3. Se houver worklogs mas período do sprint não definido:
   - Todos os worklogs são considerados do sprint atual
   - `tempoGastoNoSprint = tempoGastoTotal`
   - `tempoGastoOutrosSprints = 0`

**Validações:**
- Worklogs com datas inválidas são ignorados
- Worklogs com tempo gasto ≤ 0 são ignorados
- Worklogs de tarefas sem sprint (backlog) são ignorados

## Arquivo de Sprints (Opcional)

Arquivo Excel definindo os períodos de cada sprint. Necessário para análise híbrida com múltiplos sprints.

### Estrutura

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| Sprint | String | Nome do sprint | OUT25 - Semana 4 |
| Data Início | Date | Data de início do sprint | 28/10/2025 |
| Data Fim | Date | Data de fim do sprint | 01/11/2025 |

### Reconhecimento de Colunas

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

### Validações

- Nome do sprint na planilha deve corresponder exatamente ao nome no layout.xlsx
- Períodos de sprints não devem se sobrepor
- Primeira linha do arquivo deve conter os cabeçalhos
- Datas devem estar em formato válido

### Processamento

**Algoritmo:**
1. Lê primeira linha como cabeçalhos
2. Identifica colunas por variações aceitas (case-insensitive)
3. Para cada linha de dados:
   - Parse do nome do sprint (trim whitespace)
   - Parse da data de início (00:00:00 no início do dia)
   - Parse da data de fim (23:59:59.999 no fim do dia)
   - Valida que data início < data fim
4. Armazena metadados do sprint para processamento híbrido

**Comportamento:**
- Se período do sprint não definido, usa semana atual (segunda a sexta) como padrão
- Se arquivo de sprints fornecido, períodos são detectados automaticamente por nome do sprint

## Validação de Dados

### Checklist de Validação

Antes de processamento, sistema valida:

- [ ] Todas as colunas obrigatórias estão presentes no layout.xlsx (comparação case-insensitive com variações de encoding)
- [ ] IDs das tarefas correspondem entre layout e worklog (match por ID ou chave completa)
- [ ] Datas estão em formato válido (parsing tenta múltiplos formatos)
- [ ] Não há linhas vazias no meio dos dados (ignoradas silenciosamente)
- [ ] Primeira linha é o cabeçalho (validada antes do processamento)
- [ ] Nomes de sprints são consistentes entre layout e sprints.xlsx (comparação exata após trim, case-sensitive)

**Validação de Estrutura de Arquivos:**
- **layout.xlsx:** Valida presença de colunas obrigatórias (comparação com variações de encoding, case-insensitive)
- **worklog.xlsx:** Valida presença de 3 colunas obrigatórias (comparação ignorando case e whitespace)
- **sprints.xlsx:** Valida presença de 3 colunas obrigatórias (comparação exata com variações mapeadas)
- Se validação falhar: sistema informa erro e não processa arquivo
- Validação é feita apenas na primeira linha (cabeçalhos)

**Tratamento de Erros:**
- Linhas com erro são ignoradas (continua processamento de outras linhas)
- Erros são logados no console como warnings
- Sistema nunca para completamente por erro em linha individual

### Regras de Negócio

**Tarefas de Backlog:**
- Campo Sprint vazio ou string vazia = backlog
- Backlog NÃO interfere em métricas de performance
- Backlog NÃO é processado para cálculos híbridos
- Worklog de backlog é ignorado

**Tarefas sem Worklog:**
- `tempoGastoTotal = 0`
- Todas as tarefas são consideradas ineficientes
- Impacto: Eficiência de Execução = 0% se todas sem worklog

**Tarefas sem Estimativa:**
- Aparecem em métricas informativas
- NÃO são consideradas no cálculo de Performance Score

**Tarefas marcadas como "Reunião" ou "Treinamento":**
- Não afetam Performance Score
- Não são consideradas no cálculo de eficiência
- Horas são exibidas apenas como informação
- **Qualidade Neutra:** Tarefas de reunião e treinamento não são consideradas no cálculo da média de qualidade.

**Tarefas marcadas como "HoraExtra":**
- Apenas tarefas marcadas explicitamente como "HoraExtra" no campo "Detalhes Ocultos" são consideradas para o bônus.
- O bônus só é concedido se a **média das notas de teste (≥ 4.0)** de TODAS as tarefas marcadas como "HoraExtra" for alta. Tarefas de "Auxílio", "Reunião" e "Treinamento" marcadas como hora extra são desconsideradas no cálculo desta média.
- O bônus é calculado com base nas horas totais que excedem 40h na semana.
- O total de horas para o cálculo (acima de 40h) considera **todas as tarefas concluídas**, não apenas as marcadas como "HoraExtra".

## Referências

- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Sistema híbrido de cálculo
- [Métricas de Performance](METRICAS_PERFORMANCE.md) - Especificações de métricas
