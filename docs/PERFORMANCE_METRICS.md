# 📊 Guia de Métricas de Performance

Este documento descreve todas as métricas de performance disponíveis no Sprint Analysis Dashboard, incluindo como são calculadas, como interpretá-las e como usá-las para melhorar o desempenho da equipe.

---

## 📑 Índice

- [Visão Geral](#visão-geral)
- [Métricas de Acurácia](#métricas-de-acurácia)
- [Métricas de Qualidade](#métricas-de-qualidade)
- [Métricas de Eficiência](#métricas-de-eficiência)
- [Score Geral de Performance](#score-geral-de-performance)
- [Análise por Nível](#análise-por-nível)
- [Tendências e Evolução](#tendências-e-evolução)
- [Como Usar as Métricas](#como-usar-as-métricas)
- [Exemplos Práticos](#exemplos-práticos)
- [Perguntas Frequentes](#perguntas-frequentes)

---

## 🎯 Visão Geral

O sistema de análise de performance fornece três níveis de visualização:

1. **Por Tarefa** - Métricas individuais de cada tarefa
2. **Por Sprint** - Agregação das métricas em um sprint específico
3. **Todos os Sprints** - Análise histórica e tendências ao longo do tempo

### Dados Necessários

Para calcular as métricas de performance, são utilizados os seguintes dados do Excel:

- ✅ **Tempo Estimado** - Estimativa original da tarefa
- ✅ **Tempo Gasto** - Tempo real trabalhado
- ✅ **Tipo** - Bug, Tarefa, História ou Outro
- ✅ **Nota de Teste** - Nota da tarefa nos testes (1–5; vazio=5)
- ✅ **Complexidade** - Nível de 1 a 5
- ✅ **Status** - Estado atual da tarefa
- ✅ **Responsável** - Desenvolvedor alocado

**⚠️ IMPORTANTE:** Apenas tarefas com status **concluído** são consideradas nos cálculos de performance. Tarefas pendentes, em progresso ou bloqueadas **não entram** nas métricas de acurácia, qualidade ou score de performance, pois não há dados completos para avaliação justa.

---

## 🎯 Métricas de Acurácia

**⚠️ IMPORTANTE:** As métricas de acurácia medem a **eficiência de execução** do desenvolvedor em relação às estimativas. Embora a qualidade da estimativa inicial seja responsabilidade da equipe/analista, a capacidade de executar dentro do previsto (ou melhor) é um importante indicador de performance individual. Desvios significativos podem indicar:
- **Problema de estimativa** (quando toda a equipe desvia similarmente)
- **Oportunidade de melhoria individual** (quando apenas um desenvolvedor desvia significativamente)
- **Eficiência excepcional** (quando consistentemente entrega mais rápido que estimado)

### 1. Acurácia de Estimativa (Estimation Accuracy)

**Fórmula:**
```
((Tempo Estimado - Tempo Gasto) / Tempo Estimado) × 100
```

**Descrição:**
Mede o desvio percentual entre o tempo estimado e o tempo gasto em cada tarefa.

**Interpretação:**
- **Valores Negativos** = Subestimou (gastou mais que estimado)
- **Valores Positivos** = Superestimou (gastou menos que estimado)
- **Valor Zero** = Estimativa perfeita

**Exemplo:**
```
Estimou: 10h
Gastou: 12h
Cálculo: ((10 - 12) / 10) × 100 = -20%
Interpretação: Subestimou em 20%
```

**Faixas de Avaliação:**
- `±0-10%` - Excelente (estimativa muito precisa)
- `±10-20%` - Bom (dentro do esperado)
- `±20-30%` - Aceitável (precisa melhorar)
- `>±30%` - Ruim (precisa revisão no processo)

---

### 2. Taxa de Acurácia (Accuracy Rate) / Eficiência de Execução ⭐

**Fórmula:**
```
(Tarefas eficientes / Total de Tarefas) × 100

Onde "eficiente" é determinado por SISTEMA SEPARADO (ver abaixo)
```

**Descrição:**
Percentual de tarefas executadas de forma eficiente. Sistema separado: bugs e features têm regras diferentes.

**Faixas de Avaliação:**
- `≥80%` - Excelente
- `70-79%` - Muito Bom
- `60-69%` - Bom
- `50-59%` - Adequado
- `<50%` - Precisa Atenção

**⚡ SISTEMA SEPARADO DE AVALIAÇÃO:**

O sistema usa diferentes regras para diferentes tipos de tarefa:

1. **BUGS - Zona de Eficiência por Complexidade (Complexidades 1-4):**
   - **IMPORTANTE: Usa APENAS horas gastas, NÃO usa a estimativa original**
   - Bugs são imprevisíveis, então não penalizamos por estimativas ruins
   - Detecta bugs simples que levaram tempo excessivo baseado apenas nas horas gastas
   - Exemplo: Bug complexidade 1 gastou 20h → ❌ INEFICIENTE (excede 4h aceitável)
   - Exemplo: Bug complexidade 1 gastou 3h → ✅ EFICIENTE (dentro de 4h aceitável)
   - Aplica apenas para BUGS complexidades 1-4
   - **A estimativa original NÃO é usada nesta avaliação para bugs**

2. **FEATURES/OUTROS - Desvio Percentual (Todas complexidades):**
   - **Usa desvio percentual:** compara estimativa original vs horas gastas
   - Features têm estimativas mais confiáveis, dev deve executar conforme estimado
   - Executar **mais rápido** (até 50% mais rápido) = ✅ SEMPRE BOM
   - Limites ajustados por complexidade: Simples (-15%), Complexa (-30%), Muito Complexa (-40%)
   - Atrasos **além dos limites** = ❌ Ineficiente

3. **COMPLEXIDADE 5 - Desvio Percentual (Ambos):**
   - **Não tem limites de horas absolutos** (tarefas muito imprevisíveis)
   - Bugs e Features usam desvio percentual com tolerância de -40%

**🎯 Por que sistema separado?**

1. **Justo para bugs:**
   - Bugs são imprevisíveis por natureza
   - Não penaliza dev por estimativa ruim do time
   - Usa zona de complexidade como referência

2. **Responsabiliza features:**
   - Features têm estimativas mais confiáveis
   - Dev deve executar conforme planejado
   - Premia eficiência em execução

3. **Reconhece imprevisibilidade de tarefas muito complexas:**
   - Complexidade 5: ambas usam desvio percentual
   - Maior tolerância (-40%)

**Exemplo Real:**
```
Bug complexidade 1: Estima 10h, gasta 3h → ✅ EFICIENTE (zona: ≤4h aceitável)
Feature complexidade 1: Estima 10h, gasta 12h (-20%) → ❌ INEFICIENTE (limite -15%)
Bug complexidade 4: Estima 5h, gasta 12h → ✅ EFICIENTE (zona: ≤32h aceitável)
Feature complexidade 4: Estima 10h, gasta 15h (-50%) → ❌ INEFICIENTE (limite -30%)
Complexidade 5 (qualquer): Estima 30h, gasta 35h (-16%) → ✅ EFICIENTE (limite -40%)
```

---

### 3. Tendência de Estimativa

**Cálculo:**
Baseado na média de desvios de todas as tarefas:
- `Média > +10%` → Tende a **Superestimar**
- `Média < -10%` → Tende a **Subestimar**
- `Média entre -10% e +10%` → **Balanceado**

**Como Usar:**
- **Subestima** → Adicionar buffer ou revisar complexidade
- **Superestima** → Pode alocar mais tarefas com segurança
- **Balanceado** → Processo de estimativa está maduro

---

### 4. Score de Consistência (Consistency Score)

**Fórmula:**
```
100 - (Desvio Padrão das Estimativas / Média × 100)
```

**Descrição:**
Mede a consistência nas estimativas (inverso da variação estatística).

**Interpretação:**
- Score alto = estimativas consistentes
- Score baixo = alta variação (pode indicar dificuldade com certos tipos de tarefa)

**Exemplo:**
```
Desvios: [5%, 10%, 8%, 12%, 6%]
Desvio Padrão: 2.68
Média: 8.2
Coeficiente de Variação: 2.68 / 8.2 = 0.327
Consistency Score: 100 - (0.327 × 50) = 83.65
```

---

## 🏆 Métricas de Qualidade

### 1. Score de Qualidade (Quality Score)

**Fórmula:**
```
Nota de Teste Média × 20
```

**Descrição:**
Score de qualidade baseado exclusivamente na Nota de Teste por tarefa (escala 1–5), escalada para 0–100. Quando a nota não é informada no Excel, considera-se 5 por padrão.

**Interpretação:**
- `80-100` - Excelente
- `60-79` - Bom
- `<60` - Precisa Atenção

**Exemplos:**
```
Nota média 4.5 → 90
Nota média 3.0 → 60
```

---

### 2. Taxa de Retrabalho (Rework Rate)

**Fórmula:**
```
(Tarefas com Retrabalho = Sim / Total de Tarefas) × 100
```

**Descrição:**
Percentual de tarefas que precisaram ser refeitas ou corrigidas. Não compõe o Quality Score (informativa), já que a qualidade é pontuada via Nota de Teste.

**Interpretação:**
Quanto menor, melhor a qualidade do trabalho entregue.

**Exemplo:**
```
10 tarefas:
- 2 foram retrabalho
Taxa de Retrabalho: (2 / 10) × 100 = 20%
```

**Faixas de Avaliação:**
- `0-5%` - Excelente
- `5-10%` - Muito Bom
- `10-20%` - Aceitável
- `>20%` - Precisa Atenção

**Causas Comuns de Alto Retrabalho:**
- Requisitos mal compreendidos
- Testes insuficientes
- Débito técnico
- Complexidade subestimada
- Falta de code review

---

### 2. Taxa de Bugs (Bug Rate)

**Fórmula:**
```
(Tarefas tipo Bug / Total de Tarefas) × 100
```

**Descrição:**
Percentual de tarefas que são correções de bugs.

**Interpretação:**
Taxa alta pode indicar:
- Problemas de qualidade no código
- Módulos legados que precisam refatoração
- Processo de testes inadequado

**Exemplo:**
```
10 tarefas:
- 3 são bugs
- 7 são features/tarefas
Taxa de Bugs: (3 / 10) × 100 = 30%
```

**Análise Contextual:**
- Compare com a média da equipe
- Considere se está trabalhando em módulos legados
- Avalie se está fazendo manutenção vs desenvolvimento novo

---

### 3. Ratio Bugs vs Features

**Fórmula:**
```
Número de Bugs / Número de Features (Tarefas + Histórias)
```

**Descrição:**
Razão entre trabalho corretivo (bugs) e trabalho novo (features).

**Interpretação:**
- `<0.3` - Ótimo (para cada 3+ features, 1 bug)
- `0.3-0.5` - Aceitável (para cada 2-3 features, 1 bug)
- `>0.5` - Atenção (muitos bugs em relação a features)

**Exemplo:**
```
2 bugs + 8 features = 0.25
Interpretação: Para cada 4 features, há 1 bug (ótimo)
```

---

### 4. Nota de Teste (Detalhe)

Usada como base do Quality Score. Escala 1–5 por tarefa; vazio é tratado como 5.

---

## ⚡ Métricas de Eficiência

### 1. Taxa de Conclusão (Completion Rate)

**Fórmula:**
```
(Tarefas Concluídas / Tarefas Iniciadas) × 100
```

**Descrição:**
Percentual de tarefas que foram finalizadas em relação às iniciadas.

**Interpretação:**
- `≥90%` - Excelente
- `80-89%` - Muito Bom
- `70-79%` - Bom
- `<70%` - Pode indicar bloqueios ou interrupções frequentes

**Exemplo:**
```
8 concluídas de 10 iniciadas = 80%
```

**Causas de Baixa Taxa:**
- Tarefas bloqueadas
- Interrupções frequentes
- Tarefas muito grandes
- Prioridades mudando

---

### 2. Tempo Médio para Conclusão (Avg Time to Complete)

**Fórmula:**
```
Soma das Horas Gastas em Tarefas Concluídas / Número de Tarefas Concluídas
```

**Descrição:**
Tempo médio gasto em tarefas que foram finalizadas.

**Como Usar:**
- Compare com estimativas médias
- Identifique se tarefas complexas levam proporcionalmente mais tempo
- Use para calibrar futuras estimativas

### 3. Taxa de Utilização (Utilization Rate) ⚠️

**⚠️ MÉTRICA DE CONTEXTO - NÃO IMPACTA O PERFORMANCE SCORE**

**Fórmula:**
```
(Total de Horas Trabalhadas / 40h) × 100
```

**Descrição:**
Percentual de utilização da capacidade semanal (assumindo 40h/semana).

**Por que não faz parte do score?**
Como todos os desenvolvedores registram aproximadamente 40 horas (incluindo reuniões, bloqueios, etc.), esta métrica não diferencia performance individual. Ela serve apenas como **métrica de contexto** para identificar sobrecarga.

**Interpretação:**
- `>100%` - Sobrecarga (risco de burnout) - **Requer atenção do gestor**
- `80-100%` - Bem utilizado (ideal)
- `60-79%` - Utilização normal
- `<60%` - Pode indicar bloqueios ou tarefas insuficientes

**Exemplo:**
```
36h trabalhadas / 40h = 90% de utilização
```

**Uso Recomendado:**
- **Para gestores**: Identificar desenvolvedores sobrecarregados ou com bloqueios
- **Para planejamento**: Balancear distribuição de tarefas
- **NÃO usar**: Para comparar performance individual

---

## 🎖️ Score Geral de Performance

### Cálculo do Performance Score

**⚠️ IMPORTANTE:** Este score é uma ferramenta de **autoconhecimento e coaching**, não de avaliação de desempenho isolada. Use com contexto e empatia.

**Fórmula Ponderada (com Bonuses de Complexidade e Senioridade):**
```
Score Base = 
  (50% × Score de Qualidade) +
  (50% × Eficiência de Execução)

Bonus de Complexidade = (% de tarefas nível 4-5) × 10
Bonus de Senioridade = (% de eficiência em tarefas complexas) × 15

Performance Score Final = Score Base + Bonus de Complexidade + Bonus de Senioridade
Máximo: 125 pontos 🏆⭐
```

**Componentes:**
1. **Score de Qualidade** (50%) = `Nota de Teste Média × 20`
2. **Eficiência de Execução** (50%) = % de tarefas dentro dos limites ajustados por complexidade
3. **Bonus de Complexidade** (0-10 pontos) = Recompensa por trabalhar em tarefas complexas (níveis 4-5)
4. **Bonus de Senioridade** (0-15 pontos) = 🎯 **Indicador principal de senioridade!** Recompensa executar tarefas complexas com alta eficiência (dentro dos limites de horas esperados)

**📊 Nota sobre Utilização:**
A Taxa de Utilização **NÃO faz mais parte do score** (anteriormente era 25%). Como todos os desenvolvedores registram ~40h, ela não diferencia performance e foi removida para tornar o score mais justo e acionável.

**Sobre Eficiência de Execução:**
- Mede a capacidade do desenvolvedor de executar tarefas dentro do tempo estimado **ajustado por tipo e complexidade**
- **BUGS:** Avaliados por zona de complexidade OU desvio (5)
- **FEATURES:** Avaliadas apenas por desvio, limites: simples (-15%), complexa (-30%), muito complexa (-40%)
- Alta eficiência: consistentemente entrega dentro dos limites
- Baixa eficiência: frequentemente ultrapassa limites (pode indicar necessidade de suporte)
- Considera contexto: juniores esperado ter mais variação

**Sobre Bonus de Complexidade (0-10 pontos):**
- Reconhece que trabalhar em tarefas complexas tem mais valor
- 0% de tarefas complexas = 0 pontos de bonus
- 50% de tarefas complexas = +5 pontos de bonus
- 100% de tarefas complexas = +10 pontos de bonus
- Incentiva desenvolvedores a pegarem tarefas desafiadoras

**Sobre Bonus de Senioridade (0-15 pontos): 🎯**
- **Este é o indicador principal de senioridade!** 
- Recompensa não apenas pegar tarefas complexas, mas **executá-las com alta eficiência**
- **IMPORTANTE:** Aplicado APENAS para FEATURES complexas (bugs são excluídos)
- Calculado baseado na eficiência em tarefas FEATURES complexas:
  - Features eficientes = peso 1.0
  - Features aceitáveis = peso 0.5
  - Features ineficientes = não contam
- 100% de eficiência alta em features complexas = +15 pontos (máximo)
- Por que bugs são excluídos?
  - Bugs são imprevisíveis por natureza
  - Bonus recompensa execução conforme estimativa em features
- Por que vale mais que o bonus de complexidade?
  - **Executar bem** é mais difícil que apenas **pegar** tarefas complexas
  - Indica **senioridade real**: não só aceita desafios, mas os resolve com maestria
  - Recompensa a **eficiência na execução**, não apenas a disponibilidade
  - Este é o indicador de que o dev está **atingindo o ápice** 🏆

**Exemplo:**
```
Desenvolvedor trabalhando em mix de tarefas (60% complexas):

Qualidade: 84 (nota média 4.2)
Eficiência: 80 (80% das tarefas dentro dos limites ajustados)

Score Base = (0.50 × 84) + (0.50 × 80)
Score Base = 42 + 40 = 82

Bonus Complexidade = 0.60 × 10 = 6 pontos
Bonus Senioridade = 0.80 × 15 = 12 pontos ⭐

Score Final = 82 + 6 + 12 = 100 pontos 🏆⭐
```

### Interpretação dos Scores

| Range | Classificação | Descrição |
|-------|--------------|-----------|
| 115-125 | 🏆 Excepcional | Performance excepcional + trabalho em tarefas complexas + execução eficiente (senioridade) ⭐ |
| 90-114 | ⭐⭐⭐⭐⭐ Excelente | Performance excepcional em todas as dimensões |
| 75-89 | ⭐⭐⭐⭐ Muito Bom | Performance acima da média, consistente |
| 60-74 | ⭐⭐⭐ Bom | Performance adequada, algumas áreas para melhorar |
| 45-59 | ⭐⭐ Adequado | Performance aceitável, precisa atenção em algumas áreas |
| <45 | ⭐ Precisa Atenção | Performance abaixo do esperado, necessita melhorias |

**Nota:** Scores acima de 100 indicam excelente performance base (80+) combinada com trabalho significativo em tarefas complexas e execução eficiente das mesmas (bonus de senioridade).

### Coloração Visual

- 🏆 **Excepcional** (115+) - Performance base excelente + bonus de complexidade + bonus de senioridade ⭐
- 🟢 **Verde** (90-99) - Excelente
- 🔵 **Azul** (75-89) - Muito Bom
- 🟡 **Amarelo** (60-74) - Bom
- 🟠 **Laranja** (45-59) - Adequado
- 🔴 **Vermelho** (<45) - Atenção

---

## 📈 Análise por Nível

### Performance por Complexidade

O sistema analisa performance separadamente para cada nível de complexidade (1-5):

**Métricas por Nível:**
- Total de tarefas
- Tempo médio gasto
- Acurácia de estimativa
- Taxa de retrabalho

**Como Usar:**
```
Exemplo de Análise:

Complexidade 1-2 (Simples):
- 10 tarefas
- Acurácia: 95%
- Tempo médio: 2h
→ Excelente em tarefas simples

Complexidade 4-5 (Alta):
- 3 tarefas
- Acurácia: 60%
- Taxa de retrabalho: 33%
→ Dificuldade com tarefas complexas
```

**Insights:**
- Desenvolvedores podem ter perfis diferentes
- Alguns são melhores em tarefas simples e rápidas
- Outros se destacam em desafios complexos

---

### Performance por Tipo de Tarefa

Análise separada por:
- **Bugs** - Correções
- **Tarefas** - Trabalho técnico
- **Histórias** - Funcionalidades
- **Outros** - Diversos

**Uso:**
Identifique em que tipo de trabalho cada desenvolvedor se destaca.

---

## 📊 Tendências e Evolução

### Análise de Tendências

O sistema identifica se o desenvolvedor está:
- 📈 **Melhorando** - Métricas aumentando ao longo dos sprints
- 📉 **Piorando** - Métricas diminuindo
- ➡️ **Estável** - Sem mudanças significativas

**Tendências Calculadas:**
1. **Acurácia** - Estimativas estão ficando mais precisas?
2. **Qualidade** - Taxa de retrabalho está diminuindo?
3. **Produtividade** - Horas trabalhadas estão consistentes?

### Cálculo de Tendência

Usa **regressão linear** nos valores dos últimos sprints:
- Slope > 0.5 → Melhorando
- Slope < -0.5 → Piorando
- Caso contrário → Estável

---

## 💡 Como Usar as Métricas

### 1. Para Desenvolvedores

**Auto-avaliação:**
- ✅ Veja suas métricas individuais
- ✅ Identifique pontos fortes e fracos
- ✅ Estabeleça metas de melhoria
- ✅ Acompanhe sua evolução ao longo do tempo

**Áreas de Foco:**
- **Baixa Acurácia?** → Revise processo de estimativa
- **Alto Retrabalho?** → Melhore testes e code review
- **Baixa Produtividade?** → Identifique bloqueios

---

### 2. Para Tech Leads / Managers

**Alocação de Tarefas:**
- Distribua baseado em perfis de complexidade
- Considere carga atual (utilização)
- Balance trabalho novo vs manutenção

**Identificação de Necessidades:**
- Treinamento em áreas específicas
- Mentoria para desenvolvedores júnior
- Processo de revisão de código

**Planejamento:**
- Use histórico para estimar capacidade
- Identifique gargalos recorrentes
- Ajuste estimativas baseado em tendências

---

### 3. Para a Equipe

**Retrospectivas:**
- Use métricas como base para discussão
- Identifique padrões da equipe
- Celebre melhorias

**Metas Coletivas:**
- Reduzir taxa média de retrabalho
- Melhorar acurácia de estimativas
- Aumentar taxa de conclusão

---

## 📚 Exemplos Práticos

### Exemplo 1: Desenvolvedor Subestimando

**Métricas:**
- Eficiência de Execução: 45% (apenas 45% das tarefas dentro dos limites ajustados)
- Acurácia Média: -25% (gasta 25% a mais que estimado)
- Qualidade: 85
- Conclusão: 100%

**Cálculo do Score Base:**
```
Score Base = (0.50 × 85) + (0.50 × 45)
Score Base = 42.5 + 22.5 = 65

Com bonus de complexidade e senioridade, pode chegar até 125.
```

**Diagnóstico:**
Subestima consistentemente, mas entrega com qualidade. Score impactado pela baixa eficiência de execução (50% do score base).

**Ações:**
1. Adicionar buffer de 30% nas estimativas iniciais
2. Quebrar tarefas maiores em menores para melhor precisão
3. Revisar definição de "pronto" com a equipe
4. Considerar se está incluindo tempo de testes e review na estimativa
5. Comparar com média da equipe - se todos subestimam, ajustar processo de planejamento

---

### Exemplo 2: Desenvolvedor com Alto Retrabalho

**Métricas:**
- Eficiência de Execução: 75% (estimativas boas)
- Qualidade Score: 65 (35% de retrabalho)
- Conclusão: 85%

**Cálculo do Score Base:**
```
Score Base = (0.50 × 65) + (0.50 × 75)
Score Base = 32.5 + 37.5 = 70

Com bonus de complexidade e senioridade, pode chegar até 125.
```

**Diagnóstico:**
Executa dentro do estimado, mas qualidade inicial baixa prejudica score. Alto retrabalho (35%) é o principal problema (representa 50% do score base!).

**Ações:**
1. Reforçar testes unitários e integração antes de entregar
2. Aumentar cobertura de code review rigoroso
3. Criar checklist de qualidade antes de finalizar tarefa
4. Pair programming em tarefas críticas ou complexas
5. Documentar requisitos claramente para evitar mal-entendidos

---

### Exemplo 3: Desenvolvedor Sobrecarregado

**Métricas:**
- Eficiência de Execução: 60%
- Qualidade: 90
- Taxa de Conclusão: 65%
- Utilização: 135% (contexto: sobrecarga!)

**Cálculo do Score Base:**
```
Score Base = (0.50 × 90) + (0.50 × 60)
Score Base = 45 + 30 = 75

Com bonus de complexidade e senioridade, pode chegar até 125.
```

**Diagnóstico:**
Alta qualidade (90), mas eficiência média (60%). A utilização de 135% indica **sobrecarga crítica** - desenvolvedor está trabalhando muito mas não consegue manter eficiência. Situação insustentável! 

**Nota:** Taxa de Conclusão (65%) foi removida do score porque pode ser afetada por interrupções/realocações (não é responsabilidade só do dev). Ainda é exibida como métrica informativa.

**Ações:**
1. **URGENTE:** Reduzir carga de trabalho para evitar burnout
2. Investigar bloqueios recorrentes e removê-los
3. Priorizar tarefas - focar em finalizar antes de iniciar novas
4. Eliminar interrupções e reuniões desnecessárias
5. Comunicar sobrecarga ao tech lead/manager

---

## ❓ Perguntas Frequentes

### 1. Por que meu score caiu mesmo entregando tudo?

**R:** O score considera qualidade e eficiência, não apenas quantidade. Verifique:
- **Taxa de retrabalho aumentou?** (50% do score base - Qualidade)
- **Eficiência de execução piorou?** (50% do score base - Tarefas dentro do prazo/complexidade)

**Nota:** Taxa de Conclusão foi removida do score porque pode ser afetada por interrupções/realocações (não é responsabilidade só do dev). Ainda é exibida como métrica informativa.

---

### 2. É justo comparar desenvolvedores diretamente?

**R:** ⚠️ **Cuidado!** Comparações diretas podem ser injustas porque:
- Diferentes níveis de complexidade
- Diferentes módulos (legado vs novo)
- Diferentes contextos de trabalho

**Use comparações para:**
- ✅ Identificar padrões da equipe
- ✅ Celebrar excelência
- ✅ Identificar necessidades de suporte

**Não use para:**
- ❌ Avaliação de desempenho isolada
- ❌ Punição
- ❌ Competição prejudicial

---

### 3. Como melhorar minha eficiência de execução?

**⚠️ IMPORTANTE:** Eficiência de execução agora representa **35% do seu performance score**!

**Dicas para executar dentro do estimado:**
1. **Quebre tarefas grandes** em menores e mais previsíveis
2. **Use técnicas de estimativa** como Planning Poker com a equipe
3. **Considere o todo**: desenvolvimento + testes + review + deploy + documentação
4. **Aprenda com o passado**: compare seu estimado vs real e calibre
5. **Inclua buffer realista**: 20-30% para imprevistos
6. **Esclareça requisitos**: dúvidas levam a subestimação e retrabalho
7. **Compare com a equipe**: se todos desviam similarmente, problema é de estimativa inicial
8. **Busque suporte técnico**: se só você desvia muito, pode precisar de ajuda

---

### 4. O que é considerado "retrabalho"?

**R:** Tarefa marcada com **Retrabalho = Sim** no Excel, que indica:
- Tarefa que voltou por erro
- Requisito mal compreendido
- Bug em funcionalidade recém desenvolvida
- Refatoração necessária após review

**Não é retrabalho:**
- Tarefas de manutenção normal
- Bugs de funcionalidades antigas
- Melhorias solicitadas (não erros)

---

### 5. Como interpretar tendências?

**R:** 
- **Melhorando** 📈 = Continue o que está fazendo!
- **Estável** ➡️ = Consistente, busque próximo nível
- **Piorando** 📉 = Identifique causas (complexidade? bloqueios? cansaço?)

**Lembre-se:** Tendências de curto prazo podem ser normais. Analise períodos maiores.

---

### 6. Como usar a comparação com a média da equipe?

**R:** O card de **"Comparação com Média da Equipe"** (roxo) aparece na visualização "Por Sprint" e mostra:

**📊 Eficiência:**
- Sua eficiência vs média da equipe
- ▲ Verde = você está acima da média
- ▼ Vermelho = você está abaixo da média

**💡 Como interpretar:**
- **Diferença < 10 pontos:** Normal, você está alinhado com a equipe
- **Você muito acima (+15pts):** Excelente! Você está mais consistente que a média
- **Você muito abaixo (-15pts):** Atenção! Possíveis causas:
  - Tarefas mais complexas que a média
  - Necessidade de suporte técnico
  - Estimativas inadequadas para seu nível

**🎯 Variação de Tempo:**
- Mostra quanto você desvia das estimativas vs a média
- Se **toda equipe desvia +50%:** Problema é de estimativa inicial (responsabilidade do time/analista)
- Se **só você desvia +50%:** Pode indicar necessidade de ajuda ou tarefas desproporcionais

**Ação recomendada:**
1. Compare suas tarefas com as da equipe (complexidade similar?)
2. Se diferença grande, converse com tech lead sobre distribuição
3. Use para identificar se precisa de mentoria ou treinamento específico

---

### 7. Como interpretar os gráficos de evolução?

**R:** Ao expandir o card de performance, você vê sua evolução ao longo dos sprints:

**📈 Gráfico de Eficiência de Execução:**
- Barras verdes (≥70%): Você está executando bem dentro do estimado
- Barras amarelas (50-70%): Performance média, há espaço para melhoria
- Barras vermelhas (<50%): Atenção! Muitas tarefas fora do prazo

**📊 Gráfico de Score de Performance:**
- Barras azuis (≥75): Performance muito boa
- Barras amarelas (60-75): Performance adequada
- Barras laranjas (<60): Precisa atenção

**Como usar:**
- **Tendência ascendente:** Você está melhorando! Continue
- **Tendência descendente:** Identifique o que mudou (tarefas mais complexas? cansaço? bloqueios?)
- **Estável e alta:** Consistência excelente!
- **Estável e baixa:** Precisa intervenção (mentoria, ajuste de tarefas, etc.)

---

### 8. Por que executar mais rápido não reduz minha eficiência?

**R:** 🎉 **Essa é uma correção importante da v1.2!**

**Antes (injusto):**
- Tarefa estimada 10h, gastou 7h = **fora de ±20%** → ❌ Penalizado
- Tarefa estimada 10h, gastou 13h = **fora de ±20%** → ❌ Penalizado

**Agora (justo):**
- Tarefa estimada 10h, gastou 7h = **+30% mais rápido** → ✅ EFICIENTE!
- Tarefa estimada 10h, gastou 13h = **-30% de atraso** → ❌ Ineficiente

**Por quê?**
Executar mais rápido é POSITIVO:
- Mostra domínio técnico
- Libera capacidade para mais tarefas
- Aumenta previsibilidade

**Limites:**
- ✅ Até **+50% mais rápido** conta como eficiente
- ✅ Até **-20% de atraso** ainda é aceitável
- ❌ Mais de **-20% de atraso** precisa atenção

---

## 🎯 Conclusão

As métricas de performance são ferramentas para:
- ✅ **Autoconhecimento** e melhoria contínua
- ✅ **Planejamento** mais preciso
- ✅ **Identificação** de necessidades de suporte
- ✅ **Celebração** de conquistas
- ✅ **Identificação de padrões** (individual vs equipe)
- ✅ **Evolução ao longo do tempo**

**Não são:**
- ❌ Ferramenta de punição
- ❌ Único critério de avaliação
- ❌ Métricas absolutas de "valor"
- ❌ Comparação injusta sem considerar contexto

**Use com sabedoria, contexto e empatia!** 🚀

### 📊 Recursos Visuais Disponíveis:
1. **Gráfico Estimado vs Gasto** - visualização imediata da variação
2. **Comparação com Equipe** - identifique se está alinhado com a média
3. **Evolução Histórica** - veja seu progresso ao longo dos sprints
4. **Insights Comparativos** - recomendações contextualizadas baseadas na equipe

---

## 🆕 Novidades (v1.2)

### Mudanças na Fórmula do Score (v1.4 - Atual)
- **Utilização removida do score** (todos registram ~40h, não diferencia performance)
- **Taxa de Conclusão removida do score** (pode ser afetada por interrupções/realocações, não é responsabilidade só do dev)
- **Nova distribuição**: 50% Qualidade + 50% Eficiência (Base Score: 0-100)
- **Bonus de Complexidade**: até +10 pontos (por trabalhar em tarefas nível 4-5)
- **Bonus de Senioridade**: até +15 pontos (por executar tarefas complexas com alta eficiência)
- **Score máximo**: 125 pontos (100 base + 10 complexidade + 15 senioridade)

### Histórico (v1.2)
- Acurácia passou a contar 25% do score (antes era apenas informativa)
- Renomeada para "Eficiência de Execução" para refletir melhor seu significado
- Distribuição anterior: 35% Qualidade + 25% Eficiência + 25% Utilização + 15% Conclusão

### Novos Recursos Visuais
- ✨ **Gráfico de barras Estimado vs Gasto** em cada card
- ✨ **Card de comparação com média da equipe** (quando visualizando por sprint)
- ✨ **Gráficos de evolução** histórica de eficiência e score
- ✨ **Insights comparativos automáticos** destacando desvios significativos da média

### Por que a mudança?
A eficiência de execução (capacidade de entregar dentro do estimado) é um indicador importante de:
- **Maturidade técnica** do desenvolvedor
- **Previsibilidade** para planejamento
- **Necessidade de suporte** quando apenas um desenvolvedor desvia muito

A comparação com a equipe ajuda a identificar se o problema é:
- **Estimativa inicial ruim** (todos desviam) → responsabilidade do time/analista
- **Performance individual** (só um desvia) → oportunidade de melhoria ou necessidade de suporte

### Por que executar mais rápido não penaliza?
**v1.2 corrigiu uma injustiça:** antes, executar em 7h uma tarefa estimada em 10h era penalizado igualmente a executar em 13h!

**Nova lógica (assimétrica e justa):**
- ⚡ **Mais rápido (até +50%):** CONTA como eficiente (não penaliza!)
- ⏱️ **Dentro do prazo (-20% a +20%):** CONTA como eficiente
- 🐌 **Muito mais devagar (>-20%):** NÃO CONTA (precisa atenção)

**Exemplo prático:**
- Estimou 10h, gastou 5h = **+50% mais rápido** → ✅ Eficiente!
- Estimou 10h, gastou 7h = **+30% mais rápido** → ✅ Eficiente!
- Estimou 10h, gastou 12h = **-20% de atraso** → ✅ Aceitável
- Estimou 10h, gastou 15h = **-50% de atraso** → ❌ Ineficiente

---

**Versão:** 1.3  
**Última Atualização:** Outubro 2025  
**Principais Mudanças v1.3:** Utilização removida do Performance Score (não diferencia devs que registram ~40h)  
**Contato:** Sprint Analysis Dashboard Team

