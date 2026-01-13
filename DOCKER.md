# Guia Docker - Monitor de Toner

Documentação completa para executar o Monitor de Toner em containers Docker.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Início Rápido](#início-rápido)
- [Construindo a Imagem](#construindo-a-imagem)
- [Executando o Container](#executando-o-container)
- [Docker Compose](#docker-compose)
- [Configuração](#configuração)
- [Volumes](#volumes)
- [Rede](#rede)
- [Troubleshooting](#troubleshooting)
- [Otimização](#otimização)

---

## Pré-requisitos

- **Docker**: versão 20.10 ou superior
- **Docker Compose**: versão 2.0 ou superior (opcional, mas recomendado)
- **Acesso de rede**: Container precisa acessar as impressoras via rede

### Instalando Docker

**Windows**:
```powershell
# Baixar Docker Desktop
https://www.docker.com/products/docker-desktop/
```

**Linux**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**Verificar instalação**:
```bash
docker --version
docker-compose --version
```

---

## Início Rápido

### Opção 1: Docker Compose (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/jeffersondantas1982/monitor-toner.git
cd monitor-toner

# 2. Inicie o container
docker-compose up -d

# 3. Acesse no navegador
http://localhost:3000
```

### Opção 2: Docker Run

```bash
# 1. Construir a imagem
docker build -t monitor-toner:latest .

# 2. Executar o container
docker run -d \
  --name monitor-toner \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  --restart unless-stopped \
  monitor-toner:latest

# 3. Acesse no navegador
http://localhost:3000
```

---

## Construindo a Imagem

### Build Padrão

```bash
docker build -t monitor-toner:latest .
```

### Build com Tag de Versão

```bash
docker build -t monitor-toner:1.0.1 .
```

### Build sem Cache

```bash
docker build --no-cache -t monitor-toner:latest .
```

### Verificar Imagem

```bash
# Listar imagens
docker images | grep monitor-toner

# Inspecionar imagem
docker inspect monitor-toner:latest

# Ver histórico de camadas
docker history monitor-toner:latest
```

---

## Executando o Container

### Comando Básico

```bash
docker run -d \
  --name monitor-toner \
  -p 3000:3000 \
  monitor-toner:latest
```

### Comando Completo (Recomendado)

```bash
docker run -d \
  --name monitor-toner \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/logs:/app/logs \
  -e NODE_ENV=production \
  -e TZ=America/Sao_Paulo \
  --restart unless-stopped \
  --memory="512m" \
  --cpus="0.5" \
  monitor-toner:latest
```

### Parâmetros Explicados

| Parâmetro | Descrição |
|-----------|-----------|
| `-d` | Executa em background (detached) |
| `--name` | Nome do container |
| `-p 3000:3000` | Mapeia porta host:container |
| `-v` | Monta volumes para persistência |
| `-e` | Define variáveis de ambiente |
| `--restart` | Política de restart |
| `--memory` | Limite de memória |
| `--cpus` | Limite de CPU |

---

## Docker Compose

### Arquivo docker-compose.yml

O projeto já inclui um arquivo `docker-compose.yml` configurado.

### Comandos Úteis

```bash
# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs em tempo real
docker-compose logs -f monitor-toner

# Parar serviços
docker-compose stop

# Parar e remover containers
docker-compose down

# Reconstruir e iniciar
docker-compose up -d --build

# Verificar status
docker-compose ps

# Executar comando no container
docker-compose exec monitor-toner sh
```

### Personalizar docker-compose.yml

```yaml
version: '3.8'

services:
  monitor-toner:
    build: .
    ports:
      - "8080:3000"  # Mudar porta do host
    volumes:
      - ./config:/app/config
    environment:
      - NODE_ENV=production
      - TZ=America/Fortaleza  # Seu timezone
    restart: unless-stopped
```

---

## Configuração

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NODE_ENV` | `production` | Ambiente Node.js |
| `PORT` | `3000` | Porta da aplicação |
| `TZ` | `America/Sao_Paulo` | Timezone |

### Exemplo com .env

Crie um arquivo `.env`:

```env
NODE_ENV=production
PORT=3000
TZ=America/Sao_Paulo
```

Use no docker-compose:

```yaml
services:
  monitor-toner:
    env_file: .env
```

---

## Volumes

### Volumes Recomendados

```bash
docker run -d \
  -v $(pwd)/config:/app/config \      # Configurações das impressoras
  -v $(pwd)/logs:/app/logs \          # Logs (opcional)
  monitor-toner:latest
```

### Backup dos Dados

```bash
# Backup do diretório config
docker cp monitor-toner:/app/config ./backup-config-$(date +%Y%m%d)

# Restaurar backup
docker cp ./backup-config-20260113/. monitor-toner:/app/config
```

### Volumes Nomeados

```yaml
volumes:
  printer-config:
    driver: local

services:
  monitor-toner:
    volumes:
      - printer-config:/app/config
```

---

## Rede

### Rede Bridge (Padrão)

O container usa rede bridge para acessar as impressoras na rede local.

### Rede Host (Para Broadcast/Discovery)

Se o auto-discovery não funcionar, use `--network host`:

```bash
docker run -d \
  --name monitor-toner \
  --network host \
  monitor-toner:latest
```

**Nota**: No modo host, não é necessário mapear portas com `-p`.

### Conectar a Rede Existente

```bash
# Criar rede
docker network create printer-network

# Executar na rede
docker run -d \
  --name monitor-toner \
  --network printer-network \
  -p 3000:3000 \
  monitor-toner:latest
```

---

## Troubleshooting

### Container não inicia

```bash
# Ver logs
docker logs monitor-toner

# Ver logs em tempo real
docker logs -f monitor-toner

# Executar em modo interativo
docker run -it --rm monitor-toner:latest sh
```

### Problemas de Rede/SNMP

```bash
# Entrar no container
docker exec -it monitor-toner sh

# Testar conectividade SNMP
snmpwalk -v2c -c public 172.17.27.101

# Verificar rotas de rede
ip route
```

### Permissões de Volume

```bash
# Verificar permissões
ls -la config/

# Corrigir permissões (Linux)
sudo chown -R 1001:1001 config/
```

### Health Check Falhando

```bash
# Ver status do health check
docker inspect monitor-toner | grep -A 10 Health

# Testar manualmente
docker exec monitor-toner wget -O- http://localhost:3000/api/printers
```

### Alto Uso de Recursos

```bash
# Ver uso de recursos
docker stats monitor-toner

# Limitar recursos
docker update --memory="256m" --cpus="0.25" monitor-toner
```

---

## Otimização

### Reduzir Tamanho da Imagem

A imagem já usa:
- ✅ Alpine Linux (base mínima)
- ✅ Multi-stage build
- ✅ .dockerignore otimizado
- ✅ npm ci --only=production

**Tamanho esperado**: ~100-150 MB

### Performance

```yaml
# docker-compose.yml otimizado
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### Segurança

A imagem implementa:
- ✅ Usuário não-root (nodejs:1001)
- ✅ Imagem base oficial Alpine
- ✅ Apenas dependências de produção
- ✅ Health check integrado
- ✅ Sem pacotes desnecessários

---

## Publicação da Imagem

### Docker Hub

```bash
# Login
docker login

# Tag da imagem
docker tag monitor-toner:latest seuusuario/monitor-toner:latest
docker tag monitor-toner:latest seuusuario/monitor-toner:1.0.1

# Push
docker push seuusuario/monitor-toner:latest
docker push seuusuario/monitor-toner:1.0.1
```

### GitHub Container Registry

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag
docker tag monitor-toner:latest ghcr.io/jeffersondantas1982/monitor-toner:latest

# Push
docker push ghcr.io/jeffersondantas1982/monitor-toner:latest
```

---

## Exemplos de Uso

### Desenvolvimento

```bash
# Com hot-reload (para desenvolvimento)
docker run -d \
  --name monitor-toner-dev \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  monitor-toner:latest \
  npm run dev
```

### Produção com Nginx

```yaml
version: '3.8'

services:
  monitor-toner:
    build: .
    expose:
      - "3000"
    networks:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - monitor-toner
    networks:
      - backend

networks:
  backend:
```

### Múltiplas Instâncias

```bash
# Instância 1
docker run -d --name monitor-toner-1 -p 3001:3000 monitor-toner:latest

# Instância 2
docker run -d --name monitor-toner-2 -p 3002:3000 monitor-toner:latest
```

---

## Comandos Úteis

```bash
# Limpar tudo
docker-compose down -v
docker system prune -a

# Exportar imagem
docker save monitor-toner:latest | gzip > monitor-toner.tar.gz

# Importar imagem
docker load < monitor-toner.tar.gz

# Ver logs dos últimos 100 linhas
docker logs --tail 100 monitor-toner

# Reiniciar container
docker restart monitor-toner

# Atualizar container
docker-compose pull
docker-compose up -d
```

---

## Suporte

Se encontrar problemas:

1. Verifique os [logs](#troubleshooting)
2. Consulte a [documentação técnica](TECHNICAL.md)
3. Abra uma [issue no GitHub](https://github.com/jeffersondantas1982/monitor-toner/issues)

---

**Última atualização**: 2026-01-13  
**Versão Docker**: 1.0.1
