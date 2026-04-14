# Entidades de Dominio — UDT-01: Application Layer

> Esta unidad no tiene entidades de base de datos. Sus "entidades" son los contratos de datos (DTOs y tipos) que definen la interfaz de toda la API.

---

## ResponseDto\<T\>

**Propósito**: Envelope estándar para toda respuesta exitosa no paginada.

| Campo | Tipo | Descripción |
|---|---|---|
| `data` | `T` | Payload de la respuesta (genérico) |
| `message` | `string` | Mensaje descriptivo en español |
| `statusCode` | `number` | Código HTTP (200, 201, etc.) |

**Constructor helper**: `ResponseDto.of(data, message, statusCode)` — construye el envelope desde el controlador.

---

## PaginatedResponseDto\<T\>

**Propósito**: Envelope estándar para respuestas de listado con paginación.

| Campo | Tipo | Descripción |
|---|---|---|
| `data` | `T[]` | Array de elementos de la página |
| `message` | `string` | Mensaje descriptivo |
| `statusCode` | `number` | Código HTTP (siempre 200) |
| `meta` | `PaginationMeta` | Metadatos de paginación |

### PaginationMeta (objeto anidado)

| Campo | Tipo | Descripción |
|---|---|---|
| `total` | `number` | Total de registros en base de datos (sin paginar) |
| `page` | `number` | Página actual solicitada |
| `limit` | `number` | Límite de registros por página |
| `totalPages` | `number` | Total de páginas (`Math.ceil(total / limit)`) |

---

## PaginationQueryDto

**Propósito**: Query parameters estándar para endpoints de listado. Extendido por DTOs específicos de cada módulo (ej. `PatientQueryDto extends PaginationQueryDto`).

| Campo | Tipo | Validaciones | Default |
|---|---|---|---|
| `page` | `number` | `@IsInt`, `@Min(1)`, `@IsOptional`, `@Type(() => Number)` | `1` |
| `limit` | `number` | `@IsInt`, `@Min(1)`, `@Max(100)`, `@IsOptional`, `@Type(() => Number)` | `10` |

---

## ErrorResponseDto (implícito — manejado por GlobalExceptionFilter)

**Propósito**: Formato de respuesta de error. No es una clase instanciada — es el shape del objeto que retorna el filtro.

| Campo | Tipo | Descripción |
|---|---|---|
| `statusCode` | `number` | Código HTTP del error |
| `message` | `string \| string[]` | Mensaje de error (array para errores de validación) |
| `error` | `string` | Descripción del tipo de error HTTP (ej. "Bad Request") |

---

## JwtPayload (tipo — usado por AuthModule)

**Propósito**: Shape del payload dentro del JWT. Definido aquí por ser parte de la infraestructura de autenticación transversal.

| Campo | Tipo | Descripción |
|---|---|---|
| `sub` | `string` | ID del usuario (UUID) |
| `email` | `string` | Email del usuario |
| `role` | `UserRole` | Rol del usuario (ADMIN, OPERADOR, LABORATORIO) |

> `UserRole` es el enum de Prisma generado a partir del schema.

---

## UserRole (enum — generado por Prisma)

| Valor | Descripción |
|---|---|
| `ADMIN` | Administrador con acceso total |
| `OPERADOR` | Operador de registro (pacientes y órdenes) |
| `LABORATORIO` | Personal de laboratorio (lectura + actualización de estado/resultados) |

---

## ICurrentUser (interfaz del decorador @CurrentUser())

**Propósito**: Tipo del parámetro inyectado por `@CurrentUser()` en los controladores de dominio.

| Campo | Tipo | Descripción |
|---|---|---|
| `userId` | `string` | ID del usuario autenticado (del JWT `sub`) |
| `email` | `string` | Email del usuario |
| `role` | `UserRole` | Rol del usuario |

---

## Relación entre entidades de esta unidad

```
PaginationQueryDto
    ↑ extienden (herencia)
PatientQueryDto, OrderQueryDto, AppointmentQueryDto (en sus respectivos módulos)

ResponseDto<T>
PaginatedResponseDto<T>
    ↑ usan
Todos los controladores de dominio

ICurrentUser
    ↑ inyecta
@CurrentUser() decorator → request.user (JwtPayload validado por JwtStrategy)
```
