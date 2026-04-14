# v6 — Preguntas de Clarificación: Cobertura de Tests

## Contexto
- **Motivo del incremento**: Los módulos v2-v5 (consents, notifications, attachments, order-tests) no tienen specs. El test de transición en `orders.service.spec.ts` está desactualizado (PENDIENTE→MUESTRA_RECOLECTADA ya no es válida). Jest no está disponible en el contenedor de runtime (omit-dev). Se necesita estrategia de ejecución.

---

## Pregunta 1 — Estrategia de ejecución de tests

**¿Cómo deben ejecutarse los tests?**

A) Agregar un stage `test` en el Dockerfile (usa el builder con devDeps) — `docker build --target test -t app-dx-test . && docker run --rm app-dx-test npm test`
B) Agregar un perfil `test` en docker-compose.yml con un servicio separado que use las devDependencies
C) Modificar el Dockerfile para que el stage runner incluya las devDependencies solo en entornos de test (usando ARG)

[Answer]: A

---

## Pregunta 2 — Alcance de los specs nuevos

**¿Qué módulos deben tener specs implementados en v6?**

A) Solo módulos v2-v5: consents.service, notifications.service, attachments.service, order-tests.service
B) Todo lo anterior + actualizar orders.service.spec.ts para reflejar cambios de v5 (SCHEDULED)
C) B + también los specs existentes que están vacíos o incompletos

[Answer]: B

---

## Pregunta 3 — Nivel de cobertura en specs nuevos

**¿Qué nivel de cobertura se espera en cada spec nuevo?**

A) Happy path + errores principales (NotFoundException, ConflictException, UnprocessableEntityException, ForbiddenException)
B) Solo happy path — verificar que el flujo correcto funciona
C) Cobertura exhaustiva — todos los branches, incluyendo edge cases de validación de mimeType, tamaño de archivo, etc.

[Answer]: A

---

## Pregunta 4 — Reporte de cobertura

**¿Se genera reporte de cobertura (lcov/html) como parte del build?**

A) Sí — ejecutar `npm run test:cov` y verificar % de cobertura
B) No — solo ejecutar `npm test` y verificar que pasan todos los tests

[Answer]: B
