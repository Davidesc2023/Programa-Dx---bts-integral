# Integration Test Instructions — APP-DX

## Prerequisitos

- `docker compose up -d` (lab_api + lab_db en ejecucion)
- Frontend corriendo en :3001 (dev server)
- Usuario ADMIN creado via seed: `docker exec lab_api npx prisma db seed`

---

## Flujo 1: Auth

```
POST /auth/login
Body: { email: "admin@bts.com", password: "Password123!" }
Expect: 200 + { accessToken: "..." }
```

Usar el token en el header `Authorization: Bearer <token>` para todos los siguientes.

---

## Flujo 2: Ciclo completo de Paciente + Orden

```
# 1. Crear paciente
POST /patients
Body: { name, documentId, dateOfBirth, phone, email }

# 2. Crear orden
POST /orders
Body: { patientId, doctorId?, notes? }
Expect: { status: "SOLICITADA" }

# 3. Agregar tests a la orden
POST /orders/:id/tests
Body: { testName, testCode }

# 4. Transicionar orden
PATCH /orders/:id/status
Body: { status: "PROGRAMADA" }
```

---

## Flujo 3: Consentimiento

```
# 1. Crear consentimiento para orden
POST /orders/:id/consent

# 2. Firmar (MEDICO)
PATCH /orders/:id/consent/sign
Body: { notes: "Aprobado" }

# 3. Enviar al paciente
PATCH /orders/:id/consent/send

# 4. Respuesta del paciente
PATCH /orders/:id/consent/respond
Body: { response: "ACEPTADO" }

Expect: ConsentStatus = "ACEPTADO"
```

---

## Flujo 4: Resultados + Adjuntos

```
# 1. Crear resultado
POST /results
Body: { orderId, examType, value, unit?, referenceRange?, notes? }

# 2. Subir adjunto (PDF)
POST /results/:id/attachments
Content-Type: multipart/form-data
file: <archivo.pdf>

# 3. Listar adjuntos
GET /results/:id/attachments

# 4. Descargar adjunto
GET /results/:id/attachments/:attachId/download
Expect: Content-Type: application/pdf

# 5. Eliminar adjunto
DELETE /results/:id/attachments/:attachId
```

---

## Flujo 5: Citas

```
# 1. Crear cita
POST /appointments
Body: { patientId, orderId?, scheduledAt: "2026-05-01T10:00:00Z", notes? }
Expect: { status: "PROGRAMADA" }

# 2. Transigionar a CONFIRMADA
PATCH /appointments/:id/status
Body: { status: "CONFIRMADA" }

# 3. Completar
PATCH /appointments/:id/status
Body: { status: "COMPLETADA" }
```

---

## Verificacion Frontend + Backend

| Flujo | Frontend | Backend | Integrado |
|-------|----------|---------|-----------|
| Login | /login form | POST /auth/login | OK |
| Crear paciente | /patients/new | POST /patients | OK |
| Crear orden | /orders/new | POST /orders | OK |
| Consentimiento | OrderDetail > ConsentPanel | /orders/:id/consent/* | OK |
| Subir adjunto | ResultDetail > AttachmentsPanel | POST /results/:id/attachments | OK |
| Cita | /appointments/new | POST /appointments | OK |
