# Getting Started with Sprint Analysis Dashboard

## 🎉 Seu projeto está pronto!

O Sprint Analysis Dashboard foi implementado com sucesso e está rodando em:
**http://localhost:5173**

## 📋 Status do Projeto

✅ **Fase 1 - Análise do Sprint Ativo**: Completa
- Métricas de desenvolvedores
- Horas alocadas e disponíveis
- Totalizadores por tipo, feature, módulo e cliente
- Sistema de alertas e riscos
- Lista de tarefas com filtros
- Drill-down por desenvolvedor

✅ **Fase 2 - Análise Multi-Sprint**: Completa
- Métricas de backlog
- Distribuição por sprint
- Alocação cross-sprint por desenvolvedor e cliente

✅ **Fase 3 - Análise Híbrida com Worklog**: Completa
- Upload de worklog detalhado
- Separação automática de tempo entre sprints
- Cálculo de estimativa restante
- Alocação correta de capacidade (40h por dev)

✅ **Fase 4 - Análise de Performance**: Completa
- Métricas de qualidade, utilização e conclusão
- Performance score ponderado
- Rankings e comparações contextualizadas
- Insights automáticos e recomendações
- Análise por complexidade e tendências

✅ **Features Adicionais**: Implementadas
- **Dark Mode** completo com toggle e persistência
- Interface moderna com TailwindCSS
- Indicadores visuais de risco
- Comparação estimado vs gasto
- Filtros avançados
- Excel direct import (sem necessidade de conversão)

## 🚀 Primeiros Passos

### 1. Preparar seus Dados

Agora o sistema importa diretamente arquivos Excel (.xlsx ou .xls)!

1. Exporte seus dados do Jira/Azure DevOps como Excel
2. Ou use o arquivo de exemplo: `project/out25-sem4.xlsx`

### 2. Usar o Dashboard

1. Abra **http://localhost:5173** no navegador
2. Arraste e solte o arquivo Excel (.xlsx ou .xls)
3. Explore as análises!

### 3. Testar com Dados de Exemplo

Use o arquivo de exemplo incluído:
```bash
# Arraste project/out25-sem4.xlsx no dashboard
```

## 📊 O Que Você Pode Fazer

### Visão Geral do Sprint
- Ver total de tarefas e horas
- Acompanhar progresso de conclusão
- Identificar bugs reais vs dúvidas

### Análise de Desenvolvedores
- Ver carga de trabalho de cada dev
- Identificar sobrecarga (>40h semanais)
- Comparar estimado vs gasto
- Clicar em um dev para ver suas tarefas

### Alertas e Riscos
- Tarefas acima do tempo
- Desenvolvedores sobrecarregados
- Tarefas sem progresso

### Totalizadores
- Por Feature: Quais features consomem mais tempo
- Por Módulo: Distribuição por área do sistema
- Por Cliente: Tempo dedicado a cada cliente

### Filtros e Busca
- Buscar por texto livre
- Filtrar por feature, módulo, cliente, status
- Ver apenas tarefas de um desenvolvedor

### Multi-Sprint
- Ver distribuição de trabalho entre sprints
- Planejar capacidade futura
- Identificar acúmulo de backlog

### Análise de Performance
- Ver métricas detalhadas por desenvolvedor
- Analisar qualidade, utilização e conclusão
- Rankings contextualizados
- Insights e recomendações automáticas
- Evolução ao longo dos sprints

### Dark Mode
- Alternar entre modo claro e escuro
- Preferência salva automaticamente
- Interface elegante e moderna

## 🎨 Códigos de Cor

### Desenvolvedores
- 🟢 **Verde** (0-70%): Capacidade disponível
- 🟡 **Amarelo** (70-89%): Bem alocado
- 🔴 **Vermelho** (90%+): Sobrecarregado

### Alertas
- 🔴 **Alto**: Requer ação imediata
- 🟡 **Médio**: Atenção necessária
- 🔵 **Baixo**: Informativo

### Variação de Tempo
- 🟢 **Verde**: Abaixo da estimativa (economia)
- ⚫ **Preto**: Na estimativa
- 🔴 **Vermelho**: Acima da estimativa (estouro)

## 📁 Estrutura do Projeto

```
analise-sprint/
├── src/                    # Código-fonte React/TypeScript
├── docs/                   # Documentação
│   ├── QUICK_START.md     # Guia rápido
│   ├── ADDITIONAL_FEATURES.md  # Features avançadas
│   └── XLS_FORMAT_NOTES.md     # Notas sobre Excel
├── project/
│   └── out25-sem4.xlsx     # Arquivo de exemplo
├── README.md               # Documentação principal
├── PROJECT_SUMMARY.md      # Resumo do projeto
└── GETTING_STARTED.md      # Este arquivo
```

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Iniciar servidor (já está rodando!)
npm run build        # Build para produção
npm run preview      # Preview do build
```

### Importação de Dados
```bash
# Não é mais necessário converter arquivos!
# O sistema aceita diretamente arquivos Excel (.xlsx ou .xls)
# Basta exportar do Jira/Azure DevOps e fazer upload
```

## 📚 Documentação Completa

- **README.md**: Documentação técnica completa
- **docs/QUICK_START.md**: Tutorial passo a passo
- **docs/ADDITIONAL_FEATURES.md**: Features avançadas e roadmap
- **docs/XLS_FORMAT_NOTES.md**: Detalhes sobre formato do Excel
- **docs/PERFORMANCE_METRICS.md**: Guia completo de métricas de performance
- **docs/PERFORMANCE_QUICK_START.md**: Quick start de performance
- **docs/WORKLOG_HYBRID_ANALYSIS.md**: Análise híbrida com worklog
- **docs/DARK_MODE.md**: Documentação do dark mode
- **docs/SYSTEM_REVIEW.md**: Revisão completa do sistema
- **PROJECT_SUMMARY.md**: Visão geral do projeto

## 🎯 Casos de Uso Reais

### Daily Standup (5 minutos)
1. Abra o dashboard
2. Verifique alertas vermelhos
3. Veja progresso de cada dev
4. Identifique bloqueios

### Sprint Planning (30 minutos)
1. Analise sprint anterior
2. Veja variação estimado vs gasto
3. Ajuste estimativas
4. Planeje capacidade

### Sprint Review (15 minutos)
1. Mostre totalizadores
2. Apresente entregas por cliente
3. Destaque métricas de sucesso
4. Identifique melhorias

### Gestão de Riscos (Contínuo)
1. Monitore alertas diariamente
2. Aja em alertas vermelhos
3. Redistribua carga se necessário
4. Ajuste scope se preciso

## 🚢 Deploy (Opcional)

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Arraste pasta dist/ para netlify.com
```

### GitHub Pages
```bash
npm run build
# Suba pasta dist/ para gh-pages branch
```

## 💡 Dicas e Truques

### Filtros Rápidos
- Clique em um dev → ver só tarefas dele
- Clique novamente → deselecionar
- Use busca para encontrar texto específico

### Interpretação de Métricas
- **Horas Disponíveis**: Quanto trabalho ainda falta
- **Utilização %**: Capacidade usada da semana (base 40h)
- **Variação**: Diferença entre gasto e estimado

### Status de Conclusão
Estes status são considerados "concluídos":
- concluído
- compilar
- teste  
- teste gap

### Bugs Reais
Bugs com "Detalhes Ocultos" = "DuvidaOculta" são separados
nas estatísticas para análise mais precisa.

## 🆘 Solução de Problemas

### Excel não carrega
- Verifique se o arquivo é .xlsx ou .xls
- Certifique-se que a primeira aba contém os dados
- Veja `docs/XLS_FORMAT_NOTES.md`

### Dados não aparecem
- Recarregue a página
- Limpe dados e carregue novamente
- Verifique console do navegador (F12)

### Métricas estranhas
- Verifique formato de tempo no Excel
- Confirme que status estão corretos
- Veja se há dados duplicados

## 📞 Próximos Passos

1. **Teste Agora**: Converta e carregue seus dados
2. **Explore**: Navegue pelas diferentes visualizações
3. **Customize**: Ajuste cores/textos se necessário
4. **Deploy**: Publique para sua equipe acessar
5. **Feedback**: Identifique melhorias necessárias

## 🎓 Aprendendo Mais

Se quiser estender o projeto:
- Adicionar gráficos: Use Recharts (já incluído)
- Mudar cores: Edite `tailwind.config.js`
- Novos filtros: Modifique `TaskList.tsx`
- Novas métricas: Edite `analytics.ts`

## 🌟 Features Futuras Sugeridas

Ver `docs/ADDITIONAL_FEATURES.md` para ideias de:
- Gráficos de burndown
- Tracking de velocity
- Comparação histórica
- Export para PDF
- Integração direta com Jira

---

## ✅ Checklist de Início

- [ ] Exportar dados do Jira/Azure DevOps como Excel (.xlsx)
- [ ] Abrir dashboard: http://localhost:5173
- [ ] Carregar arquivo Excel
- [ ] Explorar métricas de desenvolvedores
- [ ] Verificar alertas
- [ ] Testar filtros
- [ ] Ver análise multi-sprint
- [ ] Explorar análise de performance
- [ ] Testar dark mode
- [ ] Fazer upload de worklog (opcional)
- [ ] Compartilhar com a equipe

---

**Pronto para começar!** 🚀

O servidor está rodando em http://localhost:5173
Exporte seus dados como Excel e comece a analisar seus sprints!

