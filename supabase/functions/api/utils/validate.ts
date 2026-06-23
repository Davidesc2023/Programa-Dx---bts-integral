import { z } from "zod"
import { err } from "./responses.ts"

export { z }

type ParseOk<T>  = { ok: true;  data: T }
type ParseFail   = { ok: false; response: Response }
export type ParseResult<T> = ParseOk<T> | ParseFail

export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<ParseResult<T>> {
  const raw = await req.json().catch(() => null)
  if (raw === null) return { ok: false, response: err(400, "Body JSON requerido") }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const msgs = result.error.issues.map(i =>
      i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message
    )
    return { ok: false, response: err(400, msgs.join("; ")) }
  }
  return { ok: true, data: result.data }
}
