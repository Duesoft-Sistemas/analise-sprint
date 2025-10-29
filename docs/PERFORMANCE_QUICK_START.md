# 🚀 Performance Analytics - Quick Start

Guia rápido para começar a usar a análise de performance do Sprint Analysis Dashboard.

---

## 📊 O Que É?

A **Análise de Performance** é um módulo completo que avalia desenvolvedores em três dimensões principais:

1. **🎯 Acurácia** - Quão bem você estima suas tarefas?
2. **🏆 Qualidade** - Quão bem você entrega (sem retrabalho)?
3. **⚡ Eficiência** - Quão bem você usa seu tempo?

---

## 🎬 Como Acessar?

1. Faça upload do seu arquivo Excel com os dados do sprint
2. Na dashboard, clique no botão **"Performance"** no topo
3. Escolha visualizar por **Sprint** ou **Todos os Sprints**
4. Explore os cards de performance de cada desenvolvedor

---

## 📈 O Que Você Vai Ver?

### Performance Score (0-100)

Um score geral que combina:
- 40% Acurácia nas estimativas
- 30% Qualidade (sem retrabalho)
- 20% Produtividade
- 10% Taxa de conclusão

**Interpretação:**
- 🟢 90-100 = Excelente
- 🔵 75-89 = Muito Bom
- 🟡 60-74 = Bom
- 🟠 45-59 = Adequado
- 🔴 <45 = Precisa Atenção

### Métricas Principais

**Acurácia (%)**
- % de tarefas onde você ficou dentro de ±20% da estimativa
- Mostra se você tende a subestimar ou superestimar

**Qualidade (/100)**
- Score baseado no inverso da taxa de retrabalho
- Quanto maior, melhor a qualidade

**Utilização (%)**
- % da sua capacidade semanal (40h) que está sendo usada
- 80-100% é ideal

**Conclusão (%)**
- % de tarefas que você finalizou das que iniciou
- >80% é bom

### Insights Automáticos 💡

O sistema gera insights automáticos como:
- ✅ "Ótima acurácia nas estimativas"
- ⚠️ "Tendência a subestimar tarefas"
- 🔴 "Alta taxa de retrabalho"
- 💚 "Acurácia em melhoria ao longo dos sprints"

Cada insight vem com **recomendações** práticas!

---

## 🎯 Principais Recursos

### 1. Visualização Por Sprint
Veja seu desempenho em um sprint específico:
- Métricas detalhadas
- Insights específicos do sprint
- Ranking entre desenvolvedores
- Distribuição por complexidade

### 2. Visualização Histórica (Todos os Sprints)
Veja sua evolução ao longo do tempo:
- Tendências de melhoria/piora
- Médias históricas
- Performance por tipo de tarefa
- Gráfico de evolução

### 3. Rankings e Comparações
- Posição em acurácia
- Posição em qualidade
- Posição em produtividade
- Posição geral (performance score)

⚠️ **Importante:** Rankings são para contexto, não para competição prejudicial!

### 4. Análise por Complexidade
Veja como você se sai em tarefas de diferentes níveis:
- Nível 1-2 (Simples)
- Nível 3 (Média)
- Nível 4-5 (Alta complexidade)

### 5. Modal "Como são Calculadas?"
Clique no botão azul para ver:
- Fórmula de cada métrica
- Descrição detalhada
- Como interpretar
- Exemplos práticos

---

## 📚 Dados Necessários

### Obrigatórios (já tem no Excel básico)
- Tempo estimado
- Tempo gasto
- Status
- Responsável

### Opcionais (para análise completa)
- **Tipo de item** - Bug, Tarefa, História
- **Retrabalho** - Sim/Não
- **Complexidade** - 1 a 5

**Sem os campos opcionais:**
- ✅ Acurácia funciona normalmente
- ✅ Eficiência funciona normalmente
- ⚠️ Qualidade será calculada apenas com bugs (sem retrabalho)
- ⚠️ Análise por complexidade não estará disponível

---

## 💡 Dicas Rápidas

### Para Melhorar Acurácia
1. Quebre tarefas grandes em menores
2. Inclua tempo de testes e code review
3. Adicione buffer de 20-30% para imprevistos
4. Use Planning Poker com a equipe
5. Aprenda com tarefas passadas similares

### Para Melhorar Qualidade
1. Escreva testes antes de codificar
2. Faça code review em todas as tarefas
3. Use checklist de "pronto"
4. Esclareça requisitos antes de começar
5. Teste edge cases

### Para Melhorar Eficiência
1. Elimine interrupções
2. Identifique e remova bloqueios rapidamente
3. Foque em uma tarefa por vez
4. Comunique problemas cedo
5. Use timeboxing

---

## 🎓 Aprenda Mais

- **Documentação Completa:** [`docs/PERFORMANCE_METRICS.md`](./PERFORMANCE_METRICS.md)
- **Fórmulas Detalhadas:** Clique em "Como são Calculadas?" na interface
- **Exemplos Práticos:** Veja seção "Exemplos" na documentação completa

---

## ❓ FAQ Rápido

**Q: Meu score é baixo, estou em risco?**
A: Não necessariamente! Veja os insights específicos. Pode ser que esteja pegando tarefas mais complexas ou trabalhando em módulos legados.

**Q: Posso ver métricas de outros desenvolvedores?**
A: Sim, mas use com cuidado. O contexto importa (complexidade, tipo de trabalho, etc).

**Q: Como saber se estou melhorando?**
A: Veja a aba "Todos os Sprints" e observe as tendências (📈 melhorando, ➡️ estável, 📉 piorando).

**Q: E se não tiver os campos opcionais no Excel?**
A: A análise ainda funciona! Mas será menos completa (sem qualidade detalhada e sem análise por complexidade).

---

## 🚀 Comece Agora!

1. ✅ Certifique-se que seu Excel tem os campos necessários
2. ✅ Faça upload do arquivo
3. ✅ Clique em "Performance"
4. ✅ Explore suas métricas
5. ✅ Identifique pontos de melhoria
6. ✅ Estabeleça metas
7. ✅ Acompanhe evolução nos próximos sprints

**Lembre-se:** O objetivo é **melhoria contínua**, não perfeição! 🎯

---

**Dúvidas?** Consulte a [documentação completa](./PERFORMANCE_METRICS.md) ou clique em "Como são Calculadas?" na interface.

