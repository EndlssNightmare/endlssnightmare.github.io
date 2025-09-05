# Markdown Cheat Sheet para Writeups - PROJETO ESPECÍFICO

Este cheat sheet mostra todos os comandos de markdown que funcionam com o parser JavaScript personalizado usado nos componentes de writeup **DESTE PROJETO**.

**⚠️ IMPORTANTE**: Este projeto usa template literals (backticks) para definir o conteúdo, então TODOS os backticks dentro do conteúdo precisam ser escapados com backslash!

## 📝 Cabeçalhos

```markdown
# Título Principal (H1)
## Subtítulo (H2)
### Seção (H3)
```

## 💻 Blocos de Código

### Blocos de Código com Linguagem
```markdown
\`\`\`bash
sudo nmap -sS -p- 192.168.1.1
\`\`\`

\`\`\`python
import requests
response = requests.get("http://example.com")
\`\`\`

\`\`\`javascript
console.log("Hello World");
\`\`\`
```

### Blocos de Código sem Linguagem
```markdown
\`\`\`
Comando simples sem especificar linguagem
\`\`\`
```

## 🔤 Formatação de Texto

### Negrito
```markdown
**Texto em negrito**
```

### Itálico
```markdown
*Texto em itálico*
```

### Código Inline
```markdown
\`comando\` ou \`arquivo.txt\`
```

**⚠️ CRÍTICO**: Para código inline, você DEVE escapar com backslash: `\`texto\``

## 🖼️ Imagens

```markdown
![Descrição da Imagem](/caminho/para/imagem.png)
```

**Exemplo:**
```markdown
![Nmap Scan Results](/images/writeups/dc02/1.png)
```

## 📋 Listas

### Listas Não Ordenadas
```markdown
- Item 1
- Item 2
- Item 3
```

### Listas Aninhadas
```markdown
- Item Principal
  - Subitem 1
  - Subitem 2
- Outro Item
```

## 🔗 Links

```markdown
[Texto do Link](URL)
```

## 📊 Tabelas (se suportado)

```markdown
| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Dado 1   | Dado 2   | Dado 3   |
```

## 📝 Exemplo Completo de Writeup

```markdown
# Nome da Máquina

## Enumeração
### Port Scanning
Executando scan com **Nmap**:

\`\`\`bash
sudo nmap -sS -p- 192.168.1.1
\`\`\`

### Service Enumeration
Adicionando domínios no arquivo \`hosts\`:

\`\`\`bash
echo "192.168.1.1 machine.local" | sudo tee -a /etc/hosts
\`\`\`

### Resultados
- Porta 80: HTTP
- Porta 22: SSH
- Porta 445: SMB

![Scan Results](/images/scan.png)
```

## ⚠️ Limitações do Parser

O parser personalizado **NÃO suporta**:
- Citações (`> texto`)
- Linhas horizontais (`---`)
- Listas ordenadas (`1. Item`)
- Checkboxes (`- [x] Tarefa`)
- Tabelas complexas
- HTML inline
- Emojis especiais

## 🎯 Dicas de Uso

1. **Código Inline**: Use \`\`texto\`\` (COM escape com backslash)
2. **Blocos de Código**: Use \`\`\` \`\`\` (três backticks escapados)
3. **Imagens**: Coloque as imagens na pasta `/public/images/writeups/`
4. **Formatação**: Negrito e itálico funcionam normalmente
5. **Estrutura**: Use cabeçalhos para organizar o conteúdo

## 🔧 Solução de Problemas

### Erro de Sintaxe
Se você receber erros de sintaxe:
- **SEMPRE escape backticks com backslash**: \`texto\`
- Use \`\`\` para blocos de código
- Evite caracteres especiais não suportados

### Imagens Não Carregam
- Verifique o caminho da imagem
- Certifique-se de que a imagem existe na pasta `/public/images/`
- Use caminhos relativos começando com `/`

### Formatação Não Funciona
- Verifique se está usando a sintaxe correta
- Teste com exemplos simples primeiro
- Recarregue a página após mudanças
