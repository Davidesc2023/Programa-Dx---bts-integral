# Preguntas de Clarificación — Increment v11: Rol PACIENTE + Portal

Por favor responde cada pregunta usando el tag `[Answer]:` con la letra correspondiente.

---

## Pregunta 1
**Vinculación Patient ↔ User**

Actualmente `Patient` (registro clínico) y `User` (cuenta del sistema) son entidades separadas sin FK entre ellas. Para que un paciente pueda hacer login y ver SUS órdenes, hay que decidir cómo se vinculan:

A) Agregar `userId String? @unique` en el modelo `Patient` — un paciente clínico puede tener opcionalmente una cuenta de usuario. El admin crea el User con rol PACIENTE y lo vincula al Patient existente.

B) Al crear un User con rol PACIENTE, el sistema busca automáticamente el Patient por `documentType + documentNumber` y establece el vínculo. El PACIENTE User debe tener los mismos `documentType` y `documentNumber` que su registro Patient.

C) Mantener sin vinculación directa — el paciente ve todas las órdenes cuyo Patient tenga el mismo `email` que su User. No requiere migración de schema.

D) Otra estrategia (describir después del tag).

[A]: 

---

## Pregunta 2
**¿Cómo se crea la cuenta de un paciente?**

A) Solo el ADMIN puede crear usuarios con rol PACIENTE (igual que los demás roles — desde el módulo Usuarios).

B) El ADMIN crea la cuenta. Además, se añade un flujo de auto-registro: el paciente puede registrarse con su email + documento desde la pantalla de login.

C) Solo auto-registro: el paciente llega a la URL del portal, se registra con email + contraseña + tipo documento + número documento, y el sistema vincula automáticamente su registro clínico.

D) Otro mecanismo (describir después del tag).

[B]: 

---

## Pregunta 3
**Alcance del portal del paciente**

¿Qué puede hacer el paciente en su portal? (Seleccionar el más completo que aplique)

A) Solo consentimientos: ver el consentimiento pendiente de su orden y aceptar/rechazar. Nada más.

B) Consentimientos + resultados: aceptar/rechazar consentimiento y ver los resultados de sus exámenes.

C) Completo: ver sus órdenes, aceptar/rechazar consentimiento, ver resultados y adjuntos, ver sus citas agendadas.

D) Otro alcance (describir después del tag).

[C]: 

---

## Pregunta 4
**¿Página separada o integrada en el mismo frontend?**

A) Portal separado en la misma app Next.js pero con rutas propias: `/portal/login`, `/portal/dashboard`, `/portal/consents/[id]`. Layout diferente (sin sidebar de admin).

B) Misma app, mismo login `/login`. Después del login el sistema redirige al dashboard según el rol: si es PACIENTE va a `/portal/dashboard`.

C) Aplicación completamente separada (nuevo proyecto Next.js). Solo compartirían la API del backend.

D) Otra estructura (describir después del tag).

[B]: 

---

## Pregunta 5
**Guards de rol PACIENTE en el backend**

El backend actualmente no tiene guards para el rol PACIENTE (no existe en el enum). ¿Qué nivel de acceso debe tener?

A) El PACIENTE solo puede acceder a endpoints específicos del portal (`GET /portal/me/orders`, `POST /portal/consents/:id/respond`, `GET /portal/results`). Endpoints de admin completamente bloqueados.

B) El PACIENTE puede llamar los mismos endpoints (`GET /orders`, `GET /consents`, etc.) pero el servicio filtra automáticamente para mostrar solo SUS datos.

C) Crear un módulo `PatientPortalModule` completamente nuevo con sus propios controladores, servicios y DTOs — separado de los módulos existentes.

D) Otra estrategia de acceso (describir después del tag).

[C]: 
