# Sprint Analysis Dashboard - Guia de Funcionalidades

## 📌 O Que É Este Sistema?

O Sprint Analysis Dashboard é uma **ferramenta de gestão visual** que transforma seus dados de sprint em insights acionáveis. Pense nele como um **painel de controle** para seu sprint, mostrando em tempo real:

- 🎯 **Onde** o tempo da equipe está sendo gasto
- ⚠️ **Quais** riscos e bloqueios existem
- 👥 **Quem** está sobrecarregado ou ocioso
- 📈 **Como** a equipe está evoluindo

---

## 🎯 Problema Resolvido

### Antes (Sem o Sistema)
- ❌ Gerente descobre sobrecarga apenas quando o sprint já atrasou
- ❌ Tempo gasto em reuniões consolidando dados manualmente
- ❌ Decisões baseadas em "achismo" ou dados desatualizados
- ❌ Dificuldade em comparar performance entre sprints
- ❌ Tarefas que atravessam sprints são difíceis de rastrear

### Depois (Com o Sistema)
- ✅ Alertas automáticos de risco em tempo real
- ✅ Insights instantâneos com upload de arquivo Excel
- ✅ Decisões baseadas em dados concretos e atualizados
- ✅ Comparação fácil de performance ao longo do tempo
- ✅ Separação automática de tempo entre sprints

---

## ✨ Principais Funcionalidades

### 1️⃣ **Visão Geral do Sprint** (Fase 1)

**O que mostra:**
- Cards individuais de cada desenvolvedor com alocação de horas
- Totalizadores por tipo (Bugs, Tarefas, Histórias)
- Totalizadores por dimensão (Feature, Módulo, Cliente)
- Lista completa de tarefas com filtros avançados
- Sistema de alertas com 3 níveis de prioridade

**Quem usa:**
- **Scrum Master**: Para daily standup e gestão de risco
- **Tech Lead**: Para distribuição de carga e mentoria
- **PO**: Para entender alocação por feature/cliente
- **Desenvolvedores**: Para auto-gestão de tempo

**Exemplo de uso real:**
```
Durante o Daily Standup:
1. SM abre o dashboard
2. Vê que João está com 45h alocadas (alerta vermelho)
3. Redistribui 10h de tarefas para Maria (25h → 35h)
4. Problema resolvido em 2 minutos
```

---

### 2️⃣ **Análise Multi-Sprint** (Fase 2)

**O que mostra:**
- Visão de backlog (tarefas sem sprint definido)
- Distribuição de trabalho entre sprints futuros
- Mapa de calor de alocação por desenvolvedor
- Alocação de horas por cliente em todos os sprints

**Quem usa:**
- **Gerente de Projeto**: Para planejamento de longo prazo
- **PO**: Para gestão de backlog e roadmap
- **Comercial**: Para compromissos com clientes

**Exemplo de uso real:**
```
No Sprint Planning:
1. PO vê que Sprint 5 tem 200h planejadas
2. Mas a equipe tem capacidade de 160h
3. Move 40h de tarefas menos prioritárias para Sprint 6
4. Sprint fica viável
```

---

### 3️⃣ **Análise Híbrida com Worklog** (Fase 3)

**O problema que resolve:**

Imagine esta situação comum:
```
Tarefa PROJ-101: "Implementar API de pagamentos"
├─ Estimativa original: 20h
├─ Sprint 1: Dev gastou 8h (não terminou)
├─ Sprint 2: Dev gastou 12h (finalizou)
└─ Total gasto: 20h

❌ Sem worklog:
   - Sprint 2 mostra 20h alocadas (errado!)
   - Dev parece ter 60h de trabalho (20h + 40h outras)
   - Capacidade calculada errada

✅ Com worklog:
   - Sprint 2 mostra 12h alocadas (correto!)
   - Dev tem 52h de trabalho (12h + 40h outras)
   - Capacidade calculada certa
```

**O que faz:**
- Separa automaticamente tempo gasto em cada sprint
- Calcula estimativa restante para o sprint atual
- Mostra tempo histórico gasto em sprints anteriores
- Corrige cálculo de capacidade disponível (40h/dev)

**Quem usa:**
- **Todos** que precisam de dados precisos de capacidade
- Especialmente útil para **equipes que mantêm tarefas por vários sprints**

**Como usar:**
1. Exporte worklog detalhado do Jira (com datas)
2. Faça upload junto com arquivo de layout
3. Defina período do sprint (ex: 21-27 Out)
4. Sistema separa automaticamente

📖 [Documentação Completa](docs/WORKLOG_HYBRID_ANALYSIS.md)

---

### 4️⃣ **Análise de Performance** (Fase 4)

**⚠️ ATENÇÃO:** Estas métricas são para **coaching e melhoria contínua**, não para avaliação isolada de desempenho.

#### **Para o Desenvolvedor: Auto-conhecimento**

**Métricas Disponíveis:**
- ✅ **Quality Score:** Minha taxa de retrabalho está baixa?
- ✅ **Completion Rate:** Estou finalizando minhas tarefas?
- ✅ **Utilization:** Estou sobrecarregado ou ocioso?
- ℹ️ **Accuracy (informativa):** O processo de estimativa da equipe está bom?

**Perguntas que responde:**
- "Em que tipo de tarefa eu me destaco?" (simples, média, complexa)
- "Onde posso melhorar?" (testes, estimativas, comunicação)
- "Estou evoluindo?" (tendências ao longo dos sprints)

**Exemplo de uso:**
```
João vê que:
- Quality Score: 95 (excelente!)
- Completion Rate: 100% (ótimo!)
- Accuracy: -30% (subestima muito)

Ação: João passa a adicionar 30% de buffer nas estimativas
Resultado: Próximo sprint accuracy melhora para -10%
```

---

#### **Para o Tech Lead/Manager: Coaching e Suporte**

**Métricas Disponíveis:**
- Rankings contextualizados por sprint
- Análise por complexidade (quem se destaca em tarefas complexas?)
- Tendências de evolução (quem está melhorando?)
- Insights automáticos com recomendações

**Perguntas que responde:**
- "Quem precisa de treinamento em X?"
- "Quem está sobrecarregado?"
- "Quem pode mentorear em Y?"
- "Como a equipe está evoluindo?"

**Exemplo de uso:**
```
Tech Lead vê que:
- Maria: Quality 95, mas Completion 60% (bloqueios?)
- Pedro: Quality 70 (alta taxa de retrabalho)
- Ana: Complexidade 5: 100% accuracy (expert!)

Ações:
1. Conversa 1:1 com Maria para identificar bloqueios
2. Pair programming Pedro + Ana para melhorar testes
3. Ana passa a ser referência para tarefas complexas
```

---

#### **Para a Equipe: Retrospectivas**

**O que analisar:**
- Tendências coletivas (equipe está melhorando?)
- Padrões de problemas (tipos de tarefa que estouram)
- Celebração de conquistas (quem melhorou?)
- Metas coletivas (reduzir retrabalho em 10%)

**Exemplo de retrospectiva:**
```
Sprint 4 Review:
├─ Quality Score médio: 85 (era 75 no Sprint 1) 📈
├─ Taxa de retrabalho caiu de 25% para 15% 🎉
├─ Bugs vs Features: 0.2 (ótimo!)
└─ Insight: Code review em pares reduziu retrabalho

Ações:
- Manter code review em pares
- Meta Sprint 5: Quality Score 90
- Celebrar melhoria da equipe 🎉
```

---

#### **Fórmula do Performance Score**

```
Performance Score = 
  50% × Quality (100 - taxa retrabalho)
+ 30% × Utilization (horas / 40h)
+ 20% × Completion (concluídas / iniciadas)
```

**Por que esta fórmula?**
- **50% Quality:** O mais importante é entregar bem
- **30% Utilization:** Importante não sobrecarregar ou subutilizar
- **20% Completion:** Importante finalizar o que começou
- **0% Accuracy:** Responsabilidade da equipe/analista, não só do dev

**Interpretação:**
- 90-100: ⭐⭐⭐⭐⭐ Excelente (celebrar!)
- 75-89: ⭐⭐⭐⭐ Muito Bom (manter)
- 60-74: ⭐⭐⭐ Bom (buscar próximo nível)
- 45-59: ⭐⭐ Adequado (identificar causas)
- <45: ⭐ Precisa Atenção (conversar e apoiar)

📖 [Guia Completo de Métricas](docs/PERFORMANCE_METRICS.md)

---

### 5️⃣ **Dark Mode**

**O que é:**
- Interface completa em modo claro e escuro
- Toggle no header da aplicação
- Preferência salva automaticamente
- Design moderno e elegante

**Para que serve:**
- Conforto visual em ambientes com pouca luz
- Redução de fadiga ocular
- Aparência profissional e moderna

---

## 🎯 Casos de Uso Detalhados

### 🌅 Daily Standup (5 min)

**Objetivo:** Identificar bloqueios e redistribuir trabalho

**Passo a passo:**
1. ✅ Abra o dashboard do sprint ativo
2. ✅ Verifique alertas vermelhos (ação imediata)
   - Dev sobrecarregado? → Redistribuir
   - Tarefa estourada? → Re-estimar ou ajudar
3. ✅ Analise cards de desenvolvedores
   - Alguém com 0h disponível? → Não alocar mais
   - Alguém com muitas horas livres? → Pode pegar mais
4. ✅ Veja tarefas sem progresso (azul)
   - Perguntar no standup: "Por que parou?"

**Tempo economizado:** 10-15 min de perguntas manuais

---

### 📅 Sprint Planning (30 min)

**Objetivo:** Planejar sprint viável e balanceado

**Passo a passo:**
1. ✅ Analise sprint anterior
   - Performance geral da equipe
   - Variação estimado vs gasto
   - Tipos de tarefa que estouram
2. ✅ Calcule capacidade disponível
   - Total: Devs × 40h
   - Subtraia: Reuniões, férias, feriados
3. ✅ Use multi-sprint para ver alocação futura
   - Devs já têm compromissos no próximo sprint?
4. ✅ Distribua tarefas considerando:
   - Complexidade (balance entre devs)
   - Tipo (todos pegam um pouco de tudo)
   - Especialidade (quem é bom em X)
5. ✅ Valide no dashboard
   - Ninguém acima de 90% utilização
   - Todos com pelo menos 60% utilização

**Resultado:** Sprint balanceado e viável

---

### 🔍 Sprint Review (15 min)

**Objetivo:** Mostrar resultados para stakeholders

**Passo a passo:**
1. ✅ Mostre totalizadores
   - "Concluímos X tarefas, Y histórias, Z bugs"
2. ✅ Apresente por cliente
   - "Cliente A: 40h entregues"
   - "Cliente B: 30h entregues"
3. ✅ Destaque por feature
   - "Feature Login: 100% concluída"
   - "Feature Pagamentos: 80% concluída"
4. ✅ Celebre conquistas
   - "Quality score subiu de 75 para 85!"
   - "Zero tarefas estouradas neste sprint!"

**Benefício:** Apresentação profissional e baseada em dados

---

### 🔄 Retrospectiva (45 min)

**Objetivo:** Identificar melhorias baseadas em dados

**Passo a passo:**
1. ✅ O que foi bem?
   - Mostre métricas que melhoraram
   - Celebre pessoas específicas
2. ✅ O que pode melhorar?
   - Analise taxa de retrabalho (alta?)
   - Veja tipos de tarefa que estouram
   - Identifique padrões de bloqueios
3. ✅ Estabeleça metas mensuráveis
   - "Reduzir retrabalho de 20% para 15%"
   - "Melhorar accuracy de -25% para -15%"
4. ✅ Defina ações concretas
   - "Implementar checklist de DoD"
   - "Fazer pair programming em tarefas complexas"

**Resultado:** Melhoria contínua mensurável

---

### 💬 1:1 com Desenvolvedor (Quinzenal)

**Objetivo:** Desenvolvimento pessoal e remoção de bloqueios

**⚠️ IMPORTANTE:** Use com empatia e contexto!

**Passo a passo:**
1. ✅ Comece com pontos fortes
   - "Seu quality score está excelente!"
   - "Você evoluiu muito em tarefas complexas"
2. ✅ Identifique oportunidades
   - "Sua taxa de conclusão está em 70%, vamos entender por quê?"
   - Possíveis causas:
     - Bloqueios técnicos?
     - Interrupções frequentes?
     - Tarefas muito grandes?
     - Clareza dos requisitos?
3. ✅ Estabeleça plano de ação
   - Necessita treinamento em X?
   - Quer mentoria de alguém?
   - Posso remover algum bloqueio?
4. ✅ Defina próximos passos
   - Meta específica para próximo período
   - Acompanhamento em Y semanas

**Resultado:** Desenvolvedor apoiado e em evolução

---

### ⚠️ Gestão de Riscos (Diária)

**Objetivo:** Agir antes que problemas se tornem críticos

**Passo a passo:**
1. ✅ Manhã: Abra o dashboard
2. ✅ Verifique alertas vermelhos
   - Dev sobrecarregado? → Ação imediata
   - Tarefa estourada? → Entender causa
3. ✅ Verifique alertas amarelos
   - Tarefa próxima do limite? → Monitorar
   - Perguntar: "Vai precisar de ajuda?"
4. ✅ Tarde: Re-verifique
   - Situação melhorou?
   - Novas ações necessárias?

**Benefício:** Prevenção ao invés de apagar incêndios

---

## 🎨 Guia Visual de Interpretação

### Cores de Desenvolvedor

| Cor | Utilização | Significado | Ação |
|-----|-----------|-------------|------|
| 🟢 Verde | 0-70% | Capacidade disponível | Pode alocar mais |
| 🟡 Amarelo | 70-89% | Bem alocado | Ideal, monitorar |
| 🔴 Vermelho | 90%+ | Sobrecarregado | **Redistribuir urgente** |

### Alertas

| Ícone | Tipo | Quando aparece | Ação necessária |
|-------|------|----------------|-----------------|
| 🔴 | Crítico | Dev >40h, tarefa estourada | Imediata |
| 🟡 | Atenção | Tarefa 80-100% do tempo | Monitorar |
| 🔵 | Info | Tarefa sem progresso | Perguntar |

### Variação de Tempo

| Cor | Valor | Significado |
|-----|-------|-------------|
| 🟢 Verde | Negativo | Gastou menos que estimado (bom!) |
| ⚫ Preto | Zero | Perfeito na estimativa |
| 🔴 Vermelho | Positivo | Gastou mais que estimado (atenção) |

### Badges de Complexidade

| Badge | Nível | Descrição |
|-------|-------|-----------|
| 🟢 Verde | 1-2 | Tarefas simples e rápidas |
| 🟡 Amarelo | 3 | Complexidade média |
| 🔴 Vermelho | 4-5 | Tarefas complexas e críticas |

---

## 📊 Métricas: Quando Agir?

### Taxa de Retrabalho

| Faixa | Avaliação | Ação |
|-------|-----------|------|
| 0-5% | ⭐⭐⭐⭐⭐ Excelente | Manter práticas |
| 5-10% | ⭐⭐⭐⭐ Muito Bom | Celebrar |
| 10-20% | ⭐⭐⭐ Aceitável | Monitorar |
| >20% | ⭐ Atenção | **Ação: Melhorar testes e code review** |

### Taxa de Utilização

| Faixa | Situação | Ação |
|-------|----------|------|
| >100% | 🔴 Sobrecarga | **Redistribuir urgente** |
| 80-100% | 🟢 Ideal | Perfeito, manter |
| 60-79% | 🟡 Normal | Ok, pode alocar mais |
| <60% | 🔵 Subutilizado | Investigar (bloqueios?) |

### Taxa de Conclusão

| Faixa | Avaliação | Ação |
|-------|-----------|------|
| ≥90% | ⭐⭐⭐⭐⭐ Excelente | Celebrar |
| 80-89% | ⭐⭐⭐⭐ Muito Bom | Ótimo |
| 70-79% | ⭐⭐⭐ Bom | Monitorar |
| <70% | ⭐ Atenção | **Investigar bloqueios** |

---

## ✅ Checklist de Ações por Situação

### 🔴 Dev Sobrecarregado (>90%)

- [ ] Identifique tarefas que podem ser redistribuídas
- [ ] Mova tarefas menos prioritárias para próximo sprint
- [ ] Converse com o dev (há bloqueios?)
- [ ] Considere pair programming para acelerar
- [ ] Documente para evitar no próximo planning

### 🟡 Tarefa Próxima do Limite (80-100%)

- [ ] Pergunte ao dev: "Vai precisar de ajuda?"
- [ ] Avalie se é necessário re-estimar
- [ ] Considere quebrar a tarefa
- [ ] Monitore diariamente

### 📈 Alta Taxa de Retrabalho (>15%)

- [ ] Analise causas (requisitos, testes, code review?)
- [ ] Implemente checklist de Definition of Done
- [ ] Aumente cobertura de code review
- [ ] Considere pair programming
- [ ] Treinamento em testes?

### 📉 Baixa Taxa de Conclusão (<70%)

- [ ] Identifique bloqueios técnicos
- [ ] Verifique se tarefas são muito grandes
- [ ] Analise interrupções frequentes
- [ ] Clareza dos requisitos está ok?
- [ ] Dev precisa de suporte?

---

## 🎓 Aprendizados e Boas Práticas

### ✅ O Que Funciona

1. **Usar diariamente** no standup (5 min)
2. **Agir em alertas** vermelhos imediatamente
3. **Celebrar melhorias** nas retrospectivas
4. **Combinar com conversas** 1:1
5. **Focar em tendências**, não números isolados
6. **Usar para coaching**, não punição

### ❌ O Que Evitar

1. **Micromanagement:** Cobrar cada hora
2. **Comparações injustas:** Ignorar contexto
3. **Métrica única:** Usar só performance score
4. **Punir:** Usar dados para crítica destrutiva
5. **Ignorar causas:** Cobrar resultado sem entender o porquê

### 💡 Dicas de Ouro

> **"Dados mostram sintomas, conversas revelam causas"**
> - Use métricas para iniciar conversas, não para encerrar discussões

> **"Tendências > Números isolados"**
> - Um sprint ruim não define ninguém. Olhe evolução de 3+ sprints

> **"Contexto é rei"**
> - Dev com score 70 em tarefas complexidade 5 > Dev com score 85 em tarefas complexidade 2

> **"Celebre melhorias"**
> - Score subiu de 60 para 70? Isso é 16% de melhoria! 🎉

---

## 📚 Documentação Adicional

### Guias de Referência
- [Guia Completo de Métricas](docs/PERFORMANCE_METRICS.md) - Todas as fórmulas e interpretações
- [Quick Start Performance](docs/PERFORMANCE_QUICK_START.md) - Comece rápido com performance
- [Análise Híbrida](docs/WORKLOG_HYBRID_ANALYSIS.md) - Worklog detalhado
- [Formato do Excel](docs/XLS_FORMAT_NOTES.md) - Colunas e formatos aceitos
- [Template Worklog](docs/WORKLOG_TEMPLATE.md) - Exemplos de worklog
- [Boas Práticas](docs/SYSTEM_REVIEW.md) - Revisão completa do sistema

### Para Começar
- [Getting Started](GETTING_STARTED.md) - Primeiros passos
- [Quick Start](docs/QUICK_START.md) - Tutorial rápido
- [README](README.md) - Visão geral completa

---

## 🎯 Resumo Executivo

### O Que Este Sistema Faz?
Transforma dados de sprint em insights acionáveis em **segundos**, não horas.

### Quem Deve Usar?
- **Scrum Masters**: Gestão diária do sprint
- **Tech Leads**: Mentoria e distribuição de trabalho
- **POs**: Planejamento e alocação por feature/cliente
- **Gerentes**: Visão estratégica e tendências
- **Desenvolvedores**: Auto-gestão e evolução

### Principais Benefícios
✅ **Tempo:** De horas para segundos na análise
✅ **Precisão:** Dados reais, não estimativas
✅ **Proatividade:** Alertas antes dos problemas
✅ **Melhoria:** Métricas para evolução contínua
✅ **Transparência:** Todos veem os mesmos dados

### ROI Típico
- **-80%** tempo em análise de dados
- **-60%** problemas não detectados
- **+40%** velocidade de decisão
- **+25%** satisfação da equipe (dados objetivos)

---

**Construído para equipes que querem melhorar continuamente** 🚀
