// Tests for the DX state machine (frontend replica of backend states.ts)

// Frontend state machine — same transitions as backend utils/states.ts
const TRANSICIONES: Record<string, string[]> = {
  SOLICITUD_RECIBIDA:            ['EN_PROGRAMACION', 'CANCELADO'],
  EN_PROGRAMACION:               ['PENDIENTE_AUTORIZACION', 'SIN_CONTACTO_EFECTIVO', 'CANCELADO'],
  PENDIENTE_AUTORIZACION:        ['AUTORIZADO', 'NO_ACEPTO'],
  AUTORIZADO:                    ['PROGRAMADO', 'CANCELADO'],
  PROGRAMADO:                    ['MUESTRA_TOMADA', 'CANCELADO'],
  MUESTRA_TOMADA:                ['RESULTADO_SERICO_DISPONIBLE'],
  RESULTADO_SERICO_DISPONIBLE:   ['CON_INDICACION_GENETICA', 'SIN_INDICACION_GENETICA'],
  CON_INDICACION_GENETICA:       ['GENETICA_PROGRAMADA'],
  SIN_INDICACION_GENETICA:       ['COMPLETADO'],
  GENETICA_PROGRAMADA:           ['GENETICA_EN_PROCESAMIENTO'],
  GENETICA_EN_PROCESAMIENTO:     ['GENETICA_RESULTADO_DISPONIBLE'],
  GENETICA_RESULTADO_DISPONIBLE: ['COMPLETADO'],
  COMPLETADO:                    [],
  NO_ACEPTO:                     [],
  SIN_CONTACTO_EFECTIVO:         ['EN_PROGRAMACION', 'CANCELADO'],
  CANCELADO:                     [],
  FALLECIDO:                     [],
  DATOS_INCOMPLETOS:             ['EN_PROGRAMACION', 'CANCELADO'],
};

const ESTADOS_TERMINALES = new Set(['COMPLETADO', 'CANCELADO', 'FALLECIDO']);

function validarTransicion(estadoActual: string, estadoNuevo: string): boolean {
  if (estadoNuevo === 'FALLECIDO' && !ESTADOS_TERMINALES.has(estadoActual)) return true;
  return (TRANSICIONES[estadoActual] ?? []).includes(estadoNuevo);
}

// ─── validarTransicion ────────────────────────────────────────────────────────

describe('validarTransicion', () => {
  it('allows valid forward transitions', () => {
    expect(validarTransicion('SOLICITUD_RECIBIDA', 'EN_PROGRAMACION')).toBe(true);
    expect(validarTransicion('EN_PROGRAMACION', 'PENDIENTE_AUTORIZACION')).toBe(true);
    expect(validarTransicion('PENDIENTE_AUTORIZACION', 'AUTORIZADO')).toBe(true);
    expect(validarTransicion('AUTORIZADO', 'PROGRAMADO')).toBe(true);
    expect(validarTransicion('MUESTRA_TOMADA', 'RESULTADO_SERICO_DISPONIBLE')).toBe(true);
    expect(validarTransicion('RESULTADO_SERICO_DISPONIBLE', 'CON_INDICACION_GENETICA')).toBe(true);
    expect(validarTransicion('GENETICA_RESULTADO_DISPONIBLE', 'COMPLETADO')).toBe(true);
  });

  it('allows CANCELADO from active states', () => {
    expect(validarTransicion('SOLICITUD_RECIBIDA', 'CANCELADO')).toBe(true);
    expect(validarTransicion('EN_PROGRAMACION', 'CANCELADO')).toBe(true);
    expect(validarTransicion('AUTORIZADO', 'CANCELADO')).toBe(true);
    expect(validarTransicion('PROGRAMADO', 'CANCELADO')).toBe(true);
  });

  it('allows FALLECIDO from any non-terminal state', () => {
    expect(validarTransicion('SOLICITUD_RECIBIDA', 'FALLECIDO')).toBe(true);
    expect(validarTransicion('PROGRAMADO', 'FALLECIDO')).toBe(true);
    expect(validarTransicion('CON_INDICACION_GENETICA', 'FALLECIDO')).toBe(true);
    expect(validarTransicion('GENETICA_EN_PROCESAMIENTO', 'FALLECIDO')).toBe(true);
  });

  it('blocks FALLECIDO from terminal states', () => {
    expect(validarTransicion('COMPLETADO', 'FALLECIDO')).toBe(false);
    expect(validarTransicion('CANCELADO', 'FALLECIDO')).toBe(false);
    expect(validarTransicion('FALLECIDO', 'FALLECIDO')).toBe(false);
  });

  it('blocks backwards or invalid transitions', () => {
    expect(validarTransicion('COMPLETADO', 'EN_PROGRAMACION')).toBe(false);
    expect(validarTransicion('CANCELADO', 'SOLICITUD_RECIBIDA')).toBe(false);
    expect(validarTransicion('PENDIENTE_AUTORIZACION', 'COMPLETADO')).toBe(false);
    expect(validarTransicion('MUESTRA_TOMADA', 'EN_PROGRAMACION')).toBe(false);
  });

  it('blocks unknown states', () => {
    expect(validarTransicion('UNKNOWN_STATE', 'COMPLETADO')).toBe(false);
    expect(validarTransicion('SOLICITUD_RECIBIDA', 'UNKNOWN_TARGET')).toBe(false);
  });

  it('terminal states have no outgoing transitions except FALLECIDO handling', () => {
    expect(validarTransicion('NO_ACEPTO', 'COMPLETADO')).toBe(false);
    expect(validarTransicion('NO_ACEPTO', 'EN_PROGRAMACION')).toBe(false);
  });

  it('DATOS_INCOMPLETOS can go back to EN_PROGRAMACION or CANCELADO', () => {
    expect(validarTransicion('DATOS_INCOMPLETOS', 'EN_PROGRAMACION')).toBe(true);
    expect(validarTransicion('DATOS_INCOMPLETOS', 'CANCELADO')).toBe(true);
    expect(validarTransicion('DATOS_INCOMPLETOS', 'COMPLETADO')).toBe(false);
  });
});

// ─── TRANSICIONES completeness ────────────────────────────────────────────────

describe('TRANSICIONES map', () => {
  const ALL_STATES = Object.keys(TRANSICIONES);

  it('has 18 defined states', () => {
    expect(ALL_STATES).toHaveLength(18);
  });

  it('all target states are also defined states', () => {
    const definedSet = new Set(ALL_STATES);
    for (const [from, targets] of Object.entries(TRANSICIONES)) {
      for (const to of targets) {
        expect(definedSet.has(to)).toBe(true); // `${from}` → `${to}` must be a defined state
      }
    }
  });
});
