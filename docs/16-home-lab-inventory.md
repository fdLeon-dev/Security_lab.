# 16. Fase 2.4 - Home Lab Inventory

## Alcance implementado
- CRUD completo para Asset, VirtualMachine, Network y Service.
- Inventario empresarial con data tables y tarjetas de resumen.
- Relaciones de dominio entre activos, VMs, redes y servicios.
- Búsqueda y filtros por entidad.
- Paginación por listado.

## Entidades

### Asset
- id
- name
- type
- manufacturer
- operatingSystem
- ipAddress
- notes
- networkId (relación con Network)

### VirtualMachine
- id
- name
- os
- resources
- hypervisor
- assetId (relación opcional con Asset)
- networkId (relación opcional con Network)

### Network
- id
- name
- subnet
- gateway
- notes

### Service
- id
- name
- protocol
- port
- assetId (relación requerida con Asset)

## Relaciones
- Asset pertenece a User.
- Network pertenece a User.
- VirtualMachine pertenece a User.
- Service pertenece a User.
- Asset puede pertenecer opcionalmente a una Network.
- VirtualMachine puede estar asociada opcionalmente a un Asset host y a una Network.
- Service pertenece obligatoriamente a un Asset.
- Asset tiene múltiples Service.

## Dashboard de Home Lab Inventory
- Equipos (Assets)
- Máquinas virtuales (VirtualMachines)
- Redes (Networks)
- Servicios (Services)

## Endpoints
- GET `/api/inventory/dashboard`
- GET `/api/inventory/lookups`

### Assets
- GET `/api/inventory/assets`
- POST `/api/inventory/assets`
- GET `/api/inventory/assets/[id]`
- PATCH `/api/inventory/assets/[id]`
- DELETE `/api/inventory/assets/[id]`

### Virtual Machines
- GET `/api/inventory/virtual-machines`
- POST `/api/inventory/virtual-machines`
- GET `/api/inventory/virtual-machines/[id]`
- PATCH `/api/inventory/virtual-machines/[id]`
- DELETE `/api/inventory/virtual-machines/[id]`

### Networks
- GET `/api/inventory/networks`
- POST `/api/inventory/networks`
- GET `/api/inventory/networks/[id]`
- PATCH `/api/inventory/networks/[id]`
- DELETE `/api/inventory/networks/[id]`

### Services
- GET `/api/inventory/services`
- POST `/api/inventory/services`
- GET `/api/inventory/services/[id]`
- PATCH `/api/inventory/services/[id]`
- DELETE `/api/inventory/services/[id]`

## Componentes y servicios
- `src/components/inventory/home-lab-inventory.tsx`
- `src/server/modules/inventory/inventory.service.ts`

## Persistencia
- Prisma schema actualizado con modelos Asset, VirtualMachine, Network y Service.
- Migración SQL:
  - `prisma/migrations/20260606_phase_2_4_home_lab_inventory/migration.sql`

## Notas operativas
1. Ejecutar `npm run prisma:generate`.
2. Aplicar migraciones en base de datos.
3. Ejecutar `npm run prisma:seed` para datos de ejemplo.
4. Ejecutar `npm run dev` para validar el módulo en `/inventory`.
