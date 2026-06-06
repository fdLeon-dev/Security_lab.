# 19. Manual Técnico de Producción (Fase 5)

## Objetivo

Establecer la configuración técnica para ejecutar Devices Security Lab V2.0 en modo mixto:

- Plataforma privada autenticada
- Portafolio público indexable

## Modo privado y modo público

### Público

- `/`
- `/portfolio`
- `/signin`
- `/api/public/*`
- `/api/health`

### Privado (autenticación requerida)

- `/dashboard`, `/knowledge`, `/learning`, `/labs`, `/writeups`, `/certifications`, `/projects`, `/toolkit`, `/siem`, `/inventory`
- Todo `/api/*` excepto `/api/auth/*`, `/api/health`, `/api/public/*`

## Middleware de seguridad

`middleware.ts` aplica:

1. Control de sesión por ruta (redirección a signin o 401 para API)
2. RBAC en `/api/audit/*` (solo `OWNER` y `ADMIN`)
3. Rate limiting por IP para API (80 req/min)
4. Security headers (CSP, HSTS en producción, COOP, CORP, XFO, nosniff)

## SEO

- Metadata enriquecida en `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- Open Graph compartido via `public/og-image.svg`

## Performance

- `next.config.ts` con `output: "standalone"`
- Cache para portfolio (`unstable_cache`, revalidate 300s)
- Rutas públicas con payloads reducidos (select/take)
- Docker runtime optimizado con standalone output

## Auditoría

- Servicio: `src/server/modules/audit/audit.service.ts`
- Eventos auth: sign in success/fail, sign out
- Endpoint de revisión: `GET /api/audit/recent?limit=50`

## Variables de entorno requeridas

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXTAUTH_SECRET`
- `APP_ENV`

## Verificación de release local

1. `npm ci`
2. `npm run prisma:generate`
3. `npm run lint`
4. `npm run test`
5. `npm run build`
6. `docker compose up --build`
