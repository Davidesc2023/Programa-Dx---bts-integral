# Estado del Proyecto APP-DX — Junio 2026

> Última actualización: 2026-06-16 (rev 8 — UI/UX DX: Sidebar DX-first, responsividad, thresholds genéticos, notificaciones, login premium)
>
> **PIVOTE MAYOR:** El sistema fue rediseñado para operar con magic links sin cuentas de médico/paciente, arquitectura multi-tenant y soporte multi-país. Ver PRD.md, PLAN.md y STACK.md para el detalle completo.

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
- [x] **RLS habilitado en las 11 tablas** (2026-06-11): `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` aplicado. El backend usa `service_role_key` (bypasea RLS siempre); acceso directo por `anon` key queda bloqueado.
- [x] **Edge Function source en repositorio** (2026-06-11): `supabase/functions/api/index.ts` + `supabase/functions/api/deno.json` exportados desde Supabase y versionados en git. CI/CD puede redesplegar el backend.
- [x] **Proyecto `app-dx-api` eliminado de Vercel** (2026-06-11): proyecto obsoleto (intento NestJS fallido) eliminado vía API.

---

## ✅ Sistema 100% OPERATIVO — incluye PDFs (verificado 2026-06-11)

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

## ✅ Flujo de creación de orden médica (MEDICO) — Playwright 10/10 PASS (2026-06-11)

Usuario de prueba: `dr.garcia@botoshop.com` / `Medico123!`

| Paso | Resultado |
|------|-----------|
| Login MEDICO → redirect `/dashboard` | ✅ |
| `/orders/new` carga sin "Application error" | ✅ |
| Catálogo de lab tests carga (25 exámenes) | ✅ |
| DoctorPicker muestra médicos | ✅ |
| PatientPicker selecciona María García | ✅ |
| Selección de examen (TSH) | ✅ |
| Submit habilitado, formulario enviado | ✅ |
| Redirect a `/orders/<uuid>` | ✅ |
| Detalle: nombre paciente, examen, estado, panel consentimiento | ✅ |
| POST `/orders/:id/tests` desde UI de detalle | ✅ |

### Bugs corregidos (commits `621feb7`, `3a77dad`)

| Bug | Causa raíz | Fix |
|-----|-----------|-----|
| "Application error" al crear orden MEDICO | `getLabTests()` retornaba el envelope `{statusCode, message, data:[...]}` en vez del array; `catalog.reduce(...)` lanzaba `TypeError` | `api.get<ApiResponse<LabTest[]>>` + `return data.data` en `lab-tests.service.ts` |
| DoctorPicker 403 para MEDICO | `GET /users` era solo ADMIN | `requireRole(authResult, "ADMIN", "MEDICO")` en `usersFind` |
| Rutas `POST/DELETE /orders/:id/tests` inexistentes | No estaban en el router del backend | `orderTestsCreate` + `orderTestsDelete` + entradas en el router |
| `doctorId: ""` generaba error UUID en PostgreSQL | `??null` no convierte `""` a `null` | `body.doctorId\|\|null` |
| `order.patient` / `order.tests` / `order.consent` undefined en detalle | Supabase retorna `patients`, `order_tests`, `consents`; frontend esperaba `patient`, `tests`, `consent` | Remapeo en `getOrderById()` |
| Form submit no redirige (sigue en `/orders/new`) | `estimatedCompletionDate: ""` enviado a columna `TIMESTAMP(3)`; PostgreSQL rechaza el valor | `body.estimatedCompletionDate\|\|null` en `ordersCreate` y `ordersUpdate` |

---

## ✅ PDFs de consentimientos — IMPLEMENTADO Y VERIFICADO (2026-06-11)

`consentSign` genera el PDF con `pdf-lib@1.17.1`, lo sube al bucket `consents-pdf` (Supabase Storage, privado) y devuelve una URL firmada de 1 año en `documentPdfUrl`.

**Prueba end-to-end (2 corridas confirmadas, última: 2026-06-11):**

| Check | Resultado |
|-------|-----------|
| CI/CD run #67 — commit `3e76334` | ✅ PASS |
| `PATCH /orders/test-order-001/consent/sign` | ✅ 200 en ~1165ms |
| `status` en respuesta | ✅ `FIRMADO_MEDICO` |
| `documentPdfUrl` en respuesta | ✅ URL firmada Supabase Storage |
| DB `consents.documentPdfUrl` persistido | ✅ |
| GET URL → HTTP status | ✅ 200 |
| GET URL → Content-Type | ✅ `application/pdf` |
| Magic bytes (`%PDF`) | ✅ archivo PDF válido (~1741 bytes) |

**Fix clave:** `void generateConsentPdf(...)` → `await generateConsentPdf(...)` — las Supabase Edge Functions matan las promesas en background cuando devuelven la respuesta HTTP. El tiempo de respuesta subió de 777ms a ~1165ms, confirmando que la generación ocurre dentro de la request.

**Implementación:**
- Librería: `npm:pdf-lib@1.17.1` (Deno)
- Storage: bucket `consents-pdf` (privado), path `{orderId}/{consentId}.pdf`
- URL firmada: validez 1 año (31 536 000 s)
- Contenido del PDF: médico, especialidad, licencia, paciente, diagnóstico, notas, fecha firma, línea de firma

---

## ✅ Dashboard Analytics BI — IMPLEMENTADO (2026-06-16)

### Panel DX — Analytics completo (`/dx/dashboard`)

**Backend:** `GET /admin/dashboard` expandido con una query maestra de agregación en TS.

| Métrica nueva | Descripción |
|--------------|-------------|
| `por_departamento` | Top 20 departamentos/regiones por volumen de casos |
| `por_ano` | Solicitudes por año (tendencia histórica) |
| `por_mes_programa` | Solicitudes por mes agrupadas por programa (Wilson/DAAT/Duchenne) |
| `estado_genetico_dist` | Distribución del estado de la prueba genética |
| `seguimiento_dist` | Distribución de seguimiento clínico (positivo/negativo/portador/etc.) |
| `tasa_autorizacion` | Autorizados vs No autorizados vs Pendientes |
| `por_medico` | Desglose completo por médico (top 50): pendientes, en proceso, con/sin indicación, positivos, negativos, no aceptaron, % conversión, % completado |
| `heatmap_medico_mes` | Actividad top-10 médicos × últimos 12 meses (CSS grid heatmap) |
| `conversion_funnel` | Embudo: Total → Autorizó → Muestra → Sérico → Con indicación → Genética → Completado |

**Frontend:** Reescritura completa de `DxDashboard.tsx` con 9 secciones:
1. **6 KPIs** — Total, pendientes autorización, con indicación genética, completados, % conversión sérica, % autorización
2. **Temporal agrupado** — barras por mes × programa (últimos 12 meses)
3. **Embudo de conversión** — progresivo con % en cada etapa
4. **Distribución estados** — estado del caso + estado genético + seguimiento clínico (3 columnas)
5. **Autorización + año + programa** — 3 tarjetas compactas
6. **Por departamento** — top 20 barras horizontales
7. **Por país** — badges
8. **Heatmap médico × mes** — CSS grid con gradiente verde, escala de intensidad
9. **Tabla de médicos sortable** — 11 columnas, ordenable por cualquier métrica, con colores semánticos (positivos en rojo, % conversión en verde)

**Archivos modificados:**
- `frontend/src/types/dx.types.ts` — 9 nuevas interfaces + expansión de `DxDashboardData`
- `supabase/functions/api/routes/admin-casos.ts` — `obtenerDashboard` expandido (~130 líneas)
- `frontend/src/modules/dx/DxDashboard.tsx` — reescritura completa (~450 líneas)

---

## ✅ Fase 9 — Tests + CI/CD (2026-06-16)

- **164 tests unitarios** Jest pasan (14 suites) — servicios, utils, componentes
- **5 suites Deno** cubren: state machine, magic link tokens, lógica de rutas admin
- **CI/CD GitHub Actions** (`.github/workflows/ci-cd.yml`): lint + type-check + Jest + Deno tests → deploy automático a Supabase y Vercel en cada push a `main`
- `frontend/.eslintrc.json` configurado con `next/core-web-vitals`

## ✅ Fase 10 — Consentimientos en DB (2026-06-16)

- 48 consentimientos cargados en Supabase (verificado): CO, EC, PA, CL, CR, SV, DO, GT
- 3 programas × 8 países × 2 tipos (MEDICO + PACIENTE) = 48
- SQL seed disponible en `scripts/` para replicar en otros proyectos

## ✅ UI/UX rev 8 — Mejoras DX completas (2026-06-16)

### Cambios implementados
- **Login premium**: Split-screen con glassmorphism, anillos ADN CSS, logo 200px con glow, focus-within CSS puro (sin conflicto rhf)
- **Sidebar DX-first**: Eliminado flujo viejo (Pacientes/Ordenes/Resultados/Citas) del nav de ADMIN/OPERADOR. Nav principal: Panel DX, Casos DX, Importar DX, Usuarios. Links públicos para médicos (copy con un clic) integrados directamente en sidebar.
- **AppLayout responsivo**: Drawer mobile con overlay, hamburger menu en header, state centralizado
- **Header mejorado**: Títulos correctos para rutas `/dx/*`, notification bell visible en fondo claro, avatar del usuario
- **BottomNav DX**: Reemplazado flujo viejo por Panel DX / Casos / Importar / Usuarios
- **NotificationBell**: Rediseñado para fondo claro (prop `theme`), colores semánticos por tipo, icono visible
- **CasoDetail**: Panel de umbrales genéticos por programa (Wilson/DAAT/Duchenne) visible antes de ingresar resultado sérico. Sección "Consentimiento del médico" con datos de país/programa/fecha y descarga del PDF previo si existe.
- **ESTADO.md**: Actualizado

### Arquitectura confirmada (PRD v2.0)
- Médicos y pacientes **NO tienen cuentas** — usan links públicos y magic links
- Solo ADMIN y OPERADOR acceden al panel con JWT
- El sidebar solo muestra módulos DX relevantes para estos roles

## 🚀 Estado de despliegue (2026-06-16)

| Componente | Estado |
|-----------|--------|
| DB Supabase | ✅ Online — tenant + programas + consentimientos listos |
| Backend Edge Function | ✅ Desplegado — CI/CD activo |
| Frontend Vercel | ⏳ Pendiente push → CI/CD despliega automáticamente |

**Para desplegar:** `git push origin main` → GitHub Actions ejecuta la pipeline completa.

## 🔧 Pendiente — MEJORAS (no bloquean producción)

### 1. Importar datos históricos
Excel DAAT (~789 casos) y Wilson (~117 casos) listos en `doc/files/` — usar módulo `/dx/importar`.

### 2. Dominio personalizado

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
| RLS sin políticas explícitas | El backend usa `service_role_key` que bypasea RLS siempre. Habilitar RLS sin políticas bloquea `anon`/`authenticated` (bueno — nadie debe acceder la DB directamente) sin afectar el backend. |
