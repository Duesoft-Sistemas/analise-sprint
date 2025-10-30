# Sprint Analysis Dashboard

Uma aplicação web moderna para análise e controle de sprints semanais. Ajuda equipes a monitorar progresso, identificar riscos e melhorar continuamente.

---

## 🎯 O Que Este Sistema Faz?

O Sprint Analysis Dashboard transforma seus dados de sprint em **insights acionáveis** para:
- 📊 **Monitorar** o progresso do sprint em tempo real
- ⚠️ **Identificar** riscos e bloqueios antes que se tornem problemas
- 👥 **Gerenciar** capacidade da equipe (evitar sobrecarga)
- 📈 **Analisar** performance e identificar oportunidades de melhoria
- 🎯 **Tomar decisões** baseadas em dados concretos

---

## ✨ Principais Funcionalidades

### 📊 Análise do Sprint Atual

**O que você vê:**
- **Cards de Desenvolvedores:** Quanto cada pessoa tem alocado, quanto já gastou, quanto ainda tem disponível
- **Indicadores de Risco:** Quem está sobrecarregado (acima de 40h semanais)
- **Totalizadores:** Quantos bugs, tarefas e histórias você tem no sprint
- **Por Dimensão:** Quanto tempo está indo para cada feature, módulo ou cliente

**Para que serve:**
- Balancear carga de trabalho da equipe
- Identificar desenvolvedores sobrecarregados
- Entender onde o tempo está sendo gasto
- Priorizar o que é mais importante

**Como usar:**
1. Faça upload do seu arquivo Excel exportado do Jira/Azure DevOps
2. Selecione o sprint ativo
3. Veja os cards de desenvolvedores e totalizadores
4. Clique em um desenvolvedor para ver suas tarefas em detalhe

---

### ⚠️ Sistema de Alertas

**O que o sistema identifica:**

🔴 **Alertas Críticos (Vermelho):**
- Desenvolvedores com mais de 40h alocadas (sobrecarga)
- Tarefas que já ultrapassaram o tempo estimado

🟡 **Alertas de Atenção (Amarelo):**
- Tarefas próximas do limite (80-100% do tempo estimado)

🔵 **Alertas Informativos (Azul):**
- Tarefas sem progresso registrado

**Para que serve:**
- Agir proativamente antes que problemas se tornem críticos
- Redistribuir trabalho quando necessário
- Identificar tarefas que precisam de ajuda ou clarificação

---

### 🗓️ Análise Multi-Sprint

**O que você vê:**
- **Backlog:** Quantas tarefas estão sem sprint definido
- **Distribuição por Sprint:** Como o trabalho está distribuído entre sprints futuros
- **Alocação por Dev:** Quanto cada desenvolvedor tem em cada sprint
- **Alocação por Cliente:** Como o tempo está distribuído entre clientes

**Para que serve:**
- Planejar sprints futuros
- Identificar acúmulo de backlog
- Garantir distribuição equilibrada de trabalho
- Visualizar compromissos de longo prazo

**Como usar:**
1. Clique em "Ver Multi-Sprint" no dashboard
2. Analise a distribuição de trabalho
3. Use os dados para ajustar planejamento

---

### ⏱️ Análise Híbrida com Worklog

**O que faz:**
Separa automaticamente o tempo gasto em diferentes sprints, resolvendo o problema de tarefas que atravessam múltiplos sprints.

**Problema resolvido:**
```
Antes: Tarefa estimada em 15h aparece totalmente no Sprint 2
       Mas 5h foram gastas no Sprint 1!
       Resultado: capacidade calculada errada ❌

Depois: Sistema separa automaticamente:
        - 5h gastas no Sprint 1 (outros sprints)
        - 10h restantes para o Sprint 2
        Resultado: capacidade calculada correta ✅
```

**Para que serve:**
- Calcular capacidade disponível corretamente (40h por dev)
- Ver quanto realmente falta fazer em cada tarefa
- Analisar performance histórica com precisão

**Como usar:**
1. Exporte o worklog detalhado do Jira (com datas)
2. Faça upload junto com o arquivo de layout
3. Defina o período do sprint (ou deixe usar semana atual)
4. O sistema separa automaticamente o tempo

📖 [Documentação completa da Análise Híbrida](docs/WORKLOG_HYBRID_ANALYSIS.md)

---

### 📈 Análise de Performance

**⚠️ IMPORTANTE:** Use estas métricas para **coaching e melhoria contínua**, nunca como único critério de avaliação.

#### 🎯 Métricas de Qualidade
- **Taxa de Retrabalho:** % de tarefas que precisaram ser refeitas
- **Taxa de Bugs:** % de tarefas que são correções
- **Quality Score:** 100 - taxa de retrabalho

**Use para:**
- Identificar necessidade de mais testes
- Detectar requisitos mal compreendidos
- Melhorar processo de code review

#### ⚡ Métricas de Eficiência
- **Taxa de Utilização:** % da capacidade semanal (40h) sendo usada
- **Taxa de Conclusão:** % de tarefas finalizadas das iniciadas
- **Tempo Médio para Conclusão:** Quanto tempo leva para completar tarefas

**Use para:**
- Identificar bloqueios e interrupções
- Detectar sobrecarga ou subutilização
- Melhorar fluxo de trabalho

#### ℹ️ Métricas de Acurácia (Informativas)
- **Desvio de Estimativa:** Diferença entre estimado e gasto
- **Taxa de Acurácia:** % de tarefas dentro de ±20% da estimativa
- **Tendência:** Se a equipe tende a subestimar ou superestimar

**⚠️ Nota:** Estas métricas refletem o **processo de estimativa da equipe/analista**, não responsabilidade individual do desenvolvedor.

**Use para:**
- Melhorar o processo de estimativa da equipe
- Calibrar Planning Poker
- Identificar tipos de tarefa difíceis de estimar

#### 🏆 Performance Score

**Fórmula:** 50% Qualidade + 30% Utilização + 20% Conclusão

**Interpretação:**
- 90-100: ⭐⭐⭐⭐⭐ Excelente
- 75-89: ⭐⭐⭐⭐ Muito Bom
- 60-74: ⭐⭐⭐ Bom
- 45-59: ⭐⭐ Adequado
- <45: ⭐ Precisa Atenção

**Use para:**
- Conversas 1:1 de desenvolvimento
- Identificar necessidades de treinamento
- Reconhecer e celebrar melhorias
- Detectar necessidade de suporte

**❌ NÃO use para:**
- Avaliação de desempenho isolada
- Comparações diretas sem contexto
- Bônus ou promoções como único critério
- Criar competição prejudicial

📖 [Guia Completo de Métricas](docs/PERFORMANCE_METRICS.md) | [Quick Start Performance](docs/PERFORMANCE_QUICK_START.md)

---

### 🌙 Dark Mode

Interface completa em modo claro e escuro:
- Toggle no header da aplicação
- Preferência salva automaticamente
- Design moderno e elegante
- Conforto visual em qualquer ambiente

---

## 🚀 Como Começar

### 1. Instalação (Uma Vez Apenas)

```bash
# Instale as dependências
npm install

# Inicie o servidor
npm run dev
```

Acesse em: **http://localhost:5173**

### 2. Preparar Seus Dados

**Arquivo de Layout (Obrigatório):**
- Exporte seus dados do Jira/Azure DevOps como Excel (.xlsx)
- Ou use o arquivo de exemplo: `project/out25-sem4.xlsx`

**Arquivo de Worklog (Opcional):**
- Exporte o relatório de worklog detalhado do Jira
- Necessário apenas se quiser análise híbrida precisa por período

### 3. Usar o Dashboard

1. **Arraste e solte** o arquivo Excel na tela inicial
2. **Selecione o sprint** ativo que deseja analisar
3. **Explore** as métricas, alertas e totalizadores
4. **Clique** em um card de desenvolvedor para drill-down
5. **Use os filtros** na lista de tarefas para encontrar o que precisa

---

## 📊 Formato dos Dados

### Colunas do Excel

**Obrigatórias:**
- Tipo de item (Bug, Tarefa, História, Outro)
- Chave da item (ex: PROJ-101)
- ID da item
- Resumo (descrição)
- Tempo gasto (ex: "2h", "2h 30m", ou segundos)
- Sprint (nome do sprint)
- Criado (data)
- Estimativa original (ex: "4h" ou segundos)
- Responsável (nome do desenvolvedor)
- ID do responsável
- Status (ex: "Em progresso", "Concluído")
- Campo personalizado (Modulo)
- Campo personalizado (Feature)
- Categorias (clientes)
- Campo personalizado (Detalhes Ocultos)

**Opcionais (para análise de performance):**
- Campo personalizado (Retrabalho): "Sim" ou "Não"
- Campo personalizado (Complexidade): 1 a 5

**Formatos de Tempo Aceitos:**
- `2h` (horas)
- `2h 30m` (horas e minutos)
- `45m` (apenas minutos)
- `7200` (segundos)
- `2.5h` (horas decimais)

### Status Considerados "Concluídos"

Para cálculo de horas disponíveis:
- `teste` - Dev entregou para testes
- `teste gap` - Dev entregou para testes de gap
- `compilar` - Pronto para compilar/deploy
- `concluído` ou `concluido` - Finalizado

**Rationale:** Uma vez em teste, o dev liberou capacidade. Se houver problemas, a métrica de retrabalho captura o impacto.

📖 [Notas Detalhadas sobre Formato](docs/XLS_FORMAT_NOTES.md)

---

## 💡 Casos de Uso

### Daily Standup (5 minutos)
1. Abra o dashboard do sprint ativo
2. Verifique alertas vermelhos (ação imediata)
3. Veja progresso de cada desenvolvedor
4. Identifique bloqueios e tarefas sem progresso

### Sprint Planning (30 minutos)
1. Analise o sprint anterior (métricas de performance)
2. Veja variação estimado vs gasto (calibrar estimativas)
3. Use multi-sprint para ver carga futura
4. Planeje capacidade considerando alocação atual

### Sprint Review (15 minutos)
1. Mostre totalizadores e progresso
2. Apresente entregas por cliente/feature
3. Destaque métricas de sucesso
4. Celebre conquistas da equipe

### Retrospectiva (45 minutos)
1. Analise tendências de performance
2. Identifique padrões (tipos de tarefa que estouram, bloqueios recorrentes)
3. Discuta melhorias baseadas em dados
4. Estabeleça metas mensuráveis

### Gestão de Riscos (Diário)
1. Monitore alertas diariamente
2. Aja em alertas vermelhos imediatamente
3. Redistribua carga se necessário
4. Ajuste escopo do sprint se preciso

### 1:1 com Desenvolvedor (Quinzenal)
1. Analise performance individual (com empatia!)
2. Celebre pontos fortes e melhorias
3. Identifique necessidades de treinamento
4. Estabeleça plano de desenvolvimento
5. Remova bloqueios e impedimentos

---

## 🎨 Interpretando os Indicadores

### Cores de Risco (Desenvolvedores)

🟢 **Verde (0-70% utilização)**
- Capacidade disponível
- Pode receber mais trabalho
- Bem balanceado

🟡 **Amarelo (70-89% utilização)**
- Bem alocado
- Próximo ao limite ideal
- Monitorar

🔴 **Vermelho (90%+ utilização)**
- Sobrecarregado
- Risco de atraso ou burnout
- **Ação necessária:** Redistribuir trabalho

### Variação de Tempo

🟢 **Verde (negativo):** Abaixo da estimativa (economia de tempo)
⚫ **Zero:** Exatamente na estimativa (perfeito!)
🔴 **Vermelho (positivo):** Acima da estimativa (estouro)

### Badges de Complexidade

🟢 **Verde (1-2):** Tarefas simples
🟡 **Amarelo (3):** Complexidade média
🔴 **Vermelho (4-5):** Alta complexidade

---

## 🔍 Filtros e Buscas

### Filtros Disponíveis
- **Por Desenvolvedor:** Ver apenas tarefas de alguém específico
- **Por Feature:** Filtrar por feature específica
- **Por Módulo:** Filtrar por área do sistema
- **Por Cliente:** Filtrar por categoria/cliente
- **Por Status:** Filtrar por estado atual
- **Busca Livre:** Procurar em resumo, chave ou responsável

### Dicas de Uso
- Combine múltiplos filtros para refinamento preciso
- Use busca livre para encontrar tarefas específicas rapidamente
- Clique em "Limpar" para resetar todos os filtros

---

## 📚 Documentação Completa

### Guias de Uso
- [GETTING_STARTED.md](GETTING_STARTED.md) - Guia de primeiros passos
- [docs/QUICK_START.md](docs/QUICK_START.md) - Tutorial rápido passo a passo

### Funcionalidades Específicas
- [docs/WORKLOG_HYBRID_ANALYSIS.md](docs/WORKLOG_HYBRID_ANALYSIS.md) - Análise híbrida detalhada
- [docs/PERFORMANCE_METRICS.md](docs/PERFORMANCE_METRICS.md) - Guia completo de métricas
- [docs/PERFORMANCE_QUICK_START.md](docs/PERFORMANCE_QUICK_START.md) - Quick start de performance
- [docs/DARK_MODE.md](docs/DARK_MODE.md) - Documentação do dark mode

### Referências
- [docs/XLS_FORMAT_NOTES.md](docs/XLS_FORMAT_NOTES.md) - Formato do Excel em detalhes
- [docs/WORKLOG_TEMPLATE.md](docs/WORKLOG_TEMPLATE.md) - Template e exemplos de worklog
- [docs/SYSTEM_REVIEW.md](docs/SYSTEM_REVIEW.md) - Boas práticas e revisão do sistema
- [docs/DECISIONS.md](docs/DECISIONS.md) - Decisões de design e rationale
- [docs/ADDITIONAL_FEATURES.md](docs/ADDITIONAL_FEATURES.md) - Ideias para o futuro

---

## ❓ Perguntas Frequentes

### Como exportar dados do Jira?
1. Vá para sua board/filtro
2. Clique em "Exportar" → "Excel"
3. Selecione as colunas necessárias
4. Faça o download do arquivo .xlsx

### Como exportar dados do Azure DevOps?
1. Abra sua query
2. Clique em "Export" → "Export to Excel"
3. Salve o arquivo .xlsx

### Preciso converter para CSV?
**Não!** O sistema aceita Excel (.xlsx e .xls) diretamente.

### O que fazer se um desenvolvedor está com 120% de utilização?
1. **Imediato:** Redistribua tarefas para outros devs
2. **Curto prazo:** Reduza escopo do sprint
3. **Médio prazo:** Revise processo de estimativa
4. **Longo prazo:** Considere aumentar a equipe

### Como melhorar acurácia de estimativas?
1. Quebre tarefas grandes em menores
2. Use Planning Poker com toda a equipe
3. Inclua tempo de testes, review e deploy
4. Adicione buffer de 20-30% para imprevistos
5. Aprenda com histórico (compare estimado vs real)
6. Esclareça requisitos antes de estimar

### Taxa de retrabalho alta, o que fazer?
1. Reforce testes unitários e de integração
2. Aumente cobertura de code review
3. Crie checklist de "Definition of Done"
4. Melhore clareza dos requisitos
5. Faça pair programming em tarefas críticas

### Desenvolvedor com baixa taxa de conclusão?
Investigue possíveis causas:
- Bloqueios ou dependências?
- Interrupções frequentes?
- Tarefas muito grandes?
- Prioridades mudando constantemente?
- Necessidade de suporte técnico?

---

## 🎯 Boas Práticas

### ✅ Faça

- **Use diariamente** para monitorar progresso
- **Aja em alertas** vermelhos imediatamente
- **Celebre melhorias** e pontos fortes
- **Combine com conversas** 1:1 regulares
- **Considere contexto** ao analisar métricas
- **Foque em tendências** ao longo do tempo
- **Use para coaching** e desenvolvimento

### ❌ Evite

- Usar como **único critério** de avaliação
- Comparar devs **sem considerar contexto** (complexidade, módulo, experiência)
- Criar **competição prejudicial**
- Cobrar score específico sem entender causas
- Ignorar fatores externos (bloqueios, mudanças, etc)
- Usar métricas para **micromanagement**

---

## 🚀 Deploy para Produção

### Build
```bash
npm run build
```
Arquivos otimizados serão gerados em `dist/`

### Hospedagem
Esta aplicação é 100% frontend. Pode ser hospedada em:
- **Vercel** (recomendado - deploy automático)
- **Netlify** (simples e rápido)
- **GitHub Pages** (gratuito)
- **AWS S3 + CloudFront** (escalável)

---

## 💡 Melhorias Futuras

Ideias para próximas versões:
- Gráficos de burndown em tempo real
- Export de relatórios em PDF
- Comparação de velocidade entre sprints
- Integração direta com Jira/Azure DevOps
- Temas customizáveis adicionais
- Modo automático (baseado no sistema)
- Alertas por email/Slack
- Previsão de conclusão com IA

---

## 📞 Suporte

**Precisa de ajuda?**

1. Consulte a [documentação completa](docs/)
2. Veja [exemplos práticos](docs/PERFORMANCE_METRICS.md#exemplos-práticos)
3. Leia as [perguntas frequentes](#perguntas-frequentes)

---

## 📄 Licença

MIT - Livre para uso e modificação

---

**Construído com foco em ajudar equipes a melhorarem continuamente** 🚀
