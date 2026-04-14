# Plan de Functional Design — UDT-01: Application Layer

## Contexto de la Unidad

**Descripción**: Infraestructura técnica transversal. No tiene historias de usuario directas. Provee los bloques base que todos los demás módulos usarán: envelope de respuesta, filtro global de excepciones, paginación, Prisma, guards y decoradores comunes.

**Archivos que producirá**:
- `src/main.ts`
- `src/app.module.ts`
- `src/database/prisma.module.ts` + `prisma.service.ts`
- `src/common/filters/global-exception.filter.ts`
- `src/common/dto/response.dto.ts`, `paginated-response.dto.ts`, `pagination-query.dto.ts`
- `src/common/guards/roles.guard.ts`
- `src/common/decorators/roles.decorator.ts`, `current-user.decorator.ts`
- `src/common/helpers/soft-delete.helper.ts`

---

## Preguntas de Diseño Funcional

### Q1 — Paginación: valores por defecto y límites

¿Qué valores debe tener `PaginationQueryDto`?

**Opción A**: `page` default=1, `limit` default=10, máximo limit: 100
**Opción B**: `page` default=1, `limit` default=20, máximo limit: 100
**Opción C**: `page` default=1, `limit` default=10, sin máximo explícito

[A]:

---

### Q2 — Mensajes de error: idioma

Los mensajes de error del `GlobalExceptionFilter` y las validaciones de DTOs (class-validator), ¿en qué idioma deben estar?

**Opción A**: Español (consistente con el resto del sistema)
**Opción B**: Inglés (convención técnica de NestJS/class-validator)

[A]:

---

### Q3 — SoftDeleteHelper: implementación

¿Cómo debe implementarse el helper de soft delete?

**Opción A**: Función utilitaria pura (no injectable) — `softDelete(prisma, model, id): Promise<void>` que setea `deletedAt = new Date()`
**Opción B**: Servicio NestJS injectable (`@Injectable()`) para poder ser mockeado en tests

[A]:

---

## Pasos de Ejecución

- [ ] Responder las preguntas anteriores
- [ ] Generar `business-logic-model.md`
- [ ] Generar `business-rules.md`
- [ ] Generar `domain-entities.md`
