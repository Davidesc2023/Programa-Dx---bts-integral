# Plan de Ejecución — Increment v7: Frontend & UX
## Sistema APP-DX — BTS Integral

---

## Resumen del Incremento

| Item | Detalle |
|---|---|
| **Incremento** | v7 — Frontend & UX |
| **Stack** | Next.js 14 + TailwindCSS + React Query + Zustand + Axios + Zod |
| **Ubicación** | `frontend/` (monorepo) |
| **Pantallas** | 12 pantallas — 10 flujos UX |
| **Módulos API consumidos** | 7 (auth, patients, orders, consents, results, attachments, appointments) |

---

## Unidades de Trabajo

### UDT-F01 — Proyecto Next.js: Setup Base + Auth Foundation

**Responsabilidad**: Inicializar el proyecto Next.js con toda la infraestructura base.

**Archivos a producir**:
```
frontend/
  package.json
  tsconfig.json
  tailwind.config.ts
  next.config.ts
  postcss.config.js
  public/
    logo.png                  <- copia de /img/bts-integral.png
  src/
    app/
      layout.tsx              <- root layout con providers
      page.tsx                <- redirect a /dashboard o /login
      (auth)/login/page.tsx   <- login page
      (protected)/layout.tsx  <- protected layout (verifica token)
    lib/
      token.ts                <- JWT localStorage helpers + advertencia XSS
      validators.ts           <- schemas Zod base
    types/
      api.types.ts            <- Response types del backend
      enums.ts                <- OrderStatus, Role, ConsentStatus, etc.
    services/
      api.ts                  <- Axios instance con interceptors JWT + 401 handler
    modules/
      auth/
        authStore.ts          <- Zustand: userId, role, name
        useAuth.ts            <- hook: isAuthenticated, user, login, logout
        LoginForm.tsx         <- formulario login completo
```

**Stories cubiertas**: Autenticación completa (login, logout, protección de rutas)

---

### UDT-F02 — Layout Shell + Design System

**Responsabilidad**: Componentes base de layout, design tokens, y menú dinámico por rol.

**Archivos a producir**:
```
src/
  components/
    layout/
      AppLayout.tsx           <- Sidebar + Header + {children}
      Sidebar.tsx             <- menú dinámico por rol + user info + logo
      Header.tsx              <- logo BTS + nombre usuario + logout button
    ui/
      Button.tsx              <- variantes: primary/secondary/danger/ghost
      Input.tsx               <- con label + error message integrados
      Badge.tsx               <- variantes de color por estado
      Card.tsx                <- contenedor base
      DataTable.tsx           <- TanStack Table v8 con paginación
      LoadingSkeleton.tsx     <- skeleton de carga genérico
      StatusBadge.tsx         <- badge colorizado para OrderStatus
      Modal.tsx               <- modal genérico con backdrop
      ConfirmDialog.tsx       <- diálogo de confirmación (acciones destructivas)
  lib/
    cn.ts                     <- helper clsx + tailwind-merge
  styles/
    globals.css               <- variables CSS design tokens BTS Integral
```

**Design Tokens BTS Integral**:
- Primary: `#1B7A6B` (teal)
- Accent: `#F5C518` (amarillo)
- Secondary: `#4490D9` (azul)
- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Text: `#1A202C`

---

### UDT-F03 — Dashboard

**Responsabilidad**: Pantalla de inicio post-login con métricas y órdenes recientes.

**Archivos a producir**:
```
src/
  app/(protected)/dashboard/
    page.tsx
  modules/
    dashboard/
      DashboardMetrics.tsx    <- cards de métricas por rol
      RecentOrders.tsx        <- tabla de últimas órdenes
  hooks/
    useDashboard.ts           <- React Query: órdenes recientes + conteos
```

---

### UDT-F04 — Módulo Pacientes

**Responsabilidad**: CRUD completo de pacientes.

**Archivos a producir**:
```
src/
  app/(protected)/patients/
    page.tsx                  <- /patients lista
    new/page.tsx              <- /patients/new
    [id]/page.tsx             <- /patients/:id detalle
  modules/
    patients/
      PatientList.tsx         <- tabla con paginación y búsqueda
      PatientForm.tsx         <- formulario crear/editar (Zod schema)
      PatientDetail.tsx       <- info + historial de órdenes
  hooks/
    usePatients.ts            <- React Query: list, getById, create, update
  services/
    patients.service.ts       <- API calls /patients
```

---

### UDT-F05 — Módulo Órdenes + State Machine

**Responsabilidad**: CRUD de órdenes, visualización del estado y transiciones.

**Archivos a producir**:
```
src/
  app/(protected)/orders/
    page.tsx                  <- /orders lista + filtros
    new/page.tsx              <- /orders/new wizard 3 pasos
    [id]/page.tsx             <- /orders/:id detalle completo
  modules/
    orders/
      OrderList.tsx           <- tabla con filtros de estado/prioridad
      OrderForm.tsx           <- wizard: Paciente → Datos → Tests
      OrderDetail.tsx         <- info + secciones por módulo
      OrderStateMachine.tsx   <- diagrama visual de estados + botones de transición
      OrderTestsList.tsx      <- lista de tests de la orden
  hooks/
    useOrders.ts              <- React Query: list, getById, create, updateStatus
    useOrderTests.ts          <- React Query: list, create, delete tests
  services/
    orders.service.ts
    order-tests.service.ts
```

---

### UDT-F06 — Módulo Consentimiento

**Responsabilidad**: Flujo de firma y aceptación/rechazo de consentimiento.

**Archivos a producir**:
```
src/
  app/(protected)/orders/[id]/consent/
    page.tsx
  modules/
    consents/
      ConsentView.tsx         <- estado actual + términos + acciones según estado
      ConsentSignForm.tsx     <- firma médico
      ConsentResponseForm.tsx <- aceptar/rechazar (perspectiva operador)
  hooks/
    useConsents.ts
  services/
    consents.service.ts
```

---

### UDT-F07 — Módulo Resultados + Adjuntos

**Responsabilidad**: Carga, consulta y descarga de resultados y adjuntos.

**Archivos a producir**:
```
src/
  app/(protected)/orders/[id]/results/
    page.tsx
  modules/
    results/
      ResultList.tsx          <- lista de resultados con adjuntos expandibles
      ResultForm.tsx          <- formulario crear resultado
      AttachmentItem.tsx      <- item de adjunto + botón descarga
      AttachmentUpload.tsx    <- drag & drop / selector de archivo + validación 10MB
  hooks/
    useResults.ts
    useAttachments.ts
  services/
    results.service.ts
    attachments.service.ts
```

---

### UDT-F08 — Módulo Citas

**Responsabilidad**: Creación y gestión de citas.

**Archivos a producir**:
```
src/
  app/(protected)/
    appointments/page.tsx         <- /appointments lista global
    orders/[id]/appointments/
      page.tsx                    <- /orders/:id/appointments
  modules/
    appointments/
      AppointmentList.tsx
      AppointmentForm.tsx
  hooks/
    useAppointments.ts
  services/
    appointments.service.ts
```

---

### UDT-F09 — Build + Test de Integración

**Responsabilidad**: Verificar que el proyecto compila sin errores y los flujos principales funcionan.

**Actividades**:
- `npm run build` sin errores TypeScript ni Tailwind
- Verificar: login → dashboard → pacientes → orden → consentimiento → resultado
- Verificar: logout + redirección a /login
- Verificar: acceso denegado a rutas no permitidas por rol
- Verificar: upload de adjunto + descarga
- Verificar: CSP headers configurados en next.config.ts

---

## Orden de Implementación

```
UDT-F01 (base)
    |
UDT-F02 (layout/UI)
    |
UDT-F03 (dashboard)
    |
UDT-F04 (patients)
    |
UDT-F05 (orders — depende de patients)
    |
UDT-F06 (consent — depende de orders)
    |
UDT-F07 (results — depende de orders)
    |
UDT-F08 (appointments — depende de orders)
    |
UDT-F09 (build + test)
```

---

## Dependencias de Construcción

| UDT | Depende de |
|---|---|
| UDT-F01 | — (base absoluta) |
| UDT-F02 | UDT-F01 (necesita Tailwind y providers) |
| UDT-F03 | UDT-F01 + UDT-F02 (necesita layout y auth) |
| UDT-F04 | UDT-F01 + UDT-F02 |
| UDT-F05 | UDT-F04 (selector de paciente en formulario de orden) |
| UDT-F06 | UDT-F05 (vive dentro de `/orders/:id`) |
| UDT-F07 | UDT-F05 (vive dentro de `/orders/:id`) |
| UDT-F08 | UDT-F05 (vive dentro de `/orders/:id`) |
| UDT-F09 | UDT-F01 a UDT-F08 |
