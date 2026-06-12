-- Migración 005: Magic links para paciente y resultados

CREATE TABLE magic_links (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash     TEXT UNIQUE NOT NULL,  -- SHA-256 del token real (el token plano NUNCA persiste)
  tipo           TEXT NOT NULL
    CHECK (tipo IN ('PACIENTE_FIRMA', 'RESULTADOS_MEDICO', 'RESULTADOS_PACIENTE')),
  caso_id        UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  expira_at      TIMESTAMPTZ NOT NULL,
  usado_at       TIMESTAMPTZ,
  ip_usado       TEXT,
  user_agent     TEXT,
  invalidado_at  TIMESTAMPTZ,
  invalidado_por UUID REFERENCES admin_users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX magic_links_caso ON magic_links(caso_id);
