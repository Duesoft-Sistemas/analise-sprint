# Changelog: Tempo Gasto Sempre do Worklog

## 📅 Data
Outubro/2025

## 🎯 Objetivo
Garantir que o tempo gasto nos cálculos **SEMPRE** seja obtido do worklog, **NUNCA** da planilha de sprint.

## 🔄 Mudanças Implementadas

### 1. **src/services/hybridCalculations.ts**
- ✅ Removido fallback para `task.tempoGasto` quando não há worklogs
- ✅ Agora retorna `0` (zero) se não houver worklog disponível
- ✅ Comentários atualizados explicando a regra

**Antes:**
```typescript
if (!worklogs || worklogs.length === 0) {
  return {
    ...task,
    tempoGastoTotal: task.tempoGasto,  // ❌ ERRADO
    tempoGastoNoSprint: task.tempoGasto,
    ...
  };
}
```

**Depois:**
```typescript
if (!worklogs || worklogs.length === 0) {
  return {
    ...task,
    tempoGastoTotal: 0,  // ✅ CORRETO
    tempoGastoNoSprint: 0,
    ...
  };
}
```

### 2. **src/services/analytics.ts**
- ✅ Todas as ocorrências de `tempoGastoNoSprint ?? tempoGasto` substituídas por `tempoGastoNoSprint ?? 0`
- ✅ Afetados:
  - `calculateSprintAnalytics()`: totalHours, completedHours
  - `calculateDeveloperMetrics()`: totalSpentHours
  - `createTotalizer()`: hours
  - `calculateCrossSprintAnalytics()`: sprintDistribution, developerAllocation, clientAllocation
  - `calculateRiskAlerts()`: tempoGasto

### 3. **src/services/performanceAnalytics.ts**
- ✅ Todas as ocorrências de `tempoGastoTotal ?? tempoGasto` substituídas por `tempoGastoTotal ?? 0`
- ✅ Afetados:
  - `calculateTaskMetrics()`: hoursSpent
  - `calculateSprintPerformance()`: totalHoursWorked, averageHoursPerTask, avgTimeToComplete
  - `calculateCustomPeriodPerformance()`: hoursSpent (no typeMap)

### 4. **src/components/TaskList.tsx**
- ✅ Linha 268: `task.tempoGastoNoSprint ?? task.tempoGasto` → `task.tempoGastoNoSprint ?? 0`

### 5. **src/components/TotalizerCards.tsx**
- ✅ Linha 34: `t.tempoGasto` → `t.tempoGastoNoSprint ?? 0`
- ✅ Cálculo de tarefas bloqueadas agora usa worklog

### 6. **src/types/index.ts**
- ✅ Campo `tempoGasto` marcado como **DEPRECATED** com avisos claros
- ✅ Comentários adicionados nos campos do worklog explicando que devem ser usados para cálculos

### 7. **docs/WORKLOG_HYBRID_ANALYSIS.md**
- ✅ Nova seção "REGRA FUNDAMENTAL" adicionada no início do documento
- ✅ Explica claramente que tempo gasto SEMPRE vem do worklog
- ✅ Lista o que usar (✅) e o que não usar (❌)

## 📊 Impacto

### Comportamento Anterior (Incorreto)
- Se não houvesse worklog para uma tarefa, o sistema usava o `tempoGasto` da planilha de sprint
- Isso poderia levar a cálculos incorretos com dados desatualizados

### Comportamento Atual (Correto)
- Se não houver worklog, o tempo gasto é **0** (zero)
- Todos os cálculos agora refletem o tempo **efetivamente** registrado no worklog
- A planilha de sprint é usada apenas para carregar metadados das tarefas, não para cálculos de tempo

## ⚠️ Regra para Desenvolvedores

**NUNCA use `task.tempoGasto` em cálculos!**

Sempre use:
- `task.tempoGastoTotal` - para análise histórica total
- `task.tempoGastoNoSprint` - para análise do sprint atual
- `task.tempoGastoOutrosSprints` - para tempo gasto em outros sprints

Se o campo estiver `undefined`, use `?? 0` (nunca `?? task.tempoGasto`).

## ✅ Verificação

Para garantir que a regra está sendo seguida, busque no código por:

```bash
# Buscar por usos incorretos (não deve retornar nada):
grep -r "tempoGasto ?? t.tempoGasto" src/
grep -r "tempoGasto ?? task.tempoGasto" src/

# Buscar por fallbacks corretos (deve retornar os locais corretos):
grep -r "tempoGasto ?? 0" src/
```

## 🎓 Justificativa

1. **Fonte Única da Verdade**: O worklog é o registro oficial do tempo trabalhado
2. **Dados Atualizados**: A planilha de sprint pode ficar desatualizada
3. **Consistência**: Todos os cálculos agora usam a mesma fonte
4. **Transparência**: Se não há worklog, fica claro que o tempo é zero (não há adivinhação)

## 📝 Arquivos Modificados

1. `src/services/hybridCalculations.ts`
2. `src/services/analytics.ts`
3. `src/services/performanceAnalytics.ts`
4. `src/components/TaskList.tsx`
5. `src/components/TotalizerCards.tsx`
6. `src/types/index.ts`
7. `docs/WORKLOG_HYBRID_ANALYSIS.md`
8. `docs/CHANGELOG_WORKLOG_SOURCE.md` (este arquivo)

## 🔍 Testes Sugeridos

1. **Carregar planilha sem worklog**: Verificar se tempos aparecem como zero
2. **Carregar worklog depois**: Verificar se tempos são atualizados corretamente
3. **Comparar cálculos**: Garantir que métricas batem com worklog, não com planilha
4. **Tarefas cross-sprint**: Verificar separação correta de tempos entre sprints

