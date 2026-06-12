# Stack Técnico — APP-DX v2.0

**Última actualización:** 2026-06-12

---

## Visión general de la arquitectura

```
                    ┌─────────────────────────────┐
                    │         Internet             │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │     Vercel (CDN + Edge)          │
              │     Next.js 14 App Router        │
              │     programa-dx-bts-integral      │
              └────────────────┬────────────────┘
                               │ /api/* proxy
              ┌────────────────▼────────────────┐
              │   Supabase Edge Function `api`   │
              │   Deno / TypeScript              │
              │   wwosggahpasvoexshrdl           │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │   Supabase PostgreSQL (us-east-2)│
              │   RLS habilitado en todas las   │
              │   tablas                        │
              └─────────────────────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │   Supabase Storage               │
              │   PDFs de consentimiento y       │
              │   resultados adjuntos            │
              └─────────────────────────────────┘
```

---

## Frontend

### Framework

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Next.js** | 14 (App Router) | Framework principal |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.x | Estilos utilitarios |
| **React** | 18 | UI framework |

### Estado y datos

| Librería | Propósito |
|----------|-----------|
| **TanStack Query v5** | Fetching, caching y sincronización de datos del servidor |
| **Zustand** | Estado global del cliente (sesión admin, UI) |

### Formularios

| Librería | Propósito |
|----------|-----------|
| **React Hook Form** | Manejo de formularios del médico y paciente |
| **Zod** | Validación de schemas en cliente y servidor |

### UI

| Librería | Propósito |
|----------|-----------|
| **shadcn/ui** | Componentes base accesibles (Radix UI) |
| **Lucide React** | Iconos |
| **date-fns** | Manejo de fechas |

### Diseño — Clinical Sanctuary

| Token | Valor |
|-------|-------|
| Color primario (teal) | `#1B7A6B` |
| Color acento (amarillo) | `#F5C518` |
| Color secundario (azul) | `#4490D9` |
| Fuente headline | Manrope |
| Fuente body | Inter |
| Fondo | `#f8fafa` |

### Testing frontend

| Herramienta | Propósito |
|------------|-----------|
| **Jest** | Test runner |
| **React Testing Library** | Testing de componentes |
| **MSW (Mock Service Worker)** | Mocking de API en tests |
| **@testing-library/user-event** | Simulación de interacciones del usuario |

**Configuración:**
```
frontend/
├── jest.config.ts
├── jest.setup.ts
└── __tests__/
    ├── unit/
    │   ├── components/    ← tests de componentes aislados
    │   └── utils/         ← tests de funciones puras
    ├── integration/       ← tests de flujos completos (form → submit)
    └── setup/
        └── msw-handlers.ts
```

**Cobertura mínima requerida:** 80% en funciones de negocio críticas.

---

## Backend

### Runtime y framework

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Deno** | 2.x | Runtime de la Edge Function |
| **TypeScript** | 5.x | Lenguaje principal |
| **Supabase Edge Functions** | — | Hosting y deployment del backend |

### Organización del backend

```
supabase/functions/api/
├── index.ts              ← router principal
├── deno.json             ← configuración Deno
├── routes/
│   ├── auth.ts           ← admin login/refresh
│   ├── casos.ts          ← CRUD casos + state machine
│   ├── formulario.ts     ← endpoints públicos (médico + paciente)
│   ├── magic-links.ts    ← generación y validación de tokens
│   ├── consentimientos.ts← CRUD plantillas
│   ├── importar.ts       ← import/export Excel
│   ├── reportes.ts       ← reportes y exports
│   ├── tenants.ts        ← gestión multi-tenant (SUPER_ADMIN)
│   └── programas.ts      ← catálogo de programas
├── middleware/
│   ├── auth.ts           ← validación JWT admin
│   ├── tenant.ts         ← resolución de tenant por slug
│   └── rateLimit.ts      ← rate limiting por IP
├── services/
│   ├── token.ts          ← generación de magic links seguros
│   ├── pdf.ts            ← generación de PDFs de consentimiento
│   ├── storage.ts        ← upload/download Supabase Storage
│   └── notifications.ts  ← envío de alertas (futuro: WhatsApp/email)
├── utils/
│   ├── validators.ts     ← validación de datos con Zod
│   ├── states.ts         ← state machine del caso
│   └── normalization.ts  ← normalización de datos Excel
└── _tests/
    ├── routes/           ← tests de rutas
    ├── services/         ← tests de servicios
    └── utils/            ← tests de utilidades
```

### Testing backend (Deno)

```typescript
// Comando para correr tests
deno test --allow-net --allow-env supabase/functions/api/_tests/
```

**Áreas de test obligatorias:**
- Generación y validación de magic links (expiración, un solo uso)
- State machine del caso (todas las transiciones válidas e inválidas)
- Validación de datos del formulario público
- Aislamiento multi-tenant (un tenant no puede leer datos de otro)
- Normalización de estados en importación Excel

---

## Base de Datos

### Motor

| Tecnología | Detalle |
|-----------|---------|
| **PostgreSQL** | Supabase managed, us-east-2 |
| **Row Level Security** | Habilitado en todas las tablas |
| **Migraciones** | Archivos SQL versionados en `supabase/migrations/` |

### Tablas principales

```
tenants              ← empresas / operadores del programa
programas            ← Wilson, DAAT, Duchenne (por tenant)
admin_users          ← usuarios con cuenta (SUPER_ADMIN, ADMIN, OPERADOR)
consentimientos      ← plantillas por programa + país + tipo + versión
casos                ← registro central de cada solicitud médica
magic_links          ← tokens para paciente y resultados
audit_log            ← registro de todas las acciones con actor + IP
```

### Convenciones SQL

- UUIDs para todos los IDs primarios
- `created_at` y `updated_at` en todas las tablas (auto-update via trigger)
- Soft delete con `deleted_at` en tablas principales
- `tenant_id` en todas las tablas de datos — filtrado por RLS

---

## Almacenamiento

| Servicio | Propósito |
|---------|-----------|
| **Supabase Storage** | PDFs de consentimiento firmados, resultados adjuntos |

**Estructura de buckets:**
```
consentimientos/
  └── [tenant_id]/[caso_id]/consentimiento.pdf

resultados/
  └── [tenant_id]/[caso_id]/resultado-serico.pdf
  └── [tenant_id]/[caso_id]/resultado-genetico.pdf

imports/
  └── [tenant_id]/temp/[upload_id].xlsx    ← temporal, se limpia post-import
```

**Seguridad de Storage:**
- Buckets privados — acceso solo via service_role desde la Edge Function
- Links de descarga firmados con expiración (1h para resultados)
- Validación de MIME type antes de guardar
- Límite de tamaño: 10MB por archivo

---

## Infraestructura y CI/CD

### Hosting

| Servicio | Qué hostea |
|---------|-----------|
| **Vercel** | Frontend Next.js 14 |
| **Supabase** | Edge Function + PostgreSQL + Storage |
| **GitHub** | Repositorio + CI/CD |

### Variables de entorno

**Frontend (Vercel):**
```
NEXT_PUBLIC_BACKEND_URL=https://wwosggahpasvoexshrdl.supabase.co/functions/v1/api
```

**Backend (Supabase Edge Function secrets):**
```
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=https://programa-dx-bts-integral.vercel.app
SUPABASE_URL=https://wwosggahpasvoexshrdl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

### CI/CD — GitHub Actions

```
.github/workflows/ci-cd.yml

En cada push a main:
  1. Lint + type-check (frontend)
  2. Tests unitarios frontend (Jest)
  3. Tests backend (Deno test)
  4. Deploy Edge Function → Supabase
  5. Deploy Frontend → Vercel

En cada PR:
  1. Lint + type-check
  2. Tests unitarios
  3. Preview deployment en Vercel
```

**Secrets requeridos en GitHub:**
```
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_ID
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

---

## Seguridad

### Autenticación admin

- JWT access token (15 min) + refresh token (7 días)
- Almacenados en httpOnly cookies (no localStorage)
- bcrypt para contraseñas (cost factor 12)

### Magic links

- Token: 64 bytes aleatorios (CSPRNG via `crypto.getRandomValues`)
- Almacenado como hash SHA-256 en DB (el token plano nunca persiste)
- Un solo uso: se invalida inmediatamente al ser usado
- Expiración: 72 horas configurables por tenant
- Rate limit: máximo 5 generaciones por caso en 24h

### Headers HTTP

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Rate limiting

| Endpoint | Límite |
|---------|--------|
| `POST /solicitud/*` (form médico) | 20 req/hora por IP |
| `POST /autorizar/:token` | 5 intentos por token |
| `POST /admin/auth/login` | 10 intentos/hora por IP |

---

## Estructura del Repositorio

```
APP-DX/
├── frontend/                      ← Next.js 14 (Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/           ← panel admin (requiere login)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── casos/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── importar/
│   │   │   │   ├── consentimientos/
│   │   │   │   ├── laboratorios/
│   │   │   │   └── reportes/
│   │   │   ├── solicitud/         ← formularios públicos (médico)
│   │   │   │   └── [tenant]/
│   │   │   │       ├── wilson/
│   │   │   │       ├── alfa1/
│   │   │   │       └── duchenne/
│   │   │   ├── autorizar/         ← link privado paciente
│   │   │   │   └── [token]/
│   │   │   ├── resultados/        ← link de resultados
│   │   │   │   └── [token]/
│   │   │   ├── login/
│   │   │   ├── layout.tsx
│   │   │   └── api/[...path]/     ← proxy a Edge Function
│   │   ├── components/
│   │   │   ├── ui/                ← componentes base (Button, Input, etc.)
│   │   │   ├── layout/            ← AppLayout, Sidebar, Header
│   │   │   ├── casos/             ← CasoCard, CasoTimeline, KanbanBoard
│   │   │   ├── forms/             ← DoctorForm, PatientAuthForm
│   │   │   └── consentimientos/   ← ConsentViewer, ConsentEditor
│   │   ├── modules/
│   │   │   ├── admin/             ← lógica del panel admin
│   │   │   ├── solicitud/         ← lógica del form del médico
│   │   │   └── autorizar/         ← lógica de autorización del paciente
│   │   ├── lib/
│   │   │   ├── api.ts             ← cliente HTTP
│   │   │   ├── auth.ts            ← helpers JWT admin
│   │   │   └── utils.ts
│   │   └── types/
│   │       ├── caso.ts
│   │       ├── tenant.ts
│   │       └── api.ts
│   ├── __tests__/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── setup/
│   ├── jest.config.ts
│   ├── jest.setup.ts
│   └── package.json
│
├── supabase/
│   ├── functions/
│   │   └── api/
│   │       ├── index.ts
│   │       ├── deno.json
│   │       ├── routes/
│   │       ├── middleware/
│   │       ├── services/
│   │       ├── utils/
│   │       └── _tests/
│   └── migrations/
│       ├── 001_multitenancy_base.sql
│       ├── 002_programas.sql
│       ├── 003_casos.sql
│       ├── 004_consentimientos.sql
│       ├── 005_magic_links.sql
│       ├── 006_audit_log.sql
│       └── 007_rls_policies.sql
│
├── scripts/
│   ├── migrate-excel.ts           ← migración de datos históricos
│   └── seed-tenant.ts             ← seed inicial de tenant BTS
│
├── doc/
│   ├── PRD.md
│   ├── PLAN.md
│   ├── MVP.md
│   ├── STACK.md                   ← este archivo
│   ├── USER-STORIES.md
│   ├── MANUAL.md
│   └── files/                     ← Excel históricos
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── .env.example
├── .gitignore
└── vercel.json
```
