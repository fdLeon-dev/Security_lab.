# 17. Fase 3 - SIEM Academico

## Alcance implementado
- CRUD completo de eventos, reglas y alertas academicas.
- Clasificacion de eventos por categoria, severidad y timestamp.
- Generacion de alertas conceptuales a partir de eventos y reglas.
- Dashboard con eventos por severidad, alertas abiertas/cerradas y tendencias.
- Visualizacion con timeline, tablas, filtros y estadisticas.

## Objetivo educativo
- Simular el funcionamiento conceptual de un SIEM para aprendizaje.
- No conectar fuentes reales.
- No generar deteccion ofensiva.
- No incluir simulaciones de ataque.

## Entidades

### Event
- id
- source
- category
- severity
- timestamp
- description

### Rule
- id
- name
- condition
- severity

### Alert
- id
- title
- severity
- status
- eventId

## Relaciones
- Event pertenece a User.
- Rule pertenece a User.
- Alert pertenece a User.
- Alert referencia un Event.
- Alert puede vincularse opcionalmente a una Rule.

## Funcionalidades
- Crear eventos.
- Clasificar eventos.
- Crear reglas.
- Generar alertas academicas.
- Consultar dashboard.

## Endpoints
- GET `/api/siem/dashboard`

### Events
- GET `/api/siem/events`
- POST `/api/siem/events`
- GET `/api/siem/events/[id]`
- PATCH `/api/siem/events/[id]`
- DELETE `/api/siem/events/[id]`

### Rules
- GET `/api/siem/rules`
- POST `/api/siem/rules`
- GET `/api/siem/rules/[id]`
- PATCH `/api/siem/rules/[id]`
- DELETE `/api/siem/rules/[id]`

### Alerts
- GET `/api/siem/alerts`
- POST `/api/siem/alerts`
- GET `/api/siem/alerts/[id]`
- PATCH `/api/siem/alerts/[id]`
- DELETE `/api/siem/alerts/[id]`

## Componentes UI
- `src/components/siem/siem-academy.tsx`

## Servicios backend
- `src/server/modules/siem/siem.service.ts`

## Persistencia
- Prisma schema actualizado con:
  - `SiemEvent`
  - `SiemRule`
  - `SiemAlert`
  - enums `SiemEventCategory` y `SiemAlertStatus`
- Migracion SQL:
  - `prisma/migrations/20260606_phase_3_siem_academico/migration.sql`

## Panel de control
- Eventos por severidad.
- Alertas abiertas.
- Alertas cerradas.
- Tendencias.

## Visualizacion
- Timeline de alertas.
- Tablas por entidad.
- Filtros por categoria y estado.
- Estadisticas de aprendizaje.

## Notas operativas
1. Ejecutar `npm run prisma:generate`.
2. Aplicar migracion en base de datos.
3. Ejecutar `npm run prisma:seed` para datos academicos.
4. Ejecutar `npm run dev` y abrir `/siem`.
