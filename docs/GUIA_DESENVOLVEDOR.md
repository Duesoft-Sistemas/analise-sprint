# 🚀 Guia do Desenvolvedor: Entendendo sua Performance

Olá! Este guia foi criado para te ajudar a entender como sua performance é calculada no sistema. Vamos direto ao ponto! 😊

## 🎯 Resumo Ultra-Rápido (30 segundos)

**Seu score = 50% Qualidade + 50% Eficiência + Bônus**

- **Qualidade:** Nota de teste (1-5). Sem nota = 5 (perfeito!)
- **Eficiência:** Entregou conforme esperado? Features: compara estimativa vs tempo. Bugs: verifica se gastou tempo excessivo.
- **Bônus:** Tarefas complexas (+10), Features complexas bem feitas (+15), Ajudar colegas (+10)
- **Máximo:** 135 pontos

**Regras importantes:**
- ✅ Só conta tarefas **concluídas** (`teste`, `teste gap`, `compilar`, `concluído`)
- ✅ Sistema usa **worklog**, nunca a planilha!
- ✅ Fazer até 50% mais rápido = sempre eficiente!
- ✅ Bugs e Features são avaliados diferente (bugs são imprevisíveis!)

Pronto! Agora leia o resto para entender os detalhes! 😊

## 📊 O Que É o Performance Score?

O **Performance Score** é um número que mostra como você está indo no sprint. Ele vai de **0 a 135 pontos**.

Pensa assim: quanto maior o número, melhor você está se saindo! Mas não se preocupe se não estiver no máximo - o importante é entender e melhorar continuamente.

## 🎯 Como É Calculado?

Sua performance é calculada assim:

```
Performance Score = Base + Bônus
```

### A Base (0-100 pontos)

**50% Qualidade + 50% Eficiência**

#### Qualidade (50%)
- Depende da sua **nota de teste** média
- Nota 5 = 100 pontos ✨ (se não tiver nota, assume 5)
- Nota 4 = 80 pontos ✅
- Nota 3 = 60 pontos ⚠️
- Nota 2 = 40 pontos ❌
- Nota 1 = 20 pontos 🔥
- Quanto melhor os testes, maior a pontuação!
- **Importante:** Só considera tarefas **concluídas** (status: `teste`, `teste gap`, `compilar`, `concluído`)

#### Eficiência (50%)
- Depende se você **entregou conforme esperado**
- O sistema funciona diferente para **Bugs** e **Features**:

**Para Features (Tarefas, Histórias):**
- Compara: estimativa original vs tempo gasto total (de todos os sprints)
- **Fazer até 50% mais rápido** = sempre eficiente! 🚀
- **Se gastou mais que estimado**, tolerância por complexidade:
  - Complexidade 1 (simples): pode atrasar até 15% (estimou 10h, gastou até 11.5h = OK)
  - Complexidade 2: pode atrasar até 18% (estimou 10h, gastou até 11.8h = OK)
  - Complexidade 3 (média): pode atrasar até 20% (estimou 10h, gastou até 12h = OK)
  - Complexidade 4 (complexa): pode atrasar até 30% (estimou 10h, gastou até 13h = OK)
  - Complexidade 5 (muito complexa): pode atrasar até 40% (estimou 10h, gastou até 14h = OK)
- **Importante:** Se a tarefa atravessou sprints, compara com tempo total (não apenas do sprint atual)

**Para Bugs:**
- Bugs complexidade 1-4: verifica se gastou tempo excessivo (zona de eficiência)
  - **Zona Eficiente** ✅ (100% eficiente):
    - Complexidade 1: até 2h (acima = aceitável)
    - Complexidade 2: até 4h (acima = aceitável)
    - Complexidade 3: até 8h (acima = aceitável)
    - Complexidade 4: até 16h (acima = aceitável)
  - **Zona Aceitável** ⚠️ (NÃO conta como eficiente, mas ainda dentro do limite aceitável):
    - Complexidade 1: 2h a 4h (acima = ineficiente)
    - Complexidade 2: 4h a 8h (acima = ineficiente)
    - Complexidade 3: 8h a 16h (acima = ineficiente)
    - Complexidade 4: 16h a 32h (acima = ineficiente)
    - **Importante:** A zona aceitável é apenas informativa - ela NÃO conta como eficiente no cálculo do accuracyRate
    - É usada apenas para mostrar que está acima da zona eficiente, mas ainda dentro do limite aceitável
    - **Nota:** Bugs não contam para bônus de senioridade mesmo
  - **Zona Ineficiente** ❌ (0% eficiente):
    - Complexidade 1: acima de 4h
    - Complexidade 2: acima de 8h
    - Complexidade 3: acima de 16h
    - Complexidade 4: acima de 32h
- Bugs complexidade 5: usa desvio percentual (como features), tolerância de -40%
- **Por que diferente?** Bugs são imprevisíveis, então não penaliza se a estimativa original foi ruim! 😊
- **Importante:** O sistema usa **apenas as horas gastas** para bugs complexidade 1-4, não a estimativa original!

### Os Bônus (0-35 pontos)

Você ganha pontos extras por:

1. **Trabalhar em tarefas complexas** (+0 a 10 pontos)
   - Quanto mais tarefas complexas (nível 4-5) você fizer, mais pontos ganha!
   - 0% de tarefas complexas = 0 pontos
   - 50% de tarefas complexas = +5 pontos
   - 100% de tarefas complexas = +10 pontos

2. **Fazer tarefas complexas bem** (+0 a 15 pontos) 🎯
   - **Este é o indicador principal de senioridade!**
   - Não basta pegar tarefa difícil, tem que fazer bem também!
   - Aplica APENAS para **Features complexas** (bugs não contam)
   - O cálculo considera:
     - **Altamente eficiente** = conta 1.0 (dentro dos limites esperados)
     - **Moderadamente eficiente** = conta 0.5 (ainda aceitável)
     - **Ineficiente** = não conta
   - **Exemplo:** Se você tem 4 tarefas complexas:
     - 3 altamente eficientes + 1 moderadamente eficiente
     - Score: (3 × 1.0 + 1 × 0.5) / 4 = 87.5% eficiência
     - Bônus: 87.5% × 15 = +13 pontos! 🏆
   - **Por que bugs não contam?** Bugs são imprevisíveis por natureza, então não avalia senioridade!

3. **Ajudar os colegas** (+0 a 10 pontos) 🤝
   - Marque tarefas com "Auxilio" no campo "Detalhes Ocultos"
   - Escala progressiva (quanto mais ajuda, mais pontos por hora):
     - 0.5h+ = 1 ponto 🟢
     - 2h+ = 2 pontos 🟢
     - 4h+ = 3 pontos 🔵
     - 6h+ = 4 pontos 🟣
     - 8h+ = 6 pontos 🟠
     - 12h+ = 8 pontos 🟡
     - 16h+ = 10 pontos 🏆 (máximo)

## 💡 Exemplos Práticos por Cenário

**Índice de Exemplos:**
1. **Features Simples** - Tarefas simples executadas com eficiência
2. **Trabalhando com Bugs** - Como bugs são avaliados (zonas de eficiência)
3. **Features Complexas** - Tarefas e histórias complexas com bônus de senioridade
4. **Com Auxílio** - Reconhecimento por ajudar colegas
5. **Tarefa "Outro"** - Outros tipos de tarefas
6. **Bug Ineficiente** - Mistura de bugs e features
7. **Tarefa Que Atravessa Sprints** - Análise híbrida detalhada
8. **Dev Em Aprendizado** - Tarefas simples com dificuldades
9. **Mistura de Tudo** - Cenário realista completo
10. **Sem Worklog** - O que acontece quando não há registro de tempo
11. **Feature Executando Mais Rápido** - Executar muito mais rápido que estimado
12. **Feature Que Atrasou** - Tarefas que estouraram os limites
13. **Bug Complexidade 5** - Bugs muito complexos usando desvio percentual
14. **Tarefas Com Reunião** - Como reuniões são tratadas (neutras)
15. **Diferentes Notas de Teste** - Impacto de diferentes notas e notas vazias

### Exemplo 1: Dev Consistente (Features Simples)
```
João fez (5 tarefas tipo "Tarefa"):
- Complexidade 2, estimou 8h, gastou 8h → ✅ Eficiente
- Complexidade 2, estimou 6h, gastou 5h → ✅ Eficiente (mais rápido!)
- Complexidade 1, estimou 4h, gastou 4.5h → ✅ Eficiente (dentro de -15%)
- Complexidade 3, estimou 10h, gastou 12h → ✅ Eficiente (dentro de -20%)
- Complexidade 1, estimou 2h, gastou 1h → ✅ Eficiente (50% mais rápido!)

Notas de teste: 5, 5, 5, 5, 5

Cálculo:
- Qualidade: 100 pontos (nota 5 média)
- Eficiência: 100 pontos (5/5 eficientes = 100%)
- Base: (100 + 100) / 2 = 100 pontos
- Bônus: +2 pontos (20% tarefas complexas)

Performance Score: 102 pontos ⭐⭐⭐⭐⭐
```

### Exemplo 2: Dev Trabalhando com Bugs
```
Maria fez (8 bugs):
- Bug complexidade 1, gastou 1.5h → ✅ Eficiente (até 2h)
- Bug complexidade 1, gastou 2.5h → ⚠️ Aceitável (2h-4h, mas não conta)
- Bug complexidade 2, gastou 3h → ✅ Eficiente (até 4h)
- Bug complexidade 2, gastou 5h → ⚠️ Aceitável (4h-8h, mas não conta)
- Bug complexidade 3, gastou 7h → ✅ Eficiente (até 8h)
- Bug complexidade 3, gastou 12h → ⚠️ Aceitável (8h-16h, mas não conta)
- Bug complexidade 4, gastou 14h → ✅ Eficiente (até 16h)
- Bug complexidade 5, estimou 20h, gastou 25h → ✅ Eficiente (-25%, dentro de -40%)

Notas de teste: 5, 4, 5, 4, 5, 3, 5, 5

Cálculo:
- Qualidade: 90 pontos (nota média 4.5)
- Eficiência: 50 pontos (4/8 eficientes = 50%, só zona eficiente conta)
- Base: (90 + 50) / 2 = 70 pontos
- Bônus: +1 ponto (12.5% tarefas complexas)
- **Importante:** Bugs não contam para bônus de senioridade!

Performance Score: 71 pontos ⭐⭐⭐
```

### Exemplo 3: Dev Trabalhando com Features Complexas
```
Pedro fez (6 features tipo "Tarefa" e "História"):
- Tarefa complexidade 4, estimou 15h, gastou 16h → ✅ Altamente Eficiente (-6.7%, dentro de -30%)
- História complexidade 4, estimou 20h, gastou 24h → ✅ Altamente Eficiente (-20%, dentro de -30%)
- Tarefa complexidade 5, estimou 30h, gastou 35h → ✅ Altamente Eficiente (-16.7%, dentro de -40%)
- História complexidade 4, estimou 12h, gastou 15.6h → ⚠️ Moderadamente (-30%, no limite)
- Tarefa complexidade 3, estimou 8h, gastou 7h → ✅ Eficiente (mais rápido!)
- Tarefa complexidade 2, estimou 4h, gastou 5h → ✅ Eficiente (-25%, mas dentro de -18%)

Notas de teste: 5, 5, 4, 4, 5, 5

Cálculo:
- Qualidade: 93.3 pontos (nota média 4.67)
- Eficiência: 100 pontos (6/6 eficientes = 100%)
- Base: (93.3 + 100) / 2 = 96.65 pontos
- Bônus Complexidade: +7 pontos (66.7% tarefas complexas)
- Bônus Senioridade: +14 pontos (3 altas + 1 moderada: (3×1.0 + 1×0.5)/4 = 87.5%)

Performance Score: 117.65 pontos 🏆 Excepcional!
```

### Exemplo 4: Dev Que Ajuda Muito (Com Auxílio)
```
Ana fez (6 tarefas + auxílio):
- 4 tarefas simples (nota 4 em média) ✅
- Eficiência: 75 pontos
- MAS: ajudou 10h os colegas! 🤝 (tarefas marcadas como "Auxilio")

Cálculo:
- Qualidade: 80 pontos (nota 4 média)
- Eficiência: 75 pontos
- Base: (80 + 75) / 2 = 77.5 pontos
- Bônus Auxílio: +8 pontos (12h+ = 8 pontos)

Performance Score: 85.5 pontos ⭐⭐⭐⭐

Legal: O sistema reconhece quem ajuda! 😊
```

### Exemplo 5: Dev Trabalhando com Tarefa "Outro"
```
Carlos fez (5 tarefas tipo "Outro"):
- Todas complexidade 3, nota 4 média
- Estimou 10h, gastou 11h → ✅ Eficiente (-10%, dentro de -20%)
- Estimou 8h, gastou 9h → ✅ Eficiente (-12.5%, dentro de -20%)
- Estimou 12h, gastou 14h → ✅ Eficiente (-16.7%, dentro de -20%)
- Estimou 6h, gastou 5h → ✅ Eficiente (mais rápido!)
- Estimou 4h, gastou 6h → ❌ Ineficiente (-50%, fora de -20%)

Cálculo:
- Qualidade: 80 pontos (nota 4 média)
- Eficiência: 80 pontos (4/5 eficientes = 80%)
- Base: (80 + 80) / 2 = 80 pontos
- Bônus: +0 pontos (sem tarefas complexas)

Performance Score: 80 pontos ⭐⭐⭐⭐
```

### Exemplo 6: Bug Ineficiente vs Feature Eficiente
```
Roberto fez (1 bug + 4 features):
- Bug complexidade 1, gastou 5h → ❌ Ineficiente (acima de 4h)
- Tarefa complexidade 1, estimou 2h, gastou 2h → ✅ Eficiente
- História complexidade 2, estimou 4h, gastou 4h → ✅ Eficiente
- Tarefa complexidade 3, estimou 8h, gastou 9h → ✅ Eficiente (-12.5%, dentro de -20%)
- Tarefa complexidade 2, estimou 6h, gastou 5h → ✅ Eficiente (mais rápido!)

Notas de teste: 4, 5, 5, 5, 5

Cálculo:
- Qualidade: 96 pontos (nota média 4.8)
- Eficiência: 80 pontos (4/5 eficientes = 80%, bug ineficiente não conta)
- Base: (96 + 80) / 2 = 88 pontos
- Bônus: +1 ponto (20% tarefas complexas)

Performance Score: 89 pontos ⭐⭐⭐⭐
```

### Exemplo 7: Tarefa Que Atravessa Sprints
```
Julia trabalhou na tarefa PROJ-200:
- Tipo: Tarefa (Feature)
- Complexidade: 4
- Estimativa Original: 20h (nunca muda!)

Sprint 1:
- Gasto: 8h (ainda não terminou)
- Status: Em progresso

Sprint 2 (atual):
- Estimativa Restante: 12h (20h - 8h)
- Gasto neste sprint: 12h
- Status: Concluído ✅

Cálculo para Performance:
- Estimativa: 20h (original)
- Gasto Total: 20h (8h + 12h de todos os sprints)
- Desvio: 0% (perfeito! 20h = 20h)
- Resultado: ✅ Eficiente (-0%, dentro de -30% para complexidade 4)
- Nota de teste: 5

Impacto no Score:
- Qualidade: 100 pontos
- Eficiência: 100 pontos (tarefa eficiente)
- Base: (100 + 100) / 2 = 100 pontos
- Bônus Complexidade: +10 (tarefa complexa)
- Bônus Senioridade: +15 (feature complexa altamente eficiente)

Performance Score: 125 pontos 🏆 Excepcional!
```

### Exemplo 8: Dev Em Aprendizado (Tarefas Simples)
```
Pedro fez (6 tarefas simples):
- Complexidade 1, estimou 2h, gastou 3h → ❌ Ineficiente (-50%, fora de -15%)
- Complexidade 1, estimou 3h, gastou 4h → ❌ Ineficiente (-33%, fora de -15%)
- Complexidade 2, estimou 4h, gastou 5.5h → ❌ Ineficiente (-37.5%, fora de -18%)
- Complexidade 2, estimou 6h, gastou 8h → ❌ Ineficiente (-33%, fora de -18%)
- Complexidade 1, estimou 2h, gastou 2.3h → ✅ Eficiente (-15%, no limite!)
- Complexidade 2, estimou 4h, gastou 3.5h → ✅ Eficiente (mais rápido!)

Notas de teste: 3, 3, 3, 3, 4, 4

Cálculo:
- Qualidade: 60 pontos (nota média 3.33)
- Eficiência: 33.3 pontos (2/6 eficientes = 33.3%)
- Base: (60 + 33.3) / 2 = 46.65 pontos
- Bônus: +0 pontos (sem tarefas complexas)

Performance Score: 46.65 pontos ⭐

Importante: Isso não é ruim! É uma oportunidade de melhoria. 💪
```

### Exemplo 9: Mistura de Tudo (Realista)
```
Lucas fez neste sprint:
- 2 Bugs complexidade 1, gastou 1.5h e 2h → ✅✅ Ambos eficientes
- 1 Bug complexidade 2, gastou 3h → ✅ Eficiente
- 1 Bug complexidade 3, gastou 10h → ⚠️ Aceitável (mas não conta)
- 2 Tarefas complexidade 2, estimou 6h/4h, gastou 5h/3h → ✅✅ Ambos eficientes
- 1 História complexidade 4, estimou 15h, gastou 16h → ✅ Altamente Eficiente
- 1 Tarefa complexidade 5, estimou 30h, gastou 35h → ✅ Altamente Eficiente
- 2h de auxílio (tarefa marcada "Auxilio") 🤝

Notas de teste: 5, 5, 4, 3, 5, 5, 5, 5, 5

Cálculo:
- Qualidade: 92 pontos (nota média 4.6)
- Eficiência: 71.4 pontos (5/7 eficientes = 71.4%, só conta bugs na zona eficiente)
- Base: (92 + 71.4) / 2 = 81.7 pontos
- Bônus Complexidade: +4 pontos (28.6% tarefas complexas)
- Bônus Senioridade: +15 pontos (2 features complexas, ambas altamente eficientes)
- Bônus Auxílio: +2 pontos (2h de auxílio)

Performance Score: 102.7 pontos ⭐⭐⭐⭐⭐
```

### Exemplo 10: Sem Worklog
```
Patricia fez (3 tarefas):
- Tarefa complexidade 2, estimou 4h → ❌ Sem worklog (0h registrado)
- Tarefa complexidade 3, estimou 8h → ❌ Sem worklog (0h registrado)
- Tarefa complexidade 1, estimou 2h → ❌ Sem worklog (0h registrado)

Notas de teste: 5, 5, 5

⚠️ PROBLEMA: Sem worklog, o sistema considera 0 horas gastas!

Cálculo:
- Qualidade: 100 pontos (nota 5)
- Eficiência: 0 pontos (0h vs 4h, 0h vs 8h, 0h vs 2h = todas ineficientes)
- Base: (100 + 0) / 2 = 50 pontos
- Bônus: +0 pontos

Performance Score: 50 pontos ⭐⭐

MORAL DA HISTÓRIA: Sempre registre seu tempo no worklog! ⏱️
```

### Exemplo 11: Feature Executando Muito Mais Rápido
```
Fernando fez (4 tarefas tipo "História"):
- História complexidade 1, estimou 4h, gastou 2h → ✅ Eficiente (+100% mais rápido, mas só até +50% conta)
- História complexidade 2, estimou 6h, gastou 2h → ✅ Eficiente (+200% mais rápido, mas só até +50% conta)
- História complexidade 3, estimou 10h, gastou 5h → ✅ Eficiente (+100% mais rápido, mas só até +50% conta)
- História complexidade 4, estimou 15h, gastou 8h → ✅ Eficiente (+87.5% mais rápido, mas só até +50% conta)

Notas de teste: 5, 5, 5, 5

Cálculo:
- Qualidade: 100 pontos (nota 5)
- Eficiência: 100 pontos (4/4 eficientes = 100%, executar mais rápido sempre é bom!)
- Base: (100 + 100) / 2 = 100 pontos
- Bônus Complexidade: +5 pontos (50% tarefas complexas)
- Bônus Senioridade: +8 pontos (2 features complexas, ambas altamente eficientes)

Performance Score: 113 pontos ⭐⭐⭐⭐⭐

💡 Dica: Executar mais rápido que o estimado é sempre bom, até +50%!
```

### Exemplo 12: Feature Que Atrasou Fora dos Limites
```
Sofia fez (5 tarefas tipo "Tarefa"):
- Tarefa complexidade 1, estimou 4h, gastou 5h → ❌ Ineficiente (-25%, fora de -15%)
- Tarefa complexidade 2, estimou 6h, gastou 8h → ❌ Ineficiente (-33%, fora de -18%)
- Tarefa complexidade 3, estimou 10h, gastou 13h → ❌ Ineficiente (-30%, fora de -20%)
- Tarefa complexidade 4, estimou 15h, gastou 20h → ❌ Ineficiente (-33%, fora de -30%)
- Tarefa complexidade 1, estimou 3h, gastou 3.4h → ✅ Eficiente (-13.3%, dentro de -15%)

Notas de teste: 4, 4, 3, 3, 5

Cálculo:
- Qualidade: 76 pontos (nota média 3.8)
- Eficiência: 20 pontos (1/5 eficientes = 20%)
- Base: (76 + 20) / 2 = 48 pontos
- Bônus Complexidade: +3 pontos (40% tarefas complexas)
- Bônus Senioridade: +0 pontos (sem features complexas eficientes)

Performance Score: 51 pontos ⭐⭐

💡 Dica: Tente melhorar estimativas ou adicionar buffer para tarefas complexas!
```

### Exemplo 13: Bug Complexidade 5 (Usa Desvio Percentual)
```
Rafael fez (3 bugs complexidade 5):
- Bug complexidade 5, estimou 20h, gastou 22h → ✅ Eficiente (-10%, dentro de -40%)
- Bug complexidade 5, estimou 25h, gastou 32h → ✅ Eficiente (-28%, dentro de -40%)
- Bug complexidade 5, estimou 30h, gastou 45h → ❌ Ineficiente (-50%, fora de -40%)

Notas de teste: 5, 4, 3

Cálculo:
- Qualidade: 80 pontos (nota média 4)
- Eficiência: 66.7 pontos (2/3 eficientes = 66.7%)
- Base: (80 + 66.7) / 2 = 73.35 pontos
- Bônus: +10 pontos (100% tarefas complexas)

Performance Score: 83.35 pontos ⭐⭐⭐⭐

💡 Nota: Bugs complexidade 5 usam desvio percentual como features!
```

### Exemplo 14: Tarefas Com Reunião (Neutras)
```
Camila fez (5 tarefas + reuniões):
- 3 tarefas normais (nota 5, todas eficientes) ✅
- 1 tarefa marcada "Reunião" (8h) → ⚚️ Neutra (não conta!)
- 1 tarefa marcada "Reunião" (4h) → ⚚️ Neutra (não conta!)

Notas de teste: 5, 5, 5 (apenas das tarefas normais)

Cálculo:
- Qualidade: 100 pontos (nota 5)
- Eficiência: 100 pontos (3/3 eficientes = 100%)
- Base: (100 + 100) / 2 = 100 pontos
- Bônus: +0 pontos

Performance Score: 100 pontos ⭐⭐⭐⭐⭐

💡 Nota: Reuniões não afetam seu score - são apenas informativas!
```

### Exemplo 15: Diferentes Notas de Teste
```
Marcos fez (5 tarefas):
- Tarefa 1, nota 5 → 100 pontos de qualidade
- Tarefa 2, nota 4 → 80 pontos de qualidade
- Tarefa 3, nota 3 → 60 pontos de qualidade
- Tarefa 4, nota 2 → 40 pontos de qualidade
- Tarefa 5, sem nota → 100 pontos (assume 5)

Todas eficientes.

Cálculo:
- Qualidade: 76 pontos (notas: 5, 4, 3, 2, 5 → média 3.8 → 3.8 × 20 = 76)
- Eficiência: 100 pontos
- Base: (76 + 100) / 2 = 88 pontos
- Bônus: +0 pontos

Performance Score: 88 pontos ⭐⭐⭐⭐

💡 Dica: Sempre preencha nota de teste quando houver problemas! Se não preencher, assume 5!
```

## 🎨 O Que Significa Meu Score?

| Pontos | Classificação | O Que Significa? |
|--------|--------------|------------------|
| 115-135 | 🏆 Excepcional | Você está indo muito bem! Parabéns! |
| 90-114 | ⭐⭐⭐⭐⭐ Excelente | Ótimo trabalho! Continue assim! |
| 75-89 | ⭐⭐⭐⭐ Muito Bom | Bom desempenho, alguns pontos para melhorar |
| 60-74 | ⭐⭐⭐ Bom | Desempenho adequado, tem espaço para crescer |
| 45-59 | ⭐⭐ Adequado | Está ok, mas dá para melhorar! |
| <45 | ⭐ Precisa Atenção | Vamos conversar e melhorar juntos! 💪 |

## 🔍 Detalhes Importantes

### Qual Tarefa É Considerada?

**O que ENTRA na avaliação:**
- ✅ Tarefas **concluídas** (status: `teste`, `teste gap`, `compilar`, `concluído`)
- ✅ Tarefas com **estimativa** (precisa ter estimado para calcular eficiência)
- ✅ Tarefas com **worklog** (tempo gasto registrado)
- ✅ Tarefas que atravessam sprints (usa tempo **total** de todos os sprints)

**O que NÃO entra:**
- ❌ Tarefas em progresso ou pendentes
- ❌ Tarefas sem estimativa (não dá para calcular se foi eficiente)
- ❌ Tarefas marcadas como **"Reunião"** (são neutras, só informativas)
- ❌ Tempo da planilha (sistema usa **só worklog**!)

**Tarefas concluídas:**
- Quando a tarefa está em teste ou concluída → **entra** no cálculo
- Não importa quando você começou
- Se começou no Sprint 1 e terminou no Sprint 2 → conta no Sprint 2 (usa tempo total)

### Sobre Reuniões
- Se marcar uma tarefa como **"Reunião"** no campo "Detalhes Ocultos", ela não afeta seu score
- Só informativo (mostra quanto tempo você gastou em reuniões)
- Não penaliza, não bonifica - é neutra! 😊

### Sobre a Nota de Teste
- Se **não tiver** nota de teste → o sistema assume **nota 5** (máxima) ✨
- Ou seja: tarefas sem nota são consideradas "perfeitas" em qualidade
- **Dica importante:** Sempre preencha a nota quando houver problemas! Se não preencher, assume que está perfeito

### Complexidade 5 (Muito Complexa)
- Tarefas de complexidade 5 **não têm limite absoluto de horas**
- Elas são avaliadas apenas por desvio percentual (compara estimativa vs tempo gasto)
- Isso reconhece que tarefas muito complexas são naturalmente imprevisíveis! 😊

### Configurações Exatas do Sistema

**Tolerâncias de Desvio (Features):**
- Complexidade 1: pode atrasar até -15% OU executar até +50% mais rápido
- Complexidade 2: pode atrasar até -18% OU executar até +50% mais rápido
- Complexidade 3: pode atrasar até -20% OU executar até +50% mais rápido
- Complexidade 4: pode atrasar até -30% OU executar até +50% mais rápido
- Complexidade 5: pode atrasar até -40% OU executar até +50% mais rápido

**Zonas de Eficiência para Bugs (complexidade 1-4):**
- **Eficiente:** 100% conta para eficiência
  - Complexidade 1: até 2h
  - Complexidade 2: até 4h
  - Complexidade 3: até 8h
  - Complexidade 4: até 16h
- **Aceitável:** NÃO conta como eficiente (mas ainda dentro do limite)
  - Complexidade 1: 2h a 4h
  - Complexidade 2: 4h a 8h
  - Complexidade 3: 8h a 16h
  - Complexidade 4: 16h a 32h
  - **Nota:** A zona aceitável é apenas informativa - apenas a zona eficiente conta como eficiente
- **Ineficiente:** 0% conta (não eficiente)
  - Acima dos limites aceitáveis

**Bugs Complexidade 5:**
- Usa desvio percentual igual às features
- Tolerância: -40% (pode atrasar até 40%) OU +50% (pode executar até 50% mais rápido)

**Bônus Máximos:**
- Bônus Complexidade: até 10 pontos
- Bônus Senioridade: até 15 pontos
- Bônus Auxílio: até 10 pontos
- **Score Máximo Total: 135 pontos** (100 base + 35 bônus)

### O Que Entra e O Que NÃO Entra na Avaliação

**✅ ENTRA no Performance Score:**
1. **Qualidade:**
   - Nota de teste de tarefas **concluídas**
   - Vazio = nota 5 (assumido perfeito)
   - Média de todas as notas de teste

2. **Eficiência:**
   - Comparação estimativa original vs tempo gasto total
   - Apenas tarefas **concluídas** com estimativa
   - Tempo sempre do **worklog**, nunca da planilha
   - Se a tarefa atravessou sprints, usa tempo total histórico

3. **Bônus:**
   - Complexidade: % de tarefas complexas concluídas (nível 4-5)
   - Senioridade: Eficiência em features complexas concluídas
   - Auxílio: Horas gastas em tarefas marcadas como "Auxilio"

**❌ NÃO ENTRA no Performance Score:**
1. **Métricas de Contexto (só informativas):**
   - Taxa de Utilização (horas trabalhadas vs 40h)
   - Taxa de Conclusão (concluídas vs iniciadas)
   - Taxa de Bugs (quantidade de bugs vs features)
   - Bugs vs Features (razão)
   - Consistência (variação nas estimativas)
   - Desvio de Estimativa (só informativo, não faz parte do score)

2. **Tarefas Excluídas:**
   - Tarefas em progresso ou pendentes
   - Tarefas sem estimativa
   - Tarefas marcadas como "Reunião"
   - Tempo gasto da planilha (sistema ignora!)

**Por quê?**
- O score foca no que você **controla diretamente**: qualidade (testes) e eficiência (execução)
- Métricas de utilização/conclusão podem ser afetadas por fatores externos (bloqueios, realocações)
- Tarefas em progresso ainda não têm resultado final para avaliar
- Reuniões são atividades organizacionais, não de desenvolvimento

## ❓ Perguntas Que Você Pode Ter

### "Executar mais rápido é ruim?"
**Não!** Fazer até **50% mais rápido** que o estimado é **sempre bom**! Mostra que você domina bem a tarefa. ✅

### "Por que bugs são avaliados diferente?"
Bugs são imprevisíveis por natureza! O sistema:
- **Não penaliza** se você gastou mais que o estimado (a estimativa pode ter sido ruim)
- **Verifica** se você gastou tempo excessivo para aquela complexidade
- **Reconhece** que nem sempre dá para saber quanto tempo um bug vai levar

### "Fazer tarefas simples é ruim?"
Não necessariamente! Mas fazer tarefas **complexas bem** te dá mais bônus. É normal fazer tarefas simples também! 😊

### "Por que bugs não contam para o bônus de senioridade?"
Bugs são imprevisíveis, então executá-los bem não mostra necessariamente senioridade. O bônus de senioridade recompensa executar **features complexas** com alta eficiência - isso sim mostra experiência! 🎯

### "Meu score baixou, significa que estou piorando?"
Não necessariamente! Pode ser que você esteja pegando tarefas mais complexas, ou ajudando mais colegas (que é bom!). O importante é ver a **tendência** ao longo do tempo. 📈

### "Como melhorar meu score?"
1. **Foque na qualidade:** Faça testes bem feitos (e preencha a nota quando houver problemas)
2. **Melhore estimativas:** Aprenda com o passado para estimar melhor
3. **Ajude colegas:** Ganha bônus e faz a equipe melhor! 🤝 (marque como "Auxilio")
4. **Peça tarefas complexas:** Com o tempo, ganha mais experiência e bônus
5. **Execute bem tarefas complexas:** Não basta pegar, tem que fazer bem feito! 🎯

### "O que acontece se eu não tiver worklog?"
⚠️ **MUITO IMPORTANTE:** O sistema **sempre** usa worklog, **nunca** usa a planilha!

- Sem worklog → sistema considera **0 horas** gastas
- Se a planilha tiver "tempo gasto" → sistema **ignora**!
- Isso não afeta qualidade (nota de teste), mas **pode afetar** eficiência
- **Por quê?** Worklog é a fonte verdadeira do tempo trabalhado!
- **Dica:** Sempre registre seu tempo no worklog! ⏱️

### "Como funciona quando uma tarefa atravessa vários sprints?"
O sistema separa o tempo gasto em cada sprint automaticamente!

**Como funciona:**
- Se você gastou 5h no Sprint 1 (ainda não terminou) e a estimativa era 15h
- No Sprint 2, a **estimativa restante** é 10h (15h - 5h = o que falta)
- Isso é usado para calcular sua **capacidade** (quanto trabalho você ainda tem)

**Exemplo completo:**
```
Tarefa: PROJ-101
├─ Estimativa Original: 15h (nunca muda!)
├─ Sprint 1: Gasto 5h (ainda não terminou)
├─ Sprint 2 (atual):
│  ├─ Estimativa Restante: 10h (15h - 5h = o que falta)
│  └─ Tempo Gasto Neste Sprint: 10h
└─ Tempo Total: 15h (5h + 10h)

Para sua capacidade (planning deste sprint):
- Alocado: 10h (o que falta fazer)
- Disponível: 30h (40h - 10h)

Para sua performance (avaliação histórica):
- Estimativa: 15h (original, nunca muda)
- Gasto Total: 15h (5h + 10h de todos os sprints)
- Acurácia: 100% (perfeito! 15h estimadas = 15h gastas)
```

**O que acontece quando você termina depois:**
- Se você começa uma tarefa no Sprint 1 mas só termina no Sprint 2:
  - **Performance histórica:** Usa tempo total em todos os sprints (tempoGastoTotal)
  - **Capacidade do Sprint 2:** Usa estimativa restante e tempo gasto apenas no Sprint 2
  - O sistema **reconhece** que você já trabalhou em sprints anteriores!
  - Sua performance é avaliada pelo **tempo total**, não apenas do sprint atual

**Duas visões:**
1. **Capacidade do Sprint (planejamento):** Usa estimativa restante e tempo gasto NESTE sprint
2. **Performance Histórica (avaliação):** Usa estimativa original e tempo total em todos os sprints

## 🔢 Breakdown Detalhado do Cálculo

### Passo a Passo Completo:

**1. Qualidade (50% da Base)**
```
Quality Score = Nota de Teste Média × 20
Exemplo: Nota média 4.5 → 4.5 × 20 = 90 pontos
```

**2. Eficiência (50% da Base)**
```
Efficiency Score = % de tarefas eficientes × 100
Exemplo: 8 de 10 tarefas eficientes → 80%

Como avalia eficiência:
- Features: compara estimativa original vs tempo gasto total
- Bugs: verifica se horas gastas estão na zona da complexidade
```

**3. Base Score**
```
Base Score = (50% × Quality Score) + (50% × Efficiency Score)
Exemplo: (0.5 × 90) + (0.5 × 80) = 45 + 40 = 85 pontos
```

**4. Bônus de Complexidade (0-10)**
```
% Tarefas Complexas = (Tarefas nível 4-5) / Total
Bonus = % Tarefas Complexas × 10
Exemplo: 60% complexas → 0.6 × 10 = 6 pontos
```

**5. Bônus de Senioridade (0-15)**
```
Eficiência em Features Complexas = 
  (Altamente Eficientes × 1.0 + Moderadamente Eficientes × 0.5) / Total Complexas
Bonus = Eficiência × 15
Exemplo: 4 tarefas, 3 altas + 1 moderada
→ (3×1.0 + 1×0.5) / 4 = 0.875
→ 0.875 × 15 = 13 pontos
```

**6. Bônus de Auxílio (0-10)**
```
Escala progressiva baseada em horas de auxílio:
- 0.5h+ = 1 ponto
- 2h+ = 2 pontos
- 4h+ = 3 pontos
- 6h+ = 4 pontos
- 8h+ = 6 pontos
- 12h+ = 8 pontos
- 16h+ = 10 pontos
```

**7. Performance Score Final**
```
Performance Score = Base Score + Bonus Complexidade + Bonus Senioridade + Bonus Auxílio
Máximo: 135 pontos (100 base + 10 + 15 + 10)
```

## 🎯 Resumo Rápido

**Seu Performance Score é calculado assim:**

```
Base Score = (50% × Qualidade) + (50% × Eficiência)
Performance Score = Base Score + Bônus Complexidade + Bônus Senioridade + Bônus Auxílio
```

**Regras importantes:**
- ✅ Apenas tarefas **concluídas** contam (`teste`, `teste gap`, `compilar`, `concluído`)
- ✅ **Bugs** e **Features** são avaliados diferente (bugs são imprevisíveis!)
- ✅ Fazer **até 50% mais rápido** que estimado = sempre eficiente! 🚀
- ✅ **Bugs não contam** para bônus de senioridade (só features complexas)
- ✅ **Reuniões são neutras** - marque como "Reunião" em "Detalhes Ocultos"
- ✅ Sem **nota de teste** = assume nota 5 (perfeito!)
- ✅ **Worklog é obrigatório!** Sistema usa worklog, NUNCA a planilha
- ✅ **Tarefas que atravessam sprints:** usa tempo total de todos os sprints
- ✅ **Zonas para bugs:** "eficiente" (conta), "aceitável" (não conta), "ineficiente" (não conta)
- ✅ **Métricas informativas** (utilização, conclusão) não entram no score

## 💪 Lembre-se

✅ **O score é uma ferramenta de ajuda**, não de punição  
✅ **Use para melhorar**, não para se comparar  
✅ **Contexto importa** - cada sprint é diferente  
✅ **Converse com seu líder** se tiver dúvidas!  
✅ **Bugs são diferentes** - não se sinta mal se um bug demorou mais!  
✅ **Ajudar é reconhecido** - sempre marque tarefas de auxílio como "Auxilio"  

---

**Tudo vai dar certo!** 🚀 O importante é melhorar continuamente, não ser perfeito desde o começo.

