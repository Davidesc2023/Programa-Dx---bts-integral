// Fase 4: Panel admin — gestión de casos
// Todos los endpoints requieren autenticación (ADMIN o OPERADOR)

import { getDb }                     from "../utils/db.ts"
import { ok, created, paginated, err } from "../utils/responses.ts"
import { parsePagination }            from "../utils/router.ts"
import { requireAuth, requireRole }   from "../middleware/auth.ts"
import { clientIp }                   from "../middleware/rate-limit.ts"
import { validarTransicion, evaluarUmbral, type UmbralJson } from "../utils/states.ts"
import {
  notificarResultadoSerico,
  notificarCasoCompletado,
  notificarIndicacionGenetica,
} from "../utils/email.ts"

// Campos que se devuelven en el listado (sin campos de resultado pesados)
const COLS_LISTA =
  "id, consecutivo, pais_codigo, " +
  "medico_nombre, medico_email, " +
  "paciente_nombre, paciente_tipo_doc, paciente_num_doc, paciente_iniciales, " +
  "paciente_autorizacion, estado, tiene_indicacion_genetica, " +
  "mes_solicitud, created_at, updated_at, " +
  "programas(nombre, codigo)"

const ROLES_ADMIN = ["ADMIN", "OPERADOR"] as const

// ─── GET /admin/casos ─────────────────────────────────────────────────────────
export async function listarCasos(req: Request): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ...ROLES_ADMIN)
  if (denied) return denied

  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url, 20, 100)

  const estado    = url.searchParams.get("estado")
  const programa  = url.searchParams.get("programa")      // código: WILSON | DAAT | DUCHENNE
  const pais      = url.searchParams.get("pais")
  const mes       = url.searchParams.get("mes")           // formato YYYY-MM
  const busqueda  = url.searchParams.get("q")
  const autorizacion = url.searchParams.get("autorizacion")

  const db = getDb()

  // Resolver código → ID para el filtro de programa
  let programaId: string | null = null
  if (programa) {
    const { data: prog } = await db.from("programas")
      .select("id").eq("codigo", programa).single()
    programaId = prog?.id ?? null
  }

  let q = db.from("casos")
    .select(COLS_LISTA, { count: "exact" })
    .is("deleted_at", null)
    .range(from, to)
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

  const { data, count, error } = await q
  if (error) return err(500, error.message)

  return paginated(data ?? [], {
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

// ─── GET /admin/casos/:id ─────────────────────────────────────────────────────
export async function obtenerCaso(req: Request, casoId: string): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ...ROLES_ADMIN)
  if (denied) return denied

  const db = getDb()

  const { data: caso } = await db.from("casos")
    .select("*, programas(id, nombre, codigo, umbral_json)")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  // Últimas 20 entradas del audit_log para este caso
  const { data: auditoria } = await db.from("audit_log")
    .select("id, actor_tipo, accion, datos_json, ip, created_at")
    .eq("entidad_id", casoId)
    .eq("entidad", "casos")
    .order("created_at", { ascending: false })
    .limit(20)

  return ok({ ...caso, auditoria: auditoria ?? [] })
}

// ─── PATCH /admin/casos/:id/estado ────────────────────────────────────────────
export async function cambiarEstado(req: Request, casoId: string): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ...ROLES_ADMIN)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  if (!body?.estado) return err(400, "Campo requerido: estado")

  const db = getDb()

  const { data: caso } = await db.from("casos")
    .select("id, estado, tenant_id, consecutivo, medico_email, medico_nombre, paciente_iniciales, tiene_indicacion_genetica, estado_genetico, seguimiento_clinico, programas(nombre, codigo)")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  if (!validarTransicion(caso.estado, body.estado)) {
    return err(422, `Transición no permitida: ${caso.estado} → ${body.estado}`)
  }

  await db.from("casos").update({
    estado:     body.estado,
    updated_at: new Date().toISOString(),
  }).eq("id", casoId)

  const prog = (caso.programas as { nombre: string; codigo: string } | null)

  await Promise.all([
    Promise.resolve(db.from("audit_log").insert({
      tenant_id:  caso.tenant_id,
      actor_tipo: "ADMIN",
      actor_id:   auth.sub,
      accion:     "ESTADO_CAMBIADO",
      entidad:    "casos",
      entidad_id: casoId,
      datos_json: { estado_anterior: caso.estado, estado_nuevo: body.estado, motivo: body.motivo ?? null },
      ip:         clientIp(req),
      user_agent: req.headers.get("user-agent") ?? null,
    })).catch(console.error),

    // Notificar al médico si el caso llega a COMPLETADO
    body.estado === "COMPLETADO" && caso.medico_email
      ? notificarCasoCompletado({
          medicoEmail:            caso.medico_email,
          medicoNombre:           caso.medico_nombre ?? "",
          consecutivo:            caso.consecutivo,
          programa:               prog?.codigo ?? "",
          pacienteIniciales:      caso.paciente_iniciales ?? "",
          tieneIndicacionGenetica: caso.tiene_indicacion_genetica,
          estadoGenetico:          caso.estado_genetico,
          seguimientoClinico:      caso.seguimiento_clinico,
        }).catch(console.error)
      : Promise.resolve(),
  ])

  return ok({ id: casoId, estado: body.estado }, "Estado actualizado")
}

// ─── PATCH /admin/casos/:id/serica ────────────────────────────────────────────
// Registra resultado sérico y evalúa automáticamente el umbral de indicación.
export async function registrarResultadoSerico(req: Request, casoId: string): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ...ROLES_ADMIN)
  if (denied) return denied

  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()

  const { data: caso } = await db.from("casos")
    .select("id, estado, tenant_id, programa_id, resultado_serico_1, resultado_serico_2, medico_email, medico_nombre, paciente_iniciales, consecutivo, programas(nombre, codigo)")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  const CAMPOS = [
    "resultado_serico_1", "resultado_serico_2",
    "interpretacion_serico", "notas_serico",
  ]
  const now = new Date().toISOString()
  const update: Record<string, unknown> = { updated_at: now, serica_registrada_at: now }
  for (const k of CAMPOS) if (body[k] !== undefined) update[k] = body[k] || null

  // Evaluar umbral automáticamente si hay valores séricos
  const r1 = (update.resultado_serico_1 ?? caso.resultado_serico_1) as string | null
  const r2 = (update.resultado_serico_2 ?? caso.resultado_serico_2) as string | null

  let indicacion: boolean | null = null
  let umbralEval: { resultado: string; automatico: boolean } | null = null

  if (r1 !== null || r2 !== null) {
    const { data: prog } = await db.from("programas")
      .select("umbral_json, codigo")
      .eq("id", caso.programa_id)
      .single()

    if (prog?.umbral_json) {
      indicacion = evaluarUmbral(prog.umbral_json as UmbralJson, r1, r2)
      if (indicacion !== null) {
        update.tiene_indicacion_genetica = indicacion
        umbralEval = {
          resultado:  indicacion ? "CON_INDICACION_GENETICA" : "SIN_INDICACION_GENETICA",
          automatico: true,
        }
      }
    }
  }

  // Si el caso no está ya en un estado posterior, avanzar a RESULTADO_SERICO_DISPONIBLE
  const estadosAnteriores = [
    "SOLICITUD_RECIBIDA", "EN_PROGRAMACION", "PENDIENTE_AUTORIZACION",
    "AUTORIZADO", "PROGRAMADO", "MUESTRA_TOMADA",
  ]
  if (estadosAnteriores.includes(caso.estado) && r1 !== null) {
    update.estado = "RESULTADO_SERICO_DISPONIBLE"
  }

  const { error } = await db.from("casos").update(update).eq("id", casoId)
  if (error) return err(500, error.message)

  const sericoProg = (caso.programas as { nombre: string; codigo: string } | null)
  const estadoFinalSerico = (update.estado ?? caso.estado) as string

  await Promise.all([
    Promise.resolve(db.from("audit_log").insert({
      tenant_id:  caso.tenant_id,
      actor_tipo: "ADMIN",
      actor_id:   auth.sub,
      accion:     "RESULTADO_SERICO_REGISTRADO",
      entidad:    "casos",
      entidad_id: casoId,
      datos_json: { r1, r2, indicacion, estado_nuevo: estadoFinalSerico },
      ip:         clientIp(req),
      user_agent: req.headers.get("user-agent") ?? null,
    })).catch(console.error),

    // Notificar al médico cuando el resultado sérico está disponible
    estadoFinalSerico === "RESULTADO_SERICO_DISPONIBLE" && caso.medico_email
      ? notificarResultadoSerico({
          medicoEmail:       caso.medico_email,
          medicoNombre:      caso.medico_nombre ?? "",
          consecutivo:       caso.consecutivo,
          programa:          sericoProg?.codigo ?? "",
          pacienteIniciales: caso.paciente_iniciales ?? "",
          resultado:         r1 ?? "",
          interpretacion:    (update.interpretacion_serico ?? null) as string | null,
        }).catch(console.error)
      : Promise.resolve(),
  ])

  return ok({
    id:          casoId,
    estado:      estadoFinalSerico,
    indicacion:  umbralEval,
  }, "Resultado sérico registrado")
}

// ─── PATCH /admin/casos/:id/indicacion ────────────────────────────────────────
// Override manual de indicación genética (Duchenne o cuando el umbral es ambiguo)
export async function setIndicacion(req: Request, casoId: string): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ...ROLES_ADMIN)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  if (body?.tiene_indicacion_genetica === undefined) {
    return err(400, "Campo requerido: tiene_indicacion_genetica (true | false)")
  }

  const tieneIndicacion = Boolean(body.tiene_indicacion_genetica)
  const db = getDb()

  const { data: caso } = await db.from("casos")
    .select("id, estado, tenant_id, consecutivo, medico_email, medico_nombre, paciente_iniciales, programas(nombre, codigo)")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  const estadoNuevo = tieneIndicacion ? "CON_INDICACION_GENETICA" : "SIN_INDICACION_GENETICA"

  if (!validarTransicion(caso.estado, estadoNuevo)) {
    return err(422, `El estado actual (${caso.estado}) no permite establecer indicación genética`)
  }

  const nowI = new Date().toISOString()
  await db.from("casos").update({
    tiene_indicacion_genetica: tieneIndicacion,
    indicacion_motivo:         body.motivo ?? null,
    indicacion_registrada_at:  nowI,
    estado:                    estadoNuevo,
    updated_at:                nowI,
  }).eq("id", casoId)

  const indicProg = (caso.programas as { nombre: string; codigo: string } | null)

  await Promise.all([
    Promise.resolve(db.from("audit_log").insert({
      tenant_id:  caso.tenant_id,
      actor_tipo: "ADMIN",
      actor_id:   auth.sub,
      accion:     "INDICACION_GENETICA_ESTABLECIDA",
      entidad:    "casos",
      entidad_id: casoId,
      datos_json: { tiene_indicacion_genetica: tieneIndicacion, estado_nuevo: estadoNuevo, motivo: body.motivo ?? null },
      ip:         clientIp(req),
      user_agent: req.headers.get("user-agent") ?? null,
    })).catch(console.error),

    caso.medico_email
      ? notificarIndicacionGenetica({
          medicoEmail:       caso.medico_email,
          medicoNombre:      caso.medico_nombre ?? "",
          consecutivo:       caso.consecutivo,
          programa:          indicProg?.codigo ?? "",
          pacienteIniciales: caso.paciente_iniciales ?? "",
          tieneIndicacion:   tieneIndicacion,
          motivo:            body.motivo ?? null,
        }).catch(console.error)
      : Promise.resolve(),
  ])

  return ok({ id: casoId, estado: estadoNuevo, tiene_indicacion_genetica: tieneIndicacion })
}

// ─── PATCH /admin/casos/:id/genetica ─────────────────────────────────────────
export async function registrarResultadoGenetico(req: Request, casoId: string): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ...ROLES_ADMIN)
  if (denied) return denied

  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()

  const { data: caso } = await db.from("casos")
    .select("id, estado, tenant_id")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  const CAMPOS = [
    "laboratorio_genetico", "fecha_genetica",
    "resultado_genetico", "estado_genetico",
  ]
  const ESTADOS_GENETICO_VALIDOS = new Set([
    "PROGRAMADO", "EN_PROCESAMIENTO", "REALIZADO",
    "SIN_INDICACION_GENETICA", "N_A", "NO_ACEPTA",
  ])

  const nowG = new Date().toISOString()
  const update: Record<string, unknown> = { updated_at: nowG, genetica_registrada_at: nowG }
  for (const k of CAMPOS) if (body[k] !== undefined) update[k] = body[k] || null

  if (update.estado_genetico && !ESTADOS_GENETICO_VALIDOS.has(update.estado_genetico as string)) {
    return err(400, `estado_genetico inválido: ${update.estado_genetico}`)
  }

  // Si hay resultado_genetico, avanzar el estado del caso a GENETICA_RESULTADO_DISPONIBLE
  if (body.resultado_genetico && validarTransicion(caso.estado, "GENETICA_RESULTADO_DISPONIBLE")) {
    update.estado = "GENETICA_RESULTADO_DISPONIBLE"
  }

  const { error } = await db.from("casos").update(update).eq("id", casoId)
  if (error) return err(500, error.message)

  await Promise.resolve(db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   auth.sub,
    accion:     "RESULTADO_GENETICO_REGISTRADO",
    entidad:    "casos",
    entidad_id: casoId,
    datos_json: {
      fenotipo:       body.fenotipo ?? null,
      estado_genetico: body.estado_genetico ?? null,
      estado_nuevo:   update.estado ?? caso.estado,
    },
    ip:         clientIp(req),
    user_agent: req.headers.get("user-agent") ?? null,
  })).catch(console.error)

  return ok({ id: casoId, estado: update.estado ?? caso.estado }, "Resultado genético registrado")
}

// ─── PATCH /admin/casos/:id/seguimiento ──────────────────────────────────────
// Seguimiento clínico — principalmente Wilson (portador, en tratamiento, etc.)
export async function registrarSeguimiento(req: Request, casoId: string): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ...ROLES_ADMIN)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  if (!body?.seguimiento_clinico) return err(400, "Campo requerido: seguimiento_clinico")

  const VALORES_VALIDOS = new Set([
    "NEGATIVO", "PORTADOR", "POSITIVO", "EN_TRATAMIENTO",
    "FORMULADO", "TRASPLANTADO", "DROP_OUT", "FALLECIDO", "N_A",
  ])
  if (!VALORES_VALIDOS.has(body.seguimiento_clinico)) {
    return err(400, `Valor inválido: ${body.seguimiento_clinico}`)
  }

  const db = getDb()

  const { data: caso } = await db.from("casos")
    .select("id, tenant_id")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  const nowS = new Date().toISOString()
  await db.from("casos").update({
    seguimiento_clinico:      body.seguimiento_clinico,
    notas_seguimiento:        body.notas_seguimiento ?? null,
    seguimiento_registrado_at: nowS,
    updated_at:               nowS,
  }).eq("id", casoId)

  await Promise.resolve(db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   auth.sub,
    accion:     "SEGUIMIENTO_REGISTRADO",
    entidad:    "casos",
    entidad_id: casoId,
    datos_json: { seguimiento_clinico: body.seguimiento_clinico, notas: body.notas_seguimiento ?? null },
    ip:         clientIp(req),
    user_agent: req.headers.get("user-agent") ?? null,
  })).catch(console.error)

  return ok({ id: casoId, seguimiento_clinico: body.seguimiento_clinico })
}

// ─── DELETE /admin/casos/:id ──────────────────────────────────────────────────
// Soft delete — solo ADMIN
export async function eliminarCaso(req: Request, casoId: string): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, "ADMIN")
  if (denied) return denied

  const db = getDb()

  const { data: caso } = await db.from("casos")
    .select("id, tenant_id, consecutivo")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  await db.from("casos").update({ deleted_at: new Date().toISOString() }).eq("id", casoId)

  await Promise.resolve(db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   auth.sub,
    accion:     "CASO_ELIMINADO",
    entidad:    "casos",
    entidad_id: casoId,
    datos_json: { consecutivo: caso.consecutivo },
    ip:         clientIp(req),
    user_agent: req.headers.get("user-agent") ?? null,
  })).catch(console.error)

  return ok(null, "Caso eliminado")
}

// ─── GET /admin/dashboard ─────────────────────────────────────────────────────
// Métricas del panel principal + analytics completos para BI
// Query params opcionales: programa, pais, ano, medico, estado
export async function obtenerDashboard(req: Request): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ...ROLES_ADMIN)
  if (denied) return denied

  const url     = new URL(req.url)
  const fProg   = url.searchParams.get("programa")   // WILSON | DAAT | DUCHENNE
  const fPais   = url.searchParams.get("pais")        // CO | EC | PA …
  const fAno    = url.searchParams.get("ano")         // 2024
  const fMedico = url.searchParams.get("medico")      // búsqueda por email o nombre
  const fEstado = url.searchParams.get("estado")      // estado del caso

  const db = getDb()

  // Resolver código de programa → id
  let fProgramaId: string | null = null
  if (fProg) {
    const { data: prog } = await db.from("programas").select("id").eq("codigo", fProg).single()
    fProgramaId = prog?.id ?? null
  }

  // Aplicar filtros comunes a cualquier query sobre la tabla casos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function withFilters(q: any) {
    q = q.is("deleted_at", null)
    if (fProgramaId) q = q.eq("programa_id", fProgramaId)
    if (fPais)       q = q.eq("pais_codigo", fPais)
    if (fAno)        q = q.like("mes_solicitud", `${fAno}-%`)
    if (fEstado)     q = q.eq("estado", fEstado)
    if (fMedico)     q = q.or(`medico_email.ilike.%${fMedico}%,medico_nombre.ilike.%${fMedico}%`)
    return q
  }

  const [
    porEstado,
    porPais,
    porMes,
    pendienteAutorizacion,
    casosRecientes,
    rawCasos,
  ] = await Promise.all([
    withFilters(db.from("casos").select("estado, count:id.count()")),

    withFilters(db.from("casos").select("pais_codigo, count:id.count()")),

    withFilters(
      db.from("casos").select("mes_solicitud, count:id.count()")
    ).not("mes_solicitud", "is", null).order("mes_solicitud", { ascending: false }).limit(12),

    withFilters(
      db.from("casos").select("id", { count: "exact", head: true })
    ).eq("estado", "PENDIENTE_AUTORIZACION"),

    withFilters(
      db.from("casos").select("id, consecutivo, pais_codigo, mes_solicitud, paciente_iniciales, estado, medico_nombre, medico_email, created_at, updated_at, programas(nombre, codigo)")
    ).order("created_at", { ascending: false }).limit(10),

    // Query maestra para todas las agregaciones BI
    withFilters(
      db.from("casos").select("medico_email, medico_nombre, estado, tiene_indicacion_genetica, seguimiento_clinico, paciente_autorizacion, mes_solicitud, paciente_departamento, estado_genetico, programas(codigo, nombre)")
    ),
  ])

  const rows = (rawCasos.data ?? []) as Array<{
    medico_email:             string | null
    medico_nombre:            string | null
    estado:                   string
    tiene_indicacion_genetica: boolean | null
    seguimiento_clinico:      string | null
    paciente_autorizacion:    string
    mes_solicitud:            string | null
    paciente_departamento:    string | null
    estado_genetico:          string | null
    programas:                { codigo: string; nombre: string } | null
  }>

  // ── Por programa (derivado de rawCasos para shape correcta) ─────────────
  const progMap = new Map<string, { codigo: string; nombre: string; count: number }>()
  for (const r of rows) {
    const prog = r.programas as { codigo: string; nombre: string } | null
    if (!prog?.codigo) continue
    const entry = progMap.get(prog.codigo)
    if (entry) entry.count++
    else progMap.set(prog.codigo, { codigo: prog.codigo, nombre: prog.nombre ?? prog.codigo, count: 1 })
  }
  const por_programa = [...progMap.values()].sort((a, b) => b.count - a.count)

  // ── Por departamento (top 20, excluyendo nulos) ───────────────────────────
  const deptMap = new Map<string, number>()
  for (const r of rows) {
    const d = r.paciente_departamento?.trim() || "Sin especificar"
    deptMap.set(d, (deptMap.get(d) ?? 0) + 1)
  }
  const por_departamento = [...deptMap.entries()]
    .map(([departamento, count]) => ({ departamento, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // ── Por año (derivado de mes_solicitud YYYY-MM) ───────────────────────────
  const anoMap = new Map<string, number>()
  for (const r of rows) {
    const ano = r.mes_solicitud?.slice(0, 4)
    if (ano) anoMap.set(ano, (anoMap.get(ano) ?? 0) + 1)
  }
  const por_ano = [...anoMap.entries()]
    .map(([ano, count]) => ({ ano, count }))
    .sort((a, b) => a.ano.localeCompare(b.ano))

  // ── Por mes × programa (últimos 18 meses para gráfica agrupada) ───────────
  const mpmMap = new Map<string, number>()
  for (const r of rows) {
    const programa = (r.programas as { codigo: string } | null)?.codigo
    if (r.mes_solicitud && programa) {
      const k = `${r.mes_solicitud}::${programa}`
      mpmMap.set(k, (mpmMap.get(k) ?? 0) + 1)
    }
  }
  const allMeses = [...new Set(rows.map(r => r.mes_solicitud).filter(Boolean) as string[])]
    .sort().slice(-18)
  const por_mes_programa = [...mpmMap.entries()]
    .map(([k, count]) => { const [mes, programa] = k.split("::"); return { mes, programa, count } })
    .filter(x => allMeses.includes(x.mes))
    .sort((a, b) => a.mes.localeCompare(b.mes))

  // ── Distribución estado_genetico ─────────────────────────────────────────
  const egMap = new Map<string, number>()
  for (const r of rows) {
    const eg = r.estado_genetico ?? "N_A"
    egMap.set(eg, (egMap.get(eg) ?? 0) + 1)
  }
  const estado_genetico_dist = [...egMap.entries()]
    .map(([estado_genetico, count]) => ({ estado_genetico, count }))
    .sort((a, b) => b.count - a.count)

  // ── Distribución seguimiento clínico ──────────────────────────────────────
  const sgMap = new Map<string, number>()
  for (const r of rows) {
    const sg = r.seguimiento_clinico ?? "N_A"
    if (sg !== "N_A") sgMap.set(sg, (sgMap.get(sg) ?? 0) + 1)
  }
  const seguimiento_dist = [...sgMap.entries()]
    .map(([seguimiento_clinico, count]) => ({ seguimiento_clinico, count }))
    .sort((a, b) => b.count - a.count)

  // ── Tasas de autorización del paciente ────────────────────────────────────
  let autorizadoN = 0, noAutorizadoN = 0, pendienteN = 0
  for (const r of rows) {
    if (r.paciente_autorizacion === "AUTORIZADO")    autorizadoN++
    else if (r.paciente_autorizacion === "NO_AUTORIZADO") noAutorizadoN++
    else                                              pendienteN++
  }
  const tasa_autorizacion = { autorizado: autorizadoN, no_autorizado: noAutorizadoN, pendiente: pendienteN }

  // ── Embudo de conversión ──────────────────────────────────────────────────
  // Cada nivel es un subconjunto del anterior en el flujo clínico
  const ESTADOS_AUTH    = new Set(["AUTORIZADO","PROGRAMADO","MUESTRA_TOMADA","RESULTADO_SERICO_DISPONIBLE","CON_INDICACION_GENETICA","SIN_INDICACION_GENETICA","GENETICA_PROGRAMADA","GENETICA_EN_PROCESAMIENTO","GENETICA_RESULTADO_DISPONIBLE","COMPLETADO"])
  const ESTADOS_MUESTRA = new Set(["MUESTRA_TOMADA","RESULTADO_SERICO_DISPONIBLE","CON_INDICACION_GENETICA","SIN_INDICACION_GENETICA","GENETICA_PROGRAMADA","GENETICA_EN_PROCESAMIENTO","GENETICA_RESULTADO_DISPONIBLE","COMPLETADO"])
  const ESTADOS_SERICO  = new Set(["RESULTADO_SERICO_DISPONIBLE","CON_INDICACION_GENETICA","SIN_INDICACION_GENETICA","GENETICA_PROGRAMADA","GENETICA_EN_PROCESAMIENTO","GENETICA_RESULTADO_DISPONIBLE","COMPLETADO"])
  const ESTADOS_GEN_DONE = new Set(["GENETICA_RESULTADO_DISPONIBLE","COMPLETADO"])

  let total = 0, fAutorizados = 0, fMuestra = 0, fSerico = 0
  let fConIndicacion = 0, fSinIndicacion = 0, fGenetica = 0, fCompletados = 0, fNoAcepto = 0
  for (const r of rows) {
    total++
    if (ESTADOS_AUTH.has(r.estado))    fAutorizados++
    if (ESTADOS_MUESTRA.has(r.estado)) fMuestra++
    if (ESTADOS_SERICO.has(r.estado))  fSerico++
    if (r.tiene_indicacion_genetica === true)  fConIndicacion++
    if (r.tiene_indicacion_genetica === false) fSinIndicacion++
    if (ESTADOS_GEN_DONE.has(r.estado)) fGenetica++
    if (r.estado === "COMPLETADO")      fCompletados++
    if (r.estado === "NO_ACEPTO" || r.paciente_autorizacion === "NO_AUTORIZADO") fNoAcepto++
  }
  const conversion_funnel = {
    total, autorizados: fAutorizados, muestra_tomada: fMuestra,
    con_resultado_serico: fSerico, con_indicacion: fConIndicacion,
    sin_indicacion: fSinIndicacion, genetica_realizada: fGenetica,
    completados: fCompletados, no_acepto: fNoAcepto,
  }

  // ── Estadísticas por médico ───────────────────────────────────────────────
  const ESTADOS_PENDIENTE = new Set(["SOLICITUD_RECIBIDA","EN_PROGRAMACION","PENDIENTE_AUTORIZACION"])
  const ESTADOS_EN_PROCESO = new Set(["AUTORIZADO","PROGRAMADO","MUESTRA_TOMADA","RESULTADO_SERICO_DISPONIBLE","CON_INDICACION_GENETICA","GENETICA_PROGRAMADA","GENETICA_EN_PROCESAMIENTO","GENETICA_RESULTADO_DISPONIBLE"])

  const medicoMap = new Map<string, {
    medico_email: string; medico_nombre: string
    total: number; pendientes: number; en_proceso: number
    sin_indicacion: number; con_indicacion: number
    positivos: number; negativos: number; no_acepto: number; completados: number
  }>()

  for (const r of rows) {
    const key = r.medico_email ?? "sin-email"
    if (!medicoMap.has(key)) {
      medicoMap.set(key, {
        medico_email: r.medico_email ?? "", medico_nombre: r.medico_nombre ?? "Sin nombre",
        total: 0, pendientes: 0, en_proceso: 0, sin_indicacion: 0,
        con_indicacion: 0, positivos: 0, negativos: 0, no_acepto: 0, completados: 0,
      })
    }
    const m = medicoMap.get(key)!
    m.total++
    if (ESTADOS_PENDIENTE.has(r.estado))  m.pendientes++
    if (ESTADOS_EN_PROCESO.has(r.estado)) m.en_proceso++
    if (r.tiene_indicacion_genetica === true)  m.con_indicacion++
    if (r.tiene_indicacion_genetica === false) m.sin_indicacion++
    if (r.seguimiento_clinico === "POSITIVO")  m.positivos++
    if (r.seguimiento_clinico === "NEGATIVO")  m.negativos++
    if (r.estado === "NO_ACEPTO" || r.paciente_autorizacion === "NO_AUTORIZADO") m.no_acepto++
    if (r.estado === "COMPLETADO") m.completados++
  }

  const por_medico = [...medicoMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 50)
    .map(m => {
      const base = m.con_indicacion + m.sin_indicacion
      return {
        ...m,
        tasa_conversion: base > 0 ? Math.round((m.con_indicacion / base) * 100) : 0,
        tasa_completado:  m.total > 0 ? Math.round((m.completados / m.total) * 100) : 0,
      }
    })

  // ── Heatmap: top 10 médicos × últimos 12 meses ────────────────────────────
  const top10Emails = new Set(por_medico.slice(0, 10).map(m => m.medico_email))
  const heatKeys = new Map<string, { medico_email: string; medico_nombre: string; mes: string; count: number }>()
  for (const r of rows) {
    if (!r.mes_solicitud || !r.medico_email) continue
    if (!top10Emails.has(r.medico_email)) continue
    const k = `${r.medico_email}::${r.mes_solicitud}`
    if (!heatKeys.has(k)) {
      heatKeys.set(k, { medico_email: r.medico_email, medico_nombre: r.medico_nombre ?? "", mes: r.mes_solicitud, count: 0 })
    }
    heatKeys.get(k)!.count++
  }
  const last12 = allMeses.slice(-12)
  const heatmap_medico_mes = [...heatKeys.values()].filter(h => last12.includes(h.mes))

  // ── Lista de médicos únicos (para filtro en frontend) ─────────────────────
  const medicos_lista = [...new Set(rows.map(r => r.medico_email).filter(Boolean))]
    .map(email => {
      const r = rows.find(x => x.medico_email === email)
      return { email, nombre: r?.medico_nombre ?? email }
    })
    .sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? ""))

  // ── Filtros activos (para que el frontend refleje el estado) ───────────────
  const filtros_activos = {
    programa: fProg ?? null,
    pais:     fPais ?? null,
    ano:      fAno  ?? null,
    medico:   fMedico ?? null,
    estado:   fEstado ?? null,
  }

  return ok({
    por_estado:              porEstado.data ?? [],
    por_programa,
    por_pais:                porPais.data ?? [],
    por_mes:                 porMes.data ?? [],
    pendientes_autorizacion: pendienteAutorizacion.count ?? 0,
    casos_recientes:         casosRecientes.data ?? [],
    por_departamento,
    por_ano,
    por_mes_programa,
    estado_genetico_dist,
    seguimiento_dist,
    tasa_autorizacion,
    por_medico,
    heatmap_medico_mes,
    conversion_funnel,
    medicos_lista,
    filtros_activos,
  })
}
