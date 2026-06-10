# CHANGELOG — APP-DX (BTS Integral)

> Registro de todo lo implementado, sesión por sesión.
> Formato: fecha · componente · descripción · estado

---

## Sesión 2026-06-10 — Claude Sonnet 4.6

### Infraestructura
- **[DONE]** Migración de base de datos de Railway PostgreSQL → Supabase proyecto `App_DX` (ID: `wwosggahpasvoexshrdl`, us-east-2)
- **[DONE]** Schema Prisma completo aplicado en Supabase: users, patients, orders, order_tests, lab_tests, consents, results, appointments, notifications
- **[DONE]** `prisma generate` ejecutado — cliente actualizado con nuevos modelos LabTest, Notification, LabTestType
- **[DONE]** `.env.example` actualizado con formato de conexión Supabase

### Backend — Catálogo de Exámenes (LabTest)
- **[DONE]** `prisma/schema.prisma` — Enum `LabTestType` (NIVEL_SERICO, GENETICO, PANEL, IMAGEN, MICROBIOLOGIA, OTRO)
- **[DONE]** `prisma/schema.prisma` — Modelo `LabTest` con FK self-referenciante `requiresResultFromId` para prerequisitos
- **[DONE]** `prisma/schema.prisma` — Campo `labTestId String?` en `OrderTest` (referencia al catálogo, null = entrada libre legacy)
- **[DONE]** `src/modules/lab-tests/lab-tests.service.ts` — CRUD + `checkPrerequisite(labTestId, patientId)`
- **[DONE]** `src/modules/lab-tests/lab-tests.controller.ts` — REST endpoints
- **[DONE]** `src/modules/lab-tests/lab-tests.module.ts` — módulo NestJS
- **[DONE]** `src/app.module.ts` — `LabTestsModule` registrado
- **[DONE]** `prisma/seed.ts` — 15 exámenes clínicos reales (HEM, A1A-S, A1A-G, COL, TSH, URI, HBA1C, PCR, FER, CUL, RX-TX, ECO-AB, HCV-Ab, VIT-D)
- **[DONE]** Seed aplicado en Supabase App_DX

### Backend — OrderTests (resolución desde catálogo)
- **[DONE]** `src/modules/orders/order-tests/dto/create-order-test.dto.ts` — `examCode` y `examName` ahora opcionales; añadido `labTestId?`
- **[DONE]** `src/modules/orders/order-tests/order-tests.service.ts` — Si viene `labTestId`, resuelve código/nombre desde catálogo; valida `isActive`

### Backend — Consentimiento con firma digital
- **[DONE]** `src/modules/consents/dto/sign-consent.dto.ts` — Campo `signatureDataUrl?: string` añadido
- **[DONE]** `src/modules/pdf/pdf.service.ts` — `ConsentTemplateData` acepta `doctorSignatureDataUrl?`; firma del médico embebida como `<img>` en el HTML del documento
- **[DONE]** `src/modules/consents/consents.service.ts` — Pasa `signatureDataUrl` a `buildConsentHtml`; añade `specialty` y `medicalLicense` al `CONSENT_SELECT` del doctor

### Backend — Correcciones
- **[DONE]** `src/modules/notifications/notifications.controller.ts` — `ResponseDto.of()` corregido para 3 argumentos
- **[DONE]** `src/modules/notifications/notifications.service.ts` — Tipo JSON correcto para campo `metadata` en Prisma

### Frontend — Login
- **[DONE]** `frontend/src/modules/auth/LoginForm.tsx` — Rediseño completo
  - Mobile: header centrado con ícono teal, inputs redondeados, "¿Olvidaste tu contraseña?", footer Clinical Sanctuary
  - Desktop: panel izquierdo degradado teal con overlay de rejilla, stats row, trust badges, split 50/50

### Frontend — Catálogo de Exámenes
- **[DONE]** `frontend/src/services/lab-tests.service.ts` — `getLabTests()`, `checkPrerequisite()`
- **[DONE]** `frontend/src/modules/orders/OrderForm.tsx` — Rediseño completo con layout split
  - Panel izquierdo: PatientPicker, DoctorPicker, prioridad, fecha, diagnóstico, observaciones
  - Panel derecho: catálogo con búsqueda, categorías colapsables, `ExamRow` con lock icon para prerequisitos, badges de tipo con color por categoría
  - Panel inferior oscuro: resumen de exámenes seleccionados, horas estimadas, botón "Generar Orden y Consentimiento"
- **[DONE]** `frontend/src/services/orders.service.ts` — `AddOrderTestPayload`, `addOrderTest`, `addOrderTests` batch
- **[DONE]** `frontend/src/modules/orders/useOrders.ts` — `CreateOrderPayload` con `selectedExams`; `useCreateOrder` crea orden y luego añade exámenes en batch
- **[DONE]** `frontend/src/app/(protected)/orders/new/page.tsx` — Sin wrapper Card, full-width, tipo correcto

### Frontend — Consentimiento con firma digital
- **[DONE]** `frontend/src/components/ui/SignaturePad.tsx` — Componente canvas reutilizable (mouse + touch + retina DPI), ref con `getDataUrl()`, `clear()`, `isEmpty()`
- **[DONE]** `frontend/src/modules/consents/ConsentPanel.tsx` — Reemplazo de confirm dialog por modal de firma completo
  - Layout 2 columnas: documento legal preview (izquierda) + pad de firma + info médico + checkbox aceptación + notas (derecha)
  - Firma PNG base64 incluida en payload al backend
- **[DONE]** `frontend/src/services/consents.service.ts` — `signConsent` acepta `{ notes?, signatureDataUrl? }`
- **[DONE]** `frontend/src/modules/consents/useConsent.ts` — `SignPayload` interface; `useSignConsent` acepta payload tipado
- **[DONE]** `frontend/src/app/(portal)/portal/orders/[orderId]/consent/page.tsx` — Rediseño completo al prototipo Clinical Sanctuary
  - Tarjetas paciente + orden, lista de exámenes, visor de documento HTML, pad de firma (gate antes de aceptar), aviso Habeas Data, botones Rechazar/Aceptar

### Frontend — Correcciones y tipos
- **[DONE]** `frontend/src/types/api.types.ts` — `Consent` actualizado con `doctorId`, `doctorSignedAt`, `order`, `doctor`; `OrderTest` con `examCode`, `examName`, `notes`, `labTestId`, `labTest`
- **[DONE]** `frontend/src/app/(portal)/portal/orders/[orderId]/page.tsx` — `t.name` → `t.examName`
- **[DONE]** `frontend/src/modules/orders/OrderDetail.tsx` — `t.name` → `t.examName`

### Limpieza de deuda técnica (esta sesión)
- **[DONE]** `frontend/src/types/api.types.ts` — Eliminados campos legacy `signedBy?`, `signedAt?`, `respondedAt?` del tipo `Consent`
- **[DONE]** `frontend/src/app/(protected)/consents/page.tsx` — `consent.signedAt` → `consent.doctorSignedAt`; `consent.respondedAt` → `consent.patientSignedAt`
- **[DONE]** `frontend/src/modules/consents/ConsentPanel.tsx` — Eliminados type-casts `as { signedBy?: string }` y `as { respondedAt?: string }`; referencias directas a `doctorNameSnapshot` y `patientSignedAt`
- **[DONE]** `frontend/src/app/(portal)/portal/orders/[orderId]/consent/page.tsx` — Eliminados todos los type-casts de extracción de datos; uso directo de campos tipados

---

## Sesiones anteriores (pre 2026-06-10)

### Seguridad y audit (commits previos)
- `fix(security)`: 0 vulnerabilidades en audit — bcrypt, JWT, rate limiting, helmet, CORS
- `fix(medium)`: storage consolidation, MD3 color tokens, response types, MEDICO upload ownership
- Sistema de notificaciones in-app sin email (NotificationsService, NotificationBell, NotificationsPage)
- Portal paciente: layout, dashboard, órdenes, resultados, citas
- Módulos backend: patients, orders, consents, results, appointments, users, auth, portal, pdf, storage

---

## Pendiente / Próximas sesiones

### Alta prioridad
- [ ] Conectar Railway a Supabase App_DX (cambiar DATABASE_URL en Railway settings)
- [ ] Registro de médicos con aprobación admin (flujo PRD sección 1–2)
- [ ] Timeline visual de estado de la orden (PRD Extra UX)
- [ ] Agendamiento con calendario UI (PRD sección 8)

### Media prioridad
- [ ] Firma del paciente embebida en el PDF final (actualmente solo firma del médico)
- [ ] Push notifications (Web Push o WhatsApp simulado)
- [ ] Upload de resultados con drag & drop mejorado
- [ ] Multitenancy / branding por cliente

### Deuda técnica identificada
- [ ] `prisma/schema.prisma` — Campo `patientResponseAt` legacy (mismo valor que `patientSignedAt`); eliminar en próxima migración cuando se confirme que no hay referencias externas
- [ ] Frontend carece de tests (cero archivos .spec en `frontend/src/`)
- [ ] `src/modules/patient-portal/dto/respond-consent-portal.dto.ts` — nombre confuso, podría renombrarse a `respond-consent-patient.dto.ts`
