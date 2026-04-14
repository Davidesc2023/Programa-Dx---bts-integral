# Increment v3 — Clarification Questions
## Módulo: Notificaciones + Flujo Post-ACCEPTED

**Fase**: INCEPTION — Requirements Analysis  
**Fecha**: 2026-04-14  
**Scope PRD**: §6.3 Notificaciones + §5 Flujo funcional (post-ACCEPTED)

---

## Question 1
¿Qué proveedor/mecanismo deseas usar para enviar notificaciones de email?

A) **Nodemailer + SMTP** (Gmail, Outlook, o cualquier servidor SMTP) — configurado por env vars, sin dependencias externas de pago  
B) **SendGrid SDK** — proveedor cloud dedicado, mejor deliverability, requiere API key  
C) **Stub/Log only** — no enviar email real ahora; solo loguear el evento para desarrollo; implementar envío real después  
D) **Resend SDK** — proveedor moderno con API simple, tier gratuito generoso  
X) Other (please describe after [Answer]: tag below)

[C]: 

---

## Question 2
¿Cuáles eventos del sistema deben disparar una notificación? (Selecciona los que apliquen)

A) **Solo los del flujo de consentimiento**:
   - `consent/send` → email al paciente con link/info del consentimiento
   - `consent/respond(ACEPTADO)` → email al médico/operador confirmando aceptación
   - `consent/respond(RECHAZADO)` → email al médico/operador indicando rechazo

B) **Consentimiento + cambios de estado de la orden**:
   - Todo lo de A, más: cuando la orden pasa a `COMPLETADA` → email al paciente y médico con aviso de resultados disponibles

C) **Solo notificación de envío al paciente**:
   - Únicamente cuando el consentimiento se envía al paciente

X) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 3
El campo `email` del paciente (`Patient.email`) es opcional en la BD. ¿Qué debe hacer el sistema si el paciente no tiene email registrado?

A) **Lanzar error HTTP 400** — el operador debe primero actualizar el email del paciente antes de enviar el consentimiento  
B) **Silently skip** — si no hay email, omitir la notificación sin error; continuar el flujo normalmente  
C) **Loguear advertencia + continuar** — registrar un log `WARN` con el orderId y continuar sin interrumpir el flujo  
X) Other (please describe after [Answer]: tag below)

[C]: 

---

## Question 4
¿Cómo deben ejecutarse las notificaciones (sincronía)?

A) **Fire-and-forget inline** — llamar al mailer dentro del service sin `await`; si falla el email, la operación principal igual responde 200  
B) **Await inline (bloqueante)** — esperar que el email se envíe antes de responder al cliente; si falla el email, retornar error  
C) **Bull Queue (async)** — agregar job a una cola Redis; un worker procesa el email en background; requiere Redis adicional  
X) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 5
¿Cuál es el formato deseado para los emails de notificación?

A) **Plain text** — mensajes simples sin HTML, máxima compatibilidad  
B) **HTML básico** — HTML simple con estilos inline, sin templates externos  
C) **Handlebars templates** — archivos `.hbs` en disco para cada tipo de email, más mantenible  
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 6
Cuando el paciente **ACEPTA** el consentimiento (`respond(ACEPTADO)`), ¿qué debe ocurrir automáticamente en el sistema?

A) **Solo cambiar estados** — consent → `ACEPTADO`, order → `ACCEPTED`; nada más (el agendamiento sigue siendo manual)  
B) **Crear cita automáticamente** — generar un registro `Appointment` con estado `PROGRAMADA` asociado a la orden y paciente, con fecha/hora a definir  
C) **Crear cita con fecha propuesta** — igual que B, pero calcular una fecha propuesta automáticamente (ej. `now + 24h`) como punto de partida  
X) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 7
Si implementamos creación automática de cita (respuesta B o C en Q6), ¿qué campo se usa como `physician` (responsable) de la cita?

A) **El `doctorId` del consentimiento** — usa el médico que firmó el consent  
B) **Dejar physician como null** — el operador lo asigna después manualmente  
C) **Usar el campo `physician` (String) de la orden** — reutilizar el nombre del médico ya registrado en la orden  
X) Other (please describe after [Answer]: tag below)

[C]: 
