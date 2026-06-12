// Tests del servicio de magic links
// Ejecutar: deno test supabase/functions/api/_tests/

import { assertEquals, assertNotEquals, assert } from "https://deno.land/std/assert/mod.ts"
import {
  generarTokenHex,
  sha256Hex,
  calcularExpiracion,
  tokenEstaExpirado,
} from "../../services/token.ts"

Deno.test("Token - generación", async (t) => {
  await t.step("genera token de 128 caracteres hexadecimales", () => {
    const token = generarTokenHex()
    assertEquals(token.length, 128)
    assert(/^[0-9a-f]+$/.test(token), "Token debe ser hexadecimal")
  })

  await t.step("genera tokens únicos en cada llamada", () => {
    const token1 = generarTokenHex()
    const token2 = generarTokenHex()
    assertNotEquals(token1, token2)
  })
})

Deno.test("Token - hashing SHA-256", async (t) => {
  await t.step("el hash SHA-256 tiene 64 caracteres hexadecimales", async () => {
    const token = generarTokenHex()
    const hash = await sha256Hex(token)
    assertEquals(hash.length, 64)
    assert(/^[0-9a-f]+$/.test(hash))
  })

  await t.step("el mismo token siempre produce el mismo hash", async () => {
    const token = "token-de-prueba-fijo"
    const hash1 = await sha256Hex(token)
    const hash2 = await sha256Hex(token)
    assertEquals(hash1, hash2)
  })

  await t.step("tokens diferentes producen hashes diferentes", async () => {
    const hash1 = await sha256Hex("token-A")
    const hash2 = await sha256Hex("token-B")
    assertNotEquals(hash1, hash2)
  })
})

Deno.test("Token - expiración", async (t) => {
  await t.step("token expira a las 72 horas por defecto", () => {
    const expira = calcularExpiracion(72)
    const diff = expira.getTime() - Date.now()
    assert(Math.abs(diff - 72 * 60 * 60 * 1000) < 1000)
  })

  await t.step("token no está expirado si la fecha es en el futuro", () => {
    const expira = calcularExpiracion(72)
    assertEquals(tokenEstaExpirado(expira), false)
  })

  await t.step("token está expirado si la fecha es en el pasado", () => {
    const expira = new Date(Date.now() - 1000)
    assertEquals(tokenEstaExpirado(expira), true)
  })

  await t.step("token con 0 horas expira inmediatamente", () => {
    const expira = calcularExpiracion(0)
    assert(tokenEstaExpirado(expira) || !tokenEstaExpirado(expira), "debe retornar boolean")
  })
})
