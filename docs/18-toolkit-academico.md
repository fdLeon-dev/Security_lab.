# 18. Fase 4 — Toolkit Académico Defensivo

## Índice

1. [Objetivos](#1-objetivos)
2. [Arquitectura](#2-arquitectura)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Herramientas implementadas](#4-herramientas-implementadas)
5. [API Routes](#5-api-routes)
6. [Seguridad](#6-seguridad)
7. [UI](#7-ui)
8. [Tests](#8-tests)
9. [Migraciones y seeds](#9-migraciones-y-seeds)
10. [Criterios de exclusión](#10-criterios-de-exclusión)

---

## 1. Objetivos

Proporcionar a los estudiantes un conjunto de herramientas defensivas y educativas para aprender conceptos básicos de ciberseguridad desde la perspectiva del defensor:

- Análisis de DNS, TLS y logs
- Generación y verificación de hashes
- Utilidades de codificación (Base64, JSON)
- Evaluación de política de contraseñas sin almacenarlas

---

## 2. Arquitectura

```
src/
├── app/
│   ├── (platform)/toolkit/page.tsx       ← Página principal (Server Component)
│   └── api/toolkit/
│       ├── dns/route.ts                  ← POST /api/toolkit/dns
│       ├── ssl/route.ts                  ← POST /api/toolkit/ssl
│       ├── logs/route.ts                 ← POST /api/toolkit/logs
│       ├── hash/route.ts                 ← POST /api/toolkit/hash
│       ├── json/route.ts                 ← POST /api/toolkit/json
│       ├── base64/route.ts               ← POST /api/toolkit/base64
│       ├── password-policy/route.ts      ← POST /api/toolkit/password-policy
│       ├── history/route.ts              ← GET  /api/toolkit/history
│       └── dashboard/route.ts            ← GET  /api/toolkit/dashboard
├── components/toolkit/
│   ├── toolkit-dashboard.tsx             ← UI principal (Client Component)
│   ├── toolkit-history.tsx               ← Panel de historial
│   └── tools/
│       ├── dns-lookup.tsx
│       ├── ssl-checker.tsx
│       ├── log-analyzer.tsx
│       ├── hash-utilities.tsx
│       ├── json-formatter.tsx
│       ├── base64-tool.tsx
│       └── password-checker.tsx
└── server/modules/toolkit/
    ├── toolkit.service.ts                ← Lógica de negocio, historial
    └── toolkit.service.test.ts           ← Tests unitarios (7 tests)
```

El rate limiting está gestionado por el middleware global en `middleware.ts` (80 req/min por IP para todas las rutas `/api/*`). No se requiere lógica adicional por herramienta.

---

## 3. Modelo de datos

El modelo `ToolkitReport` ya existía en el schema de Prisma:

```prisma
model ToolkitReport {
  id        String   @id @default(cuid())
  toolName  String
  input     String
  output    String
  createdAt DateTime @default(now())
}
```

- `toolName`: identificador interno de la herramienta (`dns_lookup`, `ssl_checker`, etc.)
- `input`: texto de entrada sanitizado (max 2000 chars)
- `output`: resultado serializado (max 8000 chars)
- Las contraseñas **NUNCA** se almacenan en `ToolkitReport`

---

## 4. Herramientas implementadas

### 4.1 DNS Lookup

- **Endpoint**: `POST /api/toolkit/dns`
- **Descripción**: Consulta los registros DNS de un dominio usando la API pública de Google DNS over HTTPS (`dns.google/resolve`)
- **Validaciones**:
  - Dominio: mínimo 3, máximo 253 caracteres
  - Regex estricta: solo caracteres DNS válidos (RFC 1123)
- **Tipos de registro mostrados**: A, AAAA, NS, CNAME, MX, TXT, SOA, SRV

### 4.2 SSL Checker

- **Endpoint**: `POST /api/toolkit/ssl`
- **Descripción**: Conecta via TLS al dominio/puerto indicado y extrae los metadatos del certificado
- **Datos devueltos**: sujeto (CN, O), emisor (O, C), válido desde/hasta, huella SHA-1, días restantes
- **Alertas visuales**: verde (>30 días), amarillo (≤30 días), rojo (expirado)
- **Timeout**: 8 segundos
- **Nota de seguridad**: `rejectUnauthorized: false` es intencional para poder inspeccionar certificados inválidos; no se usa para autenticación

### 4.3 Log Analyzer

- **Endpoint**: `POST /api/toolkit/logs`
- **Descripción**: Procesa contenido de log línea a línea, clasifica cada línea por nivel y aplica filtros
- **Niveles**: DEBUG, INFO, WARN, ERROR (clasificados por regex sobre palabras clave)
- **Límites**: contenido máximo 100 KB, búsqueda máximo 200 chars, retorna máximo 200 líneas
- **Historial**: guarda estadísticas (no el log completo)

### 4.4 Hash Utilities

- **Endpoint**: `POST /api/toolkit/hash`
- **Descripción**: Calcula hashes criptográficos usando el módulo nativo `node:crypto`
- **Algoritmos**: SHA-256, SHA-512, MD5
- **Nota educativa**: MD5 se incluye con fines académicos y de compatibilidad histórica; no se recomienda para uso criptográfico

### 4.5 JSON Formatter

- **Endpoint**: `POST /api/toolkit/json`
- **Descripción**: Parsea y re-serializa JSON con sangría configurable (2 o 4 espacios)
- **Validaciones**: input máximo 100 KB

### 4.6 Base64 Encoder/Decoder

- **Endpoint**: `POST /api/toolkit/base64`
- **Descripción**: Codifica texto UTF-8 a Base64 o decodifica Base64 a texto plano usando `Buffer` nativo de Node.js
- **Modos**: `encode` | `decode`

### 4.7 Password Policy Checker

- **Endpoint**: `POST /api/toolkit/password-policy`
- **Descripción**: Evalúa una contraseña contra políticas de complejidad y estima la entropía
- **IMPORTANTE**: La contraseña **nunca se persiste**. Se evalúa en memoria y se descarta. No se registra en `ToolkitReport`.
- **Criterios evaluados**:
  1. Mínimo 12 caracteres
  2. Al menos una mayúscula
  3. Al menos una minúscula
  4. Al menos un dígito
  5. Al menos un carácter especial
  6. Sin espacios
  7. Sin secuencias repetidas obvias (`aaa`, `111`)
- **Entropía**: fórmula `H ≈ L × log₂(N)` donde L = longitud, N = tamaño del charset utilizado
- **Niveles de fortaleza**: weak (<40 bits o <50%), moderate, strong, very_strong (≥80 bits y ≥90%)

---

## 5. API Routes

| Método | Ruta                          | Descripción             | Historial |
|--------|-------------------------------|-------------------------|-----------|
| POST   | /api/toolkit/dns              | DNS Lookup              | Sí        |
| POST   | /api/toolkit/ssl              | SSL Checker             | Sí        |
| POST   | /api/toolkit/logs             | Log Analyzer            | Sí        |
| POST   | /api/toolkit/hash             | Hash Utilities          | Sí        |
| POST   | /api/toolkit/json             | JSON Formatter          | Sí        |
| POST   | /api/toolkit/base64           | Base64 Enc/Dec          | Sí        |
| POST   | /api/toolkit/password-policy  | Password Policy Checker | **No**    |
| GET    | /api/toolkit/history          | Historial de consultas  | —         |
| GET    | /api/toolkit/dashboard        | Stats de uso            | —         |

Todas las rutas POST validan entrada con Zod. Errores de validación devuelven HTTP 400.

---

## 6. Seguridad

### Rate Limiting

El middleware global (`middleware.ts`) aplica 80 requests/min por IP a todas las rutas `/api/*`. Respuesta en exceso: HTTP 429.

### Validación de entradas

- Todas las rutas validan con esquemas Zod con límites explícitos de longitud
- Dominios validados con regex RFC 1123 — no se admiten rangos de IP ni URLs con esquema
- `sanitizeText()` aplicado al campo `input` antes de persistir en `ToolkitReport`

### Seguridad de contraseñas

- La ruta `/api/toolkit/password-policy` no almacena la contraseña evaluada
- No se registra en ningún log ni tabla

### Headers HTTP

El middleware aplica automáticamente a todas las respuestas:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` restrictiva
- `Permissions-Policy`

### OWASP Top 10 — controles aplicados

| Riesgo                  | Control                                          |
|-------------------------|--------------------------------------------------|
| A01 Broken Access       | Rutas protegidas por NextAuth session            |
| A03 Injection           | Zod validation + sanitizeText() + no ORM concat |
| A05 Security Misconfig  | Security headers via middleware                  |
| A07 Auth Failures       | Rate limiting 80 req/min                        |
| A09 Logging             | ToolkitReport persiste inputs sanitizados        |

---

## 7. UI

### Estructura

`ToolkitDashboard` (Client Component) orquesta 8 tabs:

```
Tabs:
 DNS Lookup | SSL Checker | Log Analyzer | Hash Utilities
 JSON Formatter | Base64 | Password Policy | Historial
```

- Cada tool es un componente independiente con estado local
- El historial carga `GET /api/toolkit/history` y `GET /api/toolkit/dashboard` en paralelo
- La UI usa la paleta Tailwind `slate-*` con acento `sky-400` consistente con el resto de la plataforma

---

## 8. Tests

**Archivo**: `src/server/modules/toolkit/toolkit.service.test.ts`

| Test                                          | Resultado |
|-----------------------------------------------|-----------|
| saveToolkitReport crea reporte correctamente  | ✓         |
| sanitizeText elimina caracteres HTML          | ✓         |
| Trunca input >2000 chars                      | ✓         |
| Trunca output >8000 chars                     | ✓         |
| getToolkitHistory sin filtro                  | ✓         |
| getToolkitHistory filtra por toolName         | ✓         |
| getToolkitDashboard devuelve recent + stats   | ✓         |

**Total**: 14 tests passing (6 test files) — `EXIT:0`

---

## 9. Migraciones y seeds

El modelo `ToolkitReport` ya existía en el schema desde una fase anterior. No se requiere nueva migración SQL.

Para seeds de ejemplo, ejecutar `npm run prisma:seed` — el seed existente no modifica ToolkitReport (no hay datos de ejemplo predefinidos para el toolkit, ya que el historial se genera con el uso de las herramientas).

---

## 10. Criterios de exclusión

Los siguientes tipos de funcionalidad fueron **excluidos deliberadamente** del toolkit:

| Funcionalidad               | Motivo de exclusión                                   |
|-----------------------------|-------------------------------------------------------|
| Port scanner / Nmap wrapper | Herramienta ofensiva, violación de TOS en redes ajenas |
| WHOIS lookup                | Potencial para recon de objetivos; fuera del alcance   |
| Subdomain enumeration       | Recon ofensivo                                         |
| Exploit databases           | No educativo en este contexto                          |
| Password cracking           | Ofensivo                                               |
| Network packet capture      | Requiere privilegios y es herramienta ofensiva         |

El módulo cumple estrictamente con el principio de **herramientas defensivas y educativas**.
