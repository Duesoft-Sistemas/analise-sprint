# Template de Worklog

## 📋 Estrutura do Arquivo

O arquivo de worklog deve ser um arquivo Excel (.xlsx ou .xls) com as seguintes colunas:

| Coluna | Obrigatório | Descrição | Exemplo | Variações Aceitas |
|--------|------------|-----------|---------|-------------------|
| **ID da tarefa** | ✅ Sim | Chave ou ID da tarefa | PROJ-101, DM-2018 | "ID da tarefa", "Issue", "Task ID", "Chave" |
| **Tempo gasto** | ✅ Sim | Tempo trabalhado | 1h, 2h 30m, 7200 | "Tempo gasto", "Time spent", "Hours", "Duration" |
| **Data** | ✅ Sim | Data do lançamento | 2025-10-15, 29/10/2025 19:35 | "Data", "Date", "Created date (worklog)" |

### 🌍 Suporte Multilíngue

O sistema aceita colunas em **português** e **inglês**:

- ✅ Português: "ID da tarefa", "Tempo gasto", "Data"
- ✅ Inglês: "Issue", "Time spent", "Created date (worklog)"
- ✅ Mix: Você pode misturar português e inglês

## 📝 Exemplo de Conteúdo

### Formato em Português
```
ID da tarefa | Tempo gasto | Data
PROJ-101     | 2h         | 2025-10-15
PROJ-101     | 3h         | 2025-10-16
PROJ-101     | 5h         | 2025-10-22
PROJ-102     | 4h         | 2025-10-15
PROJ-102     | 3h         | 2025-10-16
PROJ-103     | 8h         | 2025-10-22
PROJ-103     | 2h         | 2025-10-23
```

### Formato em Inglês (Jira Export)
```
Issue    | Time spent | Created date (worklog)
DM-2018  | 1h        | 29/10/2025 19:35
DM-2018  | 2h        | 30/10/2025 10:15
DM-2019  | 3h 30m    | 29/10/2025 14:20
DM-2020  | 4h        | 30/10/2025 09:00
```

## 🎯 Exemplo Prático

### Cenário: Sprint 4 (21-27 Out 2025)

#### Layout.xlsx
```
Chave    | Resumo          | Estimativa | Tempo Gasto | Sprint   | Responsável
PROJ-101 | Implementar API | 15h        | 15h         | Sprint 4 | João Silva
PROJ-102 | Criar telas     | 12h        | 10h         | Sprint 4 | Maria Santos
PROJ-103 | Testes          | 10h        | 10h         | Sprint 4 | Pedro Alves
```

#### Worklog.xlsx
```
ID da tarefa | Tempo gasto | Data
PROJ-101     | 2h         | 2025-10-15  ← Sprint 3
PROJ-101     | 3h         | 2025-10-16  ← Sprint 3
PROJ-101     | 5h         | 2025-10-22  ← Sprint 4 ✓
PROJ-101     | 5h         | 2025-10-23  ← Sprint 4 ✓
PROJ-102     | 3h         | 2025-10-16  ← Sprint 3
PROJ-102     | 4h         | 2025-10-22  ← Sprint 4 ✓
PROJ-102     | 3h         | 2025-10-23  ← Sprint 4 ✓
PROJ-103     | 8h         | 2025-10-22  ← Sprint 4 ✓
PROJ-103     | 2h         | 2025-10-23  ← Sprint 4 ✓
```

### Resultado da Análise

**PROJ-101 (João Silva)**
- Estimativa Original: 15h
- Tempo Outros Sprints: 5h (2h + 3h do Sprint 3)
- Estimativa Restante: 10h
- Tempo Gasto no Sprint 4: 10h (5h + 5h)
- Status: ✅ Dentro do previsto

**PROJ-102 (Maria Santos)**
- Estimativa Original: 12h
- Tempo Outros Sprints: 3h
- Estimativa Restante: 9h
- Tempo Gasto no Sprint 4: 7h (4h + 3h)
- Status: ✅ Dentro do previsto (2h restantes)

**PROJ-103 (Pedro Alves)**
- Estimativa Original: 10h
- Tempo Outros Sprints: 0h
- Estimativa Restante: 10h
- Tempo Gasto no Sprint 4: 10h (8h + 2h)
- Status: ✅ Concluída

## 🔧 Exportar do Jira

### Opção 1: Work Log Report (Recomendado)

1. Acesse seu projeto no Jira
2. Vá em **Reports** → **Time Tracking Report** ou **Work Log Report**
3. Selecione o período desejado
4. Configure as colunas:
   - Issue Key (ID da tarefa)
   - Time Spent (Tempo gasto)
   - Log Date (Data)
5. Exporte para Excel

### Opção 2: Via JQL + Export

1. Use esta query JQL:
```
project = PROJ AND worklogDate >= "2025-10-01" ORDER BY worklogDate DESC
```

2. Configure a exportação para incluir worklog details
3. Exporte para Excel

### Opção 3: Plugin Tempo Timesheets (se disponível)

1. Acesse Tempo Timesheets
2. Selecione o período
3. Exporte o relatório de worklogs

## 🔧 Exportar do Azure DevOps

### Usando Queries

1. Crie uma query com suas tarefas
2. Execute: `az boards query --wiql "SELECT [System.Id], [System.Title], [Microsoft.VSTS.Scheduling.CompletedWork] FROM WorkItems"`
3. Ou use a interface web:
   - Boards → Queries
   - Analytics → OData query para worklogs
   - Export to Excel

## ⚙️ Formatos Aceitos

### Formatos de Tempo

O sistema aceita os seguintes formatos para "Tempo gasto":

- **Horas decimais com 'h'**: `2.5h`, `0.5h`, `1.75h` ⭐
- **Horas inteiras**: `2h`, `8h`, `1h`
- **Formato h m**: `2h 30m`, `8h 15m`, `1h 45m`
- **Somente minutos**: `45m`, `120m`, `30m`
- **Apenas números (segundos)**: `7200`, `14400`, `3600`
- **Decimais sem sufixo**: `2.5`, `8`, `0.5` (interpretado como segundos)

### Formatos de Data

- **ISO**: `2025-10-15`
- **BR**: `15/10/2025`
- **US**: `10/15/2025`
- **Com hora**: `2025-10-15 14:30:00`

## ✅ Validação

Antes de fazer upload, verifique:

- [ ] Todas as colunas obrigatórias estão presentes
- [ ] IDs das tarefas correspondem ao arquivo de layout
- [ ] Datas estão em formato válido
- [ ] Não há linhas vazias no meio dos dados
- [ ] A primeira linha é o cabeçalho

## 💡 Dicas

1. **Mantém histórico**: O worklog pode conter registros de múltiplos sprints
2. **Múltiplos registros**: Uma tarefa pode ter vários registros de worklog
3. **Período automático**: Se não definir período, usa semana atual
4. **IDs flexíveis**: Aceita tanto "PROJ-101" quanto "101"
5. **Encoding**: O sistema corrige automaticamente problemas de encoding

## ⚠️ Erros Comuns

### Erro: "Tarefa não encontrada"
**Causa**: ID do worklog não corresponde ao layout
**Solução**: Verifique se os IDs são exatamente iguais

### Erro: "Data inválida"
**Causa**: Formato de data não reconhecido
**Solução**: Use formato ISO (YYYY-MM-DD)

### Erro: "Tempo inválido"
**Causa**: Formato de tempo não reconhecido
**Solução**: Use formatos simples como "2h" ou "120m"


## 📊 Exemplo Completo

Para testar, você pode usar o arquivo de exemplo na pasta `project/worklog.xlsx`.

```bash
# Estrutura esperada
project/
├── layout.xlsx    # Arquivo principal (obrigatório)
└── worklog.xlsx   # Arquivo de worklogs (opcional)
```

---

💡 **Dica**: Comece sem worklog para ver o sistema funcionando normalmente, depois adicione o worklog para ver a diferença!

