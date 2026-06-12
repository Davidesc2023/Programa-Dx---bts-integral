-- Migración 003: Plantillas de consentimiento por programa + país + tipo + versión

CREATE TABLE consentimientos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id  UUID NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
  pais_codigo  TEXT NOT NULL,  -- CO, EC, PA, CL, CR, SV, DO, GT
  tipo         TEXT NOT NULL CHECK (tipo IN ('MEDICO', 'PACIENTE')),
  version      INTEGER NOT NULL DEFAULT 1,
  titulo       TEXT NOT NULL,
  marco_legal  TEXT NOT NULL,
  cuerpo_html  TEXT NOT NULL,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  vigente_desde DATE NOT NULL,
  created_by   UUID REFERENCES admin_users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(programa_id, pais_codigo, tipo, version)
);

-- Solo un consentimiento activo por programa+país+tipo
CREATE UNIQUE INDEX consentimientos_activo_unico
  ON consentimientos(programa_id, pais_codigo, tipo)
  WHERE activo = TRUE;
