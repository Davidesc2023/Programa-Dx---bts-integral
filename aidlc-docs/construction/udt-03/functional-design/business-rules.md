# Reglas de Negocio — UDT-03: Patients

## Grupo R01 — Control de Acceso

| ID | Regla | Severidad |
|---|---|---|
| R01-001 | ADMIN y OPERADOR pueden crear, listar, ver, actualizar y eliminar pacientes | BLOQUEANTE |
| R01-002 | LABORATORIO solo puede ver pacientes (GET /patients y GET /patients/:id) | BLOQUEANTE |
| R01-003 | Todos los endpoints requieren autenticación JWT válida | BLOQUEANTE |

## Grupo R02 — Validación de Datos

| ID | Regla | Severidad |
|---|---|---|
| R02-001 | `documentType` acepta valores: DNI, PASAPORTE, CE (Carnet de Extranjería), NIT | BLOQUEANTE |
| R02-002 | `documentNumber` es requerido, no vacío, máximo 20 caracteres | BLOQUEANTE |
| R02-003 | La combinación `(documentType, documentNumber)` debe ser única | BLOQUEANTE |
| R02-004 | `firstName` y `lastName` son requeridos, mínimo 2 caracteres | BLOQUEANTE |
| R02-005 | `birthDate` es requerida y debe ser una fecha pasada (no futura) | BLOQUEANTE |
| R02-006 | `phone` es opcional; si se provee, formato numérico de 7-15 dígitos | IMPORTANTE |
| R02-007 | `email` de paciente es opcional; si se provee, debe ser formato válido | IMPORTANTE |

## Grupo R03 — Búsqueda y Paginación

| ID | Regla | Severidad |
|---|---|---|
| R03-001 | El parámetro opcional `search` filtra por `documentNumber`, `firstName` o `lastName` (OR, case-insensitive) | IMPORTANTE |
| R03-002 | La paginación usa los valores heredados: page=1, limit=10, max=100 | BLOQUEANTE |
| R03-003 | Los pacientes eliminados nunca aparecen en listados ni búsquedas | BLOQUEANTE |

## Grupo R04 — Integridad Referencial

| ID | Regla | Severidad |
|---|---|---|
| R04-001 | La eliminación de un paciente es exclusivamente lógica (soft delete) | BLOQUEANTE |
| R04-002 | No se puede eliminar un paciente que tenga órdenes activas (status != CANCELADA/RECHAZADA/COMPLETADA) | IMPORTANTE |
| R04-003 | `createdBy` y `updatedBy` almacenan el UUID del usuario actuante | IMPORTANTE |
