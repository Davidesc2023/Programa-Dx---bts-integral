# Diseño de Infraestructura — UDT-02: Users + Auth

## Arquivos del Proyecto (setup inicial)

```
/ (raíz)
├── package.json              ← dependencias NestJS + Prisma + JWT + bcrypt
├── tsconfig.json             ← ES2021, emitDecoratorMetadata:true
├── tsconfig.build.json       ← exclude spec files + node_modules
├── nest-cli.json             ← sourceRoot: "src"
├── jest.config.js            ← ts-jest, rootDir: src, testRegex: *.spec.ts
├── .env.example              ← DB_URL, JWT_SECRET, JWT_REFRESH_SECRET, etc.
└── prisma/
    └── schema.prisma         ← TODOS los modelos: User, RefreshToken, Patient,
                                 Order, Result, Appointment + enums
```

## Estructura de Módulos (UDT-02)

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── auth.service.spec.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       ├── refresh-token.dto.ts
│   │       └── logout.dto.ts
│   └── users/
│       ├── users.module.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── users.service.spec.ts
│       └── dto/
│           ├── create-user.dto.ts
│           └── update-user.dto.ts
└── app.module.ts             ← ACTUALIZAR: agregar AuthModule, UsersModule
```

## Variables de Entorno (nuevas en UDT-02)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgresql://user:pass@localhost:5432/lab_db` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `PORT` | Puerto del servidor | `3000` |
| `JWT_SECRET` | Secreto para access tokens | string aleatorio 64+ chars |
| `JWT_EXPIRES_IN` | Expiración del access token | `15m` |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens (diferente al access) | string aleatorio 64+ chars |
| `JWT_REFRESH_EXPIRES_IN` | Expiración del refresh token | `7d` |

## Esquema Prisma — Nuevos modelos en UDT-02

Tablas creadas en esta unidad:
- `users` — tabla principal de autenticación
- `refresh_tokens` — almacenamiento de refresh tokens para invalidación

Tablas definidas en schema (implementadas en UDTs posteriores):
- `patients`, `orders`, `results`, `appointments`

## Índices de Base de Datos

| Tabla | Campo | Tipo |
|---|---|---|
| `users` | `email` | UNIQUE (forzado por Prisma `@unique`) |
| `refresh_tokens` | `token` | UNIQUE (forzado por Prisma `@unique`) |
| `refresh_tokens` | `userId` | INDEX (FK, automático) |
