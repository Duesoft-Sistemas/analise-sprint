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
- Nota de Teste (1 a 5, vazio = não aplicável para o cálculo)

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

Performance Score = Base Score + Bonus Complexidade (0-10) + Bonus Senioridade (0-15) + Bonus Complexidade 3 (0-5) + Bonus Auxílio (0-10) + Bonus Horas Extras (0-10)

Score Máximo: 150
```

### Componentes

**1. Qualidade (50%):**
- Fórmula: `Nota de Teste Média × 20`
- Range: 0-100 pontos
- Nota de teste: 1-5. Tarefas sem nota de teste são excluídas do cálculo de qualidade.
- **Caso Especial:** Se um desenvolvedor não tiver NENHUMA tarefa com nota de teste no sprint, a componente de Qualidade não é considerada no cálculo do `Base Score`. Nesse caso, `Base Score = Eficiência de Execução`.

**2. Eficiência de Execução (50%):**
- Fórmula: `(Pontuação Ponderada de Eficiência / Total de Tarefas) × 100`
- Range: 0-100 pontos
- Sistema de avaliação separado para Bugs e Features (ver seção Eficiência de Execução)
- **Pontuação Ponderada:**
  - Tarefa Eficiente (Feature ou Bug na zona eficiente) = **1.0 ponto**
  - Bug na Zona Aceitável = **0.5 pontos**
  - Tarefa Ineficiente = **0 pontos**

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

**7. Bonus de Horas Extras (0-10):**
- Reconhece esforço adicional em momentos difíceis quando a qualidade é mantida alta (nota média das tarefas com "HoraExtra" ≥ 4.0).
- Escala progressiva similar ao bônus de auxílio, baseada nas horas totais que excedem 40h/semana.

### Classificações de Score

| Range | Classificação |
|-------|--------------|
| 115-150 | Excepcional |
| 90-114 | Excelente |
| 75-89 | Muito Bom |
| 60-74 | Bom |
| 45-59 | Adequado |
| <45 | Precisa Atenção |

## Métricas de Qualidade

### Quality Score

**Fórmula:** `Nota de Teste Média × 20`

**Sistema de Nota de Teste:**
- Apenas tarefas com nota de teste preenchida são consideradas no cálculo
- Nota 5: 100 pontos
- Nota 4: 80 pontos
- Nota 3: 60 pontos
- Nota 2: 40 pontos
- Nota 1: 20 pontos

**Caso Especial (Sem Nota de Teste):**
- Se um desenvolvedor não tiver NENHUMA tarefa com nota de teste, a componente de Qualidade não é utilizada no cálculo do `Base Score`.
- Nesse cenário, `Base Score = Eficiência de Execução`. A qualidade não é penalizada (considerada 0), mas sim desconsiderada, para não prejudicar o desenvolvedor por falta de dados de teste.

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
- Se horas gastas ≤ maxEfficientHours: **Eficiente = 1.0 ponto** (zona eficiente)
- Se horas gastas ≤ maxAcceptableHours e > maxEfficientHours: **Aceitável = 0.5 pontos**
- Se horas gastas > maxAcceptableHours: **Ineficiente = 0 pontos**

**IMPORTANTE:** A "Zona Aceitável" agora concede **0.5 pontos** para o cálculo da Eficiência de Execução, refletindo uma contribuição parcial. No entanto, para os bônus de Senioridade e Complexidade 3, tarefas na zona aceitável ainda são consideradas **ineficientes** e não contribuem com pontos.

**Exemplo:**
- Bug complexidade 1 gastou 2h = ✅ eficiente (1.0 pt)
- Bug complexidade 1 gastou 3h = ⚠️ aceitável (0.5 pts)
- Bug complexidade 5 gastou 30h = ✅ eficiente (1.0 pt)
- Bug complexidade 5 gastou 35h = ⚠️ aceitável (0.5 pts)

**FEATURES/OUTROS (Todas complexidades):**
- Usa desvio percentual entre estimativa original vs tempo gasto total
- Fórmula de desvio: `((Tempo Estimado - Tempo Gasto) / Tempo Estimado) × 100`
- Valores positivos = executou mais rápido que estimado (superestimou)
- Valores negativos = executou mais devagar que estimado (subestimou)

**Limites de tolerância por complexidade:**

image.png| Complexidade | Limite Inferior (atraso permitido) |
|--------------|----------------------------------|
| 1            | -20%                             |
| 2            | -25%                             |
| 3            | -30%                             |
| 4            | -35%                             |
| 5            | -40%                             |

**Cálculo de eficiência para Features:**
- Se desvio > 0 (executou mais rápido): Eficiente = **1.0 ponto**
- Se desvio ≤ 0 e desvio >= limite inferior (ex: -30% para complexidade 3): Eficiente = **1.0 ponto**
- Se desvio < limite inferior: Ineficiente = **0 pontos**

**Regra:** Executar mais rápido que o estimado é sempre considerado eficiente. Apenas o atraso além da tolerância é ineficiente.

**Exemplo:**
- Feature complexidade 1: estimou 10h, gastou 4h = +60% = ✅ eficiente (1.0 pt)
- Feature complexidade 1: estimou 10h, gastou 12h = -20% (≥-20%) = ✅ eficiente (1.0 pt)
- Feature complexidade 1: estimou 10h, gastou 12.5h = -25% (< -20%) = ❌ ineficiente (0 pts)
- Feature complexidade 5: estimou 30h, gastou 42h = -40% (≥-40%) = ✅ eficiente (1.0 pt)

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

### Bonus de Horas Extras

**Range:** 0-10 pontos

**Identificação:**
- Campo "Detalhes Ocultos" contém "HoraExtra", "Hora Extra", "Horas Extras" ou "HorasExtras".

**Regra de Qualidade:**
- O bônus só é concedido se a **nota média de teste (≥ 4.0)** de TODAS as tarefas marcadas como "HoraExtra" for alta.
- Tarefas de "Auxílio", "Reunião" e "Treinamento" marcadas como hora extra não entram no cálculo dessa média de qualidade.

**Cálculo:**
- O bônus é calculado com base nas horas totais de **todas as tarefas concluídas** que excederem 40h na semana.
- A escala é progressiva e idêntica à do Bônus de Auxílio.

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
