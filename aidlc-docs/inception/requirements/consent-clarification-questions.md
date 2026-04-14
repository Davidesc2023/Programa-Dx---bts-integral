# Preguntas de Clarificación — Módulo de Consentimiento
## Increment v2: APP-DX Sistema de Laboratorios

**Contexto**: El PRD define el Consentimiento como el "punto crítico" del sistema.
Antes de diseñar el módulo, necesitamos responder las siguientes preguntas.
**Responde escribiendo la letra elegida después de cada `[Answer]:`**

---

## Pregunta 1
El PRD define al **Médico** como actor que crea órdenes y firma el consentimiento.
Actualmente el sistema tiene estos roles: `ADMIN`, `OPERADOR`, `LABORATORIO`.
¿Cómo manejamos el rol del médico?

A) Agregar un nuevo rol `MEDICO` al enum `UserRole` en Prisma (requiere migración)
B) Usar el rol `OPERADOR` existente para representar al médico (sin cambio de schema)
C) Crear un campo libre `physician` en la orden que actúa como nombre del médico (ya existe en el modelo Order)
D) Otro (describir después del tag [Answer])

[A]: 

---

## Pregunta 2
El PRD dice que el **Paciente** acepta o rechaza el consentimiento.
Actualmente los pacientes son solo registros en la BD (sin autenticación).
¿Cómo maneja el paciente su respuesta al consentimiento?

A) Un operador registra la respuesta del paciente en el sistema (el paciente firma en papel o verbalmente, el operador lo registra)
B) El paciente recibe un enlace único por email y responde desde un formulario web (requiere módulo de notificaciones y frontend futuro)
C) Por ahora se registra solo el estado y el operador lo actualiza manualmente — la integración real del paciente es fase futura
D) Otro (describir después del tag [Answer])

[C]: 

---

## Pregunta 3
¿Qué significa técnicamente **"firma"** del médico en el consentimiento?

A) Un timestamp + userId registrado en la BD cuando el médico confirma (registro de auditoría simple)
B) Un campo `signatureHash` que guarda un hash de los datos del consentimiento en el momento de firmar
C) Firma manuscrita digitalizada (imagen/archivo adjunto) — requiere módulo de archivos
D) Por ahora solo es un cambio de estado con timestamp, sin criptografía — la firma digital real es fase futura
E) Otro (describir después del tag [Answer])

[D]: 

---

## Pregunta 4
¿El consentimiento está asociado directamente a una **Orden** (1 consentimiento por orden) o es más general?

A) 1 consentimiento por orden — el consentimiento se crea cuando se crea la orden y controla su flujo
B) 1 consentimiento por paciente por tipo de examen — puede haber reutilización
C) El consentimiento es en sí mismo el punto de entrada — se crea un consentimiento y luego se genera la orden cuando es aceptado
D) Otro (describir después del tag [Answer])

[A]: 

---

## Pregunta 5
¿Actualizamos los **estados de la Orden** para incluir los nuevos estados del PRD?

El PRD define este flujo completo:
```
CREATED → CONSENT_PENDING → SENT_TO_PATIENT → ACCEPTED → SCHEDULED → SAMPLE_COLLECTED → IN_ANALYSIS → COMPLETED
                                                    ↓
                                                REJECTED / CANCELLED
```
El estado actual del sistema tiene:
```
PENDIENTE → MUESTRA_RECOLECTADA → EN_ANALISIS → COMPLETADA / CANCELADA / RECHAZADA
```

A) Sí — migrar a los nuevos estados del PRD (requiere migración de BD y actualizar lógica de transición)
B) No — mantener los estados actuales de la orden y que el Consentimiento tenga sus propios estados separados
C) Parcial — agregar solo los estados nuevos que el Consentimiento necesita (`CONSENT_PENDING`, `ACCEPTED`, `REJECTED`) y mantener los demás
D) Otro (describir después del tag [Answer])

[C]: 

---

## Pregunta 6
El Consentimiento necesita tener sus propios **estados internos**.
¿Qué conjunto de estados apruebas para el modelo `Consent`?

A) Conjunto mínimo: `PENDIENTE_FIRMA_MEDICO` → `FIRMADO_MEDICO` → `ENVIADO_PACIENTE` → `ACEPTADO` / `RECHAZADO`
B) Igual al PRD exacto: `PENDING_DOCTOR_SIGNATURE` → `SIGNED_BY_DOCTOR` → `SENT_TO_PATIENT` → `ACCEPTED` / `REJECTED`
C) Aún más simplificado: `BORRADOR` → `ACTIVO` → `ACEPTADO` / `RECHAZADO`
D) Otro (describir después del tag [Answer])

[A]: 

---

## Pregunta 7
¿El módulo de Consentimiento debe exponer **endpoints propios** o se gestiona todo desde Órdenes?

A) Endpoints propios bajo `/consents` (CRUD + cambios de estado) — módulo independiente
B) Todo desde `/orders/:id/consent` — el consentimiento vive dentro del contexto de la orden
C) Ambos — endpoints propios Y endpoints anidados en orden para flujos frecuentes
D) Otro (describir después del tag [Answer])

[B]: 
