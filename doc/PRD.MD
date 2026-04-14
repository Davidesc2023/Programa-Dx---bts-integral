# 📘 PRD — Sistema de Solicitud y Gestión de Laboratorios (APP-DX)

---

## 🎯 1. Visión del Producto

Desarrollar una plataforma digital que permita gestionar de forma integral el ciclo de solicitud de exámenes de laboratorio, desde la orden médica inicial hasta la carga y consulta de resultados, garantizando trazabilidad, validación clínica y consentimiento informado del paciente.

---

## 🧩 2. Problema

Actualmente el proceso presenta:

- Falta de trazabilidad entre solicitud, autorización y resultado  
- Procesos manuales (firmas físicas, documentos dispersos)  
- Riesgo legal por ausencia de consentimiento formal  
- Descoordinación entre médico, paciente y laboratorio  

---

## 💡 3. Solución

Una plataforma centralizada que permita:

1. Creación de orden médica por el médico  
2. Firma digital del consentimiento por el médico  
3. Envío de la solicitud al paciente  
4. Aceptación o rechazo del paciente  
5. Notificación automática del estado  
6. Programación de toma de muestras  
7. Ejecución del examen  
8. Carga de resultados  
9. Consulta de resultados por médico y paciente  

---

## 👤 4. Actores del Sistema

### 🩺 Médico
- Crea la orden
- Firma el consentimiento
- Consulta resultados
- Puede cargar resultados

### 🧍 Paciente
- Recibe la solicitud
- Acepta o rechaza el consentimiento
- Consulta resultados
- Puede cargar resultados

### 🧪 Laboratorio / Operador
- Agenda la toma de muestras
- Ejecuta los exámenes
- Carga resultados

### 🛠️ Administrador
- Gestiona usuarios
- Configura el sistema

---

## 🔄 5. Flujo Funcional Principal

```text
Médico crea orden
        ↓
Firma consentimiento
        ↓
Se envía al paciente
        ↓
Paciente decide:
   ├── ❌ Rechaza → FIN DEL PROCESO
   └── ✅ Acepta
            ↓
   Notificación automática
            ↓
   Se agenda toma de muestras
            ↓
   Se realiza examen
            ↓
   Se cargan resultados
            ↓
   Médico/Paciente consultan resultados

   🧱 6. Módulos del Sistema
6.1 Órdenes Médicas
Crear orden
Asociar paciente
Definir exámenes
Gestionar estados

Campos clave:

patientId
doctorId
testList
status
priority
notes
6.2 Consentimiento
Generar documento
Firma del médico
Firma del paciente
Validación legal

Estados:

PENDING_DOCTOR_SIGNATURE
SIGNED_BY_DOCTOR
SENT_TO_PATIENT
ACCEPTED
REJECTED
6.3 Notificaciones
Notificar al paciente
Notificar aceptación/rechazo
Activar siguiente paso del flujo
6.4 Agendamiento
Crear cita
Asociar a orden y paciente
Manejo de fechas
6.5 Resultados
Registrar resultados
Permitir carga por:
laboratorio
médico
paciente
Adjuntar archivos (PDF, imágenes)
🔁 7. Estados del Proceso
Estados principales
CREATED
→ CONSENT_PENDING
→ SENT_TO_PATIENT
→ ACCEPTED
→ SCHEDULED
→ SAMPLE_COLLECTED
→ IN_ANALYSIS
→ COMPLETED
Estados alternos
REJECTED
CANCELLED
📜 8. Reglas de Negocio
Consentimiento
Sin aceptación del paciente no se puede continuar
Si el paciente rechaza, el proceso termina
El médico debe firmar antes de enviar
Órdenes
Deben estar asociadas a un paciente válido
No pueden avanzar sin consentimiento aceptado
Resultados
Solo se pueden cargar si la orden está en estado válido
🔐 9. Seguridad
Autenticación con JWT
Control por roles:
Admin
Médico
Operador
Paciente
Validación estricta de acceso a datos
📊 10. Métricas de Éxito
% de órdenes completadas
Tiempo desde creación hasta resultado
% de consentimientos aceptados
Reducción de procesos manuales
⚠️ 11. Restricciones Técnicas
Backend: NestJS
ORM: Prisma
Base de datos: PostgreSQL
Validación: class-validator
Arquitectura: modular
🚀 12. Alcance MVP

Incluye:

Gestión de pacientes
Creación de órdenes
Validación de datos
Persistencia en base de datos
🔜 13. Próximas Iteraciones
Consentimiento digital completo
Flujo clínico automatizado
Resultados
Notificaciones
Agendamiento
🧠 14. Punto Crítico del Sistema

El sistema depende del consentimiento del paciente:

❌ Si el paciente NO acepta → el proceso termina
✅ Si el paciente acepta → se habilita todo el flujo clínico

Esto garantiza cumplimiento legal, trazabilidad y control del proceso.