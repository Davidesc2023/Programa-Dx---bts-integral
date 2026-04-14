# Personas — Sistema de Solicitud de Laboratorios

---

## Persona 1: Administrador del Sistema

**Nombre**: Carlos Méndez  
**Rol en el sistema**: `ADMIN`  
**Cargo real**: Coordinador de TI / Jefe de Sistemas del laboratorio

### Descripción
Carlos es el responsable de mantener el sistema operativo y correctamente configurado. Gestiona los usuarios, supervisa el acceso de todo el equipo y tiene visibilidad completa sobre todos los datos del sistema. No realiza operaciones clínicas directamente, pero es el garante de que el sistema funcione de forma segura y organizada.

### Motivaciones
- Centralizar toda la gestión en un solo sistema confiable
- Garantizar que cada rol solo acceda a lo que le corresponde
- Tener trazabilidad completa de quién hizo qué y cuándo
- Reducir los errores operativos originados por procesos manuales o desorganizados

### Contexto de uso
- Accede desde computador de escritorio en la oficina administrativa
- Usa el sistema varias veces a la semana para revisiones y gestión
- Requiere respuestas claras sobre errores y validaciones para escalarlos al equipo correctamente

### Pain Points actuales
- No puede saber quién creó o modificó un registro sin revisar planillas físicas
- Cuando un empleado cambia de rol o sale de la empresa, no hay forma fácil de revocar su acceso
- Frecuentes errores por datos duplicados o incompletos de pacientes

---

## Persona 2: Operador de Recepción

**Nombre**: Laura Gómez  
**Rol en el sistema**: `OPERADOR`  
**Cargo real**: Auxiliar de recepción / Digitador médico

### Descripción
Laura es la primera línea operativa del laboratorio. Es quien recibe al paciente, registra sus datos en el sistema y crea las órdenes de laboratorio que le indica el médico tratante. No tiene formación técnica profunda; necesita que el sistema sea claro, rápido y que le indique exactamente qué falta o qué salió mal cuando comete un error.

### Motivaciones
- Registrar pacientes y órdenes de forma rápida y sin errores
- Encontrar rápidamente a un paciente ya registrado para no duplicarlo
- Saber en todo momento en qué estado está una orden que ella creó
- Recibir mensajes de error claros que le digan exactamente qué corregir

### Contexto de uso
- Usa el sistema constantemente durante toda la jornada laboral
- Trabaja bajo presión con pacientes esperando en recepción
- Prefiere flujos cortos y formularios con validaciones en tiempo real

### Pain Points actuales
- Registra pacientes manualmente en papel o Excel, generando duplicados
- No tiene forma de saber si ya existe un paciente con el mismo documento
- Las órdenes se crean en papel y a veces se pierden o son ilegibles

---

## Persona 3: Técnico de Laboratorio

**Nombre**: Andrés Vargas  
**Rol en el sistema**: `LABORATORIO`  
**Cargo real**: Técnico o bacteriólogo de laboratorio

### Descripción
Andrés es quien procesa las muestras y registra los resultados de los exámenes. Recibe las órdenes ya creadas por el operador y debe actualizarlas conforme avanza el proceso clínico: recolectar muestra, iniciar análisis, completar. También registra los resultados de cada examen en la orden correspondiente. Necesita acceso rápido a la lista de órdenes pendientes y a los detalles de cada una.

### Motivaciones
- Ver rápidamente las órdenes pendientes de procesamiento sin tener que buscar en papel
- Actualizar el estado de una orden sin riesgo de saltarse pasos del proceso clínico
- Registrar resultados directamente en el sistema, asociados a la orden correcta
- Consultar el historial de resultados de un paciente si es necesario

### Contexto de uso
- Accede desde una tablet o computador en el área de laboratorio
- Trabaja con varias órdenes simultáneamente durante el turno
- Necesita que el sistema valide que no puede saltarse pasos en el flujo de estado

### Pain Points actuales
- Recibe las órdenes en papel con letra ilegible o datos incompletos
- No puede actualizar el estado fácilmente; debe buscar la planilla correcta
- Los resultados se registran en libros físicos y no hay forma de consultarlos históricamente desde recepción
