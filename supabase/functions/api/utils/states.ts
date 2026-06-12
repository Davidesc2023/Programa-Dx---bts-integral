// Máquina de estados para el ciclo de vida de un caso diagnóstico

export const TRANSICIONES_VALIDAS: Readonly<Record<string, readonly string[]>> = {
  SOLICITUD_RECIBIDA:            ["EN_PROGRAMACION", "CANCELADO"],
  EN_PROGRAMACION:               ["PENDIENTE_AUTORIZACION", "SIN_CONTACTO_EFECTIVO", "CANCELADO"],
  PENDIENTE_AUTORIZACION:        ["AUTORIZADO", "NO_ACEPTO"],
  AUTORIZADO:                    ["PROGRAMADO", "CANCELADO"],
  PROGRAMADO:                    ["MUESTRA_TOMADA", "CANCELADO"],
  MUESTRA_TOMADA:                ["RESULTADO_SERICO_DISPONIBLE"],
  RESULTADO_SERICO_DISPONIBLE:   ["CON_INDICACION_GENETICA", "SIN_INDICACION_GENETICA"],
  CON_INDICACION_GENETICA:       ["GENETICA_PROGRAMADA"],
  SIN_INDICACION_GENETICA:       ["COMPLETADO"],
  GENETICA_PROGRAMADA:           ["GENETICA_EN_PROCESAMIENTO"],
  GENETICA_EN_PROCESAMIENTO:     ["GENETICA_RESULTADO_DISPONIBLE"],
  GENETICA_RESULTADO_DISPONIBLE: ["COMPLETADO"],
  COMPLETADO:                    [],
  NO_ACEPTO:                     [],
  SIN_CONTACTO_EFECTIVO:         ["EN_PROGRAMACION", "CANCELADO"],
  CANCELADO:                     [],
  FALLECIDO:                     [],
  DATOS_INCOMPLETOS:             ["EN_PROGRAMACION", "CANCELADO"],
} as const

const ESTADOS_TERMINALES = new Set(["COMPLETADO", "CANCELADO", "FALLECIDO"])

// FALLECIDO se permite desde cualquier estado activo (excepto estados terminales)
export function validarTransicion(estadoActual: string, estadoNuevo: string): boolean {
  if (estadoNuevo === "FALLECIDO" && !ESTADOS_TERMINALES.has(estadoActual)) return true
  return (TRANSICIONES_VALIDAS[estadoActual] ?? []).includes(estadoNuevo)
}

export type UmbralJson = {
  ceruloplasmina_lt?: number  // Wilson: Ceruloplasmina < X mg/dL
  cobre_orina_gt?: number     // Wilson: Cobre orina > X µg/24h
  alfa1_lte?: number          // DAAT: Alfa-1 ≤ X mg/dL
  manual?: boolean            // Duchenne: indicación determinada por el médico
}

// Evalúa si el resultado sérico supera el umbral de indicación genética.
// Retorna: true = con indicación, false = sin indicación, null = no determinable
export function evaluarUmbral(
  umbral: UmbralJson,
  resultado1: string | null,
  resultado2: string | null,
): boolean | null {
  if (umbral.manual) return null

  const toNum = (v: string | null): number | null => {
    if (v === null) return null
    const n = parseFloat(v.replace(",", "."))
    return isNaN(n) ? null : n
  }

  const v1 = toNum(resultado1)
  const v2 = toNum(resultado2)

  // Wilson: Ceruloplasmina < umbral OR Cobre orina > umbral
  if (umbral.ceruloplasmina_lt !== undefined || umbral.cobre_orina_gt !== undefined) {
    if (v1 === null && v2 === null) return null
    const bajaCeru = umbral.ceruloplasmina_lt !== undefined && v1 !== null
      ? v1 < umbral.ceruloplasmina_lt
      : false
    const altoCobre = umbral.cobre_orina_gt !== undefined && v2 !== null
      ? v2 > umbral.cobre_orina_gt
      : false
    return bajaCeru || altoCobre
  }

  // DAAT: Alfa-1 ≤ umbral
  if (umbral.alfa1_lte !== undefined) {
    if (v1 === null) return null
    return v1 <= umbral.alfa1_lte
  }

  return null
}
