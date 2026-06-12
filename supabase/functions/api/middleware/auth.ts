import * as jose from "npm:jose@5"
import { err } from "../utils/responses.ts"

export type UserRole = "ADMIN" | "OPERADOR" | "LABORATORIO" | "MEDICO" | "PACIENTE"
export interface AuthUser { sub: string; email?: string; role: UserRole }

const ACCESS_SECRET = new TextEncoder().encode(Deno.env.get("JWT_SECRET") ?? "change-me")
const REFRESH_SECRET = new TextEncoder().encode(Deno.env.get("JWT_REFRESH_SECRET") ?? "change-me-refresh")

export async function signAccess(payload: object): Promise<string> {
  return new jose.SignJWT(payload as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Deno.env.get("JWT_EXPIRES_IN") ?? "15m")
    .setIssuedAt()
    .sign(ACCESS_SECRET)
}

export async function signRefresh(payload: object): Promise<string> {
  return new jose.SignJWT(payload as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Deno.env.get("JWT_REFRESH_EXPIRES_IN") ?? "7d")
    .setIssuedAt()
    .sign(REFRESH_SECRET)
}

export async function verifyAccess(token: string): Promise<jose.JWTPayload | null> {
  try { return (await jose.jwtVerify(token, ACCESS_SECRET)).payload } catch { return null }
}

export async function verifyRefresh(token: string): Promise<jose.JWTPayload | null> {
  try { return (await jose.jwtVerify(token, REFRESH_SECRET)).payload } catch { return null }
}

export async function requireAuth(req: Request): Promise<AuthUser | Response> {
  const auth = req.headers.get("Authorization")
  if (!auth?.startsWith("Bearer ")) return err(401, "Missing authorization token")
  const payload = await verifyAccess(auth.slice(7))
  if (!payload) return err(401, "Invalid or expired token")
  return { sub: payload.sub as string, email: payload.email as string | undefined, role: payload.role as UserRole }
}

export function requireRole(user: AuthUser, ...roles: UserRole[]): Response | null {
  return roles.includes(user.role) ? null : err(403, "Insufficient permissions")
}
