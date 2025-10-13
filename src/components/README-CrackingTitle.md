# CrackingTitle Component

Um componente React que cria um efeito visual de "cracking hash" quando o usuário passa o mouse sobre o título, similar ao efeito do logo V01.

## 🎯 Funcionalidades

- **Efeito aleatório**: Caracteres selecionados aleatoriamente para o efeito
- **Configurável**: Intensidade e duração personalizáveis
- **Responsivo**: Otimizado para diferentes tamanhos de tela
- **Performance**: Efeitos simplificados em dispositivos móveis
- **Acessível**: Mantém a legibilidade do texto
- **Persistente**: Efeito continua mesmo após remover o mouse

## 🎯 Como Funciona

1. **Hover**: Quando o usuário passa o mouse sobre o texto (apenas uma vez)
2. **Cracking**: Caracteres aleatórios começam a "quebrar" com efeitos visuais
3. **Animação**: Efeito continua por um tempo configurável (mesmo se o mouse sair)
4. **Reset**: Após a duração, o texto volta ao normal

## 🚀 Como Usar

### Importação Básica

```jsx
import CrackingTitle from './CrackingTitle';
import './CrackingTitle.css';
```

### Uso Simples

```jsx
<CrackingTitle>TombWatcher Walkthrough</CrackingTitle>
```

### Uso Avançado

```jsx
<CrackingTitle 
  intensity={0.8}     // 80% dos caracteres afetados (0.0 a 1.0)
  duration={3000}     // 3 segundos de duração
  className="custom-title"
>
  Fluffy Walkthrough
</CrackingTitle>
```

## ⚙️ Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `children` | `string` | - | Texto a ser exibido |
| `className` | `string` | `''` | Classe CSS adicional |
| `intensity` | `number` | `1.0` | Porcentagem de caracteres afetados (0.0-1.0) |
| `duration` | `number` | `2000` | Duração do efeito em milissegundos |

## 🎨 Efeitos Visuais

### Cores do Efeito
- **Vermelho**: `#ff6b6b` - Cor primária do cracking
- **Ciano**: `#4ecdc4` - Cor secundária
- **Azul**: `#45b7d1` - Cor terciária
- **Amarelo**: `#f9ca24` - Cor quaternária
- **Rosa**: `#ff9ff3` - Cor quinta
- **Azul claro**: `#54a0ff` - Cor sexta

### Animações
- **Rotação**: Rotação dinâmica dos caracteres (-2° a 2°)
- **Escala**: Aumento variável do tamanho (1.1x a 1.4x)
- **Sombra**: Brilho colorido intenso ao redor dos caracteres
- **Scan**: Efeito de varredura horizontal
- **Noise**: Ruído digital sutil
- **Cores dinâmicas**: 6 cores diferentes alternando aleatoriamente

## 📱 Responsividade

- **Desktop**: Efeitos completos com todas as animações
- **Mobile**: Efeitos simplificados para melhor performance
- **Tablet**: Adaptação automática baseada no tamanho da tela

## 🔧 Personalização CSS

```css
.cracking-title {
  /* Estilos do container */
}

.cracking-char {
  /* Estilos dos caracteres individuais */
}

.cracking-char.cracking {
  /* Estilos durante o efeito */
}
```

## 📋 Exemplos de Uso

### Cards de Writeups
```jsx
<h3 className="card-title">
  <CrackingTitle>{title}</CrackingTitle>
</h3>
```

### Títulos de Projetos
```jsx
<h2 className="project-title">
  <CrackingTitle intensity={0.5} duration={2500}>
    {projectName}
  </CrackingTitle>
</h2>
```

### Headers Principais
```jsx
<h1 className="main-header">
  <CrackingTitle intensity={0.7} duration={3000}>
    V01 Cybersecurity Notes
  </CrackingTitle>
</h1>
```

## ⚡ Performance

- **Otimizado**: Limpa automaticamente os timers e intervalos
- **Eficiente**: Usa `useEffect` com cleanup adequado
- **Responsivo**: Desabilita efeitos complexos em dispositivos móveis
- **Memória**: Gerenciamento adequado do estado dos caracteres

## 🎭 Demonstração

Para ver o componente em ação, importe e use o `CrackingTitleDemo`:

```jsx
import CrackingTitleDemo from './CrackingTitleDemo';

// Em sua aplicação
<CrackingTitleDemo />
```

## 🔗 Integração

O componente já está integrado ao sistema de cards em:
- `src/components/Card.js`
- Todos os cards de writeups e projetos

## 🎨 Inspiração

Este efeito foi inspirado no logo V01 e simula o processo de cracking de hashes, onde caracteres são substituídos aleatoriamente por outros símbolos, criando um efeito visual dinâmico e tecnológico.
