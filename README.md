# Sprint Analysis Dashboard

Aplicação web para análise e controle de sprints semanais. Transforma dados de sprint em insights acionáveis para monitorar progresso, identificar riscos e melhorar continuamente.

## 🎯 O Que Este Sistema Faz?

- 📊 **Monitora** o progresso do sprint em tempo real
- ⚠️ **Identifica** riscos e bloqueios antes que se tornem problemas
- 👥 **Gerencia** capacidade da equipe (evitar sobrecarga)
- 📈 **Analisa** performance e identifica oportunidades de melhoria
- 🎯 **Apoia decisões** baseadas em dados concretos

## ✨ Funcionalidades Principais

- **Análise do Sprint Atual:** Cards de desenvolvedores, totalizadores, alertas, lista de tarefas
- **Análise Multi-Sprint:** Distribuição cruzada por sprint, desenvolvedor e cliente
- **Análise de Performance:** Métricas de qualidade, eficiência e acurácia (para coaching)
- **Evolução Temporal:** Acompanhamento de performance ao longo do tempo (mensal, trimestral, semestral, anual)
- **Qualidade dos Chamados:** Dashboard dedicado para análise de qualidade
- **Análise Híbrida:** Separação precisa de tempo gasto entre sprints usando worklog
- **Dark Mode:** Interface completa em modo claro e escuro

📖 **Documentação completa:** Veja os guias detalhados abaixo

## 🚀 Como Começar

### 1. Instalação

```bash
# Instale as dependências
npm install

# Inicie o servidor
npm run dev
```

Acesse em: **http://localhost:5173**

### 2. Preparar Seus Dados

Você precisa de até 3 arquivos Excel:

1. **Layout (Obrigatório):** Planilha com tarefas exportada do Jira/Azure DevOps
2. **Worklog (Opcional):** Registros detalhados de tempo para análise híbrida precisa
3. **Sprints (Opcional):** Planilha com períodos de cada sprint para análise híbrida com múltiplos sprints

📖 **Formato detalhado:** [docs/FORMATO_DADOS.md](docs/FORMATO_DADOS.md)

### 3. Usar o Dashboard

1. **Arraste e solte** os arquivos Excel na tela inicial
2. **Clique em "Ver Análise"** quando todos os arquivos estiverem carregados
3. **Selecione a visualização** desejada:
   - **Sprint Ativo:** Análise do sprint atual
   - **Multi-Sprint:** Análise cruzada de múltiplos sprints
   - **Performance:** Métricas de performance individual
   - **Evolução Temporal:** Análise de evolução ao longo do tempo
   - **Qualidade dos Chamados:** Análise de qualidade dos chamados
4. **Explore** as métricas, alertas e visualizações

## 📚 Documentação Completa

### [Formato dos Dados](docs/FORMATO_DADOS.md)
Formato completo do Excel, worklog e sprints. Todas as colunas obrigatórias e opcionais, formatos aceitos, exemplos e dicas.

### [Métricas de Performance](docs/METRICAS_PERFORMANCE.md)
Guia completo de todas as métricas de performance: como são calculadas, como interpretar, exemplos práticos e boas práticas.

### [Configuração e Análise Híbrida](docs/CONFIGURACAO.md)
Como configurar sprints, como funciona a análise híbrida com worklog, campos utilizados e exemplos práticos.

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

### 1:1 com Desenvolvedor (Quinzenal)
1. Analise performance individual (com empatia!)
2. Celebre pontos fortes e melhorias
3. Identifique necessidades de treinamento
4. Estabeleça plano de desenvolvimento

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

## 📄 Licença

MIT - Livre para uso e modificação

---

**Construído com foco em ajudar equipes a melhorarem continuamente** 🚀
