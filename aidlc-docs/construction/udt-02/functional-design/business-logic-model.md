# Modelo de Lógica de Negocio — UDT-02: Users + Auth

## 1. Flujos de Negocio Principales

### 1.1 Registro de Usuario (POST /auth/register)
```
[ADMIN autenticado] → [Validar unicidad de email] → [Hash password bcrypt/10] →
[Crear User en DB] → [Retornar {id, email, role} sin password]
```
**Restricción crítica**: Solo ADMIN puede registrar nuevos usuarios.

### 1.2 Login (POST /auth/login)
```
[Usuario no autenticado] → [Buscar email en DB (deletedAt=null)] →
[bcrypt.compare password] → [Generar access token (JWT/15m)] →
[Generar refresh token (JWT/7d) y persistir en RefreshToken] →
[Retornar {accessToken, refreshToken}]
```
**Decisión de seguridad**: El mensaje de error es genérico ("Credenciales inválidas") sin revelar si el email existe.

### 1.3 Renovación de Token (POST /auth/refresh)
```
[Cliente con refresh token] → [Buscar token en RefreshToken] →
[Verificar: invalidatedAt=null AND expiresAt>now()] →
[Generar nuevo access token] → [Retornar {accessToken}]
```
**No hay rotación de refresh token** — se mantiene el mismo RT hasta invalidación explícita o expiración.

### 1.4 Logout (POST /auth/logout)
```
[Usuario con refresh token] → [updateMany WHERE token=X AND invalidatedAt=null] →
[Setear invalidatedAt=now()] → [Respuesta 200 OK]
```
**Idempotente**: Si el token ya fue invalidado, la operación no lanza error.

### 1.5 CRUD de Usuarios (solo ADMIN)
```
POST   /users           → create(dto, createdBy)   → User sin password
GET    /users           → findAll(page, limit)      → PaginatedResponse<User>
GET    /users/:id       → findOne(id)               → User sin password
PATCH  /users/:id       → update(id, dto, updatedBy) → User sin password
DELETE /users/:id       → softDelete(id, deletedBy) → 200 OK
```

## 2. Invariantes del Dominio

| Invariante | Descripción |
|---|---|
| Email único | No puede haber dos usuarios con el mismo email (activos o eliminados). La unicidad la garantiza el índice único de Prisma. |
| Password nunca expuesto | La columna `password` nunca se incluye en respuestas. Se usa `select` explícito en Prisma. |
| Soft delete consistente | `deletedAt` se setea en la operación de eliminación. Las consultas siempre filtran `{deletedAt: null}`. |
| Refresh token invalidado | Un refresh token con `invalidatedAt != null` es irrecuperable. Solo se puede crear uno nuevo con login. |
| Auto-eliminación protegida | Un ADMIN no puede eliminar su propio usuario (protección a implementar con validación en service). |

## 3. Modelo de Estado — Ciclo de Vida del Usuario

```
ACTIVO (deletedAt=null)
    │
    ▼
ELIMINADO (deletedAt=timestamp)  ← unidireccional, no reversible
```

## 4. Modelo de Estado — Refresh Token

```
VÁLIDO (invalidatedAt=null AND expiresAt>now())
    ├── logout / nueva sesión → INVALIDADO (invalidatedAt=timestamp)
    └── tiempo > 7d           → EXPIRADO (expiresAt<now())
```
