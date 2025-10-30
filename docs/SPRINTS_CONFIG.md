# 📅 Configuração de Sprints - Guia Completo

## 🎯 Visão Geral

A partir desta versão, o sistema suporta **múltiplos sprints** com análise híbrida precisa! Agora você carrega uma planilha com os períodos de cada sprint, e o sistema automaticamente usa o período correto para calcular as métricas.

## 📋 Formato da Planilha de Sprints

### Estrutura Obrigatória

A planilha `sprints.xlsx` deve ter **3 colunas**:

| Sprint | Data Início | Data Fim |
|--------|-------------|----------|
| OUT25 - Semana 4 | 28/10/2025 | 01/11/2025 |
| NOV25 - Semana 1 | 04/11/2025 | 08/11/2025 |
| NOV25 - Semana 2 | 11/11/2025 | 15/11/2025 |
| NOV25 - Semana 3 | 18/11/2025 | 22/11/2025 |

### Colunas Aceitas

O sistema reconhece automaticamente várias variações de nomes:

- **Sprint**: `Sprint`, `sprint`, `Nome do Sprint`, `Sprint Name`, `ID`
- **Data Início**: `Data Início`, `Data Inicio`, `Start Date`, `Data inicial`, `Início`
- **Data Fim**: `Data Fim`, `End Date`, `Data final`, `Fim`

### Formatos de Data Aceitos

✅ **DD/MM/YYYY** - Formato brasileiro (recomendado)
```
28/10/2025
```

✅ **YYYY-MM-DD** - Formato ISO
```
2025-10-28
```

✅ **DD-MM-YYYY** - Formato alternativo
```
28-10-2025
```

## 🚀 Como Usar

### Passo 1: Criar a Planilha

1. Abra o Excel
2. Crie uma nova planilha
3. Adicione as colunas: `Sprint`, `Data Início`, `Data Fim`
4. Preencha com os dados de cada sprint
5. Salve como `sprints.xlsx`

### Passo 2: Carregar no Sistema

1. Acesse o sistema
2. Na seção **"1. Configuração de Sprints"**
3. Arraste o arquivo `sprints.xlsx` ou clique para selecionar
4. Aguarde o processamento

### Passo 3: Carregar Worklog e Layout

Agora que os sprints estão configurados:

1. Carregue o **Worklog** (opcional - para análise detalhada)
2. Carregue o **Layout** (obrigatório - tarefas do sprint)

### Passo 4: Visualizar Análise

- O sistema automaticamente usa o período correto de cada sprint
- A análise híbrida funciona perfeitamente para todos os sprints
- Cada sprint mostra apenas o tempo gasto no seu período específico

## 📊 Exemplo Completo

### Planilha sprints.xlsx

```
Sprint             | Data Início | Data Fim
OUT25 - Semana 4   | 28/10/2025  | 01/11/2025
NOV25 - Semana 1   | 04/11/2025  | 08/11/2025
NOV25 - Semana 2   | 11/11/2025  | 15/11/2025
```

### Layout.xlsx (exemplo)

```
Chave    | Sprint           | Estimativa | ...
DM-2019  | OUT25 - Semana 4 | 5h         | ...
DM-2020  | NOV25 - Semana 1 | 8h         | ...
DM-2021  | NOV25 - Semana 1 | 3h         | ...
```

### Worklog.xlsx (exemplo)

```
ID da tarefa | Responsável  | Tempo gasto | Data
DM-2019      | Paulo Anjos  | 3600        | 29/10/2025
DM-2019      | Paulo Anjos  | 7200        | 30/10/2025
DM-2020      | Maria Silva  | 3600        | 05/11/2025
```

## ✨ Vantagens

### ✅ Análise Precisa
- Cada sprint usa seu período correto
- Não mistura dados de sprints diferentes
- Análise híbrida funciona em múltiplos sprints

### ✅ Flexibilidade
- Adicione quantos sprints quiser
- Períodos irregulares são suportados (feriados, etc)
- Fácil de manter e atualizar

### ✅ Automatização
- Sistema detecta automaticamente os períodos
- Cálculos ajustados para cada sprint
- Sem configuração manual de datas

## 🎯 Resultado no Dashboard

Após carregar a planilha de sprints, você verá:

```
╔════════════════════════════════════╗
║ 📅 CONFIGURAÇÃO DE SPRINTS         ║
║                                    ║
║ sprints.xlsx                       ║
║ 3 sprints configurados             ║
║                                    ║
║ 🗓️ Atual: 04 de nov. a 08 de nov. ║
╚════════════════════════════════════╝
```

## ⚠️ Problemas Comuns

### ❌ "Nenhum sprint válido encontrado"

**Causa**: Colunas com nomes diferentes ou vazias

**Solução**: Verifique se as colunas são `Sprint`, `Data Início`, `Data Fim`

### ❌ Datas incorretas

**Causa**: Formato de data não reconhecido

**Solução**: Use DD/MM/YYYY (ex: 28/10/2025)

### ❌ Sprints não aparecem

**Causa**: Nome do sprint na planilha diferente do layout

**Solução**: O nome na coluna `Sprint` deve ser **exatamente igual** ao nome no layout.xlsx

## 📝 Template

Baixe um template pronto:

```excel
Sprint           | Data Início | Data Fim
----------------|-------------|------------
[Nome do Sprint]| DD/MM/AAAA  | DD/MM/AAAA
```

## 🔗 Integração com Worklog

O worklog agora é automaticamente filtrado por período:

- **DM-2019** no sprint `OUT25 - Semana 4`:
  - Tempo entre 28/10 e 01/11 → conta para este sprint
  - Tempo fora desse período → "outros sprints"

- **DM-2020** no sprint `NOV25 - Semana 1`:
  - Tempo entre 04/11 e 08/11 → conta para este sprint
  - Tempo fora desse período → "outros sprints"

## 💡 Dicas

1. **Mantenha nomes consistentes**: Use o mesmo padrão de nome em todas as planilhas
2. **Documente períodos**: Salve a planilha para referência futura
3. **Atualize conforme necessário**: Você pode substituir a planilha a qualquer momento
4. **Períodos sem sobreposição**: Evite sprints com períodos que se sobrepõem

## 🎓 Próximos Passos

Agora que você configurou os sprints:

1. ✅ Explore a **Análise Híbrida** com múltiplos sprints
2. ✅ Use o **Dashboard de Performance** para ver tendências
3. ✅ Compare métricas entre diferentes sprints

---

**Dúvidas?** Consulte também:
- [QUICK_START.md](./QUICK_START.md) - Guia de início rápido
- [WORKLOG_HYBRID_ANALYSIS.md](./WORKLOG_HYBRID_ANALYSIS.md) - Análise híbrida detalhada
- [PERFORMANCE_QUICK_START.md](./PERFORMANCE_QUICK_START.md) - Análise de performance

