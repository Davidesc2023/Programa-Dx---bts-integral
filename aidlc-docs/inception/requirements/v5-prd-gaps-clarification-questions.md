# Increment v5 — Clarification Questions
## PRD Gaps: PACIENTE role + SCHEDULED status + testList en Order

**Fase**: INCEPTION — Requirements Analysis  
**Fecha**: 2026-04-14  
**Scope PRD**: §6.1 (testList/doctorId), §7 (estado SCHEDULED), §9 (rol PACIENTE)

---

## Question 1
El PRD §6.1 menciona `testList` como campo clave de la orden médica. ¿Cómo debe modelarse la lista de exámenes solicitados?

A) **Array de strings en la Order** — campo `testList String[]` en PostgreSQL (array nativo); simple, sin tabla adicional  
B) **Tabla separada `OrderTest`** — modelo relacional con id, orderId, examCode, examName; más estructurado  
C) **Campo texto libre** — un campo `tests: String?` con texto separado por comas o libre; mínimo esfuerzo  
D) **No implementar** — los exámenes se manejan a nivel de resultados (examType ya existe en Result)  
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 2
El PRD §6.1 menciona `doctorId` como campo de la orden. Actualmente la orden tiene `physician: String?` (texto libre). ¿Qué hacer?

A) **Agregar `doctorId String?` FK a User** — relación formal con el médico; el `physician` texto libre queda deprecated  
B) **Mantener `physician: String?`** — texto libre es suficiente para el MVP; no hay tabla de médicos externos aún  
C) **Ambos** — conservar `physician` para médicos externos y agregar `doctorId` FK para médicos del sistema  
X) Other (please describe after [Answer]: tag below)

[C]: 

---

## Question 3
El PRD §7 incluye el estado `SCHEDULED` en el flujo de la orden (después de ACCEPTED, antes de MUESTRA_RECOLECTADA). ¿Debe agregarse?

A) **Sí, agregar `SCHEDULED`** — el estado confirma que la cita fue agendada; la orden avanza de ACCEPTED → SCHEDULED → MUESTRA_RECOLECTADA  
B) **No, mantener flujo actual** — ACCEPTED → MUESTRA_RECOLECTADA directo; el agendamiento es un dato del appointment, no del estado de la orden  
X) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 4
Si se agrega `SCHEDULED` (Q3=A), ¿quién puede realizar la transición ACCEPTED → SCHEDULED?

A) **LABORATORIO + ADMIN** — quien agenda la toma de muestras  
B) **OPERADOR + LABORATORIO + ADMIN** — el operador también puede confirmar el agendamiento  
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 5
El PRD §9 menciona el rol `PACIENTE`. ¿Debe agregarse como rol del sistema?

A) **Sí — agregar PACIENTE a UserRole** — un paciente puede tener cuenta y ver sus órdenes/resultados con acceso de solo lectura  
B) **No por ahora** — los pacientes son entidades (tabla patients) pero no tienen login; el acceso es gestionado por el operador  
X) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 6
Si se agrega el rol PACIENTE (Q5=A), ¿qué recursos puede ver un paciente autenticado?

A) **Solo sus resultados** — `GET /results?patientId=propio` filtrado por su propio patientId  
B) **Sus órdenes + resultados** — puede ver el estado de sus órdenes y los resultados asociados  
C) **Sus órdenes + resultados + consentimientos** — acceso de lectura a todo su historial  
X) Other (please describe after [Answer]: tag below)

[X]: 
