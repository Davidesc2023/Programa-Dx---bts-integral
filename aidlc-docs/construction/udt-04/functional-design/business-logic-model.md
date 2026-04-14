# Modelo de Lógica de Negocio — UDT-04: Orders

## 1. Flujos de Negocio Principales

### 1.1 Crear Orden (POST /orders)
```
[ADMIN o OPERADOR autenticado] →
[Verificar que el paciente exista y no esté eliminado] →
[Crear Order con status=PENDIENTE y createdBy] →
[Retornar OrderResponseDto]
```

### 1.2 Listar Órdenes (GET /orders)
```
[Cualquier rol autenticado] →
[Filtros opcionales: patientId, status] →
[Paginación offset] →
[Retornar PaginatedResponseDto<OrderResponseDto>]
```

### 1.3 Ver Orden (GET /orders/:id)
```
[Cualquier rol autenticado] →
[Buscar {id, deletedAt:null}] →
[NotFoundException si no existe] →
[Retornar OrderResponseDto]
```

### 1.4 Transición de Estado (PATCH /orders/:id/status)
```
[ADMIN, OPERADOR o LABORATORIO autenticado] →
[Buscar orden existente] →
[Validar transición permitida según rol y estado actual] →
[Actualizar status + updatedBy] →
[Retornar OrderResponseDto actualizado]
```
> Este endpoint es separado de PATCH /orders/:id para hacer explícita la semántica del cambio de estado.

### 1.5 Actualizar Datos de Orden (PATCH /orders/:id)
```
[ADMIN o OPERADOR autenticado] →
[Solo editable si status=PENDIENTE] →
[Actualizar campos (physician, priority, observations, estimatedCompletionDate) + updatedBy] →
[Retornar OrderResponseDto actualizado]
```

### 1.6 Cancelar / Eliminar Orden (DELETE /orders/:id)
```
[ADMIN o OPERADOR autenticado] →
[Solo si status=PENDIENTE] →
[softDelete + updatedBy] →
[Retornar 200 OK]
```

## 2. Máquina de Estados

```
                    ┌──────────────────────────────────────┐
                    │            PENDIENTE                  │
                    │  (Estado inicial al crear orden)      │
                    └───────┬──────────────┬───────────────┘
                            │              │
              LABORATORIO/  │              │  OPERADOR/
              ADMIN         │              │  ADMIN
                            │              │
                            ▼              ▼
              ┌─────────────────┐     ┌──────────┐
              │ MUESTRA_        │     │ CANCELADA│ (terminal)
              │ RECOLECTADA     │     └──────────┘
              └────────┬────────┘
                       │ LABORATORIO/ADMIN
                       ▼
              ┌─────────────────┐
              │   EN_ANALISIS   │
              └────────┬────────┘
                       │ LABORATORIO/ADMIN
              ┌────────▼────────┐
              │   COMPLETADA    │ (terminal)
              └─────────────────┘

RECHAZADA ← desde MUESTRA_RECOLECTADA (LABORATORIO/ADMIN)
```

### Tabla de transiciones válidas

| Estado actual | Estado destino | Roles permitidos |
|---|---|---|
| PENDIENTE | MUESTRA_RECOLECTADA | LABORATORIO, ADMIN |
| PENDIENTE | CANCELADA | OPERADOR, ADMIN |
| MUESTRA_RECOLECTADA | EN_ANALISIS | LABORATORIO, ADMIN |
| MUESTRA_RECOLECTADA | RECHAZADA | LABORATORIO, ADMIN |
| EN_ANALISIS | COMPLETADA | LABORATORIO, ADMIN |
| COMPLETADA | — | (ninguna — estado terminal) |
| CANCELADA | — | (ninguna — estado terminal) |
| RECHAZADA | — | (ninguna — estado terminal) |

## 3. Invariantes del Dominio

| Invariante | Descripción |
|---|---|
| Paciente activo | Solo se pueden crear órdenes para pacientes no eliminados |
| Edición restringida | Los datos de la orden solo se pueden editar en estado PENDIENTE |
| Eliminación restringida | Solo se puede hacer softDelete en estado PENDIENTE |
| Transición explícita | El campo `status` solo cambia vía PATCH /orders/:id/status, nunca en PATCH /orders/:id |
| Estados terminales | COMPLETADA, CANCELADA y RECHAZADA no admiten más transiciones |
