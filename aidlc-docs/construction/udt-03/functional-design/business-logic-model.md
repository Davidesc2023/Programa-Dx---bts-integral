# Modelo de Lógica de Negocio — UDT-03: Patients

## 1. Flujos de Negocio Principales

### 1.1 Registro de Paciente (POST /patients)
```
[ADMIN o OPERADOR autenticado] →
[Validar unicidad documentType+documentNumber] →
[Crear Patient en DB con createdBy] →
[Retornar PatientResponseDto]
```

### 1.2 Listado de Pacientes (GET /patients)
```
[ADMIN o OPERADOR autenticado] →
[Obtener pacientes activos (deletedAt=null)] →
[Paginación offset: skip=(page-1)*limit, take=limit] →
[Retornar PaginatedResponseDto<PatientResponseDto>]
```

### 1.3 Búsqueda por número de documento (GET /patients?search=X)
```
[ADMIN o OPERADOR autenticado] →
[Filtrar por documentNumber LIKE %X% OR firstName LIKE %X% OR lastName LIKE %X%] →
[Paginación sobre resultados filtrados] →
[Retornar PaginatedResponseDto<PatientResponseDto>]
```

### 1.4 Obtener Paciente por ID (GET /patients/:id)
```
[ADMIN, OPERADOR o LABORATORIO autenticado] →
[Buscar {id, deletedAt:null}] →
[NotFoundException si no existe] →
[Retornar PatientResponseDto]
```

### 1.5 Actualización de Paciente (PATCH /patients/:id)
```
[ADMIN o OPERADOR autenticado] →
[Verificar existencia] →
[Actualizar campos provistos (partial update) + updatedBy] →
[Retornar PatientResponseDto actualizado]
```

### 1.6 Eliminación Lógica (DELETE /patients/:id)
```
[ADMIN o OPERADOR autenticado] →
[softDelete helper: verificar existencia, setear deletedAt] →
[Retornar 200 OK]
```

## 2. Invariantes del Dominio

| Invariante | Descripción |
|---|---|
| Documento único | La combinación `(documentType, documentNumber)` es única entre pacientes activos y eliminados |
| Soft delete consistente | `deletedAt` seteado en eliminación; consultas siempre filtran `{deletedAt: null}` |
| Auditoría completa | `createdBy` y `updatedBy` registrados en cada operación de escritura |
| Búsqueda case-insensitive | Filtros de búsqueda usan `mode: 'insensitive'` de Prisma |

## 3. Modelo de Estado — Paciente

```
ACTIVO (deletedAt=null)
    │
    ▼ DELETE /patients/:id
ELIMINADO (deletedAt=timestamp)  ← unidireccional, no reversible
```

## 4. Relaciones con Otros Módulos

- Un paciente puede tener múltiples `Order[]` (UDT-04)
- Un paciente puede tener múltiples `Appointment[]` (UDT-06)
- Al eliminar un paciente NO se eliminan en cascada sus órdenes (integridad histórica)
