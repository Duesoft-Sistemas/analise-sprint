# Tarefas

Documentação completa da aba **Tarefas**, que fornece lista completa e detalhada de todas as tarefas do sistema com filtros avançados.

## Visão Geral

A aba **Tarefas** permite visualizar, filtrar e analisar todas as tarefas do sistema através de múltiplos critérios, fornecendo uma visão completa e flexível do conjunto de dados.

## Acesso

- **Menu:** Décima opção na barra lateral: "Tarefas"
- **Ícone:** Square (quadrado)
- **Requisitos:**
  - Planilha de layout/tarefas carregada (obrigatório)
  - Planilha de sprints carregada (opcional, mas recomendado para contexto)

## Funcionalidades Principais

### Lista Completa de Tarefas

**Funcionalidade:**
- Exibe **todas** as tarefas do sistema sem restrições
- Inclui tarefas de backlog, tarefas com sprint, tarefas concluídas, etc.

**Comportamento:**
- Nenhuma tarefa é excluída por padrão
- Todas as tarefas são transformadas em `DeliveryTask` para consistência
- Tarefas sem data limite recebem data calculada para ordenação

**Cálculo de Data para Ordenação:**
- **Tarefas com data limite:** Usam data limite definida
- **Tarefas com sprint válido:** Recebem previsão calculada (sexta-feira da semana seguinte)
- **Tarefas sem sprint/data limite:** Recebem data muito futura (aparecem no final)

---

## Filtros Disponíveis

### Filtro de Tipo de Tarefa

**Opções:**
1. **Todas as Tarefas (padrão):** Exibe todas as tarefas
2. **Tarefas com Data Limite:** Apenas tarefas com data limite definida
3. **Tarefas com Previsão:** Apenas tarefas com previsão calculada (sprint válido sem data limite)

**Comportamento:**
- Alterar o filtro recalcula a lista
- Filtros adicionais são aplicados sobre o resultado do filtro de tipo

### Filtros Avançados

**1. Filtro por Data (De/Até)**
- **Data De:** Filtra tarefas com data limite/previsão >= data especificada
- **Data Até:** Filtra tarefas com data limite/previsão <= data especificada
- **Range:** Permite definir intervalo de datas
- **Formato:** YYYY-MM-DD (HTML date input)

**2. Filtro por Cliente**
- Dropdown com todos os clientes disponíveis
- Filtra tarefas que pertencem ao cliente selecionado
- Suporta múltiplos clientes (tarefas podem ter múltiplos clientes)

**3. Filtro por Sprint**
- Dropdown com todos os sprints disponíveis
- Filtra tarefas que pertencem ao sprint selecionado

**4. Filtro por Status**
- Multi-seleção de status
- Opções pré-definidas:
  - **Concluídas:** `teste`, `teste dev`, `teste gap`, `compilar`, `concluído`, `concluido`
  - **Em Progresso:** Outros status comuns
  - **Status Customizados:** Todos os status únicos encontrados nas tarefas
- Permite selecionar múltiplos status simultaneamente

**5. Filtro por Descrição**
- Campo de busca por texto
- Busca no campo "Resumo" da tarefa
- Busca case-insensitive
- Suporta busca parcial (substring match)

**6. Filtro por Código**
- Campo de busca por ID/chave
- Busca no campo "Chave" ou "ID" da tarefa
- Busca case-insensitive
- Suporta busca parcial (substring match)

**7. Filtro por Responsável**
- Dropdown com todos os desenvolvedores disponíveis
- Filtra tarefas atribuídas ao desenvolvedor selecionado

**8. Filtro por Feature**
- Dropdown com todas as features disponíveis
- Filtra tarefas que pertencem à feature selecionada
- Suporta múltiplas features (tarefas podem ter múltiplas features)

**9. Filtro por Módulo**
- Dropdown com todos os módulos disponíveis
- Filtra tarefas que pertencem ao módulo selecionado

**10. Filtro por Tipo**
- Dropdown com tipos de tarefa:
  - **Bug:** Tarefas do tipo "Bug"
  - **Tarefa:** Tarefas do tipo "Tarefa" ou "Task"
  - **História:** Tarefas do tipo "História" ou "Story"
  - **Outro:** Outros tipos

**11. Filtro por Complexidade**
- Dropdown com níveis de complexidade (1-5)
- Filtra tarefas com o nível de complexidade selecionado

### Aplicação de Filtros

**Comportamento:**
- Filtros são aplicados em cascata (E lógico)
- Todos os filtros ativos devem ser atendidos simultaneamente
- Filtros podem ser combinados livremente
- Alterar qualquer filtro recalcula a lista

**Limpeza de Filtros:**
- Botão "Limpar Filtros" remove todos os filtros
- Reset para visualização padrão (todas as tarefas)

---

## Seções da Aba

### 1. Lista de Tarefas

**Localização:** Seção principal

**Funcionalidade:**
Exibe lista completa e detalhada de todas as tarefas filtradas.

**Informações Exibidas (por tarefa):**
- **Código/ID:** Chave ou ID da tarefa
- **Resumo:** Descrição da tarefa
- **Tipo:** Tipo da tarefa (Bug, Tarefa, História, Outro)
- **Status:** Status atual da tarefa
- **Responsável:** Nome do desenvolvedor responsável
- **Complexidade:** Nível de complexidade (1-5)
- **Estimativa:** Horas estimadas
- **Tempo Gasto:** Horas trabalhadas (do worklog)
- **Data Limite/Previsão:** Data limite definida ou previsão calculada
- **Sprint:** Sprint ao qual a tarefa pertence
- **Feature(s):** Lista de features associadas
- **Cliente(s):** Lista de clientes associados
- **Módulo:** Módulo da tarefa
- **Data de Criação:** Data em que a tarefa foi criada

**Visualização:**
- Tabela responsiva com scroll horizontal em telas pequenas
- Cores por tipo de tarefa:
  - Vermelho: Bugs Reais
  - Amarelo: Dúvidas Ocultas
  - Azul: Tarefas/Histórias
  - Verde: Outros tipos

**Ordenação:**
- Por padrão, ordenada por data limite/previsão (mais urgentes primeiro)
- Pode ser ordenada por qualquer coluna (clicando no cabeçalho)
- Indicador de direção de ordenação (ascendente/descendente)

**Paginização:**
- Lista pode ser paginada (se houver muitas tarefas)
- Controle de itens por página (se disponível)

---

### 2. Filtros Avançados

**Localização:** Topo da página

**Funcionalidade:**
Permite aplicar múltiplos filtros simultaneamente.

**Controles:**
- **Barra de filtros:** Expandível/colapsável
- **Campos de filtro:** Inputs, dropdowns, seletores
- **Botão "Limpar Filtros":** Remove todos os filtros

**Layout:**
- Grid responsivo (1-3 colunas dependendo da tela)
- Agrupamento lógico de filtros relacionados

**Indicadores:**
- Badge mostrando quantidade de filtros ativos
- Indicador visual de filtros aplicados

---

### 3. Exportação para PDF

**Funcionalidade:**
Permite exportar lista filtrada de tarefas para arquivo PDF.

**Controles:**
- Botão "Exportar PDF" no topo da página
- Disponível quando há tarefas filtradas

**Conteúdo do PDF:**
- **Cabeçalho:**
  - Logo da empresa (se disponível em `imagens/duesoft.jpg`)
  - Título: "Lista de Tarefas"
  - Informações dos filtros aplicados
  - Data de geração
  - Total de tarefas

- **Tabela:**
  - Colunas: Todas as colunas visíveis na lista
  - Tarefas ordenadas conforme visualização
  - Paginação automática

**Formato:**
- Formato A4
- Margens de 15mm
- Fonte padrão (Helvetica)
- Cores e formatação profissional

**Opções:**
- Incluir todas as colunas ou colunas selecionadas (se disponível)
- Orientação (portrait/landscape) (se disponível)

---

## Métricas e Cálculos

### Cálculo de Data para Ordenação

**Prioridade:**
1. **Data Limite Definida:** Usa data limite da planilha
2. **Previsão Calculada:** Calcula previsão baseada em sprint (sexta-feira da semana seguinte)
3. **Data Futura (Backlog):** Usa data muito futura (2100-01-01) para aparecer no final

**Comportamento:**
- Tarefas são ordenadas por data limite/previsão por padrão
- Tarefas sem data aparecem no final
- Ordenação pode ser alterada por qualquer coluna

### Transformação de Tarefas

**Para Consistência:**
- Todas as tarefas são transformadas em `DeliveryTask` para visualização
- Isso permite calcular data limite/previsão uniformemente
- Facilita ordenação e filtros por data

**Estrutura:**
```typescript
interface DeliveryTask extends TaskItem {
  dataLimiteCalculada: Date; // Data limite real ou prevista
  isPrevisao: boolean; // Se a data é uma previsão
}
```

---

## Integração com Outras Abas

### Sprint Ativo
- Tarefas aparecem na lista de tarefas do Sprint Ativo
- Filtros podem ser aplicados também no Sprint Ativo

### Gestão de Entregas
- Tarefas aparecem na gestão de entregas
- Filtros de data limite/previsão são similares

### Backlog
- Tarefas de backlog aparecem na aba Tarefas
- Filtro por sprint pode identificar tarefas de backlog

---

## Integração com Modo Apresentação

A aba Tarefas **não possui** seções específicas para o Modo Apresentação configurável.

**Observação:**
- Tarefas é uma aba de análise e consulta detalhada
- Melhor usada para pesquisas e análises específicas
- Para apresentações, prefira usar outras abas com métricas agregadas

---

## Casos de Uso

### Pesquisa de Tarefas
1. Use filtros para encontrar tarefas específicas
2. Combine múltiplos filtros para busca precisa
3. Use busca por código/descrição para tarefas conhecidas
4. Exporte resultado para documentação

### Análise Detalhada
1. Visualize todas as informações de uma tarefa
2. Compare tarefas similares
3. Identifique padrões através de filtros
4. Use ordenação para análises específicas

### Relatórios Customizados
1. Aplique filtros específicos para o relatório
2. Exporte para PDF
3. Compartilhe com stakeholders
4. Documente análises específicas

### Validação de Dados
1. Use filtros para identificar problemas
2. Identifique tarefas sem informações essenciais
3. Valide consistência dos dados
4. Use para limpeza de dados

---

## Dicas de Uso

1. **Filtros Estratégicos:**
   - Comece com filtros amplos e refina progressivamente
   - Combine filtros para busca precisa
   - Use "Limpar Filtros" para resetar

2. **Busca por Texto:**
   - Use busca por código para tarefas conhecidas
   - Use busca por descrição para tarefas similares
   - Busca é parcial (não precisa ser exato)

3. **Ordenação:**
   - Use ordenação para análises específicas
   - Clique no cabeçalho da coluna para alterar ordenação
   - Combine ordenação com filtros

4. **Exportação:**
   - Aplique filtros antes de exportar
   - PDF inclui apenas tarefas filtradas
   - Use para documentação e relatórios

5. **Análise de Padrões:**
   - Use filtros combinados para identificar padrões
   - Compare diferentes conjuntos de tarefas
   - Use para insights e melhorias

---

## Referências

- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura completa dos arquivos
- [Sprint Ativo](SPRINT_ATIVO.md) - Lista de tarefas no sprint
- [Gestão de Entregas](GESTAO_ENTREGAS.md) - Tarefas com prazos
- [Backlog](BACKLOG.md) - Tarefas sem sprint

