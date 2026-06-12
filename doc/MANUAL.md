# Manual de Uso — APP-DX v2.0
## Plataforma de Gestión de Programas Diagnósticos

**Versión:** 2.0  
**Última actualización:** 2026-06-12

---

## Partes del manual

1. [Guía del Administrador / Operador](#parte-1-guía-del-administrador--operador)
2. [Guía del Médico (formulario público)](#parte-2-guía-del-médico)
3. [Guía del Paciente (link de autorización)](#parte-3-guía-del-paciente)

---

# Parte 1: Guía del Administrador / Operador

## 1.1 Acceso al panel

1. Abra su navegador y vaya a la dirección del panel admin del programa.
2. Ingrese su correo electrónico y contraseña.
3. Haga clic en **Ingresar**.

> Si olvidó su contraseña, contacte al SUPER_ADMIN para restablecerla.

---

## 1.2 Dashboard principal

Al ingresar verá el dashboard con el resumen del estado de todos los casos:

| Tarjeta | Qué significa |
|---------|--------------|
| **Solicitudes recibidas** | Casos nuevos que llegaron y aún no han sido gestionados |
| **Pendientes de autorización** | Casos en los que el link del paciente ya fue enviado pero aún no ha respondido |
| **Autorizados** | Pacientes que autorizaron y están listos para agendar |
| **Programados** | Citas agendadas con laboratorio y fecha |
| **Con resultado sérico** | El laboratorio reportó los resultados séricos |
| **Con indicación genética** | Resultado sérico indica que se debe realizar prueba genética |
| **Sin indicación genética** | Resultado sérico indica que no se requiere prueba genética |
| **Completados** | Casos con todos los resultados registrados |

Puede hacer clic en cualquier tarjeta para ver la lista filtrada de esos casos.

---

## 1.3 Gestión de un caso — paso a paso

### Paso 1: Revisar una solicitud nueva

1. En el dashboard, haga clic en **Solicitudes recibidas** (o vaya al menú **Casos**).
2. Verá la lista de casos con: número consecutivo, nombre del paciente (en iniciales por privacidad), médico, programa y fecha de solicitud.
3. Haga clic en un caso para ver el detalle completo:
   - Datos del médico que hizo la solicitud
   - Datos del paciente
   - Exámenes solicitados
   - Consentimiento del médico (firmado digitalmente)
   - Resultado previo adjunto (si el médico lo subió)

### Paso 2: Generar el link del paciente

1. En el detalle del caso, haga clic en **Generar link para el paciente**.
2. El link se copia automáticamente al portapapeles.
3. Verá la fecha de expiración del link (72 horas desde que lo generó).
4. Envíe el link al paciente por WhatsApp o email usando el número/correo registrado por el médico.

**Nota:** Si el link expiró sin respuesta, haga clic en **Reenviar link** — esto invalida el link anterior y genera uno nuevo.

### Paso 3: Registrar la programación

Cuando haya coordinado la cita con el laboratorio:

1. En el detalle del caso, haga clic en **Registrar programación**.
2. Complete:
   - Laboratorio asignado
   - Sede / ciudad
   - Fecha de la cita
3. El estado del caso cambia a **PROGRAMADO**.

### Paso 4: Registrar el resultado sérico

Cuando el laboratorio le envíe los resultados:

1. Haga clic en **Registrar resultado sérico**.
2. Complete:
   - Valor del resultado (número y unidad — ej: 15 mg/dL)
   - Para Wilson: Ceruloplasmina y Cobre en orina
   - Para DAAT: Alfa-1 Antitripsina y PCR
   - Para Duchenne: Creatinkinasa (CK)
   - Fecha de toma de muestra
   - Fecha del reporte del laboratorio
   - Fecha en que le envió el resultado al médico y al paciente
   - Medio de envío (WhatsApp / Correo / Ambos)
3. Al guardar, el sistema calcula automáticamente si hay indicación genética:
   - Wilson: Ceruloplasmina < 20 mg/dL **ó** Cobre > 60 µg/24h → Con indicación
   - DAAT: Alfa-1 ≤ 110 mg/dL → Con indicación
   - Duchenne: basado en criterio médico → el admin confirma manualmente

### Paso 5: Confirmar indicación genética

1. Revise el indicador automático que muestra el sistema.
2. Si está de acuerdo, haga clic en **Confirmar** (Con indicación genética / Sin indicación genética).
3. Si es Sin indicación: el caso pasa a ese estado y puede marcarse como **Completado** luego.
4. Si es Con indicación: el caso queda listo para programar la prueba genética.

### Paso 6: Registrar resultado genético

Cuando el laboratorio genético envíe el reporte:

1. Haga clic en **Registrar resultado genético**.
2. Complete:
   - Laboratorio genético (Gencell / Biotecgen / Mendelics / SIG / EPS)
   - Fecha de toma de la prueba
   - Fecha del resultado
   - Gen analizado (ATP7B / SERPINA1 / DMD)
   - Resultado completo del reporte (pegue el texto tal como llega del laboratorio)
   - Fenotipo (para DAAT: MM/MS/MZ/SZ/ZZ — para Wilson: Portador/Positivo/Negativo)
3. Puede marcar el caso como **Completado**.

### Paso 7: Registrar seguimiento (solo Wilson)

Para casos de Wilson con resultado genético:

1. Haga clic en **Registrar seguimiento**.
2. Seleccione el estado clínico del paciente:
   - Negativo
   - Portador
   - Positivo
   - En tratamiento
   - Formulado
   - Trasplantado
   - Drop out
   - Fallecido
3. Puede actualizar el seguimiento en cualquier momento.

---

## 1.4 Cambiar estado manualmente

Si necesita cambiar el estado de un caso fuera del flujo normal (por ejemplo, un paciente que primero dijo No y luego cambió de opinión):

1. En el detalle del caso, haga clic en **Cambiar estado**.
2. Seleccione el nuevo estado del desplegable.
3. Escriba una nota explicando el motivo del cambio manual.
4. Confirme.

> El cambio queda registrado en el historial del caso con su nombre y la hora exacta.

---

## 1.5 Gestión de consentimientos

### Ver plantillas activas

1. Vaya al menú **Consentimientos**.
2. Verá las plantillas agrupadas por programa y país (MEDICO | PACIENTE).
3. Haga clic en cualquiera para ver el texto renderizado.

### Crear una nueva versión

Cuando el texto legal cambie:

1. En la plantilla que desea actualizar, haga clic en **Nueva versión**.
2. Edite el texto en el editor (soporta formato HTML básico).
3. Complete la fecha de vigencia.
4. Haga clic en **Guardar y activar**.
5. La versión anterior queda archivada automáticamente.

> Los casos ya firmados con la versión anterior mantienen ese texto. Los nuevos casos usarán la nueva versión.

---

## 1.6 Importar datos históricos desde Excel

### Importar el historial de Wilson o DAAT

1. Vaya al menú **Importar datos**.
2. Seleccione el programa (Wilson / DAAT / Duchenne).
3. Haga clic en **Subir archivo** y seleccione el `.xlsx` del Excel actual.
4. El sistema analiza el archivo y muestra:
   - Número de casos válidos (se importarán todos)
   - Casos con advertencias (se importarán con nota)
   - Casos con errores bloqueantes (NO se importarán)
5. Si hay errores, descargue el reporte haciendo clic en **Descargar reporte de errores**.
6. Cuando esté listo, haga clic en **Confirmar importación**.
7. Verá un resumen de cuántos casos se importaron correctamente.

### Descargar la plantilla

Para llenar casos nuevos en Excel y subirlos al sistema:

1. Vaya a **Importar datos**.
2. Seleccione el programa.
3. Haga clic en **Descargar plantilla**.
4. Llene los datos siguiendo las instrucciones de la hoja "Instrucciones" del archivo.
5. Suba el archivo usando el flujo normal de importación.

---

## 1.7 Reportes y exportación

1. Vaya al menú **Reportes**.
2. Seleccione el tipo de reporte:
   - **Casos por estado:** cuántos casos hay en cada etapa
   - **Por programa:** distribución por Wilson/DAAT/Duchenne
   - **Por laboratorio:** cuántas pruebas va cada laboratorio
   - **Tasa de autorización:** % de pacientes que autorizan
   - **Indicación genética:** % con y sin indicación
3. Aplique los filtros deseados (fecha, programa, país, etc.).
4. Haga clic en **Exportar Excel** o **Exportar CSV**.

---

# Parte 2: Guía del Médico

> Esta guía es para médicos que van a hacer una solicitud diagnóstica para un paciente. No requiere crear una cuenta.

## 2.1 ¿Cómo obtener el link del formulario?

El equipo del programa le habrá compartido un link por WhatsApp o correo electrónico. El link tiene una forma similar a:

```
https://app.appdx.com/solicitud/bts/wilson
```

Guarde este link — puede usarlo para todos sus pacientes del mismo programa.

## 2.2 Llenar el formulario

### Sección 1: Sus datos (médico)

Complete sus datos profesionales:

| Campo | Ejemplo |
|-------|---------|
| Nombre completo | Juan Carlos Pérez Rodríguez |
| Especialidad | Hepatología |
| Tipo de registro | TP (Tarjeta Profesional — Colombia) |
| Número de registro | 66551 |
| Correo electrónico | jperez@clinica.com |
| WhatsApp / Teléfono | +57 310 5571733 |
| Institución | Clínica San José (opcional) |
| Ciudad | Bogotá |

> Todos los campos marcados con * son obligatorios.

### Sección 2: Datos del paciente

Complete los datos de su paciente:

| Campo | Ejemplo |
|-------|---------|
| Nombre completo | María del Carmen García Ruiz |
| Tipo de documento | Cédula de Ciudadanía |
| Número de documento | 52.123.456 |
| Género | Femenino |
| EPS / Aseguradora | Nueva EPS (opcional) |
| Teléfono / WhatsApp | +57 300 1234567 |
| Correo electrónico | maria@email.com (opcional) |
| Ciudad | Bogotá |
| Departamento | Cundinamarca |
| Dirección | Calle 100 # 15-30 |

**Si el paciente no puede firmar directamente** (por ejemplo, un menor de edad o una persona sin capacidad legal):

1. Active la opción "Actúa un representante legal".
2. Complete los datos del representante: nombre completo, número de documento y parentesco (madre, padre, hijo/a, cónyuge, etc.).

### Sección 3: Exámenes solicitados

**Wilson:** Seleccione los exámenes:
- ☑ Ceruloplasmina sérica
- ☑ Cobre en orina en 24 horas

**DAAT (Alfa-1):** Seleccione los exámenes:
- ☑ Niveles de Alfa-1 Antitripsina
- ☑ PCR (opcional)

**Duchenne:**
- El examen de Creatinkinasa (CK) es el único de la primera fase
- Seleccione el país del paciente — el consentimiento se adapta automáticamente
- Si ya tiene el resultado de CK, puede adjuntarlo:
  1. Ingrese el valor numérico (ej: 450 U/L o "450, valor elevado")
  2. Adjunte el PDF del resultado
  3. Seleccione si el resultado es Positivo / Negativo / Borderline

### Sección 4: Consentimiento y envío

1. Lea el texto del consentimiento informado del programa.
2. Marque la casilla "He leído y acepto el consentimiento".
3. Haga clic en **Enviar solicitud**.

Verá una pantalla de confirmación que indica que su solicitud fue recibida. El equipo del programa se comunicará con el paciente para coordinar la toma de muestra.

---

## 2.3 Preguntas frecuentes del médico

**¿Puedo usar el mismo link para todos mis pacientes?**  
Sí. El link es permanente y puede usarlo para tantos pacientes como necesite.

**¿Qué pasa si el paciente no tiene correo electrónico?**  
El correo es opcional. El teléfono/WhatsApp es suficiente para contactar al paciente.

**¿Cuándo me envían los resultados?**  
Los resultados se envían al correo que registró en el formulario, una vez el laboratorio los tenga disponibles.

**¿Puedo adjuntar un resultado si está en formato de imagen (JPG)?**  
El sistema acepta únicamente PDF. Si tiene el resultado en imagen, conviértalo a PDF antes de adjuntarlo.

**¿Qué debo hacer si cometí un error en el formulario?**  
Contacte al equipo del programa al correo o WhatsApp que aparece en el formulario. Ellos podrán corregir los datos.

---

# Parte 3: Guía del Paciente

> Esta guía es para personas que recibieron un link por WhatsApp para autorizar unos exámenes. No necesita crear ninguna cuenta ni descargar ninguna aplicación.

---

## 3.1 ¿Qué es este link?

Su médico solicitó unos exámenes para usted a través del Programa de Apoyo Diagnóstico. El equipo del programa le envió este link para que usted pueda:

1. **Ver** qué exámenes le solicitaron y quién los solicitó
2. **Verificar** que sus datos están correctos
3. **Autorizar** o **no autorizar** la realización de los exámenes

---

## 3.2 Paso a paso para el paciente

### Paso 1: Abrir el link

Haga clic en el link que le enviaron por WhatsApp. Se abrirá directamente en su navegador — no necesita descargar nada.

> Si el link le dice "Este link ha expirado" o "Este link ya fue usado", contacte al equipo del programa al número de teléfono que aparece en la pantalla.

### Paso 2: Leer la información

Verá una pantalla con:

- El nombre y especialidad de su médico
- Los exámenes que le solicitaron
- Sus datos registrados (nombre, documento, ciudad, teléfono)

Si hay algún error en sus datos, haga clic en el botón **"Hay un error en mis datos"** y escriba cuál es el error. El equipo lo corregirá.

### Paso 3: Leer el consentimiento (opcional pero recomendado)

Si desea leer el documento completo de consentimiento informado, haga clic en **"Ver consentimiento completo"**. Este texto explica:
- Para qué se usarán sus datos
- Quiénes tendrán acceso a sus resultados
- Sus derechos como paciente

### Paso 4: Autorizar o no autorizar

1. En el campo que dice **"Escriba su nombre completo"**, escriba su nombre tal como aparece en su documento de identidad.
2. Luego haga clic en uno de los dos botones:

| Botón | Color | Qué significa |
|-------|-------|--------------|
| **AUTORIZO** | Verde | Acepta que se realicen los exámenes y el tratamiento de sus datos |
| **NO AUTORIZO** | Rojo | No acepta participar en el programa diagnóstico |

3. Se le pedirá una confirmación antes de registrar su respuesta.
4. Verá una pantalla final confirmando que su respuesta fue registrada.

---

## 3.3 ¿Qué pasa después de autorizar?

El equipo del programa le contactará por teléfono o WhatsApp para:
- Indicarle el laboratorio y la dirección donde debe ir
- Confirmar la fecha y hora de la cita para la toma de muestra
- Darle instrucciones de preparación (si requiere ayuno u otras indicaciones)

Los exámenes no tienen costo para usted.

---

## 3.4 ¿Qué pasa si no autorizo?

No hay ningún problema. Su decisión será respetada y su caso quedará registrado como "No autorizado". No recibirá más contactos del programa.

Si en el futuro cambia de opinión, su médico puede hacer una nueva solicitud.

---

## 3.5 Preguntas frecuentes del paciente

**¿Mis datos están seguros?**  
Sí. Sus datos solo son compartidos con el laboratorio y el médico que los solicitó. No se comparten con terceros ajenos al programa diagnóstico.

**¿El link tiene fecha de vencimiento?**  
Sí. El link es válido por 72 horas (3 días) desde que fue generado. Si vence, comuníquese con el equipo del programa para que le envíen uno nuevo.

**¿Puedo usar el link desde mi celular?**  
Sí. El formulario está diseñado especialmente para ser usado desde celular.

**¿Qué hago si el link no abre?**  
Intente copiando el link y abriéndolo directamente en su navegador (Chrome o Safari). Si sigue sin funcionar, contacte al equipo del programa.

**¿Alguien puede firmar por mí si no puedo hacerlo yo?**  
Sí. Un familiar o representante legal puede autorizar en su nombre. El médico debió haber registrado los datos de esa persona al hacer la solicitud.

**¿Cuándo recibo los resultados?**  
Los resultados se entregan directamente a su médico y a usted, una vez el laboratorio los tenga listos. El equipo del programa le informará por teléfono o WhatsApp cuando estén disponibles.

---

## Contacto del Programa

Si tiene dudas o necesita ayuda, contacte al equipo:

- **Correo:** programaapoyandovidas@bts-integral.com
- **Teléfono:** +57 310 5571733
- **WhatsApp:** +57 310 8847395

*Llámenos o contáctenos vía WhatsApp en horario hábil.*
