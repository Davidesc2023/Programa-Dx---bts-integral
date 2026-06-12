// Tests de la state machine del caso
// Ejecutar: deno test supabase/functions/api/_tests/

import { assertEquals, assertThrows } from 'https://deno.land/std/assert/mod.ts'

// Importar la función desde utils/states.ts (a implementar en Fase 4)
// import { validarTransicion, TRANSICIONES_VALIDAS } from '../../utils/states.ts'

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  'SOLICITUD_RECIBIDA':              ['EN_PROGRAMACION', 'CANCELADO'],
  'EN_PROGRAMACION':                 ['PENDIENTE_AUTORIZACION', 'SIN_CONTACTO_EFECTIVO', 'CANCELADO'],
  'PENDIENTE_AUTORIZACION':          ['AUTORIZADO', 'NO_ACEPTO'],
  'AUTORIZADO':                      ['PROGRAMADO', 'CANCELADO'],
  'PROGRAMADO':                      ['MUESTRA_TOMADA', 'CANCELADO'],
  'MUESTRA_TOMADA':                  ['RESULTADO_SERICO_DISPONIBLE'],
  'RESULTADO_SERICO_DISPONIBLE':     ['CON_INDICACION_GENETICA', 'SIN_INDICACION_GENETICA'],
  'CON_INDICACION_GENETICA':         ['GENETICA_PROGRAMADA'],
  'SIN_INDICACION_GENETICA':         ['COMPLETADO'],
  'GENETICA_PROGRAMADA':             ['GENETICA_EN_PROCESAMIENTO'],
  'GENETICA_EN_PROCESAMIENTO':       ['GENETICA_RESULTADO_DISPONIBLE'],
  'GENETICA_RESULTADO_DISPONIBLE':   ['COMPLETADO'],
  'COMPLETADO':                      [],
  'NO_ACEPTO':                       [],
  'SIN_CONTACTO_EFECTIVO':           ['EN_PROGRAMACION', 'CANCELADO'],
  'CANCELADO':                       [],
  'FALLECIDO':                       [],
  'DATOS_INCOMPLETOS':               ['EN_PROGRAMACION', 'CANCELADO'],
}

function validarTransicion(estadoActual: string, estadoNuevo: string): boolean {
  const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual] ?? []
  // FALLECIDO es siempre permitido desde cualquier estado activo
  if (estadoNuevo === 'FALLECIDO' && estadoActual !== 'COMPLETADO') return true
  return transicionesPermitidas.includes(estadoNuevo)
}

Deno.test('State Machine - transiciones válidas', async (t) => {
  await t.step('SOLICITUD_RECIBIDA → EN_PROGRAMACION es válida', () => {
    assertEquals(validarTransicion('SOLICITUD_RECIBIDA', 'EN_PROGRAMACION'), true)
  })

  await t.step('SOLICITUD_RECIBIDA → CANCELADO es válida', () => {
    assertEquals(validarTransicion('SOLICITUD_RECIBIDA', 'CANCELADO'), true)
  })

  await t.step('RESULTADO_SERICO_DISPONIBLE → CON_INDICACION_GENETICA es válida', () => {
    assertEquals(validarTransicion('RESULTADO_SERICO_DISPONIBLE', 'CON_INDICACION_GENETICA'), true)
  })

  await t.step('RESULTADO_SERICO_DISPONIBLE → SIN_INDICACION_GENETICA es válida', () => {
    assertEquals(validarTransicion('RESULTADO_SERICO_DISPONIBLE', 'SIN_INDICACION_GENETICA'), true)
  })

  await t.step('COMPLETADO → COMPLETADO es inválida', () => {
    assertEquals(validarTransicion('COMPLETADO', 'COMPLETADO'), false)
  })
})

Deno.test('State Machine - transiciones inválidas', async (t) => {
  await t.step('COMPLETADO → EN_PROGRAMACION es inválida', () => {
    assertEquals(validarTransicion('COMPLETADO', 'EN_PROGRAMACION'), false)
  })

  await t.step('SOLICITUD_RECIBIDA → COMPLETADO es inválida (saltar pasos)', () => {
    assertEquals(validarTransicion('SOLICITUD_RECIBIDA', 'COMPLETADO'), false)
  })

  await t.step('NO_ACEPTO → AUTORIZADO es inválida', () => {
    assertEquals(validarTransicion('NO_ACEPTO', 'AUTORIZADO'), false)
  })

  await t.step('GENETICA_EN_PROCESAMIENTO → SOLICITUD_RECIBIDA es inválida', () => {
    assertEquals(validarTransicion('GENETICA_EN_PROCESAMIENTO', 'SOLICITUD_RECIBIDA'), false)
  })
})

Deno.test('State Machine - FALLECIDO desde estados activos', async (t) => {
  const estadosActivos = ['SOLICITUD_RECIBIDA', 'EN_PROGRAMACION', 'AUTORIZADO', 'PROGRAMADO', 'MUESTRA_TOMADA']

  for (const estado of estadosActivos) {
    await t.step(`FALLECIDO desde ${estado} es válida`, () => {
      assertEquals(validarTransicion(estado, 'FALLECIDO'), true)
    })
  }

  await t.step('FALLECIDO desde COMPLETADO es inválida', () => {
    assertEquals(validarTransicion('COMPLETADO', 'FALLECIDO'), false)
  })
})
