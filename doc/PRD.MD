# PRD — APP-DX v2.0
## Plataforma Multi-Tenant de Gestión de Programas Diagnósticos

**Versión:** 2.0  
**Última actualización:** 2026-06-12  
**Estado:** En diseño — Rediseño arquitectural completo  
**Propietario del producto:** BTS Integral / Valentech Pharma Colombia S.A.S.

---

## 1. Visión del Producto

APP-DX es una plataforma SaaS multi-tenant para gestionar programas de apoyo diagnóstico de enfermedades raras. Conecta médicos, pacientes y equipos administrativos a través de **links públicos y tokens seguros**, sin requerir que médicos ni pacientes creen cuentas de usuario.

### Problema que resuelve

Los programas diagnósticos actuales (Wilson, DAAT, Duchenne) se gestionan con:
- Formularios dispersos en MoreApp (6 formularios diferentes)
- Hojas de Excel manuales para rastrear estados (~789 casos DAAT, ~117 Wilson)
- Reproceso constante al copiar datos entre formularios y Excel
- Sin trazabilidad de consentimientos ni auditoría legal
- Sin soporte multi-país para marcos legales de protección de datos

### Solución

Un flujo digital trazable de extremo a extremo:

```
Médico llena form (link público) → Admin gestiona el caso → Paciente autoriza (link privado)
→ Admin agenda cita → Admin carga resultado sérico → Evaluación indicación genética
→ [si aplica] Prueba genética → Resultado final → Seguimiento
```

---

## 2. Actores del Sistema

### 2.1 Actores internos (con cuenta)

| Rol | Descripción |
|-----|-------------|
| **SUPER_ADMIN** | Gestiona todos los tenants, programas globales y configuración de la plataforma |
| **ADMIN** | Gestiona casos, consentimientos y reportes de un tenant específico |
| **OPERADOR** | Gestiona casos del día a día: agendamiento, resultados, comunicaciones |

### 2.2 Actores externos (sin cuenta — usan links)

| Actor | Acceso | Descripción |
|-------|--------|-------------|
| **Médico** | Link público permanente por programa | Llena la orden médica con datos del paciente y solicita los exámenes |
| **Paciente** | Link privado único por caso (72h) | Confirma sus datos y autoriza el consentimiento informado |

> Los médicos y pacientes **nunca crean cuentas**. El médico recibe el link público una vez del equipo comercial y lo usa para todos sus pacientes.

---

## 3. Arquitectura Multi-Tenant

Cada **tenant** es una empresa farmacéutica u operadora de programas diagnósticos.

```
Tenant: BTS Integral
  ├── Programa: Wilson (ATP7B)
  ├── Programa: DAAT / Alfa-1 Antitripsina (SERPINA1)
  └── Programa: Duchenne (DMD)

Tenant: Otra Pharma (futuro)
  └── Programa: Custom
```

### 3.1 Aislamiento de datos

- Cada caso, consentimiento y usuario admin pertenece a un `tenant_id`
- Row Level Security (RLS) en Supabase garantiza que un tenant nunca accede a datos de otro
- El SUPER_ADMIN tiene vista global sin RLS

### 3.2 Links por tenant y programa

```
/solicitud/[tenant-slug]/wilson       ← link público del médico
/solicitud/[tenant-slug]/alfa1        ← link público del médico
/solicitud/[tenant-slug]/duchenne     ← link público del médico
/autorizar/[token-64-chars]           ← link privado del paciente
/resultados/[token-64-chars]          ← link de resultados
```

### 3.3 Branding por tenant

Cada tenant configura: logo, color primario, nombre del programa, email y teléfono de contacto. El formulario público refleja el branding del tenant.

---

## 4. Programas Diagnósticos

### 4.1 Enfermedad de Wilson (ATP7B)

| Campo | Valor |
|-------|-------|
| Gen | ATP7B |
| Prueba sérica | Ceruloplasmina sérica + Cobre en orina 24h |
| Umbral indicación genética | Ceruloplasmina < 20 mg/dL **ó** Cobre > 60 µg/24h |
| Prueba genética | Secuenciación gen ATP7B |
| Laboratorios | Synlab, Gencell, Biotecgen, Mendelics, EPS |
| Seguimiento post-genética | Negativo / Portador / Positivo / En tratamiento / Formulado / Trasplantado / Drop out / Fallecido |

### 4.2 Déficit de Alfa-1 Antitripsina (DAAT / SERPINA1)

| Campo | Valor |
|-------|-------|
| Gen | SERPINA1 |
| Prueba sérica | Niveles Alfa-1 Antitripsina + PCR |
| Umbral indicación genética | Alfa-1 ≤ 110 mg/dL |
| Prueba genética | Secuenciación gen SERPINA1 |
| Fenotipos posibles | MM, MS, MZ, SZ, ZZ, MMmalton |
| Laboratorios | Gencell, Colcan, EPS, Synlab |

### 4.3 Distrofia Muscular de Duchenne (DMD)

| Campo | Valor |
|-------|-------|
| Gen | DMD |
| Prueba sérica | Creatinkinasa (CK) sérica |
| Umbral indicación genética | CK elevada según criterio médico |
| Prueba genética | MLPA gen DMD |
| Resultado previo | Valor numérico/texto + PDF adjunto (obligatorio para solicitar genética) |

### 4.4 Extensibilidad

El sistema soporta nuevos programas sin cambios de código, configurables por el ADMIN desde el panel.

---

## 5. Flujo Funcional Completo

### Fase 0 — Solicitud del médico

1. El equipo comercial comparte el **link público** del programa al médico (WhatsApp/email). El médico lo usa para todos sus pacientes.
2. El médico abre el link → formulario en 3 bloques:
   - **Bloque A:** Datos del médico (nombre, especialidad, registro médico, email, WhatsApp, institución, ciudad, país)
   - **Bloque B:** Datos del paciente (nombre, tipo+número doc, género, EPS, teléfono, email, ciudad, departamento, dirección; opcionalmente representante legal)
   - **Bloque C:** Exámenes solicitados + consentimiento del médico (texto legal por país, read-only) + autorización
3. Para Duchenne: selector de país → consentimiento del médico cambia automáticamente. El médico puede adjuntar resultado de CK previo (valor + PDF).
4. El médico envía → caso creado con estado `SOLICITUD_RECIBIDA`.
5. El admin recibe notificación.

### Fase 1 — Autorización del paciente

6. Admin revisa el caso en el panel.
7. Admin genera **link privado del paciente** (token único, expira 72h).
8. Admin envía el link al paciente por WhatsApp o email.
9. Paciente abre el link → vista simplificada (letra grande, lenguaje simple):
   - Qué exámenes le solicitan y quién
   - Sus datos (puede reportar un error)
   - Consentimiento informado (desplegable)
   - Nombre completo para firmar + botones **AUTORIZO** / **NO AUTORIZO**
10. Respuesta registrada con timestamp + IP + user-agent.

### Fase 2 — Prueba sérica

11. Admin programa toma de muestra (laboratorio + sede + fecha).
12. Admin registra resultado sérico (valor numérico + unidad + fecha reporte + fechas de envío + medio).
13. Estado: `RESULTADO_SERICO_DISPONIBLE`.

### Fase 3 — Evaluación indicación genética

14. Sistema evalúa automáticamente si el resultado supera el umbral del programa.
15. Admin confirma o ajusta la indicación.
16. **CON INDICACIÓN** → prueba genética: `GENETICA_PROGRAMADA` → `GENETICA_EN_PROCESAMIENTO` → `GENETICA_RESULTADO_DISPONIBLE`.
17. **SIN INDICACIÓN** → caso cierra: `SIN_INDICACION_GENETICA`.

### Fase 4 — Resultado genético y seguimiento

18. Admin registra resultado (texto del reporte), gen analizado, fenotipo.
19. Wilson: admin registra seguimiento clínico.
20. Admin activa link de resultados para médico y/o paciente.
21. Estado: `COMPLETADO`.

### Estados del caso (state machine)

```
SOLICITUD_RECIBIDA
  ↓
EN_PROGRAMACION
  ↓
PENDIENTE_AUTORIZACION
  ↓              ↓
AUTORIZADO       NO_ACEPTO
  ↓
PROGRAMADO
  ↓
MUESTRA_TOMADA
  ↓
RESULTADO_SERICO_DISPONIBLE
  ↓                         ↓
CON_INDICACION_GENETICA     SIN_INDICACION_GENETICA
  ↓
GENETICA_PROGRAMADA → GENETICA_EN_PROCESAMIENTO → GENETICA_RESULTADO_DISPONIBLE
  ↓
COMPLETADO

Excepción (cualquier estado):
  SIN_CONTACTO_EFECTIVO | CANCELADO | FALLECIDO
```

---

## 6. Módulo de Consentimientos

- Plantillas por **programa + país + tipo** (MEDICO | PACIENTE), versionadas.
- Al crear nueva versión, la anterior queda archivada. Los casos firmados mantienen la referencia histórica.
- Solo una plantilla `activa` por programa + país + tipo.

**Países soportados inicialmente:**

| País | Código | Marco legal principal |
|------|--------|----------------------|
| Colombia | CO | Ley 1581/2012 (Habeas Data) |
| Ecuador | EC | LOPDP 2021 |
| Panamá | PA | Ley 81/2019 |
| Costa Rica | CR | Ley 8968 |
| Guatemala | GT | Normativa aplicable |
| El Salvador | SV | Normativa aplicable |
| República Dominicana | DO | Normativa aplicable |
| Chile | CL | Ley 19.628 |

**Representante legal:** Si el paciente no puede firmar directamente, el médico registra datos del representante (nombre, doc, parentesco) y este firma el link de autorización.

---

## 7. Módulo de Importación de Datos

**Propósito:** Migrar registros históricos de Excel (DAAT ~789 casos, Wilson ~117 casos) y permitir importaciones continuas durante la transición.

**Formatos:** `.xlsx` y `.csv` (UTF-8).

**Flujo:** Subir archivo → validación previa con reporte → confirmar importación de casos válidos → casos con errores bloqueantes quedan en `DATOS_INCOMPLETOS`.

**Normalización automática de estados del Excel al importar:**

| Excel | Plataforma |
|-------|-----------|
| Realizado / realizado | `RESULTADO_SERICO_DISPONIBLE` |
| Programado / programado | `PROGRAMADO` |
| En programacion | `EN_PROGRAMACION` |
| Sin contacto efectivo | `SIN_CONTACTO_EFECTIVO` |
| No acepto / No acepta | `NO_ACEPTO` |
| SIG | `SIN_INDICACION_GENETICA` |
| En procesamiento | `GENETICA_EN_PROCESAMIENTO` |
| N/A | `N_A` |

**Plantilla descargable:** `.xlsx` con encabezados exactos, dropdowns y ejemplos para facilitar importaciones futuras.

---

## 8. Reportes y Exportación

- Casos por período / programa / país / estado / laboratorio / médico
- Tasa de autorización de pacientes
- Tiempo promedio por etapa
- Indicación genética vs. sin indicación
- Costos por laboratorio y período
- Fenotipos DAAT (MM/MS/MZ/SZ/ZZ) y seguimiento Wilson
- Exportación a `.xlsx` o `.csv` respetando filtros activos

---

## 9. Requisitos No Funcionales

### Seguridad

- Magic links: 64 bytes CSPRNG, hash SHA-256 en DB, un solo uso, expiran 72h
- Admin auth: JWT httpOnly cookies, bcrypt cost 12
- RLS en todas las tablas por `tenant_id`
- `audit_log` para toda acción relevante (actor, acción, timestamp, IP)
- Rate limiting en formularios públicos (20 req/hora por IP)
- HTTPS obligatorio

### UX del paciente

- Texto grande, alto contraste, lenguaje simple (sin tecnicismos)
- Compatible con WhatsApp Web (Android/iOS), sin instalación de apps
- Carga < 3s en 4G

### Calidad de código

- Cobertura de tests ≥ 80% en funciones críticas de negocio
- 0 vulnerabilidades críticas (npm audit)
- Lint + type-check en CI — sin merges sin pasar CI

---

## 10. Cumplimiento Legal

| Ley | País | Aplicación |
|-----|------|-----------|
| Ley 1581/2012 | Colombia | Consentimiento explícito, finalidad limitada, derecho de corrección |
| Ley 527/1999 | Colombia | Validez firma electrónica simple |
| LOPDP 2021 | Ecuador | Consentimiento libre, informado, específico |
| Ley 81/2019 | Panamá | Consentimiento documentado, almacenamiento seguro |
| Ley 8968 | Costa Rica | Protección de datos sensibles de salud |

Cada firma registra: nombre escrito, timestamp UTC, IP, user-agent, ID del caso, versión del consentimiento.

---

## 11. Fuera del Alcance (v2.0)

- Telemedicina / videoconferencia
- API automática de resultados de laboratorios
- App nativa iOS/Android
- Firma con certificado calificado (PKI)
- Pago en línea / facturación
- Integración EHR/HIS
- OTP por SMS (considerado post-MVP)
