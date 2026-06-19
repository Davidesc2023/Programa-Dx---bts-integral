// Fase 3: Magic links para autorización del paciente
// El token plano (128 hex) NUNCA se persiste — solo su SHA-256

import { getDb }                       from "../utils/db.ts"
import { ok, created, err }            from "../utils/responses.ts"
import { checkRateLimit, clientIp }    from "../middleware/rate-limit.ts"
import { requireAuth, requireRole }    from "../middleware/auth.ts"
import { generarTokenHex, sha256Hex, calcularExpiracion, tokenEstaExpirado } from "../services/token.ts"
import { notificarNoAutorizacion }     from "../utils/email.ts"

const EXPIRY_HOURS = parseInt(Deno.env.get("MAGIC_LINK_EXPIRY_HOURS") ?? "72")
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "https://programa-dx-bts-integral.vercel.app"

// Campos del caso que se exponen al paciente (sin datos admin internos)
const CAMPOS_CASO_PACIENTE = [
  "id", "consecutivo", "pais_codigo",
  "medico_nombre", "medico_especialidad", "medico_numero_registro",
  "medico_institucion", "medico_ciudad",
  "paciente_nombre", "paciente_tipo_doc", "paciente_num_doc",
  "paciente_genero", "paciente_eps", "paciente_telefono",
  "paciente_email", "paciente_ciudad", "paciente_departamento", "paciente_pais",
  "paciente_iniciales",
  "rep_nombre", "rep_doc", "rep_parentesco",
  "resultado_previo_valor", "resultado_previo_interpretacion",
  "paciente_autorizacion", "estado",
  "created_at",
].join(", ")

// ─── POST /admin/casos/:id/link-paciente ─────────────────────────────────────
// Genera un nuevo magic link para el paciente.
// Invalida links PACIENTE_FIRMA anteriores del mismo caso.
// Actualiza el estado del caso a PENDIENTE_AUTORIZACION si corresponde.
export async function generarLinkPaciente(req: Request, casoId: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN", "OPERADOR")
  if (denied) return denied

  const db = getDb()

  const { data: caso } = await db.from("casos")
    .select("id, estado, tenant_id, consecutivo, paciente_nombre, paciente_email, paciente_telefono")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  const estadosPermitidos = [
    "SOLICITUD_RECIBIDA", "EN_PROGRAMACION", "PENDIENTE_AUTORIZACION", "NO_ACEPTO",
  ]
  if (!estadosPermitidos.includes(caso.estado)) {
    return err(422, `No se puede generar link para un caso en estado: ${caso.estado}`)
  }

  // Invalidar links anteriores de tipo PACIENTE_FIRMA para este caso
  await db.from("magic_links")
    .update({ invalidado_at: new Date().toISOString() })
    .eq("caso_id", casoId)
    .eq("tipo", "PACIENTE_FIRMA")
    .is("invalidado_at", null)

  // Generar token plano → hash → persistir solo el hash
  const tokenPlano = generarTokenHex()
  const tokenHash  = await sha256Hex(tokenPlano)
  const expiraAt   = calcularExpiracion(EXPIRY_HOURS)

  const { error: insertErr } = await db.from("magic_links").insert({
    token_hash: tokenHash,
    tipo:       "PACIENTE_FIRMA",
    caso_id:    casoId,
    expira_at:  expiraAt.toISOString(),
  })
  if (insertErr) return err(500, `Error al generar el link: ${insertErr.message}`)

  // Mover el caso a PENDIENTE_AUTORIZACION (si no lo está ya)
  if (caso.estado !== "PENDIENTE_AUTORIZACION") {
    await db.from("casos")
      .update({ estado: "PENDIENTE_AUTORIZACION", updated_at: new Date().toISOString() })
      .eq("id", casoId)
  }

  // Audit log
  await Promise.resolve(db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   null,
    accion:     "LINK_GENERADO",
    entidad:    "magic_links",
    entidad_id: casoId,
    datos_json: { tipo: "PACIENTE_FIRMA", expira_horas: EXPIRY_HOURS },
    ip:         clientIp(req),
    user_agent: req.headers.get("user-agent") ?? null,
  })).catch(console.error)

  const url = `${FRONTEND_URL}/autorizar/${tokenPlano}`

  return created({
    url,
    expira_at:       expiraAt.toISOString(),
    expira_horas:    EXPIRY_HOURS,
    caso: {
      id:          caso.id,
      consecutivo: caso.consecutivo,
      paciente:    caso.paciente_nombre,
    },
  }, "Link generado exitosamente")
}

// ─── DELETE /admin/casos/:id/link-paciente ────────────────────────────────────
// Invalida todos los links activos PACIENTE_FIRMA del caso (sin generar uno nuevo)
export async function invalidarLinkPaciente(req: Request, casoId: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN", "OPERADOR")
  if (denied) return denied

  const db = getDb()

  const { data: caso } = await db.from("casos").select("id").eq("id", casoId).is("deleted_at", null).single()
  if (!caso) return err(404, "Caso no encontrado")

  const { count } = await db.from("magic_links")
    .update({ invalidado_at: new Date().toISOString() })
    .eq("caso_id", casoId)
    .eq("tipo", "PACIENTE_FIRMA")
    .is("invalidado_at", null)
    .select("id", { count: "exact" })

  return ok({ invalidados: count ?? 0 }, "Links invalidados")
}

// ─── GET /autorizar/:token ─────────────────────────────────────────────────────
// El paciente abre el link. Devuelve datos del caso para que los confirme.
// Rate limit: 30 req/h por IP (protege contra enumeración de tokens)
export async function obtenerCasoParaAutorizacion(req: Request, tokenPlano: string): Promise<Response> {
  const ip = clientIp(req)
  const rl = checkRateLimit(`auth-get:${ip}`, 30, 60 * 60 * 1000)
  if (!rl.allowed) return err(429, "Demasiadas solicitudes. Intente más tarde.")

  const tokenHash = await sha256Hex(tokenPlano)
  const db = getDb()

  const { data: link } = await db.from("magic_links")
    .select("id, caso_id, expira_at, usado_at, invalidado_at, tipo")
    .eq("token_hash", tokenHash)
    .single()

  if (!link || link.tipo !== "PACIENTE_FIRMA") return err(404, "Link no encontrado o inválido")
  if (link.invalidado_at) return err(410, "Este link ha sido revocado. Solicite uno nuevo a su médico.")
  if (link.usado_at) return err(410, "Este link ya fue utilizado. El proceso de autorización está completo.")
  if (tokenEstaExpirado(new Date(link.expira_at))) return err(410, "Este link ha expirado. Solicite uno nuevo a su médico.")

  const { data: caso } = await db.from("casos")
    .select(CAMPOS_CASO_PACIENTE)
    .eq("id", link.caso_id)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  // Obtener consentimiento del paciente activo para su país
  const { data: consentimiento } = await Promise.resolve(
    db.from("consentimientos")
      .select("id, titulo, cuerpo_html, version, marco_legal")
      .eq("tipo", "PACIENTE")
      .eq("pais_codigo", caso.pais_codigo)
      .eq("activo", true)
      .order("version", { ascending: false })
      .limit(1)
      .single()
  ).catch(() => ({ data: null }))

  return ok({
    caso,
    consentimiento:   consentimiento ?? null,
    expira_at:        link.expira_at,
    token_tipo:       link.tipo,
  })
}

// ─── POST /autorizar/:token ────────────────────────────────────────────────────
// El paciente confirma o rechaza la autorización.
// Body: { respuesta: "AUTORIZADO"|"NO_AUTORIZADO", nombre_firmado: string, correccion_datos?: string }
export async function responderAutorizacion(req: Request, tokenPlano: string): Promise<Response> {
  const ip = clientIp(req)
  const rl = checkRateLimit(`auth-post:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) return err(429, "Demasiadas solicitudes.")

  const body = await req.json().catch(() => null)
  if (!body) return err(400, "Body JSON requerido")

  const { respuesta, nombre_firmado, correccion_datos } = body
  if (!respuesta || !["AUTORIZADO", "NO_AUTORIZADO"].includes(respuesta)) {
    return err(400, "Campo requerido: respuesta (AUTORIZADO | NO_AUTORIZADO)")
  }
  if (!nombre_firmado || String(nombre_firmado).trim().length < 2) {
    return err(400, "Campo requerido: nombre_firmado (nombre completo del paciente o representante)")
  }

  const tokenHash = await sha256Hex(tokenPlano)
  const db = getDb()

  const { data: link } = await db.from("magic_links")
    .select("id, caso_id, expira_at, usado_at, invalidado_at, tipo")
    .eq("token_hash", tokenHash)
    .single()

  if (!link || link.tipo !== "PACIENTE_FIRMA") return err(404, "Link no encontrado o inválido")
  if (link.invalidado_at) return err(410, "Este link ha sido revocado.")
  if (link.usado_at) return err(410, "Este link ya fue utilizado.")
  if (tokenEstaExpirado(new Date(link.expira_at))) return err(410, "Este link ha expirado.")

  const { data: caso } = await db.from("casos")
    .select("id, estado, tenant_id, consecutivo, medico_email, medico_nombre, paciente_iniciales, programas(nombre, codigo)")
    .eq("id", link.caso_id)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  // Solo se puede autorizar si el caso está en PENDIENTE_AUTORIZACION
  if (caso.estado !== "PENDIENTE_AUTORIZACION") {
    return err(422, `El caso no está pendiente de autorización (estado actual: ${caso.estado})`)
  }

  const now = new Date()
  const ua  = req.headers.get("user-agent") ?? null

  // Marcar el link como usado (single-use)
  await db.from("magic_links").update({
    usado_at:   now.toISOString(),
    ip_usado:   ip,
    user_agent: ua,
  }).eq("id", link.id)

  // Actualizar el caso con la respuesta del paciente
  const nuevoEstado = respuesta === "AUTORIZADO" ? "AUTORIZADO" : "NO_ACEPTO"
  await db.from("casos").update({
    paciente_autorizacion:    respuesta,
    paciente_autorizo_at:     now.toISOString(),
    paciente_ip:              ip,
    paciente_ua:              ua,
    paciente_nombre_firmado:  String(nombre_firmado).trim(),
    paciente_correccion_datos: correccion_datos ? String(correccion_datos).trim() : null,
    estado:                   nuevoEstado,
    updated_at:               now.toISOString(),
  }).eq("id", caso.id)

  // Audit log + notificación al médico si el paciente NO autorizó
  const programa = (caso.programas as { nombre: string; codigo: string } | null)
  await Promise.all([
    Promise.resolve(db.from("audit_log").insert({
      tenant_id:  caso.tenant_id,
      actor_tipo: "PACIENTE_LINK",
      actor_id:   null,
      accion:     respuesta === "AUTORIZADO" ? "PACIENTE_AUTORIZO" : "PACIENTE_RECHAZO",
      entidad:    "casos",
      entidad_id: caso.id,
      datos_json: {
        respuesta,
        nombre_firmado: String(nombre_firmado).trim(),
        tiene_correccion: !!correccion_datos,
      },
      ip,
      user_agent: ua,
    })).catch(console.error),

    respuesta === "NO_AUTORIZADO" && caso.medico_email
      ? notificarNoAutorizacion({
          medicoEmail:       caso.medico_email,
          medicoNombre:      caso.medico_nombre ?? "",
          consecutivo:       caso.consecutivo,
          programa:          programa?.codigo ?? "",
          pacienteIniciales: caso.paciente_iniciales ?? "",
        }).catch(console.error)
      : Promise.resolve(),
  ])

  return ok({
    caso_id:     caso.id,
    consecutivo: caso.consecutivo,
    estado:      nuevoEstado,
    respuesta,
    firmado_at:  now.toISOString(),
  }, respuesta === "AUTORIZADO"
    ? "Autorización registrada. Gracias por su confirmación."
    : "Respuesta registrada. Nos comunicaremos con usted pronto."
  )
}
