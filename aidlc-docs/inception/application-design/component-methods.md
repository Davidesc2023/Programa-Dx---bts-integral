# Métodos de Componentes — Sistema de Solicitud de Laboratorios

---

## AuthService

| Método | Firma | Propósito |
|---|---|---|
| `register` | `register(dto: RegisterDto): Promise<UserResponseDto>` | Crea usuario con contraseña hasheada (bcrypt). Solo ADMIN. |
| `login` | `login(dto: LoginDto): Promise<TokensDto>` | Valida credenciales, retorna accessToken + refreshToken. |
| `refresh` | `refresh(refreshToken: string): Promise<{ accessToken: string }>` | Valida refresh token en DB, retorna nuevo accessToken. |
| `logout` | `logout(refreshToken: string): Promise<void>` | Invalida refresh token en DB. |
| `validateUser` | `validateUser(email: string, password: string): Promise<User \| null>` | Uso interno de Passport: verifica email y bcrypt. |

---

## UsersService

| Método | Firma | Propósito |
|---|---|---|
| `create` | `create(dto: CreateUserDto): Promise<UserResponseDto>` | Crea usuario con rol. Valida email único. |
| `findAll` | `findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<UserResponseDto>>` | Lista usuarios activos paginados. |
| `findOne` | `findOne(id: string): Promise<UserResponseDto>` | Obtiene usuario por ID. Lanza 404 si no existe. |
| `findByEmail` | `findByEmail(email: string): Promise<User \| null>` | Uso interno (AuthService). Busca por email incluyendo contraseña. |
| `update` | `update(id: string, dto: UpdateUserDto): Promise<UserResponseDto>` | Actualiza rol u otros datos. |
| `remove` | `remove(id: string): Promise<void>` | Soft delete: registra `deletedAt`. |

---

## PatientsService

| Método | Firma | Propósito |
|---|---|---|
| `create` | `create(dto: CreatePatientDto, userId: string): Promise<PatientResponseDto>` | Crea paciente. Valida documento único. Registra `createdBy`. |
| `findAll` | `findAll(query: PatientQueryDto): Promise<PaginatedResponseDto<PatientResponseDto>>` | Lista activos con filtros (nombre, tipo doc, nro doc) y paginación. |
| `findOne` | `findOne(id: string): Promise<PatientResponseDto>` | Detalle de paciente activo. Lanza 404 si no existe. |
| `update` | `update(id: string, dto: UpdatePatientDto, userId: string): Promise<PatientResponseDto>` | Actualiza campos. Valida documento único si cambia. Registra `updatedBy`. |
| `remove` | `remove(id: string): Promise<void>` | Soft delete: `deletedAt = now()`. |
| `assertExists` | `assertExists(id: string): Promise<Patient>` | Uso interno (Orders, Appointments). Lanza 404 si no existe o está eliminado. |

---

## OrdersService

| Método | Firma | Propósito |
|---|---|---|
| `create` | `create(dto: CreateOrderDto, userId: string): Promise<OrderResponseDto>` | Crea orden con estado PENDIENTE. Valida existencia de paciente. Registra `createdBy`. |
| `findAll` | `findAll(query: OrderQueryDto): Promise<PaginatedResponseDto<OrderResponseDto>>` | Lista activas con filtros (status, priority, patientId, dateFrom/dateTo) y paginación. |
| `findOne` | `findOne(id: string): Promise<OrderResponseDto>` | Detalle con datos del paciente relacionado. Lanza 404 si no existe. |
| `updateStatus` | `updateStatus(id: string, newStatus: OrderStatus, userId: string): Promise<OrderResponseDto>` | Valida transición permitida. Actualiza estado. Registra `updatedBy`. Lanza 422 si transición inválida. |
| `remove` | `remove(id: string): Promise<void>` | Soft delete. Solo ADMIN. |
| `assertExists` | `assertExists(id: string): Promise<Order>` | Uso interno (Results). Lanza 404 si no existe o está eliminado. |
| `isValidTransition` | `isValidTransition(current: OrderStatus, next: OrderStatus): boolean` | Verifica si la transición está permitida según el flujo clínico. Privado. |

**Mapa de transiciones permitidas**:
```
PENDIENTE           → MUESTRA_RECOLECTADA | CANCELADA
MUESTRA_RECOLECTADA → EN_ANALISIS         | CANCELADA
EN_ANALISIS         → COMPLETADA          | RECHAZADA
COMPLETADA          → (sin transiciones)
CANCELADA           → (sin transiciones)
RECHAZADA           → (sin transiciones)
```

---

## ResultsService

| Método | Firma | Propósito |
|---|---|---|
| `create` | `create(orderId: string, dto: CreateResultDto, userId: string): Promise<ResultResponseDto>` | Crea resultado para orden. Valida existencia de orden. Registra `createdBy`. |
| `findAllByOrder` | `findAllByOrder(orderId: string): Promise<ResultResponseDto[]>` | Lista resultados activos de una orden. |
| `findOne` | `findOne(id: string): Promise<ResultResponseDto>` | Detalle de resultado activo. Lanza 404 si no existe. |
| `update` | `update(id: string, dto: UpdateResultDto, userId: string): Promise<ResultResponseDto>` | Actualiza resultado. Registra `updatedBy`. |
| `remove` | `remove(id: string): Promise<void>` | Soft delete. Solo ADMIN. |

---

## AppointmentsService

| Método | Firma | Propósito |
|---|---|---|
| `create` | `create(dto: CreateAppointmentDto, userId: string): Promise<AppointmentResponseDto>` | Crea cita. Valida existencia de paciente. Valida orden si se provee. Valida fecha futura. Registra `createdBy`. |
| `findAll` | `findAll(query: AppointmentQueryDto): Promise<PaginatedResponseDto<AppointmentResponseDto>>` | Lista activas con filtros (patientId, dateFrom/dateTo) y paginación. |
| `findOne` | `findOne(id: string): Promise<AppointmentResponseDto>` | Detalle con paciente y orden asociada (si aplica). Lanza 404 si no existe. |
| `update` | `update(id: string, dto: UpdateAppointmentDto, userId: string): Promise<AppointmentResponseDto>` | Actualiza fecha/hora u otros campos. Valida fecha futura si cambia. Registra `updatedBy`. |
| `remove` | `remove(id: string): Promise<void>` | Soft delete. Solo ADMIN. |

---

## Common — GlobalExceptionFilter

| Método | Firma | Propósito |
|---|---|---|
| `catch` | `catch(exception: unknown, host: ArgumentsHost): void` | Intercepta todas las excepciones. Formatea respuesta uniforme con `statusCode`, `message`, `error`, `timestamp`, `path`. |

---

## Common — SoftDeleteHelper

| Método | Firma | Propósito |
|---|---|---|
| `softDelete` | `softDelete(prisma: PrismaService, model: string, id: string): Promise<void>` | Aplica `update({ where: { id }, data: { deletedAt: new Date() } })` genéricamente. |
| `activeWhereClause` | `activeWhereClause(): { deletedAt: null }` | Retorna cláusula Prisma para filtrar registros no eliminados. |
