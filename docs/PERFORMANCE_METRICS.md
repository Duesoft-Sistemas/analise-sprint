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
- ✅ **Retrabalho** - Se a tarefa foi retrabalho (Sim/Não)
- ✅ **Complexidade** - Nível de 1 a 5
- ✅ **Status** - Estado atual da tarefa
- ✅ **Responsável** - Desenvolvedor alocado

---

## 🎯 Métricas de Acurácia

**⚠️ IMPORTANTE:** As métricas de acurácia são **INFORMATIVAS** e refletem a qualidade do processo de estimativa da **EQUIPE/ANALISTA**, não do desenvolvedor individual. O desenvolvedor contribui com input técnico, mas não é o responsável final pela estimativa.

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

### 2. Taxa de Acurácia (Accuracy Rate)

**Fórmula:**
```
(Tarefas com desvio ≤ 20% / Total de Tarefas) × 100
```

**Descrição:**
Percentual de tarefas onde o tempo gasto ficou dentro de ±20% da estimativa original.

**Interpretação:**
Quanto maior, mais consistente e preciso o desenvolvedor é nas estimativas.

**Exemplo:**
```
10 tarefas no sprint:
- 8 ficaram dentro de ±20%
- 2 ficaram fora de ±20%
Taxa de Acurácia: (8 / 10) × 100 = 80%
```

**Faixas de Avaliação:**
- `≥80%` - Excelente
- `70-79%` - Muito Bom
- `60-69%` - Bom
- `50-59%` - Adequado
- `<50%` - Precisa Atenção

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

### 1. Taxa de Retrabalho (Rework Rate)

**Fórmula:**
```
(Tarefas com Retrabalho = Sim / Total de Tarefas) × 100
```

**Descrição:**
Percentual de tarefas que precisaram ser refeitas ou corrigidas.

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

### 4. Score de Qualidade (Quality Score)

**Fórmula:**
```
100 - Taxa de Retrabalho
```

**Descrição:**
Score simplificado de qualidade baseado no inverso da taxa de retrabalho.

**Interpretação:**
- `90-100` - Excelente
- `80-89` - Muito Bom
- `70-79` - Bom
- `60-69` - Adequado
- `<60` - Precisa Atenção

---

## ⚡ Métricas de Eficiência

### 1. Taxa de Utilização (Utilization Rate)

**Fórmula:**
```
(Total de Horas Trabalhadas / 40h) × 100
```

**Descrição:**
Percentual de utilização da capacidade semanal (assumindo 40h/semana).

**Interpretação:**
- `>100%` - Sobrecarga (risco de burnout)
- `80-100%` - Bem utilizado (ideal)
- `60-79%` - Utilização normal
- `<60%` - Pode receber mais tarefas

**Exemplo:**
```
36h trabalhadas / 40h = 90% de utilização
```

**Atenção:**
- Acima de 100% por períodos prolongados é insustentável
- Abaixo de 60% pode indicar bloqueios ou falta de tarefas

---

### 2. Taxa de Conclusão (Completion Rate)

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

### 3. Tempo Médio para Conclusão (Avg Time to Complete)

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

---

## 🎖️ Score Geral de Performance

### Cálculo do Performance Score

**⚠️ IMPORTANTE:** Este score é uma ferramenta de **autoconhecimento e coaching**, não de avaliação de desempenho isolada. Use com contexto e empatia.

**Fórmula Ponderada:**
```
Performance Score = 
  (50% × Score de Qualidade) +
  (30% × Utilização Normalizada) +
  (20% × Taxa de Conclusão)
```

**Componentes:**
1. **Score de Qualidade** = `100 - Taxa de Retrabalho`
2. **Utilização Normalizada** = `min(100, Taxa de Utilização)`
3. **Taxa de Conclusão** = `(Tarefas Concluídas / Tarefas Iniciadas) × 100`

**Nota sobre Acurácia:**
- A acurácia de estimativa é exibida como **métrica informativa**
- **NÃO** impacta o score de performance individual
- Motivo: Estimativas são responsabilidade do analista/equipe, não apenas do desenvolvedor

**Exemplo:**
```
Qualidade: 90 (10% de retrabalho)
Utilização: 85 (85% de utilização)
Conclusão: 100 (todas concluídas)

Score = (0.5 × 90) + (0.3 × 85) + (0.2 × 100)
Score = 45 + 25.5 + 20 = 90.5
```

### Interpretação dos Scores

| Range | Classificação | Descrição |
|-------|--------------|-----------|
| 90-100 | ⭐⭐⭐⭐⭐ Excelente | Performance excepcional em todas as dimensões |
| 75-89 | ⭐⭐⭐⭐ Muito Bom | Performance acima da média, consistente |
| 60-74 | ⭐⭐⭐ Bom | Performance adequada, algumas áreas para melhorar |
| 45-59 | ⭐⭐ Adequado | Performance aceitável, precisa atenção em algumas áreas |
| <45 | ⭐ Precisa Atenção | Performance abaixo do esperado, necessita melhorias |

### Coloração Visual

- 🟢 **Verde** (90+) - Excelente
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
- Acurácia: -25% (gasta 25% a mais que estimado)
- Taxa de Acurácia: 45%
- Qualidade: 85

**Diagnóstico:**
Subestima consistentemente, mas entrega com qualidade.

**Ações:**
1. Adicionar buffer de 30% nas estimativas
2. Quebrar tarefas maiores em menores
3. Revisar definição de "pronto"
4. Considerar se está incluindo testes na estimativa

---

### Exemplo 2: Desenvolvedor com Alto Retrabalho

**Métricas:**
- Acurácia: 5% (estimativas boas)
- Taxa de Retrabalho: 35%
- Qualidade Score: 65

**Diagnóstico:**
Estima bem, mas qualidade inicial baixa.

**Ações:**
1. Reforçar testes unitários e integração
2. Aumentar cobertura de code review
3. Checklist de qualidade antes de finalizar
4. Pair programming em tarefas críticas

---

### Exemplo 3: Desenvolvedor Sobrecarregado

**Métricas:**
- Utilização: 135%
- Taxa de Conclusão: 65%
- Performance Score: 55

**Diagnóstico:**
Muito trabalho, mas baixa conclusão (provável bloqueio ou interrupções).

**Ações:**
1. Reduzir carga de trabalho
2. Investigar bloqueios
3. Priorizar tarefas
4. Eliminar interrupções

---

## ❓ Perguntas Frequentes

### 1. Por que meu score caiu mesmo entregando tudo?

**R:** O score considera qualidade, não apenas quantidade. Verifique:
- Taxa de retrabalho aumentou?
- Acurácia das estimativas piorou?
- Houve mais bugs que features?

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

### 3. Como melhorar minha acurácia de estimativas?

**Dicas:**
1. **Quebre tarefas grandes** em menores
2. **Use técnicas** como Planning Poker
3. **Considere o todo**: desenvolvimento + testes + review + deploy
4. **Aprenda com o passado**: compare estimado vs real
5. **Inclua buffer**: 20-30% para imprevistos
6. **Esclareça requisitos**: dúvidas levam a subestimação

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

## 🎯 Conclusão

As métricas de performance são ferramentas para:
- ✅ **Autoconhecimento** e melhoria contínua
- ✅ **Planejamento** mais preciso
- ✅ **Identificação** de necessidades de suporte
- ✅ **Celebração** de conquistas

**Não são:**
- ❌ Ferramenta de punição
- ❌ Único critério de avaliação
- ❌ Métricas absolutas de "valor"

Use com sabedoria, contexto e empatia! 🚀

---

**Versão:** 1.0  
**Última Atualização:** Outubro 2024  
**Contato:** Sprint Analysis Dashboard Team

