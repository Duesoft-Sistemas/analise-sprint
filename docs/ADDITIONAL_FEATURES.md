# Sugestões de Análises Adicionais

Este documento detalha análises adicionais que foram implementadas além dos requisitos básicos do projeto, para melhorar a gestão dos sprints.

## 1. Sistema de Alertas e Riscos

### Tipos de Alertas

#### Alerta de Alta Prioridade (Vermelho)
- **Desenvolvedor com Sobrecarga**: Identifica quando um desenvolvedor tem mais de 40h alocadas no sprint (>100% de utilização)
- **Tarefas Acima do Tempo**: Tarefas onde o tempo gasto já ultrapassou a estimativa original

#### Alerta de Média Prioridade (Amarelo)
- **Tarefas Próximas do Limite**: Tarefas onde o tempo gasto está entre 80% e 100% da estimativa

#### Alerta de Baixa Prioridade (Azul)
- **Tarefas Sem Progresso**: Tarefas alocadas no sprint mas sem tempo registrado

### Como Usar
Os alertas aparecem no topo do dashboard e ajudam a identificar rapidamente problemas potenciais que precisam de atenção.

## 2. Indicadores de Risco por Desenvolvedor

Cada card de desenvolvedor mostra um indicador visual de risco baseado na utilização:

- **Verde (Baixo)**: Utilização < 70% - Desenvolvedor com capacidade disponível
- **Amarelo (Médio)**: Utilização 70-89% - Desenvolvedor bem alocado, mas perto do limite
- **Vermelho (Alto)**: Utilização ≥ 90% - Desenvolvedor sobrecarregado ou perto disso

## 3. Drill-Down de Tarefas por Desenvolvedor

Clicando em um card de desenvolvedor, você pode:
- Ver todas as tarefas atribuídas a ele
- Analisar a variação de tempo (estimado vs gasto) por tarefa
- Identificar quais tarefas estão consumindo mais tempo

## 4. Análise de Variação de Tempo

Para cada desenvolvedor e tarefa, calculamos:
- **Variação Absoluta**: Diferença em horas entre tempo gasto e estimado
- **Variação Percentual**: Percentual de variação em relação à estimativa
- **Código de Cores**: Verde para dentro/abaixo da estimativa, vermelho para acima

## 5. Cálculo de Horas Disponíveis

Horas disponíveis consideram apenas tarefas que NÃO estão nos seguintes status:
- concluído
- compilar
- teste
- teste gap

Isso permite ver quanto trabalho ainda precisa ser feito no sprint.

## 6. Separação de Bugs Reais vs Dúvidas Ocultas

No totalizador de bugs, separamos:
- **Bugs Reais**: Bugs legítimos que precisam ser corrigidos
- **Dúvidas Ocultas**: Items marcados como bugs mas que são na verdade dúvidas (campo "Detalhes Ocultos" = "DuvidaOculta")

Isso ajuda a ter uma visão mais precisa do número real de bugs.

## 7. Análise Multi-Sprint

### Backlog
- Total de tarefas sem sprint atribuído
- Horas estimadas em backlog

### Distribuição por Sprint
- Visão de todos os sprints abertos
- Horas alocadas e gastas por sprint

### Alocação Cross-Sprint
- Ver quanto cada desenvolvedor tem alocado em diferentes sprints
- Ver quanto cada cliente tem alocado em diferentes sprints
- Identificar desenvolvedores sobrecarregados considerando múltiplos sprints

## 8. Filtros Avançados

Na lista de tarefas, você pode filtrar por:
- **Texto livre**: Busca em resumo, chave e responsável
- **Feature**: Filtra por feature específica
- **Módulo**: Filtra por módulo específico
- **Cliente**: Filtra por categoria/cliente
- **Status**: Filtra por status da tarefa

Os filtros são combinados (AND logic) para refinamento preciso.

## 9. Indicadores Visuais

### Códigos de Cor
- **Verde**: Saudável, dentro do esperado
- **Amarelo**: Atenção, próximo ao limite
- **Vermelho**: Problema, ação necessária

### Barras de Progresso
- Utilização de desenvolvedores (% de 40h semanais)
- Progresso de conclusão do sprint

### Badges de Tipo
- Bugs (vermelho)
- Histórias (verde)
- Tarefas (azul)

## Futuras Melhorias Sugeridas

### 1. Gráfico de Burndown
Visualizar o trabalho restante ao longo do tempo do sprint, ajudando a prever se o sprint será concluído no prazo.

### 2. Velocity Tracking
- Acompanhar a velocidade média da equipe
- Comparar velocidade entre sprints
- Prever capacidade futura baseada em histórico

### 3. Sprint Health Score
Um score único de 0-100 que indica a "saúde" geral do sprint baseado em:
- % de tarefas concluídas
- Variação média de tempo
- Número de alertas críticos
- Utilização da equipe

### 4. Previsão de Conclusão
Usando o tempo gasto atual e a velocidade, prever:
- Quais tarefas provavelmente não serão concluídas
- Quanto tempo extra seria necessário
- Quais desenvolvedores terminarão primeiro

### 5. Análise de Tendências
Com dados históricos:
- Quais tipos de tarefas geralmente estouram estimativas
- Quais features são mais propensas a atrasos
- Padrões de alocação eficiente vs ineficiente

### 6. Comparação de Sprints
- Comparar métricas entre sprints
- Identificar melhorias ou degradações
- Benchmarking de performance

### 7. Export de Relatórios
- Gerar PDFs com resumo do sprint
- Exportar dados para Excel
- Compartilhar relatórios com stakeholders

### 8. Integração Direta
- Conectar diretamente com Jira
- Conectar com Azure DevOps
- Atualização automática dos dados

## Como Contribuir

Se você implementar alguma dessas features ou tiver outras sugestões, sinta-se livre para contribuir!

