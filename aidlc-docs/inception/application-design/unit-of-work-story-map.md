# Mapa de Historias por Unidad de Trabajo
## Sistema de Solicitud de Laboratorios (APP-DX)

---

## Resumen de Cobertura

| Unidad | Historias | Total |
|---|---|---|
| UDT-01 — Application Layer | *(transversal — soporte para todas)* | — |
| UDT-02 — Users + Auth | HU-AUTH-01, HU-AUTH-02, HU-AUTH-03, HU-AUTH-04, HU-USR-01, HU-USR-02, HU-USR-03, HU-USR-04 | 8 |
| UDT-03 — Patients | HU-PAT-01, HU-PAT-02, HU-PAT-03, HU-PAT-04, HU-PAT-05 | 5 |
| UDT-04 — Orders | HU-ORD-01, HU-ORD-02, HU-ORD-03, HU-ORD-04, HU-ORD-05, HU-ORD-06 | 6 |
| UDT-05 — Results | HU-RES-01, HU-RES-02, HU-RES-03, HU-RES-04 | 4 |
| UDT-06 — Appointments | HU-AGE-01, HU-AGE-02, HU-AGE-03, HU-AGE-04, HU-AGE-05 | 5 |
| UDT-07 — Docker + Testing | *(infraestructura — valida todas las historias)* | — |
| **Total** | | **28** |

---

## UDT-01 — Application Layer

> Unidad transversal sin historias directas. Provee la infraestructura técnica que habilita todos los demás módulos: ValidationPipe, GlobalExceptionFilter, ResponseDto, PaginatedResponseDto, PrismaService, guardas y decoradores comunes.

---

## UDT-02 — Users + Auth

### Épica 1: Autenticación y Sesión

| ID | Historia | Endpoint principal |
|---|---|---|
| HU-AUTH-01 | Registro de usuario | `POST /auth/register` |
| HU-AUTH-02 | Login | `POST /auth/login` |
| HU-AUTH-03 | Renovación de token (refresh) | `POST /auth/refresh` |
| HU-AUTH-04 | Logout | `POST /auth/logout` |

### Épica 2: Gestión de Usuarios

| ID | Historia | Endpoint principal |
|---|---|---|
| HU-USR-01 | Crear usuario | `POST /users` |
| HU-USR-02 | Listar usuarios | `GET /users` |
| HU-USR-03 | Actualizar rol de usuario | `PATCH /users/:id` |
| HU-USR-04 | Desactivar usuario (soft delete) | `DELETE /users/:id` |

---

## UDT-03 — Patients

### Épica 3: Gestión de Pacientes

| ID | Historia | Endpoint principal |
|---|---|---|
| HU-PAT-01 | Registrar paciente | `POST /patients` |
| HU-PAT-02 | Listar pacientes con filtros y paginación | `GET /patients` |
| HU-PAT-03 | Consultar detalle de paciente | `GET /patients/:id` |
| HU-PAT-04 | Actualizar datos de paciente | `PATCH /patients/:id` |
| HU-PAT-05 | Eliminar paciente (soft delete) | `DELETE /patients/:id` |

---

## UDT-04 — Orders

### Épica 4: Gestión de Órdenes Médicas

| ID | Historia | Endpoint principal |
|---|---|---|
| HU-ORD-01 | Crear orden médica | `POST /orders` |
| HU-ORD-02 | Listar órdenes con filtros y paginación | `GET /orders` |
| HU-ORD-03 | Consultar detalle de orden | `GET /orders/:id` |
| HU-ORD-04 | Avanzar estado de orden | `PATCH /orders/:id/status` |
| HU-ORD-05 | Cancelar o rechazar orden | `PATCH /orders/:id/status` (estado terminal) |
| HU-ORD-06 | Eliminar orden (soft delete) | `DELETE /orders/:id` |

---

## UDT-05 — Results

### Épica 5: Resultados de Exámenes

| ID | Historia | Endpoint principal |
|---|---|---|
| HU-RES-01 | Registrar resultado de examen | `POST /results` |
| HU-RES-02 | Listar resultados de una orden | `GET /results?orderId=:id` |
| HU-RES-03 | Actualizar resultado | `PATCH /results/:id` |
| HU-RES-04 | Eliminar resultado (soft delete) | `DELETE /results/:id` |

---

## UDT-06 — Appointments

### Épica 6: Agendamiento de Citas

| ID | Historia | Endpoint principal |
|---|---|---|
| HU-AGE-01 | Crear cita para un paciente | `POST /appointments` |
| HU-AGE-02 | Listar citas con filtros | `GET /appointments` |
| HU-AGE-03 | Consultar detalle de cita | `GET /appointments/:id` |
| HU-AGE-04 | Actualizar cita | `PATCH /appointments/:id` |
| HU-AGE-05 | Eliminar cita (soft delete) | `DELETE /appointments/:id` |

---

## UDT-07 — Docker Compose + Testing

> Unidad de infraestructura sin historias funcionales directas. Su propósito es garantizar que **todas las historias** pueden ejecutarse en un entorno reproducible y que los criterios de aceptación BDD están cubiertos por tests automatizados.

| Tipo | Alcance |
|---|---|
| Tests unitarios (Jest) | Un `*.spec.ts` por cada servicio de UDT-02 a UDT-06 |
| Tests de integración (Supertest) | Flujos clave de cada épica (`auth.e2e-spec.ts`, `patients.e2e-spec.ts`, `orders.e2e-spec.ts`, etc.) |
| Docker Compose | Levanta la app completa con todos los módulos |

---

## Verificación de Cobertura Total

- [x] Todas las 28 historias están asignadas a exactamente 1 unidad
- [x] UDT-01 cubre la infraestructura técnica transversal a todas las historias
- [x] UDT-07 valida todas las historias mediante tests
- [x] No hay historias sin asignar
