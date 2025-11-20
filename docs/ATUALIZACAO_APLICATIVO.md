# 🔄 Guia de Atualização do Aplicativo

Este documento explica como atualizar o aplicativo quando uma nova versão estiver disponível.

## 📋 Opções de Atualização

### 1. **Atualização Manual (Recomendada para uso interno)**

A forma mais simples de atualizar é reinstalar o aplicativo por cima da versão anterior.

#### Como funciona:
- O instalador NSIS detecta automaticamente se já existe uma instalação anterior
- Ao executar o novo instalador, ele substitui os arquivos antigos
- **Não é necessário desinstalar** a versão anterior

#### Passos para atualizar:
1. **Gerar nova versão:**
   ```bash
   # Atualize a versão no package.json (ex: de 0.1.0 para 0.1.1)
   # Depois execute:
   npm run app:dist
   ```

2. **Distribuir o novo instalador:**
   - O arquivo `.exe` estará em `release/`
   - Envie o novo instalador para os usuários

3. **Instalar a nova versão:**
   - Usuários executam o novo instalador
   - O instalador detecta a versão anterior e atualiza automaticamente
   - Dados e configurações são preservados

#### Vantagens:
- ✅ Simples e direto
- ✅ Não requer servidor ou infraestrutura
- ✅ Funciona offline
- ✅ Ideal para ambientes internos/corporativos

#### Desvantagens:
- ❌ Usuário precisa baixar e executar manualmente
- ❌ Não há notificação automática de novas versões

---

### 2. **Atualização Automática (Opcional - Requer servidor)**

Para atualizações automáticas, é necessário configurar um servidor que hospede as atualizações.

#### Requisitos:
- Servidor web (HTTP/HTTPS) para hospedar atualizações
- Configuração do `electron-updater`
- Endpoint que forneça informações sobre a versão mais recente

#### Como implementar (futuro):
1. Instalar `electron-updater`:
   ```bash
   npm install electron-updater
   ```

2. Configurar no `package.json`:
   ```json
   "build": {
     "publish": {
       "provider": "generic",
       "url": "https://seu-servidor.com/updates/"
     }
   }
   ```

3. Adicionar código de verificação no `electron/main.cjs`

#### Vantagens:
- ✅ Atualização automática sem intervenção do usuário
- ✅ Notificações de novas versões
- ✅ Experiência mais fluida

#### Desvantagens:
- ❌ Requer servidor e infraestrutura
- ❌ Mais complexo de configurar
- ❌ Pode precisar de certificados SSL

---

## 🔢 Controle de Versão

### Como atualizar a versão:

1. **Edite o `package.json`:**
   ```json
   {
     "version": "0.1.1"  // Incremente aqui
   }
   ```

2. **Siga a convenção SemVer:**
   - **MAJOR** (1.0.0): Mudanças incompatíveis
   - **MINOR** (0.1.0): Novas funcionalidades compatíveis
   - **PATCH** (0.0.1): Correções de bugs

3. **Gere o novo build:**
   ```bash
   npm run app:dist
   ```

### Verificar versão instalada:

A versão atual aparece no título da janela do aplicativo: `Análise de Sprint v0.1.0`

---

## 📝 Checklist para Nova Versão

Antes de distribuir uma nova versão:

- [ ] Atualizar `version` no `package.json`
- [ ] Testar o build localmente (`npm run app:dev`)
- [ ] Gerar o executável (`npm run app:dist`)
- [ ] Testar a instalação em máquina limpa (se possível)
- [ ] Verificar se a atualização sobre versão anterior funciona
- [ ] Documentar mudanças/changelog (opcional)
- [ ] Distribuir o novo instalador para os usuários

---

## 🛠️ Troubleshooting

### Problema: Instalador não detecta versão anterior

**Solução:**
- Verifique se o `appId` no `package.json` é o mesmo: `com.analise.sprint`
- Certifique-se de que está instalando no mesmo diretório

### Problema: Dados perdidos após atualização

**Solução:**
- Dados do aplicativo são armazenados separadamente do executável
- Verifique a pasta de dados do usuário (geralmente em `%APPDATA%\analise-sprint`)

### Problema: Antivírus bloqueia atualização

**Solução:**
- Adicione exceção no antivírus
- Considere assinar o código digitalmente (requer certificado)

---

## 💡 Recomendações

Para uso interno/corporativo:
- ✅ Use **Atualização Manual** (mais simples)
- ✅ Mantenha um changelog simples
- ✅ Distribua via rede compartilhada ou email

Para distribuição pública:
- ⚠️ Considere **Atualização Automática**
- ⚠️ Implemente assinatura de código
- ⚠️ Configure servidor de atualizações

---

## 📚 Referências

- [Electron Builder - Auto Update](https://www.electron.build/auto-update)
- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [Semantic Versioning](https://semver.org/)

