# Configuração e Análise Híbrida

Este documento explica como configurar sprints e usar a análise híbrida com worklog.

## 📅 Configuração de Sprints

Para análise híbrida precisa com múltiplos sprints, é necessário configurar os períodos de cada sprint.

### Formato da Planilha de Sprints

Crie um arquivo Excel (`sprints.xlsx`) com 3 colunas:

| Sprint | Data Início | Data Fim |
|--------|-------------|----------|
| OUT25 - Semana 4 | 28/10/2025 | 01/11/2025 |
| NOV25 - Semana 1 | 04/11/2025 | 08/11/2025 |
| NOV25 - Semana 2 | 11/11/2025 | 15/11/2025 |

### Colunas Aceitas

O sistema reconhece automaticamente várias variações:

- **Sprint**: `Sprint`, `sprint`, `Nome do Sprint`, `Sprint Name`, `ID`
- **Data Início**: `Data Início`, `Data Inicio`, `Start Date`, `Data inicial`, `Início`
- **Data Fim**: `Data Fim`, `End Date`, `Data final`, `Fim`

### Formatos de Data Aceitos

- ✅ **DD/MM/YYYY** - Formato brasileiro (recomendado): `28/10/2025`
- ✅ **YYYY-MM-DD** - Formato ISO: `2025-10-28`
- ✅ **DD-MM-YYYY** - Formato alternativo: `28-10-2025`

### Como Usar

1. **Criar a Planilha:**
   - Abra o Excel
   - Adicione as colunas: `Sprint`, `Data Início`, `Data Fim`
   - Preencha com os dados de cada sprint
   - Salve como `sprints.xlsx`

2. **Carregar no Sistema:**
   - Acesse o sistema
   - Na seção "1. Configuração de Sprints"
   - Arraste o arquivo `sprints.xlsx` ou clique para selecionar
   - Aguarde o processamento

3. **Importante:**
   - O nome do sprint na planilha deve ser **exatamente igual** ao nome no layout.xlsx
   - Períodos não devem se sobrepor
   - A primeira linha deve conter os cabeçalhos

## ⏱️ Análise Híbrida com Worklog

A análise híbrida permite calcular métricas de sprint de forma mais precisa, separando o tempo gasto em diferentes sprints. Isso é útil para tarefas que atravessam múltiplos sprints.

### ⚠️ REGRA FUNDAMENTAL

**O tempo gasto nos cálculos SEMPRE vem do worklog, NUNCA da planilha de sprint.**

- ✅ **Usar**: `tempoGastoTotal`, `tempoGastoNoSprint`, `tempoGastoOutrosSprints` (calculados do worklog)
- ❌ **NUNCA usar**: `tempoGasto` (campo da planilha de sprint) nos cálculos

**Importante:** Se não houver worklog, o tempo gasto é **0** (zero), não o valor da planilha.

### Como Funciona

**Exemplo:**
```
Tarefa: PROJ-101
├─ Estimativa Original: 15h
├─ Tempo Gasto Outros Sprints: 5h
├─ Estimativa Restante (Sprint 2): 10h
└─ Tempo Gasto no Sprint: 10h

No Sprint 2, o sistema mostra:
   - Alocação: 10h (estimativa restante)
   - Disponível: 30h do dev (40h - 10h)
   - Performance: 15h estimadas vs 15h gastas (100%)
```

### Visões de Análise

O sistema usa uma **abordagem híbrida** que mantém duas visões:

1. **Capacidade do Sprint Atual** (para planejamento)
   - Usa `estimativaRestante` = quanto falta fazer NESTE sprint
   - Usa `tempoGastoNoSprint` = quanto foi gasto NESTE sprint

2. **Performance Histórica** (para análise)
   - Usa `estimativa` = estimativa original
   - Usa `tempoGastoTotal` = tempo total em todos os sprints

### Campos Utilizados

O sistema utiliza os seguintes campos para análise híbrida:

- `estimativa`: Estimativa original (nunca muda)
- `estimativaRestante`: Quanto falta fazer no sprint atual
- `tempoGastoNoSprint`: Tempo gasto apenas neste sprint
- `tempoGastoOutrosSprints`: Tempo gasto em sprints anteriores
- `tempoGastoTotal`: Tempo total acumulado em todos os sprints

### Estrutura do Worklog

O arquivo de worklog deve ter as seguintes colunas obrigatórias:

| Coluna | Obrigatório | Descrição | Exemplo |
|--------|------------|-----------|---------|
| **ID da tarefa** | ✅ Sim | Chave ou ID da tarefa | PROJ-101 |
| **Tempo gasto** | ✅ Sim | Horas trabalhadas | 2h ou 7200 (segundos) |
| **Data** | ✅ Sim | Data do lançamento | 2025-10-15 |

### Exemplo de Worklog

```
ID da tarefa | Tempo gasto | Data
PROJ-101     | 2h         | 2025-10-15
PROJ-101     | 3h         | 2025-10-16
PROJ-101     | 5h         | 2025-10-22
PROJ-102     | 4h         | 2025-10-15
```

### Como Usar

1. **Preparar os Arquivos:**
   - **layout.xlsx**: Arquivo normal com todas as tarefas (obrigatório)
   - **worklog.xlsx**: Arquivo com registros detalhados de tempo (opcional)
   - **sprints.xlsx**: Arquivo com períodos de cada sprint (opcional)

2. **Fazer Upload:**
   - Upload do Layout (obrigatório)
   - Upload do Worklog (opcional)
   - Upload da configuração de Sprints (opcional)

3. **Definir Período do Sprint** (opcional):
   - Se enviou worklog, defina as datas de início e fim
   - Se não definir, usa a semana atual automaticamente
   - Se enviou sprints.xlsx, o período é detectado automaticamente

### Impacto nas Métricas

#### Card do Desenvolvedor

```
┌─────────────────────────────────────────┐
│ João Silva                               │
├─────────────────────────────────────────┤
│ CAPACIDADE NESTE SPRINT                 │
│ 🎯 Alocado: 40h (tarefas restantes)     │ ← usa estimativaRestante
│ ⏱️  Gasto: 12h (neste sprint)           │ ← usa tempoGastoNoSprint
│ ✅ Disponível: 28h                       │
├─────────────────────────────────────────┤
│ PERFORMANCE (todas as tarefas)          │
│ 📈 Estimado: 80h (original)             │ ← usa estimativa
│ ⚡ Realizado: 85h (total histórico)     │ ← usa tempoGastoTotal
│ 🎯 Acurácia: -6.25%                     │
└─────────────────────────────────────────┘
```

#### Lista de Tarefas

```
PROJ-101 | Implementar login
├─ Estimativa: 10h (15h orig.)  ← mostra ambos!
├─ Gasto: 3h                     ← só deste sprint
│  +5h ant.                      ← tempo anterior
└─ Variação: -7h (-70%)          ← baseado na restante
```

### Cálculo Detalhado

**Exemplo Completo:**

```
// Dados de entrada
Tarefa: PROJ-101
├─ Estimativa Original: 15h
├─ Sprint do Layout: "Sprint 4"
└─ Worklogs:
    ├─ 2025-10-15: 2h (Sprint 3)
    ├─ 2025-10-16: 3h (Sprint 3)
    ├─ 2025-10-22: 5h (Sprint 4) ✓
    └─ 2025-10-23: 5h (Sprint 4) ✓

// Período do Sprint 4: 2025-10-21 a 2025-10-27

// Cálculo
tempoGastoOutrosSprints = 2h + 3h = 5h
tempoGastoNoSprint = 5h + 5h = 10h
tempoGastoTotal = 5h + 10h = 15h
estimativaRestante = 15h - 5h = 10h

// Resultado para o Dev
Alocação: 10h (estimativaRestante)
Gasto: 10h (tempoGastoNoSprint)
Disponível: 40h - 10h = 30h ✓

// Performance (histórico)
Estimado: 15h (original)
Gasto: 15h (total)
Acurácia: 0% (perfeito!)
```

### Benefícios

1. **Capacidade Correta:** Alocação reflete apenas o trabalho restante
2. **Performance Precisa:** Análise usa o histórico completo
3. **Alertas Melhores:** Riscos baseados no tempo real do sprint
4. **Transparência:** Visualização clara do tempo em outros sprints
5. **Flexibilidade:** Funciona com ou sem worklog

### Importante

- O worklog é **opcional** - se não enviado, o tempo gasto é considerado 0
- O período do sprint é **opcional** - se não definido, usa semana atual
- O arquivo de layout continua **obrigatório**
- IDs/chaves do worklog devem **corresponder** ao layout
- O nome do sprint na planilha de sprints deve ser **exatamente igual** ao nome no layout

## 📖 Referências

- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura completa dos arquivos
- [Métricas de Performance](METRICAS_PERFORMANCE.md) - Como as métricas são calculadas

