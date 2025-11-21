# Inconsistências

Documentação completa da aba **Inconsistências**, que detecta e identifica problemas e inconsistências nos dados do sistema.

## Visão Geral

A aba **Inconsistências** permite identificar e corrigir problemas nos dados carregados, fornecendo detecção automática de inconsistências e erros de entrada.

## Acesso

- **Menu:** Décima primeira opção na barra lateral: "Inconsistências"
- **Ícone:** AlertTriangle (triângulo de alerta)
- **Requisitos:**
  - Planilha de layout/tarefas carregada (obrigatório)
  - Planilha de worklog carregada (recomendado para detecção completa)
  - Planilha de sprints carregada (recomendado para validação de sprints)

## Filtro por Sprint

**Funcionalidade:**
- Permite filtrar análise por sprint específico

**Comportamento:**
- Quando sprint é selecionado, apenas inconsistências daquele sprint são exibidas
- Quando nenhum sprint é selecionado, todas as inconsistências são exibidas
- Alterar o filtro recalcula todas as inconsistências

**Seletor de Sprint:**
- Dropdown com todos os sprints disponíveis
- Opção "Todos" para exibir todas as inconsistências

---

## Tipos de Inconsistências Detectadas

### 1. Tarefas Concluídas sem Worklog

**Severidade:** Alta 🔴

**Descrição:**
- Tarefas com status "concluído" mas sem nenhum registro de worklog
- Indica possível falta de registro de tempo

**Detecção:**
- Status considerado concluído: `teste`, `teste dev`, `teste gap`, `compilar`, `concluído`, `concluido`
- Tarefa não possui worklog correspondente (match por ID ou chave)

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "ImpediimentoTrabalho" em Detalhes Ocultos
- Tarefas com tipo "Testes" (normalizado para "Outro")

**Impacto:**
- Métricas de tempo trabalhado podem estar incorretas
- Performance Score pode estar incorreto (tarefas aparecem como ineficientes)

**Ação Recomendada:**
- Verificar se worklog foi registrado para a tarefa
- Adicionar worklogs faltantes ou ajustar status da tarefa

---

### 2. Worklogs sem Tarefa Correspondente

**Severidade:** Média 🟡

**Descrição:**
- Registros de worklog que não correspondem a nenhuma tarefa no layout
- Indica possível erro de ID/chave no worklog ou tarefa inexistente

**Detecção:**
- Worklog possui taskId que não corresponde a nenhuma tarefa (match por ID ou chave)

**Impacto:**
- Horas trabalhadas não são contabilizadas em nenhuma tarefa
- Métricas agregadas podem estar incorretas

**Ação Recomendada:**
- Verificar ID/chave do worklog
- Verificar se tarefa existe no layout
- Corrigir ID/chave ou remover worklog órfão

---

### 3. Tarefas Duplicadas

**Severidade:** Média 🟡

**Descrição:**
- Tarefas com a mesma chave ou ID aparecendo múltiplas vezes
- Pode causar duplicação nos cálculos

**Detecção:**
- Mesma chave ou ID aparece em múltiplas tarefas
- Match por chave (prioridade) ou ID (fallback)

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "Testes" em Detalhes Ocultos

**Impacto:**
- Cálculos podem ser duplicados
- Métricas podem estar infladas

**Ação Recomendada:**
- Verificar se são tarefas realmente duplicadas
- Remover duplicatas ou corrigir IDs/chaves

---

### 4. Sprints Inexistentes

**Severidade:** Média 🟡

**Descrição:**
- Tarefas referenciando sprints que não existem no arquivo de sprints
- Impacta agrupamento e análise por sprint

**Detecção:**
- Sprint da tarefa não existe em `sprintMetadata`
- Comparação case-sensitive após trim

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "Testes" em Detalhes Ocultos
- Tarefas de backlog (sem sprint) não são consideradas inconsistências

**Impacto:**
- Tarefas não são agrupadas corretamente por sprint
- Análises por sprint podem estar incompletas

**Ação Recomendada:**
- Verificar nome do sprint na tarefa vs arquivo de sprints
- Corrigir nome do sprint ou adicionar sprint ao arquivo

---

### 5. Valores Numéricos Inválidos

**Severidade:** Média 🟡

**Descrição:**
- Tarefas com estimativas negativas ou extremamente altas (>200h)
- Tempo gasto negativo (não deveria acontecer)

**Detecção:**
- Estimativa < 0 ou > 200
- Tempo gasto < 0

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "Testes" em Detalhes Ocultos

**Impacto:**
- Cálculos podem estar incorretos
- Métricas podem estar distorcidas

**Ação Recomendada:**
- Verificar valores no layout.xlsx
- Corrigir estimativas/tempo gasto incorretos

---

### 6. Worklogs com Tempo Inválido

**Severidade:** Média 🟡

**Descrição:**
- Registros de worklog com tempo gasto negativo ou zero
- Pode indicar erro de registro

**Detecção:**
- Worklog possui `tempoGasto <= 0`

**Impacto:**
- Horas trabalhadas podem estar incorretas
- Métricas de tempo podem estar distorcidas

**Ação Recomendada:**
- Verificar valores no worklog.xlsx
- Corrigir ou remover worklogs com tempo inválido

---

### 7. Datas Inválidas

**Severidade:** Média 🟡

**Descrição:**
- Datas de criação no futuro, worklogs no futuro, ou sprints com período inválido

**Tipos:**
- **Tarefas:** Data de criação no futuro
- **Worklogs:** Data de registro no futuro
- **Sprints:** Data fim anterior à data início

**Detecção:**
- Data de criação > hoje (tarefas)
- Data de registro > hoje (worklogs)
- Data fim < data início (sprints)

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "Testes" em Detalhes Ocultos

**Impacto:**
- Análises temporais podem estar incorretas
- Agrupamento por período pode estar errado

**Ação Recomendada:**
- Verificar datas no layout.xlsx, worklog.xlsx, sprints.xlsx
- Corrigir datas incorretas

---

### 8. Worklogs com Data Muito Antiga

**Severidade:** Baixa 🟢

**Descrição:**
- Registros de worklog com data anterior a 2020
- Pode indicar erro de data ou dados históricos

**Detecção:**
- Worklog possui data < 2020-01-01

**Impacto:**
- Geralmente não impacta análises recentes
- Pode indicar dados históricos legados

**Ação Recomendada:**
- Verificar se é dado histórico legítimo
- Se for erro, corrigir ou remover worklog

---

### 9. Tarefas sem Responsável

**Severidade:** Média 🟡

**Descrição:**
- Tarefas sem responsável ou ID do responsável definido
- Impacta análise por desenvolvedor

**Detecção:**
- Tarefa não possui campo "Responsável" nem "ID do responsável" preenchido

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "Testes" em Detalhes Ocultos

**Impacto:**
- Análises por desenvolvedor podem estar incompletas
- Tarefas não aparecem nos cards de desenvolvedores

**Ação Recomendada:**
- Adicionar responsável às tarefas
- Verificar se campo está preenchido no layout.xlsx

---

### 10. Campos Obrigatórios Ausentes

**Severidade:** Alta 🔴

**Descrição:**
- Tarefas sem chave/ID ou worklogs sem taskId
- Dados incompletos que podem causar problemas

**Tipos:**
- **Tarefas:** Sem chave nem ID
- **Worklogs:** Sem taskId

**Detecção:**
- Tarefa: `!chave && !id`
- Worklog: `!taskId`

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "Testes" em Detalhes Ocultos

**Impacto:**
- Tarefas podem não ser processadas corretamente
- Worklogs órfãos não são vinculados a tarefas

**Ação Recomendada:**
- Adicionar chave/ID às tarefas
- Adicionar taskId aos worklogs
- Verificar campos obrigatórios no layout.xlsx e worklog.xlsx

---

### 11. Estimativas Inconsistentes

**Severidade:** Baixa 🟢

**Descrição:**
- Tarefas com tempo gasto muito maior que a estimativa original (>300%)
- Pode indicar erro de registro ou estimativa incorreta

**Detecção:**
- `tempoGastoTotal > 0 && estimativa > 0`
- `(tempoGastoTotal / estimativa) × 100 > 300`

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "Testes" em Detalhes Ocultos

**Impacto:**
- Pode indicar problemas no processo de estimativa
- Geralmente não impacta cálculos, mas pode indicar necessidade de revisão

**Ação Recomendada:**
- Revisar estimativa original
- Verificar se tempo gasto está correto
- Considerar ajuste de estimativa para tarefas futuras similares

---

### 12. Tarefas sem Estimativa

**Severidade:** Média 🟡

**Descrição:**
- Tarefas que não possuem estimativa de horas e não são do tipo "auxílio", "reunião" ou "treinamento"

**Detecção:**
- Tarefa não possui `estimativa > 0`
- Tarefa não é do tipo "Auxilio", "Reunião" ou "Treinamento" (Detalhes Ocultos)

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "Testes" em Detalhes Ocultos
- Tarefas marcadas como "Auxilio", "Reunião" ou "Treinamento"

**Impacto:**
- Cálculos de eficiência podem estar incorretos
- Métricas de estimativa podem estar incompletas

**Ação Recomendada:**
- Adicionar estimativa às tarefas
- Verificar se estimativa está preenchida no layout.xlsx

---

### 13. Tarefas Concluídas sem Nota de Teste

**Severidade:** Média 🟡

**Descrição:**
- Tarefas que foram concluídas mas não possuem nota de teste
- A ausência da nota impede o cálculo correto do score de qualidade e performance

**Detecção:**
- Tarefa possui status concluído: `teste`, `teste dev`, `teste gap`, `compilar`, `concluído`, `concluido`
- Tarefa não possui `notaTeste` (null ou undefined)
- Tarefa **não** está em fase de teste (status não é "teste", "teste dev", "teste gap")

**Exclusões:**
- Tarefas com "ImpedimentoTrabalho" ou "Testes" em Detalhes Ocultos
- Tarefas marcadas como "Auxilio", "Reunião" ou "Treinamento"
- Tarefas em fase de teste (status contém "teste")

**Impacto:**
- Quality Score não é calculado corretamente
- Performance Score pode estar incorreto (qualidade não é considerada)

**Ação Recomendada:**
- Adicionar nota de teste às tarefas concluídas
- Verificar se nota de teste está preenchida no layout.xlsx

---

## Níveis de Severidade

### Alta 🔴
- **Tarefas Concluídas sem Worklog:** Impacta métricas de tempo e performance
- **Campos Obrigatórios Ausentes:** Dados incompletos podem causar problemas

**Ação:** Corrigir imediatamente

### Média 🟡
- **Worklogs sem Tarefa Correspondente:** Impacta métricas agregadas
- **Tarefas Duplicadas:** Pode causar duplicação nos cálculos
- **Sprints Inexistentes:** Impacta agrupamento
- **Valores Numéricos Inválidos:** Impacta cálculos
- **Worklogs com Tempo Inválido:** Impacta métricas de tempo
- **Datas Inválidas:** Impacta análises temporais
- **Tarefas sem Responsável:** Impacta análises por desenvolvedor
- **Tarefas sem Estimativa:** Impacta cálculos de eficiência
- **Tarefas Concluídas sem Nota de Teste:** Impacta quality score

**Ação:** Corrigir quando possível

### Baixa 🟢
- **Worklogs com Data Muito Antiga:** Geralmente não impacta análises recentes
- **Estimativas Inconsistentes:** Pode indicar necessidade de revisão

**Ação:** Revisar e corrigir se necessário

---

## Seções da Aba

### 1. Resumo de Inconsistências

**Localização:** Primeira seção

**Funcionalidade:**
Exibe resumo geral das inconsistências detectadas.

**Métricas:**
- **Total de Inconsistências:** Quantidade total de inconsistências
- **Por Severidade:**
  - Alta: Quantidade de inconsistências de alta severidade
  - Média: Quantidade de inconsistências de média severidade
  - Baixa: Quantidade de inconsistências de baixa severidade
- **Por Categoria:**
  - Worklog: Inconsistências relacionadas a worklogs
  - Dados: Inconsistências relacionadas a dados de tarefas
  - Validação: Inconsistências relacionadas a valores inválidos
  - Data: Inconsistências relacionadas a datas
  - Sprint: Inconsistências relacionadas a sprints
  - Estimativa: Inconsistências relacionadas a estimativas
  - Qualidade: Inconsistências relacionadas a qualidade

**Visualização:**
- Cards coloridos por severidade (vermelho/amarelo/verde)
- Gráficos de distribuição por severidade e categoria

---

### 2. Lista de Inconsistências

**Localização:** Segunda seção

**Funcionalidade:**
Exibe lista detalhada de todas as inconsistências detectadas.

**Agrupamento:**
- Por tipo de inconsistência
- Por severidade
- Por categoria

**Informações Exibidas (por inconsistência):**
- **Tipo:** Tipo de inconsistência
- **Severidade:** Nível de severidade (Alta/Média/Baixa)
- **Categoria:** Categoria da inconsistência
- **Título:** Título descritivo
- **Descrição:** Descrição detalhada do problema
- **Quantidade:** Número de itens afetados
- **Itens:** Lista de itens (tarefas/worklogs/sprints) afetados

**Visualização:**
- Cards expandíveis por tipo de inconsistência
- Lista de itens dentro de cada card
- Cores por severidade

**Interação:**
- **Expandir/Colapsar:** Clique no card para expandir/colapsar
- **Ver Detalhes:** Clique no item para ver detalhes (se disponível)
- **Filtro por Tipo:** Filtro dropdown por tipo de inconsistência

---

### 3. Detalhes dos Itens Afetados

**Localização:** Dentro dos cards de inconsistência

**Funcionalidade:**
Exibe lista detalhada de tarefas/worklogs/sprints afetados por cada inconsistência.

**Informações Exibidas:**
- **Para Tarefas:**
  - Código/ID, Resumo, Tipo, Status, Responsável, Sprint, etc.
- **Para Worklogs:**
  - TaskId, Data, Tempo Gasto, Responsável, etc.
- **Para Sprints:**
  - Nome do Sprint, Data Início, Data Fim, etc.

**Visualização:**
- Tabela responsiva com scroll horizontal
- Ordenação por qualquer coluna

---

## Filtros e Interações

### Filtro por Sprint

**Funcionalidade:**
- Filtra inconsistências por sprint específico
- Quando sprint é selecionado, apenas inconsistências daquele sprint são exibidas

**Comportamento:**
- Aplicado a todas as inconsistências relacionadas a tarefas
- Inconsistências relacionadas a worklogs/sprints podem não ser afetadas

### Filtro por Severidade

**Funcionalidade:**
- Filtra inconsistências por nível de severidade
- Opções: Todas, Alta, Média, Baixa

**Comportamento:**
- Aplicado globalmente
- Permite focar em inconsistências críticas

### Filtro por Categoria

**Funcionalidade:**
- Filtra inconsistências por categoria
- Opções: Todas, Worklog, Dados, Validação, Data, Sprint, Estimativa, Qualidade

**Comportamento:**
- Aplicado globalmente
- Permite focar em tipos específicos de problemas

---

## Métricas e Cálculos

### Detecção de Inconsistências

**Processamento:**
- Executado automaticamente ao carregar dados
- Recalculado quando filtro de sprint é alterado
- Cada tipo de inconsistência é detectado independentemente

**Ordem de Detecção:**
1. Validações básicas (campos obrigatórios)
2. Validações de valores (numéricos, datas)
3. Validações de relacionamento (worklogs ↔ tarefas, sprints)
4. Validações de consistência (duplicatas, estimativas)

### Exclusões Padrão

**Tarefas Excluídas de Verificações:**
- Tarefas com "ImpedimentoTrabalho" ou "ImpediimentoTrabalho" em Detalhes Ocultos
- Tarefas com tipo "Testes" (normalizado para "Outro")
- Tarefas marcadas como "Auxilio", "Reunião" ou "Treinamento" (para algumas verificações)

**Motivo:**
- Essas tarefas têm regras especiais
- Não devem ser incluídas em verificações padrão

---

## Integração com Outras Abas

### Sprint Ativo
- Inconsistências podem afetar métricas do Sprint Ativo
- Correção de inconsistências melhora qualidade dos dados

### Performance
- Inconsistências podem afetar métricas de performance
- Tarefas sem worklog ou nota de teste impactam scores

### Worklogs
- Worklogs órfãos aparecem na aba Worklogs
- Correção melhora correspondência entre worklogs e tarefas

---

## Integração com Modo Apresentação

A aba Inconsistências **não possui** seções específicas para o Modo Apresentação configurável.

**Observação:**
- Inconsistências é uma aba de diagnóstico e correção
- Melhor usada para identificação e correção de problemas
- Para apresentações, prefira usar outras abas com métricas agregadas

---

## Casos de Uso

### Validação de Dados
1. Acesse a aba Inconsistências após carregar dados
2. Revise inconsistências de alta severidade primeiro
3. Corrija problemas identificados
4. Recarregue dados para verificar correções

### Limpeza de Dados
1. Use filtro por categoria para focar em tipos específicos
2. Identifique padrões de problemas
3. Corrija problemas sistemáticos
4. Monitore redução de inconsistências

### Diagnóstico de Problemas
1. Use inconsistências para identificar problemas nos dados
2. Analise descrições detalhadas
3. Revise itens afetados
4. Crie plano de correção

### Monitoramento de Qualidade
1. Revise inconsistências periodicamente
2. Monitore evolução de problemas
3. Celebre redução de inconsistências
4. Use para melhorias no processo

---

## Dicas de Uso

1. **Priorização:**
   - Comece com inconsistências de alta severidade
   - Foque em inconsistências que impactam métricas principais
   - Corrija problemas sistemáticos primeiro

2. **Filtros Estratégicos:**
   - Use filtro por sprint para análises focadas
   - Use filtro por categoria para tipos específicos
   - Combine filtros para análises detalhadas

3. **Análise de Padrões:**
   - Identifique padrões de problemas
   - Corrija problemas sistemáticos
   - Documente correções para evitar repetição

4. **Validação Contínua:**
   - Revise inconsistências após cada carga de dados
   - Monitore evolução de problemas
   - Use para melhorias no processo

5. **Correção de Dados:**
   - Corrija problemas na fonte (planilhas Excel)
   - Recarregue dados após correções
   - Valide correções através de inconsistências

---

## Referências

- [Formato dos Dados](FORMATO_DADOS.md) - Estrutura completa dos arquivos e campos obrigatórios
- [Configuração e Análise Híbrida](CONFIGURACAO.md) - Validações e regras de processamento
- [Performance](METRICAS_PERFORMANCE.md) - Impacto de inconsistências nas métricas

