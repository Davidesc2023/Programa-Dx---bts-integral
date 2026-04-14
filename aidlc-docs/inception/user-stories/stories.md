# Historias de Usuario — Sistema de Solicitud de Laboratorios

**Formato**: Épicas por dominio · Historias finas (1 acción) · Criterios BDD (Given/When/Then)  
**Roles**: ADMIN · OPERADOR · LABORATORIO

---

## Épica 1: Autenticación y Sesión

---

### HU-AUTH-01 — Registro de usuario
**Rol**: ADMIN  
**Historia**: Como administrador, quiero registrar nuevos usuarios en el sistema con su rol asignado, para que el equipo pueda acceder con los permisos correctos.

**Criterios de Aceptación**:

*Escenario 1 — Registro exitoso*
- **Dado** que soy un ADMIN autenticado
- **Cuando** envío `POST /auth/register` con email, contraseña y rol válidos
- **Entonces** el sistema crea el usuario, almacena la contraseña con hash bcrypt y retorna HTTP 201 con los datos del usuario (sin contraseña)

*Escenario 2 — Email duplicado*
- **Dado** que ya existe un usuario con el mismo email
- **Cuando** intento registrar otro usuario con ese mismo email
- **Entonces** el sistema retorna HTTP 409 con mensaje "El correo ya está registrado"

*Escenario 3 — Rol inválido*
- **Dado** que envío un rol que no existe (ej. "SUPERADMIN")
- **Cuando** el servidor procesa la solicitud
- **Entonces** retorna HTTP 400 con detalle del campo inválido

*Escenario 4 — Contraseña débil*
- **Dado** que envío una contraseña con menos de 8 caracteres
- **Cuando** el servidor procesa la solicitud
- **Entonces** retorna HTTP 400 indicando que la contraseña no cumple requisitos mínimos

---

### HU-AUTH-02 — Login
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como usuario registrado, quiero iniciar sesión con mi correo y contraseña, para obtener un token de acceso y poder usar el sistema.

**Criterios de Aceptación**:

*Escenario 1 — Login exitoso*
- **Dado** que soy un usuario registrado y activo
- **Cuando** envío `POST /auth/login` con credenciales correctas
- **Entonces** el sistema retorna HTTP 200 con `accessToken` (expira en 15 min) y `refreshToken` (expira en 7 días)

*Escenario 2 — Contraseña incorrecta*
- **Dado** que envío una contraseña incorrecta
- **Cuando** el servidor valida las credenciales
- **Entonces** retorna HTTP 401 con mensaje "Credenciales inválidas" (sin indicar cuál campo es incorrecto)

*Escenario 3 — Usuario no existe*
- **Dado** que el email no corresponde a ningún usuario
- **Cuando** envío las credenciales
- **Entonces** retorna HTTP 401 con mensaje "Credenciales inválidas"

---

### HU-AUTH-03 — Renovación de token (refresh)
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como usuario autenticado, quiero renovar mi access token usando el refresh token, para continuar usando el sistema sin tener que hacer login nuevamente.

**Criterios de Aceptación**:

*Escenario 1 — Refresh exitoso*
- **Dado** que tengo un refresh token válido y no expirado
- **Cuando** envío `POST /auth/refresh` con el refresh token
- **Entonces** el sistema retorna HTTP 200 con un nuevo `accessToken`

*Escenario 2 — Refresh token expirado*
- **Dado** que mi refresh token ha expirado (más de 7 días)
- **Cuando** intento renovar el access token
- **Entonces** el sistema retorna HTTP 401 y debo hacer login nuevamente

*Escenario 3 — Refresh token inválido o revocado*
- **Dado** que el refresh token fue invalidado por logout previo
- **Cuando** intento usarlo para renovar
- **Entonces** el sistema retorna HTTP 401 con mensaje "Token inválido"

---

### HU-AUTH-04 — Logout
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como usuario autenticado, quiero cerrar sesión, para que mi refresh token quede invalidado y nadie más pueda usarlo.

**Criterios de Aceptación**:

*Escenario 1 — Logout exitoso*
- **Dado** que estoy autenticado y envío `POST /auth/logout` con mi refresh token
- **Cuando** el servidor procesa la solicitud
- **Entonces** el refresh token queda invalidado en la base de datos y retorna HTTP 200

*Escenario 2 — Token ya inválido*
- **Dado** que el token ya fue previamente invalidado
- **Cuando** intento hacer logout de nuevo
- **Entonces** el servidor retorna HTTP 200 (operación idempotente, sin exponer estado interno)

---

## Épica 2: Gestión de Usuarios

---

### HU-USR-01 — Crear usuario
**Rol**: ADMIN  
**Historia**: Como administrador, quiero crear usuarios adicionales con su rol, para ampliar el equipo sin necesidad de usar el endpoint de registro público.

**Criterios de Aceptación**:

*Escenario 1 — Creación exitosa*
- **Dado** que soy ADMIN autenticado
- **Cuando** envío `POST /users` con email, contraseña y rol válidos
- **Entonces** retorna HTTP 201 con el usuario creado (sin contraseña)

*Escenario 2 — Sin autorización*
- **Dado** que soy OPERADOR o LABORATORIO
- **Cuando** intento acceder a `POST /users`
- **Entonces** retorna HTTP 403 con mensaje "No tienes permisos para esta acción"

---

### HU-USR-02 — Listar usuarios
**Rol**: ADMIN  
**Historia**: Como administrador, quiero ver la lista de todos los usuarios registrados, para tener visibilidad completa del equipo con acceso al sistema.

**Criterios de Aceptación**:

*Escenario 1 — Listado exitoso*
- **Dado** que soy ADMIN autenticado
- **Cuando** envío `GET /users?page=1&limit=10`
- **Entonces** retorna HTTP 200 con array de usuarios paginado y metadata (`total`, `page`, `totalPages`)

*Escenario 2 — Sin autorización*
- **Dado** que soy OPERADOR o LABORATORIO
- **Cuando** intento acceder a `GET /users`
- **Entonces** retorna HTTP 403

---

### HU-USR-03 — Actualizar rol de usuario
**Rol**: ADMIN  
**Historia**: Como administrador, quiero actualizar el rol de un usuario existente, para ajustar sus permisos cuando cambie de función.

**Criterios de Aceptación**:

*Escenario 1 — Actualización exitosa*
- **Dado** que soy ADMIN y el usuario existe
- **Cuando** envío `PATCH /users/:id` con el nuevo rol
- **Entonces** retorna HTTP 200 con los datos actualizados del usuario

*Escenario 2 — Usuario no encontrado*
- **Dado** que el ID no corresponde a ningún usuario activo
- **Cuando** envío la solicitud de actualización
- **Entonces** retorna HTTP 404 con mensaje "Usuario no encontrado"

---

### HU-USR-04 — Desactivar usuario (soft delete)
**Rol**: ADMIN  
**Historia**: Como administrador, quiero desactivar un usuario, para que no pueda acceder al sistema sin eliminar su historial.

**Criterios de Aceptación**:

*Escenario 1 — Desactivación exitosa*
- **Dado** que soy ADMIN y el usuario está activo
- **Cuando** envío `DELETE /users/:id`
- **Entonces** el campo `deletedAt` se registra con la fecha actual y retorna HTTP 200

*Escenario 2 — Usuario intenta hacer login después de desactivación*
- **Dado** que el usuario fue desactivado
- **Cuando** intenta hacer login
- **Entonces** retorna HTTP 401 con mensaje "Credenciales inválidas" (sin revelar el estado)

---

## Épica 3: Gestión de Pacientes

---

### HU-PAT-01 — Registrar paciente
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero registrar un nuevo paciente con sus datos completos, para poder asociarle órdenes de laboratorio.

**Criterios de Aceptación**:

*Escenario 1 — Registro exitoso*
- **Dado** que soy OPERADOR o ADMIN autenticado
- **Cuando** envío `POST /patients` con todos los campos requeridos válidos
- **Entonces** el sistema crea el paciente con `createdBy` = mi ID y retorna HTTP 201

*Escenario 2 — Documento duplicado*
- **Dado** que ya existe un paciente con el mismo tipo y número de documento
- **Cuando** intento registrar otro paciente con los mismos datos
- **Entonces** retorna HTTP 409 con mensaje "Ya existe un paciente con este documento"

*Escenario 3 — Campos requeridos faltantes*
- **Dado** que omito el nombre o el número de documento
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 400 con indicación de qué campos son requeridos

*Escenario 4 — Sin autorización*
- **Dado** que soy LABORATORIO
- **Cuando** intento crear un paciente
- **Entonces** retorna HTTP 403

---

### HU-PAT-02 — Listar pacientes con filtros y paginación
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como operador, quiero buscar pacientes por nombre o documento con paginación, para encontrar rápidamente un paciente ya registrado.

**Criterios de Aceptación**:

*Escenario 1 — Listado exitoso sin filtros*
- **Dado** que soy usuario autenticado
- **Cuando** envío `GET /patients?page=1&limit=10`
- **Entonces** retorna HTTP 200 con lista paginada de pacientes activos (sin `deletedAt`)

*Escenario 2 — Filtro por nombre*
- **Dado** que envío `GET /patients?name=Juan`
- **Cuando** el servidor procesa la búsqueda
- **Entonces** retorna solo los pacientes cuyo nombre contiene "Juan" (búsqueda tipo ILIKE)

*Escenario 3 — Filtro por tipo y número de documento*
- **Dado** que envío `GET /patients?documentType=CC&documentNumber=12345678`
- **Cuando** el servidor procesa la búsqueda
- **Entonces** retorna el paciente que coincide exactamente

---

### HU-PAT-03 — Consultar detalle de paciente
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como usuario autenticado, quiero ver el detalle completo de un paciente, para verificar sus datos antes de crear una orden.

**Criterios de Aceptación**:

*Escenario 1 — Consulta exitosa*
- **Dado** que soy usuario autenticado y el paciente existe
- **Cuando** envío `GET /patients/:id`
- **Entonces** retorna HTTP 200 con todos los campos del paciente

*Escenario 2 — Paciente no encontrado*
- **Dado** que el ID no corresponde a un paciente activo
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 404 con mensaje "Paciente no encontrado"

---

### HU-PAT-04 — Actualizar datos de paciente
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero actualizar los datos de un paciente registrado, para corregir errores o actualizar información de contacto.

**Criterios de Aceptación**:

*Escenario 1 — Actualización exitosa*
- **Dado** que soy ADMIN o OPERADOR y el paciente existe
- **Cuando** envío `PATCH /patients/:id` con los campos a modificar
- **Entonces** retorna HTTP 200 con los datos actualizados y `updatedBy` = mi ID

*Escenario 2 — Número de documento duplicado tras edición*
- **Dado** que el nuevo número de documento ya lo tiene otro paciente
- **Cuando** envío la solicitud de actualización
- **Entonces** retorna HTTP 409 con mensaje de duplicado

---

### HU-PAT-05 — Eliminar paciente (soft delete)
**Rol**: ADMIN  
**Historia**: Como administrador, quiero eliminar (de forma lógica) un paciente del sistema, para que no aparezca en los listados pero su historial quede preservado.

**Criterios de Aceptación**:

*Escenario 1 — Eliminación exitosa*
- **Dado** que soy ADMIN y el paciente existe
- **Cuando** envío `DELETE /patients/:id`
- **Entonces** se registra `deletedAt` con timestamp actual y retorna HTTP 200

*Escenario 2 — Paciente ya eliminado*
- **Dado** que el paciente ya tiene `deletedAt` registrado
- **Cuando** intento eliminarlo nuevamente
- **Entonces** retorna HTTP 404 con mensaje "Paciente no encontrado"

*Escenario 3 — Sin autorización*
- **Dado** que soy OPERADOR o LABORATORIO
- **Cuando** intento eliminar un paciente
- **Entonces** retorna HTTP 403

---

## Épica 4: Gestión de Órdenes Médicas

---

### HU-ORD-01 — Crear orden médica
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero crear una orden médica asociada a un paciente, para registrar los exámenes solicitados por el médico.

**Criterios de Aceptación**:

*Escenario 1 — Creación exitosa*
- **Dado** que soy ADMIN o OPERADOR autenticado y el paciente existe
- **Cuando** envío `POST /orders` con los datos válidos
- **Entonces** la orden se crea con estado inicial `PENDIENTE`, `createdBy` = mi ID, y retorna HTTP 201

*Escenario 2 — Paciente no existe*
- **Dado** que el `patientId` no corresponde a un paciente activo
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 404 con mensaje "Paciente no encontrado"

*Escenario 3 — Lista de exámenes vacía*
- **Dado** que envío una orden sin exámenes solicitados
- **Cuando** el servidor valida los datos
- **Entonces** retorna HTTP 400 indicando que la lista de exámenes es requerida

---

### HU-ORD-02 — Listar órdenes con filtros y paginación
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como técnico de laboratorio, quiero ver las órdenes pendientes de procesamiento con filtros por estado y fecha, para priorizar mi trabajo durante el turno.

**Criterios de Aceptación**:

*Escenario 1 — Listado exitoso*
- **Dado** que soy usuario autenticado
- **Cuando** envío `GET /orders?page=1&limit=10`
- **Entonces** retorna HTTP 200 con órdenes activas paginadas

*Escenario 2 — Filtro por estado*
- **Dado** que envío `GET /orders?status=PENDIENTE`
- **Cuando** el servidor filtra
- **Entonces** retorna solo las órdenes con estado `PENDIENTE`

*Escenario 3 — Filtro por rango de fechas*
- **Dado** que envío `GET /orders?dateFrom=2026-04-01&dateTo=2026-04-13`
- **Cuando** el servidor filtra
- **Entonces** retorna órdenes cuya fecha de orden está dentro del rango indicado

*Escenario 4 — Filtro por paciente*
- **Dado** que envío `GET /orders?patientId=uuid`
- **Cuando** el servidor filtra
- **Entonces** retorna solo las órdenes de ese paciente

---

### HU-ORD-03 — Consultar detalle de orden
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como técnico, quiero ver el detalle completo de una orden incluyendo los datos del paciente, para tener toda la información necesaria para el procesamiento.

**Criterios de Aceptación**:

*Escenario 1 — Consulta exitosa*
- **Dado** que soy usuario autenticado y la orden existe
- **Cuando** envío `GET /orders/:id`
- **Entonces** retorna HTTP 200 con el detalle completo de la orden y los datos del paciente relacionado

*Escenario 2 — Orden no encontrada*
- **Dado** que el ID no corresponde a una orden activa
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 404 con mensaje "Orden no encontrada"

---

### HU-ORD-04 — Avanzar estado de orden
**Rol**: ADMIN · LABORATORIO  
**Historia**: Como técnico, quiero actualizar el estado de una orden al siguiente paso del flujo clínico, para mantener la trazabilidad del proceso.

**Criterios de Aceptación**:

*Escenario 1 — Transición válida*
- **Dado** que soy LABORATORIO o ADMIN y la orden está en `PENDIENTE`
- **Cuando** envío `PATCH /orders/:id/status` con `status: MUESTRA_RECOLECTADA`
- **Entonces** el estado se actualiza, `updatedBy` = mi ID, retorna HTTP 200

*Escenario 2 — Transición inválida*
- **Dado** que la orden está en `PENDIENTE`
- **Cuando** intento cambiar directamente a `COMPLETADA` (saltando pasos)
- **Entonces** retorna HTTP 422 con mensaje "Transición de estado no permitida: PENDIENTE → COMPLETADA"

*Escenario 3 — Sin autorización*
- **Dado** que soy OPERADOR
- **Cuando** intento cambiar el estado de una orden
- **Entonces** retorna HTTP 403

---

### HU-ORD-05 — Cancelar o rechazar orden
**Rol**: ADMIN · LABORATORIO  
**Historia**: Como técnico o administrador, quiero cancelar o rechazar una orden, para registrar que el proceso no continuó y la razón.

**Criterios de Aceptación**:

*Escenario 1 — Cancelación exitosa*
- **Dado** que la orden está en un estado cancelable (`PENDIENTE` o `MUESTRA_RECOLECTADA`)
- **Cuando** envío `PATCH /orders/:id/status` con `status: CANCELADA`
- **Entonces** el estado cambia a `CANCELADA` y retorna HTTP 200

*Escenario 2 — Rechazo exitoso*
- **Dado** que la orden está en `EN_ANALISIS`
- **Cuando** envío `PATCH /orders/:id/status` con `status: RECHAZADA`
- **Entonces** el estado cambia a `RECHAZADA` y retorna HTTP 200

*Escenario 3 — Orden ya completada*
- **Dado** que la orden tiene estado `COMPLETADA`
- **Cuando** intento cancelarla
- **Entonces** retorna HTTP 422 con mensaje "No se puede cancelar una orden completada"

---

### HU-ORD-06 — Eliminar orden (soft delete)
**Rol**: ADMIN  
**Historia**: Como administrador, quiero eliminar lógicamente una orden, para depurar registros erróneos sin perder la trazabilidad.

**Criterios de Aceptación**:

*Escenario 1 — Eliminación exitosa*
- **Dado** que soy ADMIN y la orden existe
- **Cuando** envío `DELETE /orders/:id`
- **Entonces** se registra `deletedAt` con timestamp y retorna HTTP 200

*Escenario 2 — Sin autorización*
- **Dado** que soy OPERADOR o LABORATORIO
- **Cuando** intento eliminar una orden
- **Entonces** retorna HTTP 403

---

## Épica 5: Gestión de Resultados

---

### HU-RES-01 — Registrar resultado de examen
**Rol**: ADMIN · LABORATORIO  
**Historia**: Como técnico, quiero registrar el resultado de un examen dentro de una orden, para documentar los hallazgos del análisis.

**Criterios de Aceptación**:

*Escenario 1 — Registro exitoso*
- **Dado** que soy LABORATORIO o ADMIN y la orden existe
- **Cuando** envío `POST /orders/:orderId/results` con los datos del resultado
- **Entonces** el resultado se crea con `createdBy` = mi ID y retorna HTTP 201

*Escenario 2 — Orden no existe*
- **Dado** que el `orderId` no corresponde a una orden activa
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 404 con mensaje "Orden no encontrada"

*Escenario 3 — Sin autorización*
- **Dado** que soy OPERADOR
- **Cuando** intento registrar un resultado
- **Entonces** retorna HTTP 403

---

### HU-RES-02 — Listar resultados de una orden
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como usuario autenticado, quiero ver todos los resultados registrados para una orden, para consultar el estado completo del análisis.

**Criterios de Aceptación**:

*Escenario 1 — Listado exitoso*
- **Dado** que soy usuario autenticado y la orden existe
- **Cuando** envío `GET /orders/:orderId/results`
- **Entonces** retorna HTTP 200 con la lista de resultados activos para esa orden

*Escenario 2 — Sin resultados aún*
- **Dado** que la orden no tiene resultados registrados
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 200 con `data: []`

---

### HU-RES-03 — Actualizar resultado
**Rol**: ADMIN · LABORATORIO  
**Historia**: Como técnico, quiero corregir o actualizar un resultado previamente registrado, para rectificar errores de digitación.

**Criterios de Aceptación**:

*Escenario 1 — Actualización exitosa*
- **Dado** que soy LABORATORIO o ADMIN y el resultado existe
- **Cuando** envío `PATCH /results/:id` con los datos a modificar
- **Entonces** retorna HTTP 200 con los datos actualizados y `updatedBy` = mi ID

*Escenario 2 — Resultado no encontrado*
- **Dado** que el ID no corresponde a un resultado activo
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 404

---

### HU-RES-04 — Eliminar resultado (soft delete)
**Rol**: ADMIN  
**Historia**: Como administrador, quiero eliminar lógicamente un resultado erróneo, para corregir el registro sin perder el historial.

**Criterios de Aceptación**:

*Escenario 1 — Eliminación exitosa*
- **Dado** que soy ADMIN y el resultado existe
- **Cuando** envío `DELETE /results/:id`
- **Entonces** se registra `deletedAt` y retorna HTTP 200

*Escenario 2 — Sin autorización*
- **Dado** que soy LABORATORIO u OPERADOR
- **Cuando** intento eliminar un resultado
- **Entonces** retorna HTTP 403

---

## Épica 6: Gestión de Citas (Agendamiento)

---

### HU-AGE-01 — Crear cita para un paciente
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero agendar una cita para un paciente y opcionalmente vincularla a una orden, para organizar la llegada del paciente al laboratorio.

**Criterios de Aceptación**:

*Escenario 1 — Creación exitosa*
- **Dado** que soy ADMIN o OPERADOR y el paciente existe
- **Cuando** envío `POST /appointments` con paciente, fecha y hora válidos
- **Entonces** la cita se crea con `createdBy` = mi ID y retorna HTTP 201

*Escenario 2 — Orden vinculada inexistente*
- **Dado** que envío un `orderId` que no corresponde a una orden activa
- **Cuando** el servidor valida los datos
- **Entonces** retorna HTTP 404 con mensaje "Orden no encontrada"

*Escenario 3 — Fecha en el pasado*
- **Dado** que la fecha de la cita es anterior a la fecha actual
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 400 con mensaje "La fecha de la cita debe ser futura"

---

### HU-AGE-02 — Listar citas con filtros
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como usuario autenticado, quiero ver las citas programadas con filtros por paciente y fecha, para planificar la carga de trabajo del día.

**Criterios de Aceptación**:

*Escenario 1 — Listado exitoso*
- **Dado** que soy usuario autenticado
- **Cuando** envío `GET /appointments?page=1&limit=10`
- **Entonces** retorna HTTP 200 con citas activas paginadas

*Escenario 2 — Filtro por paciente*
- **Dado** que envío `GET /appointments?patientId=uuid`
- **Cuando** el servidor filtra
- **Entonces** retorna solo las citas de ese paciente

*Escenario 3 — Filtro por rango de fecha*
- **Dado** que envío `GET /appointments?dateFrom=2026-04-14&dateTo=2026-04-15`
- **Cuando** el servidor filtra
- **Entonces** retorna solo las citas en ese rango

---

### HU-AGE-03 — Consultar detalle de cita
**Rol**: ADMIN · OPERADOR · LABORATORIO  
**Historia**: Como usuario autenticado, quiero ver el detalle de una cita, para confirmar los datos antes de atender al paciente.

**Criterios de Aceptación**:

*Escenario 1 — Consulta exitosa*
- **Dado** que soy usuario autenticado y la cita existe
- **Cuando** envío `GET /appointments/:id`
- **Entonces** retorna HTTP 200 con datos de la cita, paciente y orden asociada (si aplica)

*Escenario 2 — Cita no encontrada*
- **Dado** que el ID no corresponde a una cita activa
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 404 con mensaje "Cita no encontrada"

---

### HU-AGE-04 — Actualizar cita
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero modificar la fecha u hora de una cita, para reprogramarla a petición del paciente.

**Criterios de Aceptación**:

*Escenario 1 — Actualización exitosa*
- **Dado** que soy ADMIN o OPERADOR y la cita existe
- **Cuando** envío `PATCH /appointments/:id` con nueva fecha/hora válida
- **Entonces** retorna HTTP 200 con los datos actualizados y `updatedBy` = mi ID

*Escenario 2 — Nueva fecha en el pasado*
- **Dado** que la nueva fecha es anterior a la fecha actual
- **Cuando** envío la solicitud
- **Entonces** retorna HTTP 400 con mensaje "La fecha de la cita debe ser futura"

---

### HU-AGE-05 — Eliminar cita (soft delete)
**Rol**: ADMIN  
**Historia**: Como administrador, quiero cancelar (eliminar lógicamente) una cita, para registrar que fue anulada sin perder el historial.

**Criterios de Aceptación**:

*Escenario 1 — Eliminación exitosa*
- **Dado** que soy ADMIN y la cita existe
- **Cuando** envío `DELETE /appointments/:id`
- **Entonces** se registra `deletedAt` y retorna HTTP 200

*Escenario 2 — Sin autorización*
- **Dado** que soy OPERADOR o LABORATORIO
- **Cuando** intento eliminar una cita
- **Entonces** retorna HTTP 403

---

## Resumen de Cobertura

| Módulo | Historias | Roles cubiertos |
|---|---|---|
| Autenticación | 4 (AUTH-01 a 04) | ADMIN · OPERADOR · LABORATORIO |
| Usuarios | 4 (USR-01 a 04) | ADMIN |
| Pacientes | 5 (PAT-01 a 05) | ADMIN · OPERADOR · LABORATORIO |
| Órdenes | 6 (ORD-01 a 06) | ADMIN · OPERADOR · LABORATORIO |
| Resultados | 4 (RES-01 a 04) | ADMIN · LABORATORIO · OPERADOR (lectura) |
| Citas | 5 (AGE-01 a 05) | ADMIN · OPERADOR · LABORATORIO |
| **Total** | **28 historias** | **3 personas** |
