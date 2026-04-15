# v12 — Clarification Questions (AI-DLC INCEPTION)

**Fase**: Requirements Analysis  
**Fecha**: 2026-04-15  
**Proyecto**: APP-DX — Sistema de Solicitud y Gestión de Laboratorios

---

## Contexto

El sistema está operativo con v1–v11. Los gaps pendientes del PRD son:

1. **Notificaciones**: `NotificationsService` es un stub (solo `Logger`) — **nunca envía emails reales**
2. **Eventos de notificación faltantes**: no existe `notifyResultReady()` ni `notifyAppointmentScheduled()`
3. **Estado visible en frontend**: las transiciones `MUESTRA_RECOLECTADA → EN_ANALISIS → COMPLETADA` existen en el backend pero no se pueden activar fácilmente desde la UI del operador/laboratorio
4. **Firma digital del médico** (PRD §6.2): el médico debe firmar antes de enviar al paciente — **no implementado**

---

## Pregunta 1: Focus de v12

¿Cuál es el alcance principal de v12?

```
A) Notificaciones reales — conectar NotificationsService a un proveedor de email (Resend, SendGrid o Nodemailer SMTP). Los HTMLs ya están listos.

B) Flujo operativo completo — botones en el frontend para que el operador/laboratorio avance los estados: ACCEPTED → SCHEDULED → MUESTRA_RECOLECTADA → EN_ANALISIS → COMPLETADA. Con notificación al completar.

C) Ambas (A + B) — notificaciones reales + UI de transición de estados. Mayor scope pero completa el flujo PRD.

D) Firma digital del médico — el médico firma el consentimiento antes de enviarlo al paciente (campo de firma + validación). Requiere más diseño.

E) Otro (describe en el campo de respuesta)
```

[C]: 

---

## Pregunta 2: Proveedor de email (si A o C)

¿Qué proveedor de email quieres usar?

```
A) Resend (resend.com) — API key, SDK oficial para Node/NestJS, free tier 100 emails/día. Recomendado.

B) SendGrid — API key, ampliamente usado. Free tier 100/día.

C) Nodemailer + SMTP — con un servidor SMTP externo (Gmail, Outlook, propio). Sin SDK adicional.

D) Brevo (ex-Sendinblue) — API REST, free tier 300/día.

E) No aplica (elegí opción B o D en Q1)
```

[A]: 

---

## Pregunta 3: Notificación de resultado disponible

Cuando se completa una orden (`COMPLETADA`), ¿a quién se notifica?

```
A) Solo al paciente (si tiene cuenta PACIENTE vinculada y email)

B) Solo al médico que creó la orden

C) Ambos: paciente (si vinculado) + médico

D) Nadie por ahora — solo notificaciones de consentimiento existentes

E) Otro
```

[C]: 

---

## Pregunta 4: UI de transición de estados (si B o C en Q1)

¿Desde dónde debe el operador/laboratorio avanzar los estados?

```
A) En la pantalla de detalle de orden existente (/orders/[id]) — añadir botón de acción contextual según estado actual

B) Nueva sección/vista en el dashboard del operador — lista de órdenes con acciones rápidas

C) Solo desde el backend (API), sin cambios en frontend por ahora

D) Ambas: botón en detalle + vista rápida en dashboard
```

[D]: 

---

## Pregunta 5: Notificación al paciente desde el portal del paciente

Cuando el paciente está mirando el portal y su orden cambia de estado, ¿quieres notificación?

```
A) Solo email externo — el portal ya muestra el estado en tiempo real cuando recarga

B) Badge/indicador en el portal + email externo

C) No aplicable por ahora — solo emails a médico/paciente en eventos clave del flujo

D) Toast de notificación en el portal (polling o refetch automático)
```

[B]:

