# NFR Requirements — UDT-01: Application Layer

---

## Tech Stack Decisions

| Componente | Tecnología | Versión | Justificación |
|---|---|---|---|
| Framework backend | NestJS | ^10.x | Monolito modular — elegido en requerimientos |
| Lenguaje | TypeScript | ^5.x | Tipado estático para DTOs y contratos |
| ORM | Prisma | ^5.x | Migraciones, type-safety, conexión a PostgreSQL |
| Base de datos | PostgreSQL | ^15 | Relacional robusta — elegida en requerimientos |
| Validación | class-validator + class-transformer | latest | Integración nativa con NestJS ValidationPipe |
| Seguridad HTTP | Helmet | ^7.x | Middleware estándar para NestJS |
| Runtime | Node.js | ^20 LTS | Estabilidad y soporte LTS |

---

## Requisitos No Funcionales para esta Unidad

### RNF-SEG-01: Protección de Headers HTTP
- **Requisito**: Helmet activo en todos los ambientes (dev, staging, prod)
- **Implementación**: `app.use(helmet())` en `main.ts` antes de `app.listen()`
- **Cobertura**: Headers `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-XSS-Protection`

### RNF-SEG-02: Validación Estricta de Entrada
- **Requisito**: Rechazar cualquier payload con campos no declarados en el DTO
- **Implementación**: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
- **Impacto**: Protección contra mass assignment y inyección de campos inesperados

### RNF-SEG-03: Sin Stack Traces en Producción
- **Requisito**: Las respuestas de error en `NODE_ENV=production` no deben exponer stack traces
- **Implementación**: Condicional en `GlobalExceptionFilter` basado en `process.env.NODE_ENV`

### RNF-SEG-04: Variables de Entorno Obligatorias
- **Requisito**: `DATABASE_URL` debe estar presente. Si falta, la app no arranca
- **Implementación**: PrismaClient lanza error de conexión al inicio; validar con `ConfigModule` si se agrega en el futuro

### RNF-PERF-01: Límite de Paginación
- **Requisito**: Máximo 100 registros por request de listado
- **Implementación**: `@Max(100)` en `PaginationQueryDto.limit`
- **Objetivo**: Prevenir consultas masivas que saturan conexiones de base de datos

### RNF-MANT-01: Mensajes de Error Consistentes
- **Requisito**: Todos los mensajes de validación en español
- **Implementación**: Mensajes personalizados en cada decorador class-validator de todos los DTOs del proyecto

### RNF-MANT-02: Un solo punto de manejo de errores
- **Requisito**: Solo `GlobalExceptionFilter` puede transformar excepciones en respuestas HTTP de error
- **Implementación**: Registrado como `APP_FILTER` en `AppModule`
- **Prohibición**: Los controladores no deben tener bloques try/catch para manejo de errores HTTP

### RNF-OPS-01: Health Check (básico)
- **Requisito**: La app debe tener un endpoint `/health` que retorne `{ status: 'ok' }` para verificación de Docker
- **Implementación**: Endpoint simple en `AppController`
