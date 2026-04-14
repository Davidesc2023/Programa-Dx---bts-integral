# UX Flows — Increment v7: Frontend & UX
## Sistema APP-DX — BTS Integral

---

## Pantallas del Sistema

| ID | Ruta | Nombre | Roles con acceso |
|---|---|---|---|
| P-01 | `/login` | Inicio de sesión | Todos |
| P-02 | `/dashboard` | Panel principal | Todos |
| P-03 | `/patients` | Lista de pacientes | Admin, Operador |
| P-04 | `/patients/new` | Crear paciente | Admin, Operador |
| P-05 | `/patients/:id` | Detalle de paciente | Admin, Operador |
| P-06 | `/orders` | Lista de órdenes | Todos |
| P-07 | `/orders/new` | Crear orden | Admin, Operador |
| P-08 | `/orders/:id` | Detalle de orden | Todos |
| P-09 | `/orders/:id/consent` | Módulo de consentimiento | Admin, Operador |
| P-10 | `/orders/:id/results` | Resultados de la orden | Todos |
| P-11 | `/orders/:id/appointments` | Cita de la orden | Admin, Operador |
| P-12 | `/appointments` | Lista de citas | Admin, Operador |

---

## FLOW-01 — Autenticación

```
[Usuario abre la app]
        |
        v
[Existe token en localStorage?]
        |
   NO   |   SI
   |    |    |
   v    |    v
[/login]|  [Verificar token válido]
        |         |
        |    VÁLIDO | EXPIRADO/INVÁLIDO
        |         |         |
        |         v         v
        |    [/dashboard]  [clear token]
        |                  [/login]
        |
[LoginForm — email + password]
        |
   [POST /auth/login]
        |
   200 OK | 401 Unauthorized
        |         |
        v         v
[guardar JWT   [mostrar error:
 en localStorage] "Credenciales incorrectas"]
        |
[decodificar payload]
[guardar: userId, role, name en Zustand]
        |
        v
[redirigir a /dashboard]
```

**Elementos de pantalla P-01 (/login):**
- Logo BTS Integral (centrado, tamaño grande)
- Card centrada con sombra
- Campo: Correo electrónico (type=email, validación Zod)
- Campo: Contraseña (type=password, toggle de visibilidad)
- Botón: "Iniciar sesión" (estado loading durante petición)
- Mensaje de error (inline, en rojo) si 401
- No hay registro público (Admin gestiona usuarios)

---

## FLOW-02 — Dashboard (post-login)

```
[/dashboard — carga inicial]
        |
[GET /orders?page=1&limit=5 (recientes)]
[GET /patients (count)]
        |
        v
[Renderizar Dashboard según rol]
        |
   ADMIN/OPERADOR    |  LABORATORIO
        |             |
        v             v
[Cards métricas:] [Cards métricas:]
- Total pacientes  - Órdenes hoy
- Órdenes hoy      - EN_ANALISIS
- PENDIENTE count  - COMPLETADA count
- COMPLETADA count
        |
        v
[Tabla: últimas 5 órdenes]
 - ID / Paciente / Estado / Fecha
 - Click en fila → /orders/:id
        |
        v
[Acciones rápidas (sidebar resaltado según rol)]
```

---

## FLOW-03 — Gestión de Pacientes

```
FLOW-03A: Listar Pacientes
[/patients]
        |
[GET /patients?page=1&limit=10]
        |
[Tabla de pacientes]
 - Nombre | Doc | Teléfono | Email | Acciones
        |
[Búsqueda: nombre o documento]
   → GET /patients?search=xxx
        |
[Paginación: anterior / siguiente]
        |
[Botón "Nuevo paciente"] → /patients/new
[Botón "Ver"] → /patients/:id

---

FLOW-03B: Crear Paciente
[/patients/new]
        |
[Formulario (React Hook Form + Zod)]
 - Nombre completo (requerido)
 - Tipo de documento: CC / TI / CE / PASAPORTE (select)
 - Número de documento (requerido, único)
 - Fecha de nacimiento (date picker)
 - Teléfono (requerido)
 - Email (requerido, formato email)
        |
[Validación en cliente (Zod)]
        |  INVÁLIDO: mostrar errores inline por campo
        |
[POST /patients]
        |
   201 Created | 400/409 Error
        |              |
        v              v
[toast: "Paciente  [toast: "Error: ..."
 creado exitosamente"] mostrar mensaje del backend]
[redirigir a /patients]

---

FLOW-03C: Detalle de Paciente
[/patients/:id]
        |
[GET /patients/:id]
[GET /orders?patientId=:id]
        |
[Mostrar info del paciente]
[Tabla de órdenes del paciente]
 - Click en orden → /orders/:id
[Botón "Editar paciente" → formulario inline o modal]
```

---

## FLOW-04 — Gestión de Órdenes

```
FLOW-04A: Listar Órdenes
[/orders]
        |
[GET /orders?page=1&limit=10]
        |
[Filtros disponibles en header]
 - Estado: PENDIENTE | MUESTRA_RECOLECTADA | EN_ANALISIS
           COMPLETADA | CANCELADA | RECHAZADA | SCHEDULED
 - Prioridad: URGENTE | RUTINA
 - Fecha: desde - hasta
        |
[Tabla de órdenes]
 - ID | Paciente | Médico | Estado | Prioridad | Fecha | Acciones
 - Estado: Badge de color según estado
   * PENDIENTE: gris
   * MUESTRA_RECOLECTADA: azul claro
   * EN_ANALISIS: azul
   * COMPLETADA: verde
   * CANCELADA: rojo
   * RECHAZADA: naranja
   * SCHEDULED: teal
 - Click "Ver" → /orders/:id

---

FLOW-04B: Crear Orden
[/orders/new]
        |
[Paso 1 — Paciente]
 - Búsqueda de paciente por nombre o documento (autocomplete)
 - GET /patients?search=xxx
 - Seleccionar paciente de dropdown
        |
[Paso 2 — Datos de la orden]
 - Nombre del médico ordenante (texto)
 - ID del médico (select de usuarios con rol OPERADOR/ADMIN)
 - Prioridad: URGENTE / RUTINA (radio buttons)
 - Fecha estimada de cumplimiento (date picker)
 - Observaciones (textarea, opcional)
        |
[Paso 3 — Tests solicitados]
 - Campo para agregar test: nombre (texto libre)
 - Botón "Agregar test" → agrega a lista
 - Lista de tests seleccionados con botón X para remover
 - Mínimo 1 test requerido
        |
[Revisión: mostrar resumen antes de confirmar]
        |
[POST /orders]
 → 201: toast + redirect /orders/:id
 → error: toast con mensaje

---

FLOW-04C: Detalle de Orden
[/orders/:id]
        |
[GET /orders/:id]
[GET /consents?orderId=:id]
[GET /orders/:id/tests]
[GET /appointments?orderId=:id]
        |
[Sección: Info de la orden]
 - Paciente / Médico / Prioridad / Fechas

[Sección: Máquina de estados visual]
 Diagrama horizontal de transiciones:
 
  [PENDIENTE] --> [MUESTRA_RECOLECTADA] --> [EN_ANALISIS] --> [COMPLETADA]
       |                  |                      |
       v                  v                      v
  [CANCELADA]        [CANCELADA]           [RECHAZADA]
  
 Estado actual: resaltado en teal
 Botones de transición (según rol y estado actual):
   - Operador en PENDIENTE: "Marcar muestra recolectada"
   - Operador en MUESTRA_RECOLECTADA: "Iniciar análisis"
   - Lab en EN_ANALISIS: "Marcar completada" | "Rechazar"
   - Cualquier rol: "Cancelar" (si no está en estado terminal)
 PATCH /orders/:id → {status: nuevo_estado}

[Sección: Consentimiento]
 - Estado del consentimiento (PENDIENTE_FIRMA / FIRMADO / ACEPTADO / RECHAZADO)
 - Botón "Ver consentimiento" → /orders/:id/consent
 
[Sección: Tests solicitados]
 - Lista de tests → GET /orders/:id/tests

[Sección: Cita]
 - Si existe cita: mostrar fecha/hora/estado
 - Botón "Crear cita" → /orders/:id/appointments

[Sección: Resultados]
 - Botón "Ver resultados" → /orders/:id/results
```

---

## FLOW-05 — Módulo de Consentimiento

```
FLOW-05A: Firma del Consentimiento (Médico / Operador)
[/orders/:id/consent]
        |
[GET /consents?orderId=:id]
        |
[Estado: PENDIENTE_FIRMA]
        |
[Mostrar términos del consentimiento]
 (texto del PRD: autorización para exámenes de laboratorio)
        |
[Botón "Firmar consentimiento"]
        |
[POST /consents → {orderId, signedBy: userId}]
        |
 201: toast "Consentimiento firmado" 
      Estado pasa a FIRMADO
      Notificación automática enviada al paciente (backend)
        |
[Estado: FIRMADO — esperando respuesta del paciente]
 - Mostrar badge "Firmado — pendiente aceptación"

---

FLOW-05B: Aceptación / Rechazo (vista desde el sistema)
[Estado actual del consentimiento visible en /orders/:id/consent]
        |
[Si está FIRMADO y rol Admin/Operador]
 - Botón "Registrar aceptación del paciente"
 - Botón "Registrar rechazo del paciente"
        |
[PATCH /consents/:id → {status: ACEPTADO | RECHAZADO}]
        |
 ACEPTADO:
   - Badge verde "Paciente aceptó"
   - Orden puede avanzar a SCHEDULED/MUESTRA_RECOLECTADA
   
 RECHAZADO:
   - Badge rojo "Paciente rechazó"
   - Orden se cierra (proceso termina)
```

---

## FLOW-06 — Módulo de Resultados

```
[/orders/:id/results]
        |
[GET /results?orderId=:id]
        |
[Si no hay resultados]
 - Mensaje "Sin resultados aún"
 - Botón "Cargar resultado" (si rol Lab/Admin)
        |
[Si hay resultados]
 - Card por cada resultado:
   * Descripción / Fecha / Creado por
   * Lista de adjuntos:
     - GET /results/:id/attachments
     - Íconos por tipo: PDF / Imagen
     - Botón "Descargar"
   * Botón "Agregar adjunto"
        |
FLOW-06A: Cargar resultado
[Formulario inline o modal]
 - Descripción del resultado (textarea, requerido)
 - Observaciones (opcional)
[POST /results → {orderId, description}]
 → 201: se re-fetcha la lista

FLOW-06B: Adjuntar archivo
[Modal "Adjuntar archivo"]
 - Drag & drop o selector de archivo
 - Tipos permitidos: PDF, JPG, PNG (max 10MB)
 - Validación en frontend antes de subir
[POST /results/:id/attachments (multipart/form-data)]
 → 201: archivo aparece en la lista
 → 400: toast "Tipo de archivo no permitido" o "Archivo demasiado grande"

FLOW-06C: Descargar adjunto
[Click en botón "Descargar"]
[GET /results/:resultId/attachments/:id]
 → stream del archivo → descarga automática en browser
```

---

## FLOW-07 — Módulo de Citas

```
FLOW-07A: Crear cita desde orden
[/orders/:id/appointments]
        |
[GET /appointments?orderId=:id]
 - Si ya existe cita: mostrar detalle
 - Si no existe: formulario de creación
        |
[Formulario de cita]
 - Fecha y hora de la cita (datetime-local input)
 - Notas adicionales (opcional)
[POST /appointments → {orderId, scheduledAt, notes}]
 → 201: toast + mostrar detalle de cita

FLOW-07B: Lista de citas
[/appointments]
        |
[GET /appointments?page=1&limit=10]
        |
[Tabla de citas]
 - Orden ID | Paciente | Fecha | Estado | Acciones
 - Filtro por estado: PROGRAMADA | COMPLETADA | CANCELADA
        |
[Click "Ver orden" → /orders/:id]
[Click "Cancelar cita" → PATCH /appointments/:id → {status: CANCELADA}]
```

---

## FLOW-08 — Navegación Global (Sidebar)

```
[Sidebar — siempre visible en rutas protegidas]
        |
[Logo BTS Integral (link a /dashboard)]
        |
[Menú dinámico según rol del token JWT decodificado]
        |
   ADMIN                OPERADOR            LABORATORIO
   -----                --------            -----------
   Dashboard            Dashboard           Dashboard
   Pacientes            Pacientes           Ordenes
   Ordenes              Ordenes             Resultados
   Consentimientos      Consentimientos
   Resultados           Resultados
   Citas                Citas
   Usuarios (futuro)
        |
[Footer del sidebar]
 - Avatar del usuario (inicial del nombre)
 - Nombre + rol
 - Botón "Cerrar sesión"
```

---

## FLOW-09 — Manejo de Errores Globales

```
[Petición HTTP cualquiera]
        |
   200-299 | 400 | 401 | 403 | 404 | 500
        |      |     |     |     |     |
        v      v     v     v     v     v
     [ok]  [toast  [auto  [toast [toast [toast
            error   logout] "Sin  "No   "Error
            mensaje        acceso" encontrado" del servidor"]
            del API]       
                   [redirect
                    /login]
        |
[Axios interceptor maneja 401 globalmente]
[React Query maneja retry: 0 para 4xx, 1 para 5xx]
```

---

## FLOW-10 — Flujo Completo End-to-End (Happy Path)

```
Médico/Operador crea la orden
        |
[/orders/new] → Selecciona paciente → Llena datos → POST /orders
        |
[/orders/:id] → Estado: PENDIENTE
        |
[/orders/:id/consent] → Firma consentimiento → POST /consents
        | Estado consentimiento: FIRMADO
        | Backend envía notificación al paciente
        |
[Paciente acepta] → PATCH /consents/:id → {ACEPTADO}
        | Orden puede avanzar
        |
[Operador: "Marcar muestra recolectada"]
        | PATCH /orders/:id → {status: MUESTRA_RECOLECTADA}
        |
[Laboratorio: "Iniciar análisis"]
        | PATCH /orders/:id → {status: EN_ANALISIS}
        |
[Laboratorio: carga resultado]
        | POST /results + POST /results/:id/attachments
        |
[Laboratorio: "Marcar completada"]
        | PATCH /orders/:id → {status: COMPLETADA}
        |
[Médico consulta resultados en /orders/:id/results]
```
