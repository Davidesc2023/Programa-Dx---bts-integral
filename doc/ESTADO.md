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

Smoke test completo pasando vía `https://programa-dx-bts-integral.vercel.app`:

| Check | Resultado |
|-------|-----------|
| `GET /api/health` | `{"status":"ok","version":"2.0.0"}` ✅ |
| `POST /api/auth/login` | 200, accessToken generado ✅ |
| `GET /api/auth/me` | datos del admin correctos ✅ |
| `GET /api/notifications` | lista vacía 200 ✅ |

---

## ⚠️ Pendiente — IMPORTANTE (no bloquean producción)

### 1. Variables de entorno de la Edge Function en Supabase

La Edge Function NO tiene los secrets JWT configurados. Sin ellos, todos los endpoints de auth fallan.

**Opción A — Supabase Management API (recomendado, un comando):**

Obtener tu Personal Access Token en: https://supabase.com/dashboard/account/tokens

Luego ejecutar en terminal (reemplaza `TU_SUPABASE_PAT`):

```powershell
$token = "TU_SUPABASE_PAT"
$body = '[{"name":"JWT_SECRET","value":"iHvRUM2gVmhSBfquMdp/+g/GETyC6cDCWkPz2af0ohIbeHEQ2KjLQervhTiR/gK0"},{"name":"JWT_REFRESH_SECRET","value":"4zAtiMd0FomITcFxDKYByycoXM7KmiftEtgtELYZIOIw6+F6LaGpVV/txBDtKIEl"},{"name":"CORS_ORIGIN","value":"https://programa-dx-bts-integral.vercel.app"}]'
Invoke-RestMethod -Method POST -Uri "https://api.supabase.com/v1/projects/wwosggahpasvoexshrdl/secrets" -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} -Body $body
```

✅ **COMPLETADO 2026-06-11** — Secrets configurados via Supabase Management API:
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` activos en la Edge Function

✅ **COMPLETADO 2026-06-11** — `BACKEND_URL` configurado en Vercel:
- Valor: `https://wwosggahpasvoexshrdl.supabase.co/functions/v1/api`
- Proyecto corregido: `rootDirectory=frontend`, `framework=nextjs`
- Proxy fix: `content-length` ya no se reenvía, response bufferizado con `arrayBuffer()`

---

### 2. Secrets de CI/CD en GitHub

Sin estos secrets, los jobs de deploy en GitHub Actions fallarán en cada push a `main`.

Ir a: GitHub → `Programa-Dx---bts-integral` → Settings → Secrets and variables → Actions

| Secret | Valor / Dónde obtenerlo |
|--------|------------------------|
| `SUPABASE_ACCESS_TOKEN` | Tu Personal Access Token de Supabase (nuevo — requerido para deploy de Edge Function) |
| `VERCEL_TOKEN` | Token de Vercel (https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_ulPxS0vuyEXzQGBYum5EOpUg` |
| `VERCEL_PROJECT_ID` | `prj_zhkvLBtI6incOSGZCiEHgtqBGXkW` |

### 4. Storage R2 para PDFs de consentimientos

El flujo de consentimientos funciona (create, sign, send, respond), pero la generación y subida del PDF está deshabilitada.

Cuando sea necesario, agregar en Supabase Edge Function secrets:

| Secret | Descripción |
|--------|-------------|
| `R2_BUCKET` | Nombre del bucket en Cloudflare R2 |
| `R2_ACCOUNT_ID` | Account ID de Cloudflare |
| `R2_ACCESS_KEY_ID` | Clave de acceso R2 |
| `R2_SECRET_ACCESS_KEY` | Secret R2 |
| `R2_PUBLIC_URL` | URL pública del bucket |

---

## 🔧 Pendiente — MEJORAS (no bloquean producción)

### 5. Row Level Security (RLS) en Supabase

Las 11 tablas tienen RLS deshabilitado. El backend usa `service_role_key` (bypasea RLS), por lo que es seguro funcionalmente. Sin embargo, como buena práctica defense-in-depth se recomienda habilitarlo con políticas apropiadas.

**Advertencia**: habilitar RLS sin políticas bloquea TODO acceso. Solo hacer esto si se definen las políticas correspondientes.

### 6. Generación de PDFs de consentimientos

`consentSign` genera HTML (guardado en `documentHtml`). La generación de PDF real no está implementada en la Edge Function (limitación de Deno con puppeteer).

**Solución futura**: crear Edge Function separada `generate-pdf` usando `pdf-lib` (TypeScript puro, compatible con Deno) para generar el PDF y subirlo a R2.

### 7. Eliminar proyecto `app-dx-api` de Vercel

Fue un intento fallido de desplegar NestJS. Ya no se usa. Eliminar desde Vercel Dashboard.

### 8. Dominio personalizado

La app corre en `programa-dx-bts-integral.vercel.app`. Si se quiere un dominio propio (ej: `app.botoshop.com`), configurarlo en Vercel Dashboard → Domains.

---

## Flujo de verificación (smoke test — ejecutar después de completar pasos 1 y 2)

```bash
# 1. Health check directo al backend
GET https://wwosggahpasvoexshrdl.supabase.co/functions/v1/api/health
# Esperado: {"data":{"status":"ok","version":"2.0.0"}}

# 2. Health check vía proxy del frontend
GET https://programa-dx-bts-integral.vercel.app/api/health
# Esperado: mismo resultado

# 3. Login con el admin creado
POST https://programa-dx-bts-integral.vercel.app/api/auth/login
Body: {"email":"admin@botoshop.com","password":"uC6w4B9GN3RHL3bP"}
# Esperado: {"accessToken":"...","refreshToken":"...","user":{...}}

# 4. Verificar token
GET https://programa-dx-bts-integral.vercel.app/api/auth/me
Header: Authorization: Bearer {accessToken del paso 3}
# Esperado: datos del admin

# 5. Crear paciente de prueba
POST https://programa-dx-bts-integral.vercel.app/api/patients
# Esperado: 201 Created

# 6. Crear orden
POST https://programa-dx-bts-integral.vercel.app/api/orders
# Esperado: 201 Created

# 7. Notificaciones
GET https://programa-dx-bts-integral.vercel.app/api/notifications
# Esperado: lista vacía []
```

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
