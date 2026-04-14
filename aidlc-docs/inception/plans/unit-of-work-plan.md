# Plan de Units Generation
## Sistema de Solicitud de Laboratorios (APP-DX)

---

## Contexto

El `execution-plan.md` ya definió las 7 unidades de trabajo. Este plan confirma su decomposición final, la organización de código en el repositorio y el mapeo de historias, para generar los 3 artefactos obligatorios.

---

## Unidades de Trabajo Propuestas (del execution-plan.md)

| # | Unidad | Descripción | Dependencias |
|---|---|---|---|
| UDT-01 | Application Layer | ResponseDto, PaginatedResponseDto, GlobalExceptionFilter, ValidationPipe, Helmet | — |
| UDT-02 | Users + Auth | Usuarios, JWT, refresh tokens, guards, roles | UDT-01 |
| UDT-03 | Patients | Ampliar Foundation (soft delete, auditoría, paginación, guards) | UDT-01, UDT-02 |
| UDT-04 | Orders | Ampliar Foundation (flujo clínico, guards, paginación) | UDT-01, UDT-02, UDT-03 |
| UDT-05 | Results | Nuevo módulo CRUD básico | UDT-01, UDT-02, UDT-04 |
| UDT-06 | Appointments | Nuevo módulo CRUD básico | UDT-01, UDT-02, UDT-03, UDT-04 |
| UDT-07 | Docker Compose + Testing | Infraestructura de despliegue y tests | Todos |

---

## Preguntas de Planificación

### Q1 — Estructura de directorios del código fuente

Confirma la estructura de carpetas que usaremos para la aplicación NestJS:

**Opción A — Estándar NestJS plano**
```
src/
  auth/
  users/
  patients/
  orders/
  results/
  appointments/
  common/
  app.module.ts
  main.ts
```

**Opción B — Agrupado por módulos explícitos**
```
src/
  modules/
    auth/
    users/
    patients/
    orders/
    results/
    appointments/
  common/
  app.module.ts
  main.ts
```

**Opción C — Otra estructura** (especifica cuál)

[B]: 

---

### Q2 — Organización interna de cada módulo

Dentro de cada carpeta de módulo (ej. `orders/`), ¿qué convención interna prefieres?

**Opción A — Sin subcarpetas** (archivos planos en la carpeta del módulo)
```
orders/
  orders.module.ts
  orders.controller.ts
  orders.service.ts
  orders.repository.ts  (opcional)
  dto/
    create-order.dto.ts
    update-order-status.dto.ts
  entities/
    order.entity.ts
```

**Opción B — Con capa explícita** (separación por responsabilidad)
```
orders/
  controllers/
    orders.controller.ts
  services/
    orders.service.ts
  dto/
  entities/
  orders.module.ts
```

[A]: 

---

## Artefactos a Generar

- [x] `aidlc-docs/inception/application-design/unit-of-work.md`
- [x] `aidlc-docs/inception/application-design/unit-of-work-dependency.md`
- [x] `aidlc-docs/inception/application-design/unit-of-work-story-map.md`
