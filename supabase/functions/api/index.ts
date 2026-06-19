import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import bcrypt from "npm:bcryptjs@2"
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1"

// ── Módulos v2.0 (Fase 2+) ──────────────────────────────────────────────────
import { getDb }                        from "./utils/db.ts"
import { ok, created, paginated, err, escHtml }  from "./utils/responses.ts"
import { corsHeaders, withCors }        from "./middleware/cors.ts"
import { matchPath, parsePagination }   from "./utils/router.ts"
import {
  signAccess, signRefresh, verifyRefresh,
  requireAuth, requireRole,
  type UserRole, type AuthUser,
} from "./middleware/auth.ts"
import { checkRateLimit, clientIp } from "./middleware/rate-limit.ts"
import {
  publicGetForm,
  publicCrearCaso,
  publicSubirResultadoPrevio,
} from "./routes/formulario.ts"
import {
  generarLinkPaciente,
  invalidarLinkPaciente,
  obtenerCasoParaAutorizacion,
  responderAutorizacion,
} from "./routes/autorizacion.ts"
import {
  listarCasos,
  obtenerCaso,
  cambiarEstado,
  registrarResultadoSerico,
  setIndicacion,
  registrarResultadoGenetico,
  registrarSeguimiento,
  eliminarCaso,
  obtenerDashboard,
} from "./routes/admin-casos.ts"
import { importarCasos }   from "./routes/admin-import.ts"
import { generarReporte }  from "./routes/admin-reporte.ts"

type RouteParams = Record<string, string>

// ============================================================================
// NOTIFICATION HELPER
// ============================================================================
async function notify(db: ReturnType<typeof createClient>, userId: string, type: string, title: string, message: string, metadata?: object) {
  await Promise.resolve(db.from("notifications").insert({ userId, type, title, message, metadata: metadata ?? null })).catch(console.error)
}

// ============================================================================
// AUTH
// ============================================================================
async function authLogin(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) return err(400, "email and password are required")
  const db = getDb()
  const { data: user } = await db.from("users")
    .select("id, email, password, role, firstName, lastName, deletedAt")
    .eq("email", body.email).single()
  if (!user || user.deletedAt) return err(401, "Invalid credentials")
  const valid = await bcrypt.compare(body.password, user.password)
  if (!valid) return err(401, "Invalid credentials")
  const accessToken = await signAccess({ sub: user.id, email: user.email, role: user.role })
  const refreshToken = await signRefresh({ sub: user.id })
  const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7)
  await db.from("refresh_tokens").insert({ token: refreshToken, userId: user.id, expiresAt: expiresAt.toISOString() })
  return ok({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } }, "Login successful")
}

async function authRegister(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN"); if (denied) return denied
  const body = await req.json().catch(() => null)
  if (!body?.password || body.password.length < 8) return err(400, "password required (min 8 chars)")
  if (!body?.role || !["ADMIN","OPERADOR","LABORATORIO","MEDICO"].includes(body.role)) return err(400, "Invalid role")
  const db = getDb()
  if (body.email) {
    const { data: ex } = await db.from("users").select("id").eq("email", body.email).single()
    if (ex) return err(409, "Email already in use")
  }
  const email = body.email ?? `usr_${crypto.randomUUID().replace(/-/g,"").slice(0,8)}@internal.app`
  const password = await bcrypt.hash(body.password, 10)
  const { data, error } = await db.from("users")
    .insert({ email, password, role: body.role, firstName: body.firstName??null, lastName: body.lastName??null,
      documentType: body.documentType??null, documentNumber: body.documentNumber??null,
      phone: body.phone??null, specialty: body.specialty??null, medicalLicense: body.medicalLicense??null,
      createdBy: authResult.sub, updatedBy: authResult.sub })
    .select("id, email, role, firstName, lastName").single()
  if (error) return err(500, error.message)
  return created(data, "User registered")
}

async function authRegisterPatient(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) return err(400, "email and password are required")
  if (body.password.length < 8) return err(400, "Password must be at least 8 characters")
  const db = getDb()
  const { data: ex } = await db.from("users").select("id").eq("email", body.email).single()
  if (ex) return err(409, "Email already in use")
  const password = await bcrypt.hash(body.password, 10)
  const { data, error } = await db.from("users")
    .insert({ email: body.email, password, role: "PACIENTE",
      firstName: body.firstName??null, lastName: body.lastName??null,
      documentType: body.documentType??null, documentNumber: body.documentNumber??null })
    .select("id, email, role, firstName, lastName").single()
  if (error) return err(500, error.message)
  if (body.documentType && body.documentNumber) {
    await db.from("patients").update({ userId: data.id })
      .eq("documentType", body.documentType).eq("documentNumber", body.documentNumber)
      .is("userId", null).is("deletedAt", null)
  }
  return created(data, "Patient registered")
}

async function authRefresh(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.refreshToken) return err(400, "refreshToken is required")
  const payload = await verifyRefresh(body.refreshToken)
  if (!payload) return err(401, "Invalid or expired refresh token")
  const db = getDb()
  const { data: stored } = await db.from("refresh_tokens")
    .select("userId, expiresAt, invalidatedAt").eq("token", body.refreshToken).single()
  if (!stored || stored.invalidatedAt || new Date(stored.expiresAt) < new Date()) return err(401, "Refresh token invalid")
  const { data: user } = await db.from("users").select("id, email, role").eq("id", stored.userId).single()
  if (!user) return err(401, "User not found")
  // Rotate: insert new token FIRST so the old one is only invalidated after success
  const accessToken = await signAccess({ sub: user.id, email: user.email, role: user.role })
  const refreshToken = await signRefresh({ sub: user.id })
  const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7)
  const { error: insertErr } = await db.from("refresh_tokens").insert({ token: refreshToken, userId: user.id, expiresAt: expiresAt.toISOString() })
  if (insertErr) return err(500, "Token rotation failed, please try again")
  await db.from("refresh_tokens").update({ invalidatedAt: new Date().toISOString() }).eq("token", body.refreshToken)
  return ok({ accessToken, refreshToken }, "Token refreshed")
}

async function authLogout(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.refreshToken) return err(400, "refreshToken is required")
  const db = getDb()
  // Try to verify signature to get userId for narrower delete; if expired/invalid, still invalidate by token string
  const payload = await verifyRefresh(body.refreshToken)
  if (payload) {
    await db.from("refresh_tokens")
      .update({ invalidatedAt: new Date().toISOString() })
      .eq("token", body.refreshToken)
      .eq("userId", payload.sub as string)
  } else {
    // Token expired or invalid signature — invalidate by token string (token can't be reused anyway)
    await db.from("refresh_tokens")
      .update({ invalidatedAt: new Date().toISOString() })
      .eq("token", body.refreshToken)
  }
  return ok(null, "Logged out")
}

async function authMe(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const { data } = await getDb().from("users")
    .select("id, email, role, firstName, lastName, documentType, documentNumber, phone, specialty, medicalLicense, createdAt")
    .eq("id", authResult.sub).is("deletedAt", null).single()
  if (!data) return err(404, "User not found")
  return ok(data)
}

// ============================================================================
// USERS
// ============================================================================
async function usersCreate(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN"); if (denied) return denied
  const body = await req.json().catch(() => null)
  if (!body?.password || body.password.length < 8) return err(400, "password required (min 8 chars)")
  if (!body?.role) return err(400, "role is required")
  const db = getDb()
  if (body.email) {
    const { data: ex } = await db.from("users").select("id").eq("email", body.email).single()
    if (ex) return err(409, "Email already in use")
  }
  const email = body.email ?? `usr_${crypto.randomUUID().replace(/-/g,"").slice(0,8)}@internal.app`
  const password = await bcrypt.hash(body.password, 10)
  const { data, error } = await db.from("users")
    .insert({ email, password, role: body.role, firstName: body.firstName??null, lastName: body.lastName??null,
      documentType: body.documentType??null, documentNumber: body.documentNumber??null,
      phone: body.phone??null, specialty: body.specialty??null, medicalLicense: body.medicalLicense??null,
      createdBy: authResult.sub, updatedBy: authResult.sub })
    .select("id, email, role, firstName, lastName, documentType, documentNumber, phone, specialty, medicalLicense, createdAt").single()
  if (error) return err(500, error.message)
  return created(data, "User created")
}

async function usersFind(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN", "MEDICO"); if (denied) return denied
  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url)
  const role = url.searchParams.get("role")
  const search = url.searchParams.get("search")
  const db = getDb()
  let q = db.from("users").select("id, email, role, firstName, lastName, documentType, documentNumber, phone, specialty, medicalLicense, createdAt", { count: "exact" })
    .is("deletedAt", null).range(from, to).order("createdAt", { ascending: false })
  if (role) q = q.eq("role", role)
  if (search) q = q.or(`email.ilike.%${search}%,firstName.ilike.%${search}%,lastName.ilike.%${search}%`)
  const { data, count, error } = await q
  if (error) return err(500, error.message)
  return paginated(data ?? [], { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) })
}

async function usersGetOne(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN"); if (denied) return denied
  const { data } = await getDb().from("users")
    .select("id, email, role, firstName, lastName, documentType, documentNumber, phone, specialty, medicalLicense, createdAt")
    .eq("id", id).is("deletedAt", null).single()
  if (!data) return err(404, "User not found")
  return ok(data)
}

async function usersUpdate(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN"); if (denied) return denied
  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()
  const { data: ex } = await db.from("users").select("id").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "User not found")
  const allowed = ["role","firstName","lastName","documentType","documentNumber","phone","specialty","medicalLicense"]
  const update: Record<string,unknown> = { updatedBy: authResult.sub, updatedAt: new Date().toISOString() }
  for (const k of allowed) if (body[k] !== undefined) update[k] = body[k]
  if (body.password) {
    if (body.password.length < 8) return err(400, "Password too short")
    update.password = await bcrypt.hash(body.password, 10)
  }
  if (body.patientId) await db.from("patients").update({ userId: id }).eq("id", body.patientId)
  const { data, error } = await db.from("users").update(update).eq("id", id)
    .select("id, email, role, firstName, lastName, documentType, documentNumber, phone, specialty, medicalLicense").single()
  if (error) return err(500, error.message)
  return ok(data, "User updated")
}

async function usersDelete(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN"); if (denied) return denied
  const db = getDb()
  const { data: ex } = await db.from("users").select("id").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "User not found")
  await db.from("users").update({ deletedAt: new Date().toISOString() }).eq("id", id)
  return ok(null, "User deleted")
}

// ============================================================================
// PATIENTS
// ============================================================================
async function patientsCreate(req: Request, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.documentType || !body?.documentNumber || !body?.firstName || !body?.lastName || !body?.birthDate)
    return err(400, "documentType, documentNumber, firstName, lastName, birthDate are required")
  const db = getDb()
  const { data: ex } = await db.from("patients").select("id")
    .eq("documentType", body.documentType).eq("documentNumber", body.documentNumber).is("deletedAt", null).single()
  if (ex) return err(409, "Patient with this document already exists")
  const { data, error } = await db.from("patients")
    .insert({ documentType: body.documentType, documentNumber: body.documentNumber,
      firstName: body.firstName, lastName: body.lastName, birthDate: body.birthDate,
      phone: body.phone??null, email: body.email??null, city: body.city??null,
      address: body.address??null, insurance: body.insurance??null,
      createdBy: actor.sub, updatedBy: actor.sub })
    .select().single()
  if (error) return err(500, error.message)
  return created(data, "Patient created")
}

async function patientsFind(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","MEDICO"); if (denied) return denied
  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url)
  const search = url.searchParams.get("search")
  const db = getDb()
  let q = db.from("patients").select("*", { count: "exact" })
    .is("deletedAt", null).range(from, to).order("createdAt", { ascending: false })
  if (search) q = q.or(`documentNumber.ilike.%${search}%,firstName.ilike.%${search}%,lastName.ilike.%${search}%`)
  const { data, count, error } = await q
  if (error) return err(500, error.message)
  return paginated(data ?? [], { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) })
}

async function patientsGetOne(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","LABORATORIO","MEDICO"); if (denied) return denied
  const { data } = await getDb().from("patients").select("*").eq("id", id).is("deletedAt", null).single()
  if (!data) return err(404, "Patient not found")
  return ok(data)
}

async function patientsUpdate(req: Request, id: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()
  const { data: ex } = await db.from("patients").select("id").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "Patient not found")
  const allowed = ["documentType","documentNumber","firstName","lastName","birthDate","phone","email","city","address","insurance"]
  const update: Record<string,unknown> = { updatedBy: actor.sub, updatedAt: new Date().toISOString() }
  for (const k of allowed) if (body[k] !== undefined) update[k] = body[k]
  const { data, error } = await db.from("patients").update(update).eq("id", id).select().single()
  if (error) return err(500, error.message)
  return ok(data, "Patient updated")
}

async function patientsDelete(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR"); if (denied) return denied
  const db = getDb()
  const { data: ex } = await db.from("patients").select("id").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "Patient not found")
  await db.from("patients").update({ deletedAt: new Date().toISOString() }).eq("id", id)
  return ok(null, "Patient deleted")
}

// ============================================================================
// ORDERS
// ============================================================================
const ORDER_TRANSITIONS: Record<string, { to: string[]; roles: UserRole[] }[]> = {
  PENDIENTE:            [{ to:["CANCELADA"], roles:["ADMIN","OPERADOR","MEDICO"] },
                         { to:["CONSENT_PENDING"], roles:["ADMIN","OPERADOR","MEDICO"] }],
  ACCEPTED:             [{ to:["SCHEDULED"], roles:["ADMIN","OPERADOR","LABORATORIO"] },
                         { to:["CANCELADA"], roles:["ADMIN","OPERADOR"] }],
  SCHEDULED:            [{ to:["MUESTRA_RECOLECTADA"], roles:["ADMIN","LABORATORIO"] },
                         { to:["CANCELADA"], roles:["ADMIN","OPERADOR"] }],
  MUESTRA_RECOLECTADA:  [{ to:["EN_ANALISIS"], roles:["ADMIN","LABORATORIO"] },
                         { to:["RECHAZADA"], roles:["ADMIN","LABORATORIO"] }],
  EN_ANALISIS:          [{ to:["COMPLETADA"], roles:["ADMIN","LABORATORIO"] }],
}
function canTransition(from: string, to: string, role: UserRole): boolean {
  return (ORDER_TRANSITIONS[from] ?? []).some(t => t.to.includes(to) && t.roles.includes(role))
}

async function ordersCreate(req: Request, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.patientId) return err(400, "patientId is required")
  const db = getDb()
  const { data: pat } = await db.from("patients").select("id").eq("id", body.patientId).is("deletedAt", null).single()
  if (!pat) return err(404, "Patient not found")
  const { data, error } = await db.from("orders")
    .insert({ patientId: body.patientId, doctorId: body.doctorId||null,
      physician: body.physician??null, diagnosis: body.diagnosis??null,
      priority: body.priority??"NORMAL", observations: body.observations??null,
      estimatedCompletionDate: body.estimatedCompletionDate||null,
      createdBy: actor.sub, updatedBy: actor.sub })
    .select("*, patients(id, firstName, lastName, documentType, documentNumber)").single()
  if (error) return err(500, error.message)
  return created(data, "Order created")
}

async function ordersFind(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","LABORATORIO","MEDICO"); if (denied) return denied
  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url)
  const patientId = url.searchParams.get("patientId")
  const status = url.searchParams.get("status")
  const db = getDb()
  let q = db.from("orders")
    .select("*, patients(id, firstName, lastName, documentType, documentNumber)", { count: "exact" })
    .is("deletedAt", null).range(from, to).order("createdAt", { ascending: false })
  if (patientId) q = q.eq("patientId", patientId)
  if (status) q = q.eq("status", status)
  const { data, count, error } = await q
  if (error) return err(500, error.message)
  return paginated(data ?? [], { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) })
}

async function ordersGetOne(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","LABORATORIO","MEDICO"); if (denied) return denied
  const { data } = await getDb().from("orders")
    .select("*, patients(*), order_tests(*), consents(*), results(*)")
    .eq("id", id).is("deletedAt", null).single()
  if (!data) return err(404, "Order not found")
  return ok(data)
}

async function ordersUpdate(req: Request, id: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()
  const { data: ex } = await db.from("orders").select("id, status").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "Order not found")
  if (ex.status !== "PENDIENTE") return err(422, "Can only update orders in PENDIENTE status")
  const allowed = ["doctorId","physician","diagnosis","priority","observations","estimatedCompletionDate"]
  const dateFields = new Set(["estimatedCompletionDate"])
  const update: Record<string,unknown> = { updatedBy: actor.sub, updatedAt: new Date().toISOString() }
  for (const k of allowed) if (body[k] !== undefined) update[k] = dateFields.has(k) ? body[k]||null : body[k]
  const { data, error } = await db.from("orders").update(update).eq("id", id).select().single()
  if (error) return err(500, error.message)
  return ok(data, "Order updated")
}

async function ordersUpdateStatus(req: Request, id: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.status) return err(400, "status is required")
  const db = getDb()
  const { data: order } = await db.from("orders")
    .select("id, status, patientId, patients(userId)")
    .eq("id", id).is("deletedAt", null).single()
  if (!order) return err(404, "Order not found")
  if (!canTransition(order.status, body.status, actor.role))
    return err(422, `Cannot transition from ${order.status} to ${body.status} as ${actor.role}`)
  await db.from("orders").update({ status: body.status, updatedBy: actor.sub, updatedAt: new Date().toISOString() }).eq("id", id)
  const patUserId = (order.patients as { userId?: string } | null)?.userId
  if (patUserId) {
    void notify(db, patUserId, "ORDER_UPDATED", "Actualización de orden", `Tu orden cambió a: ${body.status}`)
    if (body.status === "COMPLETADA")
      void notify(db, patUserId, "RESULT_READY", "Resultados disponibles", "Tus resultados de laboratorio están listos")
  }
  return ok({ id, status: body.status }, "Status updated")
}

async function ordersDelete(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR"); if (denied) return denied
  const db = getDb()
  const { data: ex } = await db.from("orders").select("id, status").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "Order not found")
  if (ex.status !== "PENDIENTE") return err(422, "Can only delete orders in PENDIENTE status")
  await db.from("orders").update({ deletedAt: new Date().toISOString() }).eq("id", id)
  return ok(null, "Order deleted")
}

// ============================================================================
// CONSENTS
// ============================================================================
async function consentsCreate(req: Request, orderId: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()
  const { data: order } = await db.from("orders")
    .select("id, status, patientId, patients(firstName, lastName)")
    .eq("id", orderId).is("deletedAt", null).single()
  if (!order) return err(404, "Order not found")
  const { data: ex } = await db.from("consents").select("id").eq("orderId", orderId).is("deletedAt", null).single()
  if (ex) return err(409, "Consent already exists for this order")
  const pat = order.patients as { firstName: string; lastName: string } | null
  const { data, error } = await db.from("consents")
    .insert({ orderId, doctorId: actor.role === "MEDICO" ? actor.sub : null,
      patientNameSnapshot: pat ? `${pat.firstName} ${pat.lastName}` : null,
      notes: body.notes??null, createdBy: actor.sub, updatedBy: actor.sub })
    .select().single()
  if (error) return err(500, error.message)
  await db.from("orders").update({ status: "CONSENT_PENDING", updatedBy: actor.sub }).eq("id", orderId)
  return created(data, "Consent created")
}

async function consentsGet(req: Request, orderId: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","LABORATORIO","MEDICO"); if (denied) return denied
  const { data } = await getDb().from("consents").select("*").eq("orderId", orderId).is("deletedAt", null).single()
  if (!data) return err(404, "Consent not found")
  return ok(data)
}

async function generateConsentPdf(
  db: ReturnType<typeof createClient>,
  opts: {
    orderId: string; consentId: string; doctorName: string
    specialty: string | null; medicalLicense: string | null
    patientName: string; diagnosis: string | null
    notes: string | null; signedAt: Date
  }
): Promise<string | null> {
  try {
    const pdfDoc = await PDFDocument.create()
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const page = pdfDoc.addPage([612, 792])
    const { width, height } = page.getSize()
    const m = 60
    let y = height - m

    const text = (t: string, size = 11, font = regular, color = rgb(0, 0, 0)) => {
      const maxChars = Math.floor(75 * (11 / size))
      const words = t.split(" ")
      let line = ""
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word
        if (candidate.length > maxChars) {
          if (line) { page.drawText(line, { x: m, y, size, font, color }); y -= size + 6 }
          line = word
        } else {
          line = candidate
        }
      }
      if (line) { page.drawText(line, { x: m, y, size, font, color }); y -= size + 6 }
    }
    const section = (title: string) => {
      y -= 8
      page.drawLine({ start: { x: m, y: y + 4 }, end: { x: width - m, y: y + 4 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
      y -= 4
      text(title, 11, bold, rgb(0.1, 0.3, 0.6))
      y -= 2
    }

    page.drawText("CONSENTIMIENTO INFORMADO", { x: m, y, size: 20, font: bold, color: rgb(0.1, 0.2, 0.5) })
    y -= 28
    const dateStr = opts.signedAt.toLocaleString("es-CO", { timeZone: "America/Bogota" })
    text(`Fecha de firma: ${dateStr}`, 9, regular, rgb(0.45, 0.45, 0.45))
    text(`Orden #: ${opts.orderId.slice(0, 8).toUpperCase()}`, 9, regular, rgb(0.45, 0.45, 0.45))

    section("DATOS DEL MÉDICO")
    text(`Nombre: ${opts.doctorName}`)
    text(`Especialidad: ${opts.specialty ?? "No especificada"}`)
    text(`Licencia médica: ${opts.medicalLicense ?? "No especificada"}`)

    section("DATOS DEL PACIENTE")
    text(`Nombre: ${opts.patientName}`)

    if (opts.diagnosis) {
      section("DIAGNÓSTICO")
      text(opts.diagnosis)
    }

    if (opts.notes) {
      section("NOTAS")
      text(opts.notes)
    }

    section("FIRMA DIGITAL")
    text(`El médico ${opts.doctorName} firmó este documento digitalmente el ${opts.signedAt.toLocaleDateString("es-CO")}.`)
    text("Este consentimiento tiene validez como documento médico oficial generado por el sistema APP-DX.")
    y -= 20
    page.drawLine({ start: { x: m, y }, end: { x: m + 200, y }, thickness: 1, color: rgb(0, 0, 0) })
    y -= 14
    text(opts.doctorName, 10, bold)

    const pdfBytes = await pdfDoc.save()
    const path = `${opts.orderId}/${opts.consentId}.pdf`
    const { error: upErr } = await db.storage.from("consents-pdf")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true })
    if (upErr) { console.error("PDF upload error:", upErr.message); return null }

    const { data: signed } = await db.storage.from("consents-pdf").createSignedUrl(path, 7776000) // 90 days
    return signed?.signedUrl ?? null
  } catch (e) {
    console.error("Error generating/uploading consent PDF", e)
    return null
  }
}

async function consentSign(req: Request, orderId: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()
  const { data: consent } = await db.from("consents").select("id, status").eq("orderId", orderId).is("deletedAt", null).single()
  if (!consent) return err(404, "Consent not found")
  if (consent.status !== "PENDIENTE_FIRMA_MEDICO") return err(422, "Consent must be in PENDIENTE_FIRMA_MEDICO status")

  const { data: doc } = await db.from("users").select("firstName, lastName, specialty, medicalLicense").eq("id", actor.sub).single()
  const doctorName = doc ? `${doc.firstName ?? ""} ${doc.lastName ?? ""}`.trim() : "Doctor"

  const { data: order } = await db.from("orders").select("id, diagnosis, patients(firstName, lastName)").eq("id", orderId).single()
  const patient = (order as { patients?: { firstName?: string; lastName?: string } } | null)?.patients
  const patientName = patient ? `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() : "Paciente"

  const now = new Date()
  const html = `<html><body style="font-family:sans-serif;max-width:800px;margin:auto;padding:20px">
<h1>Consentimiento Informado</h1>
<p><strong>Médico:</strong> ${escHtml(doctorName)}</p>
<p><strong>Especialidad:</strong> ${escHtml(doc?.specialty ?? "N/A")}</p>
<p><strong>Licencia:</strong> ${escHtml(doc?.medicalLicense ?? "N/A")}</p>
<p><strong>Paciente:</strong> ${escHtml(patientName)}</p>
<p><strong>Fecha de firma:</strong> ${escHtml(now.toLocaleString("es-CO"))}</p>
<p><strong>Notas:</strong> ${escHtml(body.notes ?? "")}</p>
</body></html>`

  const { data, error } = await db.from("consents")
    .update({ status: "FIRMADO_MEDICO", doctorId: actor.sub, doctorNameSnapshot: doctorName,
      doctorSignedAt: now.toISOString(), documentHtml: html,
      notes: body.notes??null, updatedBy: actor.sub, updatedAt: now.toISOString() })
    .eq("id", consent.id).select().single()
  if (error) return err(500, error.message)

  const pdfUrl = await generateConsentPdf(db, {
    orderId, consentId: consent.id, doctorName,
    specialty: (doc as { specialty?: string | null } | null)?.specialty ?? null,
    medicalLicense: (doc as { medicalLicense?: string | null } | null)?.medicalLicense ?? null,
    patientName,
    diagnosis: (order as { diagnosis?: string | null } | null)?.diagnosis ?? null,
    notes: body.notes ?? null,
    signedAt: now,
  })
  if (pdfUrl) {
    await db.from("consents").update({ documentPdfUrl: pdfUrl }).eq("id", consent.id)
    ;(data as Record<string, unknown>).documentPdfUrl = pdfUrl
  }

  return ok(data, "Consent signed")
}

async function consentSend(req: Request, orderId: string, actor: AuthUser): Promise<Response> {
  const db = getDb()
  const { data: consent } = await db.from("consents")
    .select("id, status, orders(patientId, patients(userId))")
    .eq("orderId", orderId).is("deletedAt", null).single()
  if (!consent) return err(404, "Consent not found")
  if (consent.status !== "FIRMADO_MEDICO") return err(422, "Consent must be signed before sending")
  await db.from("consents").update({ status: "ENVIADO_PACIENTE", updatedBy: actor.sub, updatedAt: new Date().toISOString() }).eq("id", consent.id)
  const patUserId = ((consent.orders as { patients?: { userId?: string } } | null)?.patients)?.userId
  if (patUserId) void notify(db, patUserId, "CONSENT_REQUEST", "Nuevo consentimiento", "Tienes un consentimiento informado pendiente")
  return ok({ id: consent.id, status: "ENVIADO_PACIENTE" }, "Consent sent")
}

async function consentRespond(req: Request, orderId: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.response || !["ACEPTADO","RECHAZADO"].includes(body.response)) return err(400, "response must be ACEPTADO or RECHAZADO")
  const db = getDb()
  const { data: consent } = await db.from("consents").select("id, status, orderId").eq("orderId", orderId).is("deletedAt", null).single()
  if (!consent) return err(404, "Consent not found")
  if (consent.status !== "ENVIADO_PACIENTE") return err(422, "Consent is not awaiting response")
  const accepted = body.response === "ACEPTADO"
  const now = new Date().toISOString()
  await db.from("consents").update({ status: body.response, accepted,
    patientResponseAt: now, patientSignedAt: accepted ? now : null,
    updatedBy: actor.sub, updatedAt: now }).eq("id", consent.id)
  await db.from("orders").update({ status: accepted ? "ACCEPTED" : "RECHAZADA", updatedBy: actor.sub }).eq("id", orderId)
  const { data: order } = await db.from("orders").select("doctorId").eq("id", orderId).single()
  if (order?.doctorId) void notify(db, order.doctorId, "CONSENT_RESPONDED", "Respuesta al consentimiento", `El paciente ${accepted ? "aceptó" : "rechazó"} el consentimiento`)
  return ok({ id: consent.id, status: body.response }, "Response recorded")
}

// ============================================================================
// ORDER TESTS
// ============================================================================
async function orderTestsCreate(req: Request, orderId: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.examCode || !body?.examName) return err(400, "examCode and examName are required")
  const db = getDb()
  const { data: order } = await db.from("orders").select("id").eq("id", orderId).is("deletedAt", null).single()
  if (!order) return err(404, "Order not found")
  const { data, error } = await db.from("order_tests")
    .insert({ orderId, examCode: body.examCode, examName: body.examName,
      labTestId: body.labTestId??null, notes: body.notes??null, createdBy: actor.sub })
    .select().single()
  if (error) return err(500, error.message)
  return created(data, "Test added to order")
}

async function orderTestsDelete(req: Request, orderId: string, testId: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","MEDICO"); if (denied) return denied
  const db = getDb()
  const { data: ex } = await db.from("order_tests").select("id").eq("id", testId).eq("orderId", orderId).single()
  if (!ex) return err(404, "Order test not found")
  await db.from("order_tests").delete().eq("id", testId)
  return ok(null, "Order test deleted")
}

// ============================================================================
// LAB TESTS
// ============================================================================
async function labTestsFind(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const url = new URL(req.url)
  const all = url.searchParams.get("all") === "true"
  let q = getDb().from("lab_tests").select("*").order("name")
  if (!all) q = q.eq("isActive", true)
  const { data, error } = await q
  if (error) return err(500, error.message)
  return ok(data)
}

async function labTestsGetOne(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const { data } = await getDb().from("lab_tests").select("*").eq("id", id).single()
  if (!data) return err(404, "Lab test not found")
  return ok(data)
}

async function labTestsPrerequisite(req: Request, id: string, patientId: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const db = getDb()
  const { data: test } = await db.from("lab_tests").select("id, requiresResultFromId").eq("id", id).single()
  if (!test) return err(404, "Lab test not found")
  if (!test.requiresResultFromId) return ok({ unlocked: true, requires: null })
  const { data: prereq } = await db.from("lab_tests").select("id, code, name").eq("id", test.requiresResultFromId).single()
  const { data: orders } = await db.from("orders").select("id").eq("patientId", patientId).is("deletedAt", null)
  const orderIds = (orders ?? []).map((o: { id: string }) => o.id)
  let unlocked = false
  if (orderIds.length > 0) {
    const { data: result } = await db.from("results").select("id").in("orderId", orderIds).eq("examType", prereq?.code ?? "").limit(1).single()
    unlocked = !!result
  }
  return ok({ unlocked, requires: prereq ?? null })
}

async function labTestsCreate(req: Request, _actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.code || !body?.name) return err(400, "code and name are required")
  const { data, error } = await getDb().from("lab_tests")
    .insert({ code: body.code, name: body.name, type: body.type??"OTRO",
      category: body.category??null, description: body.description??null,
      instructions: body.instructions??null, estimatedHours: body.estimatedHours??null,
      requiresResultFromId: body.requiresResultFromId??null })
    .select().single()
  if (error) return err(500, error.message)
  return created(data, "Lab test created")
}

async function labTestsUpdate(req: Request, id: string, _actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()
  const { data: ex } = await db.from("lab_tests").select("id").eq("id", id).single()
  if (!ex) return err(404, "Lab test not found")
  const allowed = ["code","name","type","category","description","instructions","estimatedHours","requiresResultFromId","isActive"]
  const update: Record<string,unknown> = { updatedAt: new Date().toISOString() }
  for (const k of allowed) if (body[k] !== undefined) update[k] = body[k]
  const { data, error } = await db.from("lab_tests").update(update).eq("id", id).select().single()
  if (error) return err(500, error.message)
  return ok(data, "Lab test updated")
}

async function labTestsDeactivate(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN"); if (denied) return denied
  const db = getDb()
  const { data: ex } = await db.from("lab_tests").select("id").eq("id", id).single()
  if (!ex) return err(404, "Lab test not found")
  await db.from("lab_tests").update({ isActive: false, updatedAt: new Date().toISOString() }).eq("id", id)
  return ok(null, "Lab test deactivated")
}

// ============================================================================
// RESULTS
// ============================================================================
async function resultsCreate(req: Request, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.orderId || !body?.examType || !body?.value) return err(400, "orderId, examType, value are required")
  const db = getDb()
  const { data: order } = await db.from("orders").select("id, status").eq("id", body.orderId).is("deletedAt", null).single()
  if (!order) return err(404, "Order not found")
  if (!["EN_ANALISIS","COMPLETADA"].includes(order.status)) return err(422, "Order must be in EN_ANALISIS or COMPLETADA status")
  const { data, error } = await db.from("results")
    .insert({ orderId: body.orderId, examType: body.examType, value: body.value,
      unit: body.unit??null, referenceRange: body.referenceRange??null, notes: body.notes??null,
      createdBy: actor.sub, updatedBy: actor.sub })
    .select().single()
  if (error) return err(500, error.message)
  return created(data, "Result created")
}

async function resultsFind(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","LABORATORIO","MEDICO"); if (denied) return denied
  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url)
  const orderId = url.searchParams.get("orderId")
  const db = getDb()
  let q = db.from("results").select("*, result_attachments(*)", { count: "exact" })
    .is("deletedAt", null).range(from, to).order("createdAt", { ascending: false })
  if (orderId) q = q.eq("orderId", orderId)
  const { data, count, error } = await q
  if (error) return err(500, error.message)
  return paginated(data ?? [], { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) })
}

async function resultsGetOne(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","LABORATORIO","MEDICO"); if (denied) return denied
  const { data } = await getDb().from("results").select("*, result_attachments(*)").eq("id", id).is("deletedAt", null).single()
  if (!data) return err(404, "Result not found")
  return ok(data)
}

async function resultsUpdate(req: Request, id: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()
  const { data: ex } = await db.from("results").select("id").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "Result not found")
  const allowed = ["examType","value","unit","referenceRange","notes"]
  const update: Record<string,unknown> = { updatedBy: actor.sub, updatedAt: new Date().toISOString() }
  for (const k of allowed) if (body[k] !== undefined) update[k] = body[k]
  const { data, error } = await db.from("results").update(update).eq("id", id).select().single()
  if (error) return err(500, error.message)
  return ok(data, "Result updated")
}

async function resultsDelete(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","LABORATORIO"); if (denied) return denied
  const db = getDb()
  const { data: ex } = await db.from("results").select("id").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "Result not found")
  await db.from("results").update({ deletedAt: new Date().toISOString() }).eq("id", id)
  return ok(null, "Result deleted")
}

// ============================================================================
// APPOINTMENTS
// ============================================================================
async function appointmentsCreate(req: Request, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.patientId || !body?.scheduledAt) return err(400, "patientId and scheduledAt are required")
  const db = getDb()
  const { data: pat } = await db.from("patients").select("id, userId").eq("id", body.patientId).is("deletedAt", null).single()
  if (!pat) return err(404, "Patient not found")
  const { data, error } = await db.from("appointments")
    .insert({ patientId: body.patientId, orderId: body.orderId??null,
      scheduledAt: body.scheduledAt, notes: body.notes??null,
      createdBy: actor.sub, updatedBy: actor.sub })
    .select().single()
  if (error) return err(500, error.message)
  if (pat.userId) void notify(db, pat.userId, "APPOINTMENT_SCHEDULED", "Cita programada", `Tienes una cita el ${new Date(body.scheduledAt).toLocaleString("es-CO")}`)
  return created(data, "Appointment created")
}

async function appointmentsFind(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","LABORATORIO","MEDICO"); if (denied) return denied
  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url)
  const status = url.searchParams.get("status")
  const db = getDb()
  let q = db.from("appointments").select("*, patients(id, firstName, lastName)", { count: "exact" })
    .is("deletedAt", null).range(from, to).order("scheduledAt", { ascending: true })
  if (status) q = q.eq("status", status)
  const { data, count, error } = await q
  if (error) return err(500, error.message)
  return paginated(data ?? [], { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) })
}

async function appointmentsGetOne(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR","LABORATORIO","MEDICO"); if (denied) return denied
  const { data } = await getDb().from("appointments").select("*, patients(*)").eq("id", id).is("deletedAt", null).single()
  if (!data) return err(404, "Appointment not found")
  return ok(data)
}

async function appointmentsUpdate(req: Request, id: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null) ?? {}
  const db = getDb()
  const { data: ex } = await db.from("appointments").select("id, status").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "Appointment not found")
  if (["CANCELADA","COMPLETADA"].includes(ex.status)) return err(422, "Cannot modify completed or cancelled appointments")
  const update: Record<string,unknown> = { updatedBy: actor.sub, updatedAt: new Date().toISOString() }
  if (body.scheduledAt !== undefined) update.scheduledAt = body.scheduledAt
  if (body.notes !== undefined) update.notes = body.notes
  const { data, error } = await db.from("appointments").update(update).eq("id", id).select().single()
  if (error) return err(500, error.message)
  return ok(data, "Appointment updated")
}

async function appointmentsUpdateStatus(req: Request, id: string, actor: AuthUser): Promise<Response> {
  const body = await req.json().catch(() => null)
  if (!body?.status) return err(400, "status is required")
  if (!["PROGRAMADA","CONFIRMADA","CANCELADA","COMPLETADA"].includes(body.status)) return err(400, "Invalid status")
  const db = getDb()
  const { data: ex } = await db.from("appointments").select("id").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "Appointment not found")
  await db.from("appointments").update({ status: body.status, updatedBy: actor.sub, updatedAt: new Date().toISOString() }).eq("id", id)
  return ok({ id, status: body.status }, "Status updated")
}

async function appointmentsDelete(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const denied = requireRole(authResult, "ADMIN","OPERADOR"); if (denied) return denied
  const db = getDb()
  const { data: ex } = await db.from("appointments").select("id").eq("id", id).is("deletedAt", null).single()
  if (!ex) return err(404, "Appointment not found")
  await db.from("appointments").update({ deletedAt: new Date().toISOString() }).eq("id", id)
  return ok(null, "Appointment deleted")
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================
async function notificationsFind(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url, 20, 50)
  const { data, count, error } = await getDb().from("notifications")
    .select("*", { count: "exact" }).eq("userId", authResult.sub)
    .range(from, to).order("createdAt", { ascending: false })
  if (error) return err(500, error.message)
  return paginated(data ?? [], { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) })
}

async function notificationsUnreadCount(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const { count } = await getDb().from("notifications")
    .select("id", { count: "exact", head: true }).eq("userId", authResult.sub).eq("isRead", false)
  return ok({ count: count ?? 0 })
}

async function notificationsMarkRead(req: Request, id: string): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const db = getDb()
  const { data: ex } = await db.from("notifications").select("id").eq("id", id).eq("userId", authResult.sub).single()
  if (!ex) return err(404, "Notification not found")
  await db.from("notifications").update({ isRead: true, updatedAt: new Date().toISOString() }).eq("id", id)
  return ok(null, "Marked as read")
}

async function notificationsMarkAllRead(req: Request): Promise<Response> {
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  await getDb().from("notifications").update({ isRead: true, updatedAt: new Date().toISOString() })
    .eq("userId", authResult.sub).eq("isRead", false)
  return ok(null, "All notifications marked as read")
}

// ============================================================================
// PATIENT PORTAL
// ============================================================================
async function portalMe(req: Request, actor: AuthUser): Promise<Response> {
  const { data } = await getDb().from("patients").select("*").eq("userId", actor.sub).is("deletedAt", null).single()
  if (!data) return err(404, "Patient profile not found")
  return ok(data)
}

async function portalDashboard(_req: Request, actor: AuthUser): Promise<Response> {
  const db = getDb()
  const { data: pat } = await db.from("patients").select("id").eq("userId", actor.sub).is("deletedAt", null).single()
  if (!pat) return err(404, "Patient profile not found")
  const { data: ordersRaw } = await db.from("orders").select("id").eq("patientId", pat.id).is("deletedAt", null)
  const orderIds = (ordersRaw ?? []).map((o: { id: string }) => o.id)
  const [a, c, r, ap] = await Promise.all([
    db.from("orders").select("id, status, createdAt").eq("patientId", pat.id).is("deletedAt", null)
      .in("status", ["PENDIENTE","CONSENT_PENDING","ACCEPTED","SCHEDULED","MUESTRA_RECOLECTADA","EN_ANALISIS"]),
    orderIds.length > 0
      ? db.from("consents").select("id, status, orderId, createdAt").eq("status","ENVIADO_PACIENTE").in("orderId",orderIds).is("deletedAt",null)
      : Promise.resolve({ data: [] as unknown[] }),
    orderIds.length > 0
      ? db.from("results").select("id, examType, createdAt, orderId").in("orderId",orderIds).is("deletedAt",null).order("createdAt",{ascending:false}).limit(5)
      : Promise.resolve({ data: [] as unknown[] }),
    db.from("appointments").select("id, scheduledAt, status").eq("patientId",pat.id).is("deletedAt",null)
      .gte("scheduledAt",new Date().toISOString()).order("scheduledAt").limit(1),
  ])
  return ok({ activeOrders: a.data??[], pendingConsents: c.data??[], recentResults: r.data??[], nextAppointment: ap.data?.[0]??null })
}

async function portalOrders(req: Request, actor: AuthUser): Promise<Response> {
  const db = getDb()
  const { data: pat } = await db.from("patients").select("id").eq("userId", actor.sub).is("deletedAt", null).single()
  if (!pat) return err(404, "Patient profile not found")
  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url)
  const { data, count } = await db.from("orders").select("*, order_tests(*)", { count: "exact" })
    .eq("patientId", pat.id).is("deletedAt", null).range(from, to).order("createdAt", { ascending: false })
  return paginated(data ?? [], { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) })
}

async function portalOrderDetail(req: Request, orderId: string, actor: AuthUser): Promise<Response> {
  const db = getDb()
  const { data: pat } = await db.from("patients").select("id").eq("userId", actor.sub).is("deletedAt", null).single()
  if (!pat) return err(404, "Patient profile not found")
  const { data } = await db.from("orders")
    .select("*, order_tests(*), consents(*), results(*, result_attachments(*))")
    .eq("id", orderId).eq("patientId", pat.id).is("deletedAt", null).single()
  if (!data) return err(404, "Order not found")
  return ok(data)
}

async function portalOrderConsent(req: Request, orderId: string, actor: AuthUser): Promise<Response> {
  const db = getDb()
  const { data: pat } = await db.from("patients").select("id").eq("userId", actor.sub).is("deletedAt", null).single()
  if (!pat) return err(404, "Patient profile not found")
  const { data: ord } = await db.from("orders").select("id").eq("id", orderId).eq("patientId", pat.id).single()
  if (!ord) return err(404, "Order not found")
  const { data } = await db.from("consents").select("*").eq("orderId", orderId).is("deletedAt", null).single()
  if (!data) return err(404, "Consent not found")
  return ok(data)
}

async function portalConsentRespond(_req: Request, consentId: string, response: "ACEPTADO"|"RECHAZADO", actor: AuthUser): Promise<Response> {
  const db = getDb()
  const { data: pat } = await db.from("patients").select("id").eq("userId", actor.sub).is("deletedAt", null).single()
  if (!pat) return err(404, "Patient profile not found")
  const { data: consent } = await db.from("consents").select("id, status, orderId").eq("id", consentId).is("deletedAt", null).single()
  if (!consent) return err(404, "Consent not found")
  if (consent.status !== "ENVIADO_PACIENTE") return err(422, "Consent is not awaiting response")
  const { data: ord } = await db.from("orders").select("id, doctorId").eq("id", consent.orderId).eq("patientId", pat.id).single()
  if (!ord) return err(403, "Forbidden")
  const accepted = response === "ACEPTADO"
  const now = new Date().toISOString()
  await db.from("consents").update({ status: response, accepted, patientResponseAt: now, patientSignedAt: accepted?now:null, updatedAt: now }).eq("id", consentId)
  await db.from("orders").update({ status: accepted?"ACCEPTED":"RECHAZADA" }).eq("id", consent.orderId)
  if (ord.doctorId) void notify(db, ord.doctorId, "CONSENT_RESPONDED", "Respuesta al consentimiento", `Paciente ${accepted?"aceptó":"rechazó"} el consentimiento`)
  return ok({ id: consentId, status: response }, "Response recorded")
}

async function portalResults(req: Request, actor: AuthUser): Promise<Response> {
  const db = getDb()
  const { data: pat } = await db.from("patients").select("id").eq("userId", actor.sub).is("deletedAt", null).single()
  if (!pat) return err(404, "Patient profile not found")
  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url)
  const { data: ords } = await db.from("orders").select("id").eq("patientId", pat.id).is("deletedAt", null)
  const orderIds = (ords ?? []).map((o: { id: string }) => o.id)
  if (orderIds.length === 0) return paginated([], { total: 0, page, limit, totalPages: 0 })
  const { data, count } = await db.from("results").select("*, result_attachments(*)", { count: "exact" })
    .in("orderId", orderIds).is("deletedAt", null).range(from, to).order("createdAt", { ascending: false })
  return paginated(data ?? [], { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) })
}

async function portalAppointments(req: Request, actor: AuthUser): Promise<Response> {
  const db = getDb()
  const { data: pat } = await db.from("patients").select("id").eq("userId", actor.sub).is("deletedAt", null).single()
  if (!pat) return err(404, "Patient profile not found")
  const url = new URL(req.url)
  const { page, limit, from, to } = parsePagination(url)
  const { data, count } = await db.from("appointments").select("*", { count: "exact" })
    .eq("patientId", pat.id).is("deletedAt", null).range(from, to).order("scheduledAt", { ascending: true })
  return paginated(data ?? [], { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) })
}

// ============================================================================
// MAIN ROUTER
// ============================================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) })

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace(/^(\/functions\/v1)?\/api/, "") || "/"
    const m = req.method
    let res: Response

    // ── v2.0 Rutas públicas (formulario médico — sin autenticación) ──────────
    let pp: RouteParams | null
    if      (m==="GET"  && (pp=matchPath("/public/:tenant/:programa",path))       && !path.endsWith("/upload"))
                                                                                    res = await publicGetForm(req, pp.tenant, pp.programa)
    else if (m==="POST" && (pp=matchPath("/public/:tenant/:programa/upload",path))) res = await publicSubirResultadoPrevio(req, pp.tenant, pp.programa)
    else if (m==="POST" && (pp=matchPath("/public/:tenant/:programa",path)))        res = await publicCrearCaso(req, pp.tenant, pp.programa)

    // ── v2.0 Magic links (autorización del paciente — sin autenticación) ─────
    else if (m==="GET"  && (pp=matchPath("/autorizar/:token",path)))  res = await obtenerCasoParaAutorizacion(req, pp.token)
    else if (m==="POST" && (pp=matchPath("/autorizar/:token",path)))  res = await responderAutorizacion(req, pp.token)

    // ── v2.0 Admin — gestión de links (requiere ADMIN/OPERADOR) ──────────────
    else if (m==="POST"   && (pp=matchPath("/admin/casos/:id/link-paciente",path))) res = await generarLinkPaciente(req, pp.id)
    else if (m==="DELETE" && (pp=matchPath("/admin/casos/:id/link-paciente",path))) res = await invalidarLinkPaciente(req, pp.id)

    // ── v2.0 Admin — panel de gestión de casos (Fase 4) ───────────────────────
    else if (m==="GET"   && path==="/admin/dashboard")                              res = await obtenerDashboard(req)
    else if (m==="GET"   && path==="/admin/reporte")                               res = await generarReporte(req)
    else if (m==="GET"   && path==="/admin/casos")                                  res = await listarCasos(req)
    else if (m==="PATCH" && (pp=matchPath("/admin/casos/:id/estado",path)))         { const rl=checkRateLimit(`aw:${clientIp(req)}`,20,60_000); res=rl.allowed?await cambiarEstado(req,pp.id):withCors(err(429,"Demasiadas solicitudes"),req) }
    else if (m==="PATCH" && (pp=matchPath("/admin/casos/:id/serica",path)))         { const rl=checkRateLimit(`aw:${clientIp(req)}`,20,60_000); res=rl.allowed?await registrarResultadoSerico(req,pp.id):withCors(err(429,"Demasiadas solicitudes"),req) }
    else if (m==="PATCH" && (pp=matchPath("/admin/casos/:id/indicacion",path)))     res = await setIndicacion(req, pp.id)
    else if (m==="PATCH" && (pp=matchPath("/admin/casos/:id/genetica",path)))       { const rl=checkRateLimit(`aw:${clientIp(req)}`,20,60_000); res=rl.allowed?await registrarResultadoGenetico(req,pp.id):withCors(err(429,"Demasiadas solicitudes"),req) }
    else if (m==="PATCH" && (pp=matchPath("/admin/casos/:id/seguimiento",path)))    { const rl=checkRateLimit(`aw:${clientIp(req)}`,20,60_000); res=rl.allowed?await registrarSeguimiento(req,pp.id):withCors(err(429,"Demasiadas solicitudes"),req) }
    else if (m==="POST"  && (pp=matchPath("/admin/import/:tenant/:programa",path)))  { const rl=checkRateLimit(`aw:${clientIp(req)}`,5,60_000); res=rl.allowed?await importarCasos(req,pp.tenant,pp.programa):withCors(err(429,"Demasiadas solicitudes"),req) }
    else if (m==="DELETE"&& (pp=matchPath("/admin/casos/:id",path)))                res = await eliminarCaso(req, pp.id)
    else if (m==="GET"   && (pp=matchPath("/admin/casos/:id",path)))                res = await obtenerCaso(req, pp.id)

    // ── Auth ─────────────────────────────────────────────────────────────────
    else if (m==="POST"  && path==="/auth/login")             res = await authLogin(req)
    else if (m==="POST"  && path==="/auth/register")          res = await authRegister(req)
    else if (m==="POST"  && path==="/auth/register-patient")  res = await authRegisterPatient(req)
    else if (m==="POST"  && path==="/auth/refresh")           res = await authRefresh(req)
    else if (m==="POST"  && path==="/auth/logout")            res = await authLogout(req)
    else if (m==="GET"   && path==="/auth/me")                res = await authMe(req)

    // ── Users ─────────────────────────────────────────────────────────────────
    else if (m==="POST"  && path==="/users")                  res = await usersCreate(req)
    else if (m==="GET"   && path==="/users")                  res = await usersFind(req)
    else if (m==="GET"   && (pp=matchPath("/users/:id",path)))    res = await usersGetOne(req, pp.id)
    else if (m==="PATCH" && (pp=matchPath("/users/:id",path)))    res = await usersUpdate(req, pp.id)
    else if (m==="DELETE"&& (pp=matchPath("/users/:id",path)))    res = await usersDelete(req, pp.id)

    // ── Patients ──────────────────────────────────────────────────────────────
    else if (m==="POST"  && path==="/patients") {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR");res=d??await patientsCreate(req,a)}
    }
    else if (m==="GET"   && path==="/patients")               res = await patientsFind(req)
    else if (m==="GET"   && (pp=matchPath("/patients/:id",path))) res = await patientsGetOne(req, pp.id)
    else if (m==="PATCH" && (pp=matchPath("/patients/:id",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR");res=d??await patientsUpdate(req,pp.id,a)}
    }
    else if (m==="DELETE"&& (pp=matchPath("/patients/:id",path))) res = await patientsDelete(req, pp.id)

    // ── Orders (more-specific paths first) ────────────────────────────────────
    else if (m==="POST"  && path==="/orders") {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR","MEDICO");res=d??await ordersCreate(req,a)}
    }
    else if (m==="GET"   && path==="/orders")                 res = await ordersFind(req)
    else if (m==="PATCH" && (pp=matchPath("/orders/:id/status",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR","LABORATORIO","MEDICO");res=d??await ordersUpdateStatus(req,pp.id,a)}
    }
    else if (m==="GET"   && (pp=matchPath("/orders/:id",path)))   res = await ordersGetOne(req, pp.id)
    else if (m==="PATCH" && (pp=matchPath("/orders/:id",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR","MEDICO");res=d??await ordersUpdate(req,pp.id,a)}
    }
    else if (m==="DELETE"&& (pp=matchPath("/orders/:id",path)))   res = await ordersDelete(req, pp.id)

    // ── Consents (4-part before 3-part) ───────────────────────────────────────
    else if (m==="PATCH" && (pp=matchPath("/orders/:orderId/consent/sign",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","MEDICO");res=d??await consentSign(req,pp.orderId,a)}
    }
    else if (m==="PATCH" && (pp=matchPath("/orders/:orderId/consent/send",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR","MEDICO");res=d??await consentSend(req,pp.orderId,a)}
    }
    else if (m==="PATCH" && (pp=matchPath("/orders/:orderId/consent/respond",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR");res=d??await consentRespond(req,pp.orderId,a)}
    }
    else if (m==="POST"  && (pp=matchPath("/orders/:orderId/consent",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR","MEDICO");res=d??await consentsCreate(req,pp.orderId,a)}
    }
    else if (m==="GET"   && (pp=matchPath("/orders/:orderId/consent",path)))  res = await consentsGet(req, pp.orderId)

    // ── Order Tests ───────────────────────────────────────────────────────────
    else if (m==="POST"  && (pp=matchPath("/orders/:orderId/tests",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR","MEDICO");res=d??await orderTestsCreate(req,pp.orderId,a)}
    }
    else if (m==="DELETE"&& (pp=matchPath("/orders/:orderId/tests/:testId",path))) res = await orderTestsDelete(req, pp.orderId, pp.testId)

    // ── Lab Tests ─────────────────────────────────────────────────────────────
    else if (m==="GET"   && path==="/lab-tests")              res = await labTestsFind(req)
    else if (m==="POST"  && path==="/lab-tests") {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN");res=d??await labTestsCreate(req,a)}
    }
    else if (m==="GET"   && (pp=matchPath("/lab-tests/:id/prerequisite/:patientId",path))) res = await labTestsPrerequisite(req, pp.id, pp.patientId)
    else if (m==="GET"   && (pp=matchPath("/lab-tests/:id",path))) res = await labTestsGetOne(req, pp.id)
    else if (m==="PATCH" && (pp=matchPath("/lab-tests/:id",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN");res=d??await labTestsUpdate(req,pp.id,a)}
    }
    else if (m==="DELETE"&& (pp=matchPath("/lab-tests/:id",path))) res = await labTestsDeactivate(req, pp.id)

    // ── Results ───────────────────────────────────────────────────────────────
    else if (m==="POST"  && path==="/results") {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","LABORATORIO","MEDICO");res=d??await resultsCreate(req,a)}
    }
    else if (m==="GET"   && path==="/results")                res = await resultsFind(req)
    else if (m==="GET"   && (pp=matchPath("/results/:id",path)))  res = await resultsGetOne(req, pp.id)
    else if (m==="PATCH" && (pp=matchPath("/results/:id",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","LABORATORIO","MEDICO");res=d??await resultsUpdate(req,pp.id,a)}
    }
    else if (m==="DELETE"&& (pp=matchPath("/results/:id",path))) res = await resultsDelete(req, pp.id)

    // ── Appointments ──────────────────────────────────────────────────────────
    else if (m==="POST"  && path==="/appointments") {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR");res=d??await appointmentsCreate(req,a)}
    }
    else if (m==="GET"   && path==="/appointments")           res = await appointmentsFind(req)
    else if (m==="PATCH" && (pp=matchPath("/appointments/:id/status",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR");res=d??await appointmentsUpdateStatus(req,pp.id,a)}
    }
    else if (m==="GET"   && (pp=matchPath("/appointments/:id",path))) res = await appointmentsGetOne(req, pp.id)
    else if (m==="PATCH" && (pp=matchPath("/appointments/:id",path))) {
      const a=await requireAuth(req); if(a instanceof Response){res=a}else{const d=requireRole(a,"ADMIN","OPERADOR");res=d??await appointmentsUpdate(req,pp.id,a)}
    }
    else if (m==="DELETE"&& (pp=matchPath("/appointments/:id",path))) res = await appointmentsDelete(req, pp.id)

    // ── Notifications (literal before dynamic) ────────────────────────────────
    else if (m==="GET"   && path==="/notifications")                    res = await notificationsFind(req)
    else if (m==="GET"   && path==="/notifications/unread-count")       res = await notificationsUnreadCount(req)
    else if (m==="PATCH" && path==="/notifications/read-all")           res = await notificationsMarkAllRead(req)
    else if (m==="PATCH" && (pp=matchPath("/notifications/:id/read",path))) res = await notificationsMarkRead(req, pp.id)

    // ── Patient Portal ────────────────────────────────────────────────────────
    else if (path.startsWith("/portal")) {
      const a=await requireAuth(req)
      if (a instanceof Response) { res=a }
      else {
        const d=requireRole(a,"PACIENTE")
        if (d) { res=d }
        else if (m==="GET"  && path==="/portal/me")                                   res=await portalMe(req,a)
        else if (m==="GET"  && path==="/portal/dashboard")                            res=await portalDashboard(req,a)
        else if (m==="GET"  && path==="/portal/orders")                               res=await portalOrders(req,a)
        else if (m==="GET"  && path==="/portal/results")                              res=await portalResults(req,a)
        else if (m==="GET"  && path==="/portal/appointments")                         res=await portalAppointments(req,a)
        else if (m==="GET"  && (pp=matchPath("/portal/orders/:orderId/consent",path))) res=await portalOrderConsent(req,pp.orderId,a)
        else if (m==="GET"  && (pp=matchPath("/portal/orders/:orderId",path)))         res=await portalOrderDetail(req,pp.orderId,a)
        else if (m==="POST" && (pp=matchPath("/portal/consents/:consentId/accept",path))) res=await portalConsentRespond(req,pp.consentId,"ACEPTADO",a)
        else if (m==="POST" && (pp=matchPath("/portal/consents/:consentId/reject",path))) res=await portalConsentRespond(req,pp.consentId,"RECHAZADO",a)
        else res=err(404, "Portal route not found")
      }
    }

    // ── Health ────────────────────────────────────────────────────────────────
    else if (path==="/" || path==="/health") res = ok({ status:"ok", version:"2.0.0" })
    else res = err(404, `${m} ${path} not found`)

    return withCors(res, req)
  } catch (e) {
    console.error("Unhandled error:", e)
    return withCors(err(500, "Internal server error"), req)
  }
})
