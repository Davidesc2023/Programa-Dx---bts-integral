# Componentes Lógicos — UDT-01: Application Layer

---

## Mapa de Componentes

```
src/
├── main.ts                          [Bootstrap Component]
├── app.module.ts                    [Root Module]
├── database/
│   ├── prisma.module.ts             [Database Component]
│   └── prisma.service.ts
└── common/
    ├── filters/
    │   └── global-exception.filter.ts   [Exception Shield]
    ├── dto/
    │   ├── response.dto.ts              [Response Contract]
    │   ├── paginated-response.dto.ts    [Pagination Contract]
    │   └── pagination-query.dto.ts      [Query Contract]
    ├── guards/
    │   └── roles.guard.ts               [Authorization Component]
    ├── decorators/
    │   ├── roles.decorator.ts           [Metadata Component]
    │   └── current-user.decorator.ts    [Identity Extractor]
    └── helpers/
        └── soft-delete.helper.ts        [Soft Delete Component]
```

---

## Descripción de Componentes

### Bootstrap Component (`main.ts`)
- **Rol**: Punto de entrada de la aplicación
- **Responsabilidades**: Crear app NestJS, registrar Helmet, ValidationPipe global, iniciar servidor
- **Dependencias**: NestFactory, AppModule, Helmet, ValidationPipe

### Root Module (`app.module.ts`)
- **Rol**: Módulo raíz que orquesta todos los módulos de dominio
- **Responsabilidades**: Importar todos los módulos, registrar `GlobalExceptionFilter` como `APP_FILTER`
- **Dependencias**: Todos los módulos de dominio, PrismaModule, GlobalExceptionFilter

### Database Component (`PrismaModule` + `PrismaService`)
- **Rol**: Acceso global a la base de datos
- **Responsabilidades**: Conectar a PostgreSQL, exponer cliente Prisma inyectable
- **Alcance**: Global (`@Global()`) — disponible sin importación explícita

### Exception Shield (`GlobalExceptionFilter`)
- **Rol**: Captura y transforma todas las excepciones
- **Responsabilidades**: Clasificar errores, mapear errores Prisma, ocultar stack en producción
- **Registro**: `APP_FILTER` en `AppModule`

### Response Contracts (`ResponseDto`, `PaginatedResponseDto`)
- **Rol**: Garantizar consistencia del formato de respuesta
- **Usados por**: Todos los controladores de dominio

### Query Contract (`PaginationQueryDto`)
- **Rol**: Schema estándar de paginación reutilizable
- **Extendido por**: DTOs de query de cada módulo de dominio

### Authorization Component (`RolesGuard`)
- **Rol**: Verificar que el usuario tiene el rol requerido
- **Exportado por**: `AuthModule` (junto con `JwtAuthGuard`)

### Metadata Component (`@Roles()`)
- **Rol**: Declarar roles permitidos en handlers de controladores

### Identity Extractor (`@CurrentUser()`)
- **Rol**: Extraer el usuario autenticado del contexto HTTP
- **Retorna**: Objeto `ICurrentUser` con `userId`, `email`, `role`

### Soft Delete Component (`softDelete()`)
- **Rol**: Implementar eliminación lógica uniforme
- **Tipo**: Función pura (no NestJS injectable)
- **Usada por**: Servicios de dominio que implementen soft delete
