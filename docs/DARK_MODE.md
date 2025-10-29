# Dark Mode - Sprint Analysis Dashboard

## 🌙 Visão Geral

O Sprint Analysis Dashboard agora conta com um sistema completo de **Dark Mode**, proporcionando uma experiência visual moderna e confortável para os olhos em ambientes com pouca luz.

## ✨ Características

### 1. **Toggle de Tema**
- Botão de alternância localizado no cabeçalho da aplicação
- Ícone de lua (🌙) para modo claro
- Ícone de sol (☀️) para modo escuro
- Transição suave entre temas

### 2. **Persistência de Tema**
- A preferência do usuário é salva automaticamente no `localStorage`
- O tema selecionado é mantido entre sessões

### 3. **Design Elegante**
- **Gradientes suaves** em elementos principais
- **Bordas arredondadas** (rounded-xl) para aparência moderna
- **Sombras refinadas** que se adaptam ao tema
- **Transições animadas** entre estados
- **Scrollbar customizado** para cada tema

### 4. **Componentes Atualizados**

Todos os componentes principais foram atualizados com suporte a dark mode:

- ✅ **App** - Layout principal e header
- ✅ **Dashboard** - Painel principal
- ✅ **XlsUploader** - Área de upload de arquivos
- ✅ **TotalizerCards** - Cartões de resumo
- ✅ **DeveloperCard** - Cartões de desenvolvedores
- ✅ **AlertPanel** - Painel de alertas
- ✅ **SprintSelector** - Seletor de sprints
- ✅ **TaskList** - Lista de tarefas
- ✅ **CrossSprintAnalysis** - Análise multi-sprint

## 🎨 Paleta de Cores

### Modo Claro
- Background: Gradiente de `gray-50` para `gray-100`
- Cards: `white` com bordas `gray-200`
- Texto: `gray-900` (principal), `gray-600` (secundário)

### Modo Escuro
- Background: Gradiente de `gray-900` para `gray-800`
- Cards: `gray-800` com bordas `gray-700`
- Texto: `white` (principal), `gray-400` (secundário)

## 🛠️ Implementação Técnica

### Context API
```typescript
// src/contexts/ThemeContext.tsx
const { theme, toggleTheme } = useTheme();
```

### Tailwind CSS
O projeto usa a estratégia de classe do Tailwind:
```javascript
// tailwind.config.js
darkMode: 'class'
```

### Classes Utilizadas
- `dark:bg-gray-800` - Background escuro
- `dark:text-white` - Texto claro
- `dark:border-gray-700` - Bordas escuras
- `transition-colors duration-300` - Transições suaves

## 🎯 Melhorias Visuais

### Animações
- **Fade In**: Elementos principais aparecem suavemente
- **Slide In**: Alertas e notificações deslizam para a tela
- **Hover Effects**: Cards elevam ao passar o mouse
- **Scale Effects**: Cards selecionados aumentam ligeiramente

### Gradientes
Elementos de destaque usam gradientes:
- Ícones de seção: `from-blue-500 to-blue-600`
- Cards de tipo: `from-red-50 to-red-100`
- Barras de progresso: `from-green-500 to-green-600`

### Scrollbar Personalizado
- **Modo Claro**: Scrollbar cinza claro com gradiente
- **Modo Escuro**: Scrollbar cinza escuro harmonizado

## 📱 Responsividade

O dark mode mantém a responsividade completa:
- Mobile: Layout adaptado com componentes otimizados
- Tablet: Grid responsivo ajustado
- Desktop: Experiência completa com todos os detalhes

## 🚀 Como Usar

1. **Alternar Tema**
   - Clique no botão de lua/sol no cabeçalho
   - O tema muda instantaneamente
   - A preferência é salva automaticamente

2. **Tema Padrão**
   - Por padrão, o tema claro é usado
   - Se já houver uma preferência salva, ela será carregada

3. **Desenvolvimento**
   ```bash
   # O dark mode funciona em modo dev e produção
   npm run dev
   npm run build
   ```

## 🎨 Customização

Para ajustar cores ou adicionar novos estilos:

### 1. Editar Paleta de Cores
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        // Suas cores personalizadas
      }
    }
  }
}
```

### 2. Adicionar Classes Dark
```jsx
<div className="bg-white dark:bg-gray-800">
  {/* Seu conteúdo */}
</div>
```

### 3. Ajustar Transições
```css
/* src/index.css */
* {
  transition-duration: 200ms; /* Ajuste a velocidade */
}
```

## 📝 Notas

- ✅ Sem dependências externas adicionais
- ✅ Performance otimizada
- ✅ Acessibilidade mantida
- ✅ Compatível com todos os navegadores modernos

## 🎉 Resultado

O Sprint Analysis Dashboard agora oferece uma experiência visual premium com:
- Interface moderna e elegante
- Conforto visual em qualquer ambiente
- Transições e animações suaves
- Design profissional e polido

---

**Desenvolvido com ❤️ para melhorar a experiência do usuário**

