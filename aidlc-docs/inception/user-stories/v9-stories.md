# Historias de Usuario — Incremento v9: Flujo Clínico Completo + UX

**Fecha**: 2026-04-16  
**Incremento**: v9 — Flujo clínico end-to-end + picker de paciente + tipos de documento colombianos  
**Roles**: ADMIN · OPERADOR · MEDICO · LABORATORIO

---

## Épica 9: Flujo Clínico Completo

El flujo central del sistema cubre el ciclo de vida de una solicitud de laboratorio para un paciente:

```
Crear Paciente → Crear Orden → Consentimiento (firmar → enviar → respuesta)
    → Agendar Cita → Muestra → Análisis → Resultados
```

---

### HU-V9-01 — Crear paciente con documentos colombianos
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero registrar un paciente con su cédula de ciudadanía (CC), tarjeta de identidad (TI) o registro civil (RC), para que el sistema soporte la realidad documental colombiana.

**Criterios de Aceptación**:

*Escenario 1 — CC como tipo de documento*
- **Dado** que estoy en el formulario de creación de paciente
- **Cuando** selecciono "Cédula de Ciudadanía" (CC) e ingreso todos los datos válidos
- **Entonces** el sistema crea el paciente y lo muestra en la lista

*Escenario 2 — TI como tipo de documento*
- **Dado** que estoy en el formulario de creación de paciente
- **Cuando** selecciono "Tarjeta de Identidad" (TI) e ingreso datos válidos
- **Entonces** el sistema acepta el tipo y crea el paciente correctamente

*Escenario 3 — RC como tipo de documento*
- **Dado** que al paciente se le asignó registro civil
- **Cuando** selecciono "Registro Civil" (RC) e ingreso los datos
- **Entonces** el sistema crea el paciente con ese tipo de documento

*Escenario 4 — Tipos disponibles en dropdown*
- **Dado** que estoy en el formulario de paciente
- **Cuando** abro el selector de tipo de documento
- **Entonces** veo las opciones: CC, TI, RC, CE, DNI, Pasaporte, NIT

---

### HU-V9-02 — Crear orden con picker de paciente
**Rol**: ADMIN · OPERADOR · MEDICO  
**Historia**: Como médico/operador, quiero seleccionar el paciente desde un buscador al crear una orden, en lugar de ingresar el UUID manualmente, para agilizar el proceso y reducir errores.

**Criterios de Aceptación**:

*Escenario 1 — Búsqueda por nombre*
- **Dado** que estoy creando una nueva orden
- **Cuando** escribo al menos 2 letras del nombre del paciente en el campo "Paciente"
- **Entonces** aparece un desplegable con hasta 10 resultados coincidentes mostrando nombre y número de documento

*Escenario 2 — Búsqueda por número de documento*
- **Dado** que estoy creando una orden
- **Cuando** ingreso el número de documento del paciente
- **Entonces** el sistema filtra y muestra al paciente correcto

*Escenario 3 — Selección del paciente*
- **Dado** que veo resultados en el desplegable
- **Cuando** hago clic en un paciente
- **Entonces** el campo muestra "Nombre Apellido · NumeroDoc" y el formulario guarda el UUID internamente

*Escenario 4 — Limpiar selección*
- **Dado** que ya seleccioné un paciente
- **Cuando** hago clic en la X junto al nombre
- **Entonces** el campo vuelve al modo de búsqueda

*Escenario 5 — Sin resultados*
- **Dado** que busco un término que no coincide con ningún paciente
- **Cuando** escribo al menos 2 caracteres
- **Entonces** veo el mensaje "Sin resultados para '...'"

---

### HU-V9-03 — Editar paciente sin crash
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero poder editar los datos de un paciente sin que la aplicación arroje un error de cliente, para corregir información cuando sea necesario.

**Criterios de Aceptación**:

*Escenario 1 — Abrir formulario de edición*
- **Dado** que estoy en la lista de pacientes
- **Cuando** hago clic en "Editar" junto a cualquier paciente
- **Entonces** se abre el formulario de edición con los datos actuales del paciente (sin error de aplicación)

*Escenario 2 — Guardar cambios*
- **Dado** que modifiqué el teléfono del paciente
- **Cuando** hago clic en "Guardar cambios"
- **Entonces** se actualiza el paciente y soy redirigido a la lista

---

### HU-V9-04 — Ver detalle de orden sin crash
**Rol**: ADMIN · OPERADOR · MEDICO · LABORATORIO  
**Historia**: Como usuario, quiero ver el detalle completo de una orden (estado, paciente, exámenes, consentimiento) sin que la aplicación falle al navegar a la URL `/orders/:id`.

**Criterios de Aceptación**:

*Escenario 1 — Navegación directa*
- **Dado** que hago clic en una orden de la lista
- **Cuando** el navegador carga `/orders/{id}`
- **Entonces** veo el nombre del paciente, estado, exámenes y panel de consentimiento sin errores

*Escenario 2 — Paciente siempre visible*
- **Dado** que la orden fue creada con el picker de paciente
- **Cuando** veo el detalle
- **Entonces** el campo "Paciente" muestra el nombre completo (no el UUID)

---

### HU-V9-05 — Crear consentimiento desde orden
**Rol**: ADMIN · OPERADOR · MEDICO  
**Historia**: Como médico, quiero crear un consentimiento informado para una orden en estado PENDIENTE, para iniciar el proceso formal de autorización del paciente.

**Criterios de Aceptación**:

*Escenario 1 — Crear consentimiento*
- **Dado** que estoy en el detalle de una orden con estado "Pendiente"
- **Cuando** hago clic en "Crear consentimiento" en el panel de consentimiento
- **Entonces** el sistema crea el consentimiento con estado `PENDIENTE_FIRMA_MEDICO` y la orden pasa a `CONSENT_PENDING`

*Escenario 2 — Solo una vez por orden*
- **Dado** que ya existe un consentimiento para la orden
- **Cuando** intento crear otro
- **Entonces** el sistema retorna error 409 y el botón no aparece en la UI

---

### HU-V9-06 — Firma médica del consentimiento
**Rol**: ADMIN · MEDICO  
**Historia**: Como médico, quiero firmar digitalmente el consentimiento informado, para certificar que expliqué el procedimiento al paciente.

**Criterios de Aceptación**:

*Escenario 1 — Firma exitosa*
- **Dado** que el consentimiento está en estado `PENDIENTE_FIRMA_MEDICO`
- **Cuando** hago clic en "Firmar consentimiento" (con o sin notas)
- **Entonces** el consentimiento pasa a `FIRMADO_MEDICO` y se registra `doctorSignedAt`

*Escenario 2 — Solo médicos y admin pueden firmar*
- **Dado** que soy un usuario con rol OPERADOR o LABORATORIO
- **Cuando** veo el panel de consentimiento
- **Entonces** el botón "Firmar" no está disponible para mí

---

### HU-V9-07 — Envío del consentimiento al paciente
**Rol**: ADMIN · OPERADOR · MEDICO  
**Historia**: Como operador, quiero enviar el consentimiento firmado al paciente por correo, para que él pueda aceptarlo o rechazarlo.

**Criterios de Aceptación**:

*Escenario 1 — Envío exitoso*
- **Dado** que el consentimiento está en estado `FIRMADO_MEDICO`
- **Cuando** hago clic en "Enviar al paciente"
- **Entonces** el consentimiento cambia a `ENVIADO_PACIENTE` y el sistema dispara la notificación por correo (log en backend)

*Escenario 2 — No se puede enviar antes de firmar*
- **Dado** que el consentimiento aún está `PENDIENTE_FIRMA_MEDICO`
- **Cuando** intento enviarlo
- **Entonces** el botón de envío no está disponible

---

### HU-V9-08 — Respuesta del paciente al consentimiento
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero registrar la respuesta del paciente (aceptado o rechazado) cuando él llama o se presenta en persona, para continuar o detener el proceso de la orden.

**Criterios de Aceptación**:

*Escenario 1 — Aceptar consentimiento*
- **Dado** que el consentimiento está en `ENVIADO_PACIENTE`
- **Cuando** el operador hace clic en "Aceptar" después de confirmación con el paciente
- **Entonces** el consentimiento pasa a `ACEPTADO` y la orden cambia a `ACCEPTED`

*Escenario 2 — Rechazar consentimiento*
- **Dado** que el consentimiento está en `ENVIADO_PACIENTE`
- **Cuando** el operador hace clic en "Rechazar"
- **Entonces** el consentimiento pasa a `RECHAZADO` y la orden cambia a `RECHAZADA`

---

### HU-V9-09 — Agendar cita con picker de paciente
**Rol**: ADMIN · OPERADOR  
**Historia**: Como operador, quiero seleccionar el paciente mediante búsqueda al agendar una cita, para no tener que ingresar el UUID manualmente.

**Criterios de Aceptación**:

*Escenario 1 — Búsqueda funcional en AppointmentForm*
- **Dado** que estoy creando una nueva cita
- **Cuando** escribo el nombre del paciente en el campo "Paciente"
- **Entonces** veo el desplegable con resultados igual que en el formulario de órdenes

*Escenario 2 — Orden opcional vinculada*
- **Dado** que seleccioné un paciente en la cita
- **Cuando** también ingreso un ID de orden vinculada (opcional)
- **Entonces** la cita queda asociada tanto al paciente como a la orden

---

### HU-V9-10 — Flujo completo end-to-end
**Rol**: ADMIN  
**Historia**: Como administrador, quiero poder ejecutar el flujo completo desde creación del paciente hasta carga de resultados, para verificar que todas las piezas del sistema funcionan integradas.

**Flujo completo**:
1. Crear paciente (con CC o TI colombiana)
2. Crear orden (seleccionar paciente con picker)
3. Crear consentimiento desde el detalle de la orden
4. Firmar el consentimiento (médico)
5. Enviar el consentimiento al paciente
6. Registrar respuesta (aceptado)
7. Cambiar estado de la orden a SCHEDULED
8. Agendar cita (con picker de paciente + orderId)
9. Marcar muestra recolectada
10. Marcar en análisis
11. Cargar resultados (examType, value, referenceRange)
12. Ver el resultado en el detalle de la orden

**Criterio de éxito**: Todos los pasos completan sin errores y los estados se reflejan correctamente en la UI.

---

## Mapa de Estado de Orden — Referencia

```
PENDIENTE
  │ (crear consentimiento)
  ▼
CONSENT_PENDING
  │ (paciente acepta)  │ (paciente rechaza)
  ▼                    ▼
ACCEPTED           RECHAZADA
  │ (agendar)
  ▼
SCHEDULED
  │ (recolectar muestra)
  ▼
MUESTRA_RECOLECTADA
  │ (iniciar análisis)
  ▼
EN_ANALISIS
  │ (completar)
  ▼
COMPLETADA
```

En cualquier estado activo (excepto COMPLETADA/CANCELADA/RECHAZADA), ADMIN/OPERADOR pueden cancelar → `CANCELADA`.
