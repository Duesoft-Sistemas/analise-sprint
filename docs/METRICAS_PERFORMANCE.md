# Métricas de Performance

Especificação técnica das métricas de performance do Sprint Analysis Dashboard.

## Visão Geral

Sistema fornece três níveis de análise:
1. Por Tarefa: Métricas individuais
2. Por Sprint: Agregação por sprint
3. Todos os Sprints: Análise histórica e tendências

## Dados Necessários

**Obrigatórios:**
- Tempo estimado
- Tempo gasto (do worklog)
- Status
- Responsável

**Opcionais:**
- Tipo de item (Bug, Tarefa, História, Outro)
- Retrabalho (Sim/Não)
- Complexidade (1 a 5)
- Nota de Teste (1 a 5, vazio = 5)

## Critérios de Inclusão

Apenas tarefas que atendem TODOS os critérios são consideradas nos cálculos de performance:

1. Status concluído: `teste`, `teste gap`, `compilar`, `concluído`, `concluido`
2. Sprint definido: Tarefa deve ter sprint não vazio. Tarefas sem sprint = backlog, não contam
3. Estimativa presente: Tarefa deve ter estimativa > 0
4. Worklog presente: Para cálculo de tempo gasto (se ausente, tempo gasto = 0)

**Exclusões:**
- Tarefas de backlog (sem sprint): NÃO interferem em métricas de performance, mesmo que tenham worklog e estejam concluídas
- Tarefas em progresso (status diferente de concluído)
- Tarefas marcadas como "Reunião" (neutras, não afetam score)
- Tarefas sem estimativa (aparecem apenas em métricas informativas)

## Performance Score

Score geral combinando qualidade e eficiência de execução.

### Fórmula

```
Base Score (0-100) = (Qualidade × 0.50) + (Eficiência de Execução × 0.50)

Performance Score = Base Score + Bonus Complexidade (0-10) + Bonus Senioridade (0-15) + Bonus Complexidade 3 (0-5) + Bonus Auxílio (0-10)

Score Máximo: 140
```

### Componentes

**1. Qualidade (50%):**
- Fórmula: `Nota de Teste Média × 20`
- Range: 0-100 pontos
- Nota de teste: 1-5, vazio = 5 (padrão)

**2. Eficiência de Execução (50%):**
- Fórmula: `(Tarefas eficientes / Total de Tarefas) × 100`
- Range: 0-100 pontos
- Sistema de avaliação separado para Bugs e Features (ver seção Eficiência de Execução)

**3. Bonus de Complexidade (0-10):**
- Fórmula: `(% de tarefas complexas nível 4-5 / 100) × 10`
- Arredondamento: `Math.round()`

**4. Bonus de Senioridade (0-15):**
- Fórmula: `(% de tarefas complexas nível 4-5 eficientes / 100) × 15`
- Aplica para Features e Bugs complexos (nível 4-5)
- Apenas tarefas altamente eficientes contam (zona aceitável não conta)
- Arredondamento: `Math.round()`

**5. Bonus de Complexidade 3 (0-5):**
- Fórmula: `(% de tarefas complexidade 3 eficientes / 100) × 5`
- Aplica para Features e Bugs complexidade 3
- Features: dentro da tolerância de eficiência (+20%)
- Bugs: zona eficiente apenas (não aceitável)
- Arredondamento: `Math.round()`

**6. Bonus de Auxílio (0-10):**
- Escala progressiva baseada em horas de auxílio
- Identificação: Campo "Detalhes Ocultos" = "Auxilio" (case-insensitive)
- Função de cálculo:
  ```
  auxilioHours >= 16: 10 pontos
  auxilioHours >= 12: 9 pontos
  auxilioHours >= 8: 7 pontos
  auxilioHours >= 6: 5 pontos
  auxilioHours >= 4: 4 pontos
  auxilioHours >= 2: 2 pontos
  auxilioHours >= 0.5: 1 ponto
  auxilioHours < 0.5: 0 pontos
  ```

### Classificações de Score

| Range | Classificação |
|-------|--------------|
| 115-140 | Excepcional |
| 90-114 | Excelente |
| 75-89 | Muito Bom |
| 60-74 | Bom |
| 45-59 | Adequado |
| <45 | Precisa Atenção |

## Métricas de Qualidade

### Quality Score

**Fórmula:** `Nota de Teste Média × 20`

**Sistema de Nota de Teste:**
- Nota 5: 100 pontos (padrão quando vazio)
- Nota 4: 80 pontos
- Nota 3: 60 pontos
- Nota 2: 40 pontos
- Nota 1: 20 pontos

### Taxa de Retrabalho

**Fórmula:** `(Tarefas com Retrabalho = Sim / Total de Tarefas) × 100`

**Validação:**
- Campo "Campo personalizado (Retrabalho)" = "Sim", "Yes", "S" (comparação case-insensitive)
- Considera apenas tarefas concluídas com estimativa > 0
- Valores aceitos: "Sim", "sim", "SIM", "Yes", "yes", "S", "s"
- Qualquer outro valor (incluindo vazio) = não é retrabalho

### Taxa de Bugs

**Fórmula:** `(Tarefas tipo Bug / Total de Tarefas) × 100`

**Observação:** Métrica informativa, não impacta Performance Score.

## Métricas de Eficiência

### Eficiência de Execução

**Fórmula:** `(Tarefas eficientes / Total de Tarefas) × 100`

**Sistema de Avaliação:**

**BUGS (Complexidades 1-5):**
- Usa zona de complexidade baseada APENAS em horas gastas (não usa estimativa)
- Avaliação por zona de eficiência:

| Complexidade | Zona Eficiente (horas) | Zona Aceitável (horas) | Zona Ineficiente |
|--------------|----------------------|----------------------|------------------|
| 1 | ≤ 2h | 2h < x ≤ 4h | > 4h |
| 2 | ≤ 4h | 4h < x ≤ 8h | > 8h |
| 3 | ≤ 8h | 8h < x ≤ 16h | > 16h |
| 4 | ≤ 16h | 16h < x ≤ 32h | > 32h |
| 5 | ≤ 32h | 32h < x ≤ 40h | > 40h |

**Cálculo de eficiência para Bugs:**
- Se horas gastas ≤ maxEfficientHours: Eficiente = true (zona eficiente)
- Se horas gastas ≤ maxAcceptableHours e > maxEfficientHours: Eficiente = false (zona aceitável não conta mais)
- Se horas gastas > maxAcceptableHours: Eficiente = false (zona ineficiente)

**IMPORTANTE:** A "Zona Aceitável" existe como uma classificação para identificar tarefas que excederam o tempo ideal, mas não de forma crítica. No entanto, para todos os cálculos de pontuação (Eficiência de Execução e bônus), as tarefas na Zona Aceitável são consideradas **ineficientes**. Apenas a "Zona Eficiente" contribui positivamente para o score.

**Exemplo:**
- Bug complexidade 1 gastou 2h = ✅ eficiente (≤2h)
- Bug complexidade 1 gastou 3h = ❌ ineficiente (zona aceitável não conta)
- Bug complexidade 5 gastou 30h = ✅ eficiente (≤32h)
- Bug complexidade 5 gastou 35h = ❌ ineficiente (zona aceitável não conta mais)

**FEATURES/OUTROS (Todas complexidades):**
- Usa desvio percentual entre estimativa original vs tempo gasto total
- Fórmula de desvio: `((Tempo Estimado - Tempo Gasto) / Tempo Estimado) × 100`
- Valores positivos = executou mais rápido que estimado (superestimou)
- Valores negativos = executou mais devagar que estimado (subestimou)

**Limites de tolerância por complexidade:**

| Complexidade | Limite Superior (mais rápido) | Limite Inferior (atraso permitido) |
|--------------|----------------------------|----------------------------------|
| 1 | +50% | -15% |
| 2 | +50% | -18% |
| 3 | +50% | -20% |
| 4 | +50% | -30% |
| 5 | +50% | -40% |

**Cálculo de eficiência para Features:**
- Se desvio > 0 (executou mais rápido): Eficiente = true SE desvio ≤ +50%
- Se desvio ≤ 0 e desvio >= limite inferior (ex: -20% para complexidade 3): Eficiente = true
- Se desvio < limite inferior: Eficiente = false

**Regra:** Executar até 50% mais rápido = sempre eficiente (até o limite superior).

**Exemplo:**
- Feature complexidade 1: estimou 10h, gastou 8h = +20% (≤+50%) = ✅ eficiente
- Feature complexidade 1: estimou 10h, gastou 11h = -10% (≥-15%) = ✅ eficiente
- Feature complexidade 1: estimou 10h, gastou 12h = -20% (<-15%) = ❌ ineficiente
- Feature complexidade 5: estimou 30h, gastou 35h = -16.67% (≥-40%) = ✅ eficiente

### Taxa de Conclusão

**Fórmula:** `(Tarefas Concluídas / Tarefas Iniciadas) × 100`

**Observação:** Métrica informativa, não impacta Performance Score.

### Taxa de Utilização

**Fórmula:** `(Total de Horas Trabalhadas / 40h) × 100`

**Observação:** Métrica de contexto, não impacta Performance Score. Usada para identificar sobrecarga.

## Métricas de Acurácia (Informativas)

**IMPORTANTE:** Estas métricas refletem o processo de estimativa da equipe/analista, não responsabilidade individual do desenvolvedor.

### Desvio de Estimativa

**Fórmula:** `((Tempo Estimado - Tempo Gasto) / Tempo Estimado) × 100`

**Interpretação:**
- Valores negativos: Subestimou (gastou mais que estimado)
- Valores positivos: Superestimou (gastou menos que estimado)
- Valor zero: Estimativa perfeita

### Taxa de Acurácia

**Fórmula:** `(Tarefas dentro de ±20% / Total de Tarefas) × 100`

Percentual de tarefas onde o tempo gasto ficou dentro de ±20% da estimativa.

## Bonus de Complexidade, Senioridade e Auxílio

### Bonus de Complexidade (4-5)

**Range:** 0-10 pontos

**Cálculo:**
```
% tarefas complexas (nível 4-5) = (Tarefas complexas / Total de tarefas) × 100
Bonus = Math.round((% tarefas complexas / 100) × 10)
```

**Definição:**
- Tarefas complexas: `complexidade >= 4`

### Bonus de Senioridade

**Range:** 0-15 pontos

**Aplicação:** Features e Bugs complexos (nível 4-5)

**Cálculo:**
```
1. Filtrar tarefas complexas (nível 4-5) concluídas
2. Contar tarefas eficientes:
   - Features: dentro da tolerância de eficiência (ver seção Eficiência)
   - Bugs: zona eficiente apenas (zona aceitável não conta)
3. % eficiência = (Tarefas eficientes / Total tarefas complexas) × 100
4. Bonus = Math.round((% eficiência / 100) × 15)
```

**Critério de eficiência para Features complexas:**
- Desvio >= -30% (complexidade 4) ou >= -40% (complexidade 5)
- OU desvio > 0 (executou mais rápido, até +50%)

**Critério de eficiência para Bugs complexos:**
- Horas gastas ≤ maxEfficientHours para a complexidade
- Zona aceitável NÃO conta

### Bonus de Complexidade 3

**Range:** 0-5 pontos

**Aplicação:** Features e Bugs complexidade 3

**Cálculo:**
```
1. Filtrar tarefas complexidade 3 concluídas
2. Contar tarefas eficientes:
   - Features: dentro da tolerância de eficiência (+20%)
   - Bugs: zona eficiente apenas (≤ 8h)
3. % eficiência = (Tarefas eficientes / Total tarefas complexidade 3) × 100
4. Bonus = Math.round((% eficiência / 100) × 5)
```

**Critério de eficiência para Features complexidade 3:**
- Desvio >= -20%
- OU desvio > 0 (executou mais rápido, até +50%)

**Critério de eficiência para Bugs complexidade 3:**
- Horas gastas ≤ 8h
- Zona aceitável (8h < x ≤ 16h) NÃO conta

### Bonus de Auxílio

**Range:** 0-10 pontos

**Identificação:**
- Campo "Detalhes Ocultos" = "Auxilio" (normalização case-insensitive, sem acentos)
- Identificação: normalização NFD + lowercase compara com "auxilio"
- Variantes aceitas: "Auxilio", "auxilio", "Auxílio", "AUXILIO", etc. (todos reconhecidos)

**Cálculo:**
```
auxilioHours = soma de tempoGastoNoSprint de tarefas marcadas como "Auxilio"

Função calculateAuxilioBonus(auxilioHours):
  if auxilioHours <= 0: return 0
  if auxilioHours >= 16: return 10
  if auxilioHours >= 12: return 9
  if auxilioHours >= 8: return 7
  if auxilioHours >= 6: return 5
  if auxilioHours >= 4: return 4
  if auxilioHours >= 2: return 2
  return 1  // 0.5h < auxilioHours < 2h
```

**Observação:** Usa `tempoGastoNoSprint` (tempo gasto no sprint atual) para cálculo.

**Intervalos da Escala:**
- [0, 0.5h): 0 pontos
- [0.5h, 2h): 1 ponto
- [2h, 4h): 2 pontos
- [4h, 6h): 4 pontos
- [6h, 8h): 5 pontos
- [8h, 12h): 7 pontos
- [12h, 16h): 9 pontos
- [16h, ∞): 10 pontos (máximo)

## Casos Especiais e Edge Cases

### Tarefas sem Worklog

**Comportamento:**
- `tempoGastoTotal = 0`
- `tempoGastoNoSprint = 0`
- Todas as tarefas são consideradas ineficientes no cálculo de eficiência
- Impacto: Eficiência de Execução = 0% se todas as tarefas não tiverem worklog

### Tarefas de Backlog (sem sprint)

**Comportamento:**
- NÃO são processadas para cálculos híbridos
- Worklog de tarefas sem sprint é ignorado
- NÃO aparecem em métricas de performance
- NÃO contam no cálculo de Performance Score
- São exibidas apenas na análise de backlog (aba multi-sprint)
- São contabilizadas nas horas de backlog (baseado na estimativa apenas)

### Tarefas marcadas como "Reunião"

**Comportamento:**
- Campo "Detalhes Ocultos" = "Reunião" ou "Reuniao" (normalização case-insensitive, sem acentos)
- Identificação: normalização NFD + lowercase compara "reuniao" ou "reunioes"
- Variantes aceitas: "Reunião", "reuniao", "Reuniao", "REUNIÃO", etc. (todos reconhecidos)
- Não afetam Performance Score
- Não são consideradas no cálculo de eficiência
- Não são consideradas no cálculo de qualidade
- São excluídas do conjunto de tarefas de trabalho (`workTasks`)
- Horas de reunião são exibidas apenas como informação (campo `reunioesHours`)
- Usa `tempoGastoNoSprint` para cálculo de horas de reunião

### Tarefas sem Estimativa

**Comportamento:**
- Aparecem em métricas informativas
- NÃO são consideradas no cálculo de eficiência de execução
- NÃO são consideradas no cálculo de Performance Score

### Tarefas que Atravessam Múltiplos Sprints

**Comportamento:**
- Worklog é separado por data do sprint
- `tempoGastoNoSprint`: soma de worklogs dentro do período do sprint atual
- `tempoGastoOutrosSprints`: soma de worklogs fora do período do sprint atual
- `tempoGastoTotal`: soma de todos os worklogs
- Para análise de sprint atual: usa `tempoGastoNoSprint` e `estimativaRestante`
- Para análise de performance: usa `estimativa` original e `tempoGastoTotal`

**Tarefas marcadas como "Reunião" ou "Treinamento":**
- Campo "Detalhes Ocultos" = "Reunião", "Reuniao", "Treinamento" (normalização case-insensitive, sem acentos)
- Identificação: normalização NFD + lowercase compara "reuniao", "reunioes" ou "treinamento"
- Variantes aceitas: "Reunião", "reuniao", "Treinamento", "treinamento", etc. (todos reconhecidos)
- Não afetam Performance Score
- Não são consideradas no cálculo de eficiência
- Não são consideradas no cálculo de qualidade
- São excluídas do conjunto de tarefas de trabalho (`workTasks`)
- Horas são exibidas apenas como informação (campo `reunioesHours`)
- Usa `tempoGastoNoSprint` para cálculo de horas

## Referências

- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Sistema híbrido de cálculo
- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura dos arquivos de entrada
