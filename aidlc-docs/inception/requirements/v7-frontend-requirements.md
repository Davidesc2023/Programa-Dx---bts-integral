# Requerimientos — Increment v7: Frontend & UX
## Sistema de Solicitud de Laboratorios (APP-DX)

---

## Resumen de Intención

| Campo | Detalle |
|---|---|
| **Tipo de solicitud** | Nueva fase — Frontend & UX sobre backend existente (Brownfield) |
| **Alcance** | Sistema completo de interfaz: 10+ pantallas, todos los módulos del backend conectados |
| **Complejidad** | Alta — auth con roles, state machine visual, formularios complejos, file upload/download |
| **Backend disponible** | NestJS + Prisma — 96 tests pasados — 7 módulos listos |

---

## Respuestas de Clarificación

| # | Pregunta | Respuesta | Decisión |
|---|---|---|---|
| Q1 | Punto de inicio | A — UX Flows completos | Generar UX flows antes del setup técnico |
| Q2 | Ubicación del frontend | A — Monorepo (`frontend/`) | Carpeta `frontend/` en la raíz del workspace |
| Q3 | Responsive | A — Desktop-first (>= 1280px) | Breakpoints desde desktop, adapta a tablet/mobile |
| Q4 | JWT storage | B — localStorage | ⚠️ Ver nota de seguridad más abajo |
| Q5 | Idioma | A — Solo español | UI completamente en español |
| Q6 | Vistas por rol | C — Menú dinámico por rol | Layout compartido, sidebar se adapta por rol |
| Q7 | Rendering strategy | A — CSR (SPA) | Next.js en modo cliente puro, sin SSR |
| Q8 | Paleta de colores | A — Derivada del logo BTS | Teal `#1B7A6B` primario · Amarillo `#F5C518` acento · Azul `#4490D9` secundario |

---

## Nota de Seguridad — JWT en localStorage

> **⚠️ Advertencia OWASP A03 (XSS):** El almacenamiento de JWT en `localStorage` expone el token
> a ataques XSS si se inyecta código malicioso en el DOM. Se procede con esta elección bajo las
> siguientes mitigaciones obligatorias:
> - Sanitización estricta de toda entrada de usuario antes de renderizar
> - Content Security Policy (CSP) en el servidor Next.js
> - No renderizar HTML arbitrario de respuestas del backend sin sanitización
> - Headers `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY`

---

## Stack Tecnológico Definido

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14+ (App Router, modo CSR/SPA) |
| Estilos | TailwindCSS 3 + design tokens BTS Integral |
| HTTP Client | Axios con interceptors JWT |
| Estado servidor | TanStack React Query v5 |
| Estado cliente | Zustand (auth state, UI state) |
| Formularios | React Hook Form + Zod (validación schema) |
| Íconos | Lucide React |
| Notificaciones | Sonner (toasts) |
| Tablas | TanStack Table v8 |
| Localización | Solo español (sin i18n) |

---

## Requerimientos Funcionales — Frontend

### RF-FE01 — Autenticación
- Pantalla de login con email + contraseña
- POST `/auth/login` → token almacenado en `localStorage`
- Redirección automática a `/dashboard` tras login exitoso
- Logout: limpiar token + redirigir a `/login`
- Rutas protegidas: redirigir a `/login` si no hay token
- Detección de token expirado (401) → logout automático

### RF-FE02 — Layout Base
- Header: logo BTS Integral + nombre del usuario logueado + botón logout
- Sidebar: menú de navegación dinámico según rol del usuario
- Área principal: contenido de cada módulo

### RF-FE03 — Menú Dinámico por Rol
| Sección | Admin | Operador | Laboratorio |
|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ |
| Pacientes | ✓ | ✓ | — |
| Órdenes | ✓ | ✓ | ✓ |
| Consentimientos | ✓ | ✓ | — |
| Resultados | ✓ | ✓ | ✓ |
| Citas | ✓ | ✓ | — |
| Usuarios | ✓ | — | — |

### RF-FE04 — Módulo Pacientes
- Lista con paginación y búsqueda por nombre / documento
- Formulario de creación con validación Zod
- Vista de detalle con historial de órdenes

### RF-FE05 — Módulo Órdenes
- Lista con filtro por estado, prioridad y fecha
- Formulario de creación (paciente, médico, prioridad, lista de tests)
- Detalle con estado visual de la máquina de estados
- Botones de transición de estado según rol

### RF-FE06 — Módulo Consentimiento
- Vista de firma de consentimiento (médico)
- Vista de aceptación / rechazo (perspectiva del paciente desde el backend)
- Estado visual del consentimiento en el detalle de orden

### RF-FE07 — Módulo Resultados + Adjuntos
- Formulario de carga de resultado
- Lista de resultados por orden
- Upload de adjuntos (PDF / imágenes, max 10MB)
- Descarga de adjuntos

### RF-FE08 — Módulo Citas
- Formulario de creación de cita para una orden
- Lista de citas con filtro por estado

### RF-FE09 — Dashboard
- Tarjetas de métricas: total pacientes, órdenes pendientes, órdenes hoy
- Tabla de órdenes recientes (últimas 5)
- Contenido adaptado al rol del usuario

---

## Requerimientos No Funcionales

| NFR | Detalle |
|---|---|
| NFR-01 Performance | First load < 3s en conexión estándar |
| NFR-02 Responsivo | Desktop-first: 1280px base; adaptable a tablet 768px |
| NFR-03 Accesibilidad | Formularios con labels, aria-label en íconos interactivos |
| NFR-04 Errores | Mensajes de error claros en español para todos los status HTTP |
| NFR-05 Loading states | Skeletons o spinners en todas las peticiones asíncronas |
| NFR-06 Seguridad | CSP + sanitización + mitigaciones XSS documentadas |

---

## Contratos de API (endpoints existentes)

| Módulo | Base URL |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/logout` |
| Pacientes | `GET/POST /patients`, `GET/PATCH/DELETE /patients/:id` |
| Órdenes | `GET/POST /orders`, `GET/PATCH/DELETE /orders/:id` |
| Consentimientos | `GET/POST /consents`, `PATCH /consents/:id` |
| Resultados | `GET/POST /results`, `GET/PATCH/DELETE /results/:id` |
| Adjuntos | `POST /results/:id/attachments`, `GET /results/:id/attachments`, `GET/DELETE /results/:id/attachments/:attachId` |
| Citas | `GET/POST /appointments`, `GET/PATCH/DELETE /appointments/:id` |
| Tests de orden | `POST/GET /orders/:id/tests`, `DELETE /orders/:id/tests/:testId` |

---

## Estructura de Carpetas Aprobada

```
frontend/
  public/
    logo.png           <- copia de img/bts-integral.png
  src/
    app/               <- Next.js App Router
      layout.tsx
      page.tsx         <- redirect a /dashboard o /login
      (auth)/
        login/
          page.tsx
      (protected)/
        dashboard/
          page.tsx
        patients/
          page.tsx
          new/
            page.tsx
          [id]/
            page.tsx
        orders/
          page.tsx
          new/
            page.tsx
          [id]/
            page.tsx
            consent/
              page.tsx
            results/
              page.tsx
            appointments/
              page.tsx
        appointments/
          page.tsx
    components/
      layout/
        AppLayout.tsx
        Sidebar.tsx
        Header.tsx
      ui/
        Button.tsx
        Input.tsx
        Badge.tsx
        Card.tsx
        DataTable.tsx
        LoadingSkeleton.tsx
        StatusBadge.tsx
    modules/
      auth/
        LoginForm.tsx
        useAuth.ts
        authStore.ts    <- Zustand
      patients/
        PatientForm.tsx
        PatientList.tsx
        PatientDetail.tsx
      orders/
        OrderForm.tsx
        OrderList.tsx
        OrderDetail.tsx
        OrderStateMachine.tsx
      consents/
        ConsentForm.tsx
        ConsentView.tsx
      results/
        ResultForm.tsx
        AttachmentUpload.tsx
      appointments/
        AppointmentForm.tsx
        AppointmentList.tsx
    services/
      api.ts            <- Axios instance
      auth.service.ts
      patients.service.ts
      orders.service.ts
      consents.service.ts
      results.service.ts
      attachments.service.ts
      appointments.service.ts
    hooks/
      useOrders.ts
      usePatients.ts
      useConsents.ts
    types/
      api.types.ts      <- response types del backend
      enums.ts
    lib/
      token.ts          <- localStorage JWT helpers (con comentario de advertencia XSS)
      validators.ts     <- schemas Zod compartidos
```
