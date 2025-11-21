# Gestão de Entregas

Documentação completa da aba **Gestão de Entregas**, que fornece análise e gestão de prazos, entregas e cronogramas de tarefas.

## Visão Geral

A aba **Gestão de Entregas** permite visualizar, analisar e gerenciar prazos de entrega de tarefas, incluindo tarefas com data limite definida e tarefas com previsão calculada, além de cronogramas por cliente.

## Acesso

- **Menu:** Nona opção na barra lateral: "Gestão de Entregas"
- **Ícone:** Package (pacote)
- **Requisitos:**
  - Planilha de layout/tarefas carregada (obrigatório)
  - Planilha de sprints carregada (opcional, mas recomendado para previsões)

## Conceito de Prazos

### Tarefas com Data Limite Definida

**Fonte:** Campo "Data Limite" ou "Prazo Entrega" do layout.xlsx

**Comportamento:**
- Usa a data limite exata definida na planilha
- Apenas tarefas **não concluídas** são incluídas (status diferente de "concluído"/"concluido")
- Status como "teste", "compilar", etc. são incluídos (não são considerados concluídos para gestão de entregas)

**Cálculo de Status:**
- **Vencidas:** Data limite < hoje
- **Vence Hoje:** Data limite = hoje
- **Próximos 7 Dias:** Data limite entre hoje+1 e hoje+7
- **Próximos 30 Dias:** Data limite entre hoje+8 e hoje+30
- **No Prazo:** Data limite > hoje+30

### Tarefas com Previsão Calculada

**Fonte:** Campo "Sprint" do layout.xlsx + períodos do sprints.xlsx

**Cálculo:**
- **Fórmula:** Data final do sprint + 5 dias (sexta-feira da semana seguinte)
- **Motivo:** Prazo padrão de entrega após final do sprint
- **Apenas sprints futuros:** Sprints já finalizados não geram previsões

**Comportamento:**
- Tarefas sem data limite mas com sprint válido recebem previsão calculada
- Previsões são apenas estimativas (marcadas como "Previsão" na visualização)
- Tarefas de backlog ou sem sprint válido não recebem previsão

**Status de Previsões:**
- **Próximas (7 dias):** Previsão entre hoje e hoje+7
- **No Prazo:** Previsão > hoje+7
- **Não são marcadas como vencidas:** Previsões passadas não são consideradas vencidas (são apenas estimativas)

**Função Helper:**
```javascript
function getSextaFeiraSemanaSeguinte(sprintEndDate: Date): Date {
  // sprintEndDate é domingo, então sexta-feira da semana seguinte = domingo + 5 dias
  const sexta = new Date(sprintEndDate);
  sexta.setDate(sexta.getDate() + 5);
  sexta.setHours(23, 59, 59, 999);
  return sexta;
}
```

## Seções da Aba

### 1. Resumo de Entregas

**Localização:** Primeira seção

**Funcionalidade:**
Exibe métricas gerais sobre entregas e prazos.

#### Tarefas com Data Limite

**Cards Principais:**
- **Total:** Quantidade total de tarefas com data limite (não concluídas)
- **Vencidas:** Tarefas com data limite já passada
- **Vence Hoje:** Tarefas que vencem hoje
- **Próximos 7 Dias:** Tarefas que vencem nos próximos 7 dias
- **Próximos 30 Dias:** Tarefas que vencem nos próximos 30 dias
- **No Prazo:** Tarefas com prazo > 30 dias

**Horas por Status:**
- Cada card também exibe horas estimadas (soma das estimativas)
- Útil para análise de impacto de horas vencidas

**Cores por Status:**
- **Vencidas:** Vermelho (crítico)
- **Vence Hoje:** Laranja (urgente)
- **Próximos 7 Dias:** Amarelo (atenção)
- **Próximos 30 Dias:** Azul (planejamento)
- **No Prazo:** Verde (normal)

#### Tarefas com Previsão

**Cards Principais:**
- **Total:** Quantidade total de tarefas com previsão calculada
- **Total de Horas:** Soma das estimativas das tarefas com previsão
- **Por Sprint:** Breakdown por sprint mostrando quantidade e horas

**Distribuição por Sprint:**
- Lista de sprints com previsão
- Quantidade de tarefas por sprint
- Horas estimadas por sprint
- Data de previsão (sexta-feira da semana seguinte ao fim do sprint)

**Visualização:**
- Cards expandíveis por sprint
- Mostra sprint, quantidade, horas e data de previsão

---

### 2. Tarefas com Data Limite

**Localização:** Segunda seção

**Funcionalidade:**
Exibe lista detalhada de tarefas com data limite definida.

**Agrupamento por Status:**
- **Vencidas:** Tarefas atrasadas (vermelho)
- **Vence Hoje:** Tarefas que vencem hoje (laranja)
- **Próximos 7 Dias:** Tarefas que vencem nos próximos 7 dias (amarelo)
- **Próximos 30 Dias:** Tarefas que vencem nos próximos 30 dias (azul)
- **No Prazo:** Tarefas com prazo > 30 dias (verde)

**Informações Exibidas (por tarefa):**
- **Código/ID:** Chave ou ID da tarefa
- **Resumo:** Descrição da tarefa
- **Data Limite:** Data limite definida
- **Status:** Status atual da tarefa
- **Responsável:** Nome do desenvolvedor
- **Horas Estimadas:** Estimativa original
- **Feature(s):** Lista de features associadas
- **Cliente(s):** Lista de clientes associados
- **Sprint:** Sprint ao qual a tarefa pertence

**Ordenação:**
- Por padrão, ordenada por data limite (mais urgentes primeiro)
- Pode ser ordenada por qualquer coluna (clicando no cabeçalho)

**Interação:**
- Expansão/colapso por status
- Filtros adicionais (se disponíveis)

---

### 3. Tarefas com Previsão

**Localização:** Terceira seção

**Funcionalidade:**
Exibe lista detalhada de tarefas com previsão calculada.

**Agrupamento por Sprint:**
- Tarefas são agrupadas por sprint
- Cada sprint mostra:
  - Nome do sprint
  - Quantidade de tarefas
  - Horas estimadas
  - Data de previsão (sexta-feira da semana seguinte)

**Informações Exibidas (por tarefa):**
- **Código/ID:** Chave ou ID da tarefa
- **Resumo:** Descrição da tarefa
- **Data de Previsão:** Data calculada (sexta-feira da semana seguinte)
- **Sprint:** Sprint ao qual a tarefa pertence
- **Status:** Status atual da tarefa
- **Responsável:** Nome do desenvolvedor
- **Horas Estimadas:** Estimativa original
- **Feature(s):** Lista de features associadas
- **Cliente(s):** Lista de clientes associados

**Visualização:**
- Indicador "Previsão" para identificar que é uma estimativa
- Cores diferenciadas (azul claro) para tarefas com previsão

**Observações:**
- Previsões são apenas estimativas baseadas em sprints
- Tarefas sem sprint válido não aparecem aqui
- Apenas sprints futuros geram previsões

---

### 4. Cronograma por Cliente

**Localização:** Quarta seção

**Funcionalidade:**
Exibe cronograma detalhado de entregas agrupado por cliente.

**Agrupamento:**
- Tarefas são agrupadas por cliente (campo "Categorias")
- Tarefas sem cliente vão para "Sem Cliente"

**Métricas por Cliente:**
- **Total de Tarefas:** Quantidade total de tarefas do cliente
- **Total de Horas:** Soma das estimativas das tarefas
- **Vencidas:** Quantidade de tarefas vencidas
- **Próximas:** Quantidade de tarefas nos próximos 7 dias
- **No Prazo:** Quantidade de tarefas no prazo

**Agrupamento por Data de Entrega:**
- Tarefas são agrupadas por data de entrega (limite ou previsão)
- Cada grupo mostra:
  - **Data:** Data de entrega
  - **Tarefas:** Lista de tarefas daquela data
  - **Horas:** Soma das estimativas das tarefas daquela data
  - **Indicador:** Se é previsão ou data limite real

**Ordenação:**
- Clientes ordenados por total de horas (maior primeiro)
- Entregas ordenadas por data (mais próximas primeiro)

**Visualização:**
- Cards expandíveis por cliente
- Linha do tempo visual (se disponível)
- Cores por status (vencidas/próximas/no prazo)

---

### 5. Lista de Tarefas

**Localização:** Quinta seção

**Funcionalidade:**
Exibe lista completa de tarefas com opção de filtros avançados.

**Filtros Disponíveis:**
- **Tipo de Tarefa:**
  - Tarefas com Data Limite
  - Tarefas com Previsão
  - Todas as Tarefas

- **Filtros Adicionais:**
  - **Data De/Até:** Filtro por range de datas
  - **Cliente:** Filtro por cliente
  - **Sprint:** Filtro por sprint
  - **Status:** Filtro multi-seleção por status
  - **Descrição:** Busca por texto no resumo
  - **Código:** Busca por ID/chave
  - **Responsável:** Filtro por desenvolvedor
  - **Feature:** Filtro por feature
  - **Módulo:** Filtro por módulo
  - **Tipo:** Filtro por tipo de tarefa (Bug, Tarefa, etc.)
  - **Complexidade:** Filtro por nível de complexidade

**Informações Exibidas:**
- Todas as informações da tarefa
- Data limite ou previsão
- Status de prazo (vencida/próxima/no prazo)

**Ordenação:**
- Por padrão, ordenada por data limite/previsão
- Pode ser ordenada por qualquer coluna

---

### 6. Exportação de PDF

**Funcionalidade:**
Permite exportar cronogramas por cliente para arquivo PDF.

**Controles:**
- Botão "Exportar PDF" no cronograma por cliente
- Opção para incluir tarefas não planejadas (sem sprint/data limite)

**Conteúdo do PDF:**
- **Cabeçalho:**
  - Logo da empresa (se disponível)
  - Título: "Cronograma de Entregas"
  - Data de geração
  - Cliente (se filtrado)

- **Por Cliente:**
  - Nome do cliente
  - Tabela de entregas agrupadas por data
  - Colunas: Data, Tarefas, Horas, Indicador de Previsão

- **Tabela de Entregas:**
  - Data de entrega
  - Código e descrição das tarefas
  - Horas estimadas
  - Indicador se é previsão ou data limite real

**Formato:**
- Formato A4
- Paginação automática
- Cores e formatação profissional

---

## Métricas e Cálculos

### Cálculo de Previsão

**Fórmula:**
```
previsao = dataFimSprint + 5 dias (sexta-feira da semana seguinte)
```

**Exemplo:**
- Sprint termina em: Domingo, 03/11/2025
- Previsão calculada: Sexta-feira, 08/11/2025 (domingo + 5 dias)

**Condições:**
- Apenas sprints **futuros** geram previsões
- Sprint já finalizado não gera previsão
- Sprint sem período definido não gera previsão

### Status Considerados "Concluídos" para Gestão de Entregas

**IMPORTANTE:** Na gestão de entregas, apenas status "concluído"/"concluido" são considerados concluídos.

**Status Concluídos:**
- `concluído`
- `concluido`

**Status NÃO Concluídos (incluídos na gestão):**
- `teste`
- `teste dev`
- `teste gap`
- `compilar`
- Outros status

**Motivo:**
- Gestão de entregas foca em **entregas finais** para o cliente
- Status intermediários como "teste" não são considerados entregues

### Cálculo de Status de Prazo

**Para Tarefas com Data Limite:**

```javascript
hoje = new Date() // 00:00:00
proximos7Dias = hoje + 7 dias
proximos30Dias = hoje + 30 dias

if (dataLimite < hoje) → VENCIDA
else if (dataLimite === hoje) → VENCE HOJE
else if (dataLimite <= proximos7Dias) → PRÓXIMOS 7 DIAS
else if (dataLimite <= proximos30Dias) → PRÓXIMOS 30 DIAS
else → NO PRAZO
```

**Para Tarefas com Previsão:**

```javascript
// Previsões não são marcadas como vencidas (são apenas estimativas)
if (previsao <= proximos7Dias && previsao >= hoje) → PRÓXIMA
else → NO PRAZO
```

### Agrupamento por Cliente

**Fonte:** Campo "Categorias" do layout.xlsx

**Comportamento:**
- Tarefas podem ter múltiplos clientes (valores separados por vírgula)
- Cada cliente recebe a tarefa no seu cronograma
- Tarefas sem cliente vão para "Sem Cliente"

**Agrupamento por Data:**
- Tarefas são agrupadas por data de entrega (limite ou previsão)
- Múltiplas tarefas na mesma data são agrupadas
- Horas são somadas por data

---

## Integração com Outras Abas

### Sprint Ativo
- Tarefas de gestão de entregas aparecem no Sprint Ativo
- Gestão de entregas complementa análise do sprint com foco em prazos

### Backlog
- Tarefas sem sprint/data limite não aparecem na gestão de entregas
- Gestão de entregas foca em tarefas com prazo definido

---

## Integração com Modo Apresentação

A aba Gestão de Entregas é totalmente compatível com o Modo Apresentação. As seções disponíveis são:

1. **Tarefas com Data Limite** (`dataLimite`)
2. **Tarefas com Previsão** (`previsao`)
3. **Cronograma por Cliente** (`cronograma`)

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

### Gestão de Prazos
1. Visualize tarefas vencidas e próximas
2. Identifique tarefas críticas (vence hoje)
3. Planeje ações corretivas
4. Monitore evolução de prazos

### Cronograma por Cliente
1. Visualize cronograma completo por cliente
2. Identifique concentração de entregas
3. Planeje comunicação com clientes
4. Exporte PDF para compartilhamento

### Planejamento de Sprint
1. Use previsões para planejar próximos sprints
2. Identifique sprints com muitas entregas
3. Balanceie carga de trabalho
4. Planeje dependências

### Relatórios para Clientes
1. Exporte cronograma por cliente para PDF
2. Compartilhe com stakeholders
3. Documente compromissos
4. Use para comunicação de prazos

---

## Dicas de Uso

1. **Filtros Estratégicos:**
   - Use filtro "Tarefas com Data Limite" para foco em prazos reais
   - Use filtro "Tarefas com Previsão" para planejamento
   - Combine filtros para análises específicas

2. **Identificação de Urgências:**
   - Fique atento a tarefas "Vence Hoje" (laranja)
   - Monitore "Próximos 7 Dias" para planejamento
   - Use cores para identificação rápida

3. **Cronograma por Cliente:**
   - Use para comunicação com clientes
   - Identifique concentração de entregas
   - Planeje comunicação proativa

4. **Exportação:**
   - Exporte PDF para compartilhamento
   - Use em reuniões com stakeholders
   - Documente compromissos

5. **Previsões:**
   - Lembre-se que previsões são estimativas
   - Baseadas em sprints futuros
   - Úteis para planejamento, mas não são compromissos firmes

---

## Referências

- [Formato dos Dados](FORMATO_DADOS.md) - Campo "Data Limite" / "Prazo Entrega"
- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Períodos de sprint
- [Sprint Ativo](SPRINT_ATIVO.md) - Análise do sprint atual
- [Modo Apresentação](MODO_APRESENTACAO.md) - Configuração de apresentações

