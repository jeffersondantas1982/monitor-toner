# Multi-stage build para otimizar o tamanho da imagem
FROM node:18-alpine AS base

# Metadata
LABEL maintainer="Jefferson Dantas"
LABEL description="Monitor de Toner - Sistema de monitoramento de impressoras via SNMP"
LABEL version="1.0.1"

# Instalar dependências do sistema necessárias para SNMP
RUN apk add --no-cache \
    net-snmp-tools \
    net-snmp-libs

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de produção
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código da aplicação
COPY server.js ./
COPY config ./config
COPY public ./public

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Expor porta da aplicação
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/printers', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
