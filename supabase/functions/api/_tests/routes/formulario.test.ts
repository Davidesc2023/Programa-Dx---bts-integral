// Tests de validación de lógica del formulario público del médico
// Ejecutar: deno test supabase/functions/api/_tests/

import { assertEquals, assert } from "https://deno.land/std/assert/mod.ts"

// ─── Helpers locales (replica la lógica del route sin depender de Supabase) ──

const PROGRAMA_SLUGS: Record<string, string> = {
  wilson:   "WILSON",
  alfa1:    "DAAT",
  duchenne: "DUCHENNE",
}

const PAISES_VALIDOS = new Set(["CO", "EC", "PA", "CL", "CR", "SV", "DO", "GT"])

function resolverPrograma(slug: string): string | null {
  return PROGRAMA_SLUGS[slug] ?? null
}

function validarCamposRequeridos(body: Record<string, unknown>): string | null {
  const required = [
    "pais_codigo",
    "medico_nombre", "medico_especialidad", "medico_numero_registro", "medico_email",
    "paciente_nombre", "paciente_tipo_doc", "paciente_num_doc",
  ]
  for (const f of required) {
    if (!body[f]) return f
  }
  return null
}

function calcularIniciales(nombre: string): string {
  return nombre.split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").join("")
}

function generarConsecutivo(codigo: string, total: number): string {
  return `${codigo}-${String(total + 1).padStart(4, "0")}`
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test("Formulario - resolución de programa", async (t) => {
  await t.step("wilson → WILSON", () => {
    assertEquals(resolverPrograma("wilson"), "WILSON")
  })

  await t.step("alfa1 → DAAT", () => {
    assertEquals(resolverPrograma("alfa1"), "DAAT")
  })

  await t.step("duchenne → DUCHENNE", () => {
    assertEquals(resolverPrograma("duchenne"), "DUCHENNE")
  })

  await t.step("slug inválido → null", () => {
    assertEquals(resolverPrograma("hemofilia"), null)
    assertEquals(resolverPrograma(""), null)
  })
})

Deno.test("Formulario - validación de países", async (t) => {
  await t.step("países habilitados son aceptados", () => {
    for (const pais of ["CO", "EC", "PA", "CL", "CR", "SV", "DO", "GT"]) {
      assert(PAISES_VALIDOS.has(pais), `${pais} debe ser válido`)
    }
  })

  await t.step("países no habilitados son rechazados", () => {
    for (const pais of ["US", "MX", "AR", "BR", "PE", ""]) {
      assertEquals(PAISES_VALIDOS.has(pais), false, `${pais} no debe ser válido`)
    }
  })
})

Deno.test("Formulario - validación de campos requeridos", async (t) => {
  const bodyCompleto = {
    pais_codigo:            "CO",
    medico_nombre:          "Dr. Juan Pérez",
    medico_especialidad:    "Neurología",
    medico_numero_registro: "RM-12345",
    medico_email:           "dr.juan@hospital.com",
    paciente_nombre:        "María García López",
    paciente_tipo_doc:      "CC",
    paciente_num_doc:       "1234567890",
  }

  await t.step("body completo no da error", () => {
    assertEquals(validarCamposRequeridos(bodyCompleto), null)
  })

  await t.step("falta pais_codigo → error", () => {
    const body = { ...bodyCompleto, pais_codigo: "" }
    assertEquals(validarCamposRequeridos(body), "pais_codigo")
  })

  await t.step("falta medico_email → error", () => {
    const body = { ...bodyCompleto, medico_email: undefined }
    assertEquals(validarCamposRequeridos(body as Record<string, unknown>), "medico_email")
  })

  await t.step("falta paciente_num_doc → error", () => {
    const body = { ...bodyCompleto, paciente_num_doc: "" }
    assertEquals(validarCamposRequeridos(body), "paciente_num_doc")
  })
})

Deno.test("Formulario - cálculo de iniciales", async (t) => {
  await t.step("nombre simple 2 palabras", () => {
    assertEquals(calcularIniciales("María García"), "MG")
  })

  await t.step("nombre con 3 palabras", () => {
    assertEquals(calcularIniciales("María García López"), "MGL")
  })

  await t.step("nombre con 4 palabras (nombre compuesto)", () => {
    assertEquals(calcularIniciales("María del Carmen García"), "MDCG")
  })

  await t.step("nombre en mayúsculas", () => {
    assertEquals(calcularIniciales("JUAN CARLOS RODRIGUEZ"), "JCR")
  })
})

Deno.test("Formulario - generación de consecutivo", async (t) => {
  await t.step("primer caso del programa: -0001", () => {
    assertEquals(generarConsecutivo("WILSON", 0), "WILSON-0001")
  })

  await t.step("décimo caso: -0010", () => {
    assertEquals(generarConsecutivo("DAAT", 9), "DAAT-0010")
  })

  await t.step("caso 789: -0789", () => {
    assertEquals(generarConsecutivo("DAAT", 788), "DAAT-0789")
  })

  await t.step("caso 1000: -1000", () => {
    assertEquals(generarConsecutivo("DUCHENNE", 999), "DUCHENNE-1000")
  })

  await t.step("caso mayor a 9999 sigue siendo legible", () => {
    const result = generarConsecutivo("WILSON", 9999)
    assert(result.startsWith("WILSON-"), "debe tener el prefijo")
    assert(result.includes("10000"), "debe tener el número completo")
  })
})
