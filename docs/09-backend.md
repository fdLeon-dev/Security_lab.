# 09. Backend

## API Routes implementadas
- GET /api/health
- GET /api/dashboard
- GET|POST /api/knowledge
- GET /api/labs
- GET|POST /api/siem/events
- POST /api/toolkit/dns

## Patrones
- Service Layer por feature.
- Validacion de payloads con Zod.
- Fallback controlado ante errores de DB.
- Diseño preparado para aplicar RBAC por rol.
