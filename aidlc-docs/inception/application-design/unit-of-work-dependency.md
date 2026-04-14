# Dependencias entre Unidades de Trabajo
## Sistema de Solicitud de Laboratorios (APP-DX)

---

## Matriz de Dependencias

| UDT | UDT-01 | UDT-02 | UDT-03 | UDT-04 | UDT-05 | UDT-06 | UDT-07 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **UDT-01** Application Layer | — | requerida por | requerida por | requerida por | requerida por | requerida por | requerida por |
| **UDT-02** Users + Auth | depende de | — | requerida por | requerida por | requerida por | requerida por | requerida por |
| **UDT-03** Patients | depende de | depende de | — | requerida por | — | requerida por | requerida por |
| **UDT-04** Orders | depende de | depende de | depende de | — | requerida por | requerida por | requerida por |
| **UDT-05** Results | depende de | depende de | — | depende de | — | — | requerida por |
| **UDT-06** Appointments | depende de | depende de | depende de | depende de | — | — | requerida por |
| **UDT-07** Docker + Testing | depende de | depende de | depende de | depende de | depende de | depende de | — |

---

## Orden de Implementación

```
UDT-01 (Application Layer)
    │
    ▼
UDT-02 (Users + Auth)
    │
    ▼
UDT-03 (Patients)
    │
    ▼
UDT-04 (Orders)
    │
    ├──────────────────┐
    ▼                  ▼
UDT-05 (Results)   UDT-06 (Appointments)
    │                  │
    └──────┬───────────┘
           ▼
    UDT-07 (Docker + Testing)
```

> UDT-05 y UDT-06 pueden implementarse en paralelo una vez que UDT-04 esté completo.

---

## Justificación de Dependencias

| Dependencia | Razón |
|---|---|
| UDT-02 → UDT-01 | `UsersModule` y `AuthModule` usan `PrismaService`, `ResponseDto`, `PaginatedResponseDto`, `GlobalExceptionFilter` y `ValidationPipe` definidos en UDT-01 |
| UDT-03 → UDT-01 | `PatientsModule` usa `PrismaService`, DTOs comunes y filtro de excepciones |
| UDT-03 → UDT-02 | `PatientsController` aplica `JwtAuthGuard` + `RolesGuard` exportados por `AuthModule` |
| UDT-04 → UDT-03 | `OrdersService.create()` llama `PatientsService.assertExists(patientId)` para validar existencia del paciente antes de crear la orden |
| UDT-05 → UDT-04 | `ResultsService.create()` valida que la orden exista y esté en estado válido (`OrdersService.findOne()`) |
| UDT-06 → UDT-03 | `AppointmentsService.create()` valida que el paciente exista (`PatientsService.assertExists()`) |
| UDT-06 → UDT-04 | `AppointmentsService` opcionalmente vincula una cita a una orden existente (`OrdersService.findOne()`) |
| UDT-07 → todos | Tests de integración requieren todos los módulos cargados; Docker despliega todo el sistema |

---

## Restricciones de Construcción

| Restricción | Descripción |
|---|---|
| **No circular** | Ninguna dependencia es circular. El grafo es un DAG (dirigido acíclico). |
| **UDT-01 no depende de dominio** | `common/` y `database/` no importan ningún módulo de `modules/` |
| **UDT-07 al final** | Los tests de integración requieren que todos los módulos y migraciones estén completos |
| **UDT-05 y UDT-06 son independientes entre sí** | Pueden desarrollarse en cualquier orden una vez que UDT-04 está listo |
