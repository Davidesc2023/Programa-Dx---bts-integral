# Unit Test Instructions — APP-DX

## Backend (NestJS — Jest)

### Ejecutar todos los tests

```bash
# Via Docker (test stage del Dockerfile)
docker build --target test -t app-dx-test .
docker run --rm app-dx-test

# O dentro del contenedor api en ejecucion
docker exec lab_api npm test
```

### Resultado esperado

```
Test Suites: 13 passed, 13 total
Tests:       96 passed, 96 total
Snapshots:   0 total
Time:        ~8s
```

### Cobertura de suites

| Suite | Tests | Modulo |
|-------|-------|--------|
| app.controller.spec | 1 | AppController |
| users.service.spec | ~10 | UsersModule |
| auth.service.spec | ~8 | AuthModule |
| patients.service.spec | ~10 | PatientsModule |
| orders.service.spec | ~15 | OrdersModule (incl. state machine v5) |
| results.service.spec | ~8 | ResultsModule |
| appointments.service.spec | ~8 | AppointmentsModule |
| consents.service.spec | 11 | ConsentsModule |
| notifications.service.spec | 6 | NotificationsModule |
| attachments.service.spec | 10 | AttachmentsModule |
| order-tests.service.spec | 7 | OrderTestsModule |
| prisma.service.spec | ~2 | PrismaService |
| **Total** | **96** | |

---

## Frontend (Next.js — Sin suite de tests configurada en v7)

El Increment v7 no incluye tests unitarios de frontend (fuera de scope del MVP).

**Verificacion manual de tipos**:
```bash
$frontendPath = "<ruta>/frontend"
docker run --rm -v "${frontendPath}:/app" -w /app node:20-alpine sh -c "npm install --legacy-peer-deps && npx tsc --noEmit"
```

Resultado esperado: **0 errores TypeScript**

---

## Tests de Humo (Smoke Tests) — Manual

| Pantalla | Accion | Resultado esperado |
|----------|--------|-------------------|
| /login | Ingresar credenciales validas | Redirige a /dashboard |
| /dashboard | Cargar | Muestra metricas; spinner si API offline |
| /patients | Cargar | Lista paginada de pacientes |
| /patients/new | Crear paciente | Toast exito; redirige a lista |
| /orders | Cargar | Lista de ordenes con status badge |
| /orders/new | Crear orden | Toast exito; orden con status SOLICITADA |
| /orders/:id | Ver detalle | ConsentPanel visible |
| /consents | Cargar | Lista de ordenes con estado de consentimiento |
| /results | Cargar | Lista de resultados |
| /results/new | Crear resultado | Formulario; toast exito |
| /appointments | Cargar | Lista de citas con dropdown de transicion |
| /appointments/new | Crear cita | Formulario con datetime picker |
