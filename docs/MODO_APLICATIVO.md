## Modo Aplicativo (Electron)

Execute o dashboard como um app desktop no Windows e gere um instalador quando precisar.

### Requisitos
- Node.js LTS e npm
- Dependências já configuradas no projeto: `electron`, `electron-builder`, `concurrently`, `wait-on`, `cross-env`

### Desenvolvimento (abrir como aplicativo)
1. Inicie o app desktop apontando para o dev server do Vite:

```bash
npm run app:dev
```

- Abre uma janela do Electron carregando `http://localhost:5173` assim que o Vite estiver pronto.
- Para rodar só no navegador (como antes): `npm run dev`.

### Build e instalador
1. Gere os artefatos web:
```bash
npm run build
```
2. Empacote o app para Windows (NSIS):
```bash
npm run app:dist
```

- Saída em `release/` (instalador `.exe` + pasta descompactada).

### Configurações chave
- `package.json`:
  - `main`: `electron/main.cjs`
  - Scripts: `app:dev`, `app:dist`
  - `build` (electron-builder): `appId`, `productName`, `win.target = nsis`, etc.
- Entrypoint Electron: `electron/main.cjs` (carrega `http://localhost:5173` em dev e `dist/index.html` no build).

### Problemas comuns
- Janela abre em branco no build:
  - Verifique se `npm run build` gerou `dist/` antes do `app:dist`.
  - Confirme o caminho `win.loadFile(path.join(__dirname, '../dist/index.html'))` no `electron/main.cjs`.
- Porta ocupada do Vite (5173):
  - Ajuste a URL em `app:dev` (scripts) e/ou a porta do Vite.
- Antivírus bloqueando instalador:
  - Assinatura de código recomendada em ambientes corporativos (não incluída neste projeto).

### Observações
- Este modo não altera o cálculo de métricas nem regras do domínio. É apenas um wrapper desktop para a UI atual.


