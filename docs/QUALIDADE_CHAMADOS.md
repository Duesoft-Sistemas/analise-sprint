# Qualidade dos Chamados

Documentação completa da aba **Qualidade dos Chamados**, que fornece análise de qualidade dos chamados (tickets) identificando problemas e áreas de melhoria.

## Visão Geral

A aba **Qualidade dos Chamados** permite visualizar e analisar chamados que possuem problemas de qualidade, identificando padrões e fornecendo insights para melhoria do processo.

## Acesso

- **Menu:** Quinta opção na barra lateral: "Qualidade dos Chamados"
- **Ícone:** CheckCircle2 (círculo com check)
- **Requisitos:**
  - Planilha de layout/tarefas carregada (obrigatório)
  - Planilha de sprints carregada (recomendado para filtros)

## Conceito de Qualidade de Chamado

**Campo Utilizado:**
- **"Campo personalizado (Qualidade do Chamado)"** do layout.xlsx

**Identificação de Problemas:**
- Chamados com qualidade preenchida e **diferente** de "Informações Claras" são considerados problemas
- Sistema exclui automaticamente chamados com qualidade "Informações Claras" (ou variações)

**Valores Considerados "Informações Claras":**
- "Informações claras"
- "informações claras"
- "Informação clara"
- "informação clara"
- (Comparação case-insensitive)

**Valores Considerados Problemas:**
- Qualquer outro valor preenchido no campo de qualidade
- Valores comuns: "Informações incompletas", "Ambiguidade", "Especificação insuficiente", etc.

## Filtro por Sprint

**Funcionalidade:**
- Permite filtrar análise por sprint específico ou todas as sprints

**Opções Disponíveis:**
- **"Todas" (padrão):** Analisa todos os chamados com problemas de qualidade, independente do sprint
- **Sprint específico:** Analisa apenas chamados do sprint selecionado

**Comportamento:**
- Alterar o filtro recalcula todas as métricas
- Exportação PDF respeita o filtro selecionado

**Seletor de Sprint:**
- Dropdown com todos os sprints disponíveis
- Inclui sprints finalizados e sprint atual (se em andamento)

## Seções da Aba

### 1. Resumo de Qualidade

**Localização:** Primeira seção

**Funcionalidade:**
Exibe métricas gerais sobre chamados com problemas de qualidade.

#### Cards Principais

**Total de Tickets com Problemas:**
- Quantidade total de chamados com problemas de qualidade no filtro selecionado
- Valor absoluto de tickets identificados

**Distribuição por Tipo de Problema:**
- Agrupa chamados por valor do campo "Qualidade do Chamado"
- Cada tipo de problema recebe um card com:
  - **Nome do Problema:** Valor do campo (ex: "Informações incompletas")
  - **Quantidade:** Número de chamados com aquele problema

**Visualização:**
- Cards coloridos por tipo de problema
- Grid responsivo (1-4 colunas dependendo da tela)

---

### 2. Lista de Tickets com Problemas

**Localização:** Segunda seção

**Funcionalidade:**
Exibe lista detalhada de todos os chamados com problemas de qualidade.

**Informações Exibidas (por chamado):**
- **Código/ID:** Chave ou ID da tarefa
- **Resumo:** Descrição da tarefa
- **Qualidade do Chamado:** Valor do problema identificado
- **Tipo:** Tipo da tarefa (Bug, Tarefa, História, etc.)
- **Status:** Status atual da tarefa
- **Responsável:** Nome do desenvolvedor responsável
- **Sprint:** Sprint ao qual a tarefa pertence
- **Data de Criação:** Data em que a tarefa foi criada
- **Feature(s):** Lista de features associadas
- **Cliente(s):** Lista de clientes associados

**Ordenação:**
- **Padrão:** Ordenada por data de criação (mais recentes primeiro)
- Alternativa: Pode ser ordenada por qualquer coluna (clicando no cabeçalho)

**Visualização:**
- Tabela responsiva com scroll horizontal em telas pequenas
- Cores por tipo de problema (se disponível)

**Filtros Adicionais:**
- Filtro por tipo de problema (clicando em card de distribuição)
- Busca por código/resumo (se disponível)

---

### 3. Exportação para PDF

**Funcionalidade:**
Permite exportar a lista de tickets com problemas para um arquivo PDF.

**Controles:**
- Botão "Exportar PDF" no topo da página
- Disponível quando há tickets com problemas

**Conteúdo do PDF:**
- **Cabeçalho:**
  - Logo da empresa (se disponível em `imagens/duesoft.jpg`)
  - Título: "Tickets com Problemas"
  - Informações do filtro (sprint selecionado ou "Todos os sprints")
  - Data de geração
  - Total de tickets

- **Tabela:**
  - Colunas: Código e Descrição
  - Tickets ordenados por data de criação (mais recentes primeiro)
  - Paginação automática

**Formato:**
- Formato A4
- Margens de 15mm
- Fonte padrão (Helvetica)
- Cores em escala de cinza

**Observações:**
- PDF respeita filtro de sprint selecionado
- Apenas tickets com problemas são incluídos
- Tickets com qualidade "Informações Claras" são excluídos

---

## Métricas e Cálculos

### Identificação de Problemas

**Critérios:**
1. Campo "Qualidade do Chamado" está preenchido
2. Campo "Qualidade do Chamado" não é "Informações Claras" (ou variações)
3. Campo "Qualidade do Chamado" não está vazio

**Normalização:**
- Comparação case-insensitive
- Tratamento de espaços em branco (trim)

**Exclusões:**
- Chamados sem campo de qualidade preenchido
- Chamados com qualidade "Informações Claras" (ou variações)

### Agregação por Tipo de Problema

**Agrupamento:**
- Chamados são agrupados por valor exato do campo "Qualidade do Chamado"
- Cada valor único representa um tipo de problema

**Contagem:**
- Quantidade de chamados por tipo de problema
- Considera apenas chamados que atendem aos critérios

**Ordenação:**
- Tipos de problema são ordenados por quantidade (maior primeiro)

---

## Integração com Outras Abas

### Sprint Ativo
- Chamados com problemas aparecem na lista de tarefas do Sprint Ativo
- Podem ser identificados pelo campo de qualidade

### Performance
- Qualidade do chamado não afeta diretamente métricas de performance
- Mas pode indicar necessidade de melhorias no processo

### Análise de Qualidade Geral
- Esta aba foca especificamente em problemas de qualidade
- Complementa análises de qualidade em outras abas

---

## Integração com Modo Apresentação

A aba Qualidade dos Chamados **não possui** seções específicas para o Modo Apresentação configurável.

**Observação:**
- Qualidade dos Chamados é uma aba de análise e auditoria
- Melhor usada para identificação e correção de problemas
- Para apresentações, pode ser usada para mostrar ações de melhoria

---

## Casos de Uso

### Identificação de Problemas de Qualidade
1. Acesse a aba Qualidade dos Chamados
2. Revise lista de tickets com problemas
3. Identifique padrões (tipos de problemas mais comuns)
4. Use insights para melhorias no processo

### Análise por Sprint
1. Selecione sprint específico no filtro
2. Analise problemas de qualidade daquele sprint
3. Compare com sprints anteriores
4. Identifique tendências de melhoria/piora

### Relatórios e Documentação
1. Exporte lista para PDF
2. Use para relatórios de qualidade
3. Documente problemas identificados
4. Compartilhe com equipe para ações corretivas

### Melhoria Contínua
1. Identifique tipos de problemas mais comuns
2. Crie ações preventivas para evitar problemas similares
3. Monitore evolução ao longo do tempo
4. Use para feedback no processo de criação de chamados

---

## Dicas de Uso

1. **Filtro Estratégico:**
   - Use "Todas" para análise geral
   - Use sprint específico para análise focada
   - Compare sprints diferentes para identificar tendências

2. **Identificação de Padrões:**
   - Revise distribuição por tipo de problema
   - Identifique problemas mais comuns
   - Use para priorização de melhorias

3. **Ações Corretivas:**
   - Use lista detalhada para revisar cada chamado
   - Identifique origem dos problemas (cliente, processo, etc.)
   - Crie planos de ação específicos

4. **Exportação:**
   - Exporte para PDF para documentação
   - Use em reuniões de qualidade
   - Compartilhe com stakeholders

5. **Monitoramento:**
   - Revise periodicamente a aba
   - Monitore evolução de problemas ao longo do tempo
   - Celebre redução de problemas de qualidade

---

## Referências

- [Formato dos Dados](FORMATO_DADOS.md) - Campo "Qualidade do Chamado"
- [Sprint Ativo](SPRINT_ATIVO.md) - Visualização de tarefas
- [Performance](METRICAS_PERFORMANCE.md) - Métricas de qualidade (nota de teste)

