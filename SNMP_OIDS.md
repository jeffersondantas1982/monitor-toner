# Referência de OIDs SNMP

Este documento lista todos os OIDs SNMP utilizados pelo Monitor de Toner para coletar informações das impressoras.

## 📚 Índice

- [OIDs Padrão (Printer MIB)](#oids-padrão-printer-mib)
- [OIDs Específicos HP](#oids-específicos-hp)
- [OIDs Específicos Pantum](#oids-específicos-pantum)
- [Community Strings](#community-strings)
- [Referências](#referências)

---

## OIDs Padrão (Printer MIB)

Baseados no RFC 3805 - Printer MIB v2

### Informações do Dispositivo

| OID | Descrição | Tipo |
|-----|-----------|------|
| `1.3.6.1.2.1.25.3.2.1.3.1` | Device Description | String |
| `1.3.6.1.2.1.25.3.2.1.5.1` | Device Status | Integer |

### Contador de Páginas

| OID | Descrição | Tipo |
|-----|-----------|------|
| `1.3.6.1.2.1.43.10.2.1.4.1.1` | Total Pages Printed | Counter32 |
| `1.3.6.1.2.1.43.10.2.1.5.1.1` | Page Count Current (alternate) | Counter32 |

### Níveis de Suprimentos (Genérico)

| OID | Descrição | Tipo |
|-----|-----------|------|
| `1.3.6.1.2.1.43.11.1.1.6` | Supply Level (walk) | Integer |
| `1.3.6.1.2.1.43.11.1.1.7` | Supply Max Capacity | Integer |
| `1.3.6.1.2.1.43.11.1.1.8` | Supply Max Capacity (alternate) | Integer |
| `1.3.6.1.2.1.43.11.1.1.9` | Supply Level (walk alternate) | Integer |

---

## OIDs Específicos HP

### Níveis de Toner

| OID | Descrição | Cor | Tipo |
|-----|-----------|-----|------|
| `1.3.6.1.2.1.43.11.1.1.9.1.1` | Black Toner Level | Preto | Integer (0-100) |
| `1.3.6.1.2.1.43.11.1.1.9.1.2` | Cyan Toner Level | Ciano | Integer (0-100) |
| `1.3.6.1.2.1.43.11.1.1.9.1.3` | Magenta Toner Level | Magenta | Integer (0-100) |
| `1.3.6.1.2.1.43.11.1.1.9.1.4` | Yellow Toner Level | Amarelo | Integer (0-100) |

### Informações do Dispositivo

| OID | Descrição | Tipo |
|-----|-----------|------|
| `1.3.6.1.4.1.11.2.3.9.4.2.1.1.3.3.0` | HP Serial Number | String |
| `1.3.6.1.4.1.11.2.3.9.4.2.1.3.3.0` | HP Serial Number (alternate) | String |
| `1.3.6.1.4.1.11.2.3.9.1.1.7.0` | HP Device Type | String |

### Contador de Páginas HP

| OID | Descrição | Tipo |
|-----|-----------|------|
| `1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6.0` | HP Total Pages | Counter32 |
| `1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.5.0` | HP Pages Printed | Counter32 |

---

## OIDs Específicos Pantum

### Níveis de Toner

| OID | Descrição | Tipo |
|-----|-----------|------|
| `1.3.6.1.4.1.40093.1.1.2.1.5.1.0` | Pantum Toner Level | Integer (0-100) |

**Nota**: Impressoras Pantum monocromáticas possuem apenas um cartucho de toner.

### Contador de Páginas

O sistema implementa múltiplas estratégias de fallback para obter o contador de páginas:

| Prioridade | OID | Descrição | Tipo |
|------------|-----|-----------|------|
| 1 | `1.3.6.1.4.1.40093.1.1.1.1.24` | Pantum Total Pages (Primary) | Counter32 |
| 2 | `1.3.6.1.2.1.43.10.2.1.4.1.1` | Standard Printer MIB | Counter32 |
| 3 | Outros OIDs padrão | Fallback genérico | Counter32 |

### Serial Number

O sistema tenta múltiplos OIDs e também faz scraping da interface web:

| Método | OID/URL | Descrição |
|--------|---------|-----------|
| SNMP 1 | `1.3.6.1.4.1.40093.1.1.1.1.11` | Pantum Serial (Primary) |
| SNMP 2 | `1.3.6.1.4.1.40093.1.1.1.1.10` | Pantum Serial (Alternate 1) |
| SNMP 3 | `1.3.6.1.4.1.40093.5.1.1.17.1` | Pantum Serial (Alternate 2) |
| SNMP 4 | `1.3.6.1.4.1.40093.1.1.1.1.24` | Pantum Serial (Alternate 3) |
| Web | `http://[IP]/printer.html` | Web Interface Scraping |

**Nota**: A interface web geralmente é mais confiável para obter o serial number em impressoras Pantum.

---

## Community Strings

O sistema tenta automaticamente as seguintes community strings em ordem:

1. **`public`** - Padrão SNMP v1/v2c
2. **`v2cpublic`** - Alternativa comum em impressoras modernas

### Portas

- **Porta UDP**: 161 (padrão SNMP)
- **Timeout**: 5000ms
- **Retries**: 3 tentativas

---

## Estratégias de Fallback

### Para Contador de Páginas

```javascript
// Ordem de tentativa:
1. OID específico do fabricante (HP/Pantum)
2. OID padrão 1.3.6.1.2.1.43.10.2.1.4.1.1
3. OID alternativo 1.3.6.1.2.1.43.10.2.1.5.1.1
4. SNMP Walk em 1.3.6.1.2.1.43.10.2.1.4
```

### Para Níveis de Toner

```javascript
// Ordem de tentativa:
1. OIDs específicos por cor (HP) ou monocromático (Pantum)
2. SNMP Walk em 1.3.6.1.2.1.43.11.1.1.9
3. SNMP Walk em 1.3.6.1.2.1.43.11.1.1.6
```

### Para Serial Number

```javascript
// Ordem de tentativa:
1. OID específico do fabricante
2. OID padrão de serial
3. Interface web (Pantum)
4. Valor armazenado em cache (printers.json)
```

---

## Referências

- **RFC 3805**: Printer MIB v2 - [https://www.rfc-editor.org/rfc/rfc3805](https://www.rfc-editor.org/rfc/rfc3805)
- **RFC 1213**: MIB-II - [https://www.rfc-editor.org/rfc/rfc1213](https://www.rfc-editor.org/rfc/rfc1213)
- **HP MIB Reference**: Enterprise OIDs - 1.3.6.1.4.1.11
- **Pantum MIB Reference**: Enterprise OIDs - 1.3.6.1.4.1.40093
- **SNMP Protocol**: [https://www.snmp.com/](https://www.snmp.com/)

---

## Notas de Implementação

### Identificação de Cores (Toner)

O sistema identifica as cores dos cartuchos através dos índices do OID:

- **.1** = Black (Preto)
- **.2** = Cyan (Ciano)
- **.3** = Magenta
- **.4** = Yellow (Amarelo)

### Cálculo de Percentual

```javascript
// Para valores absolutos (HP):
percentage = value; // Já vem em 0-100

// Para valores com capacidade máxima:
percentage = (currentLevel / maxCapacity) * 100;
```

### Cache e Performance

- Os valores são armazenados em cache no servidor
- Atualização automática a cada 5 minutos
- Requisições manuais forçam atualização imediata

---

**Última atualização**: 2026-01-07
