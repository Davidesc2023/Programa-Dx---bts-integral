# Servicios — Sistema de Solicitud de Laboratorios

---

## Descripción de la Capa de Servicios

La aplicación sigue una arquitectura de monolito modular NestJS con tres capas por módulo:

```
HTTP Request
     |
     v
[Controller]   — Valida DTO de entrada, extrae usuario del JWT, delega al servicio
     |
     v
[Service]      — Lógica de negocio: validaciones de dominio, orquestación, transformación
     |
     v
[PrismaClient] — Acceso directo a PostgreSQL (no se usa capa de repositorio separada)
     |
     v
HTTP Response  — Envuelto en ResponseDto<T> o PaginatedResponseDto<T>
```

---

## Servicio: AuthService

**Módulo**: `AuthModule`  
**Responsabilidad de orquestación**:
1. Para login: delega validación de credenciales a `UsersService.findByEmail` + bcrypt compare → genera par de tokens JWT
2. Para registro: delega creación a `UsersService.create` (no duplica lógica de usuario)
3. Para refresh: consulta tabla `RefreshToken` en Prisma → verifica vigencia → genera nuevo `accessToken`
4. Para logout: elimina el refresh token de la tabla `RefreshToken` en Prisma

**Servicios que orquesta**: `UsersService`, `JwtService` (@nestjs/jwt), `PrismaService` (tabla RefreshToken)

**Tipos de token**:
- `accessToken`: JWT firmado con `JWT_SECRET`, payload `{ sub: userId, email, role }`, expiry 15 min
- `refreshToken`: UUID almacenado en tabla `RefreshToken` con `userId` y `expiresAt` (7 días)

---

## Servicio: UsersService

**Módulo**: `UsersModule`  
**Responsabilidad de orquestación**:
1. CRUD de tabla `User` en Prisma
2. Valida unicidad de email antes de crear/actualizar
3. Al crear: hashea contraseña con bcrypt (10 rondas) antes de persistir
4. Nunca retorna el campo `password` en las respuestas (mapeo a `UserResponseDto`)

**Exportado a**: `AuthModule` (para `validateUser` y `findByEmail`)

---

## Servicio: PatientsService

**Módulo**: `PatientsModule`  
**Responsabilidad de orquestación**:
1. CRUD de tabla `Patient` en Prisma con soft delete
2. Valida unicidad de (documentType, documentNumber) antes de crear/actualizar
3. Inyecta `createdBy` / `updatedBy` desde el contexto de autenticación (no del body)
4. Aplica filtro `deletedAt: null` en todos los listados y consultas
5. Paginación con offset: calcula `skip = (page-1) * limit` y retorna `meta`

**Exportado a**: `OrdersModule`, `AppointmentsModule` (para `assertExists`)

---

## Servicio: OrdersService

**Módulo**: `OrdersModule`  
**Responsabilidad de orquestación**:
1. CRUD de tabla `Order` en Prisma con soft delete
2. Al crear: llama `PatientsService.assertExists(patientId)` antes de persistir
3. Para `updateStatus`: valida transición con `isValidTransition()` → lanza `UnprocessableEntityException` si inválida
4. Incluye datos del paciente en `findOne` mediante Prisma `include`
5. Paginación con filtros: construye cláusula `where` dinámicamente según query params

**Exportado a**: `ResultsModule` (para `assertExists`)

---

## Servicio: ResultsService

**Módulo**: `ResultsModule`  
**Responsabilidad de orquestación**:
1. CRUD de tabla `Result` en Prisma con soft delete
2. Al crear: llama `OrdersService.assertExists(orderId)` para validar que la orden existe
3. `findAllByOrder` retorna solo resultados activos de esa orden
4. Inyecta `createdBy` / `updatedBy` desde contexto de autenticación

---

## Servicio: AppointmentsService

**Módulo**: `AppointmentsModule`  
**Responsabilidad de orquestación**:
1. CRUD de tabla `Appointment` en Prisma con soft delete
2. Al crear: valida existencia de paciente (`PatientsService.assertExists`)
3. Si se provee `orderId`: valida existencia de orden (`OrdersService.assertExists`)
4. Valida que `scheduledAt` sea una fecha futura (lanza `BadRequestException` si no)
5. Paginación con filtros: patientId y rango de fechas

---

## Servicio Transversal: GlobalExceptionFilter

**Tipo**: `ExceptionFilter` de NestJS (registrado globalmente en `AppModule`)  
**Responsabilidad**: Intercepta cualquier excepción no manejada y la transforma al formato uniforme de error:

```json
{
  "message": "Descripción del error",
  "statusCode": 400,
  "error": "BadRequest",
  "timestamp": "2026-04-13T00:00:00.000Z",
  "path": "/api/patients"
}
```

**Mapeo de excepciones**:
- `HttpException` (y subclases): usa su statusCode nativo
- `Prisma.PrismaClientKnownRequestError` con código `P2002`: HTTP 409 (duplicado)
- `Prisma.PrismaClientKnownRequestError` con código `P2025`: HTTP 404 (no encontrado)
- Cualquier otro error: HTTP 500 (sin exponer stack trace)

---

## Configuración global (AppModule)

| Configuración | Detalle |
|---|---|
| `ValidationPipe` | `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| `GlobalExceptionFilter` | Registrado como APP_FILTER |
| `Helmet` | Middleware global para headers de seguridad HTTP |
| `ConfigModule` | `isGlobal: true`, carga `.env` con validación de variables requeridas |
