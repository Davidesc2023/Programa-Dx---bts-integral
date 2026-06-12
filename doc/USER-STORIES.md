# Historias de Usuario — APP-DX v2.0

**Última actualización:** 2026-06-12  
**Formato:** Como [rol], quiero [acción], para [beneficio]

---

## Épica 1: Solicitud del Médico (Link Público)

### US-01 — Acceder al formulario sin cuenta
**Como** médico que recibe el link del equipo comercial,  
**quiero** abrir el link y ver el formulario directamente sin registrarme,  
**para** poder hacer una solicitud diagnóstica para mi paciente de forma rápida.

**Criterios de aceptación:**
- [ ] El link abre el formulario directamente, sin pantalla de login
- [ ] El formulario carga en menos de 3 segundos en 4G
- [ ] El formulario es usable en smartphone (Chrome y Safari)
- [ ] Se muestra el logo y nombre del programa del tenant

---

### US-02 — Llenar datos del médico
**Como** médico,  
**quiero** ingresar mis datos profesionales una vez por solicitud,  
**para** que el programa tenga mis datos de contacto y mi información para enviarme los resultados.

**Campos requeridos:** Nombre completo, Especialidad, Tipo de registro médico, Número de registro, Email, WhatsApp/Teléfono, Institución (opcional), Ciudad.

**Criterios de aceptación:**
- [ ] Todos los campos obligatorios marcados con asterisco
- [ ] Si intento continuar sin llenar un campo obligatorio, se muestra el error directamente en el campo
- [ ] El campo de email valida formato antes de continuar
- [ ] El tipo de registro médico varía según el país seleccionado (TP en Colombia, CRM en Ecuador, etc.)

---

### US-03 — Llenar datos del paciente
**Como** médico,  
**quiero** ingresar los datos de mi paciente en el formulario,  
**para** que el programa pueda contactarlo y gestionar su caso.

**Criterios de aceptación:**
- [ ] Tipos de documento varían según el país seleccionado
- [ ] El teléfono es el dato de contacto principal (email es opcional)
- [ ] Puedo indicar si el paciente tiene un representante legal
- [ ] Si marco representante legal, aparecen los campos de nombre, documento y parentesco del representante
- [ ] Al desmarcar representante legal, los campos se ocultan y borran

---

### US-04 — Seleccionar exámenes a solicitar
**Como** médico,  
**quiero** seleccionar los exámenes que necesito para mi paciente,  
**para** que el programa gestione exactamente lo que solicité.

**Criterios de aceptación:**
- [ ] Los exámenes disponibles dependen del programa (Wilson, DAAT o Duchenne)
- [ ] Para Wilson: puedo seleccionar Ceruloplasmina y/o Cobre en orina
- [ ] Para DAAT: puedo seleccionar Alfa-1 Antitripsina y/o PCR
- [ ] Para Duchenne: solo aparece CK (Creatinkinasa) como opción sérica
- [ ] Puedo ingresar el diagnóstico presuntivo en texto libre

---

### US-05 — Adjuntar resultado sérico previo (Duchenne)
**Como** médico que ya tiene el resultado de CK de mi paciente,  
**quiero** adjuntarlo directamente en el formulario,  
**para** que el programa pueda evaluar directamente si hay indicación genética sin necesitar otra toma de muestra.

**Criterios de aceptación:**
- [ ] Puedo ingresar el valor numérico de CK (acepta decimales y texto)
- [ ] Puedo adjuntar el PDF del resultado (máximo 10MB)
- [ ] Puedo indicar si el resultado es Positivo / Negativo / Borderline
- [ ] Si no adjunto resultado previo, el formulario procede normalmente (se hará la toma)

---

### US-06 — Leer y aceptar el consentimiento como médico
**Como** médico,  
**quiero** leer el texto del consentimiento informado del programa y aceptarlo,  
**para** autorizar el tratamiento de los datos de mi paciente conforme a la ley del país.

**Criterios de aceptación:**
- [ ] El texto del consentimiento es visible antes de enviar
- [ ] El consentimiento corresponde al país que seleccioné
- [ ] Para Duchenne: el consentimiento cambia automáticamente al cambiar el país
- [ ] No puedo enviar el formulario sin haber aceptado el consentimiento
- [ ] Al enviar, se registra: timestamp, IP y user-agent del dispositivo

---

### US-07 — Recibir confirmación de solicitud
**Como** médico,  
**quiero** ver una pantalla de confirmación tras enviar el formulario,  
**para** saber que mi solicitud fue recibida correctamente.

**Criterios de aceptación:**
- [ ] Aparece una pantalla de éxito con el nombre del programa y email de contacto
- [ ] Se indica que el equipo se comunicará pronto con el paciente
- [ ] El formulario no se puede reenviar haciendo refresh (prevención de duplicados)

---

## Épica 2: Autorización del Paciente (Link Privado)

### US-08 — Abrir el link de autorización
**Como** paciente mayor de 60 años,  
**quiero** abrir el link que me enviaron por WhatsApp y entender inmediatamente de qué se trata,  
**para** poder decidir si autorizo o no los exámenes que me solicitaron.

**Criterios de aceptación:**
- [ ] El link abre directamente el formulario, sin login
- [ ] Se muestra claramente el nombre del médico, su especialidad y los exámenes solicitados
- [ ] El texto usa lenguaje simple, sin términos médicos ni legales complejos
- [ ] La fuente no es menor a 18px en mobile
- [ ] Si el link está expirado, aparece un mensaje claro con el contacto del programa

---

### US-09 — Verificar y corregir mis datos
**Como** paciente,  
**quiero** ver los datos que registró mi médico sobre mí y reportar si hay algún error,  
**para** que mi caso esté correctamente registrado.

**Criterios de aceptación:**
- [ ] Se muestran: nombre, tipo y número de documento, ciudad, teléfono
- [ ] Hay un botón o campo "Hay un error en mis datos" que abre un área de texto
- [ ] El texto que escriba llega al admin como una nota en el caso
- [ ] Reportar un error no impide autorizar

---

### US-10 — Leer el consentimiento informado
**Como** paciente,  
**quiero** poder leer el consentimiento completo antes de tomar una decisión,  
**para** entender qué implica autorizar.

**Criterios de aceptación:**
- [ ] El consentimiento está colapsado por defecto para no abrumar al paciente
- [ ] Hay un botón claro "Ver consentimiento completo" que lo despliega
- [ ] El texto del consentimiento corresponde al país del caso
- [ ] El texto es legible (mínimo 16px, contraste suficiente)

---

### US-11 — Autorizar los exámenes
**Como** paciente,  
**quiero** autorizar los exámenes con mi nombre completo,  
**para** dar mi consentimiento informado de manera legal y trazable.

**Criterios de aceptación:**
- [ ] Hay un campo de texto para escribir mi nombre completo
- [ ] El botón AUTORIZO solo se habilita si el campo de nombre tiene contenido
- [ ] El botón AUTORIZO es de color verde y de tamaño grande (mínimo 56px de altura)
- [ ] Al presionar AUTORIZO aparece una pantalla de confirmación clara
- [ ] La respuesta registra: nombre escrito, timestamp, IP, user-agent
- [ ] El link queda inutilizable después de autorizar

---

### US-12 — No autorizar los exámenes
**Como** paciente,  
**quiero** poder declinar la autorización si no quiero participar,  
**para** ejercer mi derecho a no participar en el programa.

**Criterios de aceptación:**
- [ ] El botón NO AUTORIZO es visible y de color diferenciado (rojo)
- [ ] Al presionar NO AUTORIZO aparece un campo opcional de motivo
- [ ] Se puede confirmar el rechazo sin escribir motivo
- [ ] El admin ve el caso con estado NO_ACEPTO en el panel

---

### US-13 — Firmar como representante legal
**Como** familiar o representante legal de un paciente que no puede firmar,  
**quiero** poder autorizar en nombre del paciente,  
**para** que el caso pueda continuar con la debida autorización legal.

**Criterios de aceptación:**
- [ ] Si el médico registró un representante, el formulario del paciente muestra los datos del representante
- [ ] El campo de nombre se llena con el nombre del representante
- [ ] La declaración indica "autorizo en calidad de representante legal"
- [ ] Los datos del representante quedan registrados en el caso

---

## Épica 3: Gestión Admin de Casos

### US-14 — Ver el dashboard de casos
**Como** administrador,  
**quiero** ver un resumen visual de todos los casos activos por estado y programa,  
**para** saber cuántos casos están pendientes de gestión y en qué etapa están.

**Criterios de aceptación:**
- [ ] El dashboard muestra tarjetas de conteo por estado (Solicitudes recibidas, Pendientes de autorización, Autorizados, Programados, etc.)
- [ ] Las tarjetas son clicables y filtran la lista de casos
- [ ] Se puede filtrar por programa (Wilson / DAAT / Duchenne)
- [ ] Los datos se actualizan en tiempo real (TanStack Query con refetch)

---

### US-15 — Buscar y filtrar casos
**Como** operador,  
**quiero** buscar casos por nombre del paciente, número de documento o nombre del médico, y filtrar por estado, programa y fecha,  
**para** encontrar rápidamente el caso que necesito gestionar.

**Criterios de aceptación:**
- [ ] Buscador por nombre o documento del paciente
- [ ] Filtros: programa, estado, país, mes de solicitud, laboratorio
- [ ] La lista muestra: consecutivo, nombre del paciente (iniciales), médico, estado, fecha de solicitud
- [ ] Los filtros se pueden combinar
- [ ] Paginación de 20 casos por página

---

### US-16 — Ver el detalle completo de un caso
**Como** administrador,  
**quiero** ver todos los datos de un caso en una sola pantalla,  
**para** tener toda la información necesaria para gestionarlo.

**Criterios de aceptación:**
- [ ] Se muestran: datos del médico, datos del paciente, exámenes solicitados, estado actual, historial de estados con timestamps
- [ ] Se muestra el resultado previo adjunto si el médico lo subió
- [ ] Se muestran las respuestas del paciente (autorización + corrección de datos si la hubo)
- [ ] Se muestra el resultado sérico si ya fue registrado
- [ ] Se muestra el resultado genético si aplica
- [ ] El historial de estados está ordenado cronológicamente

---

### US-17 — Generar el link del paciente
**Como** administrador,  
**quiero** generar el link de autorización para el paciente con un clic y copiarlo automáticamente,  
**para** enviárselo por WhatsApp sin fricción.

**Criterios de aceptación:**
- [ ] Hay un botón "Generar link para el paciente" en el detalle del caso
- [ ] Al presionar, el link se copia al portapapeles automáticamente
- [ ] Se muestra confirmación de que fue copiado
- [ ] Se indica la fecha de expiración del link (72h desde generación)
- [ ] Si ya hay un link activo, aparece un botón "Reenviar (invalida el anterior)"

---

### US-18 — Cambiar el estado de un caso manualmente
**Como** administrador,  
**quiero** poder cambiar el estado de un caso manualmente cuando la situación lo requiera,  
**para** mantener el registro actualizado aunque el cambio no haya ocurrido en la plataforma.

**Criterios de aceptación:**
- [ ] Hay un selector de estado con los estados válidos disponibles
- [ ] Se pide confirmación antes de cambiar
- [ ] El cambio queda registrado en el historial con actor + timestamp
- [ ] Solo ADMIN puede cambiar estados manualmente; OPERADOR solo puede en estados operativos

---

### US-19 — Registrar resultado sérico
**Como** operador,  
**quiero** registrar el resultado de la prueba sérica del paciente,  
**para** que el sistema evalúe si hay indicación para la prueba genética.

**Criterios de aceptación:**
- [ ] Puedo ingresar el valor de cada resultado (numérico + unidad)
- [ ] Puedo registrar la fecha de toma de muestra, fecha de reporte, fechas de envío y medio usado
- [ ] Al guardar, el sistema evalúa automáticamente si el resultado supera el umbral del programa
- [ ] El sistema muestra un indicador: "Con indicación genética" / "Sin indicación genética"
- [ ] Puedo ver los valores de referencia del programa para comparar

---

### US-20 — Registrar resultado genético
**Como** operador,  
**quiero** registrar el resultado de la prueba genética con el texto completo del reporte, el gen analizado y el fenotipo,  
**para** tener el caso completamente documentado en la plataforma.

**Criterios de aceptación:**
- [ ] Campo de texto largo para el resultado completo del reporte
- [ ] Selector de fenotipo (para DAAT: MM/MS/MZ/SZ/ZZ; para Wilson: portador/positivo/negativo)
- [ ] Campo para el laboratorio genético utilizado
- [ ] Fechas de toma y resultado de la prueba genética
- [ ] El caso puede marcarse como COMPLETADO tras registrar el resultado

---

### US-21 — Registrar seguimiento clínico (Wilson)
**Como** operador,  
**quiero** registrar el estado de seguimiento clínico de los casos de Wilson con resultado positivo,  
**para** tener trazabilidad del tratamiento y evolución del paciente.

**Criterios de aceptación:**
- [ ] Opciones de seguimiento: Negativo, Portador, Positivo, En tratamiento, Formulado, Trasplantado, Drop out, Fallecido
- [ ] Solo disponible para casos del programa Wilson
- [ ] El seguimiento no cierra el caso — es información adicional
- [ ] Se puede actualizar el seguimiento múltiples veces con historial

---

## Épica 4: Importación de Datos Históricos

### US-22 — Importar el historial de Wilson desde Excel
**Como** administrador,  
**quiero** subir el archivo Excel de Wilson y ver un reporte de qué casos se pueden importar antes de confirmar,  
**para** migrar el historial sin perder datos y sin errores silenciosos.

**Criterios de aceptación:**
- [ ] Puedo subir un archivo .xlsx o .csv
- [ ] El sistema muestra el número de casos válidos, con advertencias y con errores
- [ ] Puedo descargar un reporte Excel de los errores con el número de fila y la descripción del error
- [ ] Puedo confirmar la importación solo de los casos válidos y con advertencias
- [ ] Los casos con error bloqueante (sin nombre del paciente) no se importan
- [ ] Los casos importados aparecen en la lista de casos con la nota "Migrado desde Excel"

---

### US-23 — Descargar plantilla de importación
**Como** administrador,  
**quiero** descargar una plantilla Excel con el formato exacto esperado por el sistema,  
**para** poder llenar nuevos casos en Excel y subirlos sin errores de formato.

**Criterios de aceptación:**
- [ ] La plantilla tiene encabezados en español con los nombres exactos de columnas
- [ ] Las columnas de estados tienen validación con dropdown en Excel
- [ ] La primera fila tiene un ejemplo de caso completo
- [ ] Hay una hoja de instrucciones con los valores aceptados por columna

---

## Épica 5: Gestión de Consentimientos

### US-24 — Ver y editar plantillas de consentimiento
**Como** administrador,  
**quiero** ver las plantillas de consentimiento activas por programa y país, y poder crear nuevas versiones,  
**para** mantener los textos legales actualizados sin afectar los casos ya firmados.

**Criterios de aceptación:**
- [ ] Se listan las plantillas activas agrupadas por programa y país
- [ ] Puedo ver el texto actual renderizado antes de editarlo
- [ ] Al crear una nueva versión, la anterior queda archivada automáticamente
- [ ] Los casos que usaron versiones anteriores mantienen la referencia a esa versión
- [ ] No puedo eliminar una plantilla que ya fue usada en un caso

---

### US-25 — Activar un consentimiento nuevo
**Como** administrador,  
**quiero** poder marcar una nueva versión del consentimiento como activa,  
**para** que los nuevos casos usen el texto actualizado.

**Criterios de aceptación:**
- [ ] Al activar la nueva versión, la anterior se desactiva automáticamente
- [ ] Solo puede haber una versión activa por programa + país + tipo
- [ ] Los casos nuevos creados después de la activación usan la nueva versión
- [ ] Los casos existentes mantienen la versión con la que fueron creados

---

## Épica 6: Reportes

### US-26 — Ver reporte de casos por período
**Como** administrador,  
**quiero** ver cuántos casos se gestionaron por período, programa, estado y laboratorio,  
**para** tener visibilidad del volumen y el avance del programa diagnóstico.

**Criterios de aceptación:**
- [ ] Filtros: programa, estado, país, laboratorio, mes/rango de fechas
- [ ] Indicadores: total de casos, porcentaje de autorización, casos con indicación genética
- [ ] Tabla descargable en Excel o CSV

---

### US-27 — Exportar datos a Excel
**Como** administrador,  
**quiero** exportar los casos filtrados a un archivo Excel,  
**para** compartirlo con otros miembros del equipo o hacer análisis externos.

**Criterios de aceptación:**
- [ ] El export incluye todos los campos de los casos filtrados
- [ ] Los campos de fecha están en formato DD/MM/AAAA
- [ ] El archivo se descarga automáticamente al presionar el botón
- [ ] El export respeta los filtros activos en la lista

---

## Épica 7: Multi-Tenant (SUPER_ADMIN)

### US-28 — Crear un nuevo tenant
**Como** SUPER_ADMIN,  
**quiero** crear un nuevo tenant con sus datos básicos y asignarle un slug único,  
**para** que una nueva empresa pueda usar la plataforma con su propia configuración.

**Criterios de aceptación:**
- [ ] Solo el SUPER_ADMIN puede crear tenants
- [ ] El slug debe ser único y solo letras minúsculas + guiones
- [ ] El tenant nuevo no tiene casos ni programas hasta que el SUPER_ADMIN los configure
- [ ] Los usuarios ADMIN del nuevo tenant están completamente aislados de otros tenants

---

### US-29 — Configurar branding de un tenant
**Como** SUPER_ADMIN,  
**quiero** configurar el logo, color primario y datos de contacto de cada tenant,  
**para** que los formularios públicos tengan la identidad visual de cada empresa.

**Criterios de aceptación:**
- [ ] Puedo subir un logo en PNG/SVG (máximo 2MB)
- [ ] El color primario se aplica a botones y acentos del formulario público
- [ ] El email y teléfono de contacto aparecen en el footer del formulario
- [ ] Los cambios se reflejan en el formulario público en menos de 5 segundos (cache revalidation)

---

## Matriz de historias por fase

| Historia | Fase | Prioridad | Estado |
|---------|------|----------|--------|
| US-01 a US-07 (Formulario médico) | Fase 5 | MVP | Pendiente |
| US-08 a US-13 (Paciente) | Fase 6 | MVP | Pendiente |
| US-14 a US-21 (Admin casos) | Fase 7 | MVP | Pendiente |
| US-22 a US-23 (Importación) | Fase 8 | MVP | Pendiente |
| US-24 a US-25 (Consentimientos) | Fase 10 | MVP | Pendiente |
| US-26 a US-27 (Reportes) | Fase 11 | Post-MVP | Pendiente |
| US-28 a US-29 (Multi-tenant) | Fase 1 | MVP (base) | Pendiente |
