# Reglas de Negocio — UDT-04: Orders

## Grupo R01 — Control de Acceso

| ID | Regla | Severidad |
|---|---|---|
| R01-001 | Solo ADMIN y OPERADOR pueden crear órdenes | BLOQUEANTE |
| R01-002 | Todos los roles autenticados pueden listar y ver órdenes | BLOQUEANTE |
| R01-003 | Solo ADMIN y OPERADOR pueden editar datos de la orden (PATCH /orders/:id) | BLOQUEANTE |
| R01-004 | Solo ADMIN y OPERADOR pueden eliminar (soft delete) una orden | BLOQUEANTE |
| R01-005 | Las transiciones de estado tienen roles permitidos específicos (ver tabla de transiciones) | BLOQUEANTE |

## Grupo R02 — Estado y Transiciones

| ID | Regla | Severidad |
|---|---|---|
| R02-001 | Al crear una orden, el status inicial es siempre PENDIENTE | BLOQUEANTE |
| R02-002 | Solo se permiten las transiciones definidas en la tabla de la máquina de estados | BLOQUEANTE |
| R02-003 | Una transición inválida retorna 422 Unprocessable Entity con mensaje descriptivo | BLOQUEANTE |
| R02-004 | COMPLETADA, CANCELADA y RECHAZADA son estados terminales — no admiten nueva transición | BLOQUEANTE |
| R02-005 | El rol del usuario actuante se verifica contra los roles permitidos para cada transición | BLOQUEANTE |

## Grupo R03 — Validación de Datos

| ID | Regla | Severidad |
|---|---|---|
| R03-001 | `patientId` debe referenciar un paciente activo (deletedAt=null) | BLOQUEANTE |
| R03-002 | `physician`, `priority`, `observations`, `estimatedCompletionDate` son opcionales | INFORMATIVO |
| R03-003 | `priority` acepta: URGENTE, NORMAL, RUTINA (si se provee) | IMPORTANTE |
| R03-004 | Los datos de la orden solo son editables en estado PENDIENTE; de lo contrario retorna 409 | BLOQUEANTE |
| R03-005 | Solo se puede hacer soft delete cuando status=PENDIENTE; de lo contrario retorna 409 | BLOQUEANTE |

## Grupo R04 — Integridad y Auditoría

| ID | Regla | Severidad |
|---|---|---|
| R04-001 | `createdBy` y `updatedBy` registran el UUID del usuario actuante | IMPORTANTE |
| R04-002 | El soft delete es irreversible por API | BLOQUEANTE |
| R04-003 | Los filtros de listado (patientId, status) pueden combinarse | INFORMATIVO |
