// Fase 11: Generación de reportes — exportación plana de casos (max 5 000 filas)
import { getDb }              from "../utils/db.ts"
import { ok, err }            from "../utils/responses.ts"
import { requireAuth, requireRole } from "../middleware/auth.ts"

const COLS_REPORTE = [
  "consecutivo", "pais_codigo", "estado", "mes_solicitud", "created_at",
  "medico_nombre", "medico_email", "medico_institucion",
  "paciente_nombre", "paciente_tipo_doc", "paciente_num_doc", "paciente_autorizacion",
  "tiene_indicacion_genetica",
  "resultado_serico_1", "interpretacion_serico",
  "estado_genetico", "seguimiento_clinico",
  "programas(nombre, codigo)",
].join(", ")

// ─── GET /admin/reporte ───────────────────────────────────────────────────────
export async function generarReporte(req: Request): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, "ADMIN", "OPERADOR")
  if (denied) return denied

  const url    = new URL(req.url)
  const estado       = url.searchParams.get("estado")
  const programa     = url.searchParams.get("programa")   // código: WILSON | DAAT | DUCHENNE
  const pais         = url.searchParams.get("pais")
  const mes          = url.searchParams.get("mes")          // YYYY-MM
  const busqueda     = url.searchParams.get("q")
  const autorizacion = url.searchParams.get("autorizacion")

  const db = getDb()

  // Resolver código → ID para el filtro de programa
  let programaId: string | null = null
  if (programa) {
    const { data: prog } = await db.from("programas")
      .select("id").eq("codigo", programa).single()
    if (!prog) return ok([], "Programa no encontrado — sin registros")
    programaId = prog.id
  }

  let q = db.from("casos")
    .select(COLS_REPORTE)
    .is("deleted_at", null)
    .limit(5000)
    .order("created_at", { ascending: false })

  if (estado)       q = q.eq("estado", estado)
  if (programaId)   q = q.eq("programa_id", programaId)
  if (pais)         q = q.eq("pais_codigo", pais)
  if (mes)          q = q.eq("mes_solicitud", mes)
  if (autorizacion) q = q.eq("paciente_autorizacion", autorizacion)
  if (busqueda) {
    q = q.or([
      `consecutivo.ilike.%${busqueda}%`,
      `medico_nombre.ilike.%${busqueda}%`,
      `paciente_nombre.ilike.%${busqueda}%`,
      `paciente_num_doc.ilike.%${busqueda}%`,
      `medico_email.ilike.%${busqueda}%`,
    ].join(","))
  }

  const { data, error } = await q
  if (error) return err(500, error.message)

  return ok(data ?? [], `${(data ?? []).length} registros`)
}
