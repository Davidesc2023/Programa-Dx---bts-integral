-- Migración 007: Row Level Security — aislamiento multi-tenant

-- Habilitar RLS en todas las tablas de datos
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE consentimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- La Edge Function usa service_role_key → bypasea RLS automáticamente
-- Las políticas aplican para conexiones directas (anon, authenticated)

-- Bloquear todo acceso directo anon a tablas sensibles
CREATE POLICY "Sin acceso anon" ON casos FOR ALL TO anon USING (FALSE);
CREATE POLICY "Sin acceso anon" ON admin_users FOR ALL TO anon USING (FALSE);
CREATE POLICY "Sin acceso anon" ON magic_links FOR ALL TO anon USING (FALSE);
CREATE POLICY "Sin acceso anon" ON audit_log FOR ALL TO anon USING (FALSE);

-- Tenants: solo lectura pública para resolución de slug en formularios públicos
CREATE POLICY "Tenant público por slug" ON tenants
  FOR SELECT TO anon
  USING (activo = TRUE);

-- Programas: solo lectura pública para formularios públicos
CREATE POLICY "Programas públicos activos" ON programas
  FOR SELECT TO anon
  USING (activo = TRUE);

-- Consentimientos: solo lectura pública de activos (para formularios)
CREATE POLICY "Consentimientos públicos activos" ON consentimientos
  FOR SELECT TO anon
  USING (activo = TRUE);
