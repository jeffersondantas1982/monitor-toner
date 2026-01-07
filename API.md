# Documentação da API REST

API REST completa para integração com o Monitor de Toner.

**Base URL**: `http://localhost:3000/api`

## 📋 Índice

- [Autenticação](#autenticação)
- [Endpoints](#endpoints)
  - [Impressoras](#impressoras)
  - [Status](#status)
  - [Descoberta](#descoberta)
  - [Atualização](#atualização)
- [Modelos de Dados](#modelos-de-dados)
- [Códigos de Status](#códigos-de-status)
- [Exemplos de Uso](#exemplos-de-uso)

---

## Autenticação

Atualmente a API não requer autenticação. Para uso em produção, recomenda-se implementar autenticação via API Keys ou JWT.

---

## Endpoints

### Impressoras

#### **GET** `/api/printers`

Retorna a lista de todas as impressoras configuradas.

**Resposta de Sucesso**: `200 OK`

```json
{
  "printers": [
    {
      "id": 1,
      "name": "RECEPÇÃO DO SAE",
      "ip": "172.17.27.101",
      "model": "HP LaserJet MFP E42540",
      "manufacturer": "HP",
      "location": "IP 172.17.27.101",
      "serial": "BRBSS190KY"
    }
  ]
}
```

**Exemplo com curl**:
```bash
curl http://localhost:3000/api/printers
```

---

#### **GET** `/api/printers/status`

Retorna o status em tempo real de todas as impressoras.

**Resposta de Sucesso**: `200 OK`

```json
[
  {
    "id": 1,
    "name": "RECEPÇÃO DO SAE",
    "ip": "172.17.27.101",
    "model": "HP LaserJet MFP E42540",
    "manufacturer": "HP",
    "location": "IP 172.17.27.101",
    "serial": "BRBSS190KY",
    "status": "online",
    "pageCount": 15234,
    "toner": {
      "black": {
        "level": 85,
        "color": "Black"
      }
    },
    "lastUpdate": "2026-01-07T18:30:45.123Z"
  }
]
```

**Campos**:
- `status`: `"online"` | `"offline"`
- `pageCount`: Total de páginas impressas (número ou `null`)
- `toner`: Objeto com níveis de toner por cor
  - Cada cor contém: `level` (0-100), `color` (nome da cor)
- `lastUpdate`: Timestamp ISO da última atualização

**Exemplo com curl**:
```bash
curl http://localhost:3000/api/printers/status
```

---

#### **PATCH** `/api/printers/:id/update`

Atualiza informações de uma impressora específica.

**Parâmetros de URL**:
- `id` (number): ID da impressora

**Body** (JSON):
```json
{
  "name": "Novo Nome",
  "serial": "NOVO123"
}
```

**Campos aceitos**:
- `name` (string): Nome personalizado da impressora
- `serial` (string): Número de série
- `location` (string): Localização física
- `model` (string): Modelo da impressora

**Resposta de Sucesso**: `200 OK`

```json
{
  "success": true,
  "message": "Impressora atualizada com sucesso",
  "printer": {
    "id": 1,
    "name": "Novo Nome",
    "serial": "NOVO123",
    "ip": "172.17.27.101",
    "model": "HP LaserJet MFP E42540",
    "manufacturer": "HP",
    "location": "IP 172.17.27.101"
  }
}
```

**Resposta de Erro**: `404 Not Found`

```json
{
  "success": false,
  "error": "Impressora não encontrada"
}
```

**Exemplo com curl**:
```bash
curl -X PATCH http://localhost:3000/api/printers/1/update \
  -H "Content-Type: application/json" \
  -d '{"name":"Impressora Recepção","serial":"ABC123"}'
```

---

### Descoberta

#### **POST** `/api/discover`

Inicia a descoberta automática de impressoras na rede.

**Body** (JSON):
```json
{
  "startIP": "172.17.27.1",
  "endIP": "172.17.27.254"
}
```

**Campos**:
- `startIP` (string, obrigatório): IP inicial do range
- `endIP` (string, obrigatório): IP final do range

**Resposta de Sucesso**: `200 OK`

```json
{
  "discovered": [
    {
      "ip": "172.17.27.101",
      "model": "HP LaserJet MFP E42540",
      "manufacturer": "HP",
      "serial": "BRBSS190KY"
    },
    {
      "ip": "172.17.27.102",
      "model": "P3300DW",
      "manufacturer": "PANTUM",
      "serial": "DL425Y"
    }
  ],
  "count": 2
}
```

**Resposta de Erro**: `400 Bad Request`

```json
{
  "error": "IP range inválido"
}
```

**Exemplo com curl**:
```bash
curl -X POST http://localhost:3000/api/discover \
  -H "Content-Type: application/json" \
  -d '{"startIP":"172.17.27.1","endIP":"172.17.27.254"}'
```

**Observações**:
- O processo pode levar vários minutos dependendo do range
- O servidor retorna imediatamente com as impressoras encontradas
- Impressoras já cadastradas não são duplicadas

---

### Atualização

#### **POST** `/api/printers/refresh`

Força a atualização imediata do status de todas as impressoras.

**Body**: Nenhum

**Resposta de Sucesso**: `200 OK`

```json
{
  "success": true,
  "message": "Status atualizado com sucesso",
  "timestamp": "2026-01-07T18:30:45.123Z"
}
```

**Exemplo com curl**:
```bash
curl -X POST http://localhost:3000/api/printers/refresh
```

**Observações**:
- Ignora o cache e força nova consulta SNMP
- Atualiza o cache com os novos dados
- Útil após adicionar/modificar impressoras

---

## Modelos de Dados

### Printer (Configuração)

```typescript
interface Printer {
  id: number;              // ID único da impressora
  name: string;            // Nome personalizado
  ip: string;              // Endereço IP
  model: string;           // Modelo da impressora
  manufacturer: string;    // Fabricante (HP, PANTUM)
  location: string;        // Localização física
  serial: string;          // Número de série
}
```

### PrinterStatus

```typescript
interface PrinterStatus extends Printer {
  status: 'online' | 'offline';  // Status de conexão
  pageCount: number | null;      // Total de páginas impressas
  toner: TonerLevels;            // Níveis de toner
  lastUpdate: string;            // ISO timestamp
}

interface TonerLevels {
  [color: string]: TonerLevel;
}

interface TonerLevel {
  level: number;    // Percentual 0-100
  color: string;    // Nome da cor (Black, Cyan, etc)
}
```

### DiscoveryResult

```typescript
interface DiscoveryResult {
  discovered: DiscoveredPrinter[];
  count: number;
}

interface DiscoveredPrinter {
  ip: string;
  model: string;
  manufacturer: string;
  serial: string;
}
```

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso - Requisição processada com sucesso |
| `400` | Bad Request - Parâmetros inválidos |
| `404` | Not Found - Recurso não encontrado |
| `500` | Internal Server Error - Erro interno do servidor |

---

## Exemplos de Uso

### JavaScript (Fetch API)

```javascript
// Obter lista de impressoras
async function getPrinters() {
  const response = await fetch('http://localhost:3000/api/printers');
  const data = await response.json();
  console.log(data.printers);
}

// Obter status em tempo real
async function getPrinterStatus() {
  const response = await fetch('http://localhost:3000/api/printers/status');
  const printers = await response.json();
  console.log(printers);
}

// Atualizar impressora
async function updatePrinter(id, updates) {
  const response = await fetch(`http://localhost:3000/api/printers/${id}/update`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  const result = await response.json();
  console.log(result);
}

// Descobrir impressoras
async function discoverPrinters(startIP, endIP) {
  const response = await fetch('http://localhost:3000/api/discover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ startIP, endIP })
  });
  const result = await response.json();
  console.log(`Encontradas ${result.count} impressoras`);
}

// Forçar refresh
async function refreshStatus() {
  const response = await fetch('http://localhost:3000/api/printers/refresh', {
    method: 'POST'
  });
  const result = await response.json();
  console.log(result.message);
}
```

### Python (requests)

```python
import requests

BASE_URL = 'http://localhost:3000/api'

# Obter lista de impressoras
def get_printers():
    response = requests.get(f'{BASE_URL}/printers')
    return response.json()['printers']

# Obter status
def get_printer_status():
    response = requests.get(f'{BASE_URL}/printers/status')
    return response.json()

# Atualizar impressora
def update_printer(printer_id, updates):
    response = requests.patch(
        f'{BASE_URL}/printers/{printer_id}/update',
        json=updates
    )
    return response.json()

# Descobrir impressoras
def discover_printers(start_ip, end_ip):
    response = requests.post(
        f'{BASE_URL}/discover',
        json={'startIP': start_ip, 'endIP': end_ip}
    )
    return response.json()

# Exemplo de uso
printers = get_printer_status()
for printer in printers:
    print(f"{printer['name']}: {printer['status']}")
    if printer['status'] == 'online':
        print(f"  Páginas: {printer['pageCount']}")
        for color, data in printer['toner'].items():
            print(f"  {data['color']}: {data['level']}%")
```

### PowerShell

```powershell
# Obter status das impressoras
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/printers/status" -Method Get

foreach ($printer in $response) {
    Write-Host "$($printer.name): $($printer.status)"
    if ($printer.status -eq "online") {
        Write-Host "  Páginas: $($printer.pageCount)"
        foreach ($toner in $printer.toner.PSObject.Properties) {
            Write-Host "  $($toner.Value.color): $($toner.Value.level)%"
        }
    }
}

# Atualizar impressora
$body = @{
    name = "Nova Impressora"
    serial = "ABC123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/printers/1/update" `
                  -Method Patch `
                  -Body $body `
                  -ContentType "application/json"
```

---

## Rate Limiting

Atualmente não há rate limiting implementado. Para uso em produção, considere implementar:

- Limite de requisições por IP
- Throttling para endpoints de descoberta
- Cache de resposta para reduzir carga

---

## Websockets (Futuro)

Planejado para versões futuras: suporte a WebSockets para atualizações em tempo real sem polling.

```javascript
// Exemplo futuro
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Atualização recebida:', update);
};
```

---

**Última atualização**: 2026-01-07
