# 🎨 Prompt Avanzado — Diseño UX/UI APP-DX (BTS Integral)

## 🎯 Contexto

Diseñar una aplicación web **responsive (mobile-first + tablet + desktop)** para un sistema de **gestión de diagnósticos y laboratorios clínicos** llamado:

**APP-DX — BTS Integral**

La aplicación debe permitir gestionar todo el flujo clínico:

* Médico crea orden
* Médico firma consentimiento
* Paciente recibe notificación
* Paciente firma consentimiento + autorización (Habeas Data)
* Se agenda examen
* Se realiza el laboratorio
* Se cargan resultados (médico / paciente / operador)

---

## 🎨 Identidad Visual (OBLIGATORIO)

Basado en marca **BTS Integral**:

* 🎯 Color primario: `#1B7A6B` (teal clínico)
* ✨ Color acento: `#F5C518` (amarillo)
* 🔵 Color secundario: `#4490D9` (azul)
* ⚪ Fondo: blanco / gris muy claro
* 🧱 UI limpia tipo **health-tech SaaS moderno**

Estilo:

* Minimalista
* Profesional médico
* Alta legibilidad
* Espaciado generoso
* Bordes redondeados (8–16px)
* Sombras suaves

---

## 🧩 Arquitectura UX

### Roles del sistema:

1. Médico
2. Paciente
3. Operador/Laboratorio
4. Admin

---

## 🔐 Flujo Principal (CRÍTICO)

### 1. Registro Médico

* Formulario:

  * Nombre completo
  * Tipo y número de documento
  * Especialidad
  * Registro médico
  * Email
  * Teléfono
  * Contraseña

* Estado:

  * `PENDIENTE_APROBACION`

* Pantalla:

  * "Tu cuenta está en revisión"

---

### 2. Aprobación (Admin)

* Lista de médicos pendientes
* Botón: **Aprobar / Rechazar**

---

### 3. Consentimiento del Médico

Antes de usar el sistema:

* Mostrar documento legal (scrollable)
* Checkbox:

  * "Acepto términos y consentimiento informado"
* Botón:

  * **Firmar consentimiento**

📄 Generar:

* PDF automático
* Guardar en S3

---

### 4. Dashboard Médico

Secciones:

* Crear orden
* Mis órdenes
* Pacientes
* Resultados

---

### 5. Crear Orden Médica

Formulario:

* Paciente:

  * Nombre
  * Documento
  * Email
  * Teléfono

* Exámenes:

  * Lista dinámica (multi-select)
  * Ejemplos:

    * Alfa-1 Antitripsina
    * Serpina 1
    * Niveles séricos
    * Coagulación

* Prioridad:

  * Normal / Urgente

* Notas médicas

Botón:

* **Crear orden + generar consentimiento**

---

### 6. Consentimiento del Paciente

El paciente recibe:

* Email
* WhatsApp (simulado UI)
* Link seguro

Pantalla:

* Mostrar:

  * Documento HTML completo
  * Datos del médico
  * Datos del paciente
  * Lista de exámenes

* Acciones:

  * ❌ Rechazar
  * ✅ Aceptar y firmar

📄 Resultado:

* Generar PDF firmado
* Guardar en S3

---

### 7. Cambio de Estado

Estados visibles:

* Pendiente
* En proceso
* Agendado
* Muestra recolectada
* En análisis
* Completado
* Rechazado

---

### 8. Agendamiento

UI operador:

* Calendario
* Selección fecha/hora
* Asociación a orden

---

### 9. Resultados

Carga por:

* Médico
* Paciente
* Laboratorio

Soporte:

* PDF
* Imágenes

UI:

* Upload drag & drop
* Lista de archivos
* Botón descargar

---

## 🧠 Reglas UX

* Mostrar siempre estado visible
* Feedback inmediato (toasts)
* Validaciones claras
* Confirmaciones en acciones críticas

---

## 🔐 Legal & Compliance (COLOMBIA)

Incluir:

* Autorización de datos personales (Ley 1581 de 2012)
* Habeas Data
* Consentimiento informado médico

Cada firma:

* Timestamp
* Nombre
* IP (simulado)
* PDF descargable

---

## 🏗️ Multitenancy

El sistema debe permitir:

* Múltiples clínicas o clientes
* Branding configurable por tenant
* Aislamiento de datos

UI:

* Selector de tenant (opcional)
* Logo dinámico

---

## 📱 Responsive Design

Diseñar para:

* Mobile (prioridad)
* Tablet
* Desktop

Patrones:

* Sidebar colapsable
* Cards en mobile
* Tablas en desktop

---

## ✨ Extras UX (IMPORTANTE)

* Timeline visual del estado de la orden
* Indicadores de progreso
* Notificaciones tipo inbox
* Vista tipo “historial clínico”

---

## 🎯 Output esperado

Generar:

* Pantallas completas:

  * Login
  * Registro médico
  * Dashboard
  * Crear orden
  * Consentimiento paciente
  * Resultados
  * Agendamiento

* Componentes reutilizables

* Diseño consistente con marca

---

## 🚀 Instrucción Final

Diseñar como un **producto SaaS clínico real listo para producción**, no como mockup básico.

Priorizar:

* Claridad
* Flujo legal completo
* Experiencia del usuario
* Escalabilidad
