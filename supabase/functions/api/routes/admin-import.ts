// Fase 8: Importación masiva de casos (solo ADMIN)
// POST /admin/import/:tenant/:programa
// Body: { rows: ImportRow[] } — máximo 200 filas

import { getDb }                   from "../utils/db.ts"
import { ok, err }                 from "../utils/responses.ts"
import { requireAuth, requireRole } from "../middleware/auth.ts"

const PROGRAMA_SLUGS: Record<string, string> = {
  wilson:   "WILSON",
  alfa1:    "DAAT",
  duchenne: "DUCHENNE",
}

const PAISES_VALIDOS = new Set(["CO", "EC", "PA", "CL", "CR", "SV", "DO", "GT"])

const REQUIRED_FIELDS = [
  "pais_codigo",
  "medico_nombre", "medico_especialidad", "medico_numero_registro", "medico_email",
  "paciente_nombre", "paciente_tipo_doc", "paciente_num_doc",
] as const

export async function importarCasos(
  req: Request,
  tenantSlug: string,
  programa: string,
): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, "ADMIN")
  if (denied) return denied

  const programaCodigo = PROGRAMA_SLUGS[programa]
  if (!programaCodigo) return err(404, "Programa inválido")

  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.rows)) return err(400, "Body debe ser { rows: ImportRow[] }")

  const rows: Record<string, string>[] = body.rows
  if (rows.length === 0) return err(400, "No hay filas para importar")
  if (rows.length > 200) return err(400, "Máximo 200 filas por importación")

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

  const { count: baseCount } = await db
    .from("casos")
    .select("id", { count: "exact", head: true })
    .eq("programa_id", prog.id)

  const now = new Date()
  const mesStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const importUA = `import/${auth.email ?? auth.sub}`

  const errores: { fila: number; mensaje: string }[] = []
  const casos: { id: string; consecutivo: string; fila: number }[] = []
  let offset = baseCount ?? 0

  for (let i = 0; i < rows.length; i++) {
    const fila = i + 2 // row 1 is header
    const row = rows[i]

    // Validate required fields
    let rowError: string | null = null
    for (const f of REQUIRED_FIELDS) {
      if (!row[f]?.trim()) { rowError = `Campo requerido vacío: ${f}`; break }
    }
    if (!rowError && !PAISES_VALIDOS.has(row.pais_codigo?.trim().toUpperCase())) {
      rowError = `País no soportado: ${row.pais_codigo}`
    }
    if (rowError) { errores.push({ fila, mensaje: rowError }); continue }

    offset++
    const consecutivo = `${prog.codigo}-${String(offset).padStart(4, "0")}`

    const iniciales = String(row.paciente_nombre)
      .split(/\s+/)
      .map((w: string) => w[0]?.toUpperCase() ?? "")
      .join("")

    const s = (v: string | undefined) => v?.trim() || null

    const { data: caso, error } = await db.from("casos").insert({
      tenant_id:    tenant.id,
      programa_id:  prog.id,
      consecutivo,
      pais_codigo:  row.pais_codigo.trim().toUpperCase(),

      medico_nombre:          row.medico_nombre.trim(),
      medico_especialidad:    row.medico_especialidad.trim(),
      medico_tipo_registro:   s(row.medico_tipo_registro),
      medico_numero_registro: row.medico_numero_registro.trim(),
      medico_institucion:     s(row.medico_institucion),
      medico_ciudad:          s(row.medico_ciudad),
      medico_email:           row.medico_email.trim().toLowerCase(),
      medico_whatsapp:        s(row.medico_whatsapp),
      medico_firmado_at:      now.toISOString(),
      medico_ip:              "import",
      medico_ua:              importUA,

      paciente_nombre:       row.paciente_nombre.trim(),
      paciente_tipo_doc:     row.paciente_tipo_doc.trim(),
      paciente_num_doc:      row.paciente_num_doc.trim(),
      paciente_genero:       s(row.paciente_genero),
      paciente_eps:          s(row.paciente_eps),
      paciente_telefono:     s(row.paciente_telefono),
      paciente_email:        s(row.paciente_email),
      paciente_ciudad:       s(row.paciente_ciudad),
      paciente_departamento: s(row.paciente_departamento),
      paciente_pais:         s(row.paciente_pais),
      paciente_direccion:    s(row.paciente_direccion),
      paciente_iniciales:    iniciales,

      rep_nombre:     s(row.rep_nombre),
      rep_doc:        s(row.rep_documento),
      rep_parentesco: s(row.rep_parentesco),

      resultado_previo_valor:          s(row.resultado_previo_valor),
      resultado_previo_interpretacion: s(row.resultado_previo_interpretacion),

      mes_solicitud: mesStr,
      estado:        "SOLICITUD_RECIBIDA",
    }).select("id, consecutivo").single()

    if (error || !caso) {
      errores.push({ fila, mensaje: error?.message ?? "Error al insertar fila" })
      offset--
      continue
    }

    await Promise.resolve(db.from("audit_log").insert({
      tenant_id:  tenant.id,
      actor_tipo: "ADMIN",
      actor_id:   auth.sub,
      accion:     "CASO_IMPORTADO",
      entidad:    "casos",
      entidad_id: caso.id,
      datos_json: { programa: prog.codigo, fila, consecutivo, importado_por: auth.email ?? auth.sub },
      ip:         "import",
      user_agent: importUA,
    })).catch(console.error)

    casos.push({ id: caso.id, consecutivo: caso.consecutivo, fila })
  }

  return ok({ total: rows.length, exitosos: casos.length, errores, casos })
}
