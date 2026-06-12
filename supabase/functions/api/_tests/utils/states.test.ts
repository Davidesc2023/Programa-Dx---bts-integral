// Tests de la state machine y evaluación de umbrales
// Ejecutar: deno test supabase/functions/api/_tests/

import { assertEquals } from "https://deno.land/std/assert/mod.ts"
import {
  validarTransicion,
  TRANSICIONES_VALIDAS,
  evaluarUmbral,
  type UmbralJson,
} from "../../utils/states.ts"

Deno.test("State Machine - transiciones válidas", async (t) => {
  await t.step("SOLICITUD_RECIBIDA → EN_PROGRAMACION", () => {
    assertEquals(validarTransicion("SOLICITUD_RECIBIDA", "EN_PROGRAMACION"), true)
  })
  await t.step("SOLICITUD_RECIBIDA → CANCELADO", () => {
    assertEquals(validarTransicion("SOLICITUD_RECIBIDA", "CANCELADO"), true)
  })
  await t.step("RESULTADO_SERICO_DISPONIBLE → CON_INDICACION_GENETICA", () => {
    assertEquals(validarTransicion("RESULTADO_SERICO_DISPONIBLE", "CON_INDICACION_GENETICA"), true)
  })
  await t.step("RESULTADO_SERICO_DISPONIBLE → SIN_INDICACION_GENETICA", () => {
    assertEquals(validarTransicion("RESULTADO_SERICO_DISPONIBLE", "SIN_INDICACION_GENETICA"), true)
  })
  await t.step("GENETICA_EN_PROCESAMIENTO → GENETICA_RESULTADO_DISPONIBLE", () => {
    assertEquals(validarTransicion("GENETICA_EN_PROCESAMIENTO", "GENETICA_RESULTADO_DISPONIBLE"), true)
  })
  await t.step("SIN_INDICACION_GENETICA → COMPLETADO", () => {
    assertEquals(validarTransicion("SIN_INDICACION_GENETICA", "COMPLETADO"), true)
  })
  await t.step("SIN_CONTACTO_EFECTIVO → EN_PROGRAMACION (reactivación)", () => {
    assertEquals(validarTransicion("SIN_CONTACTO_EFECTIVO", "EN_PROGRAMACION"), true)
  })
  await t.step("DATOS_INCOMPLETOS → EN_PROGRAMACION (migrados con datos incompletos)", () => {
    assertEquals(validarTransicion("DATOS_INCOMPLETOS", "EN_PROGRAMACION"), true)
  })
})

Deno.test("State Machine - transiciones inválidas", async (t) => {
  await t.step("COMPLETADO → cualquier estado es inválido", () => {
    for (const estado of Object.keys(TRANSICIONES_VALIDAS)) {
      assertEquals(validarTransicion("COMPLETADO", estado), false, `COMPLETADO → ${estado} debe ser inválido`)
    }
  })
  await t.step("SOLICITUD_RECIBIDA → COMPLETADO (saltar pasos)", () => {
    assertEquals(validarTransicion("SOLICITUD_RECIBIDA", "COMPLETADO"), false)
  })
  await t.step("NO_ACEPTO → AUTORIZADO (no se puede revertir sin nuevo link)", () => {
    assertEquals(validarTransicion("NO_ACEPTO", "AUTORIZADO"), false)
  })
  await t.step("CANCELADO → EN_PROGRAMACION (no se puede reabrir cancelado)", () => {
    assertEquals(validarTransicion("CANCELADO", "EN_PROGRAMACION"), false)
  })
  await t.step("MUESTRA_TOMADA → PROGRAMADO (retroceso prohibido)", () => {
    assertEquals(validarTransicion("MUESTRA_TOMADA", "PROGRAMADO"), false)
  })
})

Deno.test("State Machine - FALLECIDO desde estados activos", async (t) => {
  const estadosActivos = [
    "SOLICITUD_RECIBIDA", "EN_PROGRAMACION", "AUTORIZADO",
    "PROGRAMADO", "MUESTRA_TOMADA", "RESULTADO_SERICO_DISPONIBLE",
    "CON_INDICACION_GENETICA", "GENETICA_EN_PROCESAMIENTO",
  ]
  for (const estado of estadosActivos) {
    await t.step(`FALLECIDO desde ${estado} es válido`, () => {
      assertEquals(validarTransicion(estado, "FALLECIDO"), true)
    })
  }
  await t.step("FALLECIDO desde COMPLETADO es inválido", () => {
    assertEquals(validarTransicion("COMPLETADO", "FALLECIDO"), false)
  })
  await t.step("FALLECIDO desde CANCELADO es inválido", () => {
    assertEquals(validarTransicion("CANCELADO", "FALLECIDO"), false)
  })
})

Deno.test("Evaluación de umbral — Wilson", async (t) => {
  const umbral: UmbralJson = { ceruloplasmina_lt: 20, cobre_orina_gt: 60 }

  await t.step("Ceruloplasmina 15 mg/dL → CON indicación (< 20)", () => {
    assertEquals(evaluarUmbral(umbral, "15", null), true)
  })
  await t.step("Ceruloplasmina 22 mg/dL → SIN indicación (≥ 20)", () => {
    assertEquals(evaluarUmbral(umbral, "22", null), false)
  })
  await t.step("Ceruloplasmina 22, Cobre 75 → CON indicación (cobre > 60)", () => {
    assertEquals(evaluarUmbral(umbral, "22", "75"), true)
  })
  await t.step("Ceruloplasmina 25, Cobre 50 → SIN indicación (ambos normales)", () => {
    assertEquals(evaluarUmbral(umbral, "25", "50"), false)
  })
  await t.step("Sin valores → null (no determinable)", () => {
    assertEquals(evaluarUmbral(umbral, null, null), null)
  })
  await t.step("Ceruloplasmina con coma decimal → parsea correctamente", () => {
    assertEquals(evaluarUmbral(umbral, "15,5", null), true)
  })
})

Deno.test("Evaluación de umbral — DAAT (Alfa-1)", async (t) => {
  const umbral: UmbralJson = { alfa1_lte: 110 }

  await t.step("Alfa-1 95 mg/dL → CON indicación (≤ 110)", () => {
    assertEquals(evaluarUmbral(umbral, "95", null), true)
  })
  await t.step("Alfa-1 110 mg/dL → CON indicación (exactamente 110)", () => {
    assertEquals(evaluarUmbral(umbral, "110", null), true)
  })
  await t.step("Alfa-1 142 mg/dL → SIN indicación (> 110)", () => {
    assertEquals(evaluarUmbral(umbral, "142", null), false)
  })
  await t.step("Sin resultado → null", () => {
    assertEquals(evaluarUmbral(umbral, null, null), null)
  })
  await t.step("Valor no numérico → null", () => {
    assertEquals(evaluarUmbral(umbral, "no disponible", null), null)
  })
})

Deno.test("Evaluación de umbral — Duchenne (manual)", async (t) => {
  const umbral: UmbralJson = { manual: true }

  await t.step("Programa manual siempre retorna null (decide el operador)", () => {
    assertEquals(evaluarUmbral(umbral, "5000", null), null)
    assertEquals(evaluarUmbral(umbral, "200", null), null)
    assertEquals(evaluarUmbral(umbral, null, null), null)
  })
})
