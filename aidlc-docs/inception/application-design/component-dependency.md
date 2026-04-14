# Dependencias de Componentes — Sistema de Solicitud de Laboratorios

---

## Matriz de Dependencias

| Componente | Depende de | Es requerido por |
|---|---|---|
| `PrismaModule` | PostgreSQL (externo) | Todos los módulos de dominio |
| `Common` (carpeta) | — | Todos los módulos |
| `UsersModule` | `PrismaModule` | `AuthModule` |
| `AuthModule` | `UsersModule`, `JwtModule`, `PassportModule`, `PrismaModule` | Todos los módulos de dominio (JwtAuthGuard + RolesGuard) |
| `PatientsModule` | `PrismaModule`, `AuthModule` | `OrdersModule`, `AppointmentsModule` |
| `OrdersModule` | `PrismaModule`, `AuthModule`, `PatientsModule` | `ResultsModule`, `AppointmentsModule` |
| `ResultsModule` | `PrismaModule`, `AuthModule`, `OrdersModule` | — |
| `AppointmentsModule` | `PrismaModule`, `AuthModule`, `PatientsModule`, `OrdersModule` | — |

---

## Diagrama de Dependencias

```
                    +------------------+
                    |   PostgreSQL     |
                    +------------------+
                             |
                             v
                    +------------------+
                    |  PrismaModule    |  (global)
                    +------------------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
   +--------------------+       +--------------------+
   |   UsersModule      |       |    Common          |
   |   (UsersService)   |       |  (Filters, DTOs,   |
   +--------------------+       |   Guards, Helpers) |
              |                 +--------------------+
              v                          |
   +--------------------+               | (usado por todos)
   |   AuthModule       |               |
   |  (AuthService,     |<--------------+
   |   JwtStrategy,     |
   |   JwtAuthGuard)    |
   +--------------------+
              |
              | JwtAuthGuard + RolesGuard exportados
              |
   +----------+----------+----------+
   |          |          |          |
   v          v          v          v
+--------+ +--------+ +--------+ +--------+
|Patents | |Orders  | |Results | |Appoint.|
|Module  | |Module  | |Module  | |Module  |
+--------+ +--------+ +--------+ +--------+
    |           |         |           |
    |      assertExists   |      assertExists
    |      (Patients) <---+      (Patients)
    |                     |      (Orders optional)
    +----> assertExists --+
           (Orders)
```

---

## Flujo de Datos por Caso de Uso

### Login
```
POST /auth/login
  → AuthController.login(dto)
  → AuthService.login(dto)
  → UsersService.findByEmail(email)         [consulta User]
  → bcrypt.compare(password, hash)
  → JwtService.sign(payload)               [accessToken]
  → PrismaService.refreshToken.create()    [refreshToken en DB]
  → return TokensDto
```

### Crear Orden
```
POST /orders
  → OrdersController.create(dto, @CurrentUser())
  → JwtAuthGuard.canActivate()             [valida JWT]
  → RolesGuard.canActivate()               [valida ADMIN|OPERADOR]
  → OrdersService.create(dto, userId)
  → PatientsService.assertExists(patientId)
  → PrismaService.order.create({ data: { ...dto, status: PENDIENTE, createdBy: userId } })
  → return OrderResponseDto
```

### Actualizar Estado de Orden
```
PATCH /orders/:id/status
  → OrdersController.updateStatus(id, dto, @CurrentUser())
  → JwtAuthGuard + RolesGuard              [ADMIN|LABORATORIO]
  → OrdersService.updateStatus(id, newStatus, userId)
  → PrismaService.order.findUnique(id)     [obtiene estado actual]
  → OrdersService.isValidTransition(current, new)
  → if invalid: throw UnprocessableEntityException(422)
  → PrismaService.order.update({ status: newStatus, updatedBy: userId })
  → return OrderResponseDto
```

---

## Patrones de Comunicación

| Patrón | Uso |
|---|---|
| **Inyección de dependencias NestJS** | Comunicación entre servicios dentro del mismo proceso |
| **Exportación de servicio entre módulos** | `UsersModule` exporta `UsersService` para `AuthModule`; `PatientsModule` exporta `PatientsService` para `OrdersModule` y `AppointmentsModule` |
| **Guard global reutilizable** | `JwtAuthGuard` y `RolesGuard` definidos en `AuthModule` y aplicados como decoradores en controladores |
| **Decorador `@CurrentUser()`** | Extrae el usuario del JWT (disponible como `req.user` tras `JwtStrategy`) para inyectar `userId` en operaciones de auditoría |
| **Prisma `include`** | Para relaciones (ej. `Order` incluye `Patient` en `findOne`) sin capas adicionales de mapeo |
