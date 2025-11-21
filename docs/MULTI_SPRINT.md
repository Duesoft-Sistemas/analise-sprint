# Multi-Sprint

Documentação completa da aba **Multi-Sprint**, que fornece análise comparativa entre múltiplos sprints.

## Visão Geral

A aba **Multi-Sprint** permite analisar e comparar métricas, distribuições e alocações através de múltiplos sprints, fornecendo uma visão histórica e comparativa do trabalho realizado.

## Acesso

- **Menu:** Segunda opção na barra lateral: "Multi-Sprint"
- **Ícone:** Layers (camadas)
- **Requisitos:**
  - Planilha de layout/tarefas carregada
  - Planilha de sprints carregada (obrigatório para períodos precisos)
  - Planilha de worklog carregada (recomendado para métricas precisas)

## Seletor de Sprints

No topo da página, há um seletor que permite escolher quais sprints serão incluídos na análise.

**Funcionalidades:**
- **Multi-seleção:** Permite selecionar múltiplos sprints simultaneamente
- **Seleção padrão:** Todos os sprints disponíveis
- **Filtro dinâmico:** Ao alterar a seleção, todas as métricas são recalculadas

**Controles:**
- Clique no botão de seleção para abrir o dropdown
- Marque/desmarque sprints individualmente
- Todos os sprints são processados em conjunto

## Seções da Aba

### 1. Distribuição por Sprint

**Localização:** Primeira seção

**Funcionalidade:**
Exibe a distribuição de trabalho (tarefas, horas e estimativas) por sprint.

**Métricas Exibidas:**
- **Quantidade de tarefas** por sprint
- **Horas trabalhadas** por sprint (baseado em worklog)
- **Horas estimadas** por sprint

**Visualização:**
- Gráfico de barras agrupadas
- Uma barra por sprint
- Múltiplas séries de dados (tarefas, horas, estimativas)

**Ordenação:**
- Sprints são ordenados cronologicamente (mais antigo primeiro)

**Interação:**
- **Hover:** Mostra valores detalhados
- **Clique no sprint:** Filtra análises posteriores para aquele sprint

**Observações:**
- Horas trabalhadas são calculadas a partir de worklogs dentro do período de cada sprint
- Apenas sprints selecionados são exibidos

---

### 2. Alocação por Desenvolvedor

**Localização:** Segunda seção

**Funcionalidade:**
Analisa a distribuição de trabalho por desenvolvedor através dos sprints selecionados.

**Visualizações Disponíveis:**
1. **Gráfico:** Visualização gráfica da distribuição
2. **Lista:** Tabela detalhada por desenvolvedor

**Controles:**
- **Toggle visualização:** Botão para alternar entre gráfico e lista
- **Filtro "Top":** Permite selecionar top 10, 20, 40 ou todos os desenvolvedores

**Métricas por Desenvolvedor:**
- **Total de tarefas** em todos os sprints selecionados
- **Total de horas trabalhadas** (soma de `tempoGastoNoSprint` de todos os sprints)
- **Total de horas estimadas** (soma de estimativas)

**Agregação:**
- Métricas são somadas através de todos os sprints selecionados
- Cada desenvolvedor recebe um total agregado

**Interação:**
- **Clique no desenvolvedor (lista):** Filtra outras análises para aquele desenvolvedor
- **Selecionar desenvolvedor:** Pode afetar visualizações de outras seções

**Ordenação:**
- Desenvolvedores são ordenados por quantidade total de tarefas (maior primeiro)

---

### 3. Alocação por Cliente

**Localização:** Terceira seção

**Funcionalidade:**
Analisa a distribuição de trabalho por cliente através dos sprints selecionados.

**Visualizações Disponíveis:**
1. **Gráfico (padrão):** Gráfico de barras mostrando distribuição
2. **Lista:** Cards individuais para cada cliente

**Controles:**
- **Toggle visualização:** Botão para alternar entre gráfico e lista
- **Filtro "Top":** Permite selecionar top 10, 20, 40 ou todos os clientes

**Métricas por Cliente:**
- **Total de tarefas** em todos os sprints selecionados
- **Total de horas trabalhadas** (agregado)
- **Total de horas estimadas** (agregado)

**Agregação:**
- Métricas são somadas através de todos os sprints selecionados
- Cada cliente recebe um total agregado

**Interação:**
- **Clique no cliente:** Filtra outras análises para aquele cliente

**Ordenação:**
- Clientes são ordenados por quantidade total de tarefas (maior primeiro)

---

### 4. Análise de Features

**Localização:** Quarta seção

**Funcionalidade:**
Analisa a distribuição de trabalho por feature através dos sprints selecionados.

**Visualizações Disponíveis:**
1. **Gráfico (padrão):** Gráfico de barras mostrando distribuição
2. **Lista:** Cards individuais para cada feature

**Controles:**
- **Toggle visualização:** Botão para alternar entre gráfico e lista
- **Filtro "Top":** Permite selecionar top 10, 20, 40 ou todas as features

**Métricas por Feature:**
- **Total de tarefas** em todos os sprints selecionados
- **Total de horas trabalhadas** (agregado)
- **Total de horas estimadas** (agregado)
- **Análise de problemas:** Bugs e dúvidas ocultas por feature

**Análise de Problemas:**
- Separação entre bugs reais e dúvidas ocultas
- Identificação de features problemáticas
- Contagem de problemas por feature

**Agregação:**
- Métricas são somadas através de todos os sprints selecionados
- Cada feature recebe um total agregado

**Interação:**
- **Clique na feature:** Pode filtrar outras análises

**Ordenação:**
- Features são ordenadas por quantidade total de tarefas (maior primeiro)

---

### 5. KPIs de Gestão

**Localização:** Quinta seção

**Funcionalidade:**
Exibe indicadores de gestão (treinamento, auxílio, reuniões) por sprint e totais.

**Controles:**
- **Filtro por sprint:** Permite filtrar KPIs para um sprint específico
- **Expansão/Colapso:** Cards podem ser expandidos para ver detalhes por sprint

#### KPIs Disponíveis

**1. Treinamento**
- **Métrica:** Horas gastas em tarefas marcadas como "Treinamento"
- **Identificação:** Campo "Detalhes Ocultos" contém "Treinamento" ou "treinamento"
- **Visualização:** Total agregado + breakdown por sprint
- **Cor:** Verde

**2. Auxílio**
- **Métrica:** Horas gastas em tarefas marcadas como "Auxilio"
- **Identificação:** Campo "Detalhes Ocultos" contém "Auxilio" ou "auxilio"
- **Visualização:** Total agregado + breakdown por sprint
- **Cor:** Azul
- **Observação:** Usa `tempoGastoNoSprint` de cada sprint para calcular proporcionalmente

**3. Reuniões**
- **Métrica:** Horas gastas em tarefas marcadas como "Reunião" ou "Reuniao"
- **Identificação:** Campo "Detalhes Ocultos" contém "Reunião" ou variações
- **Visualização:** Total agregado + breakdown por sprint
- **Cor:** Amarelo

**4. Distribuição de Tipo de Item**
- **Métrica:** Quantidade de itens por tipo (Tarefas, Bugs Reais, Dúvidas Ocultas)
- **Visualização:** Total agregado + breakdown por sprint
- **Separação:** Bugs reais vs dúvidas ocultas

**Estrutura dos Cards:**
- **Total:** Valor agregado de todos os sprints selecionados
- **Por Sprint:** Breakdown detalhado (expansível)
- **Interação:** Clique para expandir/colapsar detalhes por sprint

**Cálculo das Horas:**
- Horas são calculadas a partir de worklogs dentro do período de cada sprint
- Cada sprint contribui com `tempoGastoNoSprint` calculado para seu período específico
- Totais são somados através de todos os sprints selecionados

**Filtro por Sprint:**
- Ao filtrar por um sprint específico, apenas aquele sprint é considerado nos cálculos
- Útil para análise focada de um período específico

---

## Métricas e Cálculos

### Agregação entre Sprints

Todas as métricas agregadas somam valores através dos sprints selecionados:

**Horas Trabalhadas:**
- Soma de `tempoGastoNoSprint` de cada sprint
- Calculado a partir de worklogs dentro do período de cada sprint individual

**Tarefas:**
- Contagem de tarefas únicas em todos os sprints selecionados
- Uma tarefa que aparece em múltiplos sprints é contada apenas uma vez no total agregado

**Horas Estimadas:**
- Soma de estimativas originais de todas as tarefas em todos os sprints selecionados

### Identificação de Tarefas Especiais

**Tarefas de Treinamento:**
- Campo "Detalhes Ocultos" contém "Treinamento" (case-insensitive, normalizado)
- Variantes aceitas: "Treinamento", "treinamento", etc.

**Tarefas de Auxílio:**
- Campo "Detalhes Ocultos" contém "Auxilio" (case-insensitive, normalizado)
- Variantes aceitas: "Auxilio", "auxilio", "Auxílio", etc.

**Tarefas de Reunião:**
- Campo "Detalhes Ocultos" contém "Reunião" ou "Reuniao" (case-insensitive, normalizado)
- Variantes aceitas: "Reunião", "Reuniao", "reunião", "reuniao", etc.

**Dúvidas Ocultas:**
- Tarefas do tipo "Bug" com "Detalhes Ocultos" contendo "DuvidaOculta" ou "Dúvida Oculta"
- Separadas de bugs reais para análise de qualidade

**DSFolha:**
- Tarefas com módulo "DSFolha" ou feature "DSFolha"
- Identificadas separadamente em algumas análises

---

## Integração com Modo Apresentação

A aba Multi-Sprint é totalmente compatível com o Modo Apresentação. As seções disponíveis são:

1. **Distribuição por Sprint** (`sprintDistribution`)
2. **Alocação por Desenvolvedor** (`developerAllocation`)
3. **Alocação por Cliente** (`clientAllocation`)
4. **Análise de Features** (`featureAnalysis`)
5. **KPIs de Gestão** (`managementKPIs`)

**Configuração:**
- Configure etapas de apresentação em "Apresentação" (ícone ▶)
- Selecione as seções desejadas e defina intervalos
- Durante a apresentação, a navegação é automática

**Ajustes Automáticos:**
- Gráficos são ampliados automaticamente
- Rolagem automática para a seção focada
- Visualizações otimizadas para telas grandes

---

## Casos de Uso

### Análise Histórica
- **Objetivo:** Entender tendências ao longo do tempo
- **Como:** Selecione múltiplos sprints consecutivos e analise as distribuições
- **Uso:** Identificar padrões, sazonalidades e mudanças

### Comparação de Sprints
- **Objetivo:** Comparar dois ou mais sprints específicos
- **Como:** Selecione apenas os sprints de interesse
- **Uso:** Comparar performance, distribuição de trabalho, KPIs de gestão

### Análise de Desenvolvedores
- **Objetivo:** Ver carga de trabalho de desenvolvedores ao longo do tempo
- **Como:** Use "Alocação por Desenvolvedor" com múltiplos sprints
- **Uso:** Identificar sobrecarga crônica, distribuição equilibrada

### Análise por Cliente
- **Objetivo:** Entender distribuição de trabalho por cliente ao longo do tempo
- **Como:** Use "Alocação por Cliente" com múltiplos sprints
- **Uso:** Balancear trabalho entre clientes, identificar clientes prioritários

### KPIs de Gestão
- **Objetivo:** Monitorar horas gastas em atividades não-produtivas
- **Como:** Use seção "KPIs de Gestão" e expanda breakdown por sprint
- **Uso:** Identificar sprints com muitas reuniões/treinamentos, monitorar tempo de auxílio

---

## Dicas de Uso

1. **Seleção Estratégica de Sprints:**
   - Para análise histórica: selecione sprints consecutivos
   - Para comparação: selecione sprints específicos de interesse
   - Evite selecionar muitos sprints se a análise for específica

2. **Análise de Tendências:**
   - Use "Distribuição por Sprint" para ver evolução temporal
   - Compare horas trabalhadas vs estimadas ao longo do tempo
   - Identifique sprints anômalos

3. **Filtros Intuitivos:**
   - Use filtros "Top" para focar nos itens mais relevantes
   - Alternar entre visualizações (gráfico/lista) para diferentes insights
   - Combine filtros (sprint + desenvolvedor + cliente)

4. **KPIs de Gestão:**
   - Expanda cards para ver breakdown por sprint
   - Use filtro por sprint para análise focada
   - Monitore tendências de horas de treinamento/auxílio/reunião

5. **Performance e Carregamento:**
   - Selecionar muitos sprints pode afetar performance
   - Use filtros "Top" para reduzir carga de renderização
   - Filtre por sprint nos KPIs para análises rápidas

---

## Referências

- [Sprint Ativo](SPRINT_ATIVO.md) - Análise detalhada de um sprint individual
- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura completa dos arquivos
- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Sistema híbrido de cálculo
- [Modo Apresentação](MODO_APRESENTACAO.md) - Configuração de apresentações

