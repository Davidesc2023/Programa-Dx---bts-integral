# PRD — APP-DX (BTS Integral)
## Sistema de Gestión de Diagnósticos y Laboratorios Clínicos

**Versión:** 2.0  
**Última actualización:** 2026-06-10  
**Estado:** En producción activa — MVP funcional completo

---

## 1. Visión del Producto

APP-DX es una plataforma web SaaS clínica para gestionar el flujo completo de órdenes de laboratorio:

```
Médico crea orden → selecciona exámenes → firma consentimiento digital
→ paciente autoriza → laboratorio agenda y ejecuta → resultados disponibles
```

Orientado a clínicas y laboratorios colombianos con cumplimiento legal (Ley 1581/2012 Habeas Data, Res. 1995/1999).

---

## 2. Identidad Visual — Clinical Sanctuary

| Token | Valor |
|-------|-------|
| Color primario (teal) | `#1B7A6B` / `#006053` |
| Color acento (amarillo) | `#F5C518` / `#d0a600` |
| Color secundario (azul) | `#4490D9` / `#0061a3` |
| Fuente headline | Manrope |
| Fuente body | Inter |
| Fondo | `#f8fafa` |
| Sin bordes 1px — solo glassmorphism y sombras suaves |

---

## 3. Roles del Sistema

| Rol | Permisos principales |
|-----|---------------------|
| **ADMIN** | Todo — gestión de usuarios, catálogo, órdenes |
| **MEDICO** | Crear órdenes, firmar consentimientos, ver resultados |
| **OPERADOR** | Gestionar órdenes, enviar consentimientos al paciente |
| **LABORATORIO** | Cargar resultados, ver órdenes asignadas |
| **PACIENTE** | Portal self-service — ver órdenes, autorizar consentimientos, descargar resultados |

---

## 4. Flujo Principal

### 4.1 Crear Orden Médica
- Médico selecciona paciente + doctor (o crea nuevo paciente)
- Selecciona exámenes del **catálogo de laboratorio** con:
  - Búsqueda por nombre/código
  - Categorías colapsables
  - Lock icon para exámenes con prerequisito no cumplido
  - Validación de prerequisitos por paciente (ej. A1A-S requerido antes de A1A-G)
- Fija prioridad (Normal / Urgente), fecha estimada, diagnóstico, observaciones
- Botón "Generar Orden y Consentimiento" — crea orden + exámenes en batch

### 4.2 Firma Médica del Consentimiento
- Panel "Revisar y Firmar" abre modal con:
  - **Documento legal completo** visible (Ley 1581, declaración consentimiento, datos paciente/médico)
  - **Pad de firma digital** canvas (mouse + touch)
  - Checkbox de aceptación
  - Notas opcionales
- Al firmar: backend genera `documentHtml` con firma embebida, estado → `FIRMADO_MEDICO`

### 4.3 Envío al Paciente
- Operador/Médico cambia estado a `ENVIADO_PACIENTE`
- Paciente recibe notificación in-app

### 4.4 Autorización del Paciente (Portal)
- Portal muestra tarjetas de paciente y orden
- Lista de exámenes solicitados
- Visor del documento HTML completo (colapsable)
- **Pad de firma digital** (gate — debe firmar antes de poder aceptar)
- Botones: Rechazar / Aceptar y Firmar
- Si acepta: se genera PDF con ambas firmas y se sube a R2/S3

### 4.5 Estados de la Orden (State Machine)

```
PENDIENTE → CONSENT_PENDING → ACCEPTED → SCHEDULED
         ↘  RECHAZADA
ACCEPTED → MUESTRA_RECOLECTADA → EN_ANALISIS → COMPLETADA
         ↘  CANCELADA
```

---

## 5. Catálogo de Exámenes

### Tipos
- `NIVEL_SERICO` — medición sérica (requiere toma de sangre)
- `GENETICO` — estudio genético (puede tener prerequisito sérico)
- `PANEL` — grupo de exámenes
- `IMAGEN` — radiografía, ecografía
- `MICROBIOLOGIA` — cultivos
- `OTRO`

### Prerequisitos
- Modelo self-referenciante: `requiresResultFromId`
- Ejemplo: Alfa-1 Antitripsina Genética (A1A-G) requiere resultado de A1A-S
- API: `GET /lab-tests/:id/prerequisite/:patientId` — valida si el paciente tiene resultado completado

### Seed incluido (15 exámenes)
HEM, GLI, COL, TSH, URI, HBA1C, PCR, FER, CUL, RX-TX, ECO-AB, HCV-Ab, VIT-D, A1A-S, A1A-G

---

## 6. Consentimiento Informado Digital

### Documento HTML
- Generado server-side en `buildConsentHtml()` (pdf.service.ts)
- Incluye: datos orden, datos paciente, médico tratante, declaración legal (Ley 1581/2012), espacio de firmas
- Firma del médico embebida como imagen PNG base64
- PDF generado con Puppeteer/Chromium cuando paciente acepta → subido a R2

### Compliance colombiano
- Ley 1581 de 2012 (Protección de Datos Personales)
- Resolución 1995 de 1999 (Historia Clínica)
- Ley 527 de 1999 (Comercio Electrónico — validez firma electrónica)
- Sello de tiempo en cada firma

---

## 7. Portal del Paciente

- Autenticación con cuenta propia (rol `PACIENTE`)
- Dashboard: órdenes activas, consentimientos pendientes, resultados disponibles, próxima cita
- Historial de órdenes con estado visual
- Descarga de resultados (PDF + imágenes)
- Gestión de consentimientos (aceptar/rechazar con firma digital)
- Citas agendadas

---

## 8. Infraestructura

| Componente | Tecnología | Estado |
|-----------|-----------|--------|
| Backend API | NestJS + TypeScript | Railway ✅ |
| Base de datos | PostgreSQL (Supabase App_DX) | Listo para migrar |
| ORM | Prisma 5.x | ✅ |
| Frontend | Next.js 14 (App Router) | Vercel ✅ |
| Autenticación | JWT (access + refresh tokens) | ✅ |
| Almacenamiento de archivos | Cloudflare R2 / AWS S3 | ✅ |
| PDF | Puppeteer + @sparticuz/chromium | ✅ |
| State management | Zustand + TanStack Query | ✅ |

### Migración Railway → Supabase
- Schema aplicado en proyecto `App_DX` (wwosggahpasvoexshrdl, us-east-2)
- Para activar: actualizar `DATABASE_URL` en Railway → `postgresql://postgres:[PASSWORD]@db.wwosggahpasvoexshrdl.supabase.co:5432/postgres`

---

## 9. Pendiente / Roadmap

### Alta prioridad
- Registro de médicos con flujo de aprobación admin
- Timeline visual del estado de la orden (UX)
- Agendamiento con calendario UI
- Firma del paciente embebida en el PDF final

### Media prioridad
- Notificaciones push (Web Push / WhatsApp simulado)
- Upload de resultados con drag & drop
- Multitenancy / branding configurable por cliente

### Deuda técnica
- Eliminar campo legacy `patientResponseAt` del schema Prisma
- Tests de integración en frontend (zero cobertura actual)

---

## 10. Seguridad

- 0 vulnerabilidades en npm audit
- JWT + bcrypt + rate limiting + Helmet + CORS configurado
- Archivos subidos: validación MIME, límite de tamaño, propietario verificado
- Soft delete en todas las entidades principales
- RLS en Supabase (pendiente configurar para App_DX)
