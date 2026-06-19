const CT = { "Content-Type": "application/json" }

export function ok(data: unknown, message = "OK"): Response {
  return new Response(JSON.stringify({ statusCode: 200, message, data }), { status: 200, headers: CT })
}

export function created(data: unknown, message = "Created"): Response {
  return new Response(JSON.stringify({ statusCode: 201, message, data }), { status: 201, headers: CT })
}

export function paginated(data: unknown[], meta: object, message = "OK"): Response {
  return new Response(JSON.stringify({ statusCode: 200, message, data, meta }), { status: 200, headers: CT })
}

const HTTP_ERRORS: Record<number, string> = {
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
  404: "Not Found", 409: "Conflict", 410: "Gone",
  422: "Unprocessable Entity", 429: "Too Many Requests", 500: "Internal Server Error",
}

export function err(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ statusCode: status, message, error: HTTP_ERRORS[status] ?? "Error" }),
    { status, headers: CT }
  )
}

export function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
