# Backlog

Documentação completa da aba **Backlog**, que fornece análise detalhada de tarefas em backlog (sem sprint atribuído).

## Visão Geral

A aba **Backlog** permite visualizar, analisar e planejar tarefas que não estão atribuídas a nenhum sprint, fornecendo insights sobre complexidade, distribuição por dimensões e status das tarefas pendentes.

## Acesso

- **Menu:** Sexta opção na barra lateral: "Backlog"
- **Ícone:** Inbox (caixa de entrada)
- **Requisitos:**
  - Planilha de layout/tarefas carregada
  - Planilha de sprints carregada (opcional, mas recomendado para contexto)

## Conceito de Backlog

**Definição:**
Tarefas em backlog são tarefas que não possuem sprint atribuído ou possuem valores considerados como "sem sprint".

**Valores Aceitos como "Sem Sprint" (normalizados, case-insensitive):**
- Campo vazio, `""`
- `Backlog`
- `Sem Sprint`
- `-` ou `—`
- `N/A`, `NA`
- `Não alocado` / `Nao alocado` (e variações sem acento)
- `None`, `Null`, `Undefined`

**Sprints Desconhecidos:**
- Tarefas cujo sprint possui valor válido, mas o nome NÃO aparece no arquivo `sprints.xlsx`, são tratadas como backlog
- Essas tarefas também NÃO são processadas nos cálculos híbridos

**Regras Importantes:**
- Tarefas de backlog **NÃO interferem** em métricas de performance
- Tarefas de backlog **NÃO são processadas** para cálculos híbridos (tempoGastoTotal, tempoGastoNoSprint, etc.)
- Worklog de tarefas sem sprint é ignorado
- Horas de backlog são calculadas apenas pela estimativa original (não usa worklog)
- Tarefas de backlog aparecem **apenas** na análise de backlog (aba Backlog)

## Escopo de Visualização

**Opções Disponíveis:**

1. **Todas as Tarefas Pendentes (padrão):**
   - Inclui tarefas de backlog (sem sprint) + tarefas com sprint mas não concluídas
   - Útil para planejamento completo

2. **Apenas Backlog:**
   - Inclui apenas tarefas sem sprint atribuído
   - Útil para análise focada em backlog puro

**Controles:**
- Toggle para alternar entre escopos
- Alteração do escopo recalcula todas as métricas

## Seções da Aba

### 1. Resumo do Backlog

**Localização:** Primeira seção

**Funcionalidade:**
Exibe métricas gerais do backlog.

#### Cards Principais

**Total de Tarefas**
- Quantidade total de tarefas em backlog
- Inclui contagem por escopo selecionado

**Total de Horas Estimadas**
- Soma das estimativas originais de todas as tarefas em backlog
- **Importante:** Baseado apenas em estimativas, não usa worklog

**Distribuição por Tipo**
- **Bugs Reais:** Tarefas tipo "Bug" que não são dúvidas ocultas
- **Dúvidas Ocultas:** Tarefas tipo "Bug" marcadas como "DuvidaOculta"
- **Tarefas:** Tarefas tipo "Tarefa" ou "Task"
- **Histórias:** Tarefas tipo "História" ou "Story"
- **Folha:** Tarefas com módulo "DSFolha" ou feature "DSFolha"

**Informações por Tipo:**
- Quantidade de tarefas
- Horas estimadas
- Visualização com cores diferentes

#### Observações sobre Horas

- Horas são calculadas **apenas pela estimativa original**
- Worklog de tarefas de backlog é **ignorado** para cálculo de horas
- Não há cálculo de horas gastas para backlog (tarefas sem sprint não têm worklog processado)

---

### 2. Análise por Complexidade

**Localização:** Segunda seção

**Funcionalidade:**
Agrupa tarefas de backlog por nível de complexidade (1-5).

**Visualização:**
- Gráfico de barras mostrando distribuição por complexidade
- Uma barra por nível de complexidade (1-5)

**Métricas Exibidas (por complexidade):**
- **Quantidade de tarefas**
- **Horas estimadas**

**Interação:**
- **Clique na barra:** Filtra lista de tarefas para mostrar apenas tarefas daquela complexidade
- **Hover:** Mostra valores detalhados

**Interpretação:**
- **Complexidade 1-2:** Tarefas simples (baixa complexidade)
- **Complexidade 3:** Tarefas médias (complexidade moderada)
- **Complexidade 4-5:** Tarefas complexas (alta complexidade)

**Uso para Planejamento:**
- Identifique distribuição de complexidade no backlog
- Use para planejar alocação equilibrada de trabalho
- Priorize tarefas simples para sprint rápido ou tarefas complexas para sprint focado

---

### 3. Análise por Feature

**Localização:** Terceira seção

**Funcionalidade:**
Agrupa tarefas de backlog por Feature.

**Visualizações Disponíveis:**
1. **Gráfico (padrão):** Gráfico de barras horizontal mostrando as top features
2. **Lista:** Cards individuais para cada feature

**Controles:**
- **Toggle visualização:** Botão para alternar entre gráfico e lista
- **Filtro "Top":** Permite selecionar top 10, 20, 40 ou todas as features

**Métricas Exibidas (por feature):**
- **Quantidade de tarefas**
- **Horas estimadas**

**Interação:**
- **Clique no gráfico/card:** Filtra lista de tarefas para mostrar apenas tarefas dessa feature

**Ordenação:**
- Features são ordenadas por quantidade de tarefas (maior primeiro)

**Observações:**
- Features são identificadas pelo campo "Campo personalizado (Feature)" do layout.xlsx
- Sistema suporta múltiplas features por tarefa
- Features são normalizadas para comparação

**Uso para Planejamento:**
- Identifique features com mais trabalho pendente
- Use para priorizar features em sprints futuros
- Planeje sprints focados em features específicas

---

### 4. Análise por Equipe

**Localização:** Quarta seção

**Funcionalidade:**
Agrupa tarefas de backlog por Equipe, separando entre Equipe VB e Equipe Web.

**Visualizações Disponíveis:**
1. **Gráfico (padrão):** Gráfico de barras horizontal mostrando as equipes
2. **Lista:** Cards individuais para cada equipe

**Controles:**
- **Toggle visualização:** Botão para alternar entre gráfico e lista

**Métricas Exibidas (por equipe):**
- **Quantidade de tarefas**
- **Horas estimadas**
- **Breakdown por tipo** (Bugs, Dúvidas Ocultas, Tarefas)

**Interação:**
- **Clique no gráfico/card:** Filtra lista de tarefas para mostrar apenas tarefas dessa equipe
- **Clique no card de resumo:** Filtra análise completa para mostrar apenas dados da equipe

**Regra de Identificação de Equipe:**
- **Equipe Web:** Tarefas que possuem a etiqueta "EquipeWeb" nos Detalhes Ocultos (campo personalizado)
- **Equipe VB:** Todas as outras tarefas (padrão quando não há etiqueta)

**Observações:**
- A identificação é baseada no campo "Campo personalizado (Detalhes Ocultos)" do layout.xlsx
- A etiqueta "EquipeWeb" é verificada de forma case-insensitive e normalizada
- Se uma tarefa não possui a etiqueta "EquipeWeb", ela pertence automaticamente à Equipe VB
- O filtro de equipe pode ser combinado com outros filtros (Feature, Cliente, Complexidade, etc.)
- Quando um filtro de equipe está ativo, todos os gráficos (Feature, Cliente, Complexidade, Status) mostram apenas os dados daquela equipe

**Uso para Planejamento:**
- Identifique a distribuição de trabalho entre as equipes
- Use para planejar sprints focados em uma equipe específica
- Balance trabalho entre Equipe VB e Equipe Web
- Analise métricas específicas de cada equipe

---

### 5. Análise por Cliente

**Localização:** Quinta seção

**Funcionalidade:**
Agrupa tarefas de backlog por Cliente.

**Visualizações Disponíveis:**
1. **Gráfico (padrão):** Gráfico de barras horizontal mostrando os top clientes
2. **Lista:** Cards individuais para cada cliente

**Controles:**
- **Toggle visualização:** Botão para alternar entre gráfico e lista
- **Filtro "Top":** Permite selecionar top 10, 20, 40 ou todos os clientes

**Métricas Exibidas (por cliente):**
- **Quantidade de tarefas**
- **Horas estimadas**

**Interação:**
- **Clique no gráfico/card:** Filtra lista de tarefas para mostrar apenas tarefas desse cliente

**Ordenação:**
- Clientes são ordenados por quantidade de tarefas (maior primeiro)

**Observações:**
- Clientes são identificados pelo campo "Categorias" do layout.xlsx
- Sistema suporta múltiplos clientes por tarefa
- Clientes são normalizados para comparação

**Uso para Planejamento:**
- Identifique clientes com mais trabalho pendente
- Use para balancear trabalho entre clientes
- Planeje sprints focados em clientes específicos

---

### 6. Análise por Status

**Localização:** Sexta seção

**Funcionalidade:**
Agrupa tarefas de backlog por status atual.

**Visualização:**
- Gráfico de barras mostrando distribuição por status
- Uma barra por status único encontrado

**Métricas Exibidas (por status):**
- **Quantidade de tarefas**
- **Horas estimadas**

**Interação:**
- **Clique na barra:** Filtra lista de tarefas para mostrar apenas tarefas daquele status
- **Hover:** Mostra valores detalhados

**Status Comuns:**
- `Em Progresso`
- `Pendente`
- `Bloqueado`
- `Revisão`
- Outros status definidos no sistema

**Uso para Planejamento:**
- Identifique tarefas bloqueadas que precisam de atenção
- Use para priorizar tarefas por status
- Identifique gargalos de status

---

### 7. Insights

**Localização:** Sétima seção

**Funcionalidade:**
Fornece insights automáticos baseados na análise do backlog.

**Tipos de Insights:**
1. **Distribuição de Complexidade:**
   - Identifica se há muitas tarefas complexas ou simples
   - Sugestões de balanceamento

2. **Features Prioritárias:**
   - Identifica features com mais trabalho pendente
   - Sugestões de priorização

3. **Clientes Prioritários:**
   - Identifica clientes com mais trabalho pendente
   - Sugestões de balanceamento

4. **Status Problemáticos:**
   - Identifica status que indicam problemas (ex: muitos bloqueados)
   - Sugestões de ação

5. **Tarefas Antigas:**
   - Identifica tarefas criadas há muito tempo ainda em backlog
   - Sugestões de revisão

**Visualização:**
- Cards coloridos por tipo de insight
- Ações sugeridas para cada insight

---

### 8. Lista de Tarefas

**Localização:** Última seção

**Funcionalidade:**
Exibe lista completa e detalhada de todas as tarefas em backlog.

**Filtros Disponíveis:**
- **Por Tipo:** Filtra por tipo de tarefa (Bug, Tarefa, História, Folha)
- **Por Feature:** Filtra por feature (ao clicar em uma feature na análise)
- **Por Cliente:** Filtra por cliente (ao clicar em um cliente na análise)
- **Por Complexidade:** Filtra por nível de complexidade (ao clicar na análise)
- **Por Status:** Filtra por status (ao clicar na análise)
- **Limpar filtros:** Remove todos os filtros ativos

**Informações Exibidas (por tarefa):**
- **Chave/ID:** Identificador da tarefa
- **Resumo:** Descrição da tarefa
- **Tipo:** Bug, Tarefa, História, Outro
- **Status:** Status atual da tarefa
- **Responsável:** Nome do desenvolvedor (se atribuído)
- **Complexidade:** Nível 1-5
- **Estimativa:** Horas estimadas
- **Feature(s):** Lista de features associadas
- **Cliente(s):** Lista de clientes associados
- **Data de Criação:** Data em que a tarefa foi criada
- **Sprint:** Campo vazio ou valor não reconhecido

**Ordenação:**
- Por padrão, ordenada por chave/ID
- Pode ser ordenada por qualquer coluna (clicando no cabeçalho)

**Visualização:**
- Tabela responsiva com scroll horizontal em telas pequenas
- Cores por tipo de tarefa:
  - Vermelho: Bugs Reais
  - Amarelo: Dúvidas Ocultas
  - Verde: Folha
  - Azul: Tarefas/Histórias

**Exportação:**
- Botão para exportar lista filtrada para Excel/CSV (se disponível)

**Ações:**
- **Visualizar detalhes:** Clique na tarefa para ver mais informações (se disponível)

---

## Filtros e Interações

### Sistema de Filtros

**Comportamento:**
- Filtros são aplicados em cascata
- Cada filtro adicional refina a lista de tarefas
- Apenas um filtro por tipo pode estar ativo simultaneamente

**Tipos de Filtro:**
1. **Tipo:** Bug, Tarefa, História, Folha, Dúvida Oculta
2. **Feature:** Nome da feature
3. **Cliente:** Nome do cliente
4. **Equipe:** Equipe VB ou Equipe Web
5. **Complexidade:** Nível 1-5
6. **Status:** Status da tarefa

**Aplicação de Filtros:**
- **Por clique:** Clique em gráfico/card na seção correspondente
- **Por seletor:** Use o seletor de tipo (se disponível)
- **Limpar:** Clique no botão "Limpar filtros"

**Indicador de Filtro Ativo:**
- Badge no topo mostrando filtro ativo
- Botão para remover filtro individual

### Limites "Top"

**Disponível em:**
- Análise por Feature
- Análise por Cliente

**Opções:**
- Top 10
- Top 20
- Top 40
- Todas

**Comportamento:**
- Aplica limite apenas na visualização
- Não afeta métricas totais
- Lista de tarefas sempre mostra todas (respeitando filtros)

---

## Métricas e Cálculos

### Horas de Backlog

**IMPORTANTE:** Horas de backlog são calculadas **APENAS pela estimativa original**, nunca pelo worklog.

**Motivo:**
- Tarefas de backlog não têm sprint atribuído
- Worklog de tarefas sem sprint é ignorado
- Não há cálculo de `tempoGastoNoSprint` para backlog

**Campos Utilizados:**
- `estimativa`: Estimativa original da tarefa (da planilha)

**Sem Estimativa:**
- Tarefas sem estimativa aparecem nas contagens, mas não contribuem para horas estimadas

### Contagem de Tarefas

**Regras:**
- Uma tarefa é contada apenas uma vez, mesmo que tenha múltiplas features/clientes
- Tarefas são contadas por escopo selecionado (backlog puro ou todas pendentes)

### Agregação por Dimensão

**Por Feature:**
- Tarefas com múltiplas features são contadas em cada feature
- Horas são divididas igualmente entre features (para contagem, não para métricas)

**Por Cliente:**
- Tarefas com múltiplos clientes são contadas em cada cliente
- Horas são divididas igualmente entre clientes (para contagem, não para métricas)

---

## Integração com Modo Apresentação

A aba Backlog é totalmente compatível com o Modo Apresentação. As seções disponíveis são:

1. **Resumo do Backlog** (`summary`)
2. **Por Complexidade** (`byComplexity`)
3. **Por Feature** (`byFeature`)
4. **Por Equipe** (`byTeam`)
5. **Por Cliente** (`byClient`)
6. **Por Status** (`byStatus`)
7. **Insights** (`insights`)
8. **Lista de Tarefas** (`taskList`)

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

### Planejamento de Sprint
1. Visualize tarefas de backlog
2. Analise por complexidade para balancear trabalho
3. Analise por feature para focar em features específicas
4. Use insights para priorização

### Análise de Prioridades
1. Identifique features/clientes com mais trabalho pendente
2. Use análise por status para identificar bloqueios
3. Analise insights para sugestões automáticas

### Revisão de Backlog
1. Filtre por data de criação para identificar tarefas antigas
2. Analise por status para identificar problemas
3. Use filtros combinados para análises específicas

### Alocação de Trabalho
1. Analise distribuição por complexidade
2. Identifique desenvolvedores sem tarefas atribuídas
3. Use análise por cliente para balancear trabalho

---

## Dicas de Uso

1. **Filtros Intuitivos:**
   - Use os filtros clicando diretamente nos gráficos e cards
   - Combine filtros para análises específicas (ex: Feature + Complexidade)

2. **Análise de Distribuição:**
   - Use "Por Complexidade" para identificar balanceamento
   - Use "Por Feature" para priorização de features
   - Use "Por Cliente" para balanceamento de clientes

3. **Insights Automáticos:**
   - Revise insights gerados automaticamente
   - Use sugestões para priorização e planejamento

4. **Lista Detalhada:**
   - Use lista de tarefas para ver detalhes completos
   - Filtre por múltiplas dimensões para análises específicas
   - Ordene por diferentes colunas para diferentes perspectivas

5. **Exportação:**
   - Exporte lista filtrada para planejamento em outras ferramentas
   - Use para criar planos de sprint em Excel/Google Sheets

---

## Referências

- [Fluxo & Capacidade](BACKLOG_FLUXO.md) - Análise de fluxo de backlog
- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura completa dos arquivos
- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Tratamento de tarefas sem sprint
- [Modo Apresentação](MODO_APRESENTACAO.md) - Configuração de apresentações

