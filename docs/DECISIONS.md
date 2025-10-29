# 📝 Decisões de Arquitetura e Design

Este documento registra decisões importantes tomadas no desenvolvimento do sistema.

---

## 2025-10-29: Acurácia como Métrica Informativa

### Contexto
A métrica de "Acurácia de Estimativa" estava sendo tratada como responsabilidade individual do desenvolvedor, pesando 40% no score de performance. No entanto, no processo real da equipe:
- O **analista** é o responsável principal pela estimativa
- O **desenvolvedor** apenas contribui com input técnico

### Problema
Isso criava uma situação injusta onde o desenvolvedor era avaliado por algo que não controlava completamente.

### Decisão
1. **Remover acurácia do cálculo de performance score** (peso 0%)
2. **Manter acurácia visível no card como métrica informativa**
3. **Adicionar disclaimers claros** indicando que é responsabilidade da equipe/analista

### Nova Fórmula de Performance
```
Performance Score = 
  (50% × Qualidade) +
  (30% × Utilização) +
  (20% × Conclusão)
```

### Alternativas Consideradas

**Opção A: Remover acurácia completamente do card individual**
- ✅ Evita completamente má interpretação
- ❌ Perde informação útil para o desenvolvedor

**Opção B: Mover para aba "Análise de Equipe/Processo"**
- ✅ Contexto mais apropriado
- ❌ Requer mudanças significativas na UI
- ❌ Mais trabalho de implementação

**Opção C (ESCOLHIDA): Manter com disclaimers claros**
- ✅ Informação ainda acessível
- ✅ Disclaimers previnem má interpretação
- ✅ Menos mudanças necessárias
- ⚠️ Depende de leitura dos avisos

### Implementação
- Badge "Info" ao lado do título
- Texto explicativo: "Responsabilidade da equipe/analista"
- Disclaimer no topo do card
- Documentação atualizada

### Status dos Concluídos
Decisão também tomada sobre quais status considerar como "concluído pelo desenvolvedor":
- `teste`, `teste gap` - Dev entregou, liberou capacidade
- `compilar` - Pronto para deploy
- `concluído` / `concluido` - Finalizado (aceita ambos)

**Rationale:** Uma vez em teste, o dev liberou tempo. Se houver problemas, a métrica de **retrabalho** captura o impacto.

---

## Próximas Decisões Pendentes

### 1. Utilização no Performance Score
**Questão:** Deve "Utilização" fazer parte do score de performance?

**Argumentos Contra:**
- Utilização é um **input** (quantas horas), não **output** (o que entregou)
- Dev com 30h pode estar bloqueado (não é culpa dele)
- Frameworks modernos (DORA, SPACE) focam em outcomes

**Argumentos A Favor:**
- Indica engajamento e disponibilidade
- Ajuda a identificar subaproveitamento
- 30% de peso, não é dominante

**Decisão:** PENDENTE - Aguardando feedback do uso real

### 2. Análise de Contexto
**Questão:** Como normalizar métricas por contexto?

**Necessidades:**
- Separar módulo legado vs novo
- Identificar trabalho de manutenção vs features
- Comparar devs em contextos similares

**Decisão:** BACKLOG - Feature futura

---

**Última Atualização:** 29 de Outubro de 2025

