# Documento de Requerimientos
## Sistema de Solicitud de Laboratorios (APP-DX)

---

## Resumen de Intención

| Campo | Detalle |
|---|---|
| **Solicitud del usuario** | Plataforma backend robusta y escalable para gestionar el ciclo completo de solicitudes de laboratorio: pacientes, órdenes, agendamiento y resultados |
| **Tipo de solicitud** | Proyecto Greenfield — continuar desde Fase 2 (Fase 1 Foundation ya completada) |
| **Estimación de alcance** | Sistema completo — múltiples módulos con auth, roles, features y despliegue |
| **Estimación de complejidad** | Complejo — autenticación JWT, roles granulares, auditoría, soft delete, paginación con filtros, múltiples módulos |

---

## Contexto del Proyecto

La Fase 1 del plan de desarrollo ya está completada e incluye:
- PostgreSQL + Prisma ORM + migraciones
- NestJS configurado con módulos base (patients, orders)
- CRUD básico de pacientes y órdenes con relación Order → Patient
- DTOs de entrada y ValidationPipe global

En esta sesión de AI-DLC se construirán las **Fases 2, 3, 4 y 5**:
- **Fase 2 — Application Layer**: Response DTOs, manejo de errores centralizado, servicios con lógica de negocio estructurada
- **Fase 3 — Auth & Security**: Registro de usuarios, login JWT, roles y guards
- **Fase 4 — Features**: Módulo de resultados (modelo + CRUD básico), módulo de agendamiento (crear cita básica)
- **Fase 5 — Producción**: Tests unitarios + integración, Docker Compose

---

## Requerimientos Funcionales

### RF-01 — Gestión de Pacientes
- Crear paciente con campos: nombre, tipo de documento (CC/TI/CE/PASAPORTE), número de documento, fecha de nacimiento, teléfono, correo electrónico
- Listar pacientes con paginación offset (`?page=&limit=`) y filtros por nombre, tipo de documento y número de documento
- Obtener paciente por ID
- Actualizar datos de un paciente
- Eliminar paciente (soft delete: campo `deletedAt`; registros eliminados no aparecen en listados)
- Los campos `createdBy` y `updatedBy` deben registrar el ID del usuario autenticado que realizó la operación

### RF-02 — Gestión de Órdenes Médicas
- Crear orden con campos: referencia a paciente, fecha de orden, lista de exámenes/servicios solicitados, notas, nombre del médico ordenante, prioridad (URGENTE/RUTINA), observaciones, fecha estimada de cumplimiento
- Estado inicial automático: `PENDIENTE`
- Flujo de estado clínico:
  ```
  PENDIENTE → MUESTRA_RECOLECTADA → EN_ANALISIS → COMPLETADA
                         ↓                  ↓             ↓
                     CANCELADA          CANCELADA      (terminal)
                                        RECHAZADA
  ```
- Listar órdenes con paginación y filtros por: estado, prioridad, ID de paciente, rango de fechas
- Obtener orden por ID (incluyendo datos del paciente)
- Actualizar estado de orden (con validación de transición permitida)
- Eliminar orden (soft delete)
- Campos de auditoría: `createdBy`, `updatedBy`

### RF-03 — Autenticación
- Registro de usuario con: correo electrónico, contraseña (hash bcrypt), rol (ADMIN/OPERADOR/LABORATORIO)
- Login con correo y contraseña → retorna access token (15 min) + refresh token (7 días)
- Endpoint de renovación de token (refresh)
- Logout (invalidación de refresh token)
- Contraseñas almacenadas con hash bcrypt (nunca en texto plano)
- Secretos JWT almacenados en variables de entorno (`.env`)

### RF-04 — Autorización por Roles
| Recurso | ADMIN | OPERADOR | LABORATORIO |
|---|---|---|---|
| Gestión de usuarios | CRUD completo | — | — |
| Pacientes | CRUD completo | Crear / Leer | Leer |
| Órdenes | CRUD completo | Crear / Leer | Leer / Actualizar estado |
| Resultados | CRUD completo | Leer | Crear / Leer / Actualizar |
| Citas | CRUD completo | Crear / Leer | Leer |

- Todos los endpoints de recursos (pacientes, órdenes, resultados, citas) requieren autenticación
- Guards de NestJS aplicados por endpoint o controlador

### RF-05 — Módulo de Resultados
- Crear resultado asociado a una orden (un resultado por examen/servicio de la orden)
- Listar resultados por orden
- Obtener resultado por ID
- Actualizar resultado
- Eliminar resultado (soft delete)
- Campos de auditoría: `createdBy`, `updatedBy`
- No se requiere lógica de negocio compleja ni adjuntos de archivos en esta fase

### RF-06 — Módulo de Agendamiento
- Crear cita con: referencia a paciente, referencia a orden (opcional), fecha y hora
- Listar citas con paginación y filtros por paciente, fecha
- Obtener cita por ID
- Actualizar cita
- Eliminar cita (soft delete)
- Campos de auditoría: `createdBy`, `updatedBy`
- No se requiere validación de disponibilidad ni detección de conflictos en esta fase

### RF-07 — Formato de Respuesta API
- Todas las respuestas exitosas envueltas en:
  ```json
  {
    "data": { ... },
    "message": "Operación exitosa",
    "statusCode": 200
  }
  ```
- Respuestas de listado paginado incluyen:
  ```json
  {
    "data": [ ... ],
    "meta": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 },
    "message": "OK",
    "statusCode": 200
  }
  ```

### RF-08 — Manejo Centralizado de Errores
- Filtro de excepciones global de NestJS
- Formato de error uniforme:
  ```json
  {
    "message": "Descripción del error",
    "statusCode": 400,
    "error": "BadRequest",
    "timestamp": "2026-04-13T00:00:00Z",
    "path": "/api/patients"
  }
  ```
- Errores de negocio (ej. transición de estado inválida) devuelven HTTP 422
- Errores de validación de DTO devuelven HTTP 400 con detalle de campos

---

## Requerimientos No Funcionales

### RNF-01 — Stack Tecnológico
- **Framework**: NestJS (TypeScript)
- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: Passport.js + JWT (@nestjs/jwt, @nestjs/passport)
- **Encriptación**: bcrypt para contraseñas
- **Testing**: Jest (unit) + Supertest (integration)
- **Despliegue**: Docker Compose

### RNF-02 — Arquitectura
- Monolito modular: un módulo NestJS por dominio (patients, orders, results, appointments, auth, users)
- Capa de controlador → capa de servicio → Prisma (repositorio directo)
- Sin strict Clean Architecture ni Hexagonal — estructura NestJS idiomática con servicios bien delimitados
- Módulo `PrismaModule` global reutilizado por todos los módulos de dominio

### RNF-03 — Seguridad (ACTIVADO — extensión de seguridad habilitada)
- Contraseñas almacenadas con bcrypt (mínimo 10 rondas de sal)
- Tokens JWT firmados con secreto de al menos 256 bits almacenado en `.env`
- Refresh tokens almacenados en base de datos con campo `expiresAt`; invalidables (logout)
- TLS obligatorio en conexión a base de datos (`ssl: require` en producción)
- Validación estricta de entrada en todos los DTOs (`class-validator`, `class-transformer`)
- Sin exposición de stack traces en respuestas de error en producción
- Variables de entorno sensibles (DB_URL, JWT_SECRET, etc.) jamás en el repositorio — usar `.env.example`
- Helmet habilitado en la aplicación NestJS

### RNF-04 — Eliminación (Soft Delete)
- Todas las entidades principales (Patient, Order, Result, Appointment, User) tienen campo `deletedAt: DateTime?`
- Los listados filtran registros donde `deletedAt IS NOT NULL` por defecto
- El soft delete se aplica mediante un servicio o helper reutilizable con Prisma

### RNF-05 — Auditoría
- Campos `createdBy` y `updatedBy` en todas las entidades (ID del usuario autenticado)
- Inyectados automáticamente desde el contexto de la request (no como campo del body)

### RNF-06 — Paginación y Filtrado
- Paginación offset estándar: `?page=1&limit=10` (máximo 100 por página)
- Filtros disponibles por módulo:
  - Pacientes: nombre, tipo de documento, número de documento
  - Órdenes: estado, prioridad, patientId, rango de fechas (`dateFrom`, `dateTo`)
  - Resultados: orderId
  - Citas: patientId, rango de fechas

### RNF-07 — Testing
- Tests unitarios para todos los servicios (Jest, con mocks de Prisma)
- Tests de integración para flujos principales (Prisma + base de datos de prueba)
- No se requiere reporte de cobertura en esta fase

### RNF-08 — Despliegue
- `docker-compose.yml` que levanta: PostgreSQL + aplicación NestJS
- Archivo `.env.example` con todas las variables requeridas documentadas
- Scripts de migración Prisma ejecutados al iniciar el contenedor

---

## Restricciones Confirmadas
- Backend únicamente (sin frontend/UI)
- Sin integración con sistemas externos en esta fase
- Sin adjuntos de archivos (resultados de laboratorio como datos estructurados únicamente)
- Sin validación de disponibilidad para agendamiento
- Sin CI/CD pipeline en esta fase (solo Docker Compose local)

---

## Módulos a Construir

| Módulo | Fase | Estado Base |
|---|---|---|
| Application Layer (DTOs respuesta, error handling) | Fase 2 | Por construir sobre Foundation |
| Auth (registro, login, JWT, refresh) | Fase 3 | Nuevo |
| Users (gestión de usuarios + roles) | Fase 3 | Nuevo |
| Patients (ampliar Foundation con soft delete, auditoría, paginación) | Fase 2 + 3 | Ampliar existente |
| Orders (ampliar Foundation con flujo de estado clínico, auditoría, paginación) | Fase 2 + 3 | Ampliar existente |
| Results (modelo + CRUD básico) | Fase 4 | Nuevo |
| Appointments (modelo + CRUD básico) | Fase 4 | Nuevo |
| Docker Compose + Testing | Fase 5 | Nuevo |

---

## Criterios de Éxito
- % de órdenes registradas digitalmente → 100% de órdenes creadas vía API
- Tiempo de creación de orden → endpoint responde en menos de 500ms
- Reducción de errores manuales → validación estricta de DTOs previene datos incorrectos
- Trazabilidad → cada operación tiene autores (`createdBy`, `updatedBy`) y timestamps
