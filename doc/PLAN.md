# Plan de Desarrollo — APP-DX (BTS Integral)

**Última actualización:** 2026-06-10
**Estado:** MVP completado — Fase de mejoras y extensiones

---

## Estado actual del sistema

El sistema está en producción activa. El flujo clínico completo funciona de extremo a extremo:

```
Médico crea orden → selecciona exámenes (catálogo con prerequisitos)
→ firma consentimiento digital (canvas) → paciente autoriza con su propia firma
→ laboratorio ejecuta → resultados disponibles en portal
```

---

## FASE 1 — FOUNDATION (COMPLETADA)

- [x] PostgreSQL + Prisma ORM + migraciones
- [x] NestJS con módulos: patients, orders, consents, results, appointments, users, auth, portal, pdf, storage, notifications, lab-tests
- [x] DTOs, ValidationPipe global, manejo de errores centralizado
- [x] Response DTOs tipados (`ResponseDto.of(data, message, statusCode)`)

---

## FASE 2 — AUTH & SECURITY (COMPLETADA)

- [x] JWT access + refresh tokens
- [x] 5 roles: ADMIN, MEDICO, OPERADOR, LABORATORIO, PACIENTE
- [x] Guards por rol en todos los endpoints
- [x] bcrypt, rate limiting, Helmet, CORS
- [x] Soft delete en entidades principales
- [x] 0 vulnerabilidades en npm audit

---

## FASE 3 — FEATURES CORE (COMPLETADA)

- [x] CRUD pacientes con búsqueda
- [x] CRUD órdenes con state machine completa
- [x] Catálogo de exámenes con tipos y prerequisitos
- [x] Seed de 15 exámenes clínicos reales
- [x] Validación de prerequisitos por paciente (`checkPrerequisite`)
- [x] Consentimiento informado digital (HTML generado server-side)
- [x] Firma digital médico (canvas PNG base64 embebida en documento)
- [x] Firma digital paciente (canvas PNG base64 — gate obligatorio)
- [x] PDF final generado con Puppeteer/Chromium → subido a Cloudflare R2
- [x] Módulo de resultados de laboratorio
- [x] Módulo de citas / agendamiento básico

---

## FASE 4 — FRONTEND & PORTAL (COMPLETADA)

- [x] Next.js 14 App Router con layout protegido y portal separado
- [x] Design system Clinical Sanctuary (teal #1B7A6B, Manrope+Inter, glassmorphism)
- [x] Login con diseño split (desktop) / centrado con ícono (mobile)
- [x] OrderForm con split layout: picker izquierda + catálogo derecha + resumen inferior
- [x] ConsentPanel con modal 2 columnas: documento legal + pad de firma
- [x] Portal del paciente: dashboard, órdenes, consentimiento con firma, resultados
- [x] Notificaciones in-app con bell indicator
- [x] Estado Zustand + TanStack Query

---

## FASE 5 — INFRAESTRUCTURA CLOUD (COMPLETADA)

- [x] Backend Railway (NestJS) — `https://app-dx.up.railway.app`
- [x] Frontend Vercel (Next.js 14)
- [x] Base de datos Supabase App_DX (`wwosggahpasvoexshrdl`, us-east-2)
- [x] Schema Prisma completo aplicado en Supabase
- [x] Almacenamiento Cloudflare R2 para PDFs e imágenes
- [ ] **PENDIENTE:** Actualizar `DATABASE_URL` en Railway → Supabase App_DX

---

## FASE 6 — PRÓXIMAS FUNCIONALIDADES (PENDIENTE)

### Alta prioridad

- [ ] **Registro de médicos con aprobación admin**
  - Flujo: médico se registra → ADMIN aprueba → acceso habilitado
  - Página de gestión de solicitudes en panel ADMIN

- [ ] **Timeline visual del estado de la orden**
  - Componente stepper horizontal/vertical mostrando cada estado
  - Timestamps por estado, actor que realizó el cambio

- [ ] **Agendamiento con calendario UI**
  - Vista de calendario para agendar muestras
  - Gestión de disponibilidad del laboratorio

### Media prioridad

- [ ] **Firma del paciente embebida en PDF final**
  - Actualmente el PDF solo incluye la firma del médico
  - Backend debe recibir y embeber `patientSignatureDataUrl` en `buildConsentHtml` antes de generar el PDF

- [ ] **Push notifications**
  - Web Push API o integración WhatsApp Business
  - Alertas de nuevos consentimientos, resultados disponibles

- [ ] **Upload de resultados con drag & drop mejorado**
  - Preview antes de subir, barra de progreso, validación MIME visual

- [ ] **Multitenancy / branding por cliente**
  - Dominio y paleta de color configurables por clínica
  - Configuración via tabla `tenants` en Prisma

### Deuda técnica

- [ ] Eliminar campo legacy `patientResponseAt` del schema Prisma (mismo valor que `patientSignedAt`)
- [ ] Tests de integración frontend (zero coverage — no hay archivos `.spec` en `frontend/src/`)
- [ ] Renombrar `respond-consent-portal.dto.ts` → `respond-consent-patient.dto.ts`

---

## Arquitectura de referencia

```
frontend/ (Next.js 14)          src/ (NestJS)
├── app/
│   ├── (protected)/            ├── modules/
│   │   ├── orders/             │   ├── auth/
│   │   ├── consents/           │   ├── users/
│   │   ├── patients/           │   ├── patients/
│   │   ├── results/            │   ├── orders/
│   │   └── notifications/      │   │   └── order-tests/
│   └── (portal)/               │   ├── consents/
│       └── portal/             │   ├── lab-tests/
│           ├── dashboard/      │   ├── results/
│           ├── orders/         │   ├── appointments/
│           └── results/        │   ├── notifications/
├── components/ui/              │   ├── pdf/
│   ├── SignaturePad.tsx         │   ├── storage/
│   └── ...                     │   └── patient-portal/
├── modules/                    ├── prisma/
│   ├── orders/OrderForm.tsx    │   ├── schema.prisma
│   ├── consents/               │   └── seed.ts
│   └── auth/LoginForm.tsx      └── ...
└── services/
```
