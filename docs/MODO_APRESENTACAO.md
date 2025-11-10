## Modo Apresentação

Configuração para apresentar os dashboards em sequência automática, ideal para TVs e reuniões.

### Conceitos
- **Etapa (step)**: unidade do slideshow. Cada etapa aponta para uma aba (`view`) e, opcionalmente, para uma seção específica da aba Sprint (`section`).
- **Intervalo**: tempo padrão de exibição por etapa. Pode ser ajustado por etapa, mas por padrão todas usam o mesmo tempo.

### Como usar
1. Abra o dashboard e clique em “Apresentação” (ícone ▶).
2. Marque as sessões que deseja apresentar e defina o intervalo (padrão 60s).
3. Clique em “Salvar” e depois “Reproduzir” para iniciar.
4. A reprodução continua até você pausar. Você pode avançar para a próxima etapa com “Próximo”.

### Seções disponíveis
- Sprint
  - Resumo do Sprint (`summary`)
  - Por Feature (`byFeature`)
  - Por Cliente (`byClient`)
  - Desenvolvedores (`developers`)
- Outras abas (views)
  - `multiSprint` (Cross-Sprint)
  - `performance`
  - `evolution`
  - `quality`
  - `inconsistencies`
  - `backlog`

### Atalhos e parâmetros
- URL: adicionar `?presentation=1&interval=60000` para iniciar automaticamente com 60s por etapa.

### Dicas de apresentação
- Para TVs, utilize tema escuro e tela cheia do navegador.
- A altura dos gráficos é ampliada automaticamente durante o modo apresentação.

### Estrutura técnica (para devs)
- Estado global em `useSprintStore`:
  - `presentation: { isActive, isPlaying, intervalMs, steps, currentStepIndex }`
  - Ações: `startPresentation`, `stopPresentation`, `nextPresentationStep`, etc.
- Modal de configuração: `src/components/PresentationSettingsModal.tsx`.
- Integração no dashboard principal: `src/components/Dashboard.tsx`.
- Ajustes de layout para apresentação:
  - `SprintAnalysisDetails` aceita `focusSection`, `isPresentation` e `chartHeight`.
  - `AnalyticsChart` aceita `height` para gráficos altos.


