# Modo Apresentação

Configuração para apresentar os dashboards em sequência automática, ideal para TVs e reuniões.

## Visão Geral

O **Modo Apresentação** permite configurar uma sequência automática de visualizações que são exibidas em um slideshow contínuo. É ideal para apresentações em reuniões, monitores/TVs em ambientes de trabalho, ou qualquer situação onde se deseja exibir informações de forma rotativa.

## Conceitos

- **Etapa (step)**: unidade do slideshow. Cada etapa aponta para uma aba (`view`) e, opcionalmente, para uma seção específica (`section`, `multiSection`, `backlogSection`, etc.).
- **Intervalo**: tempo padrão de exibição por etapa (em segundos). Pode ser ajustado globalmente, e cada etapa pode ter um intervalo personalizado.
- **Navegação automática**: após o intervalo configurado, o sistema avança automaticamente para a próxima etapa da sequência.

## Como Usar

1. Abra o dashboard e clique em "Apresentação" (ícone ▶ na barra lateral).
2. No modal de configuração:
   - Marque as sessões que deseja apresentar
   - Defina o intervalo em segundos (padrão 60s)
   - Clique em "Salvar" para salvar a configuração
3. Clique em "Reproduzir" para iniciar a apresentação.
4. A reprodução continua automaticamente até você pausar.
5. Você pode avançar manualmente para a próxima etapa com o botão "Próximo".

## Seções Disponíveis

### Sprint Ativo

Seções específicas da aba **Sprint Ativo**:

- **Resumo do Sprint** (`summary`) - Cards com métricas gerais do sprint
- **Por Feature** (`byFeature`) - Análise de tarefas agrupadas por feature
- **Por Cliente** (`byClient`) - Análise de tarefas agrupadas por cliente
- **Desenvolvedores** (`developers`) - Cards individuais dos desenvolvedores

### Multi-Sprint

Seções específicas da aba **Multi-Sprint**:

- **Distribuição por Sprint** (`sprintDistribution`) - Gráfico de distribuição entre sprints
- **Alocação por Desenvolvedor** (`developerAllocation`) - Análise de alocação por desenvolvedor
- **Alocação por Cliente** (`clientAllocation`) - Análise de alocação por cliente
- **Análise de Features** (`featureAnalysis`) - Distribuição de trabalho por feature
- **KPIs de Gestão** (`managementKPIs`) - Indicadores de treinamento, auxílio, reuniões

### Backlog

Seções específicas da aba **Backlog**:

- **Resumo** (`summary`) - Métricas gerais do backlog
- **Por Complexidade** (`byComplexity`) - Distribuição por níveis de complexidade
- **Por Feature** (`byFeature`) - Análise por feature
- **Por Cliente** (`byClient`) - Análise por cliente
- **Por Status** (`byStatus`) - Distribuição por status das tarefas
- **Insights** (`insights`) - Recomendações e insights do backlog
- **Lista de Tarefas** (`taskList`) - Lista completa de tarefas em backlog

### Fluxo & Capacidade (Backlog Flow)

Seções específicas da aba **Fluxo & Capacidade**:

- **KPIs (Tickets)** (`kpis`) - Indicadores de fluxo em quantidade de tickets
- **KPIs (Horas)** (`kpisHours`) - Indicadores de fluxo em horas
- **Gráfico (Tickets)** (`chart`) - Gráfico de entradas vs saídas em tickets
- **Gráfico (Horas)** (`chartHours`) - Gráfico de entradas vs saídas em horas
- **Recomendação de Capacidade** (`capacity`) - Sugestão de capacidade necessária
- **Ajuda** (`help`) - Documentação e ajuda sobre métricas de fluxo

### Gestão de Entregas

Seções específicas da aba **Gestão de Entregas**:

- **Tarefas com Data Limite** (`dataLimite`) - Tarefas com prazo definido
- **Tarefas com Previsão** (`previsao`) - Tarefas com previsão de entrega
- **Cronograma por Cliente** (`cronograma`) - Visualização de cronograma agrupado por cliente
- **Lista de Tarefas** (`taskList`) - Lista completa de tarefas com prazos

### Outras Abas (Sem Subseções)

Aba inteira é exibida em uma única etapa:

- **Performance** (`performance`) - Dashboard de performance dos desenvolvedores
- **Evolução Temporal** (`evolution`) - Análise temporal de métricas e tendências
- **Qualidade dos Chamados** (`quality`) - Análise de problemas de qualidade
- **Inconsistências** (`inconsistencies`) - Detecção de inconsistências nos dados
- **Worklogs** (`worklog`) - Análise de registros de tempo trabalhado
- **Tarefas** (`tasks`) - Lista completa de todas as tarefas

## Atalhos e Parâmetros

### URL Parameters

Você pode iniciar a apresentação automaticamente via URL:

- `?presentation=1` - Inicia a apresentação automaticamente
- `?interval=60000` - Define o intervalo em milissegundos (padrão: 60000ms = 60s)

**Exemplo:**
```
http://localhost:3000/?presentation=1&interval=60000
```

## Dicas de Apresentação

1. **Para TVs e Monitores:**
   - Utilize tema escuro (melhor legibilidade em ambientes iluminados)
   - Ative tela cheia do navegador (F11)
   - Configure intervalos maiores (90-120s) para leitura completa

2. **Para Reuniões:**
   - Prepare a sequência de etapas antes da reunião
   - Use o botão "Próximo" para controle manual durante discussões
   - Mantenha o intervalo padrão (60s) para apresentação fluida

3. **Otimização Visual:**
   - A altura dos gráficos é ampliada automaticamente durante a apresentação
   - Elementos de navegação são minimizados
   - Visualizações são otimizadas para telas grandes

4. **Personalização:**
   - Selecione apenas as seções relevantes para sua audiência
   - Organize a sequência em ordem lógica (resumo → detalhes)
   - Use o botão "Padrão" para restaurar a configuração inicial

## Estrutura Técnica

### Estado Global

O estado da apresentação é gerenciado em `useSprintStore`:

```typescript
presentation: {
  isActive: boolean;        // Se a apresentação está ativa
  isPlaying: boolean;       // Se está reproduzindo automaticamente
  intervalMs: number;       // Intervalo padrão em milissegundos
  steps: PresentationStep[]; // Lista de etapas configuradas
  currentStepIndex: number; // Índice da etapa atual
}
```

### Ações Disponíveis

- `startPresentation()` - Inicia a reprodução automática
- `stopPresentation()` - Para a reprodução
- `nextPresentationStep()` - Avança para a próxima etapa manualmente
- `setPresentationConfig()` - Atualiza configuração (intervalo, estado)
- `setPresentationSteps()` - Define a lista de etapas

### Arquivos Principais

- **Modal de Configuração:** `src/components/PresentationSettingsModal.tsx`
- **Integração no Dashboard:** `src/components/Dashboard.tsx`
- **Tipos:** `src/types/index.ts` (PresentationStep, PresentationConfig)

### Ajustes de Layout

Durante a apresentação, os componentes são ajustados automaticamente:

- `SprintAnalysisDetails` aceita props:
  - `focusSection` - Seção a ser destacada
  - `isPresentation` - Flag indicando modo apresentação
  - `chartHeight` - Altura personalizada dos gráficos

- `AnalyticsChart` aceita:
  - `height` - Altura aumentada para melhor visualização

### Scroll Automático

O sistema realiza scroll automático para a seção focada em cada etapa:

- Cálculo de posição relativa ao container
- Animação suave (smooth scroll)
- Offset para espaçamento adequado

## Referências

- [Sprint Ativo](SPRINT_ATIVO.md) - Detalhes sobre seções do Sprint Ativo
- [Multi-Sprint](MULTI_SPRINT.md) - Detalhes sobre seções do Multi-Sprint
- [Backlog](BACKLOG.md) - Detalhes sobre seções do Backlog
- [Fluxo & Capacidade](BACKLOG_FLUXO.md) - Detalhes sobre seções de Fluxo
- [Gestão de Entregas](GESTAO_ENTREGAS.md) - Detalhes sobre seções de Gestão de Entregas


