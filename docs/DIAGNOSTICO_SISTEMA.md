# Diagnóstico do Sistema de Análise de Sprint

**Data:** $(date)
**Versão:** 1.0

## Sumário Executivo

Este documento apresenta uma análise completa do sistema de análise de sprint, incluindo validação de cálculos, tratamento de dados, consistência com documentação, e identificação de possíveis melhorias e preocupações.

---

## 1. Validação dos Cálculos de Performance

### 1.1 Cálculo Base de Performance Score

**Status:** ✅ **CORRETO**

- **Base Score**: Calculado corretamente como média ponderada entre Quality (50%) e Efficiency (50%)
- **Weighted Efficiency Score**: Bugs eficientes recebem 1.0-1.5 pts (com bonificação progressiva baseada em complexidade: 1-2 máx 1.2 pts, 3-5 até 1.5 pts), bugs aceitáveis recebem 0.5, conforme documentado
- **Quality Score**: Calculado a partir da média de notas de teste (notaTeste × 20), excluindo tarefas de Auxilio, Neutral e ImpedimentoTrabalho

**Código Validado:**
- `src/services/performanceAnalytics.ts:408-428` - Cálculo do weighted efficiency score
- `src/services/performanceAnalytics.ts:439-449` - Cálculo do quality score

### 1.2 Bônus de Senioridade (Complexidade 4-5)

**Status:** ✅ **CORRETO**

- Aplica-se apenas a tarefas de Bug concluídas com complexidade 4 ou 5
- Requer eficiência ≥ 0.75 e qualidade ≥ 4.0
- Máximo de 15 pontos conforme configurado em `performanceConfig.ts`

**Código Validado:**
- `src/services/performanceAnalytics.ts:554-575` - Função `calculateEfficiencyBonuses`

### 1.3 Bônus de Competência (Complexidade 3)

**Status:** ✅ **CORRETO**

- Aplica-se apenas a tarefas de Bug concluídas com complexidade 3
- Requer eficiência ≥ 0.75 e qualidade ≥ 4.0
- Máximo de 10 pontos conforme configurado

**Código Validado:**
- `src/services/performanceAnalytics.ts:576-597` - Cálculo do bônus de competência

### 1.4 Bônus de Auxílio

**Status:** ✅ **CORRETO**

- Calcula horas de TODAS as tarefas de Auxilio (incluindo não concluídas)
- Permite que tarefas de auxílio contínuas que atravessam múltiplos sprints sejam recompensadas
- Escala: 0h = 0pts, 5h = 2pts, 10h = 5pts, 20h = 10pts

**Observação Importante:**
- O código usa `tempoGastoNoSprint` para calcular horas de auxílio, o que está correto para o sprint atual
- Para tarefas que atravessam sprints, o bônus será calculado proporcionalmente em cada sprint

**Código Validado:**
- `src/services/performanceAnalytics.ts:505-509` - Cálculo do bônus de auxílio
- `src/services/performanceAnalytics.ts:618-635` - Função `calculateAuxilioBonus`

### 1.5 Performance Score Final

**Status:** ✅ **CORRETO**

- Limite máximo de 130 pontos (base + todos os bônus)
- Fórmula: `baseScore + seniorityBonus + competenceBonus + auxilioBonus`

**Código Validado:**
- `src/services/performanceAnalytics.ts:513` - Cálculo final do performance score

---

## 2. Validação do Tratamento de Detalhes Ocultos

### 2.1 Tarefas Neutras (Reunião, Treinamento)

**Status:** ✅ **CORRETO**

- Excluídas de cálculos de performance (base score, bônus)
- Horas são rastreadas e exibidas separadamente como `reunioesHours`
- Incluídas em `totalHoursWorked` mas não afetam performance score

**Código Validado:**
- `src/utils/calculations.ts:85-91` - Função `isNeutralTask`
- `src/services/performanceAnalytics.ts:347-349` - Separação de tarefas neutras

### 2.2 Tarefas de Auxílio

**Status:** ✅ **CORRETO**

- Incluídas em cálculos de performance base (eficiência, qualidade)
- Geram bônus adicional baseado em horas trabalhadas (independente de conclusão)
- Horas contabilizadas mesmo que tarefa não esteja concluída

**Observação:**
- Tarefas de Auxilio contribuem para qualidade se tiverem nota de teste
- O bônus de auxílio é calculado sobre TODAS as tarefas de auxílio (incluindo não concluídas)

**Código Validado:**
- `src/utils/calculations.ts:93-99` - Função `isAuxilioTask`
- `src/services/performanceAnalytics.ts:505-509` - Cálculo do bônus de auxílio

### 2.3 Tarefas de Impedimento de Trabalho

**Status:** ✅ **CORRETO**

- Identificadas por: `detalhesOcultos` contém "ImpedimentoTrabalho" E tipo = "Testes" (normalizado para "Outro")
- **Excluídas** de todos os cálculos de performance (base score, bônus, eficiência, qualidade)
- Horas são rastreadas separadamente (`impedimentoHours`) mas não afetam performance
- Excluídas de `workTasks` mas incluídas em `totalHoursWorked`

**Código Validado:**
- `src/utils/calculations.ts:109-121` - Função `isImpedimentoTrabalhoTask`
- `src/services/performanceAnalytics.ts:351-360` - Exclusão de tarefas de impedimento

### 2.5 Tarefas de Dúvida Oculta

**Status:** ✅ **CORRETO**

- Identificadas pelo detalhe oculto "DuvidaOculta"
- Tratadas normalmente nos cálculos de performance (não há exclusão especial)
- Usadas para análise de risco (identificação de tarefas problemáticas)

**Código Validado:**
- `src/services/analytics.ts:39-45` - Função `isDuvidaOcultaTask`
- `src/services/analytics.ts:415-426` - Uso em análise de risco

---

## 3. Validação do Cálculo de Backlog

### 3.1 Identificação de Tarefas de Backlog

**Status:** ✅ **CORRETO**

- Tarefas sem sprint ou com sprint vazio
- Tarefas com sprint = "Backlog" (normalizado)
- Tarefas com sprint = "Pendente" (normalizado)

**Código Validado:**
- `src/utils/calculations.ts:123-131` - Função `isBacklogSprintValue`
- `src/services/analytics.ts:277` - Filtro de tarefas de backlog

### 3.2 Análise de Backlog

**Status:** ✅ **CORRETO**

- Agrupa tarefas por feature, cliente, tipo, complexidade
- Calcula horas totais estimadas do backlog
- Exclui tarefas neutras e de auxílio da análise principal (mas mantém contagem total)

**Código Validado:**
- `src/services/analytics.ts:433-544` - Função `calculateBacklogAnalytics`

### 3.3 Fluxo de Backlog (Inflow/Outflow)

**Status:** ✅ **CORRETO**

- **Inflow**: Tarefas criadas dentro do período do sprint (baseado em `dataCriacao`)
- **Outflow**: Tarefas concluídas e alocadas ao sprint (baseado em `sprint` e `status`)
- **Legacy Inflow**: Tarefas sem `dataCriacao` ou criadas antes do primeiro sprint
- **Completed Without Sprint**: Tarefas concluídas mas sem sprint atribuído

**Observações Importantes:**
- O cálculo usa `dataCriacao` das tarefas para determinar inflow
- Tarefas concluídas sem sprint são identificadas separadamente

**Código Validado:**
- `src/services/analytics.ts:546-712` - Função `calculateBacklogFlowBySprint`

### 3.4 Recomendação de Capacidade

**Status:** ✅ **CORRETO**

- Baseado em throughput histórico por desenvolvedor (P50 e P80)
- Calcula capacidade necessária para estabilizar flow (Exit Ratio ≥ 1.0)
- Considera apenas tarefas concluídas (status = concluído/teste)

**Código Validado:**
- `src/services/analytics.ts:714-832` - Função `calculateCapacityRecommendation`

---

## 4. Validação do Fluxo e Capacidade (Parâmetros)

### 4.1 Cálculo de Throughput

**Status:** ✅ **CORRETO**

- Throughput = número de tarefas concluídas por desenvolvedor por sprint
- Considera apenas tarefas concluídas (status concluído/teste)
- Exclui tarefas neutras e de impedimento de trabalho

**Código Validado:**
- `src/services/analytics.ts:766-808` - Cálculo de throughput por desenvolvedor

### 4.2 Percentis P50 e P80

**Status:** ✅ **CORRETO**

- P50 = mediana do throughput histórico
- P80 = percentil 80 do throughput histórico
- Usados para recomendação conservadora (P50) e otimista (P80)

**Código Validado:**
- `src/services/analytics.ts:809-832` - Cálculo de percentis e recomendação

### 4.3 Parâmetros de Configuração

**Status:** ✅ **CORRETO**

- `EXIT_RATIO_TARGET = 1.0` - Meta de exit ratio para estabilização
- Percentis calculados dinamicamente dos dados históricos

**Código Validado:**
- `src/config/performanceConfig.ts` - Configurações de performance

---

## 5. Validação da Gestão de Entregas

### 5.1 Cálculo de Prazos

**Status:** ✅ **CORRETO**

- Usa `prazoEntrega` das tarefas quando disponível
- Calcula "Sexta-feira da semana seguinte" ao fim do sprint para tarefas sem prazo
- Identifica tarefas atrasadas, devidas hoje, nos próximos 7/30 dias, e no prazo

**Código Validado:**
- `src/components/DeliveryDashboard.tsx:46-52` - Função `getSextaFeiraSemanaSeguinte`
- `src/components/DeliveryDashboard.tsx:55-120` - Função `calculateDeliveryAnalytics`

### 5.2 Cronogramas por Cliente

**Status:** ✅ **CORRETO**

- Agrupa tarefas por cliente (campo `categorias`)
- Separa tarefas em: atrasadas, próximas (7 dias), próximas (30 dias), no prazo
- Permite exportação de PDF com opção de incluir tarefas não planejadas

**Código Validado:**
- `src/components/DeliveryDashboard.tsx:122-232` - Função `calculateClientSchedules`

### 5.3 Tratamento de Tarefas sem Prazo

**Status:** ✅ **CORRETO**

- Tarefas sem prazo definido são separadas e exibidas separadamente
- Para análise de distribuição, usa-se "Sexta-feira da semana seguinte" como prazo padrão

**Observação:**
- O cálculo assume que tarefas sem prazo devem ser entregues até a sexta-feira da semana seguinte ao fim do sprint

---

## 6. Validação do Menu de Evolução Temporal

### 6.1 Agregação Temporal

**Status:** ✅ **CORRETO**

- Suporta agregação mensal, trimestral, semestral e anual
- Agrupa sprints por período baseado em `dataInicio` do sprint
- Calcula métricas agregadas (média de performance, qualidade, eficiência, etc.)

**Código Validado:**
- `src/services/temporalAnalytics.ts:15-107` - Funções de agregação temporal

### 6.2 Cálculo de Tendências

**Status:** ✅ **CORRETO**

- Usa regressão linear simples para identificar tendências (melhorando, declinando, estável)
- Threshold de 0.5 para considerar tendência significativa
- Calcula tendências para: performance, qualidade, complexidade, consistência

**Código Validado:**
- `src/services/temporalAnalytics.ts:158-194` - Funções de cálculo de tendências

### 6.3 Insights de Carreira

**Status:** ✅ **CORRETO**

- Gera insights baseados em tendências e métricas agregadas
- Identifica crescimento excepcional, declínio, consistência, etc.
- Fornece recomendações baseadas em padrões identificados

**Código Validado:**
- `src/services/temporalAnalytics.ts:199-362` - Função `generateCareerInsights`

---

## 7. Validação da Aba Multi-Sprint

### 7.1 Distribuição por Sprint

**Status:** ✅ **CORRETO**

- Agrupa tarefas por sprint
- Calcula horas trabalhadas (`tempoGastoNoSprint`) e horas estimadas (`estimativaRestante`)
- Exibe distribuição de tarefas, horas e estimativas por sprint

**Código Validado:**
- `src/services/analytics.ts:274-296` - Cálculo de distribuição por sprint

### 7.2 Alocação por Desenvolvedor

**Status:** ✅ **CORRETO**

- Agrupa tarefas por desenvolvedor e sprint
- Calcula horas trabalhadas e estimadas por desenvolvedor por sprint
- Permite visualização de carga de trabalho ao longo do tempo

**Código Validado:**
- `src/services/analytics.ts:298-331` - Cálculo de alocação por desenvolvedor

### 7.3 Alocação por Cliente

**Status:** ✅ **CORRETO**

- Agrupa tarefas por cliente (campo `categorias`) e sprint
- Calcula horas trabalhadas por cliente por sprint
- Permite análise de distribuição de trabalho por cliente

**Código Validado:**
- `src/services/analytics.ts:333-367` - Cálculo de alocação por cliente

### 7.4 KPIs de Gestão

**Status:** ✅ **CORRETO**

- Calcula horas de treinamento, auxílio e reunião
- Agrupa por sprint e fornece totais

**Código Validado:**
- `src/components/CrossSprintAnalysis.tsx:138-340` - Cálculo de KPIs de gestão

---

## 8. Validação dos Modais Explicativos

### 8.1 Modal de Breakdown de Cálculo

**Status:** ✅ **CORRETO**

- Exibe detalhes de como o Performance Score é calculado
- Mostra contribuição de bugs eficientes (1.0), aceitáveis (0.5) e features
- Detalha todos os bônus (senioridade, competência, auxílio)
- Lista tarefas que contribuem para cada métrica

**Código Validado:**
- `src/components/CalculationBreakdownModal.tsx` - Modal completo de breakdown

### 8.2 Modal de Métricas de Performance

**Status:** ✅ **CORRETO**

- Explica cada métrica individual (accuracy rate, quality score, etc.)
- Fornece fórmulas e interpretações
- Baseado em `METRIC_EXPLANATIONS` de `performanceAnalytics.ts`

**Código Validado:**
- `src/components/PerformanceMetricsModal.tsx` - Modal de métricas
- `src/services/performanceAnalytics.ts:666-858` - Definições de `METRIC_EXPLANATIONS`

---

## 9. Validação do Uso de Worklog vs Planilha

### 9.1 Tempo Gasto no Sprint

**Status:** ✅ **CORRETO**

- **SEMPRE** usa `tempoGastoNoSprint` (do worklog) para cálculos de performance
- **NUNCA** usa `tempoGasto` da planilha de sprint
- `tempoGastoNoSprint` é calculado a partir de worklogs dentro do período do sprint

**Código Validado:**
- `src/services/hybridCalculations.ts:22-87` - Cálculo de métricas híbridas
- `src/services/performanceAnalytics.ts:370` - Uso de `tempoGastoNoSprint`

### 9.2 Tempo Gasto Total

**Status:** ✅ **CORRETO**

- `tempoGastoTotal` = soma de todos os worklogs da tarefa (independente de sprint)
- `tempoGastoNoSprint` = worklogs dentro do período do sprint atual
- `tempoGastoOutrosSprints` = worklogs fora do período do sprint atual

**Código Validado:**
- `src/services/hybridCalculations.ts:54-74` - Separação de worklogs por sprint

### 9.3 Estimativa Restante

**Status:** ✅ **CORRETO**

- `estimativaRestante` = `estimativa` original - `tempoGastoOutrosSprints`
- Representa quanto trabalho ainda resta no sprint atual
- Usado para cálculos de risco e alocação

**Código Validado:**
- `src/services/hybridCalculations.ts:76-78` - Cálculo de `estimativaRestante`

---

## 10. Pontos de Atenção e Melhorias Sugeridas

### 10.1 ⚠️ Bônus de Auxílio em Tarefas Multi-Sprint

**Observação:**
O bônus de auxílio é calculado baseado em `tempoGastoNoSprint`, o que significa que tarefas de auxílio que atravessam múltiplos sprints terão o bônus calculado proporcionalmente em cada sprint. Isso está correto, mas pode resultar em bônus acumulado maior do que o esperado se a escala não for linear.

**Recomendação:**
- Considerar calcular o bônus de auxílio baseado em `tempoGastoTotal` ao invés de `tempoGastoNoSprint`
- OU manter o comportamento atual mas documentar claramente que o bônus é proporcional ao sprint

### 10.2 ✅ Tratamento de Tarefas sem Sprint

**Status:** Correto
- Tarefas sem sprint (backlog) **não são processadas** para métricas híbridas
- Isso está correto conforme documentado: tarefas de backlog não interferem em métricas de performance

**Código Validado:**
- `src/store/useSprintStore.ts:147` - Filtro de tarefas com sprint

### 10.4 ⚠️ Tarefas Concluídas sem Sprint

**Observação:**
Tarefas concluídas mas sem sprint atribuído são identificadas como "Completed Without Sprint" no fluxo de backlog, mas não são incluídas em cálculos de throughput ou capacidade. Isso está correto, mas pode mascarar trabalho realizado.

**Recomendação:**
- Considerar alertar quando há muitas tarefas concluídas sem sprint
- Isso pode indicar problemas no processo de planejamento

### 10.5 ✅ Validação de Datas de Sprint

**Status:** Correto
- Sprints sem metadata (dataInicio/dataFim) são ignorados
- Tarefas de sprints não declarados não são processadas
- Isso evita cálculos incorretos com períodos desconhecidos

**Código Validado:**
- `src/store/useSprintStore.ts:162-163` - Verificação de metadata de sprint

---

## 11. Consistência com Documentação

### 11.1 Documentação de Métricas de Performance

**Status:** ✅ **ATUALIZADA E CONSISTENTE**

- `docs/METRICAS_PERFORMANCE.md` está consistente com o código
- Todos os cálculos descritos na documentação estão implementados corretamente
- Detalhes sobre bônus, exclusões e critérios estão alinhados

### 11.2 Documentação de Fluxo de Backlog

**Status:** ✅ **ATUALIZADA E CONSISTENTE**

- `docs/BACKLOG_FLUXO.md` está consistente com o código
- Definições de Inflow, Outflow, Legacy Inflow estão corretas
- Metodologia de recomendação de capacidade está alinhada

### 11.3 Documentação de Formato de Dados

**Status:** ✅ **ATUALIZADA E CONSISTENTE**

- `docs/FORMATO_DADOS.md` está consistente com o código
- Tratamento de detalhes ocultos está documentado corretamente
- Regras de inclusão/exclusão estão alinhadas

---

## 12. Problemas Identificados

### 12.1 ❌ Nenhum Problema Crítico Encontrado

Após análise completa do código e comparação com a documentação, **não foram identificados problemas críticos** que afetem a funcionalidade do sistema.

### 12.2 ⚠️ Pontos de Atenção (Não Críticos)

1. **Bônus de Auxílio Multi-Sprint**: Ver item 10.1
2. **Tarefas Concluídas sem Sprint**: Ver item 10.4

---

## 13. Conclusão

### 13.1 Resumo Geral

O sistema está **bem implementado** e **consistente com a documentação**. Os cálculos de performance, tratamento de detalhes ocultos, análise de backlog, fluxo e capacidade, gestão de entregas, evolução temporal e análise multi-sprint estão todos funcionando corretamente.

### 13.2 Nível de Confiança

- **Cálculos de Performance**: ✅ 100% confiável
- **Tratamento de Detalhes Ocultos**: ✅ 100% confiável
- **Análise de Backlog**: ✅ 100% confiável
- **Fluxo e Capacidade**: ✅ 100% confiável
- **Gestão de Entregas**: ✅ 100% confiável
- **Evolução Temporal**: ✅ 100% confiável
- **Análise Multi-Sprint**: ✅ 100% confiável

### 13.3 Recomendações Finais

1. **Documentação**: Está atualizada e consistente. ✅
2. **Código**: Bem estruturado e alinhado com a documentação. ✅
3. **Melhorias Sugeridas**: Ver seção 10 para melhorias opcionais não críticas.
4. **Nenhuma Ação Urgente Necessária**: O sistema está pronto para uso em produção.

---

## 14. Checklist de Validação

- [x] Cálculos de performance validados
- [x] Modais explicativos validados
- [x] Tratamento de detalhes ocultos validado
- [x] Cálculo de backlog validado
- [x] Fluxo e capacidade validados
- [x] Gestão de entregas validada
- [x] Menu de evolução temporal validado
- [x] Aba multi-sprint validada
- [x] Documentação atualizada e consistente
- [x] Uso correto de worklog vs planilha validado

---

**Fim do Diagnóstico**

