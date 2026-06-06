# Devices Security Lab V2.0

Plataforma dual para ciberseguridad defensiva:

- Modo privado para gestión académica y operación de laboratorio
- Modo público para portafolio profesional

## Modos de operación

### 1) Private Platform

Acceso autenticado con NextAuth para módulos internos:

- Dashboard
- Knowledge Hub
- Learning Tracker
- Lab Manager
- Writeup Center
- Certification Tracker
- Project Management
- Toolkit defensivo
- SIEM Academy
- Home Lab Inventory

### 2) Public Portfolio

Acceso abierto en `/portfolio` para mostrar:

- Proyectos
- Certificaciones
- Writeups públicos
- Stack tecnológico
- Timeline profesional

## Stack técnico

- Next.js 16 (App Router) + React + TypeScript
- Tailwind CSS v4
- Prisma ORM + PostgreSQL
- NextAuth (credentials)
- Vitest (unit + integration)
- Docker multi-stage (standalone build)
- GitHub Actions (CI + release)

## Seguridad

- Middleware con auth guard por rutas privadas
- RBAC para endpoints de auditoría (`OWNER`/`ADMIN`)
- Rate limiting API (80 req/min por IP)
- Security headers (CSP, HSTS en producción, COOP, CORP, nosniff)
- Validación de entradas con Zod
- Auditoría de eventos críticos (auth y acceso portfolio público)

## SEO

- Metadata avanzada (Open Graph + Twitter)
- `sitemap.xml` generado por App Router
- `robots.txt` generado por App Router
- Imagen OG en `public/og-image.svg`

## Performance

- Queries públicas optimizadas con `select`/`take`
- Cache en servicio de portfolio (`revalidate: 300s`)
- Next standalone output para despliegue eficiente

## Puesta en marcha local

1. `npm ci`
2. Copiar `.env.example` a `.env`
3. `npm run prisma:generate`
4. `npm run prisma:push`
5. `npm run prisma:seed`
6. `npm run dev`

Credenciales seed:

- Email: `owner@deviceslab.local`
- Password: `ChangeMe123!`

## Comandos de calidad

- `npm run lint`
- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run coverage`
- `npm run build`
- `npm run release:check`

## Docker

- Build local: `npm run docker:build`
- Orquestación: `docker compose up --build`

## CI/CD

- CI: `.github/workflows/ci.yml`
	- lint, unit, integration, coverage, build, docker build validation
- Release: `.github/workflows/release.yml`
	- build + push image a GHCR en tags `v*`

## Documentación

Revisar `docs/` para manual técnico, manual de usuario, arquitectura, roadmap y reporte final de release v2.0.
