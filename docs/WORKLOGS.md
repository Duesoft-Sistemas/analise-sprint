# Worklogs

Documentação completa da aba **Worklogs**, que fornece análise detalhada dos registros de tempo trabalhado (worklogs).

## Visão Geral

A aba **Worklogs** permite visualizar, analisar e entender como o tempo foi gasto através de múltiplas dimensões: visão geral, análise diária, análise por desenvolvedor e análise por tarefa.

## Acesso

- **Menu:** Oitava opção na barra lateral: "Worklogs"
- **Ícone:** Clock (relógio)
- **Requisitos:**
  - Planilha de worklog carregada (obrigatório)
  - Planilha de layout/tarefas carregada (recomendado para informações completas)
  - Planilha de sprints carregada (opcional para filtro por sprint)

## Filtros Principais

### Período de Análise

**Opções:**
1. **Sprint (padrão):** Analisa apenas worklogs do sprint selecionado
2. **Todos os Períodos:** Analisa todos os worklogs disponíveis

**Comportamento:**
- Ao selecionar "Sprint", o período é definido pelas datas do sprint selecionado
- Ao selecionar "Todos os Períodos", o período abrange do primeiro ao último worklog
- Alterar o período recalcula todas as métricas e visualizações

**Seletor de Sprint:**
- Disponível quando filtro "Sprint" está ativo
- Permite escolher qual sprint analisar
- Quando nenhum sprint está selecionado, "Todos os Períodos" é usado automaticamente

### Filtro por Desenvolvedor

**Funcionalidade:**
- Permite selecionar um ou mais desenvolvedores para análise focada
- Aplicado em todas as visualizações (exceto visão geral agregada)

**Controles:**
- Multi-seleção: Permite selecionar múltiplos desenvolvedores
- "Limpar": Remove todos os filtros de desenvolvedor
- Seleção padrão: Desenvolvedores configurados como padrão (se disponível)

**Comportamento:**
- Ao selecionar desenvolvedores, apenas seus worklogs são considerados
- Outras análises são filtradas para mostrar apenas dados dos desenvolvedores selecionados

## Modos de Visualização

A aba Worklogs possui 4 modos de visualização principais:

1. **Visão Geral** (`overview`) - Análise agregada
2. **Análise Diária** (`daily`) - Evolução ao longo dos dias
3. **Por Desenvolvedor** (`developers`) - Análise individual
4. **Por Tarefa** (`tasks`) - Análise por tarefa

### Toggle de Modos

**Controles:**
- Botões de modo no topo da página
- Um modo ativo por vez
- Modo padrão: "Visão Geral"

---

## 1. Visão Geral

**Modo:** `overview`

**Funcionalidade:**
Fornece uma visão agregada de todos os worklogs no período selecionado.

### Métricas Principais

**Total de Horas:**
- Soma de todas as horas trabalhadas no período
- Calculado a partir de todos os worklogs no período

**Total de Registros:**
- Quantidade total de registros de worklog no período
- Cada linha do worklog.xlsx conta como um registro

**Média de Horas por Dia:**
- Média de horas trabalhadas por dia (considerando apenas dias com registros)
- **Fórmula:** `Total de Horas / Dias com Trabalho`

**Dias com Trabalho:**
- Quantidade de dias únicos com pelo menos um registro de worklog
- Baseado nas datas dos worklogs (sem duplicatas por dia)

**Máxima Diária:**
- Maior quantidade de horas trabalhadas em um único dia do período

**Mínima Diária:**
- Menor quantidade de horas trabalhadas em um dia com registros (dias sem registros não são considerados)

### Visualizações

**Gráfico de Distribuição Diária:**
- Gráfico de barras mostrando horas trabalhadas por dia
- Eixo X: Datas do período
- Eixo Y: Horas trabalhadas
- Útil para identificar padrões, picos e vales de trabalho

**Gráfico de Distribuição por Desenvolvedor:**
- Gráfico de pizza ou barras mostrando horas por desenvolvedor
- Percentual de participação de cada desenvolvedor
- Útil para identificar distribuição de trabalho

**Observações:**
- Se filtro por desenvolvedor estiver ativo, apenas desenvolvedores selecionados aparecem
- Métricas agregadas consideram todo o período (respeitando filtros)

---

## 2. Análise Diária

**Modo:** `daily`

**Funcionalidade:**
Fornece análise detalhada da evolução do trabalho ao longo dos dias.

### Visualização Principal

**Gráfico de Evolução Temporal:**
- Gráfico de linha ou barras mostrando horas trabalhadas por dia
- Eixo X: Datas do período (ordenadas cronologicamente)
- Eixo Y: Horas trabalhadas
- Múltiplas séries: Total geral + breakdown por desenvolvedor (se filtro aplicado)

**Informações por Dia:**
- **Data:** Data do registro
- **Total de Horas:** Horas trabalhadas naquele dia
- **Quantidade de Registros:** Número de worklogs naquele dia
- **Por Desenvolvedor:** Breakdown de horas por desenvolvedor (se múltiplos desenvolvedores)

### Tabela Detalhada

**Colunas:**
- Data
- Total de Horas
- Registros (quantidade)
- Por Desenvolvedor (quando aplicável)

**Interação:**
- Clique na linha para ver detalhes expandidos (se disponível)
- Ordenação por data (padrão) ou por horas (clicando no cabeçalho)

### Insights Automáticos

**Identificação de Padrões:**
- Dias com trabalho acima da média
- Dias com trabalho abaixo da média
- Tendências de aumento/diminuição de horas

**Alertas:**
- Dias sem registros (se esperado ter trabalho)
- Picos de horas (possível sobrecarga)
- Vales de horas (possível subutilização)

---

## 3. Por Desenvolvedor

**Modo:** `developers`

**Funcionalidade:**
Fornece análise individual detalhada de cada desenvolvedor.

### Cards de Desenvolvedor

Cada desenvolvedor possui um card com:

**Cabeçalho:**
- **Nome do Desenvolvedor**
- **Total de Horas:** Soma de todas as horas trabalhadas no período
- **Total de Registros:** Quantidade de worklogs do desenvolvedor

**Métricas de Estatística:**
- **Média Diária:** Média de horas por dia (considerando apenas dias com registros)
- **Dias com Trabalho:** Quantidade de dias únicos com registros
- **Máxima Diária:** Maior quantidade de horas em um único dia
- **Mínima Diária:** Menor quantidade de horas em um dia com registros

**Gráfico de Evolução Diária:**
- Gráfico de linha mostrando horas trabalhadas por dia
- Útil para visualizar padrão de trabalho do desenvolvedor
- Identificação de dias com muito/pouco trabalho

**Tabela de Breakdown Diário:**
- Detalhamento dia a dia do desenvolvedor
- Colunas: Data, Horas, Registros
- Ordenação por data ou por horas

### Ordenação

**Padrão:**
- Desenvolvedores ordenados por total de horas (maior primeiro)

**Alternativa:**
- Ordenação por nome (alfabética)
- Ordenação por média diária
- Ordenação por dias com trabalho

### Filtro por Desenvolvedor

**Comportamento:**
- Filtro aplicado não remove cards (mantém visibilidade)
- Filtro afeta apenas agregações e comparações
- Para análise focada, use o filtro principal de desenvolvedor

---

## 4. Por Tarefa

**Modo:** `tasks`

**Funcionalidade:**
Fornece análise detalhada de worklogs agrupados por tarefa.

### Visualização Principal

**Tabela de Tarefas:**
- Lista de todas as tarefas que possuem worklogs no período
- Agrupamento por tarefa (ID/chave)

**Colunas:**
- **Tarefa:** ID ou chave da tarefa
- **Resumo:** Descrição da tarefa (se disponível na planilha de layout)
- **Responsável:** Nome do desenvolvedor (se disponível)
- **Total de Horas:** Soma de horas trabalhadas na tarefa
- **Registros:** Quantidade de worklogs para a tarefa
- **Datas:** Range de datas (primeiro e último registro)
- **Sprint:** Sprint ao qual a tarefa pertence (se disponível)

### Filtros Adicionais

**Por Tarefa:**
- Busca por ID/chave
- Filtro por tipo de tarefa (se disponível)
- Filtro por sprint

**Por Desenvolvedor:**
- Filtro do desenvolvedor principal aplicado aqui também

### Detalhamento de Tarefa

**Ao expandir uma tarefa (se disponível):**
- Lista completa de worklogs da tarefa
- Breakdown por data
- Breakdown por desenvolvedor (se múltiplos desenvolvedores trabalharam na tarefa)

### Ordenação

**Padrão:**
- Tarefas ordenadas por total de horas (maior primeiro)

**Alternativa:**
- Ordenação por ID/chave
- Ordenação por data (primeiro registro)
- Ordenação por quantidade de registros

---

## Métricas e Cálculos

### Horas Trabalhadas

**Fonte:**
- Todas as horas são calculadas a partir do worklog.xlsx
- Campo "Tempo gasto" do worklog é usado diretamente

**Conversão de Formatos:**
- O sistema aceita múltiplos formatos (ver FORMATO_DADOS.md)
- Conversão automática para horas decimais

### Mapeamento de Desenvolvedores

**Prioridade:**
1. **Campo "Responsável" da Tarefa:** Se worklog corresponde a uma tarefa e tarefa tem responsável, usa responsável da tarefa
2. **Campo "Responsável" do Worklog:** Se disponível no worklog, usa responsável do worklog
3. **Fallback:** "(Sem Responsável)" se nenhum disponível

**Correspondência de Tarefa:**
- Worklog é mapeado para tarefa usando campo "ID da tarefa" do worklog
- Match por ID numérico ou chave completa (ex: "PROJ-101")

### Agregação Temporal

**Por Dia:**
- Worklogs são agrupados por data (ignorando hora)
- Soma de horas do mesmo dia
- Contagem de registros únicos

**Por Sprint:**
- Worklogs são agrupados por período do sprint (usando datas início/fim)
- Apenas worklogs dentro do período são considerados

### Filtros e Agregação

**Filtro por Sprint:**
- Apenas worklogs dentro do período do sprint são considerados
- Datas são comparadas (worklog.data >= sprint.dataInicio && worklog.data <= sprint.dataFim)

**Filtro por Desenvolvedor:**
- Apenas worklogs do desenvolvedor são considerados
- Agregações são recalculadas para o subconjunto

**Filtro por Período:**
- Se "Todos os Períodos", considera todos os worklogs
- Se "Sprint", considera apenas worklogs do sprint selecionado

---

## Integração com Outras Abas

### Sprint Ativo
- Worklogs aparecem como "Horas Gastas" no Sprint Ativo
- Cálculo de `tempoGastoNoSprint` usa worklogs dentro do período do sprint

### Performance
- Worklogs são usados para cálculo de eficiência
- `tempoGastoTotal` é calculado a partir de worklogs

### Multi-Sprint
- Worklogs são agregados por sprint para análises comparativas
- KPIs de gestão usam worklogs filtrados por período

---

## Integração com Modo Apresentação

A aba Worklogs **não possui** seções específicas para o Modo Apresentação configurável.

**Observação:**
- Worklogs são uma aba de análise detalhada
- Melhor usada para investigação e análise manual
- Para apresentações, prefira usar outras abas com métricas agregadas

---

## Casos de Uso

### Verificação de Registro de Tempo
1. Use "Por Tarefa" para verificar se tarefas têm worklogs
2. Identifique tarefas sem registros quando esperado ter trabalho
3. Compare horas trabalhadas vs estimativas

### Análise de Distribuição de Trabalho
1. Use "Visão Geral" para ver distribuição agregada
2. Use "Por Desenvolvedor" para comparar carga de trabalho
3. Identifique desenvolvedores com muito/pouco trabalho

### Identificação de Padrões
1. Use "Análise Diária" para identificar padrões temporais
2. Identifique dias com picos/vales de trabalho
3. Analise tendências ao longo do tempo

### Validação de Dados
1. Use "Por Tarefa" para validar correspondência de worklogs
2. Identifique worklogs órfãos (sem tarefa correspondente)
3. Verifique consistência de datas

---

## Dicas de Uso

1. **Filtros Estratégicos:**
   - Use filtro por sprint para análise focada
   - Use filtro por desenvolvedor para análises individuais
   - Combine filtros para análises específicas

2. **Análise Temporal:**
   - Use "Análise Diária" para identificar padrões
   - Identifique dias sem registros (possível problema)
   - Analise tendências de aumento/diminuição

3. **Comparação de Desenvolvedores:**
   - Use "Por Desenvolvedor" para comparar carga
   - Identifique desenvolvedores sobrecarregados
   - Use para planejamento de alocação

4. **Validação de Dados:**
   - Use "Por Tarefa" para validar correspondência
   - Verifique worklogs órfãos
   - Identifique inconsistências

5. **Exportação:**
   - Exporte dados filtrados para análises externas (se disponível)
   - Use para relatórios e documentação

---

## Referências

- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura completa do arquivo worklog
- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Processamento de worklog e análise híbrida
- [Sprint Ativo](SPRINT_ATIVO.md) - Uso de worklogs no sprint ativo
- [Performance](METRICAS_PERFORMANCE.md) - Uso de worklogs em métricas de performance

