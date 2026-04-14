# Historias de Usuario — Incremento v10: Modelo Clínico

**Fecha**: 2026-04-14  
**Incremento**: v10 — Campos médico completos + diagnóstico en órdenes + ubicación del paciente + corrección bug doctorId  
**Roles**: ADMIN · OPERADOR · MEDICO · LABORATORIO

---

## Épica 10: Modelo Clínico Alineado con Formularios MoreApp

Alineación del modelo de datos y los formularios del sistema con los formularios clínicos reales de MoreApp (Orden Médica Wilson, Orden Médica Alfa-1, Orden Médica Duchenne, Autorización DAAT, Autorización Wilson).

---

### HU-V10-01 — Registrar médico con datos clínicos completos
**Rol**: ADMIN  
**Historia**: Como administrador, quiero registrar un médico con nombre completo, especialidad, registro médico, teléfono y correo, para que el sistema pueda identificar correctamente al médico solicitante en cada orden.

**Criterios de Aceptación**:

*Escenario 1 — Crear médico con todos los campos*
- **Dado** que estoy en el módulo de usuarios y selecciono "Nuevo usuario"
- **Cuando** asigno rol MÉDICO e ingreso nombre, apellido, especialidad, registro médico y teléfono
- **Entonces** el sistema crea el usuario con todos esos campos y los muestra en la tabla

*Escenario 2 — Campos clínicos solo visibles para MÉDICO*
- **Dado** que estoy creando un usuario
- **Cuando** selecciono un rol distinto a MÉDICO (ej. OPERADOR)
- **Entonces** los campos "Especialidad" y "Registro médico" no aparecen en el formulario

*Escenario 3 — Editar datos del médico*
- **Dado** que existe un médico sin especialidad registrada
- **Cuando** edito su perfil y agrego especialidad y registro médico
- **Entonces** los datos se guardan y aparecen en la tabla y en el picker de médico

*Escenario 4 — Tabla de usuarios muestra nombre completo*
- **Dado** que hay usuarios con nombre y apellido registrados
- **Cuando** ingreso al módulo de usuarios
- **Entonces** la tabla muestra una columna "Nombre" con "NombreCompleto" además del correo

---

### HU-V10-02 — Seleccionar médico al crear una orden
**Rol**: ADMIN · OPERADOR · MEDICO  
**Historia**: Como operador, quiero buscar y seleccionar al médico solicitante desde un picker al crear una orden, en lugar de escribir texto libre, para garantizar que el médico quede vinculado correctamente por ID.

**Criterios de Aceptación**:

*Escenario 1 — Buscar médico por nombre*
- **Dado** que estoy creando una orden
- **Cuando** escribo el nombre del médico en el campo "Médico solicitante"
- **Entonces** aparece un desplegable con médicos registrados (rol=MEDICO) que coinciden con la búsqueda, mostrando nombre, especialidad y registro médico

*Escenario 2 — Médicos disponibles al enfocar el campo*
- **Dado** que el campo "Médico solicitante" está vacío
- **Cuando** hago clic en el campo (sin escribir nada)
- **Entonces** aparecen los médicos disponibles en el sistema

*Escenario 3 — Selección correcta del médico*
- **Dado** que veo médicos en el desplegable
- **Cuando** selecciono uno
- **Entonces** el campo muestra "Nombre Apellido · Especialidad" y el formulario guarda el UUID del médico

*Escenario 4 — Ningún error de UUID*
- **Dado** que antes el campo "médico" era texto libre
- **Cuando** creo una orden ahora (con o sin médico seleccionado)
- **Entonces** NO aparece el error "El ID del doctor no es válido"

*Escenario 5 — Médico opcional*
- **Dado** que no existe médico disponible o no deseo asignarlo
- **Cuando** dejo el campo "Médico solicitante" vacío y envío la orden
- **Entonces** la orden se crea correctamente sin médico asignado

---

### HU-V10-03 — Ver el médico en las órdenes
**Rol**: ADMIN · OPERADOR · MEDICO · LABORATORIO  
**Historia**: Como laboratorista, quiero ver el nombre del médico solicitante en la lista y detalle de la orden, no su UUID ni texto vacío, para saber rápidamente quién solicitó el examen.

**Criterios de Aceptación**:

*Escenario 1 — Nombre del médico en la lista de órdenes*
- **Dado** que hay órdenes con médico vinculado
- **Cuando** veo la lista de órdenes
- **Entonces** la columna "Médico" muestra "Nombre Apellido" del médico, no el UUID

*Escenario 2 — Médico con especialidad en el detalle*
- **Dado** que estoy en el detalle de una orden
- **Cuando** reviso la sección "Médico"
- **Entonces** aparece "Nombre Apellido · Especialidad" si el médico tiene especialidad registrada

*Escenario 3 — Fallback para datos históricos*
- **Dado** que hay órdenes antiguas con texto libre en el campo physician
- **Cuando** las veo en la lista o detalle
- **Entonces** el sistema muestra ese texto como fallback (sin error)

---

### HU-V10-04 — Registrar diagnóstico al crear una orden
**Rol**: ADMIN · OPERADOR · MEDICO  
**Historia**: Como médico, quiero ingresar el diagnóstico o justificación clínica al crear una orden, para que el laboratorio entienda el contexto clínico de la solicitud.

**Criterios de Aceptación**:

*Escenario 1 — Campo diagnóstico en el formulario de orden*
- **Dado** que estoy creando una orden
- **Cuando** veo el formulario
- **Entonces** aparece un campo "Diagnóstico / Justificación clínica" (opcional) debajo de la sección de médico

*Escenario 2 — Diagnóstico se guarda*
- **Dado** que ingreso un diagnóstico al crear la orden
- **Cuando** guardo la orden
- **Entonces** el diagnóstico queda guardado y visible en el detalle de la orden

*Escenario 3 — Diagnóstico visible en detalle*
- **Dado** que una orden tiene diagnóstico
- **Cuando** abro el detalle de esa orden
- **Entonces** aparece la sección "Diagnóstico / Justificación clínica" con el texto ingresado

*Escenario 4 — Diagnóstico es opcional*
- **Dado** que no ingreso diagnóstico
- **Cuando** creo la orden
- **Entonces** la orden se crea sin error y la sección de diagnóstico no aparece en el detalle

---

### HU-V10-05 — Registrar ubicación y cobertura del paciente
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero registrar la ciudad, dirección y EPS/aseguradora del paciente al crearlo o editarlo, para tener la información necesaria para el flujo de autorización de los formularios clínicos.

**Criterios de Aceptación**:

*Escenario 1 — Campos de ubicación en el formulario de paciente*
- **Dado** que estoy creando o editando un paciente
- **Cuando** veo el formulario
- **Entonces** aparecen los campos: "Ciudad", "Dirección" y "EPS / Aseguradora" (todos opcionales)

*Escenario 2 — Datos se guardan correctamente*
- **Dado** que ingreso ciudad, dirección y aseguradora al crear un paciente
- **Cuando** guardo
- **Entonces** esos datos quedan persistidos en la base de datos

*Escenario 3 — Campos opcionales no bloquean el registro*
- **Dado** que no ingreso ciudad ni dirección
- **Cuando** creo el paciente con solo los campos obligatorios
- **Entonces** el paciente se crea sin error

---

### HU-V10-06 — Corrección del bug "El ID del doctor no es válido"
**Rol**: ADMIN · OPERADOR · MEDICO  
**Historia**: Como operador, quiero que la creación de una orden no falle incluso si no selecciono un médico, para no ver el error "El ID del doctor no es válido" que aparecía antes.

**Criterios de Aceptación**:

*Escenario 1 — Crear orden sin médico*
- **Dado** que estoy creando una orden
- **Cuando** dejo el campo de médico vacío y envío el formulario
- **Entonces** la orden se crea correctamente sin error de validación UUID

*Escenario 2 — El error no vuelve a aparecer*
- **Dado** que el bug era causado por `doctorId: ""` enviado al backend
- **Cuando** el formulario envía la orden sin médico
- **Entonces** el backend transforma el string vacío a `undefined` y no genera error

---

### HU-V10-07 — Buscar médicos por rol en el sistema
**Rol**: ADMIN · OPERADOR (interno, soporte para DoctorPicker)  
**Historia**: Como sistema, necesito poder consultar `GET /users?role=MEDICO&search=...` para alimentar el picker de médico con datos reales del sistema.

**Criterios de Aceptación**:

*Escenario 1 — Filtrar usuarios por rol*
- **Dado** que existen usuarios con distintos roles en el sistema
- **Cuando** el frontend llama a `GET /users?role=MEDICO`
- **Entonces** la API devuelve solo los usuarios con rol MEDICO

*Escenario 2 — Búsqueda por texto sobre médicos*
- **Dado** que hay médicos registrados
- **Cuando** el frontend llama a `GET /users?role=MEDICO&search=Carlos`
- **Entonces** devuelve solo los médicos cuyo nombre o correo contiene "Carlos"

---

### HU-V10-08 — Datos completos del médico en el selector de usuario
**Rol**: ADMIN · OPERADOR  
**Historia**: Como administrador, quiero crear usuarios MÉDICO con nombre, especialidad y registro médico directamente desde el formulario de usuario, sin necesidad de pasos extra.

**Criterios de Aceptación**:

*Escenario 1 — Formulario de creación muestra campos MÉDICO*
- **Dado** que selecciono rol=MÉDICO al crear un usuario
- **Cuando** veo el formulario
- **Entonces** aparecen los campos adicionales: Especialidad y Registro médico (sección separada con borde)

*Escenario 2 — Formulario de edición también muestra campos MÉDICO*
- **Dado** que edito un usuario con rol MÉDICO
- **Cuando** abro el modal de edición
- **Entonces** los campos Especialidad y Registro médico aparecen pre-cargados con los valores actuales y son editables

*Escenario 3 — Al cambiar de rol a no-MÉDICO, campos se ocultan*
- **Dado** que estoy editando un usuario y cambio su rol a OPERADOR
- **Cuando** el formulario se actualiza dinámicamente
- **Entonces** los campos de Especialidad y Registro médico desaparecen del formulario
