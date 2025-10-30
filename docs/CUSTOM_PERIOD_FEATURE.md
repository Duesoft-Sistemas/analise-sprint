# 📅 Período Personalizado - Nova Funcionalidade

## 🎯 Visão Geral

A funcionalidade de **Período Personalizado** permite selecionar múltiplos sprints para análise agregada de performance, facilitando a avaliação de crescimento de desenvolvedores ao longo do tempo.

---

## ✨ Funcionalidades Implementadas

### 1. **Seleção de Múltiplos Sprints**
- ✅ Interface visual com checkboxes para seleção de sprints
- ✅ Botões "Selecionar Todos" e "Limpar" para facilitar a seleção
- ✅ Contador de sprints selecionados em tempo real
- ✅ Visualização clara dos sprints escolhidos

### 2. **Nomeação de Períodos**
- ✅ Campo opcional para dar nome ao período (ex: "Q1 2025", "Primeiro Trimestre")
- ✅ Nome padrão automático se não especificado
- ✅ Nome do período exibido nos cards de performance

### 3. **Períodos Favoritos** 💾
- ✅ Salvar períodos frequentemente usados
- ✅ Carregar períodos salvos com um clique
- ✅ Excluir períodos salvos
- ✅ Persistência em localStorage (dados mantidos entre sessões)
- ✅ Dropdown visual para gerenciar períodos salvos

### 4. **Análise Agregada**
- ✅ Métricas calculadas agregando dados dos sprints selecionados
- ✅ Performance Score médio do período
- ✅ Acurácia, Qualidade e Utilização médias
- ✅ Breakdown sprint-por-sprint dentro do período
- ✅ Performance por complexidade e tipo de tarefa

---

## 🚀 Como Usar

### **Passo 1: Acessar o Modo Período Personalizado**
1. Vá para a aba **"Performance"** no dashboard
2. Clique no botão **"Período Personalizado"** (terceiro botão)

### **Passo 2: Selecionar Sprints**
1. Clique em **"Selecionar Sprints (0)"**
2. Marque os checkboxes dos sprints desejados
3. Opcionalmente, dê um nome ao período
4. Clique em **"Aplicar"**

### **Passo 3: Analisar Métricas**
- Veja as métricas agregadas de todos os desenvolvedores
- Compare performance entre desenvolvedores no período escolhido
- Analise breakdown sprint-por-sprint

### **Passo 4: Salvar Período (Opcional)**
1. Com sprints selecionados, clique no botão **💾** (salvar)
2. O período será salvo para uso futuro
3. Acesse períodos salvos via botão **"Carregar Período"**

---

## 💡 Casos de Uso

### **1. Avaliação Trimestral**
```
Selecionar: Sprint 10, 11, 12, 13, 14, 15
Nome: "Q1 2025"
Uso: Avaliar crescimento do desenvolvedor no primeiro trimestre
```

### **2. Comparação Antes/Depois de Treinamento**
```
Período A: Sprints 1-5 (antes do treinamento)
Período B: Sprints 6-10 (depois do treinamento)
Comparação manual das métricas para validar impacto
```

### **3. Análise Semestral**
```
Selecionar: Sprints de Janeiro a Junho
Nome: "1º Semestre 2025"
Uso: Relatório semestral de performance
```

### **4. Período Específico de Projeto**
```
Selecionar: Sprints 15, 16, 17 (sprints do Projeto X)
Nome: "Projeto X"
Uso: Avaliar performance em contexto específico
```

---

## 📊 Métricas Disponíveis

### **Métricas Agregadas:**
- **Performance Score Médio**: Média ponderada do período
- **Acurácia Média**: % de tarefas dentro de ±20% da estimativa
- **Qualidade Média**: Baseada na taxa de retrabalho
- **Utilização Média**: Horas trabalhadas / 40h por sprint
- **Total de Horas**: Somatório de horas do período
- **Total de Tarefas**: Tarefas concluídas no período

### **Breakdown Detalhado:**
- Performance sprint-por-sprint
- Distribuição por complexidade
- Distribuição por tipo de tarefa
- Tendências dentro do período

---

## 🔧 Detalhes Técnicos

### **Implementação:**

**Novos Tipos (`src/types/index.ts`):**
```typescript
interface CustomPeriodMetrics {
  developerId: string;
  developerName: string;
  periodName: string;
  selectedSprints: string[];
  totalSprints: number;
  totalHoursWorked: number;
  totalTasksCompleted: number;
  avgPerformanceScore: number;
  avgAccuracyRate: number;
  avgQualityScore: number;
  // ... outros campos
}
```

**Nova Função (`src/services/performanceAnalytics.ts`):**
```typescript
calculateCustomPeriodPerformance(
  tasks: TaskItem[],
  developerId: string,
  developerName: string,
  selectedSprints: string[],
  periodName?: string
): CustomPeriodMetrics
```

**Componente Atualizado (`src/components/PerformanceDashboard.tsx`):**
- Novo ViewMode: `'customPeriod'`
- Interface de seleção múltipla com checkboxes
- Gerenciamento de períodos favoritos
- Cálculo de métricas agregadas

---

## 📈 Cálculo de Métricas

### **Agregação:**
As métricas são calculadas da seguinte forma:

1. **Cada sprint selecionado** → calcula `SprintPerformanceMetrics`
2. **Agregação** → combina métricas de todos os sprints:
   - **Somas**: Horas, tarefas
   - **Médias**: Performance score, acurácia, qualidade
   - **Breakdown**: Mantém detalhamento por sprint

### **Fórmulas:**
```
Performance Score Médio = Σ(Performance Score por Sprint) / Nº Sprints
Acurácia Média = Σ(Acurácia por Sprint) / Nº Sprints
Total Horas = Σ(Horas de todos os sprints)
Utilização Média = (Total Horas / (40h × Nº Sprints)) × 100
```

---

## 🎨 Interface

### **Componentes Visuais:**

1. **Botão "Período Personalizado"** (azul com ícone de filtro)
2. **Botão "Selecionar Sprints"** (contador de sprints selecionados)
3. **Botão "Carregar Período"** (roxo, com contador de períodos salvos)
4. **Botão "Salvar"** (💾 verde)
5. **Painel de Seleção** (modal com checkboxes e input de nome)
6. **Dropdown de Períodos Salvos** (lista com hover e botão de exclusão)

### **Estados Visuais:**
- **Sem sprints selecionados**: Botões desabilitados/ocultos
- **Com sprints selecionados**: Mostra contador e permite salvar
- **Períodos salvos disponíveis**: Botão "Carregar Período" aparece
- **Painel aberto**: Fundo escuro, checkboxes coloridos

---

## 🔐 Persistência de Dados

**Método**: `localStorage`

**Chave**: `savedPerformancePeriods`

**Formato**:
```json
[
  {
    "name": "Q1 2025",
    "sprints": ["Sprint 10", "Sprint 11", "Sprint 12"]
  },
  {
    "name": "Projeto X",
    "sprints": ["Sprint 15", "Sprint 16"]
  }
]
```

**Características:**
- ✅ Persiste entre sessões
- ✅ Específico por navegador/máquina
- ✅ Sem limite de períodos salvos
- ✅ Fácil de limpar (limpar dados do navegador)

---

## 🚦 Validações

### **Seleção de Sprints:**
- ❌ Não permite aplicar sem sprints selecionados
- ✅ Permite selecionar todos os sprints
- ✅ Permite selecionar apenas 1 sprint
- ✅ Suporta qualquer combinação de sprints

### **Nome do Período:**
- ⚠️ Opcional (gera nome padrão se vazio)
- ✅ Aceita qualquer texto
- ✅ Trim automático (remove espaços extras)

### **Períodos Salvos:**
- ✅ Não duplica automaticamente
- ✅ Permite salvar mesmo período com nomes diferentes
- ✅ Exclusão requer confirmação implícita (botão X no hover)

---

## 🎯 Próximos Passos Sugeridos

### **Fase 2 - Comparador de Períodos** (conforme planejamento original)
Implementar comparação lado-a-lado:
```
┌─────────────────┬─────────────────┐
│  Q1 2025        │  Q2 2025        │
│  Score: 75      │  Score: 82  📈  │
│  Acurácia: 70%  │  Acurácia: 78%  │
└─────────────────┴─────────────────┘
```

### **Fase 3 - Dashboard de Evolução** (conforme planejamento original)
- Gráficos de linha mostrando evolução
- Taxa de crescimento automática
- Metas e marcos de conquista

---

## 🐛 Troubleshooting

### **Períodos salvos não aparecem:**
- Verificar console do navegador
- Limpar localStorage: `localStorage.removeItem('savedPerformancePeriods')`

### **Métricas parecem incorretas:**
- Verificar se os sprints selecionados têm dados
- Confirmar que os desenvolvedores têm tarefas nos sprints selecionados
- Console do navegador mostrará logs de debug

### **Interface não responde:**
- Verificar se há erros no console
- Recarregar a página
- Limpar cache do navegador

---

## 📝 Notas de Desenvolvimento

### **Arquivos Modificados:**
1. `src/types/index.ts` - Novo tipo `CustomPeriodMetrics`
2. `src/services/performanceAnalytics.ts` - Nova função `calculateCustomPeriodPerformance`
3. `src/components/PerformanceDashboard.tsx` - Interface e lógica completa

### **Compatibilidade:**
- ✅ Compatível com todos os modos existentes (Sprint, Todos os Sprints)
- ✅ Não quebra funcionalidades anteriores
- ✅ Responsivo (mobile-friendly)
- ✅ Dark mode suportado

### **Performance:**
- ⚡ Cálculos otimizados com `useMemo`
- ⚡ Re-renderização mínima
- ⚡ localStorage assíncrono não bloqueia UI

---

## ✅ Checklist de Implementação

- [x] Tipos TypeScript criados
- [x] Função de cálculo implementada
- [x] Interface de seleção múltipla
- [x] Campo de nome do período
- [x] Botões de ação (selecionar, limpar, aplicar)
- [x] Salvamento em localStorage
- [x] Carregamento de períodos salvos
- [x] Exclusão de períodos salvos
- [x] Integração com cards de performance
- [x] Summary stats para período customizado
- [x] Responsividade mobile
- [x] Dark mode
- [x] Validações de input
- [x] Sem erros de linting
- [x] Documentação completa

---

**Versão:** 1.0  
**Data:** Outubro 2025  
**Implementado por:** AI Assistant  
**Documento:** Custom Period Feature

