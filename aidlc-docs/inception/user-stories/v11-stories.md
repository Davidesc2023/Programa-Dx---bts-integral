# Historias de Usuario — Increment v11: Rol PACIENTE + Portal del Paciente

## Épica: Portal del Paciente

> El sistema debe permitir a los pacientes acceder a un portal propio donde puedan registrarse, ver sus órdenes, responder consentimientos, consultar resultados y ver sus citas agendadas.

---

### HU-V11-01: Auto-registro del paciente

**Rol**: Como paciente  
**Historia**: Quiero registrarme en el sistema con mis datos básicos para poder acceder al portal  
**Criterios de Aceptación**:

```gherkin
Dado que soy un paciente y accedo a la pantalla de login
Cuando hago clic en "¿Eres paciente? Regístrate"
Entonces veo un formulario con campos: email, contraseña, tipo documento, número documento, nombre, apellido

Dado que completo el formulario con datos válidos
Cuando envío el registro
Entonces el sistema crea mi usuario con rol PACIENTE
Y si existe un paciente con mi documentType + documentNumber, me vincula automáticamente

Dado que ya tengo una cuenta con ese email
Cuando intento registrarme con el mismo email
Entonces recibo el error "El correo ya está registrado"
```

---

### HU-V11-02: Login con redirección por rol

**Rol**: Como usuario del sistema (cualquier rol)  
**Historia**: Quiero que al hacer login se me redirija automáticamente a la interfaz correcta para mi rol  
**Criterios de Aceptación**:

```gherkin
Dado que tengo un usuario con rol PACIENTE
Cuando inicio sesión con mis credenciales
Entonces soy redirigido a /portal/dashboard (no a /dashboard)

Dado que tengo un usuario con rol ADMIN, OPERADOR, LABORATORIO o MEDICO
Cuando inicio sesión
Entonces soy redirigido a /dashboard (no al portal)

Dado que soy PACIENTE e intento acceder a /dashboard
Cuando navego a esa ruta
Entonces soy redirigido automáticamente a /portal/dashboard
```

---

### HU-V11-03: Ver mis órdenes en el portal

**Rol**: Como paciente autenticado  
**Historia**: Quiero ver la lista de mis órdenes médicas para conocer el estado de cada solicitud  
**Criterios de Aceptación**:

```gherkin
Dado que soy un paciente con cuenta vinculada a mi registro clínico
Cuando accedo a /portal/orders
Entonces veo solo las órdenes asociadas a MI registro de paciente
Y no veo órdenes de otros pacientes

Dado que hago clic en una orden
Cuando accedo al detalle
Entonces veo: estado, médico, diagnóstico, exámenes solicitados, fecha de creación
```

---

### HU-V11-04: Responder consentimiento informado

**Rol**: Como paciente autenticado  
**Historia**: Quiero poder aceptar o rechazar el consentimiento informado de una orden médica  
**Criterios de Aceptación**:

```gherkin
Dado que tengo una orden con consentimiento en estado ENVIADO_PACIENTE
Cuando accedo a /portal/orders/:id/consent
Entonces veo el detalle del consentimiento y botones Aceptar / Rechazar

Dado que hago clic en Aceptar
Cuando confirmo la acción
Entonces el consentimiento cambia a ACEPTADO
Y la orden avanza a estado ACCEPTED

Dado que hago clic en Rechazar
Cuando confirmo con una nota opcional
Entonces el consentimiento cambia a RECHAZADO
Y el flujo del proceso se detiene
```

---

### HU-V11-05: Ver mis resultados de exámenes

**Rol**: Como paciente autenticado  
**Historia**: Quiero consultar los resultados de mis exámenes para conocer los valores y poder compartirlos con mi médico  
**Criterios de Aceptación**:

```gherkin
Dado que tengo una orden con resultados cargados
Cuando accedo a /portal/orders/:id/results
Entonces veo la lista de resultados con: tipo de examen, valor, unidad, rango de referencia, notas

Dado que un resultado tiene adjuntos (PDF/imagen)
Cuando hago clic en descargar
Entonces el archivo se descarga directamente
```

---

### HU-V11-06: Ver mis citas agendadas

**Rol**: Como paciente autenticado  
**Historia**: Quiero ver mis citas programadas para saber cuándo será la toma de muestras  
**Criterios de Aceptación**:

```gherkin
Dado que tengo citas agendadas
Cuando accedo a /portal/appointments
Entonces veo la lista de mis citas con: fecha, hora, estado, notas

Dado que no tengo citas agendadas
Cuando accedo a /portal/appointments
Entonces veo el mensaje "No tienes citas agendadas"
```

---

### HU-V11-07: Dashboard del portal (resumen)

**Rol**: Como paciente autenticado  
**Historia**: Quiero ver un resumen de mi actividad al ingresar al portal  
**Criterios de Aceptación**:

```gherkin
Dado que ingreso al portal
Cuando accedo a /portal/dashboard
Entonces veo:
  - Número de órdenes activas
  - Consentimientos pendientes de respuesta
  - Resultados disponibles
  - Próxima cita agendada
```

---

### HU-V11-08: Administrador vincula paciente a cuenta PACIENTE

**Rol**: Como administrador del sistema  
**Historia**: Quiero poder vincular manualmente un registro de paciente clínico a una cuenta de usuario PACIENTE  
**Criterios de Aceptación**:

```gherkin
Dado que estoy en el módulo de Usuarios
Cuando edito un usuario con rol PACIENTE
Entonces veo un campo adicional "Paciente vinculado" con un selector (PatientPicker)

Dado que selecciono un paciente del selector
Cuando guardo los cambios
Entonces el registro Patient queda vinculado al User (Patient.userId = User.id)

Dado que el paciente ya está vinculado a otro usuario
Cuando intento vincularlo nuevamente
Entonces recibo un error indicando que el paciente ya tiene una cuenta
```
