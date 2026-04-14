# Modelo de Lógica de Negocio — UDT-01: Application Layer

---

## Propósito

Esta unidad no implementa lógica de dominio — implementa la **infraestructura transversal** que garantiza consistencia en toda la API: formato de respuestas, manejo centralizado de errores, validación de entrada y acceso seguro a la base de datos.

---

## Flujo de Procesamiento de Requests

```
Cliente HTTP
    │
    ▼
main.ts → app.listen()
    │
    ├── Helmet (middleware global de seguridad HTTP)
    ├── ValidationPipe (global — transforma y valida DTOs)
    └── GlobalExceptionFilter (captura excepciones no controladas)
    │
    ▼
Controller (módulo de dominio)
    │
    ▼
Service (módulo de dominio)
    │
    ▼
PrismaService → PostgreSQL
    │
    ▼
Respuesta envuelta en ResponseDto o PaginatedResponseDto
    │
    ▼
Cliente HTTP
```

---

## Modelo de Respuesta Exitosa

### Respuesta simple
Toda respuesta exitosa retorna el envelope:
```
{
  data: T,
  message: string,
  statusCode: number
}
```

El controlador elige el `message` apropiado al contexto (ej. "Paciente creado exitosamente", "Login exitoso").

### Respuesta paginada
Rutas de listado retornan:
```
{
  data: T[],
  message: string,
  statusCode: number,
  meta: {
    total: number,         // total de registros en DB (sin paginar)
    page: number,          // página actual
    limit: number,         // registros por página
    totalPages: number     // calculado: Math.ceil(total / limit)
  }
}
```

---

## Modelo de Manejo de Errores

### Flujo del GlobalExceptionFilter

```
Excepción lanzada en cualquier capa
    │
    ├── ¿Es HttpException? (incluyendo BadRequestException, NotFoundException, etc.)
    │       → Usar status y message del HttpException
    │
    ├── ¿Es Prisma.PrismaClientKnownRequestError?
    │       ├── code P2002 (unique constraint) → HTTP 409 "El recurso ya existe"
    │       ├── code P2025 (record not found)  → HTTP 404 "El recurso no fue encontrado"
    │       └── otros códigos Prisma           → HTTP 500 "Error interno del servidor"
    │
    └── ¿Cualquier otro Error?
            → HTTP 500 "Error interno del servidor"

Respuesta de error siempre retorna:
{
  statusCode: number,
  message: string | string[],  // string[] para errores de validación (campo por campo)
  error: string               // descripción del tipo de error HTTP
}

REGLA DE SEGURIDAD: En producción (NODE_ENV=production), nunca incluir stack trace en la respuesta.
```

---

## Modelo de Paginación

### Parámetros de entrada (`PaginationQueryDto`)
- `page`: número de página (entero ≥ 1, default: 1)
- `limit`: registros por página (entero, min: 1, max: 100, default: 10)

### Cálculo en servicio (patrón para todos los módulos)
```
const skip = (page - 1) * limit;
const [data, total] = await prisma.$transaction([
  prisma.model.findMany({ where, skip, take: limit, orderBy }),
  prisma.model.count({ where })
]);
const totalPages = Math.ceil(total / limit);
```

---

## Acceso a Base de Datos (PrismaService)

`PrismaService` extiende `PrismaClient` y se conecta al iniciar la aplicación (`onModuleInit`). Es un módulo global — inyectable en cualquier módulo sin necesidad de importarlo explícitamente.

---

## Control de Acceso (Guards y Decoradores)

### RolesGuard
- Implementa `CanActivate`
- Lee los roles requeridos del metadato del handler (usando `@Roles()`)
- Valida que `request.user.role` esté incluido en los roles requeridos
- Si no hay roles definidos en el handler → acceso permitido (el `JwtAuthGuard` del módulo Auth ya garantiza autenticación)

### @Roles(...roles)
- Decorador de metadata que registra los roles permitidos para un endpoint
- Usa `SetMetadata(ROLES_KEY, roles)`

### @CurrentUser()
- Decorador de parámetro que extrae `request.user` del contexto HTTP
- `request.user` es el payload del JWT validado por `JwtStrategy` (del módulo Auth)

---

## Soft Delete (SoftDeleteHelper)

Función utilitaria pura (no injectable):

```
softDelete(prisma: PrismaService, model: string, id: string): Promise<void>
```

Lógica:
1. Verificar que el registro existe y no está ya eliminado (`deletedAt === null`)
2. Si no existe → lanzar `NotFoundException`
3. Actualizar `deletedAt = new Date()`

Todos los módulos que implementen soft delete llaman a esta función desde su servicio, pasando la instancia de Prisma, el nombre del modelo y el id.
