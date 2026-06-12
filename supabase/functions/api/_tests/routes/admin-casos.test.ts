// Tests de lógica del panel admin — casos
// Ejecutar: deno test supabase/functions/api/_tests/

import { assertEquals, assert } from "https://deno.land/std/assert/mod.ts"
import { validarTransicion, evaluarUmbral, type UmbralJson } from "../../utils/states.ts"

// ─── Helpers que replican la lógica del route ─────────────────────────────────

function validarEstadoGenetico(valor: string): boolean {
  const VALIDOS = new Set([
    "PROGRAMADO", "EN_PROCESAMIENTO", "REALIZADO",
    "SIN_INDICACION_GENETICA", "N_A", "NO_ACEPTA",
  ])
  return VALIDOS.has(valor)
}

function validarSeguimiento(valor: string): boolean {
  const VALIDOS = new Set([
    "NEGATIVO", "PORTADOR", "POSITIVO", "EN_TRATAMIENTO",
    "FORMULADO", "TRASPLANTADO", "DROP_OUT", "FALLECIDO", "N_A",
  ])
  return VALIDOS.has(valor)
}

// El estado al que avanza el caso cuando se establece la indicación
function estadoDesdeindicacion(tieneIndicacion: boolean): string {
  return tieneIndicacion ? "CON_INDICACION_GENETICA" : "SIN_INDICACION_GENETICA"
}

// El caso avanza a RESULTADO_SERICO_DISPONIBLE si viene de un estado previo a ese
function debeAvanzarPostSerico(estadoActual: string): boolean {
  return [
    "SOLICITUD_RECIBIDA", "EN_PROGRAMACION", "PENDIENTE_AUTORIZACION",
    "AUTORIZADO", "PROGRAMADO", "MUESTRA_TOMADA",
  ].includes(estadoActual)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test("Admin casos - cambio de estado", async (t) => {
  await t.step("transición válida no lanza error", () => {
    assert(validarTransicion("SOLICITUD_RECIBIDA", "EN_PROGRAMACION"))
  })

  await t.step("transición inválida es rechazada", () => {
    assertEquals(validarTransicion("COMPLETADO", "EN_PROGRAMACION"), false)
  })

  await t.step("FALLECIDO permitido desde estado activo", () => {
    assert(validarTransicion("PROGRAMADO", "FALLECIDO"))
  })

  await t.step("FALLECIDO no permitido desde COMPLETADO", () => {
    assertEquals(validarTransicion("COMPLETADO", "FALLECIDO"), false)
  })
})

Deno.test("Admin casos - registro de resultado sérico", async (t) => {
  await t.step("estado avanza a RESULTADO_SERICO_DISPONIBLE desde MUESTRA_TOMADA", () => {
    assert(debeAvanzarPostSerico("MUESTRA_TOMADA"))
  })

  await t.step("estado NO avanza si ya está en fase genética", () => {
    assertEquals(debeAvanzarPostSerico("CON_INDICACION_GENETICA"), false)
    assertEquals(debeAvanzarPostSerico("GENETICA_PROGRAMADA"), false)
    assertEquals(debeAvanzarPostSerico("COMPLETADO"), false)
  })

  await t.step("Wilson umbral 15 mg/dL → indica CON_INDICACION", () => {
    const umbral: UmbralJson = { ceruloplasmina_lt: 20, cobre_orina_gt: 60 }
    const indicacion = evaluarUmbral(umbral, "15", null)
    assertEquals(indicacion, true)
    assertEquals(estadoDesdeindicacion(true), "CON_INDICACION_GENETICA")
  })

  await t.step("Wilson umbral normal 25 mg/dL → indica SIN_INDICACION", () => {
    const umbral: UmbralJson = { ceruloplasmina_lt: 20, cobre_orina_gt: 60 }
    const indicacion = evaluarUmbral(umbral, "25", "40")
    assertEquals(indicacion, false)
    assertEquals(estadoDesdeindicacion(false), "SIN_INDICACION_GENETICA")
  })

  await t.step("DAAT umbral 95 mg/dL → indica CON_INDICACION", () => {
    const umbral: UmbralJson = { alfa1_lte: 110 }
    assertEquals(evaluarUmbral(umbral, "95", null), true)
  })

  await t.step("DAAT valor justo en límite 110 mg/dL → indica CON_INDICACION", () => {
    const umbral: UmbralJson = { alfa1_lte: 110 }
    assertEquals(evaluarUmbral(umbral, "110", null), true)
  })
})

Deno.test("Admin casos - indicación genética manual", async (t) => {
  await t.step("con indicación → CON_INDICACION_GENETICA", () => {
    assertEquals(estadoDesdeindicacion(true), "CON_INDICACION_GENETICA")
    assert(validarTransicion("RESULTADO_SERICO_DISPONIBLE", "CON_INDICACION_GENETICA"))
  })

  await t.step("sin indicación → SIN_INDICACION_GENETICA", () => {
    assertEquals(estadoDesdeindicacion(false), "SIN_INDICACION_GENETICA")
    assert(validarTransicion("RESULTADO_SERICO_DISPONIBLE", "SIN_INDICACION_GENETICA"))
  })

  await t.step("no se puede establecer indicación desde COMPLETADO", () => {
    assertEquals(validarTransicion("COMPLETADO", "CON_INDICACION_GENETICA"), false)
    assertEquals(validarTransicion("COMPLETADO", "SIN_INDICACION_GENETICA"), false)
  })
})

Deno.test("Admin casos - resultado genético", async (t) => {
  await t.step("estado_genetico REALIZADO es válido", () => {
    assert(validarEstadoGenetico("REALIZADO"))
  })

  await t.step("estado_genetico EN_PROCESAMIENTO es válido", () => {
    assert(validarEstadoGenetico("EN_PROCESAMIENTO"))
  })

  await t.step("estado_genetico valor inventado es inválido", () => {
    assertEquals(validarEstadoGenetico("COMPLETADO"), false)
    assertEquals(validarEstadoGenetico("POSITIVO"), false)
  })

  await t.step("con resultado_genetico avanza a GENETICA_RESULTADO_DISPONIBLE", () => {
    assert(validarTransicion("GENETICA_EN_PROCESAMIENTO", "GENETICA_RESULTADO_DISPONIBLE"))
  })
})

Deno.test("Admin casos - seguimiento clínico", async (t) => {
  await t.step("valores válidos de seguimiento", () => {
    for (const v of ["NEGATIVO", "PORTADOR", "POSITIVO", "EN_TRATAMIENTO", "FORMULADO", "DROP_OUT", "N_A"]) {
      assert(validarSeguimiento(v), `${v} debe ser válido`)
    }
  })

  await t.step("valores inválidos son rechazados", () => {
    assertEquals(validarSeguimiento("COMPLETADO"), false)
    assertEquals(validarSeguimiento("AUTORIZADO"), false)
    assertEquals(validarSeguimiento(""), false)
  })
})

Deno.test("Admin casos - flujo completo Wilson (happy path)", async (t) => {
  await t.step("1. SOLICITUD_RECIBIDA → EN_PROGRAMACION", () => {
    assert(validarTransicion("SOLICITUD_RECIBIDA", "EN_PROGRAMACION"))
  })
  await t.step("2. EN_PROGRAMACION → PENDIENTE_AUTORIZACION", () => {
    assert(validarTransicion("EN_PROGRAMACION", "PENDIENTE_AUTORIZACION"))
  })
  await t.step("3. PENDIENTE_AUTORIZACION → AUTORIZADO", () => {
    assert(validarTransicion("PENDIENTE_AUTORIZACION", "AUTORIZADO"))
  })
  await t.step("4. AUTORIZADO → PROGRAMADO", () => {
    assert(validarTransicion("AUTORIZADO", "PROGRAMADO"))
  })
  await t.step("5. PROGRAMADO → MUESTRA_TOMADA", () => {
    assert(validarTransicion("PROGRAMADO", "MUESTRA_TOMADA"))
  })
  await t.step("6. Resultado sérico bajo (12 mg/dL) → CON indicación", () => {
    const umbral: UmbralJson = { ceruloplasmina_lt: 20, cobre_orina_gt: 60 }
    assertEquals(evaluarUmbral(umbral, "12", "35"), true)
  })
  await t.step("7. RESULTADO_SERICO_DISPONIBLE → CON_INDICACION_GENETICA", () => {
    assert(validarTransicion("RESULTADO_SERICO_DISPONIBLE", "CON_INDICACION_GENETICA"))
  })
  await t.step("8. CON_INDICACION_GENETICA → GENETICA_PROGRAMADA", () => {
    assert(validarTransicion("CON_INDICACION_GENETICA", "GENETICA_PROGRAMADA"))
  })
  await t.step("9. GENETICA_PROGRAMADA → GENETICA_EN_PROCESAMIENTO", () => {
    assert(validarTransicion("GENETICA_PROGRAMADA", "GENETICA_EN_PROCESAMIENTO"))
  })
  await t.step("10. GENETICA_EN_PROCESAMIENTO → GENETICA_RESULTADO_DISPONIBLE", () => {
    assert(validarTransicion("GENETICA_EN_PROCESAMIENTO", "GENETICA_RESULTADO_DISPONIBLE"))
  })
  await t.step("11. GENETICA_RESULTADO_DISPONIBLE → COMPLETADO", () => {
    assert(validarTransicion("GENETICA_RESULTADO_DISPONIBLE", "COMPLETADO"))
  })
})
