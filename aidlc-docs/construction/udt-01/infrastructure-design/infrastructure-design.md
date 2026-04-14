# Infrastructure Design — UDT-01: Application Layer

---

## Alcance

UDT-01 es una unidad de código puro (sin infraestructura de nube ni servicios externos propios). Su infraestructura se limita al entorno de ejecución local/Docker definido en UDT-07. Este documento describe los componentes de runtime sobre los que opera.

---

## Componentes de Infraestructura

| Componente Lógico | Infraestructura | Configuración |
|---|---|---|
| Aplicación NestJS | Node.js 20 LTS (proceso) | Puerto `3000` (configurable vía `PORT` env var) |
| Base de datos | PostgreSQL 15 (contenedor Docker en UDT-07) | Conexión vía `DATABASE_URL` en `.env` |
| Secretos / Configuración | Variables de entorno (`.env` local, env de Docker Compose) | Listadas en `.env.example` |

---

## Variables de Entorno Requeridas por UDT-01

| Variable | Descripción | Ejemplo | Requerida |
|---|---|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL (Prisma format) | `postgresql://user:pass@localhost:5432/labdb` | ✅ |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` | ✅ |
| `PORT` | Puerto del servidor HTTP | `3000` | Opcional (default: 3000) |

> Las variables de JWT (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`) pertenecen a UDT-02 y se documentan en su infrastructure-design.

---

## Arquitectura de Despliegue (contexto UDT-01)

```
┌─────────────────────────────────────────────────────┐
│  Docker Compose (definido en UDT-07)                │
│                                                     │
│  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │  nestjs-app          │  │  postgres           │  │
│  │  Node.js 20 LTS      │──│  PostgreSQL 15      │  │
│  │  Puerto: 3000        │  │  Puerto: 5432       │  │
│  └──────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │
         ▼ expuesto al host
    localhost:3000
```

---

## Notas de Infraestructura Compartida

- `PrismaModule` es **global** — no requiere ser importado individualmente por cada módulo de dominio
- El `Dockerfile` y `docker-compose.yml` serán generados en **UDT-07**
- Las migraciones Prisma se ejecutarán como paso inicial del contenedor (`prisma migrate deploy` en el entrypoint)
