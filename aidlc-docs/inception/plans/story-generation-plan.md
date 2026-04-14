# Plan de Generación de Historias de Usuario
## Sistema de Solicitud de Laboratorios (APP-DX)

**Instrucciones**: Responde las preguntas llenando la letra elegida después de la etiqueta `[Answer]:`.
Si eliges "X) Otro", describe tu respuesta en la misma línea.

---

## Pregunta 1 — Enfoque de organización de historias
¿Cómo deben organizarse las historias de usuario?

A) Por módulo/dominio: una sección por cada módulo (Auth, Pacientes, Órdenes, Resultados, Citas)
B) Por persona: una sección por cada rol (Admin, Operador, Laboratorio) con sus historias agrupadas
C) Por épica/funcionalidad: épicas de alto nivel con historias hijas (ej. Épica "Gestión de Pacientes" → historias)
D) Híbrido: épicas por dominio con indicación del rol que las ejecuta
X) Otro (describe después de [Answer]:)

[D]: 

---

## Pregunta 2 — Nivel de detalle de los criterios de aceptación
¿Qué tan detallados deben ser los criterios de aceptación por historia?

A) Básico: lista de bullets con condiciones (ej. "Dado que... cuando... entonces...")
B) Estándar: criterios en formato Given/When/Then (BDD) para cada escenario principal + escenarios de error
C) Mínimo: una o dos condiciones clave por historia, suficiente para guiar el desarrollo
X) Otro (describe después de [Answer]:)

[B]: 

---

## Pregunta 3 — Granularidad de las historias
¿Qué tamaño deben tener las historias individuales?

A) Finas (1 historia = 1 endpoint o acción): ej. "Crear paciente", "Listar pacientes" son historias separadas
B) Medias (1 historia = 1 flujo de usuario): ej. "Gestionar pacientes" cubre crear + listar + editar
C) Épicas con sub-historias: una historia principal por módulo con sub-historias desglosadas
X) Otro (describe después de [Answer]:)

[A]: 

---

## Checklist de Ejecución del Plan

### Parte 1 — Definición de Personas
- [x] Crear `aidlc-docs/inception/user-stories/personas.md`
  - [x] Persona: **Administrador del Sistema** — descripción, motivaciones, contexto, pain points
  - [x] Persona: **Operador de Recepción** — descripción, motivaciones, contexto, pain points
  - [x] Persona: **Técnico de Laboratorio** — descripción, motivaciones, contexto, pain points

### Parte 2 — Generación de Historias
- [x] Crear `aidlc-docs/inception/user-stories/stories.md`
- [x] Aplicar criterios INVEST a cada historia (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- [x] Incluir criterios de aceptación según formato elegido en Pregunta 2

#### Módulo de Autenticación
- [x] HU-AUTH-01: Registro de usuario
- [ ] HU-AUTH-02: Login y obtención de tokens
- [ ] HU-AUTH-03: Renovación de access token (refresh)
- [ ] HU-AUTH-04: Logout

#### Módulo de Pacientes
- [ ] HU-PAT-01: Registrar nuevo paciente
- [ ] HU-PAT-02: Consultar lista de pacientes con filtros y paginación
- [ ] HU-PAT-03: Consultar detalle de un paciente
- [ ] HU-PAT-04: Actualizar datos de un paciente
- [ ] HU-PAT-05: Eliminar (soft delete) un paciente

#### Módulo de Órdenes
- [ ] HU-ORD-01: Crear orden médica para un paciente
- [ ] HU-ORD-02: Consultar lista de órdenes con filtros y paginación
- [ ] HU-ORD-03: Consultar detalle de una orden (con datos del paciente)
- [ ] HU-ORD-04: Avanzar estado de una orden (flujo clínico)
- [ ] HU-ORD-05: Cancelar / rechazar una orden
- [ ] HU-ORD-06: Eliminar (soft delete) una orden

#### Módulo de Resultados
- [ ] HU-RES-01: Registrar resultado para un examen de una orden
- [ ] HU-RES-02: Consultar resultados de una orden
- [ ] HU-RES-03: Actualizar un resultado
- [ ] HU-RES-04: Eliminar (soft delete) un resultado

#### Módulo de Agendamiento
- [ ] HU-AGE-01: Crear cita para un paciente
- [ ] HU-AGE-02: Consultar lista de citas con filtros
- [ ] HU-AGE-03: Consultar detalle de una cita
- [ ] HU-AGE-04: Actualizar una cita
- [ ] HU-AGE-05: Eliminar (soft delete) una cita

#### Módulo de Usuarios / Roles (Admin)
- [ ] HU-USR-01: Crear usuario con rol
- [ ] HU-USR-02: Listar usuarios
- [ ] HU-USR-03: Actualizar datos / rol de usuario
- [ ] HU-USR-04: Desactivar usuario

### Parte 3 — Mapeo y Validación
- [x] Verificar que cada historia tiene persona asignada
- [x] Verificar que todas las funcionalidades del `requirements.md` están cubiertas por al menos una historia
- [x] Verificar cumplimiento de criterios INVEST
