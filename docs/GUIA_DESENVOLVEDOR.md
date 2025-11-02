# 🚀 Guia do Desenvolvedor: Entendendo sua Performance

Olá! Este guia foi criado para te ajudar a entender como sua performance é calculada no sistema. Vamos direto ao ponto! 😊

## 🎯 Resumo Ultra-Rápido (30 segundos)

**Seu score = 50% Qualidade + 50% Eficiência + Bônus (máximo 150 pontos)**

- **Qualidade:** Nota de teste (1-5). Sem nota = 5 (perfeito!)
- **Eficiência:** Features compara estimativa vs tempo gasto. Bugs verifica horas gastas (não usa estimativa).
- **Bônus:** Complexidade 4-5 (+10), Complexidade 3 (+5), Senioridade (fazer tarefas complexas bem, +15), Auxílio (+10), Horas Extras (+10)

**⚠️ IMPORTANTE - Leia Antes:**
- ✅ Só conta tarefas **concluídas** (`teste`, `teste gap`, `compilar`, `concluído`, `concluido`)
- ✅ **Obrigatório:** Tarefas devem ter **sprint** definido (tarefas sem sprint = backlog, não contam)
- ✅ **Obrigatório:** Sistema usa **worklog** para calcular tempo, nunca a planilha!
- ✅ **Sem worklog = 0 horas = todas tarefas ineficientes!**
- ✅ Fazer até 50% mais rápido = sempre eficiente!
- ✅ Bugs e Features são avaliados de forma diferente
- ❌ **Tarefas sem sprint (backlog) NÃO interferem em métricas de performance, mesmo que tenham worklog**

## 📊 O Que É o Performance Score?

O **Performance Score** é um número de **0 a 150 pontos** que mostra como você está indo no sprint. 

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
| 5 | 100 pontos ✨ | Perfeito (padrão quando não há nota) |
| 4 | 80 pontos ✅ | Aceitável |
| 3 | 60 pontos ⚠️ | Problema |
| 2 | 40 pontos ❌ | Crítico |
| 1 | 20 pontos 🔥 | Catastrófico |

**💡 Nota:** Tarefas marcadas como "Auxílio" ou "Reunião" são **neutras** e não entram no cálculo da média de qualidade.

#### Eficiência (50%)
Mede se você **entregou conforme esperado**. O sistema funciona diferente para **Bugs** e **Features**:

**🚀 Features (Tarefas, Histórias):**
- Compara: **estimativa original** vs **tempo gasto total** (de todos os sprints)
- **Fazer até 50% mais rápido** = sempre eficiente! ✅
- **Se gastou mais que estimado**, tolerância por complexidade:
  - Complexidade 1: até +15% (ex: estimou 10h, gastou até 11.5h = OK)
  - Complexidade 2: até +18% (ex: estimou 10h, gastou até 11.8h = OK)
  - Complexidade 3: até +20% (ex: estimou 10h, gastou até 12h = OK)
  - Complexidade 4: até +30% (ex: estimou 10h, gastou até 13h = OK)
  - Complexidade 5: até +40% (ex: estimou 10h, gastou até 14h = OK)

**🐛 Bugs:**
Bugs são imprevisíveis! O sistema usa **apenas as horas gastas** (não usa estimativa):

| Complexidade | Zona Eficiente ✅ | Zona Aceitável ⚠️ | Zona Ineficiente ❌ |
|--------------|-------------------|-------------------|---------------------|
| 1 | até 2h | 2h a 4h | acima de 4h |
| 2 | até 4h | 4h a 8h | acima de 8h |
| 3 | até 8h | 8h a 16h | acima de 16h |
| 4 | até 16h | 16h a 32h | acima de 32h |
| 5 | até 16h | 16h a 24h | acima de 24h |

**💡 Importante sobre Bugs:**
- Apenas a **Zona Eficiente** conta como eficiente no cálculo da eficiência geral
- A **Zona Aceitável** NÃO conta como eficiente na eficiência geral e também NÃO conta nos bônus de senioridade e complexidade 3
- **Por que diferente?** Bugs são imprevisíveis, então não penaliza se a estimativa original foi ruim!

### Os Bônus (0-40 pontos)

**Total máximo de bônus:** 10 (Complexidade 4-5) + 15 (Senioridade) + 5 (Complexidade 3) + 10 (Auxílio) = 40 pontos

Você ganha pontos extras por:

1. **Trabalhar em tarefas complexas (4-5)** (+0 a 10 pontos)
   - Quanto mais tarefas complexas (nível 4-5) você fizer, mais pontos ganha!
   - 0% de tarefas complexas = 0 pontos
   - 50% de tarefas complexas = +5 pontos
   - 100% de tarefas complexas = +10 pontos

2. **Fazer tarefas complexas bem** (+0 a 15 pontos) 🎯
   - **Este é o indicador principal de senioridade!**
   - Não basta pegar tarefa difícil, tem que fazer bem também!
   - Aplica para **Features e Bugs complexos** (nível 4-5)
   - **Cálculo:**
     - **Altamente eficiente** = conta 1.0 (dentro dos limites esperados)
     - **Ineficiente** = não conta (0)
     - **Importante:** Apenas tarefas altamente eficientes contam (zona aceitável não conta mais)
   - **Exemplo prático:**
     ```
     Você tem 4 tarefas complexas (2 features + 2 bugs):
     - 2 features altamente eficientes = 2 × 1.0 = 2.0
     - 1 bug altamente eficiente = 1 × 1.0 = 1.0
     - 1 bug na zona aceitável = não conta (0)
     
     Score: (2.0 + 1.0) / 4 = 75% eficiência
     Bônus: 75% × 15 = +11 pontos! 🏆
     ```
   - **Bugs complexos também contam:** Executar bugs complexos com eficiência mostra habilidade de debugging avançada! 🐛✨

3. **Fazer tarefas complexidade 3 bem** (+0 a 5 pontos) 🎯
   - Recompensa executar tarefas complexidade 3 com alta eficiência
   - **Cálculo:** % de tarefas complexidade 3 eficientes × 5 pontos
   - **Critério:** Features dentro da tolerância (+20%), Bugs apenas zona eficiente
   - **Exemplo:** 4 tarefas complexidade 3, 3 eficientes = 75% × 5 = +3.75 → +4 pontos

4. **Ajudar os colegas** (+0 a 10 pontos) 🤝
   - Marque tarefas com "Auxilio" no campo "Detalhes Ocultos"
   - Escala progressiva (quanto mais ajuda, mais pontos por hora):
     - 0.5h+ = 1 ponto 🟢
     - 2h+ = 2 pontos 🟢
     - 4h+ = 4 pontos 🔵
     - 6h+ = 5 pontos 🟣
     - 8h+ = 7 pontos 🟠
     - 12h+ = 9 pontos 🟡
     - 16h+ = 10 pontos 🏆 (máximo)

## 💡 Exemplos Práticos

### Exemplo 1: João - Dev Consistente ✨
```
João fez 5 tarefas neste sprint (1 complexa nível 4-5):
- Todas concluídas com nota 5 (perfeito!)
- Estimou 8h, gastou 8h ✅ (eficiente!)
- Estimou 6h, gastou 5h ✅ (fez mais rápido!)
- Estimou 4h, gastou 4.5h ✅ (dentro do limite!)
- Estimou 10h, gastou 12h ✅ (assumindo complexidade 3, desvio de -20%, dentro do limite de -20%!)
- Estimou 2h, gastou 1h ✅ (fez mais rápido!)

Cálculo:
→ Qualidade: 100 pontos (nota 5 média)
→ Eficiência: 100 pontos (5/5 eficientes)
→ Base: (100 + 100) / 2 = 100 pontos
→ Bonus Complexidade (4-5): +2 pontos (20% tarefas complexas)

Performance Score: 102 pontos ⭐⭐⭐⭐⭐
```

### Exemplo 2: Maria - Trabalhando com Bugs 🐛
```
Maria fez 8 bugs neste sprint:
- 4 bugs ficaram na zona eficiente ✅ (complexidade 1 gastou 1.5h, complexidade 2 gastou 3h, etc)
- 4 bugs ficaram na zona aceitável ⚠️ (não contam como eficientes)
- Nota média: 4.5

Cálculo:
→ Qualidade: 90 pontos (nota 4.5 média)
→ Eficiência: 50 pontos (4/8 eficientes - só zona eficiente conta!)
→ Base: (90 + 50) / 2 = 70 pontos
→ Bonus Complexidade (4-5): +3 pontos (25% tarefas complexas)
→ Bonus Senioridade: +15 pontos (2 bugs complexos eficientes)

Performance Score: 88 pontos ⭐⭐⭐⭐
```

### Exemplo 3: Pedro - Features Complexas 🏆
```
Pedro fez 6 features complexas (nível 4-5):
- Todas executadas com alta eficiência ✅
- Nota média: 4.67
- Exemplo: Tarefa complexidade 4, estimou 15h, gastou 16h ✅ (dentro de -30%)

Cálculo:
→ Qualidade: 93.3 pontos (nota 4.67 média)
→ Eficiência: 100 pontos (6/6 eficientes)
→ Base: (93.3 + 100) / 2 = 96.65 pontos
→ Bonus Complexidade (4-5): +7 pontos (67% tarefas complexas)
→ Bonus Senioridade: +14 pontos (executou complexas com alta eficiência)

Performance Score: 117.65 pontos 🏆 Excepcional!
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
→ Qualidade: 100 pontos (nota 5, sem nota = 5)
→ Eficiência: 0 pontos (todas tarefas com 0h vs estimativas = ineficientes)
→ Base: (100 + 0) / 2 = 50 pontos

Performance Score: 50 pontos ⭐⭐

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
→ Bonus Complexidade (4-5): +2 pontos (14.3% tarefas complexas)
→ Bonus Senioridade: +15 pontos (feature complexa altamente eficiente)
→ Bonus Complexidade 3: +5 pontos (bug complexidade 3 eficiente = 100%)
→ Bonus Auxílio: +2 pontos (2h de auxílio)

Performance Score: 118 pontos 🏆 Excepcional!
```

### Exemplo 7: Maria - Horas Extras com Qualidade Alta ⏰
```
Maria trabalhou em um sprint difícil:
- 8 tarefas concluídas
- Trabalhou 48h no total (8h extras acima de 40h)
- 2 das tarefas foram marcadas como "HoraExtra" no campo "Detalhes Ocultos"
- A média das notas dessas 2 tarefas foi 4.5 (ambas com alta qualidade)

Cálculo:
→ Qualidade: 80 pontos (nota média geral 4.0)
→ Eficiência: 75 pontos
→ Base: (80 + 75) / 2 = 77.5 pontos
→ Bonus Horas Extras: +7 pontos (8h extras com média de HE ≥ 4.0 → escala 8h = 7 pontos)

Performance Score: 84.5 pontos ⭐⭐⭐⭐

⚠️ IMPORTANTE: Este bônus não é um incentivo para trabalhar horas extras.
Ele reconhece esforço adicional em momentos difíceis quando a qualidade é mantida alta.
O bônus é concedido se a **nota MÉDIA** de TODAS as tarefas marcadas como "HoraExtra" for ≥ 4.0.
💡 DICA: Você pode ter múltiplos valores separados por vírgula, ex: "Auxilio, HoraExtra"
```

## 🎨 O Que Significa Meu Score?

| Pontos | Classificação | O Que Significa? |
|--------|--------------|------------------|
| 115-140 | 🏆 Excepcional | Você está indo muito bem! Parabéns! |
| 90-114 | ⭐⭐⭐⭐⭐ Excelente | Ótimo trabalho! Continue assim! |
| 75-89 | ⭐⭐⭐⭐ Muito Bom | Bom desempenho, alguns pontos para melhorar |
| 60-74 | ⭐⭐⭐ Bom | Desempenho adequado, tem espaço para crescer |
| 45-59 | ⭐⭐ Adequado | Está ok, mas dá para melhorar! |
| <45 | ⭐ Precisa Atenção | Vamos conversar e melhorar juntos! 💪 |

## 🔍 Regras Importantes

**✅ O que ENTRA no score:**
- Tarefas **concluídas** (`teste`, `teste gap`, `compilar`, `concluído`, `concluido`)
- Com **sprint** definido (tarefas sem sprint = backlog, não contam)
- Com **estimativa** e **worklog** registrado
- Tempo sempre do **worklog**, nunca da planilha!

**❌ O que NÃO entra:**
- Tarefas sem sprint (backlog) - mesmo que tenham worklog e estejam concluídas
- Tarefas em progresso ou sem estimativa
- Tarefas marcadas como "Reunião" (neutras)
- Métricas de utilização/conclusão (apenas informativas)

**📝 Sobre Detalhes Ocultos:**
- Você pode marcar tarefas com múltiplos valores: "Auxilio", "Reunião", "HoraExtra", "DuvidaOculta"
- Valores podem ser separados por vírgula na mesma célula: "Auxilio, HoraExtra"
- Sistema suporta múltiplas colunas de "Detalhes Ocultos" (similar a Features e Categorias)
- Valores são normalizados automaticamente (case-insensitive, sem acentos)
- **Para horas extras:** Coloque "HoraExtra" (ou "Hora Extra", "Horas Extras", "HorasExtras") no campo "Detalhes Ocultos" da tarefa
- **Para auxílio:** Coloque "Auxilio" no campo "Detalhes Ocultos" da tarefa
- **Para reuniões:** Coloque "Reunião" no campo "Detalhes Ocultos" da tarefa (não afeta score)

**📝 Sobre Nota de Teste:**
- Sem nota = assume **nota 5** (perfeito!)
- Sempre preencha quando houver problemas

## ❓ Perguntas Frequentes

**Q: Executar mais rápido é ruim?**  
A: Não! Fazer até **50% mais rápido** é **sempre bom**! ✅

**Q: Por que bugs são avaliados diferente?**  
A: Bugs são imprevisíveis! O sistema verifica se você gastou tempo excessivo para a complexidade (não penaliza por estimativa ruim).

**Q: Bugs complexos contam para senioridade?**  
A: Sim! Bugs complexos (4-5) também contam para o bônus de senioridade. Apenas bugs na zona eficiente contam (zona aceitável não conta mais). 🐛✨

**Q: O que acontece sem worklog?**  
A: ⚠️ **Sem worklog = 0 horas = todas tarefas ineficientes!** O sistema usa worklog, NUNCA a planilha. Sempre registre seu tempo!

**Q: Como marcar tarefas como horas extras?**  
A: No campo "Detalhes Ocultos" da tarefa, coloque "HoraExtra" (ou "Hora Extra", "Horas Extras", "HorasExtras"). O sistema aceita variações e múltiplos valores separados por vírgula (ex: "Auxilio, HoraExtra"). ⏰

**Q: Tarefa atravessa sprints?**  
A: Para **Performance (avaliação)**, o sistema usa estimativa original e tempo total de TODOS os sprints. Para **Capacidade (planejamento)**, usa estimativa restante e tempo gasto NESTE sprint.

**Q: Tarefas sem sprint aparecem nas métricas?**  
A: ❌ **NÃO!** Tarefas sem sprint (backlog) NÃO interferem em métricas de performance, mesmo que tenham worklog e estejam concluídas. Elas são usadas APENAS para análise de backlog na aba multi-sprint. Para contabilizar, a tarefa precisa estar alocada em um sprint.

## 🔢 Como É Calculado (Passo a Passo)

1. **Qualidade:** Nota média × 20 (sem nota = 5)
2. **Eficiência:** % de tarefas eficientes × 100
   - Features: compara estimativa vs tempo gasto total
   - Bugs: verifica se horas estão na zona eficiente da complexidade
3. **Base:** (50% × Qualidade) + (50% × Eficiência)
4. **Bonus Complexidade (4-5):** % tarefas complexas (4-5) × 10
5. **Bonus Senioridade:** Eficiência em tarefas complexas (4-5) × 15
   - Apenas tarefas altamente eficientes contam (zona aceitável não conta mais)
6. **Bonus Complexidade 3:** Eficiência em tarefas complexidade 3 × 5
   - Features: dentro da tolerância (+20%)
   - Bugs: zona eficiente apenas
7. **Bonus Auxílio:** Escala progressiva (2h=2pts, 4h=4pts, 6h=5pts, 8h=7pts, 12h=9pts, 16h+=10pts)
8. **Bonus Horas Extras:** Escala progressiva baseada em horas extras trabalhadas com qualidade alta
   - ⚠️ **IMPORTANTE:** Este bônus não é um incentivo para trabalhar horas extras
   - Ele reconhece esforço adicional em momentos difíceis quando a qualidade é mantida alta
   - **Como marcar:** Coloque "HoraExtra" (ou "Hora Extra", "Horas Extras", "HorasExtras") no campo "Detalhes Ocultos" da tarefa
   - **Regra:** O bônus só é concedido se a **nota MÉDIA de teste (≥ 4.0)** de TODAS as tarefas marcadas como "HoraExtra" for alta. Tarefas de "Auxílio" e "Reunião" marcadas como hora extra não entram no cálculo dessa média.
   - O bônus é calculado sobre o total de horas de **todas as tarefas concluídas** que excederam 40h.
   - Escala: 1h=1pt, 2h=2pts, 4h=4pts, 6h=5pts, 8h=7pts, 12h=9pts, 16h+=10pts (máximo)
   - **Exemplo:** Você trabalhou 48h (8h extras). A média das suas tarefas "HoraExtra" (excluindo qualquer auxílio/reunião) foi 4.5. Você ganha o bônus para 8h, que é +7 pontos.
9. **Score Final:** Base + Todos os Bônus (máximo 150 pontos)

## 🎯 Resumo Final

**Fórmula Completa:**
```