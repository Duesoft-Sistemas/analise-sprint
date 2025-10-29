Projeto

Primeira fase: dentro do sprint ativo (eu posso informar qual é)
>> quantas horas estão alocadas para cada dev no total?
>> quantas horas estão disponíveis? levando em consideração que os status seriam diferentes de: concluído, compilar, teste, teste gap.
>> totalizador por tipo: bugs, tarefas, histórias. Para os bugs, quero uma divisão de totalizador, para quando o campo "detalhes ocultos" seja diferente de "DuvidaOculta", e os que forem iguais, pois duvidas ocultas não são bugs reais.
>> totalizador por feature
>> totalizador por módulo
>> totalizador por cliente
>> quero para cada dev ter uma análise de horas estimadas x horas realizadas, no total, e se quiser detalhar, posso clicar e detalhar as tarefas.
>> lista de tickets, filtrando por: responsável, feature, modulo, categoria (que é o cliente)

A ideia é que eu preciso ver como está o sprint, o que cada um está fazendo, quanto tempo já gastou, quanto tempo ainda tem disponível. Também quero saber se devo ficar em alerta se o dev vai conseguir cumprir as entregas, de acordo com o tempo gasto, o quanto falta da tarefa e o tempo restante; o sprint é semanal. Pode ser que o tempo gasto fique maior que a estimativa, então temos que ir considerando o tempo gasto atual.

Segunda fase: fora do sprint
>> total de tarefas em backlog
>> total alocado em cada sprint aberto
>> quantas horas estão alocadas para cada dev no total, em outros sprints
>> quantas horas estão alocadas para cada cliente (categoria) em outros sprints


Os dados vão vir de um CSV com a seguinte estrutura: 
Chave da item,ID da item,Resumo,Tempo gasto,Sprint,Sprint,Sprint,Criado,Estimativa original,ResponsÃ¡vel,ID do responsÃ¡vel,Status,Campo personalizado (Modulo),Campo personalizado (Feature),Categorias,Categorias,Campo personalizado (Detalhes Ocultos)
