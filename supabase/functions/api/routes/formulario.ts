// Fase 2: Rutas públicas del formulario del médico
// Acceso sin autenticación — rate limiting por IP

import { getDb } from "../utils/db.ts"
import { ok, created, err } from "../utils/responses.ts"
import { checkRateLimit, clientIp } from "../middleware/rate-limit.ts"

// Mapa de slug de URL → código interno del programa
const PROGRAMA_SLUGS: Record<string, string> = {
  wilson:   "WILSON",
  alfa1:    "DAAT",
  duchenne: "DUCHENNE",
}

// Países habilitados con sus nombres
const PAISES_VALIDOS = new Set([
  "CO", "EC", "PA", "CL", "CR", "SV", "DO", "GT",
])

// ─── GET /public/:tenantSlug/:programa ────────────────────────────────────────
// Devuelve: datos del tenant + programa + plantillas de consentimiento activas
export async function publicGetForm(_req: Request, tenantSlug: string, programa: string): Promise<Response> {
  const programaCodigo = PROGRAMA_SLUGS[programa]
  if (!programaCodigo) return err(404, "Programa no válido")

  const db = getDb()

  const { data: tenant } = await db.from("tenants")
    .select("id, nombre, slug, logo_url, activo")
    .eq("slug", tenantSlug)
    .eq("activo", true)
    .single()
  if (!tenant) return err(404, "Programa no encontrado")

  const { data: prog } = await db.from("programas")
    .select("id, nombre, codigo, descripcion, enfermedad, gen, umbral_json, activo")
    .eq("tenant_id", tenant.id)
    .eq("codigo", programaCodigo)
    .eq("activo", true)
    .single()
  if (!prog) return err(404, "Programa no disponible")

  // Consentimientos activos tipo MEDICO — uno por país
  const { data: consentimientos } = await db.from("consentimientos")
    .select("id, pais_codigo, tipo, version, titulo, cuerpo_html")
    .eq("programa_id", prog.id)
    .eq("tipo", "MEDICO")
    .eq("activo", true)
    .order("pais_codigo")

  return ok({ tenant, programa: prog, consentimientos: consentimientos ?? [] })
}

// ─── POST /public/:tenantSlug/:programa ──────────────────────────────────────
// Crea un nuevo caso a partir del formulario del médico
export async function publicCrearCaso(req: Request, tenantSlug: string, programa: string): Promise<Response> {
  const ip = clientIp(req)
  const rl = checkRateLimit(`form:${ip}`, 20, 60 * 60 * 1000)
  if (!rl.allowed) return err(429, "Demasiadas solicitudes. Intente de nuevo en una hora.")

  const body = await req.json().catch(() => null)
  if (!body) return err(400, "Body JSON requerido")

  const required: Array<keyof typeof body> = [
    "pais_codigo",
    "medico_nombre", "medico_especialidad", "medico_numero_registro", "medico_email",
    "paciente_nombre", "paciente_tipo_doc", "paciente_num_doc",
  ]
  for (const f of required) {
    if (!body[f]) return err(400, `Campo requerido: ${f}`)
  }

  if (!PAISES_VALIDOS.has(body.pais_codigo)) {
    return err(400, `País no soportado: ${body.pais_codigo}`)
  }

  const programaCodigo = PROGRAMA_SLUGS[programa]
  if (!programaCodigo) return err(404, "Programa inválido")

  const db = getDb()

  const { data: tenant } = await db.from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .eq("activo", true)
    .single()
  if (!tenant) return err(404, "Tenant no encontrado")

  const { data: prog } = await db.from("programas")
    .select("id, codigo")
    .eq("tenant_id", tenant.id)
    .eq("codigo", programaCodigo)
    .eq("activo", true)
    .single()
  if (!prog) return err(404, "Programa no disponible")

  // Obtener siguiente número de consecutivo
  const { count } = await db
    .from("casos")
    .select("id", { count: "exact", head: true })
    .eq("programa_id", prog.id)
  const consecutivo = `${prog.codigo}-${String((count ?? 0) + 1).padStart(4, "0")}`

  const now = new Date()
  const mesStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  // Calcular iniciales del paciente (primera letra de cada palabra)
  const iniciales = String(body.paciente_nombre)
    .split(/\s+/)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("")

  const { data: caso, error } = await db.from("casos").insert({
    tenant_id: tenant.id,
    programa_id: prog.id,
    consecutivo,
    pais_codigo: body.pais_codigo,

    medico_nombre:          body.medico_nombre,
    medico_especialidad:    body.medico_especialidad,
    medico_tipo_registro:   body.medico_tipo_registro   ?? null,
    medico_numero_registro: body.medico_numero_registro,
    medico_institucion:     body.medico_institucion     ?? null,
    medico_ciudad:          body.medico_ciudad          ?? null,
    medico_email:           body.medico_email,
    medico_whatsapp:        body.medico_whatsapp        ?? null,
    medico_firmado_at:      now.toISOString(),
    medico_ip:              ip,
    medico_ua:              req.headers.get("user-agent") ?? null,

    paciente_nombre:       body.paciente_nombre,
    paciente_tipo_doc:     body.paciente_tipo_doc,
    paciente_num_doc:      body.paciente_num_doc,
    paciente_genero:       body.paciente_genero       ?? null,
    paciente_eps:          body.paciente_eps          ?? null,
    paciente_telefono:     body.paciente_telefono     ?? null,
    paciente_email:        body.paciente_email        ?? null,
    paciente_ciudad:       body.paciente_ciudad       ?? null,
    paciente_departamento: body.paciente_departamento ?? null,
    paciente_pais:         body.paciente_pais         ?? null,
    paciente_direccion:    body.paciente_direccion    ?? null,
    paciente_iniciales:    iniciales,

    rep_nombre:     body.rep_nombre     ?? null,
    rep_doc:        body.rep_doc        ?? null,
    rep_parentesco: body.rep_parentesco ?? null,

    resultado_previo_valor:          body.resultado_previo_valor          ?? null,
    resultado_previo_interpretacion: body.resultado_previo_interpretacion ?? null,

    mes_solicitud: mesStr,
    estado:        "SOLICITUD_RECIBIDA",
  }).select("id, consecutivo, estado, created_at").single()

  if (error) return err(500, error.message)

  // Registro en audit_log (no bloquea la respuesta si falla)
  await db.from("audit_log").insert({
    tenant_id:  tenant.id,
    actor_tipo: "MEDICO_LINK",
    actor_id:   null,
    accion:     "CASO_CREADO",
    entidad:    "casos",
    entidad_id: caso.id,
    datos_json: { programa: prog.codigo, pais: body.pais_codigo, consecutivo },
    ip,
    user_agent: req.headers.get("user-agent") ?? null,
  }).catch(console.error)

  return created({ caso }, "Solicitud registrada exitosamente")
}

// ─── POST /public/:tenantSlug/:programa/upload ────────────────────────────────
// Sube el PDF del resultado previo (Duchenne: CK sérica, etc.)
// Query param obligatorio: casoId
export async function publicSubirResultadoPrevio(req: Request, tenantSlug: string, _programa: string): Promise<Response> {
  const ip = clientIp(req)
  const rl = checkRateLimit(`upload:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) return err(429, "Demasiadas solicitudes.")

  const url = new URL(req.url)
  const casoId = url.searchParams.get("casoId")
  if (!casoId) return err(400, "Query param 'casoId' es requerido")

  const contentType = req.headers.get("content-type") ?? ""
  if (!contentType.includes("multipart/form-data")) {
    return err(400, "Usar Content-Type: multipart/form-data")
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) return err(400, "Error al parsear multipart/form-data")

  const file = formData.get("file")
  if (!file || !(file instanceof File)) return err(400, "Campo 'file' es requerido")
  if (file.type !== "application/pdf") return err(400, "Solo se aceptan archivos PDF")
  if (file.size > 10 * 1024 * 1024) return err(400, "Archivo demasiado grande (máx 10 MB)")

  const db = getDb()

  const { data: tenant } = await db.from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .eq("activo", true)
    .single()
  if (!tenant) return err(404, "Tenant no encontrado")

  const { data: caso } = await db.from("casos")
    .select("id, consecutivo")
    .eq("id", casoId)
    .eq("tenant_id", tenant.id)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  const bytes = new Uint8Array(await file.arrayBuffer())
  const storagePath = `resultados/${tenant.id}/${casoId}/resultado_previo.pdf`

  const { error: upErr } = await db.storage
    .from("resultados-pdf")
    .upload(storagePath, bytes, { contentType: "application/pdf", upsert: true })
  if (upErr) return err(500, `Error al subir el archivo: ${upErr.message}`)

  // URL firmada válida 1 año
  const { data: signed } = await db.storage
    .from("resultados-pdf")
    .createSignedUrl(storagePath, 31_536_000)
  const pdfUrl = signed?.signedUrl ?? null

  await db.from("casos")
    .update({ resultado_previo_pdf_url: pdfUrl })
    .eq("id", casoId)

  return ok({ url: pdfUrl }, "Archivo subido exitosamente")
}
