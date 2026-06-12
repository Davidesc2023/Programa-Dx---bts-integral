export function corsHeaders(req: Request): Headers {
  const rawOrigin = Deno.env.get("CORS_ORIGIN") ?? "*"
  const requestOrigin = req.headers.get("origin") ?? ""
  let origin = "*"
  if (rawOrigin !== "*") {
    const allowed = rawOrigin.split(",").map(o => o.trim())
    origin = allowed.includes(requestOrigin) ? requestOrigin : allowed[0]
  }
  const h = new Headers()
  h.set("Access-Control-Allow-Origin", origin)
  h.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  if (origin !== "*") h.set("Access-Control-Allow-Credentials", "true")
  return h
}

export function withCors(res: Response, req: Request): Response {
  const cors = corsHeaders(req)
  const headers = new Headers(res.headers)
  cors.forEach((v, k) => headers.set(k, v))
  return new Response(res.body, { status: res.status, headers })
}
