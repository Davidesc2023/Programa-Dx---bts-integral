# Patrones de Diseño NFR — UDT-02: Users + Auth

## Patrón 1: Strategy (Passport.js)

**Aplicación**: Autenticación JWT vía `JwtStrategy extends PassportStrategy(Strategy)`
**Beneficio**: Desacopla el mecanismo de autenticación del controlador. Intercambiable (futuro: OAuth2, API Key).
**Implementación**:
- `jwt.strategy.ts` — extrae Bearer token, valida firma, verifica usuario en DB
- `jwt-auth.guard.ts` — facade de `AuthGuard('jwt')`, activa la estrategia

## Patrón 2: Guard (NestJS)

**Aplicación**: `JwtAuthGuard` para autenticación, `RolesGuard` para autorización
**Beneficio**: Separación de responsabilidades — autenticación vs autorización son guards independientes aplicables en cualquier combinación.
**Composición**:
```
@UseGuards(JwtAuthGuard, RolesGuard)   // autentica luego autoriza
@UseGuards(JwtAuthGuard)               // solo autenticación (sin rol requerido)
```

## Patrón 3: Repository implícito (PrismaService)

**Aplicación**: `UsersService` y `AuthService` inyectan `PrismaService` directamente.
**Justificación**: Para una aplicación de esta escala, el patrón Repository explícito es sobre-ingeniería. PrismaService actúa como la abstracción de acceso a datos.

## Patrón 4: DTO de respuesta segura (Projection)

**Aplicación**: `userSelect` en `UsersService` — define exactamente qué campos retorna Prisma.
**Beneficio**: Imposible exponer `password` accidentalmente — la columna nunca se carga en memoria para respuestas.
```typescript
const userSelect = {
  id: true, email: true, role: true,
  createdAt: true, updatedAt: true, createdBy: true, updatedBy: true
  // password: OMITIDO INTENCIONALMENTE
};
```

## Patrón 5: Token dual (Access + Refresh)

**Aplicación**: Auth flow completo.
**Flujo**:
```
                ┌─────────────────────┐
                │  POST /auth/login   │
                └──────────┬──────────┘
                           │
              ┌────────────▼─────────────┐
              │ access_token (15m, JWT)  │  → headers de cada request
              │ refresh_token (7d, JWT)  │  → almacenado en RefreshToken DB
              └──────────────────────────┘
                           │
              ┌────────────▼─────────────┐
              │ POST /auth/refresh       │  → nuevo access_token
              └──────────────────────────┘
                           │
              ┌────────────▼─────────────┐
              │ POST /auth/logout        │  → invalidatedAt=now()
              └──────────────────────────┘
```
