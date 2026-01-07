# Guia de Contribuição

Obrigado pelo interesse em contribuir com o **Monitor de Toner**! 🎉

Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Processo de Pull Request](#processo-de-pull-request)
- [Padrões de Código](#padrões-de-código)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Melhorias](#sugerindo-melhorias)

---

## Código de Conduta

Este projeto adere a padrões de respeito e profissionalismo. Esperamos que todos os contribuidores:

- Sejam respeitosos e construtivos nas discussões
- Mantenham um ambiente acolhedor e inclusivo
- Foquem em melhorar o projeto de forma colaborativa

---

## Como Contribuir

### 1. Fork o Repositório

```bash
# Clone seu fork
git clone https://github.com/seu-usuario/press_app.git
cd press_app

# Adicione o repositório original como upstream
git remote add upstream https://github.com/jeffersondantas1982/press_app.git
```

### 2. Crie uma Branch

Use nomes descritivos para suas branches:

```bash
# Para novas features
git checkout -b feature/nome-da-feature

# Para correções de bugs
git checkout -b fix/descricao-do-bug

# Para documentação
git checkout -b docs/descricao-da-doc
```

### 3. Faça suas Alterações

- Escreva código limpo e bem documentado
- Siga os padrões de código do projeto
- Adicione comentários onde necessário
- Teste suas alterações

### 4. Commit suas Mudanças

Use mensagens de commit claras e descritivas:

```bash
git add .
git commit -m "feat: adiciona suporte para impressoras Brother"
```

#### Convenção de Commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Apenas documentação
- `style:` - Formatação, ponto e vírgula, etc
- `refactor:` - Refatoração de código
- `test:` - Adição ou correção de testes
- `chore:` - Tarefas de manutenção

### 5. Push para o GitHub

```bash
git push origin feature/nome-da-feature
```

### 6. Abra um Pull Request

- Acesse o repositório original no GitHub
- Clique em "New Pull Request"
- Selecione sua branch
- Preencha a descrição do PR com detalhes

---

## Processo de Pull Request

### Checklist antes de submeter

- [ ] O código segue os padrões do projeto
- [ ] Comentários foram adicionados em código complexo
- [ ] A documentação foi atualizada (se aplicável)
- [ ] Nenhum warning ou erro é gerado
- [ ] Todas as funcionalidades existentes ainda funcionam
- [ ] O código foi testado localmente

### Template de Pull Request

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Passo 3

## Screenshots (se aplicável)
[Adicione screenshots]

## Checklist
- [ ] Código testado localmente
- [ ] Documentação atualizada
- [ ] Commits seguem o padrão
```

---

## Padrões de Código

### JavaScript

```javascript
// ✅ BOM - Use camelCase para variáveis e funções
const printerStatus = getPrinterStatus(printer);

// ✅ BOM - Use const/let, não var
const API_URL = 'http://localhost:3000';
let currentFilter = 'all';

// ✅ BOM - Funções devem ter nomes descritivos
async function getPrinterTonerLevels(ip, manufacturer) {
  // código aqui
}

// ✅ BOM - Use arrow functions quando apropriado
const filterPrinters = (printers) => {
  return printers.filter(p => p.status === 'online');
};

// ✅ BOM - Adicione comentários para lógica complexa
// Try multiple community strings in sequence
for (const community of ['public', 'v2cpublic']) {
  // código aqui
}

// ❌ RUIM - Evite código não documentado e confuso
function f(x,y){return x.filter(z=>z.s==y)}
```

### HTML

```html
<!-- ✅ BOM - Use indentação consistente (4 espaços) -->
<div class="printer-card">
    <h3>Nome da Impressora</h3>
    <p>Detalhes</p>
</div>

<!-- ✅ BOM - Use IDs e classes semânticas -->
<button id="refreshBtn" class="refresh-btn">Atualizar</button>

<!-- ❌ RUIM - Evite IDs genéricos -->
<button id="btn1">Atualizar</button>
```

### CSS

```css
/* ✅ BOM - Organize por componentes */
/* Header Component */
.header {
  background: var(--card-bg);
  padding: 1.5rem;
}

/* ✅ BOM - Use variáveis CSS */
:root {
  --primary-color: #667eea;
  --text-color: #1a202c;
}

/* ✅ BOM - Mobile-first quando possível */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

---

## Estrutura do Projeto

```
press_app/
├── config/                 # Arquivos de configuração
│   ├── printers.json       # Dados das impressoras
│   └── settings.json       # Configurações globais
├── public/                 # Frontend
│   ├── css/
│   │   ├── styles.css      # Estilos principais
│   │   └── settings.css    # Estilos da página de config
│   ├── js/
│   │   ├── app.js          # Lógica principal do dashboard
│   │   └── settings.js     # Lógica da página de config
│   ├── index.html          # Dashboard principal
│   ├── settings.html       # Página de configurações
│   ├── manual.html         # Manual do usuário
│   └── install.html        # Guia de instalação
├── server.js               # Servidor backend (Express + SNMP)
├── package.json            # Dependências
├── README.md               # Documentação principal
├── TECHNICAL.md            # Documentação técnica
├── API.md                  # Documentação da API
├── CONTRIBUTING.md         # Este arquivo
├── CHANGELOG.md            # Histórico de versões
├── SNMP_OIDS.md           # Referência de OIDs
└── LICENSE                 # Licença MIT
```

---

## Reportando Bugs

### Antes de Reportar

1. Verifique se o bug já não foi reportado nas [Issues](https://github.com/jeffersondantas1982/press_app/issues)
2. Tente reproduzir o bug em uma instalação limpa
3. Colete informações sobre o ambiente (SO, versão Node.js, etc)

### Template de Bug Report

```markdown
**Descrição do Bug**
Descrição clara do que está acontecendo

**Como Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento Esperado**
O que deveria acontecer

**Screenshots**
Se aplicável, adicione screenshots

**Ambiente**
- SO: [ex: Windows 11]
- Node.js: [ex: v18.0.0]
- Navegador: [ex: Chrome 120]
- Versão: [ex: 1.0.1]

**Informações Adicionais**
Qualquer outro contexto sobre o problema
```

---

## Sugerindo Melhorias

### Template de Feature Request

```markdown
**A feature está relacionada a um problema?**
Descrição clara do problema. Ex: "Sempre fico frustrado quando [...]"

**Solução Proposta**
Descrição clara de como você gostaria que funcionasse

**Alternativas Consideradas**
Outras soluções ou features que você considerou

**Contexto Adicional**
Screenshots, mockups, ou qualquer outro contexto
```

---

## Áreas que Precisam de Contribuição

Procurando por onde começar? Estas áreas precisam de ajuda:

### 🐛 Bugs Conhecidos
- Verificar issues com label `bug`

### ✨ Novas Features
- **Suporte a Mais Fabricantes**: Brother, Canon, Epson
- **Notificações**: Email/SMS quando toner estiver baixo
- **Relatórios**: Geração de PDFs com histórico
- **Dashboard Avançado**: Gráficos de consumo ao longo do tempo
- **Multi-idioma**: Suporte para outros idiomas

### 📚 Documentação
- Tradução para outros idiomas
- Mais exemplos de uso
- Vídeos tutoriais
- Melhoria de diagramas

### 🧪 Testes
- Testes unitários
- Testes de integração
- Testes E2E

---

## Perguntas?

Se tiver dúvidas sobre como contribuir, sinta-se à vontade para:

- Abrir uma [Discussion](https://github.com/jeffersondantas1982/press_app/discussions)
- Entrar em contato via [LinkedIn](https://www.linkedin.com/in/jeffersondantas/)

---

**Obrigado por contribuir!** 🚀
