# Sprint Ativo

Documentação completa da aba **Sprint Ativo**, que é o dashboard principal para análise do sprint atual.

## Visão Geral

A aba **Sprint Ativo** fornece uma visão completa e detalhada do sprint selecionado, incluindo métricas gerais, análises por dimensões (Feature, Cliente), informações dos desenvolvedores e lista de tarefas.

> 💡 **Nota Visual:** Esta documentação pode ser complementada com screenshots. Veja [Guia de Melhorias Visuais](GUIA_MELHORIAS_VISUAIS.md) para recomendações de onde adicionar imagens e diagramas.

## Acesso

- **Menu:** Primeira opção na barra lateral: "Sprint Ativo"
- **Ícone:** BarChart3 (gráfico de barras)
- **Requisitos:** 
  - Planilha de layout/tarefas carregada
  - Planilha de sprints carregada (opcional, mas recomendado)
  - Planilha de worklog carregada (opcional, mas recomendado para métricas precisas)

## Seletor de Sprint

No topo da página, há um seletor de sprint que permite escolher qual sprint será analisado.

**Comportamento:**
- Exibe todos os sprints disponíveis (baseados na planilha `sprints.xlsx`)
- Seleção padrão: primeiro sprint encontrado
- Ao selecionar um sprint, todas as métricas são recalculadas para aquele período

## Seções da Aba

### 1. Alertas de Risco

**Localização:** Topo da página (acima do resumo)

**Funcionalidade:**
- Exibe alertas automáticos sobre problemas identificados no sprint
- Tipos de alertas:
  - Desenvolvedores sobrecarregados (alocação > 100%)
  - Tarefas bloqueadas
  - Tarefas sem estimativa
  - Tarefas sem worklog quando há estimativa

**Visualização:**
- Cards coloridos por severidade (alta = vermelho, média = amarelo, baixa = azul)
- Clique no alerta para ver detalhes ou filtrar tarefas relacionadas

---

### 2. Resumo do Sprint

**Localização:** Primeira seção após alertas

**Funcionalidade:**
Exibe métricas gerais do sprint em cards informativos.

#### Cards Principais

**1. Total de Tarefas**
- **Valor:** Número total de tarefas no sprint
- **Subtítulo:** Quantidade de tarefas concluídas
- **Cor:** Azul

**2. Horas Gastas**
- **Valor:** Horas totais trabalhadas no sprint (baseado em worklog)
- **Subtítulo:** Horas estimadas totais
- **Cor:** Roxo
- **Importante:** Sempre calculado a partir do worklog (`tempoGastoNoSprint`), nunca da planilha

**3. Progresso**
- **Valor:** Percentual de tarefas concluídas
- **Subtítulo:** Número de tarefas concluídas / total
- **Cor:** Verde
- **Fórmula:** `(Tarefas Concluídas / Total de Tarefas) × 100`

**4. Horas Concluídas**
- **Valor:** Horas trabalhadas em tarefas concluídas
- **Subtítulo:** Percentual do tempo total
- **Cor:** Índigo
- **Fórmula:** `(Horas Concluídas / Horas Totais) × 100`

**5. Tarefas Bloqueadas**
- **Valor:** Número de tarefas com status bloqueado
- **Subtítulo:** Horas estimadas das tarefas bloqueadas
- **Cor:** Laranja

#### Análise por Tipo

Abaixo dos cards principais, há uma análise por tipo de tarefa:

**Bugs Reais**
- Tarefas do tipo "Bug" que não são dúvidas ocultas
- Exclui tarefas de DSFolha
- **Cor:** Vermelho

**Dúvidas Ocultas**
- Tarefas do tipo "Bug" marcadas com "DuvidaOculta" ou "Dúvida Oculta" em Detalhes Ocultos
- **Cor:** Amarelo

**Tarefas**
- Tarefas do tipo "Tarefa" ou "Task"
- **Cor:** Azul

**Histórias**
- Tarefas do tipo "História" ou "Story"
- **Cor:** Verde

Cada card mostra:
- **Quantidade:** Número de tarefas
- **Horas Gastas / Horas Estimadas:** Tempo trabalhado vs estimado

---

### 3. Análise por Feature

**Localização:** Segunda seção

**Funcionalidade:**
Agrupa tarefas por Feature e exibe métricas para cada uma.

**Visualizações Disponíveis:**
1. **Gráfico (padrão):** Gráfico de barras horizontal mostrando as top features
2. **Lista:** Cards individuais para cada feature

**Controles:**
- **Toggle visualização:** Botão para alternar entre gráfico e lista
- **Filtro "Top":** Permite selecionar top 10, 20, 40 ou todas as features

**Métricas Exibidas (por feature):**
- **Quantidade de tarefas**
- **Horas gastas** (do worklog)
- **Horas estimadas**

**Interação:**
- **Clique no gráfico/card:** Filtra tarefas na lista de tarefas para mostrar apenas tarefas dessa feature

**Ordenação:**
- Features são ordenadas por quantidade de tarefas (maior primeiro)

**Observações:**
- Features são identificadas pelo campo "Campo personalizado (Feature)" do layout.xlsx
- Sistema suporta múltiplas features por tarefa (valores separados por vírgula/ponto-e-vírgula)
- Features são normalizadas para comparação (case-insensitive, sem acentos)

---

### 4. Análise por Cliente

**Localização:** Terceira seção

**Funcionalidade:**
Agrupa tarefas por Cliente e exibe métricas para cada um.

**Visualizações Disponíveis:**
1. **Gráfico (padrão):** Gráfico de barras horizontal mostrando os top clientes
2. **Lista:** Cards individuais para cada cliente

**Controles:**
- **Toggle visualização:** Botão para alternar entre gráfico e lista
- **Filtro "Top":** Permite selecionar top 10, 20, 40 ou todos os clientes

**Métricas Exibidas (por cliente):**
- **Quantidade de tarefas**
- **Horas gastas** (do worklog)
- **Horas estimadas**

**Interação:**
- **Clique no gráfico/card:** Filtra tarefas na lista de tarefas para mostrar apenas tarefas desse cliente

**Ordenação:**
- Clientes são ordenados por quantidade de tarefas (maior primeiro)

**Observações:**
- Clientes são identificados pelo campo "Categorias" do layout.xlsx
- Sistema suporta múltiplos clientes por tarefa (valores separados por vírgula/ponto-e-vírgula)
- Clientes são normalizados para comparação (case-insensitive, sem acentos)

---

### 5. Desenvolvedores

**Localização:** Quarta seção

**Funcionalidade:**
Exibe cards individuais para cada desenvolvedor que possui tarefas no sprint.

**Layout:**
- Grid responsivo: 1 coluna (mobile), 2 colunas (tablet), 3 colunas (desktop), 4 colunas (telas grandes)

#### Card de Desenvolvedor

Cada card exibe:

**Cabeçalho:**
- **Ícone de usuário** com badge colorido por nível de risco
- **Nome do desenvolvedor**
- **Quantidade de tarefas** atribuídas

**Indicador de Risco:**
- **Baixo (verde):** Alocação normal
- **Médio (amarelo):** Alocação elevada
- **Alto (vermelho):** Alocação crítica (>100%)

**Barra de Utilização (Alocação no Sprint):**
- **Percentual:** `(Horas Alocadas / 40h) × 100`
- **Horas alocadas:** Soma da `estimativaRestante` de todas as tarefas do desenvolvedor
- **Explicação:** Representa quanto trabalho ainda falta executar neste sprint
- **Cor:** Verde (baixo), Amarelo (médio), Vermelho (alto)

**Horas Gastas:**
- Tempo total registrado no sprint através de worklogs (`tempoGastoNoSprint`)
- Sempre calculado a partir do worklog, nunca da planilha

**Horas Disponíveis:**
- Capacidade restante da semana (40h)
- **Cálculo:** Considera o maior valor entre `estimativaRestante` e `tempoGastoNoSprint` para cada tarefa
- **Botão de calculadora:** Clique para ver breakdown detalhado do cálculo
- **Modal:** Abre modal com detalhamento de como as horas disponíveis foram calculadas

**Distribuição por Complexidade:**
- Seção expansível (clique para expandir/contrair)
- Mostra quantidade e percentual de tarefas em cada nível (1-5)
- Barras horizontais visuais com cores:
  - Verde: Complexidade 1-2 (simples)
  - Amarelo: Complexidade 3 (média)
  - Vermelho: Complexidade 4-5 (alta)

**Interação:**
- **Clique no card:** Seleciona/deseleciona o desenvolvedor
- **Card selecionado:** Exibe borda azul e destaque visual
- **Tarefas filtradas:** Ao selecionar um desenvolvedor, a lista de tarefas é filtrada para mostrar apenas tarefas dele

---

### 6. Lista de Tarefas

**Localização:** Última seção

**Funcionalidade:**
Exibe lista completa e detalhada de todas as tarefas do sprint.

**Filtros Disponíveis:**
- **Por Desenvolvedor:** Ao clicar em um card de desenvolvedor
- **Por Feature:** Ao clicar em uma feature na análise por feature
- **Por Cliente:** Ao clicar em um cliente na análise por cliente
- **Limpar filtros:** Deselecionar desenvolvedor ou clicar em "Limpar filtros"

**Informações Exibidas (por tarefa):**
- **Chave/ID:** Identificador da tarefa
- **Resumo:** Descrição da tarefa
- **Tipo:** Bug, Tarefa, História, Outro
- **Status:** Status atual da tarefa
- **Responsável:** Nome do desenvolvedor
- **Complexidade:** Nível 1-5
- **Estimativa:** Horas estimadas
- **Tempo Gasto:** Horas trabalhadas (do worklog)
- **Feature(s):** Lista de features associadas
- **Cliente(s):** Lista de clientes associados
- **Sprint:** Nome do sprint

**Ordenação:**
- Por padrão, ordenada por chave/ID
- Pode ser ordenada por qualquer coluna (clicando no cabeçalho)

**Visualização:**
- Tabela responsiva com scroll horizontal em telas pequenas
- Cores por tipo de tarefa:
  - Vermelho: Bugs
  - Amarelo: Dúvidas Ocultas
  - Azul: Tarefas
  - Verde: Histórias

**Ações:**
- **Visualizar detalhes:** Clique na tarefa para ver mais informações (se disponível)
- **Exportar:** Botão para exportar lista filtrada (se disponível)

---

## Métricas e Cálculos

### Horas Gastas vs Horas Estimadas

**IMPORTANTE:** Todas as horas gastas são **SEMPRE** calculadas a partir do worklog, nunca da planilha de layout.

**Campos utilizados:**
- `tempoGastoNoSprint`: Horas trabalhadas no período do sprint atual (do worklog)
- `estimativa`: Estimativa original da tarefa (da planilha)
- `estimativaRestante`: Estimativa menos horas gastas em outros sprints (para alocação)

**Sem worklog:**
- Se uma tarefa não tiver worklog registrado, `tempoGastoNoSprint = 0`
- Isso pode fazer com que tarefas apareçam como "não iniciadas" mesmo que tenham estimativa

### Status Considerados "Concluídos"

Para métricas de progresso, os seguintes status são considerados concluídos:
- `teste`
- `teste dev`
- `teste gap`
- `compilar`
- `concluído`
- `concluido`

### Status Considerados "Bloqueados"

Tarefas com status que contêm palavras-chave relacionadas a bloqueio são identificadas automaticamente.

---

## Integração com Modo Apresentação

A aba Sprint Ativo é totalmente compatível com o Modo Apresentação. As seções disponíveis para apresentação são:

1. **Resumo do Sprint** (`summary`)
2. **Por Feature** (`byFeature`)
3. **Por Cliente** (`byClient`)
4. **Desenvolvedores** (`developers`)
5. **Tarefas** (`tasks`)

**Configuração:**
- Configure etapas de apresentação em "Apresentação" (ícone ▶ na barra lateral)
- Selecione as seções desejadas e defina intervalos
- Durante a apresentação, a navegação é automática entre as seções

**Ajustes Automáticos:**
- Gráficos são ampliados automaticamente durante apresentação
- Rolagem automática para a seção focada
- Visualizações otimizadas para telas grandes/TVs

---

## Dicas de Uso

1. **Filtros Intuitivos:**
   - Use os filtros clicando diretamente nos gráficos e cards
   - Combine filtros (ex: selecionar desenvolvedor + clicar em feature)

2. **Análise de Capacidade:**
   - Monitore a barra de utilização dos desenvolvedores
   - Identifique desenvolvedores sobrecarregados (vermelho)
   - Use o breakdown de horas disponíveis para detalhamento

3. **Identificação de Problemas:**
   - Fique atento aos alertas de risco no topo
   - Monitore tarefas bloqueadas
   - Verifique tarefas sem worklog quando há estimativa

4. **Análise por Dimensão:**
   - Use "Por Feature" para identificar features com mais trabalho
   - Use "Por Cliente" para distribuição de trabalho entre clientes
   - Compare horas gastas vs estimadas para identificar desvios

5. **Planejamento:**
   - Use a lista de tarefas para ver detalhes completos
   - Filtre por desenvolvedor para ver alocação individual
   - Combine filtros para análises específicas

---

## Referências

- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura completa dos arquivos
- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Sistema híbrido de cálculo
- [Métricas de Performance](METRICAS_PERFORMANCE.md) - Especificações de métricas
- [Modo Apresentação](MODO_APRESENTACAO.md) - Configuração de apresentações

