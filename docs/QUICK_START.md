# Guia de Início Rápido

## Instalação e Execução

### 1. Instale as dependências
```bash
npm install
```

### 2. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

O servidor iniciará em `http://localhost:5173`

### 3. Abra no navegador
Acesse `http://localhost:5173` no seu navegador preferido.

## Primeiro Uso

### Passo 1: Preparar seus dados
1. Exporte os dados do seu sprint do Jira/Azure DevOps como Excel (.xlsx)
2. Certifique-se de que o arquivo contém as colunas necessárias (veja abaixo)

### Passo 2: Upload do Excel
1. Na tela inicial, arraste e solte seu arquivo Excel (.xlsx ou .xls) na área indicada
2. Ou clique para selecionar o arquivo do seu computador
3. Aguarde o processamento (geralmente instantâneo)

### Passo 3: Explorar o Dashboard
1. O sistema selecionará automaticamente o primeiro sprint disponível
2. Explore as métricas, alertas e totalizadores
3. Clique em um desenvolvedor para ver suas tarefas específicas

## Colunas Obrigatórias do Excel

```
Chave da item          # Ex: PROJ-101
ID da item             # ID numérico
Resumo                 # Descrição da tarefa
Tempo gasto            # Ex: "2h 30m" ou "3h" ou "45m"
Sprint                 # Nome do sprint
Criado                 # Data de criação
Estimativa original    # Ex: "4h" ou "2h 30m"
Responsável            # Nome do responsável
ID do responsável      # ID do responsável
Status                 # Status atual da tarefa
Campo personalizado (Modulo)        # Módulo
Campo personalizado (Feature)       # Feature
Categorias             # Cliente(s)
Campo personalizado (Detalhes Ocultos)  # Detalhes adicionais
```

## Exemplo de Dados

Veja o arquivo `project/out25-sem4.xlsx` para um exemplo completo com dados reais.

## Funcionalidades Principais

### 1. Visão Geral do Sprint
- Total de tarefas e horas
- Progresso de conclusão
- Status por tipo (bugs, tarefas, histórias)

### 2. Desenvolvedores
- Horas alocadas vs disponíveis
- Estimado vs gasto
- Indicador de risco por utilização
- Drill-down de tarefas

### 3. Alertas
- Tarefas acima do tempo estimado
- Desenvolvedores sobrecarregados
- Tarefas sem progresso

### 4. Totalizadores
- Por Feature
- Por Módulo
- Por Cliente
- Por Tipo

### 5. Lista de Tarefas
- Busca por texto livre
- Filtros por múltiplos critérios
- Visualização detalhada de métricas

### 6. Análise Multi-Sprint
- Backlog sem sprint
- Distribuição por sprint
- Alocação cross-sprint

## Atalhos e Dicas

### Drill-Down Rápido
Clique em qualquer card de desenvolvedor para ver apenas suas tarefas na lista abaixo.

### Limpar Filtros
Use o botão "Limpar" na lista de tarefas para resetar todos os filtros de uma vez.

### Alternar Visualizações
Use o botão "Ver Multi-Sprint" / "Ver Sprint Ativo" para alternar entre as visualizações.

### Carregar Novos Dados
Clique em "Limpar Dados" no topo da página para fazer upload de um novo arquivo Excel.

## Interpretando os Indicadores

### Cores de Risco (Desenvolvedores)
- 🟢 **Verde**: < 70% utilização - Capacidade disponível
- 🟡 **Amarelo**: 70-89% utilização - Bem alocado
- 🔴 **Vermelho**: ≥ 90% utilização - Sobrecarregado

### Badges de Status
- **Concluído**: Verde - Tarefa finalizada
- **Em Progresso**: Cinza - Tarefa sendo trabalhada

### Variação de Tempo
- 🟢 **Verde/Negativo**: Abaixo da estimativa (economia de tempo)
- ⚫ **Zero**: Exatamente na estimativa
- 🔴 **Vermelho/Positivo**: Acima da estimativa (estouro)

## Status Considerados "Concluídos"

Para cálculo de horas disponíveis, estes status são considerados concluídos:
- concluído
- compilar
- teste
- teste gap

Tarefas nesses status não contam nas "horas disponíveis".

## Troubleshooting

### Erro ao carregar Excel
- Verifique se todas as colunas obrigatórias estão presentes
- Certifique-se de que o arquivo está em formato Excel (.xlsx ou .xls)
- Verifique se a primeira aba contém os dados

### Dados não aparecem
- Verifique se o Excel tem pelo menos uma linha de dados (além do cabeçalho)
- Confirme que os nomes das colunas estão exatamente como esperado

### Métricas incorretas
- Verifique o formato do tempo gasto (deve ser "Xh Ym" ou "Xh" ou "Ym")
- Confirme que os status estão escritos corretamente
- Verifique se o campo "Detalhes Ocultos" está preenchido corretamente para dúvidas

## Próximos Passos

Depois de dominar o básico:
1. Explore os filtros avançados na lista de tarefas
2. Use a análise multi-sprint para planejamento de longo prazo
3. Monitore os alertas regularmente para ação proativa
4. Compare métricas entre sprints para identificar tendências

## Suporte

Para mais informações, consulte:
- `README.md` - Documentação completa
- `docs/ADDITIONAL_FEATURES.md` - Features avançadas e sugestões
- `docs/XLS_FORMAT_NOTES.md` - Detalhes sobre formato do Excel
- Código fonte em `src/` - Implementação detalhada

