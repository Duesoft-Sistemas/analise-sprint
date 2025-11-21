# Guia de Melhorias Visuais

Este documento lista recomendações para adicionar screenshots e diagramas nas documentações do sistema para melhorar a compreensão visual.

## 🎨 Esquema de Cores do Sistema

### Cores por Tipo de Tarefa

**Recomendação:** Adicionar screenshot mostrando uma lista de tarefas com diferentes tipos coloridos.

- **Bugs Reais:** Vermelho (`bg-red-*`)
- **Dúvidas Ocultas:** Amarelo (`bg-yellow-*`)
- **Tarefas/Histórias:** Azul (`bg-blue-*`)
- **Outros Tipos:** Verde (`bg-green-*`)

### Cores de Alertas

**Recomendação:** Screenshot do painel de alertas mostrando diferentes severidades.

- **Alta Severidade:** Vermelho (borda vermelha, badge vermelho)
- **Média Severidade:** Amarelo (borda amarela, badge amarelo)
- **Baixa Severidade:** Azul (borda azul, badge azul)

### Cores de Nível de Risco (Desenvolvedores)

**Recomendação:** Screenshot mostrando cards de desenvolvedores com diferentes níveis de risco.

- **Baixo Risco:** Verde (`from-green-50 to-green-100`)
- **Médio Risco:** Amarelo (`from-yellow-50 to-yellow-100`)
- **Alto Risco:** Vermelho (`from-red-50 to-red-100`)

### Cores dos Cards de Métricas

**Recomendação:** Screenshot do resumo do sprint mostrando todos os cards coloridos.

- **Total de Tarefas:** Azul (`blue-600`)
- **Horas Gastas:** Roxo (`purple-600`)
- **Progresso:** Verde (`green-600`)
- **Horas Concluídas:** Índigo (`indigo-600`)
- **Tarefas Bloqueadas:** Laranja (`orange-600`)

---

## 📸 Screenshots Recomendados por Documentação

### SPRINT_ATIVO.md

**Onde adicionar screenshots:**

1. **Topo da documentação (Visão Geral)**
   - Screenshot completo do dashboard Sprint Ativo
   - Legendas indicando cada seção principal

2. **Seção "Alertas de Risco"**
   - Screenshot do painel de alertas com diferentes tipos de alertas
   - Close-up de um alerta específico mostrando detalhes

3. **Seção "Resumo do Sprint"**
   - Screenshot dos cards principais de métricas
   - Screenshot da análise por tipo (Bugs, Dúvidas Ocultas, etc.)

4. **Seção "Análise por Feature"**
   - Screenshot do gráfico de barras horizontal
   - Screenshot da visualização em lista
   - Comparação lado a lado mostrando o toggle

5. **Seção "Desenvolvedores"**
   - Screenshot mostrando múltiplos cards de desenvolvedores
   - Close-up de um card individual mostrando:
     - Indicador de risco
     - Barra de utilização
     - Distribuição de complexidade expandida

6. **Seção "Lista de Tarefas"**
   - Screenshot da tabela com tarefas coloridas por tipo
   - Screenshot mostrando filtros aplicados

### MULTI_SPRINT.md

**Onde adicionar screenshots:**

1. **Seção "Distribuição por Sprint"**
   - Screenshot do gráfico de barras agrupadas
   - Hover tooltip mostrando valores detalhados

2. **Seção "Alocação por Desenvolvedor"**
   - Screenshot comparando visualização gráfica vs lista
   - Filtro "Top" em ação

3. **Seção "KPIs de Gestão"**
   - Screenshot dos cards de KPIs expandidos mostrando breakdown por sprint
   - Cards de Treinamento, Auxílio e Reuniões

### BACKLOG.md

**Onde adicionar screenshots:**

1. **Seção "Resumo do Backlog"**
   - Screenshot dos cards principais com métricas
   - Distribuição por tipo

2. **Seção "Análise por Complexidade"**
   - Screenshot do gráfico de distribuição de complexidade
   - Visualização em lista com breakdown

3. **Seção "Insights"**
   - Screenshot das recomendações e alertas
   - Cards de insights específicos

### WORKLOGS.md

**Onde adicionar screenshots:**

1. **Seção "Visão Geral"**
   - Screenshot dos cards de métricas principais
   - Gráfico de distribuição diária

2. **Seção "Análise Diária"**
   - Screenshot do gráfico de evolução diária
   - Heatmap de horas trabalhadas

3. **Seção "Por Desenvolvedor"**
   - Screenshot dos cards individuais de desenvolvedores
   - Comparação de horas trabalhadas

### GESTAO_ENTREGAS.md

**Onde adicionar screenshots:**

1. **Seção "Tarefas com Data Limite"**
   - Screenshot do calendário ou timeline
   - Cards de tarefas ordenadas por data

2. **Seção "Cronograma por Cliente"**
   - Screenshot do cronograma agrupado
   - Visualização de prazos por cliente

### PERFORMANCE.md

**Onde adicionar screenshots:**

1. **Topo da documentação**
   - Screenshot do dashboard de performance completo
   - Cards de desenvolvedores com scores

2. **Modal de Detalhes**
   - Screenshot do modal de métricas detalhadas
   - Breakdown de bônus e cálculos

### QUALIDADE_CHAMADOS.md

**Onde adicionar screenshots:**

1. **Seção "Resumo por Tipo de Problema"**
   - Screenshot do gráfico de distribuição
   - Lista de problemas categorizados

2. **Exportação PDF**
   - Preview do PDF gerado
   - Estrutura do relatório

### INCONSISTENCIAS.md

**Onde adicionar screenshots:**

1. **Seção "Tipos de Inconsistências"**
   - Screenshot da lista de inconsistências
   - Filtros por severidade
   - Modal de detalhes de uma inconsistência

---

## 📊 Diagramas Recomendados

### Diagramas de Fluxo

1. **Fluxo de Dados**
   - Diagrama mostrando: `layout.xlsx` → Processamento → `worklog.xlsx` → Análise Híbrida → Dashboards
   - **Onde:** FORMATO_DADOS.md ou CONFIGURACAO.md

2. **Fluxo de Backlog**
   - Diagrama mostrando: Inflow → Sprint → Outflow → Net Flow
   - **Onde:** BACKLOG_FLUXO.md

3. **Fluxo de Cálculo de Performance**
   - Diagrama mostrando: Tasks → Worklog → Métricas → Scores → Bônus → Performance Score Final
   - **Onde:** METRICAS_PERFORMANCE.md

### Diagramas de Arquitetura

1. **Estrutura de Componentes**
   - Diagrama mostrando hierarquia: Dashboard → Componentes Específicos → Visualizações
   - **Onde:** README.md (seção técnica)

2. **Estados de Apresentação**
   - Diagrama mostrando: Configuração → Etapas → Reprodução → Navegação
   - **Onde:** MODO_APRESENTACAO.md

### Diagramas de Estados

1. **Estados de Tarefas**
   - Diagrama mostrando transições: Backlog → Sprint → Em Progresso → Concluído
   - **Onde:** TAREFAS.md ou BACKLOG.md

2. **Níveis de Risco**
   - Diagrama mostrando: Horas Alocadas → Cálculo → Classificação (Baixo/Médio/Alto)
   - **Onde:** SPRINT_ATIVO.md (seção Desenvolvedores)

---

## 🎯 Melhorias Específicas Recomendadas

### 1. Adicionar Exemplos Visuais

**Em todas as documentações:**
- Adicionar exemplos de valores reais (não apenas descrições)
- Mostrar antes/depois de filtros aplicados
- Comparações lado a lado de diferentes configurações

### 2. Adicionar Animações/GIFs

**Onde apropriado:**
- GIF mostrando transição entre visualizações (gráfico ↔ lista)
- GIF mostrando aplicação de filtros em tempo real
- GIF mostrando modo apresentação em ação
- GIF mostrando scroll automático durante apresentação

### 3. Adicionar Legendas Detalhadas

**Para todos os screenshots:**
- Numerar elementos importantes
- Adicionar setas indicando interações
- Destacar áreas clicáveis/interativas
- Mostrar estados diferentes (hover, selecionado, etc.)

### 4. Adicionar Diagramas Interativos

**Onde possível:**
- Diagramas SVG interativos (se usando ferramentas como Mermaid)
- Tooltips explicativos em diagramas
- Zoom em detalhes importantes

---

## 📝 Template para Adicionar Screenshots

Quando adicionar screenshots, usar este template:

```markdown
### [Nome da Seção]

![Descrição do Screenshot](path/to/screenshot.png)

**Legenda:**
1. [Elemento 1] - Descrição
2. [Elemento 2] - Descrição
3. [Elemento 3] - Descrição

**Contexto:** Descrição adicional do que está sendo mostrado e por que é importante.
```

---

## 🔧 Ferramentas Recomendadas

### Para Screenshots
- **Windows:** Snipping Tool, ShareX, Snagit
- **Markdown:** Usar formato `![Alt text](path/to/image.png)`
- **Organização:** Criar pasta `docs/images/` para todos os screenshots

### Para Diagramas
- **Mermaid:** Suportado por muitos renderizadores de Markdown
- **PlantUML:** Para diagramas UML
- **Draw.io:** Para diagramas vetoriais
- **Figma:** Para mockups e wireframes

### Para Animações/GIFs
- **LICEcap:** Para capturar GIFs da tela
- **ScreenToGif:** Alternativa para GIFs
- **Figma:** Para animações simples

---

## ✅ Checklist de Implementação

Quando adicionar melhorias visuais:

- [ ] Screenshots estão em formato otimizado (PNG/JPG, tamanho adequado)
- [ ] Legendas explicam todos os elementos importantes
- [ ] Diagramas estão claros e legíveis
- [ ] Screenshots mostram estados reais do sistema
- [ ] Imagens estão acessíveis (alt text fornecido)
- [ ] Paths das imagens estão corretos
- [ ] Screenshots estão organizados na pasta `docs/images/`
- [ ] Documentação foi atualizada com referências às imagens

---

## 📌 Prioridades

### Alta Prioridade
1. SPRINT_ATIVO.md - Screenshots das seções principais
2. MULTI_SPRINT.md - Screenshots das visualizações
3. README.md - Diagrama de visão geral do sistema

### Média Prioridade
4. BACKLOG_FLUXO.md - Diagrama de fluxo
5. METRICAS_PERFORMANCE.md - Diagrama de cálculos
6. MODO_APRESENTACAO.md - GIF da apresentação

### Baixa Prioridade
7. Todas as outras documentações com screenshots específicos
8. Animações e GIFs interativos
9. Diagramas técnicos detalhados

---

**Nota:** Este documento serve como guia para melhorias futuras. As screenshots e diagramas podem ser adicionados gradualmente conforme necessário ou disponibilidade de recursos.

