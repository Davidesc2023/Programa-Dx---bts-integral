# MVP — APP-DX (BTS Integral)
## Sistema de Gestión de Diagnósticos y Laboratorios Clínicos

**Versión:** 2.0
**Última actualización:** 2026-06-10
**Estado:** MVP COMPLETADO — En producción activa

---

## Alcance del MVP

El MVP cubre el flujo clínico completo desde la creación de la orden hasta la autorización del paciente, con firma digital en ambos extremos.

---

## Funcionalidades completadas

### Autenticación y roles
- [x] Registro e inicio de sesión con JWT (access + refresh tokens)
- [x] 5 roles: ADMIN, MEDICO, OPERADOR, LABORATORIO, PACIENTE
- [x] Guards por rol en todos los endpoints sensibles
- [x] Rate limiting, bcrypt, Helmet, CORS

### Gestión de pacientes
- [x] CRUD completo de pacientes
- [x] Búsqueda por nombre / documento
- [x] Soft delete

### Catálogo de exámenes
- [x] 6 tipos: NIVEL_SERICO, GENETICO, PANEL, IMAGEN, MICROBIOLOGIA, OTRO
- [x] 15 exámenes pre-cargados (HEM, GLI, COL, TSH, URI, HBA1C, PCR, FER, CUL, RX-TX, ECO-AB, HCV-Ab, VIT-D, A1A-S, A1A-G)
- [x] Prerequisitos entre exámenes (self-referenciante `requiresResultFromId`)
- [x] API de validación de prerequisitos por paciente

### Órdenes médicas
- [x] Crear orden con paciente, médico, prioridad (Normal/Urgente), fecha estimada, diagnóstico
- [x] Selección de exámenes desde catálogo (batch)
- [x] Lock icon para exámenes con prerequisito no cumplido
- [x] Estado de la orden: PENDIENTE → CONSENT_PENDING → ACCEPTED → SCHEDULED → MUESTRA_RECOLECTADA → EN_ANALISIS → COMPLETADA | RECHAZADA | CANCELADA
- [x] Listado con filtros y paginación

### Consentimiento informado digital
- [x] Generación de documento HTML legal (Ley 1581/2012, Res. 1995/1999, Ley 527/1999)
- [x] Pad de firma digital canvas (mouse + touch + retina DPI) para médico
- [x] Firma del médico embebida como PNG base64 en el documento
- [x] Envío del consentimiento al paciente
- [x] Pad de firma digital canvas para el paciente (gate — obligatorio antes de aceptar)
- [x] Generación de PDF con ambas firmas mediante Puppeteer/Chromium
- [x] Subida del PDF a Cloudflare R2

### Portal del paciente
- [x] Autenticación propia con rol PACIENTE
- [x] Dashboard: órdenes activas, consentimientos pendientes, resultados, próxima cita
- [x] Visor de documento HTML completo (colapsable)
- [x] Aceptar / rechazar consentimiento con firma digital
- [x] Historial de órdenes con estado visual
- [x] Descarga de resultados (PDF + imágenes)

### Resultados de laboratorio
- [x] Carga de resultados por LABORATORIO / ADMIN
- [x] Visualización por MEDICO y PACIENTE

### Notificaciones
- [x] Sistema in-app sin dependencia de email
- [x] Bell indicator con conteo de no leídas
- [x] Página de notificaciones con mark-as-read

### Infraestructura
- [x] Backend NestJS en Railway
- [x] Frontend Next.js 14 (App Router) en Vercel
- [x] Base de datos PostgreSQL en Supabase App_DX (`wwosggahpasvoexshrdl`, us-east-2)
- [x] ORM Prisma 5.x con schema completo aplicado
- [x] Almacenamiento de archivos en Cloudflare R2
- [x] 0 vulnerabilidades en npm audit

---

## Fuera del MVP actual (roadmap)

| Feature | Prioridad |
|---------|-----------|
| Registro de médicos con aprobación admin | Alta |
| Timeline visual del estado de la orden | Alta |
| Agendamiento con calendario UI | Alta |
| Firma del paciente embebida en PDF final | Media |
| Push notifications (Web Push / WhatsApp) | Media |
| Upload de resultados con drag & drop mejorado | Media |
| Multitenancy / branding por cliente | Baja |
| Tests de integración frontend | Deuda técnica |
| Eliminar campo legacy `patientResponseAt` | Deuda técnica |

---

## Cumplimiento legal colombiano

- Ley 1581 de 2012 — Protección de Datos Personales (Habeas Data)
- Resolución 1995 de 1999 — Historia Clínica
- Ley 527 de 1999 — Comercio Electrónico (validez firma electrónica)
- Sello de tiempo en cada firma digital
