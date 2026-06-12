// Tests del servicio de magic links
// Ejecutar: deno test supabase/functions/api/_tests/

import { assertEquals, assertNotEquals, assert } from 'https://deno.land/std/assert/mod.ts'

// Funciones a implementar en services/token.ts
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generarTokenHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(64))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function calcularExpiracion(horas = 72): Date {
  return new Date(Date.now() + horas * 60 * 60 * 1000)
}

function tokenEstaExpirado(expiraAt: Date): boolean {
  return expiraAt < new Date()
}

Deno.test('Token - generación', async (t) => {
  await t.step('genera token de 128 caracteres hexadecimales', () => {
    const token = generarTokenHex()
    assertEquals(token.length, 128)
    assert(/^[0-9a-f]+$/.test(token), 'Token debe ser hexadecimal')
  })

  await t.step('genera tokens únicos en cada llamada', () => {
    const token1 = generarTokenHex()
    const token2 = generarTokenHex()
    assertNotEquals(token1, token2)
  })
})

Deno.test('Token - hashing SHA-256', async (t) => {
  await t.step('el hash SHA-256 tiene 64 caracteres hexadecimales', async () => {
    const token = generarTokenHex()
    const hash = await sha256(token)
    assertEquals(hash.length, 64)
    assert(/^[0-9a-f]+$/.test(hash))
  })

  await t.step('el mismo token siempre produce el mismo hash', async () => {
    const token = 'token-de-prueba-fijo'
    const hash1 = await sha256(token)
    const hash2 = await sha256(token)
    assertEquals(hash1, hash2)
  })

  await t.step('tokens diferentes producen hashes diferentes', async () => {
    const hash1 = await sha256('token-A')
    const hash2 = await sha256('token-B')
    assertNotEquals(hash1, hash2)
  })
})

Deno.test('Token - expiración', async (t) => {
  await t.step('token expira a las 72 horas por defecto', () => {
    const expira = calcularExpiracion(72)
    const diff = expira.getTime() - Date.now()
    // Debe ser aproximadamente 72 horas (con margen de 1 segundo)
    assert(Math.abs(diff - 72 * 60 * 60 * 1000) < 1000)
  })

  await t.step('token no está expirado si la fecha es en el futuro', () => {
    const expira = calcularExpiracion(72)
    assertEquals(tokenEstaExpirado(expira), false)
  })

  await t.step('token está expirado si la fecha es en el pasado', () => {
    const expira = new Date(Date.now() - 1000)  // 1 segundo en el pasado
    assertEquals(tokenEstaExpirado(expira), true)
  })
})
