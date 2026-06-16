-- Seed: BTS Integral — tenant + programas + consentimientos CO
-- Aplicar una sola vez al proyecto Supabase wwosggahpasvoexshrdl
-- Fecha: 2026-06-12

-- ── Tenant ────────────────────────────────────────────────────────────────────
INSERT INTO tenants (slug, nombre, logo_url, color_primario, email_contacto, activo)
VALUES ('bts', 'BTS Integral', NULL, '#1B7A6B', 'dx@btsintegral.com', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ── Programas ─────────────────────────────────────────────────────────────────
INSERT INTO programas (tenant_id, codigo, nombre, gen, prueba_serica, prueba_genetica, umbral_json, activo)
SELECT t.id, prog.codigo, prog.nombre, prog.gen, prog.prueba_serica, prog.prueba_genetica, prog.umbral_json::jsonb, TRUE
FROM tenants t
CROSS JOIN (VALUES
  ('WILSON',   'Enfermedad de Wilson',             'ATP7B',    'Ceruloplasmina sérica + Cobre en orina 24h', 'Secuenciación gen ATP7B',           '{"ceruloplasmina_lt": 20, "cobre_orina_gt": 100}'),
  ('DAAT',     'Déficit de Alfa-1 Antitripsina',   'SERPINA1', 'Alfa-1 antitripsina sérica',                 'Genotipificación SERPINA1 (Pi*Z, Pi*S)', '{"alfa1_lte": 100}'),
  ('DUCHENNE', 'Distrofia Muscular de Duchenne',   'DMD',      'Creatina quinasa (CK) sérica',               'Panel genético DMD (MLPA + secuenciación)', '{"manual": true}')
) AS prog(codigo, nombre, gen, prueba_serica, prueba_genetica, umbral_json)
WHERE t.slug = 'bts'
ON CONFLICT (tenant_id, codigo) DO NOTHING;

-- ── Consentimientos MEDICO — Colombia ─────────────────────────────────────────
INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'CO', 'MEDICO',
 'Consentimiento Informado del Médico — Enfermedad de Wilson',
 'Ley 23 de 1981 (Código de Ética Médica), Resolución 8430 de 1993, Ley 1581 de 2012.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos o paraclínicos compatibles con sospecha de <strong>Enfermedad de Wilson</strong> y que las pruebas diagnósticas solicitadas a través del programa BTS Integral — DX están indicadas clínicamente.</p>
<ul>
  <li>He informado al paciente sobre la naturaleza de la Enfermedad de Wilson, el proceso diagnóstico y sus implicaciones.</li>
  <li>He explicado que se realizará extracción de muestra sanguínea para ceruloplasmina sérica y, si aplica, cobre en orina 24h.</li>
  <li>Los datos clínicos suministrados son verídicos y provienen de la historia clínica del paciente.</li>
  <li>La información será tratada conforme a la Ley 1581 de 2012 y la Resolución 8430 de 1993.</li>
</ul>'
),

('DAAT', 'CO', 'MEDICO',
 'Consentimiento Informado del Médico — Déficit de Alfa-1 Antitripsina',
 'Ley 23 de 1981, Resolución 8430 de 1993, Ley 1581 de 2012.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos compatibles con sospecha de <strong>Déficit de Alfa-1 Antitripsina (DAAT)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están clínicamente justificadas.</p>
<ul>
  <li>He informado al paciente sobre el DAAT, su carácter hereditario y las implicaciones del diagnóstico.</li>
  <li>Se tomará muestra de sangre venosa para cuantificación de Alfa-1 antitripsina y, según resultado, genotipificación (Pi*Z, Pi*S).</li>
  <li>Los datos clínicos son fidedignos y provienen de la historia clínica.</li>
  <li>Información confidencial conforme a la Ley 1581 de 2012.</li>
</ul>'
),

('DUCHENNE', 'CO', 'MEDICO',
 'Consentimiento Informado del Médico — Distrofia Muscular de Duchenne',
 'Ley 23 de 1981, Resolución 8430 de 1993, Ley 1581 de 2012, Ley 1392 de 2010.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios compatibles con sospecha de <strong>Distrofia Muscular de Duchenne (DMD)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas.</p>
<ul>
  <li>He informado al paciente/representante sobre la naturaleza de la DMD, su carácter X-linked y las implicaciones familiares del diagnóstico.</li>
  <li>Se realizará toma de muestra para CK sérica y, según resultado, estudio molecular del gen DMD (MLPA y/o secuenciación).</li>
  <li>Los datos clínicos provienen de la historia clínica y son verídicos.</li>
  <li>Información confidencial conforme a la Ley 1581 de 2012 y la Ley 1392 de 2010.</li>
</ul>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

-- ── Consentimientos PACIENTE — Colombia ───────────────────────────────────────
INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'CO', 'PACIENTE',
 'Consentimiento Informado del Paciente — Enfermedad de Wilson',
 'Ley 23 de 1981, Resolución 8430 de 1993, Ley 1581 de 2012 (Habeas Data).',
 '<h2>¿Qué es la Enfermedad de Wilson?</h2>
<p>La Enfermedad de Wilson es un trastorno hereditario del metabolismo del cobre. Con diagnóstico y tratamiento oportunos, la mayoría de las personas lleva una vida normal.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Toma de muestra:</strong> Extracción de sangre venosa para ceruloplasmina y, si aplica, recolección de orina 24h para cobre urinario.</li>
  <li><strong>Análisis genético (si aplica):</strong> Secuenciación del gen ATP7B. El resultado puede ser relevante para sus familiares de primer grado.</li>
  <li><strong>Confidencialidad:</strong> Sus datos se manejan de forma estrictamente confidencial conforme a la Ley 1581 de 2012.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Su participación es completamente voluntaria. Puede no autorizar sin que esto afecte su atención médica.</p>
<p><strong>Al firmar, declara haber comprendido la información y autoriza voluntariamente el diagnóstico de Enfermedad de Wilson.</strong></p>'
),

('DAAT', 'CO', 'PACIENTE',
 'Consentimiento Informado del Paciente — Déficit de Alfa-1 Antitripsina',
 'Ley 23 de 1981, Resolución 8430 de 1993, Ley 1581 de 2012.',
 '<h2>¿Qué es el Déficit de Alfa-1 Antitripsina?</h2>
<p>El Déficit de Alfa-1 Antitripsina (DAAT) es una enfermedad hereditaria en la que el organismo produce niveles insuficientes de una proteína protectora de los pulmones y el hígado. El diagnóstico temprano permite iniciar medidas de protección.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa estándar para cuantificación de Alfa-1 antitripsina.</li>
  <li><strong>Análisis genético (si aplica):</strong> Genotipificación de alelos Pi*Z y Pi*S. El resultado puede ser relevante para sus familiares directos.</li>
  <li><strong>Confidencialidad:</strong> Datos confidenciales según la Ley 1581 de 2012.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Sí. Puede negarse sin consecuencias para su atención médica.</p>
<p><strong>Al firmar, autoriza voluntariamente el diagnóstico de Déficit de Alfa-1 Antitripsina.</strong></p>'
),

('DUCHENNE', 'CO', 'PACIENTE',
 'Consentimiento Informado del Paciente/Representante — Distrofia Muscular de Duchenne',
 'Ley 23 de 1981, Resolución 8430 de 1993, Ley 1581 de 2012, Ley 1392 de 2010.',
 '<h2>¿Qué es la Distrofia Muscular de Duchenne?</h2>
<p>La Distrofia Muscular de Duchenne (DMD) es una enfermedad hereditaria ligada al cromosoma X. El diagnóstico temprano es fundamental para iniciar el manejo adecuado y acceder a terapias disponibles.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para medición de CK sérica.</li>
  <li><strong>Análisis genético (si aplica):</strong> Estudio molecular del gen DMD (MLPA y/o secuenciación). El resultado es importante para el paciente y sus familiares (madres portadoras, hermanos).</li>
  <li><strong>Confidencialidad:</strong> Datos tratados conforme a la Ley 1581 de 2012 y la Ley 1392 de 2010.</li>
</ul>
<h2>¿Es voluntaria la participación?</h2>
<p>Sí. El representante legal puede negarse sin consecuencias para la atención del paciente.</p>
<p><strong>Al firmar, el paciente o su representante autoriza voluntariamente el proceso diagnóstico de Distrofia Muscular de Duchenne.</strong></p>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;
