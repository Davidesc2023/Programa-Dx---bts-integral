# Unidades de Trabajo
## Sistema de Solicitud de Laboratorios (APP-DX)

---

## Arquitectura de Código

### Estructura de directorios aprobada

```
src/
  modules/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      jwt.strategy.ts
      jwt-auth.guard.ts
      dto/
        register.dto.ts
        login.dto.ts
        refresh-token.dto.ts
        logout.dto.ts
        tokens-response.dto.ts
      entities/
        refresh-token.entity.ts
    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      dto/
        create-user.dto.ts
        update-user.dto.ts
        user-response.dto.ts
      entities/
        user.entity.ts
    patients/
      patients.module.ts
      patients.controller.ts
      patients.service.ts
      dto/
        create-patient.dto.ts
        update-patient.dto.ts
        patient-query.dto.ts
        patient-response.dto.ts
      entities/
        patient.entity.ts
    orders/
      orders.module.ts
      orders.controller.ts
      orders.service.ts
      dto/
        create-order.dto.ts
        update-order-status.dto.ts
        order-query.dto.ts
        order-response.dto.ts
      entities/
        order.entity.ts
        order-status.enum.ts
    results/
      results.module.ts
      results.controller.ts
      results.service.ts
      dto/
        create-result.dto.ts
        update-result.dto.ts
        result-response.dto.ts
      entities/
        result.entity.ts
    appointments/
      appointments.module.ts
      appointments.controller.ts
      appointments.service.ts
      dto/
        create-appointment.dto.ts
        update-appointment.dto.ts
        appointment-query.dto.ts
        appointment-response.dto.ts
      entities/
        appointment.entity.ts
  common/
    filters/
      global-exception.filter.ts
    dto/
      response.dto.ts
      paginated-response.dto.ts
      pagination-query.dto.ts
    guards/
      roles.guard.ts
    decorators/
      roles.decorator.ts
      current-user.decorator.ts
    helpers/
      soft-delete.helper.ts
  database/
    prisma.module.ts
    prisma.service.ts
  app.module.ts
  main.ts
```

---

## Definición de Unidades de Trabajo

### UDT-01 — Application Layer

| Campo | Valor |
|---|---|
| **Nombre** | Application Layer |
| **Tipo** | Módulo transversal (cross-cutting) |
| **Prioridad** | 1 — Base de todo lo demás |
| **Estimación** | S |

**Responsabilidades**:
- Configurar `main.ts` con `ValidationPipe` global (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`)
- Configurar `Helmet` como middleware global de seguridad HTTP
- Implementar `GlobalExceptionFilter` con manejo centralizado de errores Prisma (P2002→409, P2025→404) y eliminación de stack traces en producción
- Crear `ResponseDto<T>` con envelope `{ data, message, statusCode }`
- Crear `PaginatedResponseDto<T>` con `{ data, meta: { total, page, limit, totalPages } }`
- Crear `PaginationQueryDto` con `page: number` y `limit: number` (con defaults y validación `@IsInt`, `@Min`)
- Crear `PrismaModule` como módulo global con `PrismaService`
- Configurar `AppModule` con imports de todos los módulos de dominio

**Archivos a producir**:
- `src/main.ts`
- `src/app.module.ts`
- `src/database/prisma.module.ts`
- `src/database/prisma.service.ts`
- `src/common/filters/global-exception.filter.ts`
- `src/common/dto/response.dto.ts`
- `src/common/dto/paginated-response.dto.ts`
- `src/common/dto/pagination-query.dto.ts`
- `src/common/guards/roles.guard.ts`
- `src/common/decorators/roles.decorator.ts`
- `src/common/decorators/current-user.decorator.ts`
- `src/common/helpers/soft-delete.helper.ts`

---

### UDT-02 — Users + Auth

| Campo | Valor |
|---|---|
| **Nombre** | Users + Auth |
| **Tipo** | Módulo de dominio — Autenticación y control de acceso |
| **Prioridad** | 2 — Requerido por todos los módulos de negocio |
| **Estimación** | M |

**Responsabilidades**:
- Implementar `UsersService` con CRUD completo (create, findAll paginado, findOne, update, remove soft delete)
- Implementar `AuthService` con: registro (hash bcrypt 10 rondas), login, refreshToken, logout (invalidar refresh token), validación de usuario
- Integrar `PassportModule` + `@nestjs/jwt` con `JwtStrategy` (validación de payload)
- Generar `accessToken` (15 min) y `refreshToken` (7 días, almacenado en tabla `RefreshToken`)
- Implementar `JwtAuthGuard` extendiendo `AuthGuard('jwt')` de Passport
- Exportar `JwtAuthGuard` y `RolesGuard` para uso en módulos de dominio
- **Seguridad**: nunca exponer contraseña en respuestas, mensaje genérico "Credenciales inválidas" en 401, logout idempotente (200 aunque token ya invalidado)

**Archivos a producir**:
- `src/modules/users/users.module.ts`
- `src/modules/users/users.controller.ts`
- `src/modules/users/users.service.ts`
- `src/modules/users/dto/*.dto.ts`
- `src/modules/users/entities/user.entity.ts`
- `src/modules/auth/auth.module.ts`
- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/jwt.strategy.ts`
- `src/modules/auth/jwt-auth.guard.ts`
- `src/modules/auth/dto/*.dto.ts`
- `src/modules/auth/entities/refresh-token.entity.ts`

**Migraciones Prisma**:
- Tabla `User` (id, email, password, role, deletedAt, createdAt, updatedAt)
- Tabla `RefreshToken` (id, token, userId, expiresAt, createdAt)

---

### UDT-03 — Patients

| Campo | Valor |
|---|---|
| **Nombre** | Patients |
| **Tipo** | Módulo de dominio — Gestión de pacientes |
| **Prioridad** | 3 — Requerido por Orders y Appointments |
| **Estimación** | S |

**Responsabilidades**:
- Ampliar el modelo `Patient` de la Foundation con: `deletedAt`, `createdBy`, `updatedBy`
- Implementar `PatientsService` con CRUD completo + soft delete + auditoría (`createdBy/updatedBy` del JWT)
- Paginación con filtros por `documentNumber`, `documentType`, `email`
- Aplicar `JwtAuthGuard` + `RolesGuard` en todos los endpoints:
  - `POST /patients` → ADMIN, OPERADOR
  - `GET /patients` → ADMIN, OPERADOR, LABORATORIO
  - `GET /patients/:id` → ADMIN, OPERADOR, LABORATORIO
  - `PATCH /patients/:id` → ADMIN, OPERADOR
  - `DELETE /patients/:id` → ADMIN
- Exportar `PatientsService` para uso en `OrdersModule` y `AppointmentsModule`

**Archivos a producir**:
- `src/modules/patients/patients.module.ts`
- `src/modules/patients/patients.controller.ts`
- `src/modules/patients/patients.service.ts`
- `src/modules/patients/dto/*.dto.ts`
- `src/modules/patients/entities/patient.entity.ts`

**Migraciones Prisma**:
- Agregar campos `deletedAt`, `createdBy`, `updatedBy` a tabla `Patient` (Foundation ya tiene campos base)

---

### UDT-04 — Orders

| Campo | Valor |
|---|---|
| **Nombre** | Orders |
| **Tipo** | Módulo de dominio — Gestión de órdenes médicas con flujo clínico |
| **Prioridad** | 4 — Requerido por Results y Appointments |
| **Estimación** | M |

**Responsabilidades**:
- Ampliar el modelo `Order` de la Foundation con: flujo clínico completo, `physician`, `priority`, `observations`, `estimatedCompletionDate`, `deletedAt`, `createdBy`, `updatedBy`
- Implementar `OrdersService` con lógica de transición de estado:
  - `isValidTransition(current, next)` — mapa de transiciones permitidas
  - `PENDIENTE` → `MUESTRA_RECOLECTADA` → `EN_ANALISIS` → `COMPLETADA`
  - Estados terminales alternativos: `CANCELADA`, `RECHAZADA` (desde cualquier estado activo)
  - Transición inválida → `UnprocessableEntityException` (HTTP 422)
- Paginación con filtros por `status`, `patientId`, `priority`
- Aplicar `JwtAuthGuard` + `RolesGuard`:
  - `POST /orders` → ADMIN, OPERADOR
  - `GET /orders` → ADMIN, OPERADOR, LABORATORIO
  - `GET /orders/:id` → ADMIN, OPERADOR, LABORATORIO
  - `PATCH /orders/:id/status` → ADMIN, LABORATORIO
  - `DELETE /orders/:id` → ADMIN
- Exportar `OrdersService` para `ResultsModule` y `AppointmentsModule`

**Archivos a producir**:
- `src/modules/orders/orders.module.ts`
- `src/modules/orders/orders.controller.ts`
- `src/modules/orders/orders.service.ts`
- `src/modules/orders/dto/*.dto.ts`
- `src/modules/orders/entities/order.entity.ts`
- `src/modules/orders/entities/order-status.enum.ts`

**Migraciones Prisma**:
- Agregar campos extendidos y enum `OrderStatus` a tabla `Order`

---

### UDT-05 — Results

| Campo | Valor |
|---|---|
| **Nombre** | Results |
| **Tipo** | Módulo de dominio — Resultados de exámenes |
| **Prioridad** | 5 |
| **Estimación** | S |

**Responsabilidades**:
- Nuevo módulo `ResultsModule` con CRUD básico
- `ResultsService`: crear resultado vinculado a una `Order` (validar que orden exista y no esté cancelada/rechazada), listar por orden, actualizar, soft delete
- Aplicar guards:
  - `POST /results` → ADMIN, LABORATORIO
  - `GET /results?orderId=X` → ADMIN, OPERADOR, LABORATORIO
  - `PATCH /results/:id` → ADMIN, LABORATORIO
  - `DELETE /results/:id` → ADMIN

**Archivos a producir**:
- `src/modules/results/results.module.ts`
- `src/modules/results/results.controller.ts`
- `src/modules/results/results.service.ts`
- `src/modules/results/dto/*.dto.ts`
- `src/modules/results/entities/result.entity.ts`

**Migraciones Prisma**:
- Nueva tabla `Result` (id, orderId, examType, value, unit, referenceRange, notes, deletedAt, createdBy, updatedBy, createdAt, updatedAt)

---

### UDT-06 — Appointments

| Campo | Valor |
|---|---|
| **Nombre** | Appointments |
| **Tipo** | Módulo de dominio — Agendamiento básico |
| **Prioridad** | 6 |
| **Estimación** | S |

**Responsabilidades**:
- Nuevo módulo `AppointmentsModule` con CRUD básico
- `AppointmentsService`: crear cita vinculada a `Patient` y opcionalmente a `Order`, listar con filtros por `patientId` y fecha, consultar detalle, actualizar, soft delete
- Aplicar guards:
  - `POST /appointments` → ADMIN, OPERADOR
  - `GET /appointments` → ADMIN, OPERADOR, LABORATORIO
  - `GET /appointments/:id` → ADMIN, OPERADOR, LABORATORIO
  - `PATCH /appointments/:id` → ADMIN, OPERADOR
  - `DELETE /appointments/:id` → ADMIN

**Archivos a producir**:
- `src/modules/appointments/appointments.module.ts`
- `src/modules/appointments/appointments.controller.ts`
- `src/modules/appointments/appointments.service.ts`
- `src/modules/appointments/dto/*.dto.ts`
- `src/modules/appointments/entities/appointment.entity.ts`

**Migraciones Prisma**:
- Nueva tabla `Appointment` (id, patientId, orderId?, scheduledAt, status, notes, deletedAt, createdBy, updatedBy, createdAt, updatedAt)

---

### UDT-07 — Docker Compose + Testing

| Campo | Valor |
|---|---|
| **Nombre** | Docker Compose + Testing |
| **Tipo** | Infraestructura y calidad |
| **Prioridad** | 7 — Al final, cuando todo el código esté integrado |
| **Estimación** | M |

**Responsabilidades**:
- `docker-compose.yml` con servicios: PostgreSQL y la app NestJS
- `Dockerfile` multi-stage (build + production) para la app
- `.env.example` documentado con todas las variables requeridas
- Configurar script de inicio del contenedor para ejecutar migraciones Prisma antes de arrancar
- Tests unitarios (Jest) por servicio con mocks de `PrismaService`
- Tests de integración (Supertest) con base de datos de prueba separada
- Configurar `jest.config.js` y separar suites unit/e2e

**Archivos a producir**:
- `docker-compose.yml`
- `Dockerfile`
- `.env.example`
- `jest.config.js`
- `test/` — tests de integración
- `src/**/*.spec.ts` — tests unitarios por módulo
