# Plan de Implementación — APP-DX v2.0

**Última actualización:** 2026-06-12  
**Estado:** En planificación — Rediseño arquitectural

---

## Resumen de fases

| Fase | Descripción | Dependencias |
|------|-------------|-------------|
| **0** | Limpieza y reestructuración del repo | — |
| **1** | Schema multi-tenant + migraciones SQL | Fase 0 |
| **2** | Backend: rutas públicas (formulario médico) | Fase 1 |
| **3** | Backend: magic links + autorización del paciente | Fase 1 |
| **4** | Backend: panel admin — gestión de casos | Fase 2, 3 |
| **5** | Frontend: formularios públicos del médico | Fase 2 |
| **6** | Frontend: autorización del paciente | Fase 3 |
| **7** | Frontend: panel admin | Fase 4 |
| **8** | Módulo de importación Excel | Fase 4 |
| **9** | Tests unitarios y CI/CD | Paralela a todas |
| **10** | Consentimientos por país y plantillas iniciales | Fase 1 |
| **11** | Reportes y exportación | Fase 7 |

---

## FASE 0 — Limpieza y reestructuración del repo

**Objetivo:** Eliminar el código NestJS obsoleto y establecer la estructura de carpetas correcta.

### Tareas

- [ ] Eliminar `/src` — código NestJS (reemplazado por Edge Function)
- [ ] Eliminar `/api` — directorio NestJS legacy
- [ ] Eliminar `/dist` — build compilado
- [ ] Eliminar `/prisma` — ORM reemplazado por migraciones SQL directas
- [ ] Eliminar `node_modules/` raíz — dependencias NestJS
- [ ] Eliminar archivos raíz NestJS: `nest-cli.json`, `railway.json`, `docker-compose.yml`, `Dockerfile`, `tsconfig.json`, `tsconfig.build.json`, `package.json`, `package-lock.json`
- [ ] Eliminar archivos temporales de verificación: `verify_*.png`, `verify_*.js`
- [ ] Eliminar carpetas no relacionadas: `ai-dlc/`, `aidlc-docs/`, `img/`
- [ ] Crear `scripts/` para herramientas de migración
- [ ] Crear `supabase/migrations/` para SQL versionado
- [ ] Actualizar `.env.example` con las variables correctas
- [ ] Actualizar `.gitignore`
- [ ] Actualizar CI/CD (`.github/workflows/ci-cd.yml`) para nueva arquitectura

### Estructura objetivo

```
APP-DX/
├── frontend/          ← Next.js 14 (sin cambios de infra)
├── supabase/
│   ├── functions/api/ ← Edge Function (actual, a refactorizar)
│   └── migrations/    ← nuevo
├── scripts/           ← nuevo
├── doc/               ← actualizado
├── .github/
├── .env.example
└── vercel.json
```

---

## FASE 1 — Schema multi-tenant y migraciones SQL

**Objetivo:** Definir el modelo de datos completo en PostgreSQL con RLS desde el inicio.

### Migraciones a crear

#### `001_multitenancy_base.sql`
```sql
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  nombre        TEXT NOT NULL,
  logo_url      TEXT,
  color_primario TEXT DEFAULT '#1B7A6B',
  email_contacto TEXT,
  telefono_contacto TEXT,
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id),  -- NULL = SUPER_ADMIN
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('SUPER_ADMIN','ADMIN','OPERADOR')),
  activo        BOOLEAN DEFAULT TRUE,
  ultimo_login  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `002_programas.sql`
```sql
CREATE TABLE programas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  codigo          TEXT NOT NULL,  -- WILSON | DAAT | DUCHENNE
  nombre          TEXT NOT NULL,
  gen             TEXT,           -- ATP7B | SERPINA1 | DMD
  prueba_serica   TEXT,
  prueba_genetica TEXT,
  umbral_json     JSONB,          -- {"ceruloplasmina_lt": 20, "cobre_orina_gt": 60}
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);
```

#### `003_consentimientos.sql`
```sql
CREATE TABLE consentimientos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id     UUID NOT NULL REFERENCES programas(id),
  pais_codigo     TEXT NOT NULL,  -- CO, EC, PA, CL, CR, SV, DO, GT
  tipo            TEXT NOT NULL CHECK (tipo IN ('MEDICO','PACIENTE')),
  version         INTEGER NOT NULL DEFAULT 1,
  titulo          TEXT NOT NULL,
  marco_legal     TEXT NOT NULL,
  cuerpo_html     TEXT NOT NULL,
  activo          BOOLEAN DEFAULT TRUE,
  vigente_desde   DATE NOT NULL,
  created_by      UUID REFERENCES admin_users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(programa_id, pais_codigo, tipo, version)
);
```

#### `004_casos.sql`
```sql
CREATE TABLE casos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  programa_id     UUID NOT NULL REFERENCES programas(id),
  consecutivo     TEXT NOT NULL,  -- WILSON-001, DAAT-789
  pais_codigo     TEXT NOT NULL,
  consentimiento_medico_id  UUID REFERENCES consentimientos(id),
  consentimiento_paciente_id UUID REFERENCES consentimientos(id),

  -- Médico (sin cuenta, capturado en form público)
  medico_nombre         TEXT,
  medico_especialidad   TEXT,
  medico_tipo_registro  TEXT,
  medico_numero_registro TEXT,
  medico_institucion    TEXT,
  medico_ciudad         TEXT,
  medico_email          TEXT,
  medico_whatsapp       TEXT,
  medico_firmado_at     TIMESTAMPTZ,
  medico_ip             TEXT,
  medico_ua             TEXT,

  -- Paciente (capturado por el médico)
  paciente_nombre       TEXT,
  paciente_tipo_doc     TEXT,
  paciente_num_doc      TEXT,
  paciente_genero       TEXT,
  paciente_eps          TEXT,
  paciente_telefono     TEXT,
  paciente_email        TEXT,
  paciente_ciudad       TEXT,
  paciente_departamento TEXT,
  paciente_pais         TEXT,
  paciente_direccion    TEXT,
  paciente_iniciales    TEXT,

  -- Representante legal (opcional)
  rep_nombre      TEXT,
  rep_doc         TEXT,
  rep_parentesco  TEXT,

  -- Resultado previo adjunto por el médico (si aplica)
  resultado_previo_valor         TEXT,
  resultado_previo_pdf_url       TEXT,
  resultado_previo_interpretacion TEXT,  -- POSITIVO | NEGATIVO | BORDERLINE

  -- Estado del caso
  estado                   TEXT NOT NULL DEFAULT 'SOLICITUD_RECIBIDA',
  tiene_indicacion_genetica BOOLEAN,

  -- Fase sérica
  laboratorio           TEXT,
  sede                  TEXT,
  fecha_programacion    DATE,
  fecha_toma_muestra    DATE,
  resultado_1_valor     TEXT,
  resultado_1_unidad    TEXT,
  resultado_2_valor     TEXT,
  resultado_2_unidad    TEXT,
  valores_referencia    TEXT,
  fecha_reporte_lab     DATE,
  fecha_envio_medico    DATE,
  fecha_envio_paciente  DATE,
  medio_envio           TEXT,
  costo_serico          NUMERIC(10,2),
  observaciones_serica  TEXT,

  -- Fase genética
  lab_genetico             TEXT,
  costo_genetico           NUMERIC(10,2),
  fecha_toma_genetica      DATE,
  fecha_resultado_genetica DATE,
  gen_analizado            TEXT,
  resultado_genetico       TEXT,
  fenotipo                 TEXT,
  estado_genetico          TEXT,
  observaciones_genetica   TEXT,

  -- Seguimiento (Wilson)
  seguimiento TEXT,

  -- Autorización del paciente
  paciente_autorizacion    TEXT DEFAULT 'PENDIENTE',
  paciente_autorizo_at     TIMESTAMPTZ,
  paciente_ip              TEXT,
  paciente_ua              TEXT,
  paciente_nombre_firmado  TEXT,
  paciente_correccion_datos TEXT,

  -- Metadatos
  mes_solicitud   TEXT,
  migrado_de      TEXT,  -- 'excel:consecutivo' si fue importado
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, consecutivo)
);
```

#### `005_magic_links.sql`
```sql
CREATE TABLE magic_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    TEXT UNIQUE NOT NULL,  -- SHA-256 del token real
  tipo          TEXT NOT NULL CHECK (tipo IN ('PACIENTE_FIRMA','RESULTADOS_MEDICO','RESULTADOS_PACIENTE')),
  caso_id       UUID NOT NULL REFERENCES casos(id),
  expira_at     TIMESTAMPTZ NOT NULL,
  usado_at      TIMESTAMPTZ,
  ip_usado      TEXT,
  user_agent    TEXT,
  invalidado_at TIMESTAMPTZ,
  invalidado_por UUID REFERENCES admin_users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `006_audit_log.sql`
```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  actor_id    UUID,            -- admin_user ID o NULL si es acción externa
  actor_tipo  TEXT,            -- 'ADMIN' | 'OPERADOR' | 'MEDICO_LINK' | 'PACIENTE_LINK'
  accion      TEXT NOT NULL,   -- 'CASO_CREADO', 'ESTADO_CAMBIADO', 'LINK_GENERADO', etc.
  entidad     TEXT,            -- 'casos' | 'magic_links' | 'consentimientos'
  entidad_id  UUID,
  datos_json  JSONB,           -- snapshot de datos relevantes
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `007_rls_policies.sql`
Políticas RLS para cada tabla usando `tenant_id` del JWT o del caso.

#### `008_triggers.sql`
Triggers para `updated_at` automático y generación de `consecutivo` por tenant+programa.

### Seed inicial

`scripts/seed-tenant.ts` — crea el tenant BTS Integral con sus 3 programas y las plantillas de consentimiento iniciales (Wilson/CO, DAAT/CO, Duchenne/CO+EC+PA+CR+GT).

### Criterios de aceptación

- [ ] Las 7 migraciones corren sin errores en Supabase
- [ ] RLS probado: usuario con `tenant_id=A` no puede leer casos de `tenant_id=B`
- [ ] Seed crea tenant BTS con datos correctos y plantillas de consentimiento activas
- [ ] Trigger de `updated_at` funciona en todas las tablas
- [ ] Consecutivo auto-incremental por tenant+programa funciona correctamente

---

## FASE 2 — Backend: Rutas públicas (formulario del médico)

**Objetivo:** Endpoints que no requieren autenticación — reciben el formulario del médico.

### Endpoints a implementar

```
GET  /public/:tenantSlug/:programa      → datos del tenant + programa + consentimiento activo del médico
POST /public/:tenantSlug/:programa      → crear caso desde el formulario del médico
POST /public/:tenantSlug/:programa/upload → subir PDF de resultado previo
```

### Lógica crítica

- Resolver `tenantSlug` → `tenant_id` → `programa_id`
- Cargar la plantilla de consentimiento del médico correcta (por programa + país del form)
- Generar `consecutivo` automático (WILSON-001, DAAT-789)
- Calcular `paciente_iniciales` automáticamente
- Registrar `medico_ip` y `medico_ua` desde headers
- Rate limiting: 20 req/hora por IP
- Validar todos los campos con Zod
- Registrar en `audit_log`

### Tests unitarios

```typescript
// _tests/routes/formulario.test.ts
describe('POST /public/:tenant/:programa', () => {
  it('crea caso con datos completos — Wilson')
  it('crea caso con representante legal')
  it('rechaza formulario con campos obligatorios vacíos')
  it('rechaza tenant inexistente → 404')
  it('rechaza programa inactivo → 404')
  it('registra IP y user-agent correctamente')
  it('genera consecutivo único por tenant+programa')
  it('carga consentimiento del médico correcto según país seleccionado')
  it('respeta rate limit: 21ava solicitud en 1h → 429')
})
```

### Criterios de aceptación

- [ ] El formulario Wilson (CO) se procesa correctamente
- [ ] El formulario Duchenne con país EC usa el consentimiento Ecuador
- [ ] Campos obligatorios validados con mensaje en español
- [ ] Caso aparece en el panel admin tras envío
- [ ] Tests pasan con ≥ 80% de cobertura

---

## FASE 3 — Backend: Magic links y autorización del paciente

**Objetivo:** Generación segura de tokens y endpoint de respuesta del paciente.

### Endpoints a implementar

```
POST /admin/casos/:id/link-paciente    → genera token + registra en magic_links (auth: ADMIN|OPERADOR)
GET  /autorizar/:token                 → valida token, devuelve datos del caso (sin autenticar)
POST /autorizar/:token                 → registra respuesta del paciente (sin autenticar)
POST /admin/casos/:id/link-paciente/invalidar → invalida token actual (auth: ADMIN|OPERADOR)
```

### Lógica crítica del token

```typescript
// services/token.ts
async function generarTokenPaciente(casoId: string): Promise<string> {
  const token = crypto.getRandomValues(new Uint8Array(64))
  const tokenHex = Array.from(token).map(b => b.toString(16).padStart(2,'0')).join('')
  const tokenHash = await sha256(tokenHex)

  await db.magic_links.insert({
    token_hash: tokenHash,
    tipo: 'PACIENTE_FIRMA',
    caso_id: casoId,
    expira_at: new Date(Date.now() + 72 * 60 * 60 * 1000)
  })

  return tokenHex  // solo se devuelve al admin para compartir
}

async function validarToken(token: string): Promise<MagicLink> {
  const hash = await sha256(token)
  const link = await db.magic_links.findOne({ token_hash: hash })

  if (!link) throw new Error('TOKEN_INVALIDO')
  if (link.usado_at) throw new Error('TOKEN_YA_USADO')
  if (link.invalidado_at) throw new Error('TOKEN_INVALIDADO')
  if (link.expira_at < new Date()) throw new Error('TOKEN_EXPIRADO')

  return link
}
```

### Tests unitarios

```typescript
// _tests/services/token.test.ts
describe('Magic Links', () => {
  it('genera token de 128 caracteres hexadecimales')
  it('almacena hash SHA-256, no el token plano')
  it('token expira a las 72 horas')
  it('token usado no puede usarse de nuevo → TOKEN_YA_USADO')
  it('token expirado retorna TOKEN_EXPIRADO')
  it('token invalidado por admin retorna TOKEN_INVALIDADO')
  it('invalidar genera nuevo token y marca el anterior')
})

// _tests/routes/autorizar.test.ts
describe('POST /autorizar/:token', () => {
  it('registra AUTORIZO con nombre completo y timestamp')
  it('registra NO_AUTORIZO con motivo')
  it('rechaza token inválido → 404')
  it('rechaza token ya usado → 410 Gone')
  it('rechaza token expirado → 410 Gone')
  it('registra IP y user-agent del paciente')
  it('cambia estado del caso a AUTORIZADO o NO_ACEPTO')
  it('registra en audit_log')
})
```

### Criterios de aceptación

- [ ] Token de 128 chars hex generado correctamente
- [ ] Token invalidado al primer uso
- [ ] Error claro si token expirado/usado/inválido
- [ ] Estado del caso cambia tras respuesta del paciente
- [ ] IP y user-agent del paciente registrados
- [ ] Tests pasan ≥ 80% cobertura

---

## FASE 4 — Backend: Panel admin — gestión de casos

**Objetivo:** Endpoints autenticados para que el admin gestione el ciclo de vida de los casos.

### Endpoints a implementar

```
POST   /admin/auth/login
POST   /admin/auth/refresh
DELETE /admin/auth/logout

GET    /admin/casos                    → lista con filtros y paginación
GET    /admin/casos/:id                → detalle completo
PATCH  /admin/casos/:id/estado         → cambiar estado manualmente
PATCH  /admin/casos/:id/serica         → registrar resultado sérico
PATCH  /admin/casos/:id/indicacion     → marcar indicación genética
PATCH  /admin/casos/:id/genetica       → registrar resultado genético
PATCH  /admin/casos/:id/seguimiento    → registrar seguimiento (Wilson)
POST   /admin/casos/:id/observacion    → agregar nota
GET    /admin/dashboard                → métricas por estado/programa

GET    /admin/consentimientos          → listar por tenant
POST   /admin/consentimientos          → crear nueva versión
GET    /admin/consentimientos/:id      → detalle
PATCH  /admin/consentimientos/:id/activar

POST   /admin/importar/preview         → analizar Excel sin importar
POST   /admin/importar/confirm         → confirmar importación
GET    /admin/importar/plantilla/:programa → descargar plantilla .xlsx

GET    /admin/reportes/casos           → reporte filtrable
GET    /admin/reportes/export          → exportar a xlsx/csv
```

### State machine del caso (validación en backend)

```typescript
// utils/states.ts
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  'SOLICITUD_RECIBIDA':              ['EN_PROGRAMACION', 'CANCELADO'],
  'EN_PROGRAMACION':                 ['PENDIENTE_AUTORIZACION', 'SIN_CONTACTO_EFECTIVO', 'CANCELADO'],
  'PENDIENTE_AUTORIZACION':          ['AUTORIZADO', 'NO_ACEPTO'],
  'AUTORIZADO':                      ['PROGRAMADO', 'CANCELADO'],
  'PROGRAMADO':                      ['MUESTRA_TOMADA', 'CANCELADO'],
  'MUESTRA_TOMADA':                  ['RESULTADO_SERICO_DISPONIBLE'],
  'RESULTADO_SERICO_DISPONIBLE':     ['CON_INDICACION_GENETICA', 'SIN_INDICACION_GENETICA'],
  'CON_INDICACION_GENETICA':         ['GENETICA_PROGRAMADA'],
  'SIN_INDICACION_GENETICA':         ['COMPLETADO'],
  'GENETICA_PROGRAMADA':             ['GENETICA_EN_PROCESAMIENTO'],
  'GENETICA_EN_PROCESAMIENTO':       ['GENETICA_RESULTADO_DISPONIBLE'],
  'GENETICA_RESULTADO_DISPONIBLE':   ['COMPLETADO'],
  'COMPLETADO':                      [],
  'NO_ACEPTO':                       [],  // solo cambio manual del admin
  'SIN_CONTACTO_EFECTIVO':           ['EN_PROGRAMACION', 'CANCELADO'],
  'FALLECIDO':                       [],
  'CANCELADO':                       [],
}
```

### Tests unitarios

```typescript
// _tests/utils/states.test.ts
describe('State Machine', () => {
  it('transición válida SOLICITUD_RECIBIDA → EN_PROGRAMACION')
  it('transición inválida COMPLETADO → EN_PROGRAMACION → error')
  it('todas las transiciones válidas documentadas')
  it('estado FALLECIDO desde cualquier estado activo')
})

// _tests/routes/auth.test.ts
describe('Admin Auth', () => {
  it('login con credenciales correctas → JWT')
  it('login con contraseña incorrecta → 401')
  it('refresh token válido → nuevo access token')
  it('refresh token expirado → 401')
  it('acceso a ruta protegida sin token → 401')
  it('OPERADOR no puede acceder a endpoints de ADMIN')
  it('aislamiento tenant: ADMIN del tenant A no ve casos del tenant B')
})
```

### Criterios de aceptación

- [ ] Login admin funciona con JWT httpOnly cookies
- [ ] Todas las transiciones de estado validadas en backend
- [ ] Filtros de lista de casos funcionan (programa, estado, país, fecha)
- [ ] Aislamiento de tenant verificado en tests
- [ ] Paginación implementada en lista de casos
- [ ] Tests pasan ≥ 80% cobertura

---

## FASE 5 — Frontend: Formularios públicos del médico

**Objetivo:** Páginas `/solicitud/[tenant]/[programa]` — acceso público, sin login.

### Páginas a implementar

```
/solicitud/[tenant]/wilson     ← WilsonForm
/solicitud/[tenant]/alfa1      ← AlfaUnoForm
/solicitud/[tenant]/duchenne   ← DuchenneForm (con selector de país)
```

### Componentes a crear

```typescript
// components/forms/DoctorForm.tsx       ← bloque A: datos del médico
// components/forms/PatientForm.tsx      ← bloque B: datos del paciente
// components/forms/RepresentanteForm.tsx ← si es representante legal
// components/forms/ExamSelection.tsx    ← bloque C: exámenes
// components/forms/ConsentViewer.tsx    ← texto del consentimiento read-only
// components/forms/PrevResultUpload.tsx ← adjuntar resultado previo (Duchenne)
// components/ui/CountrySelector.tsx     ← selector de país con bandera
// components/ui/SuccessPage.tsx         ← confirmación tras envío
```

### Tests unitarios (Jest + RTL)

```typescript
// __tests__/unit/components/DoctorForm.test.tsx
describe('DoctorForm', () => {
  it('muestra todos los campos del médico')
  it('valida campos obligatorios al intentar continuar')
  it('muestra error de formato en email inválido')
  it('acepta especialidades de la lista predefinida')
})

// __tests__/unit/components/PatientForm.test.tsx
describe('PatientForm', () => {
  it('muestra tipos de documento según país')
  it('muestra campos de representante legal cuando se activa el toggle')
  it('oculta campos de representante legal por defecto')
  it('valida formato de teléfono')
  it('email es opcional para el paciente')
})

// __tests__/integration/solicitud-wilson.test.tsx
describe('Flujo completo Wilson form', () => {
  it('llena y envía formulario correctamente')
  it('muestra página de éxito tras envío')
  it('muestra errores de campo sin hacer submit al backend')
  it('cambia consentimiento del médico al cambiar país (Duchenne)')
})
```

### Criterios de aceptación

- [ ] Formulario completable en smartphone (Chrome + Safari, iOS y Android)
- [ ] Consentimiento de Duchenne cambia correctamente al seleccionar país
- [ ] Validación client-side antes de llamar al backend
- [ ] Página de éxito clara tras envío
- [ ] Branding del tenant visible (logo, colores)
- [ ] Tests pasan con ≥ 80% cobertura de componentes críticos

---

## FASE 6 — Frontend: Autorización del paciente

**Objetivo:** Página `/autorizar/[token]` — mobile-first, lenguaje simple, sin login.

### Componentes a crear

```typescript
// app/autorizar/[token]/page.tsx       ← página principal
// components/autorizar/CaseResumen.tsx ← resumen del médico + exámenes
// components/autorizar/PatientData.tsx ← datos del paciente con opción de corrección
// components/autorizar/ConsentText.tsx ← texto colapsable del consentimiento
// components/autorizar/SignatureField.tsx ← campo de nombre + botones
// components/autorizar/TokenError.tsx  ← pantalla de error (expirado, usado, inválido)
// components/autorizar/SuccessPage.tsx ← confirmación de respuesta
```

### Reglas de UX obligatorias

- Fuente mínima 18px en mobile
- Botón AUTORIZO en verde, NO AUTORIZO en rojo — ambos grandes (min 56px height)
- El campo de nombre debe estar lleno antes de habilitar los botones
- Consentimiento colapsado por defecto con botón "leer más"
- Sin jerga técnica — revisar todo el texto con criterio de "¿lo entiende alguien de 65 años?"

### Tests unitarios

```typescript
// __tests__/unit/components/SignatureField.test.tsx
describe('SignatureField', () => {
  it('botones deshabilitados si nombre está vacío')
  it('botones habilitados al escribir el nombre')
  it('muestra confirmación al presionar AUTORIZO')
  it('muestra campo de motivo al presionar NO AUTORIZO')
})

// __tests__/unit/components/TokenError.test.tsx
describe('TokenError', () => {
  it('muestra mensaje correcto para TOKEN_EXPIRADO')
  it('muestra mensaje correcto para TOKEN_YA_USADO')
  it('muestra contacto del programa para pedir un nuevo link')
})
```

### Criterios de aceptación

- [ ] Página funciona en Chrome Android y Safari iOS
- [ ] Botones inutilizables sin nombre escrito
- [ ] Token expirado muestra mensaje claro con datos de contacto
- [ ] Respuesta registrada en < 1 segundo
- [ ] Tests pasan ≥ 80% cobertura

---

## FASE 7 — Frontend: Panel Admin

**Objetivo:** `/admin/*` — panel interno para ADMIN y OPERADOR.

### Páginas a implementar

```
/login                          ← login admin
/admin/dashboard                ← métricas + resumen por estado
/admin/casos                    ← lista con filtros + kanban
/admin/casos/[id]               ← detalle completo + acciones
/admin/consentimientos          ← gestión de plantillas
/admin/consentimientos/[id]     ← editor de plantilla
/admin/importar                 ← wizard de importación Excel
/admin/reportes                 ← reportes y exportación
```

### Criterios de aceptación

- [ ] Dashboard muestra métricas en tiempo real
- [ ] Lista de casos filtrable por programa, estado, país, fecha
- [ ] Detalle de caso muestra toda la trazabilidad del caso
- [ ] Admin puede generar link del paciente y copiarlo en 2 clics
- [ ] Admin puede cambiar estado manualmente con confirmación

---

## FASE 8 — Módulo de importación Excel

### Lógica de importación

```typescript
// routes/importar.ts
async function previewImport(file: File, programaId: string): Promise<ImportPreview> {
  const rows = parseExcel(file)
  const results = await Promise.all(rows.map(row => validateRow(row, programaId)))
  return {
    total: rows.length,
    validos: results.filter(r => r.valid && !r.warnings.length).length,
    conAdvertencias: results.filter(r => r.valid && r.warnings.length > 0).length,
    conErrores: results.filter(r => !r.valid).length,
    detalle: results
  }
}

async function confirmImport(previewId: string): Promise<ImportResult> {
  // Importa solo los válidos y los que tienen advertencias
  // Los con errores bloqueantes se saltan
}
```

### Tests unitarios

```typescript
// _tests/services/importar.test.ts
describe('Import Excel', () => {
  it('parsea Excel Wilson con 117 filas correctamente')
  it('normaliza estado "realizado" → RESULTADO_SERICO_DISPONIBLE')
  it('normaliza estado "Programado" → PROGRAMADO')
  it('marca fila sin paciente_nombre como DATOS_INCOMPLETOS')
  it('maneja consecutivos duplicados sin error')
  it('maneja encoding UTF-8 y caracteres especiales')
  it('el preview no inserta datos en DB')
  it('confirm solo inserta los válidos y con advertencias')
})
```

---

## FASE 9 — Tests y CI/CD

### Setup de tests (frontend)

```bash
# frontend/
npm install --save-dev jest @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom msw jest-environment-jsdom ts-jest
```

```typescript
// frontend/jest.config.ts
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['./jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  coverageThreshold: { global: { functions: 80, lines: 80 } }
}
```

### CI/CD actualizado

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD APP-DX

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run type-check
      - run: cd frontend && npm test -- --coverage --ci

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with: { deno-version: '2.x' }
      - run: deno test --allow-net --allow-env supabase/functions/api/_tests/

  deploy:
    needs: [quality, backend-tests]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Edge Function
        run: |
          npx supabase functions deploy api --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - name: Deploy Frontend
        run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## FASE 10 — Consentimientos iniciales

Cargar en DB las plantillas de consentimiento reales para todos los programas y países activos, basadas en los textos de los formularios MoreApp actuales.

| Programa | País | Tipo | Fuente |
|---------|------|------|--------|
| Wilson | CO | MEDICO | Form MoreApp Wilson |
| Wilson | CO | PACIENTE | A definir (similar DAAT) |
| DAAT | CO | MEDICO | Form MoreApp DAAT |
| DAAT | CO | PACIENTE | Form MoreApp autorización DAAT |
| Duchenne | CO | MEDICO | Form MoreApp Duchenne |
| Duchenne | CO | PACIENTE | Form MoreApp autorización Duchenne |
| Duchenne | EC | MEDICO | Form MoreApp Duchenne (Ecuador) |
| Duchenne | PA | MEDICO | Form MoreApp Duchenne (Panamá) |
| Duchenne | CR | MEDICO | Form MoreApp Duchenne (Costa Rica) |
| Duchenne | GT | MEDICO | Form MoreApp Duchenne (Guatemala) |

---

## FASE 11 — Reportes y exportación

- Implementar endpoints de reportes con filtros
- Exportación `.xlsx` usando `ExcelJS`
- Dashboard con métricas en tiempo real

---

## Definición de "Hecho" (DoD)

Una tarea está completa cuando:
1. Código en `main`
2. Tests unitarios escritos y pasando
3. Type-check sin errores (`tsc --noEmit`)
4. Lint sin warnings
5. Comportamiento verificado manualmente en preview de Vercel
6. Historia de usuario correspondiente marcada como verificada
