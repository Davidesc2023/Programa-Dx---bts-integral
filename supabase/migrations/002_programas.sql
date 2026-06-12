-- Migración 002: Catálogo de programas diagnósticos por tenant

CREATE TABLE programas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo          TEXT NOT NULL,          -- WILSON | DAAT | DUCHENNE
  nombre          TEXT NOT NULL,
  gen             TEXT,                   -- ATP7B | SERPINA1 | DMD
  prueba_serica   TEXT,
  prueba_genetica TEXT,
  umbral_json     JSONB,                  -- {"ceruloplasmina_lt": 20, "cobre_orina_gt": 60}
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

CREATE TRIGGER programas_updated_at
  BEFORE UPDATE ON programas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
