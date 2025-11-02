# 📋 Plano de Ação: Melhorias no Sistema de Performance

**Data de Criação:** 2025-01-XX  
**Status:** ✅ Implementado  
**Responsável:** AI Assistant

---

## 🎯 Objetivo

Implementar melhorias no sistema de cálculo de performance score para tornar a avaliação mais justa e completa, reconhecendo diferentes níveis de complexidade e eficiência.

---

## ✅ Decisões Tomadas

### 1. Peso 50/50 entre Qualidade e Eficiência
**Decisão:** ✅ MANTER como está  
**Justificativa:** Time de teste não é experiente e não avalia código, apenas funcionalidade. Manter equilíbrio entre qualidade e velocidade.

### 2. Bônus de Complexidade 3
**Decisão:** ✅ CRIAR novo bônus  
**Valor:** +5 pontos (máximo)  
**Critério:** Tarefas complexidade 3 executadas com eficiência:
- Features: dentro da tolerância de eficiência (+20%)
- Bugs: zona eficiente apenas (não aceitável)

### 3. Worklog Obrigatório
**Decisão:** ✅ MANTER regra atual (sem fallback)  
**Regra:** Sem worklog = 0 horas = todas tarefas ineficientes  
**Ação:** Melhorar avisos/feedback quando não houver worklog

### 4. Progressão do Bônus de Auxílio
**Decisão:** ✅ IMPLEMENTAR Opção C (escalonamento suave ajustado)  
**Nova escala:**
- 0.5h+ = 1 ponto
- 2h+ = 2 pontos
- 4h+ = 4 pontos (subir de 3)
- 6h+ = 5 pontos (subir de 4)
- 8h+ = 7 pontos (subir de 6)
- 12h+ = 9 pontos (subir de 8)
- 16h+ = 10 pontos (máximo)

### 5. Bônus de Senioridade
**Decisão:** ✅ REMOVER zona aceitável  
**Critério:** Apenas tarefas eficientes contam:
- Features: dentro da tolerância de eficiência
- Bugs: apenas zona eficiente (não aceitável)
- Remover peso 0.5 para bugs na zona aceitável
- Manter apenas para complexidade 4-5

### 6. Tolerância por Complexidade
**Decisão:** ✅ MANTER como está  
**Justificativa:** Tarefas mais complexas são menos previsíveis, tolerância maior é justificada.

---

## 📝 Itens de Implementação

### Item 1: Criar Bônus de Complexidade 3

#### 1.1. Adicionar Constante de Configuração
**Arquivo:** `src/config/performanceConfig.ts`

**Ação:**
- Adicionar constante `MAX_INTERMEDIATE_COMPLEXITY_BONUS = 5`
- Adicionar comentário explicando que é para complexidade 3

**Código sugerido:**
```typescript
/** Bonus máximo por executar tarefas complexidade 3 com alta eficiência */
export const MAX_INTERMEDIATE_COMPLEXITY_BONUS = 5;
```

#### 1.2. Criar Função de Cálculo
**Arquivo:** `src/services/performanceAnalytics.ts`

**Ação:**
- Criar função `calculateIntermediateComplexityBonus()`
- Filtrar tarefas complexidade 3 completadas
- Contar apenas tarefas eficientes (mesma lógica de senioridade):
  - Features: dentro da tolerância
  - Bugs: zona eficiente apenas
- Calcular: `(tarefas eficientes / total complexidade 3) × 5`

**Lógica:**
```typescript
function calculateIntermediateComplexityBonus(
  taskMetrics: TaskPerformanceMetrics[]
): number {
  // Filter complexity 3 tasks that were completed
  const complexity3Tasks = taskMetrics.filter(t => 
    t.complexityScore === 3 && t.hoursEstimated > 0
  );
  
  if (complexity3Tasks.length === 0) return 0;
  
  // Count tasks executed with high efficiency only
  let highlyEfficientComplex3 = 0;
  
  for (const task of complexity3Tasks) {
    if (task.efficiencyImpact && task.efficiencyImpact.type === 'complexity_zone') {
      // Bugs: only efficient zone counts
      if (task.efficiencyImpact.zone === 'efficient') {
        highlyEfficientComplex3++;
      }
    } else {
      // Features: evaluate by percentage deviation
      const deviation = task.estimationAccuracy;
      const threshold = getEfficiencyThreshold(task.complexityScore);
      
      // Only efficient tasks count (within tolerance or faster)
      if (deviation > 0 || (deviation < 0 && deviation >= threshold.slower)) {
        highlyEfficientComplex3++;
      }
    }
  }
  
  // Calculate bonus: 0% efficiency = 0 points, 100% efficiency = +5 points
  const efficiencyScore = highlyEfficientComplex3 / complexity3Tasks.length;
  return Math.round(efficiencyScore * MAX_INTERMEDIATE_COMPLEXITY_BONUS);
}
```

#### 1.3. Integrar no Cálculo do Performance Score
**Arquivo:** `src/services/performanceAnalytics.ts`

**Ação:**
- Adicionar chamada da função em `calculateSprintPerformance()`
- Adicionar campo `intermediateComplexityBonus` no retorno
- Somar ao `performanceScore` final

**Localização:** Função `calculateSprintPerformance()` após cálculo do `seniorityEfficiencyBonus`

**Código:**
```typescript
const intermediateComplexityBonus = calculateIntermediateComplexityBonus(taskMetrics);

// No cálculo final:
performanceScore = baseScore + complexityBonus + seniorityEfficiencyBonus + intermediateComplexityBonus + auxilioBonus;
```

#### 1.4. Atualizar Tipos
**Arquivo:** `src/types/index.ts`

**Ação:**
- Adicionar campo `intermediateComplexityBonus: number` em `SprintPerformanceMetrics`

---

### Item 2: Ajustar Bônus de Auxílio (Opção C)

#### 2.1. Atualizar Função de Cálculo
**Arquivo:** `src/services/performanceAnalytics.ts`

**Ação:**
- Modificar função `calculateAuxilioBonus()` com nova escala

**Código:**
```typescript
function calculateAuxilioBonus(auxilioHours: number): number {
  if (auxilioHours <= 0) return 0;
  
  // Nova escala (escalonamento suave ajustado)
  if (auxilioHours >= 16) return 10;      // 16h+ = 10 pontos (máximo)
  if (auxilioHours >= 12) return 9;       // 12h+ = 9 pontos (subir de 8)
  if (auxilioHours >= 8) return 7;        // 8h+ = 7 pontos (subir de 6)
  if (auxilioHours >= 6) return 5;        // 6h+ = 5 pontos (subir de 4)
  if (auxilioHours >= 4) return 4;        // 4h+ = 4 pontos (subir de 3)
  if (auxilioHours >= 2) return 2;        // 2h+ = 2 pontos (mantém)
  return 1;                                // 0.5h+ = 1 ponto (mantém)
}
```

---

### Item 3: Remover Zona Aceitável do Bônus de Senioridade

#### 3.1. Atualizar Função de Cálculo
**Arquivo:** `src/services/performanceAnalytics.ts`

**Ação:**
- Modificar função `calculateSeniorityEfficiencyBonus()`
- Remover variável `moderatelyEfficientComplex`
- Remover lógica que conta zona aceitável (peso 0.5)
- Contar apenas tarefas altamente eficientes

**Código:**
```typescript
function calculateSeniorityEfficiencyBonus(
  taskMetrics: TaskPerformanceMetrics[]
): number {
  // Filter complex tasks (level 4-5) that were completed
  const complexTasks = taskMetrics.filter(t => 
    t.complexityScore >= 4 && t.hoursEstimated > 0
  );
  
  if (complexTasks.length === 0) return 0;
  
  // Count tasks executed with high efficiency ONLY
  let highlyEfficientComplex = 0;
  
  for (const task of complexTasks) {
    if (task.efficiencyImpact && task.efficiencyImpact.type === 'complexity_zone') {
      // Bugs: only efficient zone counts (remove acceptable)
      if (task.efficiencyImpact.zone === 'efficient') {
        highlyEfficientComplex++;
      }
      // Removed: else if (zone === 'acceptable') - não conta mais
    } else {
      // Features: evaluate by percentage deviation
      const deviation = task.estimationAccuracy;
      const threshold = getEfficiencyThreshold(task.complexityScore);
      
      // Only efficient tasks count (within tolerance or faster)
      if (deviation > 0 || (deviation < 0 && deviation >= threshold.slower)) {
        highlyEfficientComplex++;
      }
    }
  }
  
  // Calculate bonus: 0% efficiency = 0 points, 100% efficiency = +15 points
  const efficiencyScore = highlyEfficientComplex / complexTasks.length;
  return Math.round(efficiencyScore * MAX_SENIORITY_EFFICIENCY_BONUS);
}
```

#### 3.2. Atualizar Comentários e Documentação
**Arquivo:** `src/services/performanceAnalytics.ts`

**Ação:**
- Remover menção a "moderately efficient" nos comentários
- Atualizar descrição da função

---

### Item 4: Melhorar Feedback de Worklog Ausente

#### 4.1. Identificar Onde Mostrar Aviso
**Arquivos a verificar:**
- `src/components/PerformanceDashboard.tsx`
- `src/components/DeveloperPerformanceCard.tsx`
- `src/components/CalculationBreakdownModal.tsx`

**Ação:**
- Adicionar aviso visual quando houver tarefas sem worklog
- Mostrar quantas tarefas estão sem worklog
- Destaque: "Tarefas sem worklog: X (eficiência = 0 para essas tarefas)"

#### 4.2. Atualizar Tipos (se necessário)
**Arquivo:** `src/types/index.ts`

**Ação:**
- Considerar adicionar campo `tasksWithoutWorklog: number` em `SprintPerformanceMetrics` para tracking

---

### Item 5: Atualizar Documentação

#### 5.1. Atualizar Guia do Desenvolvedor
**Arquivo:** `docs/GUIA_DESENVOLVEDOR.md`

**Ações:**
- Adicionar seção sobre bônus de complexidade 3
- Atualizar seção de bônus de senioridade (remover menção a zona aceitável)
- Atualizar escala do bônus de auxílio
- Atualizar exemplos práticos
- Atualizar resumo final

**Mudanças específicas:**
- Seção "Os Bônus (0-40 pontos)" → "Os Bônus (0-40 pontos)" (mantém 40 pontos: 10+15+5+10)
- Adicionar bônus 2.5 ou renumerar: Complexidade 3, Complexidade 4-5, Senioridade, Auxílio
- Atualizar fórmula: `Score = Base + Bonus Complexidade + Bonus Complexidade 3 + Bonus Senioridade + Bonus Auxílio`
- Atualizar máximo: 135 → 140 pontos

#### 5.2. Atualizar Métricas de Performance
**Arquivo:** `docs/METRICAS_PERFORMANCE.md`

**Ações:**
- Adicionar seção sobre bônus de complexidade 3
- Atualizar seção de bônus de senioridade
- Atualizar escala do bônus de auxílio
- Atualizar fórmula do Performance Score

---

### Item 6: Atualizar Componentes UI

#### 6.1. Atualizar Modal de Breakdown
**Arquivo:** `src/components/CalculationBreakdownModal.tsx`

**Ações:**
- Adicionar seção de bônus de complexidade 3
- Atualizar cálculo do bônus de senioridade (remover zona aceitável)
- Atualizar exibição dos bônus

#### 6.2. Atualizar Cards de Performance
**Arquivo:** `src/components/DeveloperPerformanceCard.tsx`

**Ações:**
- Adicionar exibição do bônus de complexidade 3
- Atualizar tooltips/explicações

#### 6.3. Atualizar Dashboard
**Arquivo:** `src/components/PerformanceDashboard.tsx`

**Ações:**
- Atualizar classificação de score (novo máximo: 140)
- Adicionar avisos de worklog ausente

---

## 🔄 Ordem de Implementação Recomendada

### Fase 1: Cálculos Core (Backend)
1. ✅ Item 1: Criar bônus de complexidade 3
2. ✅ Item 2: Ajustar bônus de auxílio
3. ✅ Item 3: Remover zona aceitável do bônus de senioridade

### Fase 2: Tipos e Interfaces
4. ✅ Atualizar tipos TypeScript
5. ✅ Atualizar interfaces

### Fase 3: UI e Feedback
6. ✅ Item 4: Melhorar feedback de worklog
7. ✅ Item 6: Atualizar componentes UI

### Fase 4: Documentação
8. ✅ Item 5: Atualizar toda documentação

---

## ✅ Checklist de Validação

### Antes de Implementar
- [ ] Revisar todas as decisões
- [ ] Confirmar valores e limites
- [ ] Validar lógica de cálculo

### Durante Implementação
- [ ] Implementar mudanças em ordem recomendada
- [ ] Testar cada mudança isoladamente
- [ ] Validar tipos TypeScript

### Após Implementação
- [ ] Testar com dados reais
- [ ] Validar cálculos com casos de teste
- [ ] Verificar UI atualizada
- [ ] Revisar documentação
- [ ] Validar classificação de scores (novo máximo: 140)

---

## 🧪 Casos de Teste Sugeridos

### Teste 1: Bônus de Complexidade 3
**Cenário:** Dev com 4 tarefas complexidade 3
- 3 eficientes, 1 ineficiente
- Esperado: +3.75 pontos (3/4 × 5 = 3.75 → 4 pontos)

### Teste 2: Bônus de Auxílio (Nova Escala)
**Cenário:** Dev com diferentes horas de auxílio
- 3h de auxílio → Esperado: 2 pontos
- 5h de auxílio → Esperado: 4 pontos (nova escala)
- 11h de auxílio → Esperado: 9 pontos (nova escala)
- 17h de auxílio → Esperado: 10 pontos (máximo)

### Teste 3: Bônus de Senioridade (Sem Zona Aceitável)
**Cenário:** Dev com 2 bugs complexidade 4
- 1 na zona eficiente, 1 na zona aceitável
- Esperado: +7.5 pontos (1/2 × 15 = 7.5 → 8 pontos)
- **Antes:** Seria +11.25 pontos (1 × 1.0 + 1 × 0.5) / 2 × 15

### Teste 4: Score Máximo
**Cenário:** Dev perfeito com todos os bônus
- Base: 100 pontos
- Complexidade 4-5: +10 pontos
- Complexidade 3: +5 pontos
- Senioridade: +15 pontos
- Auxílio: +10 pontos
- **Esperado:** 140 pontos (novo máximo)

---

## 📊 Impacto das Mudanças

### Mudanças nos Scores

**Antes:**
- Máximo: 135 pontos
- Bônus: Complexidade (0-10), Senioridade (0-15), Auxílio (0-10)

**Depois:**
- Máximo: 140 pontos
- Bônus: Complexidade 4-5 (0-10), Complexidade 3 (0-5), Senioridade (0-15), Auxílio (0-10)

### Impacto Esperado
- ✅ Maior reconhecimento para quem executa complexidade 3 bem
- ✅ Progressão mais justa do bônus de auxílio
- ✅ Bônus de senioridade mais rigoroso (apenas eficiente)
- ✅ Lógica mais consistente entre métricas

---

## 🎯 Próximos Passos

1. **Revisar este documento** - Confirmar todas as decisões
2. **Implementar mudanças** - Seguir ordem recomendada
3. **Testar** - Validar com casos de teste e dados reais
4. **Atualizar documentação** - Garantir que guias estão atualizados
5. **Comunicar** - Informar desenvolvedores sobre mudanças

---

**Nota:** Este documento serve como guia para implementação. Ajustes podem ser necessários durante o desenvolvimento.
