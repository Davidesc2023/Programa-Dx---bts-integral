# Estado del Proyecto APP-DX — Junio 2026

> Documento de referencia: resume todo lo implementado, el estado actual de cada componente y los pasos exactos que faltan para tener el sistema al 100 % en producción.
> Última actualización: 2026-06-11

---

## Arquitectura final

```
Browser
  └─► Vercel (Next.js 14)          programa-dx-bts-integral.vercel.app
        └─► /api/[...path] proxy
              └─► Supabase Edge Function `api`   (Deno/TypeScript)
                    └─► Supabase PostgreSQL       wwosggahpasvoexshrdl (us-east-2)
```

- **Frontend**: Vercel — proyecto `programa-dx-bts-integral` (`prj_zhkvLBtI6incOSGZCiEHgtqBGXkW`)
- **Backend**: Supabase Edge Function `api` — ID `7a433851-c193-4f8c-820d-0eca3642fed2`
- **Base de datos**: Supabase App_DX — project ID `wwosggahpasvoexshrdl`
- **Repositorio**: GitHub `Davidesc2023/Programa-Dx---bts-integral`

---

## ✅ Completado

### Infraestructura
- [x] Migración completa de Railway → Supabase + Vercel
- [x] Monorepo en GitHub: backend en raíz `/`, frontend en `/frontend`
- [x] CI/CD con GitHub Actions (`.github/workflows/ci-cd.yml`): tests + build + deploy automático en push a `main`
- [x] **CI/CD actualizado** (2026-06-11): job `deploy-backend` ahora usa `supabase functions deploy` (ya no apunta a Vercel)
- [x] Frontend desplegado y accesible en `programa-dx-bts-integral.vercel.app`
- [x] Base de datos con schema Prisma completo migrado a Supabase (11 tablas, 15 lab tests de semilla)
- [x] Proxy Next.js `/api/[...path]` — reenvía todas las llamadas del browser al backend sin exponer la URL en el cliente

### Backend (Supabase Edge Function)
- [x] Reescritura completa del backend NestJS → Deno/TypeScript Edge Function
- [x] Desplegado como función `api` en Supabase (estado: ACTIVE)
- [x] URL base: `https://wwosggahpasvoexshrdl.supabase.co/functions/v1/api`
- [x] Autenticación JWT (access token 15 min + refresh token 7 días), misma lógica que NestJS original
- [x] Control de acceso por rol (ADMIN, OPERADOR, LABORATORIO, MEDICO, PACIENTE)
- [x] CORS con soporte multi-origen configurable

### Módulos implementados (68+ endpoints)
| Módulo | Endpoints | Estado |
|--------|-----------|--------|
| Auth | login, register, register-patient, refresh, logout, me | ✅ |
| Users | CRUD + paginación + búsqueda | ✅ |
| Patients | CRUD + paginación + búsqueda | ✅ |
| Orders | CRUD + máquina de estados + transiciones por rol | ✅ |
| Consents | create, get, sign (médico), send, respond (paciente) | ✅ |
| Lab Tests | catálogo, prerequisito por paciente, CRUD admin | ✅ |
| Results | CRUD con soft-delete | ✅ |
| Appointments | CRUD + cambio de estado + notificación | ✅ |
| Notifications | lista, contador no leídas, marcar leída/todas | ✅ |
| Patient Portal | dashboard, órdenes, resultados, citas, consentimientos | ✅ |

### Seguridad
- [x] bcrypt para contraseñas (10 rounds)
- [x] JWT HS256 con secretos separados para access y refresh
- [x] Tokens de refresco almacenados en BD con invalidación
- [x] Headers de seguridad (CORS, Content-Type)
- [x] Validación de roles en cada endpoint

### Base de datos
- [x] **Usuario ADMIN inicial creado** (2026-06-11)
  - Email: `admin@botoshop.com`
  - Password: `uC6w4B9GN3RHL3bP`  ← guardar en gestor de contraseñas
  - ID: `85e7df28-d831-4bac-a781-dc9c6c53b9b4`

---

## ✅ Sistema 100% OPERATIVO (verificado 2026-06-11)

### Smoke test admin (vía `https://programa-dx-bts-integral.vercel.app`)

| Check | Resultado |
|-------|-----------|
| `GET /api/health` | `{"status":"ok","version":"2.0.0"}` ✅ |
| `POST /api/auth/login` | 200, accessToken generado ✅ |
| `GET /api/auth/me` | datos del admin correctos ✅ |
| `GET /api/notifications` | lista vacía 200 ✅ |

### Portal del Paciente — Playwright test 14/14 PASS (2026-06-11)

Usuario de prueba: `paciente@botoshop.com` / `Pac123456!`

| Paso | Resultado |
|------|-----------|
| Login PACIENTE → redirect `/portal/dashboard` | ✅ |
| Header "Portal del Paciente" visible | ✅ |
| Navbar: Inicio / Mis Órdenes / Resultados / Citas | ✅ |
| Email del paciente visible en header | ✅ |
| Dashboard: "Bienvenido" + stats (1 orden activa, 1 resultado) | ✅ |
| Página Mis Órdenes carga 2 órdenes | ✅ |
| Detalle de orden (id, fecha, diagnóstico, estado) | ✅ |
| Página Resultados: Alfa-1 Antitripsina 142 mg/dL | ✅ |
| Página Citas: carga correctamente (sin citas aún) | ✅ |
| Sin errores JS críticos | ✅ |

### Bugs corregidos durante el test del portal (2026-06-11)
- `PortalDashboard` type: backend retorna arrays, frontend esperaba números → corregido `.length`
- `use(params)` Next.js 15 en Next.js 14 → corregido a `params` objeto plano
- Commits: `bfc71c3`, `85b1e88`

---

## ⚠️ Pendiente — IMPORTANTE

### 1. Edge Function source en el repositorio

El código fuente de la Edge Function `api` (Deno/TypeScript) **no está en el repositorio git**. Está desplegado directamente en Supabase pero no versionado localmente.

**Riesgo:** si se necesita modificar el backend, no hay fuente para editar y hacer CI/CD.

**Acción recomendada:** exportar el código desde Supabase y guardarlo en `supabase/functions/api/index.ts` para que el CI/CD lo gestione.

---

## 🔧 Pendiente — MEJORAS (no bloquean producción)

### 2. Row Level Security (RLS) en Supabase

Las 11 tablas tienen RLS deshabilitado. El backend usa `service_role_key` (bypasea RLS), por lo que es seguro funcionalmente. Sin embargo, como buena práctica defense-in-depth se recomienda habilitarlo con políticas apropiadas.

**Advertencia:** habilitar RLS sin políticas bloquea TODO acceso. Solo hacer si se definen las políticas correspondientes.

### 3. PDFs de consentimientos (generación + almacenamiento)

`consentSign` genera HTML (guardado en `documentHtml`). La generación de PDF real no está implementada.

**Solución:** Edge Function separada `generate-pdf` usando `pdf-lib` + Cloudflare R2.

Secrets requeridos en Supabase cuando sea necesario:

| Secret | Descripción |
|--------|-------------|
| `R2_BUCKET` | Nombre del bucket en Cloudflare R2 |
| `R2_ACCOUNT_ID` | Account ID de Cloudflare |
| `R2_ACCESS_KEY_ID` | Clave de acceso R2 |
| `R2_SECRET_ACCESS_KEY` | Secret R2 |
| `R2_PUBLIC_URL` | URL pública del bucket |

### 4. Eliminar proyecto `app-dx-api` de Vercel

Proyecto deshabilitado de un intento anterior de desplegar NestJS. No se usa. Eliminar desde Vercel Dashboard para evitar confusión.

### 5. Dominio personalizado

La app corre en `programa-dx-bts-integral.vercel.app`. Si se quiere dominio propio (ej: `app.botoshop.com`), configurar en Vercel Dashboard → Domains.

---

## Credenciales generadas (2026-06-11) — guardar en gestor de contraseñas

| Clave | Valor |
|-------|-------|
| Admin email | `admin@botoshop.com` |
| Admin password | `uC6w4B9GN3RHL3bP` |
| JWT_SECRET | `iHvRUM2gVmhSBfquMdp/+g/GETyC6cDCWkPz2af0ohIbeHEQ2KjLQervhTiR/gK0` |
| JWT_REFRESH_SECRET | `4zAtiMd0FomITcFxDKYByycoXM7KmiftEtgtELYZIOIw6+F6LaGpVV/txBDtKIEl` |

---

## Referencia de URLs y IDs

| Componente | URL / ID |
|-----------|----------|
| Frontend (producción) | `https://programa-dx-bts-integral.vercel.app` |
| Backend (Edge Function) | `https://wwosggahpasvoexshrdl.supabase.co/functions/v1/api` |
| Supabase Dashboard | `https://supabase.com/dashboard/project/wwosggahpasvoexshrdl` |
| Vercel proyecto frontend | `prj_zhkvLBtI6incOSGZCiEHgtqBGXkW` |
| Vercel team | `team_ulPxS0vuyEXzQGBYum5EOpUg` (david-34ce7847) |
| GitHub repo | `https://github.com/Davidesc2023/Programa-Dx---bts-integral` |
| Supabase project ID | `wwosggahpasvoexshrdl` (región us-east-2) |
| Edge Function ID | `7a433851-c193-4f8c-820d-0eca3642fed2` |

---

## Historial de decisiones técnicas clave

| Decisión | Razón |
|----------|-------|
| NestJS → Supabase Edge Functions | ncc bundler es incompatible con el sistema de módulos dinámicos de NestJS; la función fallaba con error de resolución de módulos en Vercel |
| Railway → Supabase | Consolidar DB y backend en un solo proveedor; evitar costo adicional de Railway |
| `@sparticuz/chromium` → `@sparticuz/chromium-min` | El paquete original tiene 80 MB, supera el límite de Vercel; la versión `-min` descarga el binario desde CDN en tiempo de ejecución |
| Single Edge Function vs múltiples | Routing manual en un solo archivo evita cold-start en múltiples funciones y simplifica el despliegue |
| verify_jwt: false | La Edge Function implementa su propio sistema JWT; no usar Supabase Auth (migrar auth hubiera roto todos los tokens existentes) |
| Admin via pgcrypto | Se usó `crypt()` de pgcrypto directamente en SQL para evitar depender de un cliente externo para generar el hash bcrypt |
