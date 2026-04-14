# NFR Design Patterns — UDT-01: Application Layer

---

## Patrón 1: Chain of Responsibility — Pipeline de Middleware

**NFR cubierto**: RNF-SEG-01 (Helmet), RNF-SEG-02 (ValidationPipe)

El request traversa una cadena de responsabilidades antes de llegar al controlador:

```
Request entrante
    │
    ├── [1] Helmet middleware        → Inyecta headers de seguridad
    ├── [2] ValidationPipe (global)  → Valida y transforma DTOs
    ├── [3] JwtAuthGuard (por ruta)  → Autentica JWT
    ├── [4] RolesGuard (por ruta)    → Autoriza por rol
    └── [5] Controller handler       → Delegado a servicio
```

La cadena se interrumpe en el primer eslabón que lanza excepción, la cual es capturada por `GlobalExceptionFilter`.

---

## Patrón 2: Exception Shield — Filtro Global de Excepciones

**NFR cubierto**: RNF-SEG-03 (sin stack traces en producción), RNF-MANT-02 (un solo punto de manejo)

`GlobalExceptionFilter` actúa como un "escudo" que:
1. Intercepta **todas** las excepciones no controladas
2. Las clasifica por tipo (HttpException, PrismaError, Error genérico)
3. Las transforma en respuestas HTTP formateadas
4. Oculta información sensible en producción

```
Excepción
    │
    ▼
GlobalExceptionFilter
    ├── instanceof HttpException  → status + message del HttpException
    ├── PrismaKnownRequestError   → mapeo P2002/P2025 a 409/404
    └── Error genérico            → 500 + mensaje genérico
    │
    ▼
    NODE_ENV === 'production'?
    ├── SÍ  → { statusCode, message, error }           (sin stack)
    └── NO  → { statusCode, message, error, stack }    (con stack para debug)
```

---

## Patrón 3: Template Method — ResponseDto como contrato de respuesta

**NFR cubierto**: RNF-MANT-01 (mensajes consistentes), envelope obligatorio

`ResponseDto` y `PaginatedResponseDto` actúan como templates que los controladores deben instanciar. Esto garantiza que **todas** las respuestas exitosas tengan la misma estructura, independientemente del módulo.

Los controladores siguen el template:
```typescript
// Template para respuesta simple
return new ResponseDto(data, 'Mensaje en español', HttpStatus.OK);

// Template para respuesta paginada
return new PaginatedResponseDto(data, 'Mensaje en español', HttpStatus.OK, meta);
```

---

## Patrón 4: Null Object — Soft Delete como convención

**NFR cubierto**: Consistencia de datos, RNF-MANT-02

En lugar de eliminar registros físicamente, `SoftDeleteHelper` implementa el patrón "soft delete" que:
- Setea `deletedAt = new Date()` (el registro sigue existiendo — es un "null object" lógico)
- Todos los `findMany` filtran automáticamente `where: { deletedAt: null }`
- El registro "eliminado" no es visible para el sistema pero no se pierde información

Función pura (sin efectos secundarios fuera de Prisma):
```typescript
async function softDelete(
  prisma: PrismaService,
  delegate: any,       // prisma.patient, prisma.order, etc.
  id: string
): Promise<void>
```

---

## Patrón 5: Metadata + Guard — Control de acceso declarativo

**NFR cubierto**: RNF-SEG-02 (validación de acceso)

El control de roles usa el patrón `Metadata + Guard`:
- `@Roles(...roles)` **declara** los roles permitidos en el handler (metadata)
- `RolesGuard` **lee** esa metadata y la valida contra el usuario autenticado (behavior)

Esto separa la declaración de la política de acceso (qué roles pueden) de su evaluación (verificar el rol del JWT), siguiendo el principio Open/Closed: agregar un nuevo endpoint solo requiere anotar con `@Roles()`.
