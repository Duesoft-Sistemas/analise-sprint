# Fluxo de Backlog por Sprint

Definição das métricas de entradas e saídas por sprint para avaliar a saúde do processo e suportar decisões de capacidade.

## Fontes de Dados
- `layout.xlsx` (tarefas) — campo `Criado`, `Sprint`, `Status`, `Responsável`, `Estimativa`.
- `sprints.xlsx` (períodos de sprint) — `Sprint`, `Data Início`, `Data Fim`.
- `worklog.xlsx` (opcional) — não é usado nesta seção para inflow/outflow, apenas para análises de horas em outras abas.

Observações:
- Tarefas sem sprint são tratadas como Backlog e não entram em métricas de performance ou híbridas (ver FORMATO_DADOS.md).
- Tempo gasto nunca é lido da planilha de sprint, apenas do worklog quando aplicável a outras métricas.

## Métricas por Sprint
Considerando o período de sprint `[Data Início, Data Fim]`:

- **Inflow (entradas)**: **TODAS as tarefas criadas** dentro da janela `[Início, Fim]`, independentemente de terem sprint ou não. Representa a chegada total de trabalho no período.
- **Legacy Inflow (entradas anteriores)**: tarefas SEM sprint que **não têm data de criação** OU foram criadas **antes do primeiro sprint conhecido**. Esses tickets aparecem em uma coluna especial "Anterior" **antes do primeiro sprint** no gráfico, representando o backlog existente antes do controle de sprints.
- **Outflow (saídas)**: **TODAS as tarefas concluídas** no período do sprint:
  - Tarefas COM sprint: devem pertencer ao sprint e estar com status concluído.
  - Tarefas SEM sprint: devem estar concluídas e terem sido criadas no período (proxy, já que não temos data de conclusão).
- **Net Flow**: `Outflow − Inflow` (positivo reduz pressão, negativo aumenta). As entradas anteriores são mostradas separadamente e não entram no cálculo de Net Flow por sprint.
- **Exit Ratio**: `Outflow / Inflow` (≥ 1 indica estabilização; se `Inflow = 0` e `Outflow > 0`, considerar `∞`). As entradas anteriores não entram no cálculo de Exit Ratio por sprint.
- Carried‑in (diagnóstico opcional): tarefas do `Sprint` criadas antes de `Início` (itens trazidos do backlog para execução no sprint).
- Backlog no início do sprint: tarefas sem sprint criadas antes de `Data Início` (excluindo as legadas que já foram contabilizadas no primeiro sprint).

## Agregados
- Médias históricas (por sprint): `avg(Inflow)`, `avg(Outflow)`, `avg(Net Flow)`, `avg(Exit Ratio)`.
- Backlog atual: quantidade de tarefas sem sprint e horas estimadas somadas.

## Recomendação de Capacidade
Objetivo: estimar quantos desenvolvedores adicionais seriam necessários para estabilizar o fluxo (saída ≈ entrada).

1. Throughput por dev por sprint: `θ_s = (#tarefas concluídas no sprint s) / (#devs com tarefas concluídas no sprint s)`.
2. Distribuição histórica: `θ` ao longo dos sprints.
3. Percentis: `θ_P50` (mediana) e `θ_P80` (mais conservador).
4. Inflow médio: `λ = avg(Inflow)`.
5. Recomendação: `n' ≥ ceil( λ / θ_Px )` para Px em {50, 80}.
   - Exibir `+X devs (P50)` e `+Y devs (P80)`.

Notas:
- Se não houver `sprints.xlsx`, a recomendação não é calculada.
- A recomendação é baseada em contagem de tickets; caso deseje operar em pontos, replicar a lógica usando pontos.

## Visualizações
- Cards: Inflow (médio), Outflow (médio), Net Flow (médio), Exit Ratio (médio), Backlog atual, Carried‑in (último sprint).
- Gráfico: Entradas vs Saídas por sprint (barras lado a lado) - **análise completa de todas as tarefas**.
  - Antes do primeiro sprint, há uma coluna especial "Anterior" mostrando tickets sem sprint que não têm data de criação ou foram criados antes do primeiro sprint (apenas barra de entradas, sem saídas).
  - Se houver tarefas concluídas sem sprint, aparece uma coluna especial "Concluídas sem Sprint" no final mostrando apenas as saídas (barra verde), sem entradas. Essas tarefas são consideradas na análise de fluxo, mas não aparecem no backlog atual (que mostra apenas pendentes).
- Card de Capacidade: `+X devs (P50)`, `+Y devs (P80)`, com `θ` mostrado.

## Separação de Análises
- **Análise de Fluxo (esta aba)**: Considera tarefas concluídas sem sprint como saídas (mostradas na coluna especial).
- **Análise de Backlog (aba Backlog)**: Não considera tarefas concluídas — mostra apenas pendentes para planejamento de alocação.

## Semáforos (Sugestão)
- Verde: `Exit Ratio ≥ 1.0`, `Net Flow ≥ 0` consistente.
- Amarelo: próximo de 1.0, variação moderada.
- Vermelho: `Exit Ratio < 0.9` por ≥ 3 sprints, `Net Flow` negativo persistente.

## Limitações e Premissas
- Sem `done_at`, a saída é aproximada por “tarefas marcadas como concluídas no sprint”. É uma prática comum em boards ágeis.
- Backlog é baseado em tarefas sem sprint; horas exibidas vêm de `Estimativa` (worklog ignorado para backlog).

## Referências
- [Formato dos Dados](FORMATO_DADOS.md)
- [Métricas de Performance](METRICAS_PERFORMANCE.md)

