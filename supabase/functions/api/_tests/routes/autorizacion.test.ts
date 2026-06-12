// Tests de lógica de magic links para autorización del paciente
// Ejecutar: deno test supabase/functions/api/_tests/

import { assertEquals, assert, assertNotEquals } from "https://deno.land/std/assert/mod.ts"
import { generarTokenHex, sha256Hex, calcularExpiracion, tokenEstaExpirado } from "../../services/token.ts"

// ─── Helpers que replican la lógica del route ─────────────────────────────────

type Respuesta = "AUTORIZADO" | "NO_AUTORIZADO"

function validarRespuesta(body: Record<string, unknown>): string | null {
  if (!body.respuesta || !["AUTORIZADO", "NO_AUTORIZADO"].includes(body.respuesta as string)) {
    return "respuesta debe ser AUTORIZADO o NO_AUTORIZADO"
  }
  const nombre = body.nombre_firmado as string | undefined
  if (!nombre || nombre.trim().length < 2) {
    return "nombre_firmado es requerido (mín 2 caracteres)"
  }
  return null
}

function resolverEstadoCaso(respuesta: Respuesta): string {
  return respuesta === "AUTORIZADO" ? "AUTORIZADO" : "NO_ACEPTO"
}

function construirUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/autorizar/${token}`
}

interface LinkValidacion {
  invalidado_at: string | null
  usado_at: string | null
  expira_at: string
}

function validarLink(link: LinkValidacion): string | null {
  if (link.invalidado_at) return "revocado"
  if (link.usado_at)      return "ya_usado"
  if (tokenEstaExpirado(new Date(link.expira_at))) return "expirado"
  return null
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test("Magic link - generación del token", async (t) => {
  await t.step("el token plano tiene 128 caracteres", () => {
    const token = generarTokenHex()
    assertEquals(token.length, 128)
    assert(/^[0-9a-f]+$/.test(token))
  })

  await t.step("el hash SHA-256 del token tiene 64 caracteres", async () => {
    const token = generarTokenHex()
    const hash  = await sha256Hex(token)
    assertEquals(hash.length, 64)
    assert(/^[0-9a-f]+$/.test(hash))
  })

  await t.step("dos tokens distintos producen hashes distintos", async () => {
    const h1 = await sha256Hex(generarTokenHex())
    const h2 = await sha256Hex(generarTokenHex())
    assertNotEquals(h1, h2)
  })

  await t.step("el mismo token siempre produce el mismo hash (determinístico)", async () => {
    const t1 = "token-fijo-para-prueba"
    assertEquals(await sha256Hex(t1), await sha256Hex(t1))
  })
})

Deno.test("Magic link - construcción de URL", async (t) => {
  await t.step("URL contiene el token completo", () => {
    const token = generarTokenHex()
    const url   = construirUrl("https://app.botoshop.com", token)
    assert(url.includes(token))
    assert(url.startsWith("https://app.botoshop.com/autorizar/"))
  })

  await t.step("URL con token de 128 chars tiene longitud correcta", () => {
    const token = generarTokenHex()
    const url   = construirUrl("https://app.botoshop.com", token)
    // "https://app.botoshop.com/autorizar/" = 37 chars + 128 token = 165
    assertEquals(url.length, 37 + 128)
  })
})

Deno.test("Magic link - validación del link", async (t) => {
  await t.step("link válido (no invalidado, no usado, no expirado) → null", () => {
    const link: LinkValidacion = {
      invalidado_at: null,
      usado_at:      null,
      expira_at:     calcularExpiracion(72).toISOString(),
    }
    assertEquals(validarLink(link), null)
  })

  await t.step("link invalidado → 'revocado'", () => {
    const link: LinkValidacion = {
      invalidado_at: new Date().toISOString(),
      usado_at:      null,
      expira_at:     calcularExpiracion(72).toISOString(),
    }
    assertEquals(validarLink(link), "revocado")
  })

  await t.step("link ya usado → 'ya_usado'", () => {
    const link: LinkValidacion = {
      invalidado_at: null,
      usado_at:      new Date().toISOString(),
      expira_at:     calcularExpiracion(72).toISOString(),
    }
    assertEquals(validarLink(link), "ya_usado")
  })

  await t.step("link expirado → 'expirado'", () => {
    const link: LinkValidacion = {
      invalidado_at: null,
      usado_at:      null,
      expira_at:     new Date(Date.now() - 1000).toISOString(),  // 1 seg en el pasado
    }
    assertEquals(validarLink(link), "expirado")
  })

  await t.step("invalidado tiene prioridad sobre expirado", () => {
    const link: LinkValidacion = {
      invalidado_at: new Date().toISOString(),
      usado_at:      null,
      expira_at:     new Date(Date.now() - 1000).toISOString(),
    }
    assertEquals(validarLink(link), "revocado")
  })
})

Deno.test("Magic link - validación de body de respuesta", async (t) => {
  await t.step("body válido con AUTORIZADO → null", () => {
    const body = { respuesta: "AUTORIZADO", nombre_firmado: "María García López" }
    assertEquals(validarRespuesta(body), null)
  })

  await t.step("body válido con NO_AUTORIZADO → null", () => {
    const body = { respuesta: "NO_AUTORIZADO", nombre_firmado: "Juan Pérez" }
    assertEquals(validarRespuesta(body), null)
  })

  await t.step("respuesta inválida → error", () => {
    const body = { respuesta: "PENDIENTE", nombre_firmado: "Juan Pérez" }
    assert(validarRespuesta(body) !== null)
  })

  await t.step("respuesta faltante → error", () => {
    const body = { nombre_firmado: "Juan Pérez" }
    assert(validarRespuesta(body) !== null)
  })

  await t.step("nombre_firmado muy corto → error", () => {
    const body = { respuesta: "AUTORIZADO", nombre_firmado: "X" }
    assert(validarRespuesta(body) !== null)
  })

  await t.step("nombre_firmado faltante → error", () => {
    const body = { respuesta: "AUTORIZADO" }
    assert(validarRespuesta(body) !== null)
  })
})

Deno.test("Magic link - transición de estado del caso", async (t) => {
  await t.step("AUTORIZADO → estado AUTORIZADO", () => {
    assertEquals(resolverEstadoCaso("AUTORIZADO"), "AUTORIZADO")
  })

  await t.step("NO_AUTORIZADO → estado NO_ACEPTO", () => {
    assertEquals(resolverEstadoCaso("NO_AUTORIZADO"), "NO_ACEPTO")
  })
})

Deno.test("Magic link - seguridad: el token plano no es el hash", async (t) => {
  await t.step("token ≠ hash(token)", async () => {
    const token = generarTokenHex()
    const hash  = await sha256Hex(token)
    assertNotEquals(token, hash, "El token plano y su hash deben ser diferentes")
  })

  await t.step("hash(hash(token)) ≠ hash(token)", async () => {
    const token = generarTokenHex()
    const hash1 = await sha256Hex(token)
    const hash2 = await sha256Hex(hash1)
    assertNotEquals(hash1, hash2, "Doble hash debe producir resultado diferente")
  })
})
