# APP-DX — Estado del Proyecto

**Última actualización:** 2026-06-18  
**Versión:** 2.1.1  
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
- [ ] Importar datos históricos (~789 DAAT + ~117 Wilson desde Excel)
- [ ] Migrar JWT a httpOnly cookies (seguridad OWASP A03)

### Media prioridad
- [ ] Implementar políticas RLS explícitas en Supabase
- [ ] Agregar rate limiting a endpoints de escritura admin
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
