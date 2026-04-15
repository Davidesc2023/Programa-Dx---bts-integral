# User Stories — v12: Notificaciones Reales + Flujo Operativo

**Fase**: INCEPTION — User Stories  
**Fecha**: 2026-04-15  
**Decisiones**: Q1=C, Q2=A(Resend), Q3=C, Q4=D, Q5=B

---

## HU-V12-01: Email real al enviar consentimiento al paciente

**Como** operador que envía un consentimiento al paciente,  
**quiero** que el paciente reciba un email real (no solo log),  
**para** que pueda revisar y responder desde su correo.

```gherkin
Scenario: Email enviado cuando consentimiento cambia a ENVIADO_PACIENTE
  Given una orden con consentimiento en estado FIRMADO_MEDICO
  When el operador ejecuta "Enviar al Paciente" 
  Then NotificationsService llama a resend.emails.send()
  And el email se dirige al email del paciente
  And el asunto contiene "Consentimiento Informado Pendiente"
  And si RESEND_API_KEY no está configurada, se usa el logger como fallback
```

---

## HU-V12-02: Email real al médico cuando paciente responde consentimiento

**Como** médico con una orden activa,  
**quiero** recibir un email cuando el paciente acepta o rechaza el consentimiento,  
**para** saber si puedo continuar con la toma de muestras.

```gherkin
Scenario: Email al médico cuando paciente acepta/rechaza
  Given un consentimiento en estado ENVIADO_PACIENTE
  When el paciente acepta o rechaza desde su portal
  Then NotificationsService llama a resend.emails.send()
  And el email va al email del médico
  And el asunto indica si fue ACEPTADO o RECHAZADO
```

---

## HU-V12-03: Email a médico y paciente cuando orden se completa

**Como** laboratorista que completa un examen,  
**quiero** que el médico y el paciente reciban notificación automática,  
**para** que puedan consultar los resultados de inmediato.

```gherkin
Scenario: Email doble al completar orden
  Given una orden en estado EN_ANALISIS
  When el laboratorista la transiciona a COMPLETADA
  Then NotificationsService.notifyResultReady() es llamado
  And se envía email al médico de la orden
  And se envía email al paciente vinculado (si tiene cuenta PACIENTE con email)
  And si el paciente no tiene cuenta vinculada, solo se notifica al médico
```

---

## HU-V12-04: Widget "Órdenes en proceso" en dashboard admin

**Como** operador o laboratorista en el dashboard,  
**quiero** ver las órdenes activas (ACCEPTED/SCHEDULED/MUESTRA_RECOLECTADA/EN_ANALISIS) con botón para avanzar estado,  
**para** no tener que entrar al detalle de cada orden para actuar.

```gherkin
Scenario: Widget muestra órdenes con acción rápida
  Given el usuario tiene rol OPERADOR, LABORATORIO o ADMIN
  And existen órdenes en estados de proceso activo
  When accede al dashboard
  Then ve el widget "Órdenes en proceso"
  And cada fila muestra paciente, estado actual y botón "Avanzar"
  And el botón ejecuta la transición permitida para su rol
  And tras avanzar la fila desaparece si ya no hay más transiciones
```

---

## HU-V12-05: Badge de resultados en portal del paciente

**Como** paciente en mi portal,  
**quiero** ver una insignia numérica en el enlace "Resultados",  
**para** saber cuántos resultados nuevos tengo disponibles sin tener que entrar.

```gherkin
Scenario: Badge visible en portal nav
  Given el paciente tiene órdenes en estado COMPLETADA
  When el paciente accede al portal (cualquier página)
  Then el enlace "Resultados" muestra un badge con el número de resultados disponibles
  And si no hay resultados el badge no aparece
```

---

## HU-V12-06: Badge de consentimientos pendientes en portal

**Como** paciente con consentimientos por responder,  
**quiero** ver una insignia en el enlace "Mis Órdenes",  
**para** recordar que debo tomar acción.

```gherkin
Scenario: Badge de consentimientos en portal nav
  Given el paciente tiene al menos una orden con consentimiento ENVIADO_PACIENTE
  When el paciente accede al portal
  Then el enlace "Mis Órdenes" muestra un badge con el número de consentimientos pendientes
```
