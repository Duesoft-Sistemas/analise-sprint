# Evolução Temporal

Documentação completa da aba **Evolução Temporal**, que fornece análise temporal e tendências de performance dos desenvolvedores ao longo do tempo.

## Visão Geral

A aba **Evolução Temporal** permite analisar a evolução de performance, qualidade, eficiência e complexidade dos desenvolvedores através de múltiplos sprints, fornecendo insights de carreira e identificação de tendências.

## Acesso

- **Menu:** Quarta opção na barra lateral: "Evolução Temporal"
- **Ícone:** TrendingUp (gráfico de tendência)
- **Requisitos:**
  - Planilha de layout/tarefas carregada (obrigatório)
  - Planilha de sprints carregada (obrigatório)
  - Planilha de worklog carregada (obrigatório)

## Tipos de Agregação Temporal

A aba permite analisar dados agrupados por diferentes períodos:

1. **Sprint** (padrão) - Agregação por sprint individual
2. **Mês** - Agregação mensal
3. **Trimestre** - Agregação trimestral
4. **Semestre** - Agregação semestral
5. **Ano** - Agregação anual

**Comportamento:**
- Cada tipo de agregação agrupa sprints em períodos correspondentes
- Métricas são calculadas como médias dentro de cada período
- Sprints são agrupados baseados em suas datas de início

**Seletor de Agregação:**
- Controle no topo da página
- Alterar a agregação recalcula todas as métricas
- Períodos são identificados automaticamente baseados nas datas dos sprints

## Seletor de Desenvolvedor

**Funcionalidade:**
- Permite escolher qual desenvolvedor será analisado em detalhes
- Análise individual foca no desenvolvedor selecionado

**Comportamento:**
- **Seleção padrão:** Primeiro desenvolvedor disponível ou desenvolvedor configurado como padrão
- **Múltiplos desenvolvedores:** Análise comparativa entre desenvolvedor selecionado e média da equipe
- **Lista de desenvolvedores:** Todos os desenvolvedores que possuem tarefas nos sprints analisados

## Toggle de Bônus

**Funcionalidade:**
- Permite incluir ou excluir bônus (senioridade, competência, auxílio) dos cálculos de performance

**Comportamento:**
- **Com Bônus (padrão):** Performance Score inclui todos os bônus (máximo 130 pontos)
- **Sem Bônus:** Performance Score base apenas (máximo 100 pontos)
- Alternar o toggle recalcula métricas e tendências

**Uso:**
- **Com bônus:** Para análise completa de performance considerando reconhecimentos extras
- **Sem bônus:** Para análise focada apenas em base de performance (qualidade + eficiência)

## Seções da Aba

### 1. Gráficos de Evolução

**Localização:** Primeira seção

**Funcionalidade:**
Exibe gráficos de linha mostrando evolução de métricas ao longo do tempo.

**Métricas Visualizadas:**
1. **Performance Score** (linha azul)
   - Score do desenvolvedor selecionado
   - Média da equipe (linha tracejada cinza)
   - Range: 0-130 (com bônus) ou 0-100 (sem bônus)

2. **Quality Score** (linha verde)
   - Qualidade do desenvolvedor selecionado
   - Média da equipe (linha tracejada cinza)
   - Range: 0-100 (nota média × 20)

3. **Accuracy Rate** (linha roxa)
   - Taxa de acurácia do desenvolvedor selecionado
   - Média da equipe (linha tracejada cinza)
   - Percentual de tarefas dentro de ±20% da estimativa

4. **Complexidade Média** (linha laranja)
   - Complexidade média das tarefas do desenvolvedor
   - Não há comparação com equipe
   - Range: 1.0-5.0

**Visualização:**
- Gráfico de linha múltipla
- Eixo X: Períodos (sprints/meses/trimestres/etc.)
- Eixo Y: Valores das métricas
- Tooltip ao hover mostrando valores detalhados

**Interação:**
- Hover sobre pontos mostra valores exatos
- Zoom (se disponível)
- Legenda clicável para mostrar/ocultar séries

---

### 2. Estatísticas Resumidas

**Localização:** Segunda seção

**Funcionalidade:**
Exibe estatísticas agregadas do desenvolvedor selecionado.

#### Métricas Principais

**Performance Score:**
- **Média:** Média de performance ao longo do período
- **Mediana:** Mediana de performance
- **Mínimo:** Menor performance no período
- **Máximo:** Maior performance no período
- **Desvio Padrão:** Variabilidade da performance
- **Score de Consistência:** Medida de consistência (100 = totalmente consistente, 0 = totalmente variável)

**Cálculo de Consistência:**
- Baseado no coeficiente de variação
- Fórmula: `100 - (Desvio Padrão / Média × 100)`
- Valores mais altos indicam maior consistência

**Quality Score:**
- Média de qualidade ao longo do período
- Desvio padrão
- Tendência (melhorando/declinando/estável)

**Accuracy Rate:**
- Média de acurácia ao longo do período
- Desvio padrão
- Tendência

**Complexidade:**
- Complexidade média das tarefas
- Desvio padrão
- Tendência (aumentando/diminuindo/estável)

---

### 3. Tendências e Crescimento

**Localização:** Terceira seção

**Funcionalidade:**
Identifica tendências e calcula crescimento percentual entre primeiro e último período.

**Tipos de Tendência:**
- **Melhorando (↗):** Tendência de melhoria ao longo do tempo
- **Declinando (↘):** Tendência de declínio ao longo do tempo
- **Estável (→):** Sem tendência significativa

**Cálculo de Tendência:**
- Usa regressão linear simples
- Threshold de 0.5 para considerar tendência significativa
- Se inclinação > 0.5: melhorando
- Se inclinação < -0.5: declinando
- Caso contrário: estável

**Crescimento Percentual:**
- Calculado como: `((Último Período - Primeiro Período) / Primeiro Período) × 100`
- Mostrado para cada métrica:
  - **Performance Growth:** Crescimento de performance
  - **Quality Growth:** Crescimento de qualidade
  - **Accuracy Growth:** Crescimento de acurácia
  - **Complexity Growth:** Crescimento de complexidade

**Visualização:**
- Ícones de tendência coloridos (verde/vermelho/cinza)
- Percentuais de crescimento com cores:
  - Verde: Crescimento > 10%
  - Vermelho: Declínio > 10%
  - Cinza: Variação dentro de ±10%

---

### 4. Insights de Carreira

**Localização:** Quarta seção

**Funcionalidade:**
Gera insights automáticos baseados em tendências e métricas agregadas.

**Tipos de Insights:**

**1. Evolução Positiva de Performance**
- **Condição:** Tendência de performance melhorando
- **Descrição:** Informa o crescimento percentual
- **Recomendação:** Continue o excelente trabalho! Considere compartilhar práticas com a equipe.

**2. Declínio na Performance**
- **Condição:** Tendência de performance declinando
- **Descrição:** Informa o declínio percentual
- **Recomendação:** Recomendamos uma conversa 1:1 para identificar possíveis bloqueios ou necessidades de suporte.

**3. Melhoria Contínua na Qualidade**
- **Condição:** Tendência de qualidade melhorando
- **Descrição:** Informa o crescimento percentual

**4. Qualidade Precisa Atenção**
- **Condição:** Tendência de qualidade declinando
- **Descrição:** Informa sobre declínio
- **Recomendação:** Considere revisar processos de code review e aumentar cobertura de testes.

**5. Assumindo Tarefas Mais Complexas**
- **Condição:** Complexidade média aumentando
- **Descrição:** Informa o crescimento percentual
- **Recomendação:** Excelente! Está assumindo desafios maiores. Considere para promoção ou tarefas de liderança técnica.

**6. Crescimento Excepcional**
- **Condição:** Performance Growth > 20% E Qualidade melhorando
- **Descrição:** Identifica crescimento excepcional
- **Recomendação:** Parabéns! Considere para promoção ou aumento de responsabilidades.

**7. Consistência Excelente**
- **Condição:** Score de consistência > 90
- **Descrição:** Identifica consistência excepcional
- **Recomendação:** Desempenho muito consistente. Considere para tarefas críticas ou liderança de equipe.

**8. Alta Performance Sustentada**
- **Condição:** Performance média > 90
- **Descrição:** Identifica performance alta sustentada

**9. Melhoria Significativa**
- **Condição:** Crescimento em múltiplas métricas simultaneamente
- **Descrição:** Identifica melhoria geral

**Visualização:**
- Cards coloridos por tipo (positivo = verde, negativo = vermelho, informativo = azul)
- Título, descrição e recomendação (quando aplicável)

---

### 5. Comparação com Equipe

**Localização:** Integrada nos gráficos

**Funcionalidade:**
Compara métricas do desenvolvedor selecionado com a média da equipe.

**Métricas Comparadas:**
- **Performance Score:** Desenvolvedor vs Média da Equipe
- **Quality Score:** Desenvolvedor vs Média da Equipe
- **Accuracy Rate:** Desenvolvedor vs Média da Equipe

**Visualização:**
- Linha sólida: Desenvolvedor selecionado
- Linha tracejada cinza: Média da equipe
- Mesmo gráfico, séries diferentes

**Interpretação:**
- Se linha do desenvolvedor está **acima** da média: Melhor que a média
- Se linha do desenvolvedor está **abaixo** da média: Abaixo da média
- **Convergência:** Desenvolvedor aproximando-se da média (melhorando ou equipe melhorando)
- **Divergência:** Desenvolvedor distanciando-se da média

---

## Métricas e Cálculos

### Agregação por Período

**Por Sprint:**
- Cada sprint é um período individual
- Métricas são calculadas para cada sprint separadamente

**Por Mês:**
- Sprints são agrupados por mês (baseado em data de início)
- Métricas são médias de todos os sprints do mês

**Por Trimestre:**
- Sprints são agrupados por trimestre (Q1, Q2, Q3, Q4)
- Métricas são médias de todos os sprints do trimestre

**Por Semestre:**
- Sprints são agrupados por semestre (1º ou 2º semestre)
- Métricas são médias de todos os sprints do semestre

**Por Ano:**
- Sprints são agrupados por ano
- Métricas são médias de todos os sprints do ano

### Cálculo de Métricas Agregadas

**Performance Score:**
- Média de performance scores de todos os sprints no período
- Considera toggle de bônus (com ou sem bônus)

**Quality Score:**
- Média de quality scores (nota de teste média × 20) de todos os sprints no período

**Accuracy Rate:**
- Média de accuracy rates (tarefas dentro de ±20% da estimativa) de todos os sprints no período

**Complexidade:**
- Média ponderada de complexidade de tarefas concluídas no período
- Considera todas as tarefas concluídas do desenvolvedor

**Tasks Completed:**
- Quantidade total de tarefas concluídas no período

**Sprints:**
- Quantidade de sprints incluídos no período

### Cálculo de Tendências

**Regressão Linear Simples:**
- Usa método de mínimos quadrados
- Calcula inclinação da reta de tendência
- Threshold de 0.5 para considerar significativo

**Fórmula:**
```
slope = Σ((x - x_mean) × (y - y_mean)) / Σ((x - x_mean)²)
```

**Interpretação:**
- slope > 0.5: Tendência de melhoria
- slope < -0.5: Tendência de declínio
- Caso contrário: Estável

### Cálculo de Crescimento

**Fórmula:**
```
growth = ((last_period - first_period) / first_period) × 100
```

**Interpretação:**
- Positivo: Crescimento
- Negativo: Declínio
- Valores > 10% ou < -10% são destacados com cores

### Cálculo de Consistência

**Coeficiente de Variação:**
```
CV = (std_dev / mean) × 100
```

**Score de Consistência:**
```
consistency_score = max(0, 100 - CV)
```

**Interpretação:**
- 100: Totalmente consistente (sem variação)
- 90-99: Muito consistente
- 70-89: Consistente
- < 70: Variável

---

## Integração com Modo Apresentação

A aba Evolução Temporal **não possui** seções específicas para o Modo Apresentação configurável.

**Observação:**
- Evolução Temporal é uma aba de análise detalhada
- Melhor usada para análises individuais e planejamento
- Para apresentações, prefira usar outras abas com métricas agregadas

---

## Casos de Uso

### Análise de Performance Individual
1. Selecione um desenvolvedor
2. Escolha tipo de agregação (ex: trimestral)
3. Analise gráficos de evolução
4. Revise insights de carreira

### Identificação de Tendências
1. Use gráficos para identificar padrões
2. Revise seção de tendências
3. Analise crescimento percentual
4. Compare com média da equipe

### Planejamento de Carreira
1. Analise insights de carreira
2. Identifique pontos fortes e fracos
3. Use recomendações para desenvolvimento
4. Monitore evolução ao longo do tempo

### Análise Comparativa
1. Compare desenvolvedor com média da equipe
2. Identifique desenvolvedores acima/abaixo da média
3. Analise convergência/divergência
4. Use para planejamento de equipe

---

## Dicas de Uso

1. **Agregação Estratégica:**
   - Use "Sprint" para análise detalhada
   - Use "Mês" ou "Trimestre" para análise de médio prazo
   - Use "Ano" para análise de longo prazo

2. **Toggle de Bônus:**
   - Use "Com Bônus" para análise completa
   - Use "Sem Bônus" para análise focada em base

3. **Análise de Tendências:**
   - Fique atento a tendências de declínio
   - Celebre tendências de melhoria
   - Use insights de carreira para orientação

4. **Comparação com Equipe:**
   - Desenvolvedores acima da média são candidatos a promoção
   - Desenvolvedores abaixo da média precisam de suporte
   - Use para balanceamento de equipe

5. **Consistência:**
   - Alta consistência indica confiabilidade
   - Baixa consistência pode indicar necessidade de suporte
   - Use para alocação de tarefas críticas

---

## Referências

- [Performance](METRICAS_PERFORMANCE.md) - Especificações de métricas de performance
- [Guia do Desenvolvedor](GUIA_DESENVOLVEDOR.md) - Entendendo sua performance
- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura completa dos arquivos
- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Sistema híbrido de cálculo

