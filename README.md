# Sprint Analysis Dashboard

Uma aplicação web moderna para análise e controle de sprints semanais, construída com React, TypeScript e TailwindCSS.

## Recursos

### Fase 1: Análise do Sprint Ativo

- **Métricas de Desenvolvedores:**
  - Total de horas alocadas por desenvolvedor
  - Horas disponíveis (excluindo tarefas concluídas)
  - Comparação entre tempo estimado vs tempo gasto
  - Indicadores de risco (capacidade excedida)
  - Drill-down para ver tarefas específicas de cada desenvolvedor

- **Totalizadores por Tipo:**
  - Bugs (separando bugs reais de dúvidas ocultas)
  - Tarefas
  - Histórias
  - Outros

- **Totalizadores por Dimensão:**
  - Por Feature
  - Por Módulo
  - Por Cliente

- **Lista de Tarefas Filtráveis:**
  - Filtrar por responsável, feature, módulo, cliente e status
  - Busca por texto livre
  - Visualização de estimativa vs tempo gasto

- **Alertas e Riscos:**
  - Tarefas próximas ou acima do tempo estimado
  - Desenvolvedores com sobrecarga
  - Tarefas sem progresso

### Fase 2: Análise Multi-Sprint

- Total de tarefas em backlog
- Distribuição de horas por sprint
- Alocação de horas por desenvolvedor em todos os sprints
- Alocação de horas por cliente em todos os sprints

### Fase 3: Análise Híbrida com Worklog 🆕 NOVO

- **Análise Precisa por Período:**
  - Upload de worklog detalhado com data de lançamento
  - Separação automática de tempo entre sprints
  - Cálculo de estimativa restante para o sprint atual
  - Visualização de tempo gasto em sprints anteriores
  
- **Benefícios:**
  - ✅ Alocação correta de capacidade (40h por dev)
  - ✅ Métricas de performance precisas
  - ✅ Identificação de tarefas que atravessam sprints
  - ✅ Análise de produtividade real

📖 [Ver documentação completa](docs/WORKLOG_HYBRID_ANALYSIS.md)

### Fase 4: Análise de Performance ⭐

**⚠️ IMPORTANTE:** As métricas de performance são ferramentas de **autoconhecimento, coaching e melhoria contínua**, não de avaliação isolada ou ranking competitivo. Use com contexto e empatia.

- **Métricas de Acurácia (Informativas):**
  - Acurácia de estimativa (desvio % entre estimado e gasto)
  - Taxa de acurácia (% de tarefas dentro de ±20%)
  - Tendência de estimativa (subestima/superestima)
  - **Nota:** Reflete o processo de estimativa da equipe/analista, não apenas do dev

- **Métricas de Qualidade:**
  - Taxa de retrabalho (% de tarefas refeitas) - **Considera apenas tarefas concluídas**
  - Taxa de bugs (% de tarefas que são bugs)
  - Ratio bugs vs features
  - Score de qualidade geral (100 - taxa de retrabalho)

- **Métricas de Eficiência:**
  - Taxa de utilização (% da capacidade semanal - 40h)
  - Taxa de conclusão (% de tarefas finalizadas) - **Métrica chave**
  - Tempo médio para conclusão
  - Identificação de bloqueios e sobrecarga

- **Performance Geral:**
  - Score ponderado: 50% Qualidade + 30% Utilização + 20% Conclusão
  - Rankings contextualizados (considere complexidade e módulo)
  - Análise por complexidade (níveis 1-5)
  - Análise por tipo de tarefa (Bug/Tarefa/História)

- **Tendências e Evolução:**
  - Evolução da qualidade ao longo dos sprints
  - Evolução da produtividade ao longo dos sprints
  - Insights automáticos e recomendações acionáveis
  - Identificação de padrões de melhoria

- **Transparência Total:**
  - Documentação completa de como cada métrica é calculada
  - Fórmulas, interpretações e exemplos práticos
  - Modal explicativo integrado na interface
  - Guia detalhado em `docs/PERFORMANCE_METRICS.md`
  - Revisão completa do sistema em `docs/SYSTEM_REVIEW.md`

**📚 Boas Práticas:**
- ✅ Use para identificar necessidades de treinamento
- ✅ Use para detectar sobrecarga e bloqueios
- ✅ Use em retrospectivas de equipe
- ✅ Celebre melhorias e pontos fortes
- ❌ Não use como único critério de avaliação
- ❌ Não compare devs sem considerar contexto
- ❌ Não crie competição prejudicial

## Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **TailwindCSS** - Styling
- **Zustand** - State management
- **SheetJS (xlsx)** - Excel parsing
- **Lucide React** - Icons

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

3. Abra o navegador em `http://localhost:5173`

## Como Usar

1. **Upload do Excel**: Na primeira tela, faça upload de um arquivo Excel (.xlsx ou .xls) com os dados do seu sprint
2. **Selecione o Sprint**: Use o seletor para escolher o sprint ativo que deseja analisar
3. **Visualize as Métricas**: Explore os totalizadores, métricas de desenvolvedores e alertas
4. **Drill-Down**: Clique em um card de desenvolvedor para ver suas tarefas específicas
5. **Multi-Sprint**: Clique em "Ver Multi-Sprint" para análise cross-sprint
6. **Análise de Performance**: Clique em "Performance" para ver métricas detalhadas de acurácia, qualidade e produtividade
   - Visualize por sprint individual ou todos os sprints
   - Veja rankings e comparações entre desenvolvedores
   - Consulte insights automáticos e recomendações
   - Clique em "Como são Calculadas?" para entender cada métrica

## Formato do Excel

O arquivo Excel (.xlsx ou .xls) deve conter as seguintes colunas:

### Colunas Obrigatórias
- Chave da item
- ID da item
- Resumo
- Tempo gasto (formato: "1h 30m" ou "2h" ou "45m")
- Sprint
- Criado
- Estimativa original (formato: "1h 30m" ou "2h")
- Responsável
- ID do responsável
- Status
- Campo personalizado (Modulo)
- Campo personalizado (Feature)
- Categorias
- Campo personalizado (Detalhes Ocultos)

### Colunas Opcionais (para Análise de Performance)
- **Tipo de item** - Bug, Tarefa, História ou Outro
- **Campo personalizado (Retrabalho)** - "Sim" ou "Não" (indica se é retrabalho)
- **Campo personalizado (Complexidade)** - Número de 1 a 5 (nível de complexidade)

### Exemplo de Excel

Veja o arquivo `project/out25-sem4.xlsx` para um exemplo completo com dados reais.

## Status Considerados como "Concluído"

Para o cálculo de horas disponíveis e métricas de performance, os seguintes status são considerados como "entregue pelo desenvolvedor":

- **teste** - Dev entregou para testes
- **teste gap** - Dev entregou para testes de gap
- **compilar** - Pronto para compilar/deploy
- **concluído** ou **concluido** - Finalizado (aceita com ou sem acento)

**Rationale:** Uma vez que o desenvolvedor move a tarefa para teste, ele liberou capacidade para outras tarefas. Se houver problemas identificados nos testes, a métrica de **retrabalho** captura o impacto na qualidade.

## Interpretação dos Alertas

### Alertas de Risco Alto (Vermelho)
- Desenvolvedores com mais de 100% de utilização (>40h alocadas)
- Tarefas onde o tempo gasto já excedeu a estimativa

### Alertas de Risco Médio (Amarelo)
- Tarefas onde o tempo gasto está entre 80% e 100% da estimativa

### Alertas de Risco Baixo (Azul)
- Tarefas sem progresso registrado

## Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## Deploy

Esta aplicação é 100% frontend e pode ser hospedada em qualquer serviço de hosting estático:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Arquitetura

A aplicação segue uma arquitetura de componentes modulares:

```
src/
├── components/        # Componentes React
├── services/          # Lógica de parsing e analytics
├── store/            # State management (Zustand)
├── types/            # TypeScript interfaces
└── utils/            # Funções utilitárias
```

### Fluxo de Dados

1. Arquivo Excel é carregado via `XlsUploader`
2. `xlsParser` converte Excel em objetos `TaskItem`
3. Dados são armazenados no `useSprintStore`
4. `analytics` calcula métricas e totalizadores
5. Componentes renderizam os dados processados

## Contribuindo

Sugestões de melhorias são bem-vindas! Algumas ideias para o futuro:

- Gráficos de burndown
- Export de relatórios em PDF
- Comparação de velocidade entre sprints
- Integração direta com Jira/Azure DevOps
- Modo escuro

## Licença

MIT

