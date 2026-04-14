# Plan de Code Generation — UDT-01: Application Layer

## Contexto
- **Tipo de proyecto**: Greenfield
- **Workspace root**: `c:\Users\DavidEstebanSanguino\OneDrive - BotoShop\Business Intelligence\APP-DX`
- **Código fuente**: `{workspace_root}/src/`
- **Documentación**: `aidlc-docs/construction/udt-01/code/`
- **Historias cubiertas**: Esta unidad no tiene historias directas — es infraestructura transversal
- **Dependencias**: Ninguna (es la base)

---

## Pasos de Generación

### Paso 1 — Estructura de directorios inicial
- [x] Crear carpeta `src/`
- [x] Crear carpeta `src/modules/`
- [x] Crear carpeta `src/common/filters/`
- [x] Crear carpeta `src/common/dto/`
- [x] Crear carpeta `src/common/guards/`
- [x] Crear carpeta `src/common/decorators/`
- [x] Crear carpeta `src/common/helpers/`
- [x] Crear carpeta `src/database/`

### Paso 2 — DTOs comunes
- [x] Crear `src/common/dto/response.dto.ts`
- [x] Crear `src/common/dto/paginated-response.dto.ts`
- [x] Crear `src/common/dto/pagination-query.dto.ts`

### Paso 3 — Decoradores
- [x] Crear `src/common/decorators/roles.decorator.ts`
- [x] Crear `src/common/decorators/current-user.decorator.ts`

### Paso 4 — Guards
- [x] Crear `src/common/guards/roles.guard.ts`

### Paso 5 — Helper de soft delete
- [x] Crear `src/common/helpers/soft-delete.helper.ts`

### Paso 6 — Filtro global de excepciones
- [x] Crear `src/common/filters/global-exception.filter.ts`

### Paso 7 — Módulo y servicio de Prisma
- [x] Crear `src/database/prisma.service.ts`
- [x] Crear `src/database/prisma.module.ts`

### Paso 8 — App Module y Main
- [x] Crear `src/app.module.ts`
- [x] Crear `src/app.controller.ts`
- [x] Crear `src/main.ts`

### Paso 9 — Tests unitarios de la capa común
- [x] Crear `src/common/filters/global-exception.filter.spec.ts`
- [x] Crear `src/common/guards/roles.guard.spec.ts`
- [x] Crear `src/common/helpers/soft-delete.helper.spec.ts`

### Paso 10 — Documentación de código
- [x] Crear `aidlc-docs/construction/udt-01/code/summary.md` — listado de archivos creados y su propósito
