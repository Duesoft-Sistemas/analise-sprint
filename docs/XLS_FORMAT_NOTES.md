# Notas sobre Formato do Excel

## Formato Detectado no seu arquivo Excel

Analisando o arquivo `project/out25-sem4.xlsx`, o sistema agora importa diretamente arquivos Excel sem necessidade de conversão.

### Formato Suportado

O sistema aceita arquivos Excel (.xlsx e .xls) com as seguintes características:

1. **Formato de Tempo**: O sistema aceita diversos formatos de tempo:
   - **Formato numérico em segundos** (recomendado): 7200, 14400, 3600
     - 7200 segundos = 2 horas
     - 14400 segundos = 4 horas
     - 3600 segundos = 1 hora
   - Formato texto: "2h", "2h 30m", "45m"
   - O parser converte automaticamente todos os formatos para horas

2. **Primeira Planilha**: O sistema lê automaticamente a primeira aba do arquivo Excel

3. **Encoding**: Sistema robusto que trata problemas de encoding
   - ✅ Detecta e corrige automaticamente caracteres com encoding UTF-8 mal interpretado
   - ✅ Aceita variações nos nomes das colunas (ex: "Responsável" ou "ResponsÃ¡vel")
   - ✅ Normaliza todo o conteúdo dos dados para exibição correta

### Tratamento Automático de Encoding

O sistema implementa correção automática de caracteres especiais:

- **Nomes de Colunas**: Aceita múltiplas variações
  - "Responsável", "ResponsÃ¡vel", "Responsavel"
  - "Módulo", "MÃ³dulo", "Modulo"
  
- **Conteúdo dos Dados**: Normalização automática
  - "ResponsÃ¡vel" → "Responsável"
  - "DescriÃ§Ã£o" → "Descrição"
  - Todos os campos de texto são corrigidos automaticamente

## Colunas Esperadas

O arquivo Excel deve conter as seguintes colunas (na primeira linha):

- **Tipo de item**: Tipo da tarefa (ex: "Bug", "Tarefa", "História") - *Nova coluna obrigatória*
- **Chave da item**: Identificador da tarefa (ex: PROJ-101)
- **ID da item**: ID numérico
- **Resumo**: Descrição da tarefa
- **Tempo gasto**: Tempo trabalhado em segundos (ex: 7200 = 2h) ou formato texto (ex: "2h 30m")
- **Sprint**: Nome do sprint
- **Criado**: Data de criação
- **Estimativa original**: Tempo estimado em segundos (ex: 14400 = 4h) ou formato texto (ex: "4h")
- **Responsável**: Nome do desenvolvedor
- **ID do responsável**: ID do desenvolvedor
- **Status**: Status atual (ex: "Em progresso", "Concluído")
- **Campo personalizado (Modulo)**: Módulo da aplicação
- **Campo personalizado (Feature)**: Feature relacionada
- **Categorias**: Cliente(s) relacionados
- **Campo personalizado (Detalhes Ocultos)**: Informações adicionais
- **Campo personalizado (Retrabalho)**: Indica se é retrabalho (valores: "Sim", "Não", "Yes", "No", "S", "N")
- **Campo personalizado (Complexidade)**: Nível de complexidade da tarefa (valores: 1 a 5)

### Valores Aceitos para "Tipo de item"

- **Bug**: Para bugs e defeitos
- **Tarefa** (ou "Task"): Para tarefas gerais
- **História** (ou "Historia" ou "Story"): Para histórias de usuário
- **Outro**: Para qualquer outro tipo não categorizado

**Nota**: Se a coluna "Tipo de item" não estiver presente no arquivo, o sistema tentará determinar o tipo automaticamente baseado no conteúdo da "Chave da item" e "Resumo" (para compatibilidade com arquivos antigos).

### Valores para "Retrabalho"

O campo **Retrabalho** indica se a tarefa é um retrabalho de algo já feito anteriormente. Valores aceitos:
- **Sim**: "Sim", "Yes", "S", "Y", "True" (case-insensitive)
- **Não**: "Não", "No", "N", "" (vazio), ou qualquer outro valor

**Nota**: Este campo é opcional. Se não estiver presente, será considerado como "Não" por padrão.

### Valores para "Complexidade"

O campo **Complexidade** indica o nível de complexidade técnica da tarefa em uma escala de 1 a 5:
- **1**: Complexidade muito baixa (tarefas simples, rápidas)
- **2**: Complexidade baixa (tarefas diretas com poucas dependências)
- **3**: Complexidade média (tarefas que exigem análise moderada)
- **4**: Complexidade alta (tarefas complexas com múltiplas dependências)
- **5**: Complexidade muito alta (tarefas críticas e altamente complexas)

**Nota**: Se não estiver presente ou for inválido, será considerado como 1 (complexidade baixa) por padrão.

### Como os Novos Campos são Usados

1. **Na Lista de Tarefas**: 
   - A complexidade é exibida como um badge colorido (verde para 1-2, amarelo para 3, vermelho para 4-5)
   - O retrabalho é destacado com um badge laranja quando "Sim"

2. **No Card do Desenvolvedor**:
   - Mostra a **Distribuição por Complexidade**: um gráfico de barras horizontais com a quantidade e percentual de tarefas em cada nível de complexidade (1 a 5)
   - Permite identificar rapidamente se um desenvolvedor está com muitas tarefas de alta complexidade

## Exportando do Jira/Azure DevOps

### Exportação do Jira
1. Vá para sua board/filtro
2. Clique em "Exportar" → "Excel"
3. Selecione as colunas necessárias
4. Faça o download do arquivo .xlsx

### Exportação do Azure DevOps
1. Abra sua query
2. Clique em "Export" → "Export to Excel"
3. Salve o arquivo .xlsx

## Vantagens do Formato Excel

- ✅ Sem problemas de encoding
- ✅ Preserva formatação de dados
- ✅ Aceita múltiplos formatos de tempo
- ✅ Mais fácil de exportar de ferramentas
- ✅ Sem necessidade de conversão

## Testando com Dados de Exemplo

Para testar imediatamente, use o arquivo `project/out25-sem4.xlsx` incluído no projeto.

