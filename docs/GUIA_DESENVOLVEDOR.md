# 🚀 Guia do Desenvolvedor: Entendendo sua Performance

Olá! Este guia foi criado para te ajudar a entender como sua performance é calculada no sistema. Vamos direto ao ponto! 😊

## 🎯 Resumo Ultra-Rápido (30 segundos)

**Seu score = 50% Qualidade + 50% Eficiência + Bônus (máximo 130 pontos)**

- **Qualidade:** Nota de teste (1-5). Tarefas sem nota são desconsideradas no cálculo.
- **Eficiência:** Features compara estimativa vs tempo gasto. Bugs verifica horas gastas (não usa estimativa).
- **Bônus:** Senioridade (fazer tarefas complexas bem, +15), Competência (tarefas médias bem, +5), Auxílio (+10)

**⚠️ IMPORTANTE - Leia Antes:**
- ✅ Só conta tarefas **concluídas** (`teste`, `teste dev`, `teste gap`, `compilar`, `concluído`, `concluido`)
- ✅ **Obrigatório:** Tarefas devem ter **sprint** definido (tarefas sem sprint = backlog, não contam)
- ✅ **Obrigatório:** Sistema usa **worklog** para calcular tempo, nunca a planilha!
- ✅ **Sem worklog = 0 horas = todas tarefas ineficientes!**
- ✅ Bugs e Features são avaliados de forma diferente
- ❌ **Tarefas sem sprint (backlog) NÃO interferem em métricas de performance, mesmo que tenham worklog**

## 📊 O Que É o Performance Score?

O **Performance Score** é um número de **0 a 130 pontos** que mostra como você está indo no sprint. 

Quanto maior o número, melhor você está se saindo! Mas não se preocupe se não estiver no máximo - o importante é entender e melhorar continuamente.

## 🎯 Como É Calculado?

Sua performance é calculada assim:

```
Performance Score = Base + Bônus
```

### A Base (0-100 pontos)

**50% Qualidade + 50% Eficiência**

#### Qualidade (50%)
Depende da sua **nota de teste** média (1-5):

| Nota | Pontos | Significado |
|------|--------|-------------|
| 5 | 100 pontos ✨ | Perfeito |
| 4 | 80 pontos ✅ | Aceitável |
| 3 | 60 pontos ⚠️ | Problema |
| 2 | 40 pontos ❌ | Crítico |
| 1 | 20 pontos 🔥 | Catastrófico |
| Vazio| N/A | Não entra no cálculo de qualidade |

**💡 Nota:** Tarefas marcadas como "Auxílio", "Reunião" ou "Treinamento" são **neutras** e não entram no cálculo da média de qualidade.

#### Eficiência (50%)
Mede se você **entregou conforme esperado**. O sistema funciona diferente para **Bugs** e **Features**:

**🚀 Features (Tarefas, Histórias):**
- Compara: **estimativa original** vs **tempo gasto total** (de todos os sprints)
- **Qualquer tempo mais rápido** = sempre eficiente! ✅
- **Se gastou mais que estimado**, tolerância por complexidade:
  - Complexidade 1: até +20% (ex: estimou 10h, gastou até 12h = OK)
  - Complexidade 2: até +25% (ex: estimou 10h, gastou até 12.5h = OK)
  - Complexidade 3: até +30% (ex: estimou 10h, gastou até 13h = OK)
  - Complexidade 4: até +35% (ex: estimou 10h, gastou até 13.5h = OK)
  - Complexidade 5: até +40% (ex: estimou 10h, gastou até 14h = OK)

**🐛 Bugs:**
Bugs são imprevisíveis! O sistema usa **apenas as horas gastas** (não usa estimativa):

| Complexidade | Zona Eficiente ✅ | Zona Aceitável ⚠️ | Zona Ineficiente ❌ |
|--------------|-------------------|-------------------|---------------------|
| 1 | até 2h | 2h a 4h | acima de 4h |
| 2 | até 4h | 4h a 8h | acima de 8h |
| 3 | até 8h | 8h a 16h | acima de 16h |
| 4 | até 16h | 16h a 32h | acima de 32h |
| 5 | até 32h | 32h a 40h | acima de 40h |

**💡 Importante sobre Bugs:**
- **Zona Eficiente** = **1.0 ponto** para o cálculo da sua eficiência.
- **Zona Aceitável** = **0.5 pontos** (ainda contribui para a eficiência, mas com metade da pontuação).
- **Zona Ineficiente** = **0 pontos**.
- **Importante:** Para o **bônus** de Senioridade, apenas bugs na **Zona Eficiente** contam. A Zona Aceitável não contribui para os bônus.
- **Por que diferente?** Bugs são imprevisíveis, então o sistema foca em se o tempo gasto foi razoável para a complexidade, sem penalizar por uma estimativa inicial ruim.

### Os Bônus (0-50 pontos)

**Total máximo de bônus:** 15 (Senioridade) + 5 (Competência) + 10 (Auxílio) = 30 pontos

Você ganha pontos extras por:

1. **Bônus de Senioridade: Fazer tarefas complexas bem** (+0 a 15 pontos) 🎯
   - **Este é o indicador principal de senioridade!**
   - Aplica para **Features e Bugs de alta complexidade** (nível 4-5).
   - **Cálculo:** `(% de eficiência em tarefas 4-5 com nota de teste ≥ 4) × 15 pontos`.
   - **Importante:** Apenas tarefas altamente eficientes e com alta qualidade (nota de teste 4 ou 5) contam. Bugs na "zona aceitável" **NÃO** contam para este bônus.

2. **Bônus de Competência: Fazer tarefas médias bem** (+0 a 5 pontos) ✨
   - Incentivo para ser eficiente nas tarefas mais comuns do dia a dia.
   - Aplica para **Features e Bugs de média complexidade** (nível 3).
   - **Cálculo:** `(% de eficiência em tarefas 3 com nota de teste ≥ 4) × 5 pontos`.
   - **Importante:** Apenas tarefas eficientes e com alta qualidade (nota de teste 4 ou 5) são elegíveis para este bônus.

3. **Auxílio à Equipe** (+0 a 10 pontos) 🤝
   - Recompensa ajudar outros desenvolvedores.
   - **Cálculo:** Baseado nas horas gastas em tarefas de "Auxílio" registradas no worklog durante o sprint analisado.
   - **Comportamento Especial:** Cada desenvolvedor possui **uma única tarefa de auxílio** que nunca é concluída. Esta tarefa é alocada em um sprint, trabalhada com worklog, e quando o sprint encerra e outro inicia, a tarefa é movida para o próximo sprint.
   - **Importante:** O bônus considera o worklog registrado no sprint que está sendo analisado, **independentemente do sprint ao qual a tarefa está atualmente alocada**. Isso permite que tarefas de auxílio contínuas que atravessam múltiplos sprints sejam devidamente recompensadas a cada período com base no trabalho realmente realizado naquele sprint.


## 💡 Exemplos Práticos

### Exemplo 1: João - Dev Consistente ✨
```
João fez 5 tarefas neste sprint (1 complexa nível 4-5):
- Todas concluídas com nota 5 (perfeito!)
- Estimou 8h, gastou 8h ✅ (eficiente!)
- Estimou 6h, gastou 5h ✅ (fez mais rápido!)
- Estimou 4h, gastou 4.5h ✅ (dentro do limite!)
- Estimou 10h, gastou 12h ✅ (assumindo complexidade 2, desvio de -20%, dentro do limite de -25%!)
- Estimou 2h, gastou 1h ✅ (fez mais rápido!)

Cálculo:
→ Qualidade: 100 pontos (nota 5 média)
→ Eficiência: 100 pontos (5/5 eficientes)
→ Base: (100 + 100) / 2 = 100 pontos

Performance Score: 100 pontos ⭐⭐⭐⭐⭐
```

### Exemplo 2: Maria - Trabalhando com Bugs 🐛
```
Maria fez 8 bugs neste sprint:
- 4 bugs ficaram na zona eficiente ✅ (4 x 1.0 = 4.0 pts)
- 2 bugs ficaram na zona aceitável ⚠️ (2 x 0.5 = 1.0 pt)
- 2 bugs na zona ineficiente ❌ (0 pts)
- Nota média: 4.5

Cálculo:
→ Qualidade: 90 pontos (nota 4.5 média)
→ Pontos de Eficiência: 4.0 + 1.0 = 5.0
→ Eficiência: (5.0 / 8) * 100 = 62.5 pontos
→ Base: (90 * 0.5) + (62.5 * 0.5) = 45 + 31.25 = 76.25 pontos
→ Bonus Senioridade: +15 pontos (2 bugs complexos eficientes)

Performance Score: 91.25 pontos ⭐⭐⭐⭐
```

### Exemplo 3: Pedro - Features Complexas 🏆
```
Pedro fez 6 features complexas (nível 4-5):
- Todas executadas com alta eficiência ✅
- Nota média: 4.67
- Exemplo: Tarefa complexidade 4, estimou 15h, gastou 16h ✅ (dentro de -35%)

Cálculo:
→ Qualidade: 93.3 pontos (nota 4.67 média)
→ Eficiência: 100 pontos (6/6 eficientes)
→ Base: (93.3 + 100) / 2 = 96.65 pontos
→ Bonus Senioridade: +14 pontos (executou complexas com alta eficiência)

Performance Score: 110.65 pontos 🏆 Excepcional!
```

### Exemplo 4: Ana - Com Auxílio aos Colegas 🤝
```
Ana fez 4 tarefas normais (nota 4, eficiência 75%) + ajudou 10h os colegas!

Cálculo:
→ Qualidade: 80 pontos (nota 4 média)
→ Eficiência: 75 pontos
→ Base: (80 + 75) / 2 = 77.5 pontos
→ Bonus Auxílio: +9 pontos (10h de auxílio → escala 12h = 9 pontos)

Performance Score: 85.5 pontos ⭐⭐⭐⭐

💡 O sistema reconhece quem ajuda! Sempre marque tarefas de auxílio como "Auxilio". Tarefas de auxílio não entram no cálculo de qualidade.
```

### Exemplo 5: Sofia - Sem Worklog ⚠️
```
Sofia fez 3 tarefas, mas esqueceu de registrar o tempo no worklog:
- Todas as tarefas: sem worklog = sistema considera 0h ❌

Cálculo:
→ Qualidade: N/A (nenhuma tarefa com nota)
→ Eficiência: 0 pontos (todas tarefas com 0h vs estimativas = ineficientes)
→ Base: (0) / 1 = 0 pontos (qualidade não entra no cálculo)

Performance Score: 0 pontos ⭐⭐

⚠️ LEMBRE-SE: Sem worklog = 0 horas = todas tarefas ineficientes!
Sempre registre seu tempo no worklog! ⏱️
```

### Exemplo 6: Lucas - Mistura Realista 🌟
```
Lucas fez neste sprint:
- 2 Bugs simples (1.5h e 2h) → ✅ eficientes
- 1 Bug complexidade 3 (7h) → ✅ eficiente (dentro de ≤8h)
- 2 Features complexidade 2 (estimou 6h/4h, gastou 5h/3h) → ✅ eficientes
- 1 História complexidade 4 (estimou 15h, gastou 16h) → ✅ altamente eficiente
- 2h de auxílio 🤝

Cálculo:
→ Qualidade: 92 pontos (nota média 4.6)
→ Eficiência: 100 pontos (6/6 eficientes)
→ Base: (92 + 100) / 2 = 96 pontos
→ Bonus Senioridade: +15 pontos (feature complexa altamente eficiente)
→ Bonus Auxílio: +7 (8h de auxílio)

Performance Score: 118 pontos 🏆 Excepcional!
```


## 🎨 O Que Significa Meu Score?

| Pontos | Classificação | O Que Significa? |
|--------|--------------|------------------|
| 115-130 | 🏆 Excepcional | Você está indo muito bem! Parabéns! (Máximo: 130 pontos) |
| 90-114 | ⭐⭐⭐⭐⭐ Excelente | Ótimo trabalho! Continue assim! |
| 75-89 | ⭐⭐⭐⭐ Muito Bom | Bom desempenho, alguns pontos para melhorar |
| 60-74 | ⭐⭐⭐ Bom | Desempenho adequado, tem espaço para crescer |
| 45-59 | ⭐⭐ Adequado | Está ok, mas dá para melhorar! |
| <45 | ⭐ Precisa Atenção | Vamos conversar e melhorar juntos! 💪 |

## 🔍 Regras Importantes

**✅ O que ENTRA no score:**
- Tarefas **concluídas** (`teste`, `teste dev`, `teste gap`, `compilar`, `concluído`, `concluido`)
- Com **sprint** definido (tarefas sem sprint = backlog, não contam)
- Com **estimativa** e **worklog** registrado
- Tempo sempre do **worklog**, nunca da planilha!

**❌ O que NÃO entra:**
- Tarefas sem sprint (backlog) - mesmo que tenham worklog e estejam concluídas
- Tarefas em progresso ou sem estimativa
- Tarefas marcadas como "Reunião" ou "Treinamento" (neutras)
- Tarefas marcadas como "ImpedimentoTrabalho" com tipo "Testes" (importadas para contabilização de horas, mas excluídas de performance/score)
- Métricas de utilização/conclusão (apenas informativas)

**📝 Sobre Detalhes Ocultos:**
- Você pode marcar tarefas com múltiplos valores: "Auxilio", "Reunião", "Treinamento", "DuvidaOculta", "ImpedimentoTrabalho" ou "ImpediimentoTrabalho" (ambas as variações são aceitas)
- Valores podem ser separados por vírgula na mesma célula: "Auxilio, Reunião"
- **IMPORTANTE:** Tarefas com "ImpedimentoTrabalho" e tipo "Testes" são importadas para contabilização de horas, mas são EXCLUÍDAS de todos os cálculos de performance/score
- Sistema suporta múltiplas colunas de "Detalhes Ocultos" (similar a Features e Categorias)
- Valores são normalizados automaticamente (case-insensitive, sem acentos)
- **Para auxílio:** Coloque "Auxilio" no campo "Detalhes Ocultos" da tarefa
- **Para reuniões:** Coloque "Reunião" no campo "Detalhes Ocultos" da tarefa (não afeta score)
- **Para treinamentos:** Coloque "Treinamento" no campo "Detalhes Ocultos" da tarefa (não afeta score)

**📝 Sobre Nota de Teste:**
- Sem nota = não entra no cálculo de qualidade
- Sempre preencha quando houver problemas

## ❓ Perguntas Frequentes

**Q: Executar mais rápido é ruim?**  
A: Não! Fazer **mais rápido que o estimado é sempre considerado bom** e eficiente! ✅

**Q: Por que bugs são avaliados diferente?**  
A: Bugs são imprevisíveis! O sistema não compara com a estimativa. Ele apenas verifica se você gastou um tempo razoável para a complexidade da tarefa. Um bug na "zona aceitável" ainda soma pontos para sua eficiência (0.5 pts), mas não conta para bônus de senioridade, que exige alta eficiência.

**Q: Bugs complexos contam para senioridade?**  
A: Sim! Bugs complexos (4-5) também contam para o bônus de senioridade. Apenas bugs na zona eficiente contam (zona aceitável não conta mais). 🐛✨

**Q: O que acontece sem worklog?**  
A: ⚠️ **Sem worklog = 0 horas = todas tarefas ineficientes!** O sistema usa worklog, NUNCA a planilha. Sempre registre seu tempo!

**Q: E se a tarefa não tiver nota de teste?**
A: Tarefas sem nota de teste são ignoradas no cálculo de qualidade. Elas não prejudicam nem ajudam sua média. Apenas tarefas com nota (1 a 5) são consideradas.

**Q: Tarefa atravessa sprints?**  
A: Para **Performance (avaliação)**, o sistema usa estimativa original e tempo total de TODOS os sprints. Para **Capacidade (planejamento)**, usa estimativa restante e tempo gasto NESTE sprint.

**Q: Tarefas sem sprint aparecem nas métricas?**  
A: ❌ **NÃO!** Tarefas sem sprint (backlog) NÃO interferem em métricas de performance, mesmo que tenham worklog e estejam concluídas. Elas são usadas APENAS para análise de backlog na aba multi-sprint. Para contabilizar, a tarefa precisa estar alocada em um sprint.

## 🔢 Como É Calculado (Passo a Passo)

1. **Qualidade:** Apenas para tarefas com nota. Média das notas × 20.
2. **Eficiência:** Pontuação Ponderada de Eficiência
   - Features: 1.0 pt se eficiente, 0 se ineficiente
   - Bugs: 1.0 pt (zona eficiente), 0.5 pts (zona aceitável), 0 pts (ineficiente)
3. **Base:** (50% × Qualidade) + (50% × Eficiência)
4. **Bônus de Senioridade:** Eficiência em tarefas de alta complexidade (4-5) com nota de teste ≥ 4 × 15.
5. **Bônus de Competência:** Eficiência em tarefas de média complexidade (3) com nota de teste ≥ 4 × 5.
6. **Bônus de Auxílio:** Escala progressiva (2h=2pts, 4h=4pts, 6h=5pts, 8h=7pts, 12h=9pts, 16h+=10pts).
7. **Score Final:** Base + Todos os Bônus (máximo 130 pontos)

## 🎯 Resumo Final

**Fórmula Completa:**
```
Performance Score = ((Qualidade * 0.5) + (Eficiência * 0.5)) + Bônus
```

Onde **Bônus** é a soma de:
- Bônus de Senioridade
- Bônus de Competência
- Bônus de Auxílio