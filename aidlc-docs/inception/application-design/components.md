# Componentes — Sistema de Solicitud de Laboratorios

---

## Componente: AppModule (Raíz)
**Responsabilidad**: Módulo raíz de NestJS. Importa y orquesta todos los módulos de dominio. Configura ValidationPipe global, Helmet, y el filtro de excepciones global.

**Interfaces**:
- Importa: PrismaModule, AuthModule, UsersModule, PatientsModule, OrdersModule, ResultsModule, AppointmentsModule

---

## Componente: PrismaModule
**Responsabilidad**: Proveedor global del cliente Prisma. Gestiona la conexión a PostgreSQL. Exportado como global para que todos los módulos lo inyecten sin reimportarlo.

**Interfaces**:
- Exporta: `PrismaService`
- Consumido por: UsersModule, PatientsModule, OrdersModule, ResultsModule, AppointmentsModule

---

## Componente: AuthModule
**Responsabilidad**: Gestión completa del ciclo de autenticación. Registro, login, logout, renovación de tokens. Configura estrategias Passport (JWT). Expone guards reutilizables.

**Interfaces**:
- Controlador: `AuthController` (`/auth`)
- Servicio: `AuthService`
- Estrategia: `JwtStrategy` (Passport)
- Guard: `JwtAuthGuard` (exportado y reutilizado en todos los módulos)
- Depende de: `UsersModule`, `JwtModule` (@nestjs/jwt), `PassportModule`

---

## Componente: UsersModule
**Responsabilidad**: CRUD de usuarios del sistema. Gestión de roles. Soft delete. Solo accesible por ADMIN.

**Interfaces**:
- Controlador: `UsersController` (`/users`)
- Servicio: `UsersService`
- Exporta: `UsersService` (consumido por AuthModule para validar credenciales)
- Depende de: `PrismaModule`

---

## Componente: PatientsModule
**Responsabilidad**: Registro y gestión completa de pacientes. Incluye paginación con filtros, auditoría (createdBy/updatedBy), soft delete y validación de documento duplicado.

**Interfaces**:
- Controlador: `PatientsController` (`/patients`)
- Servicio: `PatientsService`
- Exporta: `PatientsService` (consumido por OrdersModule y AppointmentsModule para validar existencia)
- Depende de: `PrismaModule`, `AuthModule` (guard)

---

## Componente: OrdersModule
**Responsabilidad**: Gestión del ciclo de vida completo de una orden médica. Creación, consulta, flujo de estado clínico con validación de transiciones, paginación con filtros, soft delete, auditoría.

**Interfaces**:
- Controlador: `OrdersController` (`/orders`)
- Servicio: `OrdersService`
- Exporta: `OrdersService` (consumido por ResultsModule para validar existencia de orden)
- Depende de: `PrismaModule`, `PatientsModule` (validar paciente), `AuthModule` (guard)

---

## Componente: ResultsModule
**Responsabilidad**: Registro y gestión de resultados de exámenes dentro de una orden. CRUD básico con soft delete y auditoría.

**Interfaces**:
- Controlador: `ResultsController` (`/results`)
- Servicio: `ResultsService`
- Depende de: `PrismaModule`, `OrdersModule` (validar orden), `AuthModule` (guard)

---

## Componente: AppointmentsModule
**Responsabilidad**: Gestión de citas de pacientes. CRUD básico con soft delete, auditoría, paginación con filtros por paciente y fecha, validación de fecha futura.

**Interfaces**:
- Controlador: `AppointmentsController` (`/appointments`)
- Servicio: `AppointmentsService`
- Depende de: `PrismaModule`, `PatientsModule` (validar paciente), `OrdersModule` (validar orden opcional), `AuthModule` (guard)

---

## Componente: Common (transversal)
**Responsabilidad**: Utilidades, decoradores, filtros y DTOs compartidos entre módulos. No es un módulo NestJS independiente, sino una carpeta de código compartido.

**Contenido**:
- `GlobalExceptionFilter` — filtro de excepciones global con formato uniforme
- `ResponseDto<T>` — envelope de respuesta `{ data, message, statusCode }`
- `PaginatedResponseDto<T>` — envelope paginado con `meta`
- `PaginationQueryDto` — DTO base con `page` y `limit`
- `CurrentUser` — decorador para extraer usuario del JWT
- `Roles` — decorador de metadatos para roles
- `RolesGuard` — guard que verifica el rol del usuario autenticado
- `SoftDeleteHelper` — helper para aplicar soft delete con Prisma
