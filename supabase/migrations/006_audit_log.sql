-- Migración 006: Log de auditoría para todas las acciones relevantes

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  actor_id    UUID,           -- admin_user ID, o NULL si es acción externa (médico/paciente via link)
  actor_tipo  TEXT NOT NULL
    CHECK (actor_tipo IN ('SUPER_ADMIN', 'ADMIN', 'OPERADOR', 'MEDICO_LINK', 'PACIENTE_LINK', 'SISTEMA')),
  accion      TEXT NOT NULL,  -- 'CASO_CREADO', 'ESTADO_CAMBIADO', 'LINK_GENERADO', 'PACIENTE_AUTORIZO', etc.
  entidad     TEXT,           -- 'casos', 'magic_links', 'consentimientos'
  entidad_id  UUID,
  datos_json  JSONB,          -- snapshot de los datos relevantes del cambio
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_tenant ON audit_log(tenant_id, created_at DESC);
CREATE INDEX audit_log_caso ON audit_log(entidad_id) WHERE entidad = 'casos';
