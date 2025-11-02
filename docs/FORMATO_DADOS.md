# Formato dos Dados

Este documento descreve o formato necessário para os arquivos de dados do Sprint Analysis Dashboard.

## 📊 Arquivo de Layout (Obrigatório)

O arquivo de layout contém as tarefas do sprint. Deve ser um arquivo Excel (.xlsx ou .xls) exportado do Jira/Azure DevOps.

### Colunas Obrigatórias

| Coluna | Descrição | Exemplo | Variações Aceitas |
|--------|-----------|---------|-------------------|
| **Tipo de item** | Tipo da tarefa | Bug, Tarefa, História, Outro | "Tipo de item", "Type", "Issue Type" |
| **Chave da item** | Identificador da tarefa | PROJ-101, DM-2018 | "Chave da item", "Issue Key", "Key", "Chave" |
| **ID da item** | ID numérico | 12345 | "ID da item", "Issue ID", "ID" |
| **Resumo** | Descrição da tarefa | Implementar API de login | "Resumo", "Summary", "Title" |
| **Tempo gasto** | Tempo trabalhado | 2h, 2h 30m, 7200 | "Tempo gasto", "Time spent", "Hours" |
| **Sprint** | Nome do sprint | Sprint 4, OUT25 - Semana 4 | "Sprint", "Sprint Name" |
| | | **⚠️ IMPORTANTE:** Tarefas sem sprint (campo vazio) são tratadas como **BACKLOG** | |
| | | Tarefas de backlog NÃO interferem em métricas de performance, mesmo que tenham worklog | |
| | | Elas são usadas APENAS para análise de demandas na aba multi-sprint | |
| **Criado** | Data de criação | 2025-10-15 | "Criado", "Created", "Created date" |
| **Estimativa original** | Tempo estimado | 4h, 14400 | "Estimativa original", "Original Estimate", "Estimate" |
| **Responsável** | Nome do desenvolvedor | João Silva | "Responsável", "Assignee", "Responsavel" |
| **ID do responsável** | ID do desenvolvedor | user123 | "ID do responsável", "Assignee ID" |
| **Status** | Status atual | Em progresso, Concluído | "Status", "State" |
| **Campo personalizado (Modulo)** | Módulo da aplicação | Autenticação | "Modulo", "Módulo", "Module" |
| **Campo personalizado (Feature)** | Feature relacionada | Login | "Feature", "Campo personalizado (Feature)" |
| **Categorias** | Cliente(s) | Cliente A, Cliente B | "Categorias", "Categories", "Labels", "Categoria" |
| **Campo personalizado (Detalhes Ocultos)** | Informações adicionais | Auxilio, Reunião | "Detalhes Ocultos", "Hidden Details" |

**Nota sobre múltiplas colunas:** O sistema suporta múltiplas colunas de "Feature" e "Categorias". Por exemplo:
- Pode haver colunas: "Campo personalizado (Feature)", "Feature NFCE", "Feature Pedido de Venda"
- Pode haver colunas: "Categorias", "Cliente 1", "Cliente 2"
- Todas as colunas que correspondem ao padrão serão lidas e combinadas

### Colunas Opcionais (para análise de performance)

| Coluna | Descrição | Valores Aceitos |
|--------|-----------|----------------|
| **Campo personalizado (Retrabalho)** | Indica se é retrabalho | "Sim", "Não", "Yes", "No", "S", "N" |
| **Campo personalizado (Complexidade)** | Nível de complexidade | 1 a 5 |
| **Campo personalizado (Nota de Teste)** | Nota nos testes | 1 a 5 (vazio = 5) |
| **Campo personalizado (Qualidade do Chamado)** | Qualidade do chamado | Texto livre (para análise de qualidade dos chamados) |

### Formatos de Tempo Aceitos

O sistema aceita diversos formatos para campos de tempo:

- **Horas decimais com 'h'**: `2.5h`, `0.5h`, `1.75h`
- **Horas inteiras**: `2h`, `8h`, `1h`
- **Formato h m**: `2h 30m`, `8h 15m`, `1h 45m`
- **Somente minutos**: `45m`, `120m`, `30m`
- **Apenas números (segundos)**: `7200`, `14400`, `3600`
- **Decimais sem sufixo**: `2.5`, `8`, `0.5` (interpretado como segundos)

### Formatos de Data Aceitos

- **ISO**: `2025-10-15`
- **BR**: `15/10/2025`
- **US**: `10/15/2025`
- **Com hora**: `2025-10-15 14:30:00`

### Valores Especiais para "Detalhes Ocultos"

#### "Auxilio" 🤝
- **Propósito:** Registrar tempo dedicado a ajudar outros desenvolvedores
- **Impacto:** Adiciona bonus de auxílio (até +10 pontos) ao Performance Score
- **Variações aceitas:** Qualquer combinação de maiúsculas/minúsculas e acentos

#### "Reunião" ou "Reuniao" 🗣️
- **Propósito:** Registrar tempo gasto em reuniões organizacionais
- **Impacto:** Neutro - não afeta nenhum cálculo de performance
- **Exibição:** Mostrado apenas como informação no card de performance

### Tratamento Automático de Encoding

O sistema corrige automaticamente problemas de encoding:
- Aceita variações como "ResponsÃ¡vel" → "Responsável"
- Normaliza todo o conteúdo dos dados para exibição correta

### Status Considerados "Concluídos"

Para cálculo de horas disponíveis, estes status são considerados concluídos:
- `teste`
- `teste gap`
- `compilar`
- `concluído` ou `concluido`

**Importante:** Uma vez em teste, o dev liberou capacidade. Se houver problemas, a métrica de retrabalho captura o impacto.

## 📋 Arquivo de Worklog (Opcional)

O arquivo de worklog contém registros detalhados de tempo trabalhado, necessário para análise híbrida precisa.

**⚠️ IMPORTANTE:** Sem worklog, o sistema considera `tempoGastoTotal = 0` para todas as tarefas, o que significa que **todas as tarefas sem worklog serão consideradas ineficientes** no cálculo de performance. Use o dashboard "Inconsistências" para identificar tarefas sem registros de worklog.

### Estrutura Obrigatória

| Coluna | Obrigatório | Descrição | Exemplo | Variações Aceitas |
|--------|------------|-----------|---------|-------------------|
| **ID da tarefa** | ✅ Sim | Chave ou ID da tarefa | PROJ-101, DM-2018 | "ID da tarefa", "Issue", "Task ID", "Chave" |
| **Tempo gasto** | ✅ Sim | Tempo trabalhado | 1h, 2h 30m, 7200 | "Tempo gasto", "Time spent", "Hours", "Duration" |
| **Data** | ✅ Sim | Data do lançamento | 2025-10-15, 29/10/2025 19:35 | "Data", "Date", "Created date (worklog)" |

### Exemplo de Worklog

```
ID da tarefa | Tempo gasto | Data
PROJ-101     | 2h         | 2025-10-15
PROJ-101     | 3h         | 2025-10-16
PROJ-101     | 5h         | 2025-10-22
PROJ-102     | 4h         | 2025-10-15
PROJ-102     | 3h         | 2025-10-16
```

### Como Exportar do Jira

1. Acesse seu projeto no Jira
2. Vá em **Reports** → **Time Tracking Report** ou **Work Log Report**
3. Selecione o período desejado
4. Configure as colunas: Issue Key, Time Spent, Log Date
5. Exporte para Excel

### Como Exportar do Azure DevOps

1. Crie uma query com suas tarefas
2. Use a interface web: Boards → Queries → Analytics
3. Export to Excel

## 📅 Arquivo de Sprints (Opcional)

O arquivo de sprints define os períodos de cada sprint, necessário para análise híbrida com múltiplos sprints.

### Estrutura

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| **Sprint** | Nome do sprint | OUT25 - Semana 4 |
| **Data Início** | Data de início | 28/10/2025 |
| **Data Fim** | Data de fim | 01/11/2025 |

### Exemplo

```
Sprint           | Data Início | Data Fim
OUT25 - Semana 4 | 28/10/2025 | 01/11/2025
NOV25 - Semana 1  | 04/11/2025 | 08/11/2025
NOV25 - Semana 2  | 11/11/2025 | 15/11/2025
```

### Formatos de Data Aceitos

- ✅ **DD/MM/YYYY** - Formato brasileiro (recomendado): `28/10/2025`
- ✅ **YYYY-MM-DD** - Formato ISO: `2025-10-28`
- ✅ **DD-MM-YYYY** - Formato alternativo: `28-10-2025`

### Importante

- O nome do sprint na planilha deve ser **exatamente igual** ao nome no layout.xlsx
- Períodos não devem se sobrepor
- A primeira linha deve conter os cabeçalhos

## ✅ Validação

Antes de fazer upload, verifique:

- [ ] Todas as colunas obrigatórias estão presentes
- [ ] IDs das tarefas correspondem entre layout e worklog
- [ ] Datas estão em formato válido
- [ ] Não há linhas vazias no meio dos dados
- [ ] A primeira linha é o cabeçalho
- [ ] Nomes de sprints são consistentes entre arquivos

## 💡 Dicas

1. **Mantém histórico:** O worklog pode conter registros de múltiplos sprints
2. **Múltiplos registros:** Uma tarefa pode ter vários registros de worklog
3. **IDs flexíveis:** Aceita tanto "PROJ-101" quanto "101"
4. **Encoding:** O sistema corrige automaticamente problemas de encoding
5. **Nomes consistentes:** Use o mesmo padrão de nome em todas as planilhas

## 📋 Sobre Tarefas de Backlog

**Tarefas sem sprint definido** (campo Sprint vazio ou sem valor) são automaticamente tratadas como **tarefas de backlog**.

### Comportamento do Sistema

- ✅ **São exibidas** na análise multi-sprint como backlog
- ✅ **São contabilizadas** nas horas de backlog (baseado na estimativa)
- ❌ **NÃO interferem** em métricas de performance
- ❌ **NÃO aparecem** em análises de sprint específico
- ❌ **NÃO são processadas** para cálculos híbridos (tempoGastoTotal, tempoGastoNoSprint, etc.)
- ❌ **Worklog ignorado** - mesmo que a tarefa tenha registros de worklog, eles não são processados

### Quando Usar

Tarefas de backlog devem ser usadas para:
- **Análise de demandas futuras** - visualizar o volume de trabalho pendente
- **Planejamento** - estimar carga de trabalho não alocada
- **Visão geral** - entender o tamanho do backlog

### Importante

Se uma tarefa teve trabalho realizado (worklog), mas está sem sprint, considere:
- **Alocar em um sprint** se o trabalho já foi feito
- **Manter como backlog** se for trabalho futuro/planejado
- O sistema não contabilizará essas horas em métricas de performance até que a tarefa seja alocada em um sprint

