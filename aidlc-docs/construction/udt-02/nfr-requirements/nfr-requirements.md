# Requisitos No Funcionales — UDT-02: Users + Auth

## Seguridad (máxima prioridad — extensión habilitada)

| ID | Requisito | Métrica |
|---|---|---|
| SEC-001 | Las contraseñas se hashean con bcrypt, cost factor = 10 | 100% de passwords en DB son hash bcrypt |
| SEC-002 | Los tokens JWT se firman con secretos únicos por tipo (access vs refresh) | Dos variables JWT_SECRET y JWT_REFRESH_SECRET |
| SEC-003 | El access token expira en 15 minutos | Configurado vía JWT_EXPIRES_IN |
| SEC-004 | El refresh token expira en 7 días y se invalida explícitamente en logout | expiresAt verificado en cada uso |
| SEC-005 | Los mensajes de error de autenticación no revelan información (email inexistente vs password erróneo) | Error genérico "Credenciales inválidas" |
| SEC-006 | La ruta de registro requiere autenticación ADMIN | JwtAuthGuard + RolesGuard en POST /auth/register |
| SEC-007 | La estrategia JWT verifica existencia del usuario en DB en cada request | Llamada a prisma.user.findFirst en JwtStrategy.validate() |
| SEC-008 | Stack traces no se exponen en producción (heredado de UDT-01) | GlobalExceptionFilter ya implementado |

## Rendimiento

| ID | Requisito | Métrica |
|---|---|---|
| PERF-001 | Tiempo de hashing bcrypt aceptable | ~100ms en hardware de servidor estándar con cost=10 |
| PERF-002 | Consultas de autenticación optimizadas con índices | email UNIQUE en tabla User |
| PERF-003 | Paginación en listado de usuarios limita resultados a max 100 | Heredado de PaginationQueryDto |

## Disponibilidad y Confiabilidad

| ID | Requisito | Métrica |
|---|---|---|
| REL-001 | El logout es idempotente | Sin error al intentar logout con token ya invalidado |
| REL-002 | Tokens con usuario eliminado son rechazados | Verificación en JwtStrategy.validate() |

## Mantenibilidad

| ID | Requisito | Métrica |
|---|---|---|
| MANT-001 | Configuración de JWT en variables de entorno, no hardcodeada | .env.example documenta todas las variables |
| MANT-002 | Cobertura de tests en auth.service y users.service | Mínimo 3 casos de prueba por servicio |

## Stack Tecnológico (decisiones)

| Componente | Decisión | Justificación |
|---|---|---|
| Auth strategy | Passport.js + passport-jwt | Estándar de facto en NestJS, integración nativa |
| JWT library | @nestjs/jwt (jsonwebtoken) | Wrapper NestJS oficial |
| Password hashing | bcrypt, cost=10 | Balance aceptado entre seguridad y rendimiento |
| Refresh token storage | PostgreSQL (tabla RefreshToken) | Permite invalidación explícita; requerimiento del sistema |
