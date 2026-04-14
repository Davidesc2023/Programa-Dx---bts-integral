# Reglas de Negocio — UDT-01: Application Layer

---

## RN-01: Envelope de Respuesta Obligatorio

**Descripción**: Toda respuesta de la API (éxito y error) debe seguir el formato envelope definido.

| Caso | Estructura |
|---|---|
| Éxito simple (200, 201) | `{ data, message, statusCode }` |
| Éxito paginado (200) | `{ data, message, statusCode, meta }` |
| Error (4xx, 5xx) | `{ statusCode, message, error }` |

**Violación**: Retornar objetos planos sin envelope está prohibido. Los controladores siempre deben construir el envelope explícitamente o delegarlo a un helper/interceptor.

---

## RN-02: Validación de DTOs — Modo Estricto

**Descripción**: `ValidationPipe` se configura globalmente con modo estricto.

| Propiedad | Valor | Efecto |
|---|---|---|
| `whitelist` | `true` | Elimina propiedades no declaradas en el DTO |
| `forbidNonWhitelisted` | `true` | Retorna error 400 si se envían propiedades no declaradas |
| `transform` | `true` | Transforma automáticamente tipos (ej. string "1" → number 1 en query params) |

**Razón de seguridad**: Prevenir mass assignment y datos inesperados en la capa de negocio.

---

## RN-03: Paginación — Valores y Límites

| Parámetro | Default | Mínimo | Máximo |
|---|---|---|---|
| `page` | 1 | 1 | sin límite |
| `limit` | 10 | 1 | 100 |

**Regla**: Si se envía `limit > 100`, el sistema retorna HTTP 400.  
**Regla**: Si se envía `page < 1`, el sistema retorna HTTP 400.  
**Razón**: Proteger el servidor de consultas masivas no intencionadas.

---

## RN-04: Mapeo de Errores de Prisma

| Código Prisma | Causa | HTTP | Mensaje |
|---|---|---|---|
| `P2002` | Violación de constraint unique | 409 Conflict | "El recurso ya existe" |
| `P2025` | Registro no encontrado en update/delete | 404 Not Found | "El recurso no fue encontrado" |
| Cualquier otro | Error inesperado de base de datos | 500 Internal Server Error | "Error interno del servidor" |

---

## RN-05: Stack Traces en Producción

**Regla**: En entorno de producción (`NODE_ENV === 'production'`), el `GlobalExceptionFilter` **nunca** debe incluir el stack trace en la respuesta HTTP.  
**Razón de seguridad**: Evitar exposición de información interna de la aplicación (OWASP A05: Security Misconfiguration).

---

## RN-06: Mensajes de Error de Validación

**Regla**: Los mensajes de validación de class-validator deben estar en **español**.  
**Implementación**: Usar el parámetro `message` en cada decorador de class-validator (ej. `@IsEmail({}, { message: 'El correo electrónico no es válido' })`).  
**Aplicación**: Esta regla aplica a todos los DTOs de todos los módulos.

---

## RN-07: Soft Delete — Comportamiento Universal

**Regla**: Los registros eliminados con soft delete (`deletedAt !== null`) deben ser excluidos automáticamente de todas las consultas de listado y detalle.  
**Implementación**: Todos los `findMany` y `findUnique` de Prisma en módulos que usen soft delete deben incluir `where: { deletedAt: null }`.  
**Excepción**: Solo las operaciones administrativas explícitas pueden incluir registros eliminados (fuera del alcance de Fase 2-5).

---

## RN-08: Guard de Roles — Precedencia

**Regla**: `RolesGuard` solo tiene efecto si `JwtAuthGuard` ya validó el token JWT. El orden correcto de guards en cada controlador es:  
1. `JwtAuthGuard` (autentica — verifica que el token sea válido)  
2. `RolesGuard` (autoriza — verifica que el rol sea suficiente)

**Regla**: Si un endpoint no tiene el decorador `@Roles()`, `RolesGuard` concede acceso (solo requiere autenticación).

---

## RN-09: Seguridad HTTP con Helmet

**Regla**: Helmet se aplica como middleware global en `main.ts` antes de iniciar el servidor.  
**Headers que activa**: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `X-XSS-Protection`, entre otros.  
**Razón**: Protección básica contra ataques de clickjacking, MIME sniffing y XSS (OWASP A05).

---

## RN-10: Variables de Entorno — Secretos

**Regla**: Los valores sensibles (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET) **nunca** deben tener valores por defecto en el código fuente.  
**Implementación**: Si una variable requerida está ausente, la aplicación debe fallar al inicio con un mensaje claro.  
**Razón de seguridad**: Prevenir que secretos débiles o vacíos lleguen a producción (OWASP A02: Cryptographic Failures).
