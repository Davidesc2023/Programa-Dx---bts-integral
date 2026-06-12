export type RouteParams = Record<string, string>

export function matchPath(pattern: string, path: string): RouteParams | null {
  const pp = pattern.split("/").filter(Boolean)
  const sp = path.split("/").filter(Boolean)
  if (pp.length !== sp.length) return null
  const params: RouteParams = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) params[pp[i].slice(1)] = sp[i]
    else if (pp[i] !== sp[i]) return null
  }
  return params
}

export function parsePagination(url: URL, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
  const limit = Math.min(maxLimit, Math.max(1, parseInt(url.searchParams.get("limit") ?? String(defaultLimit))))
  const from = (page - 1) * limit
  const to = from + limit - 1
  return { page, limit, from, to }
}
