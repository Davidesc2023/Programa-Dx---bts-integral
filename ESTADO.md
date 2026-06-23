# APP-DX — Estado del Proyecto

**Última actualización:** 2026-06-23  
**Versión:** 2.3.0  
**Entorno:** Frontend → Vercel · Backend → Supabase Edge Functions (us-east-2)

---

## URLs de Producción

| Servicio | URL |
|----------|-----|
| Frontend | https://programa-dx-bts-integral.vercel.app |
| Backend  | https://wwosggahpasvoexshrdl.supabase.co/functions/v1/api |
| Supabase | https://supabase.com/dashboard/project/wwosggahpasvoexshrdl |

---

## Estado por Fase

### Fase 1 — Estructura del monorepo ✅
- Monorepo Next.js 14 (frontend) + Deno Edge Function (backend)
- CI/CD con GitHub Actions: lint → tests → deploy backend → deploy frontend
- TypeScript estricto en frontend y backend

### Fase 2 — Base de datos y migraciones ✅
- 7 migraciones SQL aplicadas en Supabase
- Tablas: tenants, usuarios, programas, casos, consentimientos, magic_links, audit_log, refresh_tokens
- RLS activado (backend usa service_role para bypasear de forma controlada)
- Soft deletes con `deleted_at` en todas las tablas críticas
- Índices en campos de filtro frecuente

### Fase 3 — Autenticación JWT ✅
- Login con bcrypt + JWT (access 15min / refresh 7d)
- Refresh de tokens con invalidación en base de datos
- Magic links para pacientes (SHA-256 hash, 72h expiry)
- Roles: ADMIN · OPERADOR · LABORATORIO · MEDICO · PACIENTE

### Fase 4 — Panel admin — gestión de casos ✅
- CRUD completo de casos con state machine validada
- Transiciones de estado verificadas en backend
- Evaluación automática de umbral sérico por programa

### Fase 5 — Formulario público médico ✅
- URL pública por tenant + programa: `/solicitud/{tenant}/{programa}`
- Sin registro de cuenta — solo datos del médico y paciente
- Generación de consecutivo automática

### Fase 6 — Autorización del paciente (magic links) ✅
- Link de autorización generado por admin desde el caso
- Token hasheado en SHA-256, un solo uso, 72h expiry
- Formulario de consentimiento en `/autorizar/{token}`

### Fase 7 — Panel DX Analytics ✅ (mejorado en v2.1)
- KPIs: total casos, pendientes autorización, indicación genética, completados, tasas
- Embudo de conversión clínica con 7 etapas
- **NUEVO v2.1:** Vista 360° del paciente (journey completo con drop-offs)
- **NUEVO v2.1:** Barra de filtros: programa, país, año, estado, médico
- Gráfica temporal agrupada por programa (últimos 12 meses)
- Heatmap médico × mes (top 10)
- Tabla de médicos ordenable
- Por departamento, por país, por año
- Backend: filtros por query params (`programa`, `pais`, `ano`, `medico`, `estado`)

### Fase 8 — Importación masiva ✅
- Importación desde Excel/CSV para datos históricos
- Validación de filas, reporte de errores por fila

### Fase 9 — Portal del paciente ✅
- Dashboard del paciente: órdenes, resultados, citas
- Login separado con rol PACIENTE

### Fase 10 — Reporte / exportación ✅
- Exportación CSV del listado de casos con filtros

### Fase 11 — Notificaciones ✅
- Notificaciones en header con contador de no leídas
- Notificaciones por email en eventos críticos (completado, resultado sérico)

---

## Correcciones aplicadas — v2.3.0 (2026-06-23)

### Migración JWT → httpOnly cookies (OWASP A03)

| Archivo | Cambio |
|---------|--------|
| `app/api/[...path]/route.ts` | Proxy intercepta login/refresh/logout para gestionar cookies. Lee `app_dx_access` cookie y la pasa como `x-user-token` al backend. Elimina tokens del cuerpo de respuesta de login. |
| `lib/token.ts` | Eliminadas funciones de localStorage. Nuevas helpers de sessionStorage: `getUserSession`, `setUserSession`, `clearUserSession` (info de usuario no-sensible). |
| `services/api.ts` | Eliminado interceptor de request (cookies son automáticas). Simplificado interceptor 401: `attemptRefresh()` llama a `/auth/refresh` sin body. |
| `services/auth.service.ts` | `logoutRequest()` sin argumentos (proxy lee cookie). `loginRequest()` retorna `{ user }` en lugar de `{ accessToken, refreshToken }`. |
| `types/api.types.ts` | `LoginResponse` actualizado: `{ user: LoginUser }` en lugar de tokens. |
| `modules/auth/authStore.ts` | `setUserFromToken(token)` → `setUser(user: AuthUser)`. |
| `modules/auth/useAuth.ts` | Login usa `response.user` + `setUserSession`. Logout sin token explícito. |
| `app/(protected)/layout.tsx` | Rehydración: sessionStorage → `/auth/me` (cookie enviada automáticamente). |
| `app/(portal)/layout.tsx` | Mismo patrón de rehydración. |

**Resultado:** Tokens de auth solo existen en cookies httpOnly (inaccesibles desde JS). XSS ya no puede robar sesiones activas.

---

## Correcciones aplicadas — v2.2.0 (2026-06-23)

### Revisión de código — hallazgos y fixes

| # | Hallazgo | Severidad | Solución |
|---|---------|-----------|---------|
| B1 | `actor_id: null` en todos los inserts de `audit_log` en `admin-casos.ts` — 6 endpoints (cambiarEstado, registrarResultadoSerico, setIndicacion, registrarResultadoGenetico, registrarSeguimiento, eliminarCaso) ignoraban `auth.sub` | **Alta** | Reemplazado `actor_id: null` por `actor_id: auth.sub` en los 6 inserts — ahora el audit trail registra quién realizó cada acción |
| B2 | `/auth/login` sin rate limiting — único endpoint crítico sin protección brute-force | **Alta** | Agregado `checkRateLimit` con límite 10 req/min por IP (`login:{ip}`) |
| B3 | `/auth/register-patient` sin rate limiting — exposición a spam de cuentas de paciente | **Media** | Agregado `checkRateLimit` con límite 5 req/min por IP (`regpat:{ip}`) |

### Plan de acción por fase

| Fase | Descripción | Prioridad | Estado |
|------|-------------|-----------|--------|
| **A** | Audit trail correcto + rate limiting login/register | Alta | ✅ Completado (v2.2.0) |
| **B** | Importar datos históricos (789 DAAT + 117 Wilson) | Alta | ✅ Completado (commit 3173d89) |
| **C** | Migrar JWT de localStorage a httpOnly cookies (OWASP A03) | Media | ✅ Completado (v2.3.0) |
| **D** | Zod validation en endpoints de escritura del backend | Baja | ⏳ Pendiente |
| **D** | Políticas RLS explícitas para rol `authenticated` | Baja | ⏳ Pendiente |
| **D** | Split Edge Function monolítica en módulos por dominio | Baja | ⏳ Pendiente |
| **D** | Tests E2E con Playwright para flujo completo | Baja | ⏳ Pendiente |

---

## Correcciones aplicadas — v2.1.2 (2026-06-19)

### Seguridad y calidad — code review

| # | Hallazgo | Severidad | Solución |
|---|---------|-----------|---------|
| S1 | `x-user-token` injection bypass — cliente podía suplantar usuario enviando header directamente | **Crítica** | Agregado `x-user-token` a `SKIP_REQUEST_HEADERS` en proxy; el proxy siempre lo sobreescribe |
| S2 | Token refresh roto — `authRefresh` solo devolvía `accessToken`, el cliente esperaba también `refreshToken`; sesión expirada forzaba logout | **Alta** | Backend ahora rota el refresh token (invalida el usado, emite uno nuevo); cliente recibe `{ accessToken, refreshToken }` |
| S3 | XSS almacenado en HTML del consentimiento — `body.notes` y nombre del médico se interpolaban sin escapar | **Alta** | Agregado helper `esc()` con escape de `& < > "` antes de insertar en HTML |
| S4 | Refresh token no se invalidaba al renovarse (token reuse attack) | Media | Resuelto como parte de S2 — rotación completa en cada refresh |
| S5 | URLs firmadas de PDFs médicos con duración 1 año | Media | Reducido a 90 días (7 776 000 s) |
| S6 | `authLogout` invalidaba cualquier refresh token sin verificar propiedad | Media | Ahora verifica el token con `verifyRefresh()` y filtra por `userId` antes de invalidar |
| Q1 | `void actor` en `labTestsCreate` — sin audit trail de creador | Baja | Actor usado como `createdBy` en el insert |
| Q2 | `void req` anti-pattern en `portalDashboard` y `portalConsentRespond` | Baja | Renombrado a `_req` para indicar intencional |
| Q3 | PDF generaba texto truncado a 90 caracteres — datos médicos se cortaban | Baja | Reemplazado con word-wrap real (máx 75 chars por línea) |

---

## Correcciones aplicadas — v2.1.1 (2026-06-18)

### Bugs resueltos
| # | Bug | Causa raíz | Solución |
|---|-----|-----------|---------|
| 14 | Dashboard muestra "Error al cargar" en producción | Usuario `david.sanguino@bts-integral.com` tenía rol PACIENTE → 403 en `/admin/dashboard` | Rol actualizado a ADMIN en DB |
| 15 | `por_programa` devolvía shape incorrecto | Query PostgREST con join anidado devuelve `{ programas: { codigo, nombre }, count }` en vez de `{ codigo, nombre, count }` | Calculado desde datos maestros `rawCasos`; eliminada la query separada |

---

## Correcciones aplicadas — v2.1 (2026-06-17)

### Bugs críticos resueltos
| # | Bug | Causa raíz | Solución |
|---|-----|-----------|---------|
| 1 | Dashboard muestra "Error al cargar" | `BACKEND_URL` no configurada en Vercel (solo `NEXT_PUBLIC_BACKEND_URL`) | Agregar fallback `NEXT_PUBLIC_BACKEND_URL` en proxy y páginas SSR |
| 2 | Links de médicos dan 404 | Mismo que #1 — SSR no alcanzaba el backend | Mismo fix + documentación en `.env.example` |
| 3 | Login redirige a `/dashboard` legacy | `useAuth.ts` tenía ruta incorrecta | Cambiado a `/dx/dashboard` |

### Seguridad
| # | Hallazgo | Severidad | Estado |
|---|---------|-----------|--------|
| 4 | Race condition en token refresh | Media | ✅ Resuelto — implementado promise queue |
| 5 | JWT en localStorage | Alta | ⚠️ Pendiente migración a httpOnly cookies |
| 6 | RLS no utilizado (service_role) | Media | ⚠️ Pendiente políticas RLS explícitas |
| 7 | Sin rate limiting en endpoints admin | Media | ⚠️ Pendiente |
| S1–S6 | Ver tabla v2.1.2 | Crítica–Media | ✅ Resueltos en v2.1.2 |

### UX / Diseño
| # | Cambio | Descripción |
|---|--------|------------|
| 8 | Paleta de colores | Actualizada a colores del logo: `#316358`, `#f3e159`, `#fafcfd`, `#3977e9` |
| 9 | Login redesignado | Panel izquierdo teal oscuro con logo blanco; panel derecho claro |
| 10 | Sidebar actualizado | Colores consistentes con nueva paleta |
| 11 | Dashboard — filtros | Barra de filtros: programa, país, año, estado, médico |
| 12 | Dashboard — Vista 360° | Journey del paciente con drop-off por etapa |
| 13 | Error handling mejorado | Distinción entre error de red vs 401, botón de reintentar |

---

## Variables de Entorno Requeridas en Vercel

> **IMPORTANTE:** Configurar AMBAS variables con el mismo valor en Vercel → Settings → Environment Variables:

```
BACKEND_URL=https://wwosggahpasvoexshrdl.supabase.co/functions/v1/api
NEXT_PUBLIC_BACKEND_URL=https://wwosggahpasvoexshrdl.supabase.co/functions/v1/api
```

El código usa `BACKEND_URL` en server-side (proxy, SSR) con fallback a `NEXT_PUBLIC_BACKEND_URL`.

---

## Pendientes Técnicos

### Alta prioridad
- [x] Configurar `BACKEND_URL` en Vercel ✅ (ya estaba configurado)
- [x] Rate limiting en `/auth/login` y `/auth/register-patient` ✅ (v2.2.0)
- [x] `actor_id` correcto en audit_log ✅ (v2.2.0)
- [x] Importar datos históricos ✅ — 788 DAAT + 117 Wilson = **905 casos** en producción (commit 3173d89)
- [x] Migrar JWT a httpOnly cookies ✅ (v2.3.0)

### Media prioridad
- [ ] Implementar políticas RLS explícitas para rol `authenticated` en Supabase
- [ ] Agregar Zod validation a requests en el backend Deno

### Baja prioridad
- [ ] Implementar tests E2E (Playwright) para flujo completo
- [ ] Archivar tablas legacy (`orders`, `patients`, `results`)
- [ ] Dividir Edge Function monolítica en módulos por dominio

---

## Estructura de Archivos Clave

```
frontend/src/
  app/
    api/[...path]/route.ts      ← Proxy hacia backend (usa BACKEND_URL)
    (auth)/login/               ← Página de login
    (protected)/dx/dashboard/   ← Panel DX analytics
    (protected)/dx/casos/       ← Lista de casos
    (public)/solicitud/         ← Formulario público médico
    (public)/autorizar/[token]/ ← Autorización del paciente
  modules/
    auth/                       ← Login, store, hooks
    dx/
      DxDashboard.tsx           ← Dashboard principal con filtros + 360°
      CasosList.tsx             ← Lista de casos
      CasoDetail.tsx            ← Detalle de caso
  services/
    api.ts                      ← Axios + refresh token queue
    admin-dx.service.ts         ← Servicios del panel DX
  types/
    dx.types.ts                 ← Tipos TypeScript del módulo DX

supabase/functions/api/
  index.ts                      ← Router principal (~1200 líneas)
  routes/
    admin-casos.ts              ← CRUD casos + dashboard (con filtros v2.1)
    formulario.ts               ← Formulario público
    autorizacion.ts             ← Magic links paciente
    admin-import.ts             ← Importación masiva
    admin-reporte.ts            ← Exportación CSV
  middleware/
    auth.ts                     ← JWT verify + roles
    cors.ts                     ← CORS headers
  utils/
    states.ts                   ← State machine + umbral genético
    email.ts                    ← Notificaciones por email
```
