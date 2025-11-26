# Métricas de Performance

Especificação técnica das métricas de performance do Sprint Analysis Dashboard.

> 💡 **Nota Visual:** Diagramas de fluxo de cálculo e exemplos visuais podem ser adicionados. Veja [Guia de Melhorias Visuais](GUIA_MELHORIAS_VISUAIS.md) para recomendações específicas.

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

1. **Status totalmente concluído:** Apenas `concluído` ou `concluido` são considerados. Status intermediários como `teste`, `teste dev`, `teste gap` e `compilar` **NÃO** são contabilizados na análise de performance.
   - **Nota Importante:** A análise de performance usa um critério mais restritivo que outras áreas do sistema. Enquanto o "Sprint Ativo" e outras funcionalidades consideram tarefas em status intermediários (teste, compilar, etc.) como concluídas, a análise de performance exige que a tarefa esteja realmente finalizada (status "concluído" ou "concluido").
2. Sprint definido: Tarefa deve ter sprint não vazio. Tarefas sem sprint = backlog, não contam
3. Estimativa presente: Tarefa deve ter estimativa > 0
4. Worklog presente: Para cálculo de tempo gasto (se ausente, tempo gasto = 0)

**Exclusões:**
- Tarefas de backlog (sem sprint): NÃO interferem em métricas de performance, mesmo que tenham worklog e estejam concluídas
- Tarefas em progresso ou status intermediários (status diferente de "concluído" ou "concluido"): Tarefas em "teste", "teste dev", "teste gap" ou "compilar" não são contabilizadas na análise de performance
- Tarefas marcadas como "Reunião" (neutras, não afetam score)
- Tarefas marcadas como "ImpedimentoTrabalho" com tipo "Testes": Importadas para contabilização de horas, mas EXCLUÍDAS de todos os cálculos de performance/score
- Tarefas sem estimativa (aparecem apenas em métricas informativas)

## Performance Score

Score geral combinando qualidade e eficiência de execução.

### Fórmula

```
Base Score (0-100) = (Qualidade × 0.50) + (Eficiência de Execução × 0.50)

Performance Score = Base Score + Bonus Senioridade (0-15) + Bonus Competência (0-5) + Bonus Auxílio (0-10)

Score Máximo: 130
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
- **Pontuação Ponderada (com bonificação progressiva):**
  - **Bugs na Zona Eficiente:**
    - **Complexidade 1-2:**
      - Eficiência < 25%: **1.0 ponto**
      - Eficiência >= 25%: **1.2 pontos** (bonificação máxima para complexidade baixa)
    - **Complexidade 3-5:**
      - Eficiência < 25%: **1.0 ponto**
      - Eficiência >= 25% e < 50%: **1.2 pontos** (bonificação)
      - Eficiência >= 50%: **1.5 pontos** (bonificação máxima)
    - Cálculo de eficiência: `(maxEfficientHours - hoursSpent) / maxEfficientHours × 100`
  - **Features com Desvio Positivo (mais rápido que estimado):**
    - **Complexidade 1-2:**
      - Desvio < 25%: **1.0 ponto**
      - Desvio >= 25%: **1.2 pontos** (bonificação máxima para complexidade baixa)
    - **Complexidade 3-5:**
      - Desvio < 25%: **1.0 ponto**
      - Desvio >= 25% e < 50%: **1.2 pontos** (bonificação)
      - Desvio >= 50%: **1.5 pontos** (bonificação máxima)
  - **Features com Desvio Negativo (dentro da tolerância):** **1.0 ponto** (sem bonificação)
  - Bug na Zona Aceitável = **0.5 pontos** (sem bonificação)
  - Tarefa Ineficiente = **0 pontos**

**3. Bônus de Senioridade (0-15):**
- Fórmula: `(% de tarefas complexas nível 4-5 eficientes com nota de teste ≥ 4 / 100) × 15`
- Aplica para Features e Bugs complexos (nível 4-5)
- Apenas tarefas altamente eficientes e com nota de teste ≥ 4 contam (zona aceitável não conta)
- Arredondamento: `Math.round()`

**4. Bônus de Competência (0-5):**
- Fórmula: `(% de tarefas de média complexidade nível 3 eficientes com nota de teste ≥ 4 / 100) × 5`
- Aplica para Features e Bugs de nível 3.
- Apenas tarefas altamente eficientes e com nota de teste ≥ 4 contam.

**5. Bônus de Auxílio (0-10):**
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
- **Regra Especial - Tarefas de Auxílio que Atravessam Sprints:**
  - Cada desenvolvedor possui **uma única tarefa de auxílio** que nunca é concluída
  - Esta tarefa é alocada em um sprint, trabalhada com worklog, e quando o sprint encerra e outro inicia, a tarefa é movida para o próximo sprint
  - Para o cálculo do bônus, o sistema considera **todas as tarefas de auxílio do desenvolvedor** e soma apenas o `tempoGastoNoSprint` calculado para o sprint que está sendo analisado
  - Isso significa que o bônus reflete exatamente as horas de auxílio registradas no worklog durante o período do sprint analisado, **independentemente do sprint ao qual a tarefa está atualmente alocada**
  - O bônus é calculado **independentemente do status de conclusão** da tarefa de auxílio

### Classificações de Score

| Range | Classificação |
|-------|--------------|
| 115-130 | Excepcional |
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
| 1 | ≤ 1.5h | 1.5h < x ≤ 3h | > 3h |
| 2 | ≤ 3h | 3h < x ≤ 5h | > 5h |
| 3 | ≤ 5h | 5h < x ≤ 9h | > 9h |
| 4 | ≤ 9h | 9h < x ≤ 17h | > 17h |
| 5 | ≤ 17h | 17h < x ≤ 30h | > 30h |

**Cálculo de eficiência para Bugs:**
- Se horas gastas ≤ maxEfficientHours: **Eficiente** (pontos variam conforme eficiência e complexidade)
  - **Complexidade 1-2:**
    - Eficiência < 25%: **1.0 ponto**
    - Eficiência >= 25%: **1.2 pontos** (bonificação máxima para complexidade baixa)
  - **Complexidade 3-5:**
    - Eficiência < 25%: **1.0 ponto**
    - Eficiência >= 25% e < 50%: **1.2 pontos** (bonificação)
    - Eficiência >= 50%: **1.5 pontos** (bonificação máxima)
  - Cálculo de eficiência: `(maxEfficientHours - hoursSpent) / maxEfficientHours × 100`
- Se horas gastas ≤ maxAcceptableHours e > maxEfficientHours: **Aceitável = 0.5 pontos** (sem bonificação)
- Se horas gastas > maxAcceptableHours: **Ineficiente = 0 pontos**

**IMPORTANTE:** A "Zona Aceitável" concede **0.5 pontos** para o cálculo da Eficiência de Execução, refletindo uma contribuição parcial. No entanto, para o bônus de Senioridade, tarefas na zona aceitável ainda são consideradas **ineficientes** e não contribuem com pontos.

**Exemplo:**
- Bug complexidade 1 gastou 1.5h = ✅ eficiente (1.0 pt - no limite)
- Bug complexidade 1 gastou 1.0h = ✅ eficiente (1.2 pts - 33% mais eficiente, bonificação! Máx para complexidade 1)
- Bug complexidade 1 gastou 0.5h = ✅ eficiente (1.2 pts - 67% mais eficiente, mas máximo é 1.2 para complexidade 1)
- Bug complexidade 1 gastou 2.5h = ⚠️ aceitável (0.5 pts - sem bonificação)
- Bug complexidade 3 gastou 5h = ✅ eficiente (1.0 pt - no limite)
- Bug complexidade 3 gastou 3h = ✅ eficiente (1.2 pts - 40% mais eficiente, bonificação!)
- Bug complexidade 5 gastou 17h = ✅ eficiente (1.0 pt - no limite)
- Bug complexidade 5 gastou 8.5h = ✅ eficiente (1.5 pts - 50% mais eficiente, bonificação máxima!)

**FEATURES/OUTROS (Todas complexidades):**
- Usa desvio percentual entre estimativa original vs tempo gasto total
- Fórmula de desvio: `((Tempo Estimado - Tempo Gasto) / Tempo Estimado) × 100`
- Valores positivos = executou mais rápido que estimado (superestimou)
- Valores negativos = executou mais devagar que estimado (subestimou)

**Limites de tolerância por complexidade:**

image.png| Complexidade | Limite Inferior (atraso permitido) |
|--------------|----------------------------------|
| 1            | -15%                             |
| 2            | -20%                             |
| 3            | -25%                             |
| 4            | -30%                             |
| 5            | -35%                             |

**Cálculo de eficiência para Features:**
- Se desvio > 0 (executou mais rápido): Eficiente (pontos variam conforme desvio e complexidade)
  - **Complexidade 1-2:**
    - Desvio < 25%: **1.0 ponto**
    - Desvio >= 25%: **1.2 pontos** (bonificação máxima para complexidade baixa)
  - **Complexidade 3-5:**
    - Desvio < 25%: **1.0 ponto**
    - Desvio >= 25% e < 50%: **1.2 pontos** (bonificação)
    - Desvio >= 50%: **1.5 pontos** (bonificação máxima)
- Se desvio ≤ 0 e desvio >= limite inferior (ex: -25% para complexidade 3): Eficiente = **1.0 ponto** (sem bonificação)
- Se desvio < limite inferior: Ineficiente = **0 pontos**

**Regra:** Executar mais rápido que o estimado é sempre considerado eficiente, com bonificação progressiva baseada na complexidade. Apenas o atraso além da tolerância é ineficiente.

**Exemplo:**
- Feature complexidade 1: estimou 10h, gastou 4h = +60% = ✅ eficiente (1.2 pts - bonificação máxima para complexidade 1!)
- Feature complexidade 1: estimou 10h, gastou 7.5h = +25% = ✅ eficiente (1.2 pts - bonificação!)
- Feature complexidade 1: estimou 10h, gastou 9h = +10% = ✅ eficiente (1.0 pt)
- Feature complexidade 1: estimou 10h, gastou 11.5h = -15% (≥-15%) = ✅ eficiente (1.0 pt - sem bonificação)
- Feature complexidade 1: estimou 10h, gastou 12h = -20% (< -15%) = ❌ ineficiente (0 pts)
- Feature complexidade 3: estimou 10h, gastou 4h = +60% = ✅ eficiente (1.5 pts - bonificação máxima!)
- Feature complexidade 5: estimou 30h, gastou 40.5h = -35% (≥-35%) = ✅ eficiente (1.0 pt - sem bonificação)

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

## Bônus
 
 ### Bônus de Senioridade
 
 - **O que é:** Recompensa executar tarefas complexas (nível 4-5, incluindo bugs) com alta eficiência e alta qualidade.
 - **Cálculo:** `% de tarefas complexas eficientes com nota de teste ≥ 4 × 15`.

### Bônus de Competência

- **O que é:** Recompensa executar tarefas de média complexidade (nível 3) com alta eficiência e alta qualidade.
- **Cálculo:** `% de tarefas médias eficientes com nota de teste ≥ 4 × 5`.
 
 ### Bônus de Auxílio
 
 - **O que é:** Recompensa ajudar outros desenvolvedores.
 - **Cálculo:** Baseado na quantidade de horas gastas em tarefas de "Auxílio".
 
## Score de Performance Final (Máx 130)
 
 O score final é a soma do Score Base com todos os bônus aplicáveis.
 
 `Score Base (0-100) + Bônus Senioridade (0-15) + Bônus Competência (0-5) + Bônus Auxílio (0-10)`

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

**Tarefas marcadas como "ImpedimentoTrabalho" (tipo "Testes"):**
- Campo "Detalhes Ocultos" = "ImpedimentoTrabalho" (normalização case-insensitive, sem acentos)
- Campo "Tipo de item" = "Testes" (normalizado para "Outro" no sistema)
- Identificação: normalização NFD + lowercase compara "impedimentotrabalho" e verifica se tipo é "Outro" ou "Testes"
- Variantes aceitas: "ImpedimentoTrabalho", "ImpediimentoTrabalho" (com dois 'i'), "impedimentotrabalho", etc. (todos reconhecidos após normalização que trata múltiplos 'i' consecutivos)
- ✅ **Horas são contabilizadas normalmente:** As horas trabalhadas aparecem no worklog e nas análises de horas totais
- ❌ **EXCLUÍDAS de Performance Score:** Não afetam nenhum cálculo de performance, eficiência, qualidade ou score
- ❌ **EXCLUÍDAS de análises de capacidade:** Não são consideradas em análises de capacidade, planejamento de sprints ou recomendações de alocação
- ❌ **EXCLUÍDAS de métricas de desenvolvedor:** Não afetam accuracy rate, quality score, performance score, etc.
- ❌ **EXCLUÍDAS de cálculos de eficiência:** Não são consideradas no cálculo de eficiência de execução
- ❌ **EXCLUÍDAS de cálculos de qualidade:** Não são consideradas no cálculo de quality score
- São excluídas do conjunto de tarefas de trabalho (`workTasks`)
- O tempo é contabilizado apenas para fins de rastreamento e relatórios, mas não para avaliação de desempenho

## Referências

- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Sistema híbrido de cálculo
- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura dos arquivos de entrada
