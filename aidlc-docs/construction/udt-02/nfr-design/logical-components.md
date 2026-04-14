# Componentes Lógicos — UDT-02: Users + Auth

## Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────┐
│                       HTTP Request                           │
└─────────────────────────────┬────────────────────────────────┘
                              │
              ┌───────────────▼──────────────────┐
              │         AuthController           │
              │  POST /auth/register             │
              │  POST /auth/login                │
              │  POST /auth/refresh              │
              │  POST /auth/logout               │
              └───────────────┬──────────────────┘
                              │
              ┌───────────────▼──────────────────┐
              │          AuthService             │
              │  register() login()              │
              │  refresh() logout()              │
              │  generateTokens() [privado]      │
              └──────┬──────────────┬────────────┘
                     │              │
        ┌────────────▼───┐  ┌───────▼───────────┐
        │  PrismaService │  │    JwtService     │
        │  user.*        │  │  sign() verify()  │
        │  refreshToken.*│  └───────────────────┘
        └────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Rutas protegidas                          │
│                 JwtAuthGuard (extrae JWT)                    │
│                 JwtStrategy.validate() (verifica DB)         │
│                 RolesGuard (verifica rol)                    │
└──────────────────────────────────────────────────────────────┘

              ┌───────────────────────────────┐
              │       UsersController         │
              │  POST   /users                │
              │  GET    /users                │
              │  GET    /users/:id            │
              │  PATCH  /users/:id            │
              │  DELETE /users/:id            │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │         UsersService          │
              │  create() findAll()           │
              │  findOne() update() remove()  │
              └───────────────┬───────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   PrismaService    │
                    │   user.*           │
                    └────────────────────┘
```

## Módulos NestJS

```
AppModule
├── PrismaModule    (@Global)
├── AuthModule
│   ├── PassportModule
│   ├── JwtModule.registerAsync()
│   ├── AuthController
│   ├── AuthService
│   ├── JwtStrategy
│   └── JwtAuthGuard
└── UsersModule
    ├── UsersController
    └── UsersService
```

## Dependencias entre Módulos

- `UsersModule` exporta `UsersService` (lo puede necesitar AuthModule si se extiende).
- `AuthModule` exporta `JwtAuthGuard` y `JwtModule` (necesario para módulos futuros UDT-03...).
- `PrismaModule` es `@Global()` — disponible en todos los módulos sin importación explícita.

## Flujo de Autorización (request protegida)

```
Request con "Authorization: Bearer <access_token>"
        │
        ▼
JwtAuthGuard (extends AuthGuard('jwt'))
        │
        ▼
JwtStrategy.validate(payload) → prisma.user.findFirst({id, deletedAt:null})
        │ user encontrado            │ no encontrado
        ▼                            ▼
   req.user = payload          UnauthorizedException (401)
        │
        ▼
RolesGuard.canActivate()
        │ rol en @Roles()            │ rol NO en @Roles()
        ▼                            ▼
 Controller ejecuta           ForbiddenException (403)
```
