# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-01-13

### Adicionado
- 🐳 Suporte completo para Docker
- Dockerfile otimizado com multi-stage build e Alpine Linux
- docker-compose.yml para fácil deployment
- .dockerignore para otimização de build
- DOCKER.md - Documentação completa de uso com Docker
- Health check integrado no container
- Configuração de recursos (CPU/Memory limits)
- Usuário não-root para segurança

### Melhorado
- README atualizado com instruções Docker
- Instalação agora recomenda Docker como opção principal

## [1.0.1] - 2026-01-07

### Adicionado
- Documentação completa do projeto (README, TECHNICAL, API, CONTRIBUTING)
- Licença MIT opensource
- Arquivo de changelog
- Referência completa de OIDs SNMP

### Melhorado
- README com badges, capturas de tela e informações expandidas
- Documentação de API REST com exemplos detalhados

## [1.0.0] - 2025

### Adicionado
- Sistema de monitoramento em tempo real de impressoras via SNMP
- Suporte para impressoras HP e Pantum
- Dashboard web moderno com dark mode e glassmorphism
- Auto-discovery de impressoras na rede
- Edição inline de nome e serial number
- Filtros avançados por status e fabricante
- Busca instantânea de impressoras
- Atualização automática a cada 5 minutos
- Sistema de cache para melhor performance
- Contadores de páginas com fallback strategies
- Leitura de níveis de toner com barras de progresso coloridas
- Alertas visuais para toner baixo e impressoras offline
- Persistência de configurações em JSON
- API REST completa para integração
- Agendamento de tarefas com node-cron
- Múltiplas community strings SNMP (public, v2cpublic)
- Sistema de leitura de serial number via web interface (Pantum)
- Manual do usuário integrado
- Guia de instalação interativo
- Página de configurações com descoberta de impressoras
- Theme toggle (Light/Dark mode)
- Toast notifications para feedback do usuário

### Tecnologias
- Node.js com Express
- SNMP (net-snmp)
- HTML5, CSS3, JavaScript (Vanilla)
- Interface responsiva e moderna
- Google Fonts (Inter)

---

**Formato de versionamento**: MAJOR.MINOR.PATCH

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis
