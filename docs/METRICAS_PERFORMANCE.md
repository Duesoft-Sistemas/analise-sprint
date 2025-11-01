# Métricas de Performance

Este documento descreve todas as métricas de performance disponíveis no Sprint Analysis Dashboard, incluindo como são calculadas e como interpretá-las.

⚠️ **IMPORTANTE:** Use estas métricas para **coaching e melhoria contínua**, nunca como único critério de avaliação.

## 🎯 Visão Geral

O sistema de análise de performance fornece três níveis de visualização:

1. **Por Tarefa** - Métricas individuais de cada tarefa
2. **Por Sprint** - Agregação das métricas em um sprint específico
3. **Todos os Sprints** - Análise histórica e tendências ao longo do tempo

### Dados Necessários

**Obrigatórios:**
- Tempo estimado
- Tempo gasto
- Status
- Responsável

**Opcionais (para análise completa):**
- Tipo de item (Bug, Tarefa, História)
- Retrabalho (Sim/Não)
- Complexidade (1 a 5)
- Nota de Teste (1 a 5, vazio = 5)

⚠️ **IMPORTANTE:** Apenas tarefas com status **concluído** são consideradas nos cálculos de performance.

## 🏆 Performance Score

Score geral que combina qualidade e eficiência de execução.

### Fórmula

```
Base Score (0-100) = 50% Qualidade + 50% Eficiência de Execução
Performance Score = Base Score + Bonus Complexidade (0-10) + Bonus Senioridade (0-15) + Bonus Auxílio (0-10)
Score Máximo: 135
```

### Componentes

1. **Qualidade (50%)** = `Nota de Teste Média × 20`
2. **Eficiência de Execução (50%)** = % de tarefas dentro dos limites ajustados por complexidade e tipo
3. **Bonus de Complexidade (0-10)** = Recompensa por trabalhar em tarefas complexas (níveis 4-5)
4. **Bonus de Senioridade (0-15)** = 🎯 Indicador principal de senioridade! Recompensa executar tarefas complexas com alta eficiência
5. **Bonus de Auxílio (0-10)** = 🤝 Reconhece ajuda aos colegas! Recompensa tempo dedicado a ajudar outros desenvolvedores

### Interpretação dos Scores

| Range | Classificação | Descrição |
|-------|--------------|-----------|
| 115-135 | 🏆 Excepcional | Performance excepcional + trabalho em tarefas complexas + execução eficiente + ajuda aos colegas |
| 90-114 | ⭐⭐⭐⭐⭐ Excelente | Performance excepcional em todas as dimensões |
| 75-89 | ⭐⭐⭐⭐ Muito Bom | Performance acima da média, consistente |
| 60-74 | ⭐⭐⭐ Bom | Performance adequada, algumas áreas para melhorar |
| 45-59 | ⭐⭐ Adequado | Performance aceitável, precisa atenção |
| <45 | ⭐ Precisa Atenção | Performance abaixo do esperado, necessita melhorias |

### ⚠️ Uso Adequado

**✅ Use para:**
- Conversas 1:1 de desenvolvimento
- Identificar necessidades de treinamento
- Reconhecer e celebrar melhorias
- Detectar necessidade de suporte

**❌ NÃO use para:**
- Único critério de avaliação de desempenho
- Bônus/promoções sem outros contextos
- Comparações diretas sem considerar complexidade
- Criar ranking competitivo prejudicial

## 🎯 Métricas de Qualidade

### 1. Quality Score (Score de Qualidade)

**Fórmula:** `Nota de Teste Média × 20`

**Sistema de Nota de Teste (1-5):**
- **5 (100 pontos)**: ✨ Perfeito — Passou em todos os testes, sem problemas detectados
- **4 (80 pontos)**: ✅ Aceitável — Problemas leves que não quebram o processo
- **3 (60 pontos)**: ⚠️ Problema — Quebra o processo ou funcionalidade principal
- **2 (40 pontos)**: ❌ Crítico — Múltiplos problemas graves
- **1 (20 pontos)**: 🔥 Catastrófico — Faltou completar grandes partes

**Interpretação:**
- `100` - Perfeito (todas tarefas nota 5)
- `80-99` - Excelente
- `60-79` - Bom
- `40-59` - Precisava Atenção
- `<40` - Crítico

### 2. Taxa de Retrabalho

**Fórmula:** `(Tarefas com Retrabalho = Sim / Total de Tarefas) × 100`

**Interpretação:**
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

### 3. Taxa de Bugs

**Fórmula:** `(Tarefas tipo Bug / Total de Tarefas) × 100`

**Interpretação:**
Taxa alta pode indicar:
- Problemas de qualidade no código
- Módulos legados que precisam refatoração
- Processo de testes inadequado

## ⚡ Métricas de Eficiência

### 1. Eficiência de Execução

**Fórmula:** `(Tarefas eficientes / Total de Tarefas) × 100`

**Sistema de Avaliação:**

#### BUGS (Complexidades 1-4)
- Usa **zona de complexidade** baseada apenas em horas gastas (não usa estimativa)
- Detecta bugs simples que levaram tempo excessivo
- Exemplo: Bug complexidade 1 gastou 20h → ❌ INEFICIENTE (excede 4h aceitável)

#### FEATURES/OUTROS (Todas complexidades)
- Usa **desvio percentual** entre estimativa original vs horas gastas
- Limites ajustados por complexidade:
  - Simples (-15%): pode atrasar até 15%
  - Média (-25%): pode atrasar até 25%
  - Complexa (-30%): pode atrasar até 30%
  - Muito Complexa (-40%): pode atrasar até 40%
- Executar **mais rápido** (até 50% mais rápido) = ✅ SEMPRE BOM

#### COMPLEXIDADE 5 (Ambos)
- Não tem limites de horas absolutos (tarefas muito imprevisíveis)
- Usa desvio percentual com tolerância de -40%

**Faixas de Avaliação:**
- `≥80%` - Excelente
- `70-79%` - Muito Bom
- `60-69%` - Bom
- `50-59%` - Adequado
- `<50%` - Precisa Atenção

### 2. Taxa de Conclusão

**Fórmula:** `(Tarefas Concluídas / Tarefas Iniciadas) × 100`

**Interpretação:**
- `≥90%` - Excelente
- `80-89%` - Muito Bom
- `70-79%` - Bom
- `<70%` - Pode indicar bloqueios ou interrupções frequentes

**Causas de Baixa Taxa:**
- Tarefas bloqueadas
- Interrupções frequentes
- Tarefas muito grandes
- Prioridades mudando

### 3. Taxa de Utilização ⚠️

**⚠️ MÉTRICA DE CONTEXTO - NÃO IMPACTA O PERFORMANCE SCORE**

**Fórmula:** `(Total de Horas Trabalhadas / 40h) × 100`

**Por que não faz parte do score?**
Como todos os desenvolvedores registram aproximadamente 40 horas (incluindo reuniões, bloqueios, etc), esta métrica não diferencia performance individual. Ela serve apenas como **métrica de contexto** para identificar sobrecarga.

**Interpretação:**
- `>100%` - Sobrecarga (risco de burnout) - **Requer atenção do gestor**
- `80-100%` - Bem utilizado (ideal)
- `60-79%` - Utilização normal
- `<60%` - Pode indicar bloqueios ou tarefas insuficientes

## ℹ️ Métricas de Acurácia (Informativas)

⚠️ **IMPORTANTE:** Estas métricas refletem o **processo de estimativa da equipe/analista**, não responsabilidade individual do desenvolvedor.

### 1. Desvio de Estimativa

**Fórmula:** `((Tempo Estimado - Tempo Gasto) / Tempo Estimado) × 100`

**Interpretação:**
- **Valores Negativos** = Subestimou (gastou mais que estimado)
- **Valores Positivos** = Superestimou (gastou menos que estimado)
- **Valor Zero** = Estimativa perfeita

**Faixas:**
- `±0-10%` - Excelente
- `±10-20%` - Bom
- `±20-30%` - Aceitável
- `>±30%` - Ruim (precisa revisão no processo)

### 2. Taxa de Acurácia

**Fórmula:** `(Tarefas dentro de ±20% / Total de Tarefas) × 100`

Percentual de tarefas onde o tempo gasto ficou dentro de ±20% da estimativa.

**Uso Recomendado:**
- Melhorar processo de Planning Poker da equipe
- Calibrar estimativas coletivas
- Identificar tipos de tarefa difíceis de estimar

## 🎯 Bonus de Complexidade, Senioridade e Auxílio

### Bonus de Complexidade (0-10 pontos)

Recompensa trabalhar em tarefas complexas (níveis 4-5):
- 0% de tarefas complexas = 0 pontos
- 50% de tarefas complexas = +5 pontos
- 100% de tarefas complexas = +10 pontos

### Bonus de Senioridade (0-15 pontos) 🎯

**Indicador principal de senioridade!**

Recompensa não apenas pegar tarefas complexas, mas **executá-las com alta eficiência**:
- Aplicado APENAS para FEATURES complexas (bugs são excluídos)
- 100% de eficiência alta em features complexas = +15 pontos (máximo)

**Por que bugs são excluídos?**
Bugs são imprevisíveis por natureza. O bonus recompensa execução conforme estimativa em features.

### Bonus de Auxílio (0-10 pontos) 🤝

**Reconhece colaboração e mentoria!**

Recompensa tempo dedicado a ajudar outros desenvolvedores:
- 2h = 2 pontos 🟢
- 4h = 3 pontos 🔵
- 6h = 4 pontos 🟣
- 8h = 6 pontos 🟠
- 12h = 8 pontos 🟡
- 16h+ = 10 pontos 🏆

**Identificação:** Campo "Detalhes Ocultos" = "Auxilio" (qualquer variação de maiúsculas/minúsculas)

## 💡 Como Usar as Métricas

### Para Desenvolvedores

**Auto-avaliação:**
- Veja suas métricas individuais
- Identifique pontos fortes e fracos
- Estabeleça metas de melhoria
- Acompanhe sua evolução ao longo do tempo

### Para Tech Leads / Managers

**Coaching:**
- Use para iniciar conversas 1:1
- Identifique necessidades de treinamento
- Reconheça melhorias
- Detecte necessidade de suporte

**⚠️ IMPORTANTE:** Sempre considere contexto (complexidade, módulo, experiência) ao analisar métricas.

### Para a Equipe

**Retrospectivas:**
- Use métricas como base para discussão
- Identifique padrões da equipe
- Celebre melhorias
- Estabeleça metas coletivas

## 📚 Exemplos Práticos

### Exemplo 1: Desenvolvedor com Alta Qualidade

**Métricas:**
- Quality Score: 95 (nota média 4.75)
- Eficiência: 80%
- Base Score: (0.50 × 95) + (0.50 × 80) = 47.5 + 40 = 87.5
- Bonus Complexidade: +8 (80% tarefas complexas)
- Bonus Senioridade: +12 (80% eficiência em features complexas)
- **Performance Score: 107.5** ⭐⭐⭐⭐⭐

### Exemplo 2: Desenvolvedor Subestimando

**Métricas:**
- Quality Score: 85
- Eficiência: 45% (muitas tarefas fora dos limites)
- Base Score: (0.50 × 85) + (0.50 × 45) = 42.5 + 22.5 = 65
- **Performance Score: 65** ⭐⭐⭐

**Ações:**
- Adicionar buffer de 30% nas estimativas
- Quebrar tarefas maiores em menores
- Revisar definição de "pronto"

### Exemplo 3: Desenvolvedor Ajudando Colegas

**Métricas:**
- Base Score: 80
- Bonus Auxílio: +6 (8h de auxílio)
- **Performance Score: 86** ⭐⭐⭐⭐

**Reconhecimento:** O sistema valoriza colaboração e mentoria!

## ❓ Perguntas Frequentes

### 1. É justo comparar desenvolvedores diretamente?

⚠️ **Cuidado!** Comparações diretas podem ser injustas porque:
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

### 2. Por que executar mais rápido não reduz minha eficiência?

Executar mais rápido é **POSITIVO**:
- Mostra domínio técnico
- Libera capacidade para mais tarefas
- Aumenta previsibilidade

**Limites:**
- ✅ Até **+50% mais rápido** conta como eficiente
- ✅ Até **-20% de atraso** ainda é aceitável (para simples)
- ❌ Mais de **-30% de atraso** precisa atenção (para complexas)

### 3. Como melhorar minha eficiência de execução?

**Dicas:**
1. Quebre tarefas grandes em menores
2. Use técnicas de estimativa como Planning Poker
3. Considere o todo: desenvolvimento + testes + review + deploy
4. Aprenda com o passado: compare estimado vs real
5. Inclua buffer realista: 20-30% para imprevistos
6. Esclareça requisitos antes de estimar

## 🎓 Conclusão

As métricas de performance são ferramentas para:
- ✅ **Autoconhecimento** e melhoria contínua
- ✅ **Planejamento** mais preciso
- ✅ **Identificação** de necessidades de suporte
- ✅ **Celebração** de conquistas

**Não são:**
- ❌ Ferramenta de punição
- ❌ Único critério de avaliação
- ❌ Métricas absolutas de "valor"
- ❌ Comparação injusta sem considerar contexto

**Use com sabedoria, contexto e empatia!** 🚀

