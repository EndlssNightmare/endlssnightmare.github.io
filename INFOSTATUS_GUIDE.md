# InfoStatus Component Guide

O componente InfoStatus permite criar blocos coloridos para destacar informações importantes nos writeups. Ele suporta 4 tipos diferentes de blocos:

## Tipos Disponíveis

### 1. Info (Azul) - Padrão
```markdown
<InfoStatus 
  title="Informação Importante:" 
  message="Este é um bloco informativo que pode ser usado para destacar detalhes importantes, dicas ou explicações." 
/>
```

### 2. Warning (Laranja)
```markdown
<InfoStatus 
  title="Atenção:" 
  message="Este é um bloco de aviso que pode ser usado para destacar problemas potenciais, comandos perigosos ou considerações importantes de segurança." 
  type="warning"
/>
```

### 3. Success (Verde)
```markdown
<InfoStatus 
  title="Sucesso:" 
  message="Este é um bloco de sucesso que pode ser usado para destacar conquistas, flags encontradas ou etapas completadas com sucesso." 
  type="success"
/>
```

### 4. Error (Vermelho)
```markdown
<InfoStatus 
  title="Erro:" 
  message="Este é um bloco de erro que pode ser usado para destacar erros comuns, problemas ou falhas que podem ocorrer durante o processo." 
  type="error"
/>
```

## Funcionalidades

- **Texto em Negrito**: Use `**texto**` para destacar partes importantes da mensagem
- **Quebras de Linha**: Suporte completo a quebras de linha na mensagem
- **Multi-linha**: O componente pode ser escrito em várias linhas para melhor legibilidade
- **Responsivo**: Adapta-se automaticamente a diferentes tamanhos de tela

## Exemplos de Uso nos Writeups

### Credenciais Iniciais
```markdown
<InfoStatus 
  title="Credenciais Iniciais:" 
  message="Como é comum em pentests reais de Windows, você começará a máquina com as seguintes credenciais: henry / H3nry_987TGV!" 
/>
```

### Explicação Técnica
```markdown
<InfoStatus 
  title="Explicação da Esteganografia de Largura Zero:" 
  message="A técnica de esteganografia de largura zero é a prática de ocultar dados dentro de um arquivo de texto usando caracteres Unicode invisíveis.

• **U+200B** (ZERO WIDTH SPACE) → bit 0
• **U+200C** (ZERO WIDTH NON-JOINER) → bit 1

Como funciona:
• O ocultador insere esses caracteres invisíveis no texto em sequência.
• O extrator encontra todos os U+200B / U+200C no arquivo (em ordem).
• Mapeia cada caractere para 0 ou 1.
• Agrupa bits em 8 → bytes.
• Converte bytes para texto (UTF-8) → segredo revelado." 
  type="error"
/>
```

### Aviso de Segurança
```markdown
<InfoStatus 
  title="Atenção:" 
  message="Este comando pode ser perigoso em um ambiente de produção. Certifique-se de ter permissões adequadas antes de executar." 
  type="warning"
/>
```

## Como Usar no Script generate_react_content.py

O script `generate_react_content.py` já foi atualizado para incluir exemplos de blocos InfoStatus no template padrão. Quando você criar um novo writeup usando:

```bash
python3 generate_react_content.py writeup
```

O template gerado incluirá exemplos de como usar os blocos InfoStatus em diferentes contextos do writeup.

## Dicas de Uso

1. **Use com Moderação**: Não exagere no uso dos blocos. Use apenas quando necessário para destacar informações realmente importantes.

2. **Escolha o Tipo Correto**: 
   - `info` para informações gerais
   - `warning` para avisos importantes
   - `success` para conquistas/flags
   - `error` para erros comuns ou problemas

3. **Mantenha o Texto Conciso**: Embora suporte texto longo, mantenha as mensagens concisas e diretas.

4. **Use Negrito Estrategicamente**: Use `**texto**` para destacar partes específicas importantes da mensagem.

## Compatibilidade

O componente InfoStatus é totalmente compatível com:
- ✅ Todos os writeups existentes
- ✅ Tema claro e escuro
- ✅ Dispositivos móveis
- ✅ Navegadores modernos
- ✅ Sistema de markdown inline (links, negrito, itálico, código)

