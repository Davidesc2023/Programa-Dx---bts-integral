# Reglas de Negocio — UDT-02: Users + Auth

## Grupo R01 — Registro y Autenticación

| ID | Regla | Tipo | Severidad |
|---|---|---|---|
| R01-001 | Solo un usuario con rol ADMIN puede registrar nuevos usuarios | Control de acceso | BLOQUEANTE |
| R01-002 | El email debe ser único en el sistema (activos y eliminados) | Unicidad | BLOQUEANTE |
| R01-003 | La contraseña debe tener mínimo 8 caracteres | Validación de entrada | BLOQUEANTE |
| R01-004 | La contraseña se almacena hasheada con bcrypt, 10 rondas de costo | Seguridad | BLOQUEANTE |
| R01-005 | El rol asignado al crear usuario debe ser exactamente uno de: ADMIN, OPERADOR, LABORATORIO | Validación de dominio | BLOQUEANTE |
| R01-006 | El mensaje de error ante credenciales incorrectas NO debe distinguir entre email inexistente y password incorrecto | Seguridad (anti-enumeración) | IMPORTANTE |

## Grupo R02 — Tokens JWT

| ID | Regla | Tipo | Severidad |
|---|---|---|---|
| R02-001 | El access token tiene validez de 15 minutos | Expiración | BLOQUEANTE |
| R02-002 | El refresh token tiene validez de 7 días | Expiración | BLOQUEANTE |
| R02-003 | El refresh token se persiste en la tabla `RefreshToken` con `expiresAt` calculado al momento de creación | Persistencia | BLOQUEANTE |
| R02-004 | Un refresh token invalidado (invalidatedAt != null) no puede usarse para renovar el access token | Seguridad | BLOQUEANTE |
| R02-005 | Un refresh token expirado (expiresAt < now()) no puede usarse para renovar el access token | Seguridad | BLOQUEANTE |
| R02-006 | El logout invalida el refresh token seteando `invalidatedAt = now()`. Si ya estaba invalidado, la operación termina sin error (idempotente) | Comportamiento | IMPORTANTE |

## Grupo R03 — Gestión de Usuarios

| ID | Regla | Tipo | Severidad |
|---|---|---|---|
| R03-001 | Solo ADMIN puede acceder a todas las rutas de `/users` | Control de acceso | BLOQUEANTE |
| R03-002 | La eliminación de usuario es lógica (soft delete): setea `deletedAt = now()` | Persistencia | BLOQUEANTE |
| R03-003 | Los usuarios eliminados no aparecen en listados ni son recuperables por API | Visibilidad | BLOQUEANTE |
| R03-004 | Solo se puede actualizar el campo `role` de un usuario existente | Alcance de actualización | IMPORTANTE |
| R03-005 | La respuesta de cualquier endpoint de usuario NUNCA incluye el campo `password` | Seguridad | BLOQUEANTE |
| R03-006 | Al crear o actualizar un usuario, se registra el ID del usuario actuante en `createdBy` / `updatedBy` | Auditoría | IMPORTANTE |

## Grupo R04 — Autorización por Roles

| ID | Regla | Tipo | Severidad |
|---|---|---|---|
| R04-001 | El JWT Access Token incluye claims: `sub` (userId), `email`, `role` | Diseño de token | BLOQUEANTE |
| R04-002 | La estrategia JWT verifica que el usuario exista en DB y no esté eliminado en cada request autenticado | Seguridad | BLOQUEANTE |
| R04-003 | Si el usuario del token fue eliminado después de emitido el token, la request es rechazada con 401 | Seguridad | BLOQUEANTE |
