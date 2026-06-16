-- Migración 004: Tabla principal de casos (solicitudes médicas)

CREATE TABLE casos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  programa_id     UUID NOT NULL REFERENCES programas(id),
  consecutivo     TEXT NOT NULL,       -- WILSON-001, DAAT-789, DUCHENNE-045
  pais_codigo     TEXT NOT NULL,
  consentimiento_medico_id   UUID REFERENCES consentimientos(id),
  consentimiento_paciente_id UUID REFERENCES consentimientos(id),

  -- Médico (capturado en formulario público — sin cuenta)
  medico_nombre          TEXT,
  medico_especialidad    TEXT,
  medico_tipo_registro   TEXT,
  medico_numero_registro TEXT,
  medico_institucion     TEXT,
  medico_ciudad          TEXT,
  medico_email           TEXT,
  medico_whatsapp        TEXT,
  medico_firmado_at      TIMESTAMPTZ,
  medico_ip              TEXT,
  medico_ua              TEXT,

  -- Paciente
  paciente_nombre       TEXT,
  paciente_tipo_doc     TEXT,
  paciente_num_doc      TEXT,
  paciente_genero       TEXT,
  paciente_eps          TEXT,
  paciente_telefono     TEXT,
  paciente_email        TEXT,
  paciente_ciudad       TEXT,
  paciente_departamento TEXT,
  paciente_pais         TEXT,
  paciente_direccion    TEXT,
  paciente_iniciales    TEXT,

  -- Representante legal (opcional)
  rep_nombre     TEXT,
  rep_doc        TEXT,
  rep_parentesco TEXT,

  -- Resultado sérico previo adjunto por el médico
  resultado_previo_valor          TEXT,
  resultado_previo_pdf_url        TEXT,
  resultado_previo_interpretacion TEXT,

  -- Estado del caso (state machine)
  estado TEXT NOT NULL DEFAULT 'SOLICITUD_RECIBIDA'
    CHECK (estado IN (
      'SOLICITUD_RECIBIDA', 'EN_PROGRAMACION', 'PENDIENTE_AUTORIZACION',
      'AUTORIZADO', 'NO_ACEPTO', 'PROGRAMADO', 'MUESTRA_TOMADA',
      'RESULTADO_SERICO_DISPONIBLE', 'CON_INDICACION_GENETICA',
      'SIN_INDICACION_GENETICA', 'GENETICA_PROGRAMADA',
      'GENETICA_EN_PROCESAMIENTO', 'GENETICA_RESULTADO_DISPONIBLE',
      'COMPLETADO', 'SIN_CONTACTO_EFECTIVO', 'CANCELADO', 'FALLECIDO',
      'DATOS_INCOMPLETOS'
    )),

  -- Indicación genética
  tiene_indicacion_genetica BOOLEAN,
  indicacion_motivo          TEXT,
  indicacion_registrada_at   TIMESTAMPTZ,

  -- Resultado sérico registrado por el operador
  resultado_serico_1    TEXT,
  resultado_serico_2    TEXT,
  interpretacion_serico TEXT,
  notas_serico          TEXT,
  serica_registrada_at  TIMESTAMPTZ,

  -- Resultado genético
  estado_genetico TEXT
    CHECK (estado_genetico IN (
      'PROGRAMADO', 'EN_PROCESAMIENTO', 'REALIZADO',
      'SIN_INDICACION_GENETICA', 'N_A', 'NO_ACEPTA', NULL
    )),
  resultado_genetico    TEXT,
  laboratorio_genetico  TEXT,
  fecha_genetica        DATE,
  genetica_registrada_at TIMESTAMPTZ,

  -- Seguimiento clínico (Wilson principalmente)
  seguimiento_clinico TEXT
    CHECK (seguimiento_clinico IN (
      'NEGATIVO', 'PORTADOR', 'POSITIVO', 'EN_TRATAMIENTO',
      'FORMULADO', 'TRASPLANTADO', 'DROP_OUT', 'FALLECIDO', 'N_A', NULL
    )),
  notas_seguimiento         TEXT,
  seguimiento_registrado_at TIMESTAMPTZ,

  -- Autorización del paciente
  paciente_autorizacion     TEXT NOT NULL DEFAULT 'PENDIENTE'
    CHECK (paciente_autorizacion IN ('PENDIENTE', 'AUTORIZADO', 'NO_AUTORIZADO')),
  paciente_autorizo_at      TIMESTAMPTZ,
  paciente_ip               TEXT,
  paciente_ua               TEXT,
  paciente_nombre_firmado   TEXT,
  paciente_correccion_datos TEXT,

  -- Metadatos
  mes_solicitud  TEXT,
  migrado_de     TEXT,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, consecutivo)
);

CREATE TRIGGER casos_updated_at
  BEFORE UPDATE ON casos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX casos_tenant_estado   ON casos(tenant_id, estado);
CREATE INDEX casos_tenant_programa ON casos(tenant_id, programa_id);
CREATE INDEX casos_tenant_fecha    ON casos(tenant_id, created_at DESC);
CREATE INDEX casos_paciente_doc    ON casos(tenant_id, paciente_num_doc);
