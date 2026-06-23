// Fase 2: Rutas públicas del formulario del médico
// Acceso sin autenticación — rate limiting por IP

import { getDb } from "../utils/db.ts"
import { ok, created, err } from "../utils/responses.ts"
import { checkRateLimit, clientIp } from "../middleware/rate-limit.ts"
import { notificarCasoCreado } from "../utils/email.ts"
import { z, parseBody } from "../utils/validate.ts"

// Mapa de slug de URL → código interno del programa
const PROGRAMA_SLUGS: Record<string, string> = {
  wilson:   "WILSON",
  alfa1:    "DAAT",
  duchenne: "DUCHENNE",
}

const PAISES_ENUM = ["CO", "EC", "PA", "CL", "CR", "SV", "DO", "GT"] as const

const CrearCasoSchema = z.object({
  pais_codigo:             z.enum(PAISES_ENUM, { message: "País no soportado" }),
  medico_nombre:           z.string().min(1, "medico_nombre: requerido"),
  medico_especialidad:     z.string().min(1, "medico_especialidad: requerido"),
  medico_numero_registro:  z.string().min(1, "medico_numero_registro: requerido"),
  medico_email:            z.string().email("medico_email: formato de email inválido"),
  paciente_nombre:         z.string().min(1, "paciente_nombre: requerido"),
  paciente_tipo_doc:       z.string().min(1, "paciente_tipo_doc: requerido"),
  paciente_num_doc:        z.string().min(1, "paciente_num_doc: requerido"),
  // opcionales
  medico_tipo_registro:    z.string().nullish(),
  medico_institucion:      z.string().nullish(),
  medico_ciudad:           z.string().nullish(),
  medico_whatsapp:         z.string().nullish(),
  paciente_genero:         z.string().nullish(),
  paciente_eps:            z.string().nullish(),
  paciente_telefono:       z.string().nullish(),
  paciente_email:          z.string().nullish(),
  paciente_ciudad:         z.string().nullish(),
  paciente_departamento:   z.string().nullish(),
  paciente_pais:           z.string().nullish(),
  paciente_direccion:      z.string().nullish(),
  rep_nombre:              z.string().nullish(),
  rep_doc:                 z.string().nullish(),
  rep_parentesco:          z.string().nullish(),
  resultado_previo_valor:          z.string().nullish(),
  resultado_previo_interpretacion: z.string().nullish(),
})

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
    .select("id, nombre, codigo, gen, prueba_serica, prueba_genetica, umbral_json, activo")
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

  const parsed = await parseBody(req, CrearCasoSchema)
  if (!parsed.ok) return parsed.response
  const data = parsed.data

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
  const iniciales = data.paciente_nombre
    .split(/\s+/)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("")

  const { data: caso, error } = await db.from("casos").insert({
    tenant_id: tenant.id,
    programa_id: prog.id,
    consecutivo,
    pais_codigo: data.pais_codigo,

    medico_nombre:          data.medico_nombre,
    medico_especialidad:    data.medico_especialidad,
    medico_tipo_registro:   data.medico_tipo_registro   ?? null,
    medico_numero_registro: data.medico_numero_registro,
    medico_institucion:     data.medico_institucion     ?? null,
    medico_ciudad:          data.medico_ciudad          ?? null,
    medico_email:           data.medico_email,
    medico_whatsapp:        data.medico_whatsapp        ?? null,
    medico_firmado_at:      now.toISOString(),
    medico_ip:              ip,
    medico_ua:              req.headers.get("user-agent") ?? null,

    paciente_nombre:       data.paciente_nombre,
    paciente_tipo_doc:     data.paciente_tipo_doc,
    paciente_num_doc:      data.paciente_num_doc,
    paciente_genero:       data.paciente_genero       ?? null,
    paciente_eps:          data.paciente_eps          ?? null,
    paciente_telefono:     data.paciente_telefono     ?? null,
    paciente_email:        data.paciente_email        ?? null,
    paciente_ciudad:       data.paciente_ciudad       ?? null,
    paciente_departamento: data.paciente_departamento ?? null,
    paciente_pais:         data.paciente_pais         ?? null,
    paciente_direccion:    data.paciente_direccion    ?? null,
    paciente_iniciales:    iniciales,

    rep_nombre:     data.rep_nombre     ?? null,
    rep_doc:        data.rep_doc        ?? null,
    rep_parentesco: data.rep_parentesco ?? null,

    resultado_previo_valor:          data.resultado_previo_valor          ?? null,
    resultado_previo_interpretacion: data.resultado_previo_interpretacion ?? null,

    mes_solicitud: mesStr,
    estado:        "SOLICITUD_RECIBIDA",
  }).select("id, consecutivo, estado, created_at").single()

  if (error) return err(500, error.message)

  // Audit log y notificación al médico (no bloquean la respuesta)
  // Promise.resolve() wraps PromiseLike → full Promise (Deno edge runtime needs .catch())
  await Promise.all([
    Promise.resolve(db.from("audit_log").insert({
      tenant_id:  tenant.id,
      actor_tipo: "MEDICO_LINK",
      actor_id:   null,
      accion:     "CASO_CREADO",
      entidad:    "casos",
      entidad_id: caso.id,
      datos_json: { programa: prog.codigo, pais: data.pais_codigo, consecutivo },
      ip,
      user_agent: req.headers.get("user-agent") ?? null,
    })).catch(console.error),

    notificarCasoCreado({
      medicoEmail:       data.medico_email,
      medicoNombre:      data.medico_nombre,
      consecutivo,
      programa:          prog.codigo,
      pais:              data.pais_codigo,
      pacienteNombre:    data.paciente_nombre,
      pacienteIniciales: iniciales,
    }).catch(console.error),
  ])

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
