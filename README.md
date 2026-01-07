# Monitor de Toner - Impressoras de Rede

![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![SNMP](https://img.shields.io/badge/protocol-SNMPv1%2Fv2c-orange.svg)

Sistema avançado de monitoramento em tempo real dos níveis de toner e contadores de páginas de impressoras de rede usando protocolo SNMP. Desenvolvido para facilitar a gestão do parque de impressão.

## 📚 Documentação

- **[Manual do Usuário](public/manual.html)** - Guia completo de uso
- **[Documentação Técnica](TECHNICAL.md)** - Arquitetura e desenvolvimento
- **[Documentação da API](API.md)** - Endpoints REST e exemplos
- **[Referência SNMP OIDs](SNMP_OIDS.md)** - Lista completa de OIDs
- **[Guia de Contribuição](CONTRIBUTING.md)** - Como contribuir
- **[Changelog](CHANGELOG.md)** - Histórico de versões

## 📋 Características Principais

### Monitoramento Inteligente
- ✅ **Suporte Multi-Fabricante**: Compatível com impressoras HP e Pantum.
- ✅ **Atualização em Tempo Real**: Dados atualizados automaticamente a cada 5 minutos.
- ✅ **Contador de Páginas**: Leitura precisa do total de páginas impressas (suporte universal e OIDs específicos da Pantum).
- ✅ **Níveis de Toner**: Visualização gráfica com barras de progresso coloridas.

### Interface Moderna
- ✅ **Dashboard Intuitivo**: Visualização em cards responsivos com *Dark Mode* e *Glassmorphism*.
- ✅ **Edição Rápida (Inline)**: Altere o nome e número de série da impressora diretamente no card, sem recarregar a página.
- ✅ **Filtros Avançados**: Por status (Online/Offline/Alertas) e Fabricante.
- ✅ **Busca Instantânea**: Localize impressoras por nome, modelo ou IP.

### Automação e Facilidade
- ✅ **Auto-Discovery**: Ferramenta de descoberta automática de impressoras na rede por faixa de IP.
- ✅ **Persistência de Dados**: As configurações (nomes personalizados, locais) são salvas automaticamente (`config/printers.json`).
- ✅ **Alertas Visuais**: Indicadores claros para impressoras offline ou com toner baixo.

## 🚀 Guia de Início Rápido

### Pré-requisitos
- Node.js 14 ou superior ([Download](https://nodejs.org/))
- Acesso de rede às impressoras
- SNMP habilitado nas impressoras (Porta UDP 161)

### Instalação

1. **Abra o terminal na pasta do projeto:** (**Substitua pelo local da sua pasta**)
   ```bash
   cd c:\Users\Administrador\press_app 
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   ```

5. **Acesse no navegador:**
   Abra `http://localhost:3000`

## 🔧 Configuração e Uso

### Descoberta de Impressoras (Auto-Discovery)
1. Vá para a página de **Configurações**.
2. Defina o **Range de IPs** da sua rede (ex: `172.17.27.1` a `172.17.27.254`).
3. Clique em **Buscar Impressoras**.
4. O sistema irá escanear a rede e adicionar automaticamente as impressoras encontradas.

### Personalização no Dashboard
- **Editar Nome**: Clique no ícone de lápis ao lado do nome da impressora para renomeá-la facilmente (ex: "Impressora Recepção").
- **Editar Local**: O campo "Local" foi otimizado para exibir o **Contador de Páginas**, mas o IP e outros detalhes são editáveis se necessário via configuração.
- **Salvar**: As alterações são salvas instantaneamente.

### Configuração SNMP nas Impressoras
Para que o sistema receba os dados, garanta que o SNMP v1/v2c esteja ativo:
- **Community String**: `public` ou `v2cpublic` (O sistema tenta ambas automaticamente).
- **Permissões**: Leitura (Read-Only).

## 📊 Legenda de Status

### Cores do Toner
- 🟢 **Verde** (50-100%): Nível Confortável
- 🟡 **Amarelo** (20-49%): Atenção
- 🔴 **Vermelho** (0-19%): Nível Crítico (Troca necessária)

### Status da Impressora
- 🟢 **Online**: Conectada e respondendo.
- 🔴 **Offline**: Sem resposta (Verifique cabos e energia).

## 🔌 API Endpoints (Para Desenvolvedores)

- `GET /api/printers`: Lista configurações.
- `GET /api/printers/status`: Status atual de todas as impressoras.
- `PATCH /api/printers/:id/update`: Atualiza campos (nome, serial).
- `POST /api/discover`: Inicia varredura da rede.
- `POST /api/printers/refresh`: Força atualização dos dados.

## 🛠️ Solução de Problemas Comuns

### 1. Contador de páginas da Pantum zerado?
O sistema já inclui a correção para modelos Pantum. Certifique-se de que a impressora suporta SNMP v2c e use o botão "Atualizar".

### 2. Impressora Online mas sem dados de toner?
Verifique se a impressora é colorida ou monocromática. O sistema tenta detectar cartuchos automaticamente. Alguns modelos genéricos podem não reportar níveis via SNMP padrão.

### 3. Erro EADDRINUSE ao iniciar?
A porta 3000 já está em uso. Feche outros terminais Node.js ou use o comando:
```powershell
taskkill /F /IM node.exe
```

## 📝 Estrutura de Arquivos

O projeto está organizado da seguinte forma:

```
press_app/
├── config/                 # Configurações e Persistência
│   ├── printers.json       # Banco de dados local das impressoras
│   └── settings.json       # Configurações globais do sistema
├── public/                 # Interface do Usuário (Frontend)
│   ├── css/                # Estilos (CSS)
│   ├── img/                # Assets e Imagens do Manual
│   ├── js/                 # Lógica do lado do cliente
│   ├── index.html          # Dashboard Principal
│   ├── manual.html         # Manual do Usuário
│   ├── install.html        # Guia de Instalação
│   └── settings.html       # Painel de Configurações
├── server.js               # Servidor Backend (Node.js + SNMP)
├── package.json            # Dependências e Scripts
└── README.md               # Documentação Principal
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o [Guia de Contribuição](CONTRIBUTING.md) para detalhes sobre como contribuir com o projeto.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

**Resumo da Licença MIT:**
- ✅ Uso comercial permitido
- ✅ Modificação permitida
- ✅ Distribuição permitida
- ✅ Uso privado permitido
- ℹ️ Sem garantia
- ℹ️ Licença e copyright devem ser incluídos

## 🔗 Links Úteis

- **Repositório**: [GitHub](https://github.com/jeffersondantas1982/press_app)
- **Desenvolvedor**: [Jefferson Dantas - LinkedIn](https://www.linkedin.com/in/jeffersondantas/)
- **Issues**: [Reportar Bug](https://github.com/jeffersondantas1982/press_app/issues)
- **Documentação SNMP**: [RFC 3805 - Printer MIB v2](https://www.rfc-editor.org/rfc/rfc3805)

## 🌟 Recursos Futuros

- [ ] Suporte para impressoras Brother, Canon e Epson
- [ ] Notificações por email quando toner estiver baixo
- [ ] Gráficos de histórico de consumo
- [ ] Exportação de relatórios em PDF
- [ ] Aplicativo mobile
- [ ] Suporte multi-idioma
- [ ] Dashboard com métricas avançadas

## 💡 Suporte

Se você encontrar algum problema ou tiver sugestões:

1. Verifique as [Issues existentes](https://github.com/jeffersondantas1982/press_app/issues)
2. Leia a [Documentação Técnica](TECHNICAL.md)
3. Consulte o [Manual do Usuário](public/manual.html)
4. Abra uma nova issue descrevendo o problema

## 🙏 Agradecimentos

- Comunidade Node.js
- Desenvolvedores do net-snmp
- Todos que contribuíram com feedback e testes

---
**Desenvolvido para máxima eficiência na gestão de impressão.** 🖨️🚀
