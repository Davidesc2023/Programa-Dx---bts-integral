# Plan de Ejecución
## Sistema de Solicitud de Laboratorios (APP-DX)

---

## Resumen del Análisis

### Solicitud del usuario
Construir las Fases 2–5 de una plataforma backend NestJS/PostgreSQL/Prisma para gestión de solicitudes de laboratorio, sobre una Foundation (Fase 1) ya completada.

### Evaluación de impacto

| Área | ¿Aplica? | Descripción |
|---|---|---|
| Cambios visibles para el usuario | Sí | Nueva API REST con 28 endpoints distribuidos en 6 módulos |
| Cambios estructurales | Sí | Nuevos módulos (auth, users, results, appointments) + ampliación de existentes |
| Cambios en modelo de datos | Sí | Nuevas tablas: User, RefreshToken, Result, Appointment; campos nuevos en Patient, Order |
| Cambios en API | Sí | Todos los endpoints nuevos; existentes con envelope de respuesta, paginación y soft delete |
| Impacto NFR | Sí | Seguridad JWT/bcrypt, roles/guards, TLS, Helmet, validación estricta (extensión SECURITY activa) |

### Evaluación de riesgo

| Factor | Valor |
|---|---|
| **Nivel de riesgo** | Medio-Alto |
| **Complejidad de rollback** | Moderada (migraciones Prisma incrementales) |
| **Complejidad de testing** | Compleja (unit + integración por módulo) |
| **Razón del riesgo** | Flujo de estado clínico con transiciones validadas + auth JWT + matriz de roles granulares |

---

## Visualización del Workflow

```
INCEPTION PHASE
+-------------------------------------------------------+
|  [OK] Workspace Detection       COMPLETADA            |
|  [--] Reverse Engineering       OMITIDA (Greenfield)  |
|  [OK] Requirements Analysis     COMPLETADA            |
|  [OK] User Stories              COMPLETADA            |
|  [OK] Workflow Planning         COMPLETADA            |
|  [>>] Application Design        EJECUTAR              |
|  [>>] Units Generation          EJECUTAR              |
+-------------------------------------------------------+
          |
          v
CONSTRUCTION PHASE (por unidad de trabajo)
+-------------------------------------------------------+
|  [>>] Functional Design         EJECUTAR (por unidad) |
|  [>>] NFR Requirements          EJECUTAR (por unidad) |
|  [>>] NFR Design                EJECUTAR (por unidad) |
|  [>>] Infrastructure Design     EJECUTAR (una vez)    |
|  [>>] Code Generation           EJECUTAR (por unidad) |
|  [>>] Build and Test            EJECUTAR (al final)   |
+-------------------------------------------------------+
          |
          v
OPERATIONS PHASE
+-------------------------------------------------------+
|  [  ] Operations                PLACEHOLDER (futuro)  |
+-------------------------------------------------------+
```

---

## Etapas a Ejecutar

### FASE INCEPTION

#### Application Design — EJECUTAR
**Razón**: Se necesitan definir 4 módulos completamente nuevos (auth, users, results, appointments), los métodos de sus servicios, las interfaces de los controladores y las dependencias entre módulos. Sin este diseño, la generación de código carecería de una guía estructural clara.

#### Units Generation — EJECUTAR
**Razón**: El sistema tiene 8 módulos con dependencias entre ellos (ej. auth depende de Users, Orders depende de Patients, Results depende de Orders). Definir las unidades de trabajo y su orden de construcción es crítico para una generación de código organizada.

---

### FASE CONSTRUCTION (por unidad de trabajo)

#### Functional Design — EJECUTAR (por unidad)
**Razón**: Cada módulo tiene lógica de negocio específica que requiere diseño detallado antes de generar código: flujo de transición de estado en órdenes, lógica de validación de refresh tokens, soft delete con filtros automáticos, inyección de `createdBy/updatedBy`.

#### NFR Requirements — EJECUTAR (por unidad)
**Razón**: La extensión de seguridad está activa. Cada módulo debe evaluar requisitos de seguridad, rendimiento y escalabilidad: bcrypt, JWT guards, validación de DTOs, manejo de errores centralizado.

#### NFR Design — EJECUTAR (por unidad)
**Razón**: Con seguridad como restricción bloqueante, cada módulo necesita diseño explícito de: hash de contraseñas, firmado de tokens, guards por rol, validación de entrada, filtros de excepciones.

#### Infrastructure Design — EJECUTAR (una vez, Fase 5)
**Razón**: Docker Compose con PostgreSQL + NestJS, variables de entorno, scripts de migración Prisma al inicio del contenedor.

#### Code Generation — EJECUTAR (siempre)

#### Build and Test — EJECUTAR (siempre)

---

## Etapas Omitidas

| Etapa | Razón |
|---|---|
| Reverse Engineering | Proyecto Greenfield — no hay código existente que analizar |
| Operations | Placeholder — fuera del alcance de esta sesión |

---

## Unidades de Trabajo (preliminar)

Las unidades se definirán en detalle en la etapa de Units Generation. Orden tentativo basado en dependencias:

| # | Unidad | Depende de |
|---|---|---|
| 1 | Application Layer (response DTOs, error handling, paginación) | Foundation |
| 2 | Users + Auth (registro, login, JWT, refresh, roles) | Application Layer |
| 3 | Patients (ampliar con soft delete, auditoría, paginación, guards) | Auth |
| 4 | Orders (ampliar con flujo clínico, guards, paginación) | Patients |
| 5 | Results (nuevo módulo — CRUD básico) | Orders |
| 6 | Appointments (nuevo módulo — CRUD básico) | Patients |
| 7 | Docker Compose + Testing | Todos |

---

## Criterios de Éxito

| Criterio | Métrica |
|---|---|
| Funcionalidad completa | 28 historias de usuario cubiertas con endpoints funcionales |
| Seguridad | Extensión SECURITY sin hallazgos bloqueantes |
| Calidad | Tests unitarios para todos los servicios; tests de integración para flujos principales |
| Despliegue local | `docker-compose up` levanta la app completamente funcional |
| Trazabilidad | `createdBy/updatedBy` en todas las entidades; soft delete activo |
