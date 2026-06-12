// Fase 4: Panel admin — gestión de casos
// Todos los endpoints requieren autenticación (ADMIN o OPERADOR)

import { getDb }                     from "../utils/db.ts"
import { ok, created, paginated, err } from "../utils/responses.ts"
import { parsePagination }            from "../utils/router.ts"
import { requireAuth, requireRole }   from "../middleware/auth.ts"
import { clientIp }                   from "../middleware/rate-limit.ts"
import { validarTransicion, evaluarUmbral, type UmbralJson } from "../utils/states.ts"

// Campos que se devuelven en el listado (sin campos de resultado pesados)
const COLS_LISTA = [
  "id", "consecutivo", "pais_codigo",
  "medico_nombre", "medico_email",
  "paciente_nombre", "paciente_tipo_doc", "paciente_num_doc", "paciente_iniciales",
  "paciente_autorizacion", "estado", "tiene_indicacion_genetica",
  "mes_solicitud", "fecha_toma_muestra", "fecha_resultado_genetica",
  "created_at", "updated_at",
].join(", ")

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
  const programa  = url.searchParams.get("programa")      // ID de programa
  const pais      = url.searchParams.get("pais")
  const mes       = url.searchParams.get("mes")           // formato YYYY-MM
  const busqueda  = url.searchParams.get("q")
  const autorizacion = url.searchParams.get("autorizacion")

  const db = getDb()
  let q = db.from("casos")
    .select(COLS_LISTA, { count: "exact" })
    .is("deleted_at", null)
    .range(from, to)
    .order("created_at", { ascending: false })

  if (estado)       q = q.eq("estado", estado)
  if (programa)     q = q.eq("programa_id", programa)
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
    .select("id, estado, tenant_id")
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

  await db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   null,
    accion:     "ESTADO_CAMBIADO",
    entidad:    "casos",
    entidad_id: casoId,
    datos_json: { estado_anterior: caso.estado, estado_nuevo: body.estado, motivo: body.motivo ?? null },
    ip:         clientIp(req),
    user_agent: req.headers.get("user-agent") ?? null,
  }).catch(console.error)

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
    .select("id, estado, tenant_id, programa_id, resultado_1_valor, resultado_2_valor")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  const CAMPOS = [
    "laboratorio", "sede", "fecha_programacion", "fecha_toma_muestra",
    "resultado_1_valor", "resultado_1_unidad",
    "resultado_2_valor", "resultado_2_unidad",
    "valores_referencia", "fecha_reporte_lab",
    "fecha_envio_medico", "fecha_envio_paciente", "medio_envio",
    "costo_serico", "observaciones_serica",
  ]
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of CAMPOS) if (body[k] !== undefined) update[k] = body[k] || null

  // Evaluar umbral automáticamente si hay valores séricos
  const r1 = (update.resultado_1_valor ?? caso.resultado_1_valor) as string | null
  const r2 = (update.resultado_2_valor ?? caso.resultado_2_valor) as string | null

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

  await db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   null,
    accion:     "RESULTADO_SERICO_REGISTRADO",
    entidad:    "casos",
    entidad_id: casoId,
    datos_json: { r1, r2, indicacion, estado_nuevo: update.estado ?? caso.estado },
    ip:         clientIp(req),
    user_agent: req.headers.get("user-agent") ?? null,
  }).catch(console.error)

  return ok({
    id:          casoId,
    estado:      update.estado ?? caso.estado,
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
    .select("id, estado, tenant_id")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  const estadoNuevo = tieneIndicacion ? "CON_INDICACION_GENETICA" : "SIN_INDICACION_GENETICA"

  if (!validarTransicion(caso.estado, estadoNuevo)) {
    return err(422, `El estado actual (${caso.estado}) no permite establecer indicación genética`)
  }

  await db.from("casos").update({
    tiene_indicacion_genetica: tieneIndicacion,
    estado:                    estadoNuevo,
    updated_at:                new Date().toISOString(),
  }).eq("id", casoId)

  await db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   null,
    accion:     "INDICACION_GENETICA_ESTABLECIDA",
    entidad:    "casos",
    entidad_id: casoId,
    datos_json: { tiene_indicacion_genetica: tieneIndicacion, estado_nuevo: estadoNuevo, motivo: body.motivo ?? null },
    ip:         clientIp(req),
    user_agent: req.headers.get("user-agent") ?? null,
  }).catch(console.error)

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
    "lab_genetico", "costo_genetico",
    "fecha_toma_genetica", "fecha_resultado_genetica",
    "gen_analizado", "resultado_genetico", "fenotipo",
    "estado_genetico", "observaciones_genetica",
  ]
  const ESTADOS_GENETICO_VALIDOS = new Set([
    "PROGRAMADO", "EN_PROCESAMIENTO", "REALIZADO",
    "SIN_INDICACION_GENETICA", "N_A", "NO_ACEPTA",
  ])

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
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

  await db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   null,
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
  }).catch(console.error)

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
  if (!body?.seguimiento) return err(400, "Campo requerido: seguimiento")

  const VALORES_VALIDOS = new Set([
    "NEGATIVO", "PORTADOR", "POSITIVO", "EN_TRATAMIENTO",
    "FORMULADO", "TRASPLANTADO", "DROP_OUT", "FALLECIDO", "N_A",
  ])
  if (!VALORES_VALIDOS.has(body.seguimiento)) {
    return err(400, `Valor inválido: ${body.seguimiento}`)
  }

  const db = getDb()

  const { data: caso } = await db.from("casos")
    .select("id, tenant_id")
    .eq("id", casoId)
    .is("deleted_at", null)
    .single()
  if (!caso) return err(404, "Caso no encontrado")

  await db.from("casos").update({
    seguimiento: body.seguimiento,
    updated_at:  new Date().toISOString(),
  }).eq("id", casoId)

  await db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   null,
    accion:     "SEGUIMIENTO_REGISTRADO",
    entidad:    "casos",
    entidad_id: casoId,
    datos_json: { seguimiento: body.seguimiento },
    ip:         clientIp(req),
    user_agent: req.headers.get("user-agent") ?? null,
  }).catch(console.error)

  return ok({ id: casoId, seguimiento: body.seguimiento })
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

  await db.from("audit_log").insert({
    tenant_id:  caso.tenant_id,
    actor_tipo: "ADMIN",
    actor_id:   null,
    accion:     "CASO_ELIMINADO",
    entidad:    "casos",
    entidad_id: casoId,
    datos_json: { consecutivo: caso.consecutivo },
    ip:         clientIp(req),
    user_agent: req.headers.get("user-agent") ?? null,
  }).catch(console.error)

  return ok(null, "Caso eliminado")
}

// ─── GET /admin/dashboard ─────────────────────────────────────────────────────
// Métricas del panel principal
export async function obtenerDashboard(req: Request): Promise<Response> {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ...ROLES_ADMIN)
  if (denied) return denied

  const db = getDb()

  // Ejecutar queries en paralelo
  const [
    porEstado,
    porPrograma,
    porPais,
    porMes,
    pendienteAutorizacion,
    casosRecientes,
  ] = await Promise.all([
    // Conteo por estado
    db.from("casos")
      .select("estado, count:id.count()")
      .is("deleted_at", null),

    // Conteo por programa (join a nombre)
    db.from("casos")
      .select("programas(codigo, nombre), count:id.count()")
      .is("deleted_at", null),

    // Conteo por país
    db.from("casos")
      .select("pais_codigo, count:id.count()")
      .is("deleted_at", null),

    // Conteo por mes (últimos 12 meses)
    db.from("casos")
      .select("mes_solicitud, count:id.count()")
      .is("deleted_at", null)
      .not("mes_solicitud", "is", null)
      .order("mes_solicitud", { ascending: false })
      .limit(12),

    // Casos pendientes de autorización
    db.from("casos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "PENDIENTE_AUTORIZACION")
      .is("deleted_at", null),

    // Casos recientes
    db.from("casos")
      .select("id, consecutivo, paciente_iniciales, estado, medico_nombre, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  return ok({
    por_estado:             porEstado.data ?? [],
    por_programa:           porPrograma.data ?? [],
    por_pais:               porPais.data ?? [],
    por_mes:                porMes.data ?? [],
    pendientes_autorizacion: pendienteAutorizacion.count ?? 0,
    casos_recientes:        casosRecientes.data ?? [],
  })
}
