# Análise Híbrida com Worklog

## 📋 Visão Geral

A funcionalidade de **Análise Híbrida** permite calcular métricas de sprint de forma mais precisa, separando o tempo gasto em diferentes sprints. Isso resolve o problema de tarefas que atravessam múltiplos sprints, onde parte do trabalho foi feito em sprints anteriores.

## 🎯 Problema Resolvido

### Antes (Problema)
```
Tarefa: PROJ-101
├─ Estimativa Original: 15h
├─ Sprint 1: gastou 5h
├─ Sprint 2: gastou 10h
└─ Tempo Total Acumulado: 15h

❌ No Sprint 2, o sistema mostrava:
   - Alocação: 15h (mas só faltam 10h!)
   - Disponível: -15h do dev (incorreto!)
```

### Agora (Solução)
```
Tarefa: PROJ-101
├─ Estimativa Original: 15h
├─ Tempo Gasto Outros Sprints: 5h
├─ Estimativa Restante (Sprint 2): 10h
└─ Tempo Gasto no Sprint: 10h

✅ No Sprint 2, o sistema mostra:
   - Alocação: 10h (correto!)
   - Disponível: 30h do dev (40h - 10h)
   - Performance: 15h estimadas vs 15h gastas (100%)
```

## 🔧 Como Funciona

### Abordagem Híbrida

A solução usa uma **abordagem híbrida** que mantém duas visões:

1. **Capacidade do Sprint Atual** (para planejamento)
   - Usa `estimativaRestante` = quanto falta fazer NESTE sprint
   - Usa `tempoGastoNoSprint` = quanto foi gasto NESTE sprint

2. **Performance Histórica** (para análise)
   - Usa `estimativa` = estimativa original
   - Usa `tempoGastoTotal` = tempo total em todos os sprints

### Campos Adicionados

```typescript
interface TaskItem {
  // Campos originais
  estimativa: number;              // 15h - nunca muda
  tempoGasto: number;              // DEPRECATED
  
  // Novos campos híbridos
  estimativaRestante?: number;     // 10h - quanto falta
  tempoGastoNoSprint?: number;     // 10h - só deste sprint
  tempoGastoOutrosSprints?: number; // 5h - de sprints anteriores
  tempoGastoTotal?: number;        // 15h - acumulado total
}
```

## 📁 Estrutura do Worklog

O arquivo de worklog deve ter as seguintes colunas:

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| **ID da tarefa** | Chave ou ID da tarefa | PROJ-101 |
| **Responsável** | Nome do desenvolvedor | João Silva |
| **Tempo gasto** | Horas trabalhadas | 2h ou 7200 (segundos) |
| **Data** | Data do lançamento | 2025-10-15 |

### Exemplo de Worklog

```
ID da tarefa | Responsável  | Tempo gasto | Data
PROJ-101     | João Silva   | 2h         | 2025-10-15
PROJ-101     | João Silva   | 3h         | 2025-10-16
PROJ-101     | João Silva   | 5h         | 2025-10-22
PROJ-102     | Maria Santos | 4h         | 2025-10-23
```

## 🚀 Como Usar

### 1. Preparar os Arquivos

- **layout.xlsx**: Arquivo normal com todas as tarefas
- **worklog.xlsx**: Arquivo com registros detalhados de tempo (opcional)

### 2. Fazer Upload

Na tela inicial:

1. **Upload do Layout** (obrigatório)
   - Faça upload do arquivo de layout normal

2. **Upload do Worklog** (opcional)
   - Faça upload do arquivo de worklog
   - Se não fizer upload, usa o tempo do layout normalmente

3. **Definir Período do Sprint** (opcional)
   - Se enviou worklog, defina as datas de início e fim
   - Se não definir, usa a semana atual automaticamente

### 3. Visualizar Resultados

O sistema automaticamente:

✅ Separa o tempo entre sprints
✅ Calcula estimativa restante
✅ Ajusta a alocação de capacidade
✅ Mantém métricas de performance corretas

## 📊 Impacto nas Métricas

### Card do Desenvolvedor

```
┌─────────────────────────────────────────┐
│ João Silva                               │
├─────────────────────────────────────────┤
│ CAPACIDADE NESTE SPRINT                 │
│ 🎯 Alocado: 40h (tarefas restantes)     │ ← usa estimativaRestante
│ ⏱️  Gasto: 12h (neste sprint)           │ ← usa tempoGastoNoSprint
│ ✅ Disponível: 28h                       │
├─────────────────────────────────────────┤
│ PERFORMANCE (todas as tarefas)          │
│ 📈 Estimado: 80h (original)             │ ← usa estimativa
│ ⚡ Realizado: 85h (total histórico)     │ ← usa tempoGastoTotal
│ 🎯 Acurácia: -6.25%                     │
└─────────────────────────────────────────┘

ℹ️ Algumas tarefas tiveram tempo gasto em sprints anteriores
```

### Lista de Tarefas

```
PROJ-101 | Implementar login
├─ Estimativa: 10h (15h orig.)  ← mostra ambos!
├─ Gasto: 3h                     ← só deste sprint
│  +5h ant.                      ← tempo anterior
└─ Variação: -7h (-70%)          ← baseado na restante
```

## 🎨 Indicadores Visuais

- 🔵 **Azul**: Estimativa original (quando diferente da restante)
- 🟣 **Roxo**: Tempo gasto em sprints anteriores
- 🟢 **Verde**: Dentro do previsto
- 🟡 **Amarelo**: Próximo ao limite
- 🔴 **Vermelho**: Acima do estimado

## ⚙️ Configuração Técnica

### Arquivos Criados/Modificados

1. **Novos Arquivos**
   - `src/services/worklogParser.ts` - Parser para worklog
   - `src/services/hybridCalculations.ts` - Cálculos híbridos
   - `docs/WORKLOG_HYBRID_ANALYSIS.md` - Esta documentação

2. **Arquivos Modificados**
   - `src/types/index.ts` - Novos tipos
   - `src/store/useSprintStore.ts` - Gerenciamento de worklog
   - `src/services/analytics.ts` - Cálculos atualizados
   - `src/components/XlsUploader.tsx` - Dois uploads
   - `src/components/DeveloperCard.tsx` - Visualização
   - `src/components/TaskList.tsx` - Visualização

### Lógica de Fallback

O sistema funciona com ou sem worklog:

```typescript
// Se worklog disponível: usa valores híbridos
const tempoGasto = task.tempoGastoNoSprint ?? task.tempoGasto;
const estimativa = task.estimativaRestante ?? task.estimativa;

// Se worklog não disponível: usa valores originais (comportamento antigo)
```

## 🎓 Exemplos de Uso

### Cenário 1: Sprint Semanal

```
Sprint 4 (21-27 Out)
├─ Upload: layout.xlsx + worklog.xlsx
├─ Período: 2025-10-21 a 2025-10-27
└─ Resultado: Apenas tempo deste período é considerado
```

### Cenário 2: Sem Worklog

```
Sprint 4
├─ Upload: layout.xlsx
└─ Resultado: Comportamento normal (usa tempo do layout)
```

### Cenário 3: Worklog sem Período

```
Sprint 4
├─ Upload: layout.xlsx + worklog.xlsx
├─ Período: (não informado)
└─ Resultado: Usa semana atual automaticamente
```

## 🔍 Cálculo Detalhado

### Exemplo Completo

```typescript
// Dados de entrada
Tarefa: PROJ-101
├─ Estimativa Original: 15h
├─ Sprint do Layout: "Sprint 4"
└─ Worklogs:
    ├─ 2025-10-15: 2h (Sprint 3)
    ├─ 2025-10-16: 3h (Sprint 3)
    ├─ 2025-10-22: 5h (Sprint 4) ✓
    └─ 2025-10-23: 5h (Sprint 4) ✓

// Período do Sprint 4: 2025-10-21 a 2025-10-27

// Cálculo
tempoGastoOutrosSprints = 2h + 3h = 5h
tempoGastoNoSprint = 5h + 5h = 10h
tempoGastoTotal = 5h + 10h = 15h
estimativaRestante = 15h - 5h = 10h

// Resultado para o Dev
Alocação: 10h (estimativaRestante)
Gasto: 10h (tempoGastoNoSprint)
Disponível: 40h - 10h = 30h ✓

// Performance (histórico)
Estimado: 15h (original)
Gasto: 15h (total)
Acurácia: 0% (perfeito!)
```

## 📈 Benefícios

1. **Capacidade Correta**: Alocação reflete apenas o trabalho restante
2. **Performance Precisa**: Análise usa o histórico completo
3. **Alertas Melhores**: Riscos baseados no tempo real do sprint
4. **Transparência**: Visualização clara do tempo em outros sprints
5. **Flexibilidade**: Funciona com ou sem worklog

## ⚠️ Importante

- O worklog é **opcional** - se não enviado, usa comportamento antigo
- O período do sprint é **opcional** - se não definido, usa semana atual
- O arquivo de layout continua **obrigatório**
- IDs/chaves do worklog devem **corresponder** ao layout

## 🎉 Resultado Final

Agora você pode:

✅ Alocar corretamente os 40h semanais por dev
✅ Ver quanto falta fazer em cada tarefa
✅ Analisar performance real vs estimativas
✅ Identificar tarefas que atravessam sprints
✅ Tomar decisões baseadas em dados precisos

