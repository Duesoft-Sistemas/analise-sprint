# Documentação do Sistema

Bem-vindo à documentação completa do sistema de análise de sprints. Este índice organiza todas as documentações disponíveis por categoria e funcionalidade.

## 📚 Índice Geral

### 🎯 Dashboards Principais

#### Sprint Ativo
- **[Sprint Ativo](SPRINT_ATIVO.md)** - Dashboard principal para análise do sprint atual
  - Métricas gerais, análises por Feature e Cliente
  - Alocação de desenvolvedores e lista de tarefas
  - Alertas de risco e progresso do sprint

#### Multi-Sprint
- **[Multi-Sprint](MULTI_SPRINT.md)** - Análise comparativa entre múltiplos sprints
  - Distribuição e agregação através de sprints
  - KPIs de gestão (treinamento, auxílio, reuniões)
  - Análise histórica e tendências

#### Performance
- **[Métricas de Performance](METRICAS_PERFORMANCE.md)** - Especificações técnicas de métricas
  - Cálculo de Performance Score, Quality Score, Efficiency
  - Bônus de Seniority, Competence e Auxílio
  - Fórmulas e configurações

#### Evolução Temporal
- **[Evolução Temporal](EVOLUCAO_TEMPORAL.md)** - Análise temporal e tendências
  - Agregação por sprint, mês, trimestre, semestre, ano
  - Evolução de carreira e identificação de padrões
  - Comparação individual vs equipe

### 📊 Análises Especializadas

#### Backlog
- **[Backlog](BACKLOG.md)** - Análise detalhada de tarefas pendentes
  - Distribuição por complexidade, feature, cliente e status
  - Insights e recomendações de planejamento
  - Regras de identificação de backlog

#### Fluxo de Backlog
- **[Fluxo & Capacidade](BACKLOG_FLUXO.md)** - Análise de fluxo e recomendação de capacidade
  - Inflow, Outflow, Net Flow e Exit Ratio
  - Recomendação de capacidade (P50/P80)
  - Gráficos de entradas vs saídas

#### Worklogs
- **[Worklogs](WORKLOGS.md)** - Análise detalhada dos registros de tempo
  - Visão geral, análise diária, por desenvolvedor e por tarefa
  - Agregações temporais e estatísticas
  - Identificação de padrões de trabalho

#### Qualidade
- **[Qualidade dos Chamados](QUALIDADE_CHAMADOS.md)** - Análise de problemas de qualidade
  - Identificação de chamados com problemas
  - Resumo por tipo de problema e exportação PDF
  - Integração com métricas de performance

#### Gestão de Entregas
- **[Gestão de Entregas](GESTAO_ENTREGAS.md)** - Controle de prazos e cronogramas
  - Tarefas com data limite e previsão
  - Cronograma por cliente
  - Alertas de atraso e planejamento

#### Tarefas
- **[Tarefas](TAREFAS.md)** - Lista completa e filtros avançados
  - Visualização detalhada de todas as tarefas
  - Filtros por múltiplos critérios
  - Exportação e busca avançada

#### Inconsistências
- **[Inconsistências](INCONSISTENCIAS.md)** - Detecção de problemas nos dados
  - Tipos de inconsistências detectadas
  - Severidade e impacto
  - Recomendações de correção

### ⚙️ Configuração e Dados

#### Formato de Dados
- **[Formato dos Dados](FORMATO_DADOS.md)** - Estrutura completa dos arquivos
  - `layout.xlsx` - Tarefas e suas propriedades
  - `worklog.xlsx` - Registros de tempo trabalhado
  - `sprints.xlsx` - Períodos de sprints
  - Validações e formatos aceitos

#### Configuração
- **[Configuração e Análise Híbrida](CONFIGURACAO.md)** - Sistema híbrido de cálculo
  - Análise híbrida com worklog
  - Processamento de sprints e períodos
  - Cálculo de tempo gasto (tempoGastoTotal, tempoGastoNoSprint)

### 🎨 Funcionalidades do Sistema

#### Modo Apresentação
- **[Modo Apresentação](MODO_APRESENTACAO.md)** - Apresentação automática em slideshow
  - Configuração de etapas e intervalos
  - Todas as seções disponíveis para apresentação
  - Dicas para TVs e reuniões

#### Modo Aplicativo
- **[Modo Aplicativo](MODO_APLICATIVO.md)** - Execução como aplicativo desktop
  - Desenvolvimento e build do aplicativo Electron
  - Processo de atualização
  - Configuração e instalação

#### Atualização do Aplicativo
- **[Atualização do Aplicativo](ATUALIZACAO_APLICATIVO.md)** - Processo de atualização
  - Atualização manual e automática
  - Controle de versão
  - Troubleshooting

### 👥 Documentação para Usuários

#### Guia do Desenvolvedor
- **[Guia do Desenvolvedor](GUIA_DESENVOLVEDOR.md)** - Entendendo sua performance
  - Explicação das métricas de performance
  - Como interpretar os scores
  - Dicas para melhorar performance

### 📋 Documentação de Processo

#### Diagnóstico do Sistema
- **[Diagnóstico do Sistema](DIAGNOSTICO_SISTEMA.md)** - Relatório de validação
  - Verificação de cálculos e consistência
  - Validação de dados e regras
  - Status do sistema

#### Verificação de Documentação
- **[Resumo da Verificação](RESUMO_VERIFICACAO_DOCUMENTACAO.md)** - Status da documentação
  - Checklist de todas as documentações
  - Status de cada feature
  - Referências cruzadas

#### Plano de Verificação
- **[Plano de Verificação](PLANO_VERIFICACAO_DOCUMENTACAO.md)** - Plano de verificação detalhado
  - Mapeamento de features para documentação
  - Identificação de gaps
  - Priorização de tarefas

#### Guia de Melhorias Visuais
- **[Guia de Melhorias Visuais](GUIA_MELHORIAS_VISUAIS.md)** - Recomendações para screenshots e diagramas
  - Esquema de cores do sistema
  - Screenshots recomendados por documentação
  - Diagramas sugeridos
  - Prioridades de implementação

---

## 🗺️ Navegação Rápida por Funcionalidade

### Quero entender...

**Como o sistema funciona:**
1. Comece por [Formato dos Dados](FORMATO_DADOS.md) para entender a estrutura
2. Leia [Configuração e Análise Híbrida](CONFIGURACAO.md) para entender o processamento
3. Explore os dashboards principais: [Sprint Ativo](SPRINT_ATIVO.md) e [Multi-Sprint](MULTI_SPRINT.md)

**Como usar uma feature específica:**
- Use o índice acima para encontrar a documentação da feature
- Cada documentação inclui seção "Acesso", "Como usar" e "Dicas"

**Como entender minhas métricas:**
1. Leia [Guia do Desenvolvedor](GUIA_DESENVOLVEDOR.md) para visão geral
2. Consulte [Métricas de Performance](METRICAS_PERFORMANCE.md) para detalhes técnicos
3. Veja [Evolução Temporal](EVOLUCAO_TEMPORAL.md) para análise de tendências

**Como preparar uma apresentação:**
1. Leia [Modo Apresentação](MODO_APRESENTACAO.md)
2. Configure as etapas desejadas
3. Veja as dicas para TVs e reuniões

**Como executar como aplicativo:**
1. Leia [Modo Aplicativo](MODO_APLICATIVO.md) para desenvolvimento
2. Consulte [Atualização do Aplicativo](ATUALIZACAO_APLICATIVO.md) para atualizações

---

## 📖 Estrutura das Documentações

Todas as documentações seguem um padrão consistente:

1. **Visão Geral** - Descrição geral da funcionalidade
2. **Acesso** - Como acessar e requisitos
3. **Seções/Funcionalidades** - Detalhamento de cada seção
4. **Métricas e Cálculos** - Especificações técnicas (quando aplicável)
5. **Integração com Modo Apresentação** - Seções disponíveis para apresentação
6. **Dicas de Uso** - Melhores práticas
7. **Referências** - Links para documentações relacionadas

---

## 🔗 Referências Cruzadas

Todas as documentações incluem referências cruzadas para facilitar navegação:

- **Formato dos Dados** é referenciado em praticamente todas as documentações
- **Configuração e Análise Híbrida** é referenciada em análises que usam worklog
- **Métricas de Performance** é referenciada em dashboards de performance
- **Modo Apresentação** é referenciada em dashboards que suportam apresentação

---

## 📝 Notas Importantes

### Regras Fundamentais

1. **Worklog é a fonte da verdade:** O tempo gasto é sempre calculado a partir do worklog, nunca da planilha de layout
2. **Backlog não entra em métricas:** Tarefas sem sprint são tratadas como backlog e não entram em métricas de performance ou cálculos híbridos
3. **Análise Híbrida:** O sistema usa análise híbrida combinando dados da planilha (estimativas) com worklog (tempo real)

### Convenções

- **Status concluídos:** `teste`, `teste dev`, `teste gap`, `compilar`, `concluído`, `concluido`
- **Normalização:** Strings são normalizadas (case-insensitive, sem acentos) para comparação
- **Múltiplos valores:** Campos podem aceitar múltiplos valores separados por vírgula ou ponto-e-vírgula

---

## 🤝 Contribuindo com a Documentação

Se você identificar informações faltando, desatualizadas ou incorretas:

1. Verifique se há uma documentação relacionada
2. Consulte [Plano de Verificação](PLANO_VERIFICACAO_DOCUMENTACAO.md) para ver o status
3. Atualize a documentação correspondente seguindo o padrão estabelecido

---

**Última atualização:** Todas as documentações foram verificadas e estão atualizadas conforme o estado atual do sistema.

