-- Fase 10: Plantillas de consentimiento para países LATAM
-- Países cubiertos: EC, PA, CL, CR, SV, DO, GT
-- (CO ya incluido en seed-bts.sql)
-- Aplicar después de seed-bts.sql — idempotente (ON CONFLICT DO NOTHING)
-- Fecha: 2026-06-12

-- ============================================================================
-- ECUADOR (EC)
-- Marco legal: Ley Orgánica de Salud (R.O. 423/2006)
--              Ley Orgánica de Protección de Datos Personales (R.O. 459/2021)
--              Código de Ética y Deontología Médica del Ecuador
-- ============================================================================

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'EC', 'MEDICO',
 'Consentimiento Informado del Médico — Enfermedad de Wilson (Ecuador)',
 'Ley Orgánica de Salud (R.O. 423, 22 dic 2006, arts. 7, 8, 209); Ley Orgánica de Protección de Datos Personales (R.O. 459, 26 may 2021); Código de Ética y Deontología Médica del Ecuador.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos o paraclínicos compatibles con sospecha de <strong>Enfermedad de Wilson</strong> y que las pruebas diagnósticas solicitadas a través del programa BTS Integral — DX están indicadas clínicamente.</p>
<ul>
  <li>He informado al paciente sobre la naturaleza de la Enfermedad de Wilson, el proceso diagnóstico y sus implicaciones, en cumplimiento del art. 7 de la Ley Orgánica de Salud.</li>
  <li>He explicado que se realizará extracción de muestra sanguínea para ceruloplasmina sérica y, si aplica, cobre en orina 24h.</li>
  <li>Los datos clínicos suministrados son verídicos y provienen de la historia clínica del paciente.</li>
  <li>La información personal será tratada conforme a la Ley Orgánica de Protección de Datos Personales (R.O. 459/2021).</li>
</ul>'
),

('DAAT', 'EC', 'MEDICO',
 'Consentimiento Informado del Médico — Déficit de Alfa-1 Antitripsina (Ecuador)',
 'Ley Orgánica de Salud (R.O. 423, 22 dic 2006); Ley Orgánica de Protección de Datos Personales (R.O. 459, 26 may 2021); Código de Ética y Deontología Médica del Ecuador.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos compatibles con sospecha de <strong>Déficit de Alfa-1 Antitripsina (DAAT)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están clínicamente justificadas.</p>
<ul>
  <li>He informado al paciente sobre el DAAT, su carácter hereditario y las implicaciones del diagnóstico, conforme al art. 7 de la Ley Orgánica de Salud.</li>
  <li>Se tomará muestra de sangre venosa para cuantificación de Alfa-1 antitripsina y, según resultado, genotipificación (Pi*Z, Pi*S).</li>
  <li>Los datos clínicos son fidedignos y provienen de la historia clínica.</li>
  <li>Información confidencial conforme a la Ley Orgánica de Protección de Datos Personales (2021).</li>
</ul>'
),

('DUCHENNE', 'EC', 'MEDICO',
 'Consentimiento Informado del Médico — Distrofia Muscular de Duchenne (Ecuador)',
 'Ley Orgánica de Salud (R.O. 423/2006); Ley Orgánica de Protección de Datos Personales (R.O. 459/2021); Código de Ética y Deontología Médica del Ecuador.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios compatibles con sospecha de <strong>Distrofia Muscular de Duchenne (DMD)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas.</p>
<ul>
  <li>He informado al paciente/representante sobre la naturaleza de la DMD, su carácter X-linked y las implicaciones familiares del diagnóstico, en cumplimiento de la Ley Orgánica de Salud.</li>
  <li>Se realizará toma de muestra para CK sérica y, según resultado, estudio molecular del gen DMD (MLPA y/o secuenciación).</li>
  <li>Los datos clínicos provienen de la historia clínica y son verídicos.</li>
  <li>Información confidencial conforme a la Ley Orgánica de Protección de Datos Personales (R.O. 459/2021).</li>
</ul>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'EC', 'PACIENTE',
 'Consentimiento Informado del Paciente — Enfermedad de Wilson (Ecuador)',
 'Ley Orgánica de Salud (R.O. 423/2006, art. 7); Ley Orgánica de Protección de Datos Personales (R.O. 459/2021).',
 '<h2>¿Qué es la Enfermedad de Wilson?</h2>
<p>La Enfermedad de Wilson es un trastorno hereditario del metabolismo del cobre. Con diagnóstico y tratamiento oportunos, la mayoría de las personas lleva una vida normal.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Toma de muestra:</strong> Extracción de sangre venosa para ceruloplasmina y, si aplica, recolección de orina 24h para cobre urinario.</li>
  <li><strong>Análisis genético (si aplica):</strong> Secuenciación del gen ATP7B. El resultado puede ser relevante para sus familiares de primer grado.</li>
  <li><strong>Confidencialidad:</strong> Sus datos se tratan conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (R.O. 459/2021).</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Su participación es completamente voluntaria. Puede no autorizar sin que esto afecte su atención médica, conforme al art. 7 de la Ley Orgánica de Salud.</p>
<p><strong>Al firmar, declara haber comprendido la información y autoriza voluntariamente el diagnóstico de Enfermedad de Wilson.</strong></p>'
),

('DAAT', 'EC', 'PACIENTE',
 'Consentimiento Informado del Paciente — Déficit de Alfa-1 Antitripsina (Ecuador)',
 'Ley Orgánica de Salud (R.O. 423/2006); Ley Orgánica de Protección de Datos Personales (R.O. 459/2021).',
 '<h2>¿Qué es el Déficit de Alfa-1 Antitripsina?</h2>
<p>El Déficit de Alfa-1 Antitripsina (DAAT) es una enfermedad hereditaria en la que el organismo produce niveles insuficientes de una proteína protectora de los pulmones y el hígado. El diagnóstico temprano permite iniciar medidas de protección.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa estándar para cuantificación de Alfa-1 antitripsina.</li>
  <li><strong>Análisis genético (si aplica):</strong> Genotipificación de alelos Pi*Z y Pi*S. El resultado puede ser relevante para sus familiares directos.</li>
  <li><strong>Confidencialidad:</strong> Datos confidenciales según la Ley Orgánica de Protección de Datos Personales (R.O. 459/2021).</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Sí. Puede negarse sin consecuencias para su atención médica.</p>
<p><strong>Al firmar, autoriza voluntariamente el diagnóstico de Déficit de Alfa-1 Antitripsina.</strong></p>'
),

('DUCHENNE', 'EC', 'PACIENTE',
 'Consentimiento Informado del Paciente/Representante — Distrofia Muscular de Duchenne (Ecuador)',
 'Ley Orgánica de Salud (R.O. 423/2006); Ley Orgánica de Protección de Datos Personales (R.O. 459/2021).',
 '<h2>¿Qué es la Distrofia Muscular de Duchenne?</h2>
<p>La Distrofia Muscular de Duchenne (DMD) es una enfermedad hereditaria ligada al cromosoma X. El diagnóstico temprano es fundamental para el manejo adecuado y el acceso a terapias disponibles.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para medición de CK sérica.</li>
  <li><strong>Análisis genético (si aplica):</strong> Estudio molecular del gen DMD (MLPA y/o secuenciación), relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos tratados conforme a la Ley Orgánica de Protección de Datos Personales (2021).</li>
</ul>
<h2>¿Es voluntaria la participación?</h2>
<p>Sí. El representante legal puede negarse sin consecuencias para la atención del paciente.</p>
<p><strong>Al firmar, el paciente o su representante autoriza voluntariamente el proceso diagnóstico de Distrofia Muscular de Duchenne.</strong></p>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

-- ============================================================================
-- PANAMÁ (PA)
-- Marco legal: Ley 68 de 2003 (Derechos del Paciente)
--              Ley 15 de 2003 (Protección al Consumidor — datos personales)
--              Decreto Ejecutivo 491 de 2004 (reglamentación consentimiento)
--              Código de Ética Médica de Panamá
-- ============================================================================

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'PA', 'MEDICO',
 'Consentimiento Informado del Médico — Enfermedad de Wilson (Panamá)',
 'Ley 68 de 2003 (Derechos y Deberes de los Pacientes), art. 13; Decreto Ejecutivo 491 de 2004; Código de Ética Médica de la República de Panamá; Ley 81 de 2019 (Protección de Datos Personales).',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos o paraclínicos compatibles con sospecha de <strong>Enfermedad de Wilson</strong> y que las pruebas diagnósticas solicitadas a través del programa BTS Integral — DX están indicadas clínicamente, conforme al art. 13 de la Ley 68 de 2003.</p>
<ul>
  <li>He informado al paciente sobre la naturaleza de la Enfermedad de Wilson, el proceso diagnóstico y sus implicaciones.</li>
  <li>He explicado que se realizará extracción de muestra sanguínea para ceruloplasmina sérica y, si aplica, cobre en orina 24h.</li>
  <li>Los datos clínicos suministrados son verídicos y provienen de la historia clínica del paciente.</li>
  <li>La información personal será tratada conforme a la Ley 81 de 2019 (Protección de Datos Personales en Panamá).</li>
</ul>'
),

('DAAT', 'PA', 'MEDICO',
 'Consentimiento Informado del Médico — Déficit de Alfa-1 Antitripsina (Panamá)',
 'Ley 68 de 2003 (Derechos del Paciente); Decreto Ejecutivo 491 de 2004; Ley 81 de 2019 (Protección de Datos Personales); Código de Ética Médica de Panamá.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos compatibles con sospecha de <strong>Déficit de Alfa-1 Antitripsina (DAAT)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están clínicamente justificadas conforme a la Ley 68 de 2003.</p>
<ul>
  <li>He informado al paciente sobre el DAAT, su carácter hereditario y las implicaciones del diagnóstico.</li>
  <li>Se tomará muestra de sangre venosa para cuantificación de Alfa-1 antitripsina y, según resultado, genotipificación (Pi*Z, Pi*S).</li>
  <li>Los datos clínicos son fidedignos y provienen de la historia clínica.</li>
  <li>Información confidencial conforme a la Ley 81 de 2019 de Panamá.</li>
</ul>'
),

('DUCHENNE', 'PA', 'MEDICO',
 'Consentimiento Informado del Médico — Distrofia Muscular de Duchenne (Panamá)',
 'Ley 68 de 2003 (Derechos del Paciente); Decreto Ejecutivo 491 de 2004; Ley 81 de 2019 (Protección de Datos Personales); Código de Ética Médica de Panamá.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios compatibles con sospecha de <strong>Distrofia Muscular de Duchenne (DMD)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas conforme a la Ley 68 de 2003.</p>
<ul>
  <li>He informado al paciente/representante sobre la naturaleza de la DMD, su carácter X-linked y las implicaciones familiares del diagnóstico.</li>
  <li>Se realizará toma de muestra para CK sérica y, según resultado, estudio molecular del gen DMD (MLPA y/o secuenciación).</li>
  <li>Los datos clínicos provienen de la historia clínica y son verídicos.</li>
  <li>Información confidencial conforme a la Ley 81 de 2019.</li>
</ul>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'PA', 'PACIENTE',
 'Consentimiento Informado del Paciente — Enfermedad de Wilson (Panamá)',
 'Ley 68 de 2003 (Derechos y Deberes de los Pacientes), art. 13; Ley 81 de 2019 (Protección de Datos Personales).',
 '<h2>¿Qué es la Enfermedad de Wilson?</h2>
<p>La Enfermedad de Wilson es un trastorno hereditario del metabolismo del cobre. Con diagnóstico y tratamiento oportunos, la mayoría de las personas lleva una vida normal.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Toma de muestra:</strong> Extracción de sangre venosa para ceruloplasmina y, si aplica, recolección de orina 24h para cobre urinario.</li>
  <li><strong>Análisis genético (si aplica):</strong> Secuenciación del gen ATP7B. El resultado puede ser relevante para sus familiares de primer grado.</li>
  <li><strong>Confidencialidad:</strong> Sus datos se manejan conforme a la Ley 81 de 2019 de Protección de Datos Personales de Panamá.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Su participación es completamente voluntaria. Puede revocar su autorización sin que esto afecte su atención médica, conforme al art. 13 de la Ley 68 de 2003.</p>
<p><strong>Al firmar, declara haber comprendido la información y autoriza voluntariamente el diagnóstico de Enfermedad de Wilson.</strong></p>'
),

('DAAT', 'PA', 'PACIENTE',
 'Consentimiento Informado del Paciente — Déficit de Alfa-1 Antitripsina (Panamá)',
 'Ley 68 de 2003 (Derechos del Paciente); Ley 81 de 2019 (Protección de Datos Personales).',
 '<h2>¿Qué es el Déficit de Alfa-1 Antitripsina?</h2>
<p>El Déficit de Alfa-1 Antitripsina (DAAT) es una enfermedad hereditaria en la que el organismo produce niveles insuficientes de una proteína protectora de los pulmones y el hígado. El diagnóstico temprano permite iniciar medidas de protección.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa estándar para cuantificación de Alfa-1 antitripsina.</li>
  <li><strong>Análisis genético (si aplica):</strong> Genotipificación de alelos Pi*Z y Pi*S. El resultado puede ser relevante para sus familiares directos.</li>
  <li><strong>Confidencialidad:</strong> Datos confidenciales según la Ley 81 de 2019 de Panamá.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Sí. Puede negarse sin consecuencias para su atención médica.</p>
<p><strong>Al firmar, autoriza voluntariamente el diagnóstico de Déficit de Alfa-1 Antitripsina.</strong></p>'
),

('DUCHENNE', 'PA', 'PACIENTE',
 'Consentimiento Informado del Paciente/Representante — Distrofia Muscular de Duchenne (Panamá)',
 'Ley 68 de 2003 (Derechos del Paciente); Ley 81 de 2019 (Protección de Datos Personales).',
 '<h2>¿Qué es la Distrofia Muscular de Duchenne?</h2>
<p>La Distrofia Muscular de Duchenne (DMD) es una enfermedad hereditaria ligada al cromosoma X. El diagnóstico temprano es fundamental para el manejo adecuado y el acceso a terapias disponibles.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para medición de CK sérica.</li>
  <li><strong>Análisis genético (si aplica):</strong> Estudio molecular del gen DMD (MLPA y/o secuenciación), relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos tratados conforme a la Ley 81 de 2019.</li>
</ul>
<h2>¿Es voluntaria la participación?</h2>
<p>Sí. El representante legal puede negarse sin consecuencias para la atención del paciente.</p>
<p><strong>Al firmar, el paciente o su representante autoriza voluntariamente el proceso diagnóstico de Distrofia Muscular de Duchenne.</strong></p>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

-- ============================================================================
-- CHILE (CL)
-- Marco legal: Ley 20.584 de 2012 (Derechos y Deberes del Paciente)
--              Ley 19.628 de 1999 (Protección de la Vida Privada)
--              Código Sanitario (DFL N° 725/1967)
--              Código de Ética del Colegio Médico de Chile
-- ============================================================================

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'CL', 'MEDICO',
 'Consentimiento Informado del Médico — Enfermedad de Wilson (Chile)',
 'Ley 20.584 de 2012 (arts. 14–17, consentimiento informado); Ley 19.628 de 1999 (Protección de la Vida Privada); Código Sanitario (DFL N° 725/1967); Código de Ética del Colegio Médico de Chile.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos o paraclínicos compatibles con sospecha de <strong>Enfermedad de Wilson</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas clínicamente, en cumplimiento de los arts. 14–17 de la Ley 20.584.</p>
<ul>
  <li>He informado al paciente sobre la naturaleza de la Enfermedad de Wilson, el proceso diagnóstico y sus implicaciones.</li>
  <li>He explicado que se realizará extracción de muestra sanguínea para ceruloplasmina sérica y, si aplica, cobre en orina 24h.</li>
  <li>Los datos clínicos suministrados son verídicos y provienen de la ficha clínica del paciente.</li>
  <li>La información personal será tratada conforme a la Ley 19.628 de Protección de la Vida Privada.</li>
</ul>'
),

('DAAT', 'CL', 'MEDICO',
 'Consentimiento Informado del Médico — Déficit de Alfa-1 Antitripsina (Chile)',
 'Ley 20.584 de 2012 (arts. 14–17); Ley 19.628 de 1999 (Protección de la Vida Privada); Código Sanitario (DFL N° 725/1967).',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos compatibles con sospecha de <strong>Déficit de Alfa-1 Antitripsina (DAAT)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están clínicamente justificadas conforme a la Ley 20.584.</p>
<ul>
  <li>He informado al paciente sobre el DAAT, su carácter hereditario y las implicaciones del diagnóstico, conforme al art. 10 de la Ley 20.584.</li>
  <li>Se tomará muestra de sangre venosa para cuantificación de Alfa-1 antitripsina y, según resultado, genotipificación (Pi*Z, Pi*S).</li>
  <li>Los datos clínicos son fidedignos y provienen de la ficha clínica.</li>
  <li>Información confidencial conforme a la Ley 19.628 de 1999.</li>
</ul>'
),

('DUCHENNE', 'CL', 'MEDICO',
 'Consentimiento Informado del Médico — Distrofia Muscular de Duchenne (Chile)',
 'Ley 20.584 de 2012 (arts. 14–17); Ley 19.628 de 1999; Código Sanitario (DFL N° 725/1967).',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios compatibles con sospecha de <strong>Distrofia Muscular de Duchenne (DMD)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas conforme a la Ley 20.584.</p>
<ul>
  <li>He informado al paciente/representante sobre la naturaleza de la DMD, su carácter X-linked y las implicaciones familiares, conforme al art. 10 de la Ley 20.584.</li>
  <li>Se realizará toma de muestra para CK sérica y, según resultado, estudio molecular del gen DMD (MLPA y/o secuenciación).</li>
  <li>Los datos clínicos provienen de la ficha clínica y son verídicos.</li>
  <li>Información confidencial conforme a la Ley 19.628.</li>
</ul>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'CL', 'PACIENTE',
 'Consentimiento Informado del Paciente — Enfermedad de Wilson (Chile)',
 'Ley 20.584 de 2012 (arts. 14–17, consentimiento informado); Ley 19.628 de 1999 (Protección de la Vida Privada).',
 '<h2>¿Qué es la Enfermedad de Wilson?</h2>
<p>La Enfermedad de Wilson es un trastorno hereditario del metabolismo del cobre. Con diagnóstico y tratamiento oportunos, la mayoría de las personas lleva una vida normal.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Toma de muestra:</strong> Extracción de sangre venosa para ceruloplasmina y, si aplica, recolección de orina 24h para cobre urinario.</li>
  <li><strong>Análisis genético (si aplica):</strong> Secuenciación del gen ATP7B. El resultado puede ser relevante para sus familiares de primer grado.</li>
  <li><strong>Confidencialidad:</strong> Sus datos se manejan conforme a la Ley 19.628 de Protección de la Vida Privada.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Su participación es completamente voluntaria. Puede revocar su autorización en cualquier momento, conforme al art. 14 de la Ley 20.584, sin que esto afecte su atención médica.</p>
<p><strong>Al firmar, declara haber comprendido la información y autoriza voluntariamente el diagnóstico de Enfermedad de Wilson.</strong></p>'
),

('DAAT', 'CL', 'PACIENTE',
 'Consentimiento Informado del Paciente — Déficit de Alfa-1 Antitripsina (Chile)',
 'Ley 20.584 de 2012 (arts. 14–17); Ley 19.628 de 1999 (Protección de la Vida Privada).',
 '<h2>¿Qué es el Déficit de Alfa-1 Antitripsina?</h2>
<p>El Déficit de Alfa-1 Antitripsina (DAAT) es una enfermedad hereditaria en la que el organismo produce niveles insuficientes de una proteína protectora de los pulmones y el hígado. El diagnóstico temprano permite iniciar medidas de protección.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa estándar para cuantificación de Alfa-1 antitripsina.</li>
  <li><strong>Análisis genético (si aplica):</strong> Genotipificación de alelos Pi*Z y Pi*S. El resultado puede ser relevante para sus familiares directos.</li>
  <li><strong>Confidencialidad:</strong> Datos confidenciales según la Ley 19.628 de Chile.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Sí. Puede negarse sin consecuencias para su atención médica, conforme a la Ley 20.584.</p>
<p><strong>Al firmar, autoriza voluntariamente el diagnóstico de Déficit de Alfa-1 Antitripsina.</strong></p>'
),

('DUCHENNE', 'CL', 'PACIENTE',
 'Consentimiento Informado del Paciente/Representante — Distrofia Muscular de Duchenne (Chile)',
 'Ley 20.584 de 2012 (arts. 14–17); Ley 19.628 de 1999 (Protección de la Vida Privada).',
 '<h2>¿Qué es la Distrofia Muscular de Duchenne?</h2>
<p>La Distrofia Muscular de Duchenne (DMD) es una enfermedad hereditaria ligada al cromosoma X. El diagnóstico temprano es fundamental para el manejo adecuado y el acceso a terapias disponibles.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para medición de CK sérica.</li>
  <li><strong>Análisis genético (si aplica):</strong> Estudio molecular del gen DMD (MLPA y/o secuenciación), relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos tratados conforme a la Ley 19.628.</li>
</ul>
<h2>¿Es voluntaria la participación?</h2>
<p>Sí. El representante legal puede negarse sin consecuencias para la atención del paciente, conforme a la Ley 20.584.</p>
<p><strong>Al firmar, el paciente o su representante autoriza voluntariamente el proceso diagnóstico de Distrofia Muscular de Duchenne.</strong></p>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

-- ============================================================================
-- COSTA RICA (CR)
-- Marco legal: Ley General de Salud N° 5395 de 1973
--              Ley de Protección de la Persona frente al tratamiento de sus
--              datos personales N° 8968 de 2011 (PRODHAB)
--              Código de Bioética del Colegio de Médicos y Cirujanos de CR
-- ============================================================================

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'CR', 'MEDICO',
 'Consentimiento Informado del Médico — Enfermedad de Wilson (Costa Rica)',
 'Ley General de Salud N° 5395/1973, art. 17; Ley 8968/2011 (Protección de datos personales — PRODHAB); Código de Bioética del Colegio de Médicos y Cirujanos de Costa Rica.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos o paraclínicos compatibles con sospecha de <strong>Enfermedad de Wilson</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas, conforme al art. 17 de la Ley General de Salud N° 5395.</p>
<ul>
  <li>He informado al paciente sobre la naturaleza de la Enfermedad de Wilson, el proceso diagnóstico y sus implicaciones.</li>
  <li>He explicado que se realizará extracción de muestra sanguínea para ceruloplasmina sérica y, si aplica, cobre en orina 24h.</li>
  <li>Los datos clínicos suministrados son verídicos y provienen del expediente de salud del paciente.</li>
  <li>La información personal será tratada conforme a la Ley 8968 de 2011 (PRODHAB).</li>
</ul>'
),

('DAAT', 'CR', 'MEDICO',
 'Consentimiento Informado del Médico — Déficit de Alfa-1 Antitripsina (Costa Rica)',
 'Ley General de Salud N° 5395/1973; Ley 8968/2011 (PRODHAB); Código de Bioética del Colegio de Médicos y Cirujanos de Costa Rica.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos compatibles con sospecha de <strong>Déficit de Alfa-1 Antitripsina (DAAT)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están clínicamente justificadas.</p>
<ul>
  <li>He informado al paciente sobre el DAAT, su carácter hereditario y las implicaciones del diagnóstico.</li>
  <li>Se tomará muestra de sangre venosa para cuantificación de Alfa-1 antitripsina y, según resultado, genotipificación (Pi*Z, Pi*S).</li>
  <li>Los datos clínicos son fidedignos y provienen del expediente clínico.</li>
  <li>Información confidencial conforme a la Ley 8968/2011.</li>
</ul>'
),

('DUCHENNE', 'CR', 'MEDICO',
 'Consentimiento Informado del Médico — Distrofia Muscular de Duchenne (Costa Rica)',
 'Ley General de Salud N° 5395/1973; Ley 8968/2011 (PRODHAB); Código de Bioética del Colegio de Médicos y Cirujanos de Costa Rica.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios compatibles con sospecha de <strong>Distrofia Muscular de Duchenne (DMD)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas.</p>
<ul>
  <li>He informado al paciente/representante sobre la naturaleza de la DMD, su carácter X-linked y las implicaciones familiares del diagnóstico.</li>
  <li>Se realizará toma de muestra para CK sérica y, según resultado, estudio molecular del gen DMD (MLPA y/o secuenciación).</li>
  <li>Los datos clínicos provienen del expediente de salud y son verídicos.</li>
  <li>Información confidencial conforme a la Ley 8968/2011 (PRODHAB).</li>
</ul>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'CR', 'PACIENTE',
 'Consentimiento Informado del Paciente — Enfermedad de Wilson (Costa Rica)',
 'Ley General de Salud N° 5395/1973; Ley 8968/2011 (Protección de datos personales — PRODHAB).',
 '<h2>¿Qué es la Enfermedad de Wilson?</h2>
<p>La Enfermedad de Wilson es un trastorno hereditario del metabolismo del cobre. Con diagnóstico y tratamiento oportunos, la mayoría de las personas lleva una vida normal.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Toma de muestra:</strong> Extracción de sangre venosa para ceruloplasmina y, si aplica, orina 24h para cobre urinario.</li>
  <li><strong>Análisis genético (si aplica):</strong> Secuenciación del gen ATP7B, relevante para familiares de primer grado.</li>
  <li><strong>Confidencialidad:</strong> Sus datos se manejan conforme a la Ley 8968/2011 (PRODHAB).</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Su participación es completamente voluntaria y puede revocarse en cualquier momento sin afectar su atención médica.</p>
<p><strong>Al firmar, declara haber comprendido la información y autoriza voluntariamente el diagnóstico de Enfermedad de Wilson.</strong></p>'
),

('DAAT', 'CR', 'PACIENTE',
 'Consentimiento Informado del Paciente — Déficit de Alfa-1 Antitripsina (Costa Rica)',
 'Ley General de Salud N° 5395/1973; Ley 8968/2011 (PRODHAB).',
 '<h2>¿Qué es el Déficit de Alfa-1 Antitripsina?</h2>
<p>El Déficit de Alfa-1 Antitripsina (DAAT) es una enfermedad hereditaria en la que el organismo produce niveles insuficientes de una proteína protectora de los pulmones y el hígado. El diagnóstico temprano permite iniciar medidas de protección.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para cuantificación de Alfa-1 antitripsina.</li>
  <li><strong>Análisis genético (si aplica):</strong> Genotipificación Pi*Z y Pi*S, relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos protegidos bajo la Ley 8968/2011 (PRODHAB).</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Sí. Puede negarse sin consecuencias para su atención médica.</p>
<p><strong>Al firmar, autoriza voluntariamente el diagnóstico de Déficit de Alfa-1 Antitripsina.</strong></p>'
),

('DUCHENNE', 'CR', 'PACIENTE',
 'Consentimiento Informado del Paciente/Representante — Distrofia Muscular de Duchenne (Costa Rica)',
 'Ley General de Salud N° 5395/1973; Ley 8968/2011 (PRODHAB).',
 '<h2>¿Qué es la Distrofia Muscular de Duchenne?</h2>
<p>La Distrofia Muscular de Duchenne (DMD) es una enfermedad hereditaria ligada al cromosoma X. El diagnóstico temprano es fundamental para el manejo adecuado y el acceso a terapias.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para medición de CK sérica.</li>
  <li><strong>Análisis genético (si aplica):</strong> Estudio molecular del gen DMD, relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos tratados conforme a la Ley 8968/2011 (PRODHAB).</li>
</ul>
<h2>¿Es voluntaria la participación?</h2>
<p>Sí. El representante legal puede negarse sin consecuencias para la atención del paciente.</p>
<p><strong>Al firmar, el paciente o su representante autoriza voluntariamente el proceso diagnóstico de Distrofia Muscular de Duchenne.</strong></p>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

-- ============================================================================
-- EL SALVADOR (SV)
-- Marco legal: Código de Salud (Decreto Legislativo N° 955/1988)
--              Ley de Protección de Datos Personales (Decreto 534/2021)
--              Código de Ética Médica del Colegio Médico de El Salvador
-- ============================================================================

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'SV', 'MEDICO',
 'Consentimiento Informado del Médico — Enfermedad de Wilson (El Salvador)',
 'Código de Salud, Decreto Legislativo N° 955/1988; Ley de Protección de Datos Personales, Decreto 534/2021; Código de Ética Médica del Colegio Médico de El Salvador.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos o paraclínicos compatibles con sospecha de <strong>Enfermedad de Wilson</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas clínicamente conforme al Código de Salud salvadoreño.</p>
<ul>
  <li>He informado al paciente sobre la naturaleza de la Enfermedad de Wilson, el proceso diagnóstico y sus implicaciones.</li>
  <li>He explicado que se realizará extracción de muestra sanguínea para ceruloplasmina sérica y, si aplica, cobre en orina 24h.</li>
  <li>Los datos clínicos suministrados son verídicos y provienen del expediente clínico del paciente.</li>
  <li>La información personal será tratada conforme a la Ley de Protección de Datos Personales (Decreto 534/2021).</li>
</ul>'
),

('DAAT', 'SV', 'MEDICO',
 'Consentimiento Informado del Médico — Déficit de Alfa-1 Antitripsina (El Salvador)',
 'Código de Salud (Decreto 955/1988); Ley de Protección de Datos Personales (Decreto 534/2021); Código de Ética Médica del Colegio Médico de El Salvador.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos compatibles con sospecha de <strong>Déficit de Alfa-1 Antitripsina (DAAT)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están clínicamente justificadas.</p>
<ul>
  <li>He informado al paciente sobre el DAAT, su carácter hereditario y las implicaciones del diagnóstico.</li>
  <li>Se tomará muestra de sangre venosa para cuantificación de Alfa-1 antitripsina y, según resultado, genotipificación (Pi*Z, Pi*S).</li>
  <li>Los datos clínicos son fidedignos y provienen del expediente clínico.</li>
  <li>Información confidencial conforme a la Ley de Protección de Datos Personales (Decreto 534/2021).</li>
</ul>'
),

('DUCHENNE', 'SV', 'MEDICO',
 'Consentimiento Informado del Médico — Distrofia Muscular de Duchenne (El Salvador)',
 'Código de Salud (Decreto 955/1988); Ley de Protección de Datos Personales (Decreto 534/2021); Código de Ética Médica del Colegio Médico de El Salvador.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios compatibles con sospecha de <strong>Distrofia Muscular de Duchenne (DMD)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas.</p>
<ul>
  <li>He informado al paciente/representante sobre la naturaleza de la DMD, su carácter X-linked y las implicaciones familiares del diagnóstico.</li>
  <li>Se realizará toma de muestra para CK sérica y, según resultado, estudio molecular del gen DMD (MLPA y/o secuenciación).</li>
  <li>Los datos clínicos provienen del expediente clínico y son verídicos.</li>
  <li>Información confidencial conforme al Decreto 534/2021.</li>
</ul>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'SV', 'PACIENTE',
 'Consentimiento Informado del Paciente — Enfermedad de Wilson (El Salvador)',
 'Código de Salud (Decreto 955/1988); Ley de Protección de Datos Personales (Decreto 534/2021).',
 '<h2>¿Qué es la Enfermedad de Wilson?</h2>
<p>La Enfermedad de Wilson es un trastorno hereditario del metabolismo del cobre. Con diagnóstico y tratamiento oportunos, la mayoría de las personas lleva una vida normal.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Toma de muestra:</strong> Extracción de sangre venosa para ceruloplasmina y, si aplica, orina 24h para cobre urinario.</li>
  <li><strong>Análisis genético (si aplica):</strong> Secuenciación del gen ATP7B, relevante para familiares de primer grado.</li>
  <li><strong>Confidencialidad:</strong> Sus datos se manejan conforme a la Ley de Protección de Datos Personales (Decreto 534/2021).</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Su participación es completamente voluntaria y puede revocarse en cualquier momento sin afectar su atención médica.</p>
<p><strong>Al firmar, declara haber comprendido la información y autoriza voluntariamente el diagnóstico de Enfermedad de Wilson.</strong></p>'
),

('DAAT', 'SV', 'PACIENTE',
 'Consentimiento Informado del Paciente — Déficit de Alfa-1 Antitripsina (El Salvador)',
 'Código de Salud (Decreto 955/1988); Ley de Protección de Datos Personales (Decreto 534/2021).',
 '<h2>¿Qué es el Déficit de Alfa-1 Antitripsina?</h2>
<p>El Déficit de Alfa-1 Antitripsina (DAAT) es una enfermedad hereditaria en la que el organismo produce niveles insuficientes de una proteína protectora de los pulmones y el hígado. El diagnóstico temprano permite iniciar medidas de protección.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para cuantificación de Alfa-1 antitripsina.</li>
  <li><strong>Análisis genético (si aplica):</strong> Genotipificación Pi*Z y Pi*S, relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos protegidos bajo el Decreto 534/2021.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Sí. Puede negarse sin consecuencias para su atención médica.</p>
<p><strong>Al firmar, autoriza voluntariamente el diagnóstico de Déficit de Alfa-1 Antitripsina.</strong></p>'
),

('DUCHENNE', 'SV', 'PACIENTE',
 'Consentimiento Informado del Paciente/Representante — Distrofia Muscular de Duchenne (El Salvador)',
 'Código de Salud (Decreto 955/1988); Ley de Protección de Datos Personales (Decreto 534/2021).',
 '<h2>¿Qué es la Distrofia Muscular de Duchenne?</h2>
<p>La Distrofia Muscular de Duchenne (DMD) es una enfermedad hereditaria ligada al cromosoma X. El diagnóstico temprano es fundamental para el manejo adecuado y el acceso a terapias.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para medición de CK sérica.</li>
  <li><strong>Análisis genético (si aplica):</strong> Estudio molecular del gen DMD, relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos tratados conforme al Decreto 534/2021.</li>
</ul>
<h2>¿Es voluntaria la participación?</h2>
<p>Sí. El representante legal puede negarse sin consecuencias para la atención del paciente.</p>
<p><strong>Al firmar, el paciente o su representante autoriza voluntariamente el proceso diagnóstico de Distrofia Muscular de Duchenne.</strong></p>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

-- ============================================================================
-- REPÚBLICA DOMINICANA (DO)
-- Marco legal: Ley General de Salud 42-01 de 2001
--              Ley 172-13 de 2013 (Protección de Datos Personales)
--              Código de Ética Médica de la República Dominicana
-- ============================================================================

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'DO', 'MEDICO',
 'Consentimiento Informado del Médico — Enfermedad de Wilson (República Dominicana)',
 'Ley General de Salud 42-01/2001, art. 27; Ley de Protección de Datos Personales 172-13/2013; Código de Ética Médica de la República Dominicana.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos o paraclínicos compatibles con sospecha de <strong>Enfermedad de Wilson</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas clínicamente conforme al art. 27 de la Ley 42-01.</p>
<ul>
  <li>He informado al paciente sobre la naturaleza de la Enfermedad de Wilson, el proceso diagnóstico y sus implicaciones.</li>
  <li>He explicado que se realizará extracción de muestra sanguínea para ceruloplasmina sérica y, si aplica, cobre en orina 24h.</li>
  <li>Los datos clínicos suministrados son verídicos y provienen del expediente clínico del paciente.</li>
  <li>La información personal será tratada conforme a la Ley 172-13 de Protección de Datos Personales.</li>
</ul>'
),

('DAAT', 'DO', 'MEDICO',
 'Consentimiento Informado del Médico — Déficit de Alfa-1 Antitripsina (República Dominicana)',
 'Ley General de Salud 42-01/2001; Ley 172-13/2013 (Protección de Datos Personales); Código de Ética Médica RD.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos compatibles con sospecha de <strong>Déficit de Alfa-1 Antitripsina (DAAT)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están clínicamente justificadas.</p>
<ul>
  <li>He informado al paciente sobre el DAAT, su carácter hereditario y las implicaciones del diagnóstico.</li>
  <li>Se tomará muestra de sangre venosa para cuantificación de Alfa-1 antitripsina y, según resultado, genotipificación (Pi*Z, Pi*S).</li>
  <li>Los datos clínicos son fidedignos y provienen del expediente clínico.</li>
  <li>Información confidencial conforme a la Ley 172-13/2013.</li>
</ul>'
),

('DUCHENNE', 'DO', 'MEDICO',
 'Consentimiento Informado del Médico — Distrofia Muscular de Duchenne (República Dominicana)',
 'Ley General de Salud 42-01/2001; Ley 172-13/2013 (Protección de Datos Personales); Código de Ética Médica RD.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios compatibles con sospecha de <strong>Distrofia Muscular de Duchenne (DMD)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas.</p>
<ul>
  <li>He informado al paciente/representante sobre la naturaleza de la DMD, su carácter X-linked y las implicaciones familiares del diagnóstico.</li>
  <li>Se realizará toma de muestra para CK sérica y, según resultado, estudio molecular del gen DMD (MLPA y/o secuenciación).</li>
  <li>Los datos clínicos provienen del expediente clínico y son verídicos.</li>
  <li>Información confidencial conforme a la Ley 172-13/2013.</li>
</ul>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'DO', 'PACIENTE',
 'Consentimiento Informado del Paciente — Enfermedad de Wilson (República Dominicana)',
 'Ley General de Salud 42-01/2001, art. 27; Ley 172-13/2013 (Protección de Datos Personales).',
 '<h2>¿Qué es la Enfermedad de Wilson?</h2>
<p>La Enfermedad de Wilson es un trastorno hereditario del metabolismo del cobre. Con diagnóstico y tratamiento oportunos, la mayoría de las personas lleva una vida normal.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Toma de muestra:</strong> Extracción de sangre venosa para ceruloplasmina y, si aplica, orina 24h para cobre urinario.</li>
  <li><strong>Análisis genético (si aplica):</strong> Secuenciación del gen ATP7B, relevante para familiares de primer grado.</li>
  <li><strong>Confidencialidad:</strong> Sus datos se manejan conforme a la Ley 172-13/2013 de Protección de Datos Personales.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Su participación es completamente voluntaria y puede revocarse en cualquier momento sin afectar su atención médica, conforme al art. 27 de la Ley 42-01.</p>
<p><strong>Al firmar, declara haber comprendido la información y autoriza voluntariamente el diagnóstico de Enfermedad de Wilson.</strong></p>'
),

('DAAT', 'DO', 'PACIENTE',
 'Consentimiento Informado del Paciente — Déficit de Alfa-1 Antitripsina (República Dominicana)',
 'Ley General de Salud 42-01/2001; Ley 172-13/2013 (Protección de Datos Personales).',
 '<h2>¿Qué es el Déficit de Alfa-1 Antitripsina?</h2>
<p>El Déficit de Alfa-1 Antitripsina (DAAT) es una enfermedad hereditaria en la que el organismo produce niveles insuficientes de una proteína protectora de los pulmones y el hígado. El diagnóstico temprano permite iniciar medidas de protección.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para cuantificación de Alfa-1 antitripsina.</li>
  <li><strong>Análisis genético (si aplica):</strong> Genotipificación Pi*Z y Pi*S, relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos protegidos bajo la Ley 172-13/2013.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Sí. Puede negarse sin consecuencias para su atención médica.</p>
<p><strong>Al firmar, autoriza voluntariamente el diagnóstico de Déficit de Alfa-1 Antitripsina.</strong></p>'
),

('DUCHENNE', 'DO', 'PACIENTE',
 'Consentimiento Informado del Paciente/Representante — Distrofia Muscular de Duchenne (República Dominicana)',
 'Ley General de Salud 42-01/2001; Ley 172-13/2013 (Protección de Datos Personales).',
 '<h2>¿Qué es la Distrofia Muscular de Duchenne?</h2>
<p>La Distrofia Muscular de Duchenne (DMD) es una enfermedad hereditaria ligada al cromosoma X. El diagnóstico temprano es fundamental para el manejo adecuado y el acceso a terapias.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para medición de CK sérica.</li>
  <li><strong>Análisis genético (si aplica):</strong> Estudio molecular del gen DMD, relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos tratados conforme a la Ley 172-13/2013.</li>
</ul>
<h2>¿Es voluntaria la participación?</h2>
<p>Sí. El representante legal puede negarse sin consecuencias para la atención del paciente.</p>
<p><strong>Al firmar, el paciente o su representante autoriza voluntariamente el proceso diagnóstico de Distrofia Muscular de Duchenne.</strong></p>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

-- ============================================================================
-- GUATEMALA (GT)
-- Marco legal: Código de Salud (Decreto 90-97)
--              Ley de Acceso a la Información Pública (Decreto 57-2008)
--              Acuerdo Gubernativo 529-2001 (expediente clínico)
--              Código de Ética del Colegio de Médicos y Cirujanos de Guatemala
-- ============================================================================

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'GT', 'MEDICO',
 'Consentimiento Informado del Médico — Enfermedad de Wilson (Guatemala)',
 'Código de Salud (Decreto 90-97), arts. 3, 19; Acuerdo Gubernativo 529-2001 (expediente clínico); Código de Ética del Colegio de Médicos y Cirujanos de Guatemala.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos o paraclínicos compatibles con sospecha de <strong>Enfermedad de Wilson</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas clínicamente, conforme al Código de Salud (Decreto 90-97).</p>
<ul>
  <li>He informado al paciente sobre la naturaleza de la Enfermedad de Wilson, el proceso diagnóstico y sus implicaciones.</li>
  <li>He explicado que se realizará extracción de muestra sanguínea para ceruloplasmina sérica y, si aplica, cobre en orina 24h.</li>
  <li>Los datos clínicos suministrados son verídicos y provienen del expediente clínico del paciente, conforme al A.G. 529-2001.</li>
  <li>La información personal será tratada con estricta confidencialidad conforme a las normativas nacionales vigentes.</li>
</ul>'
),

('DAAT', 'GT', 'MEDICO',
 'Consentimiento Informado del Médico — Déficit de Alfa-1 Antitripsina (Guatemala)',
 'Código de Salud (Decreto 90-97); Acuerdo Gubernativo 529-2001; Código de Ética del Colegio de Médicos y Cirujanos de Guatemala.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios clínicos compatibles con sospecha de <strong>Déficit de Alfa-1 Antitripsina (DAAT)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están clínicamente justificadas.</p>
<ul>
  <li>He informado al paciente sobre el DAAT, su carácter hereditario y las implicaciones del diagnóstico.</li>
  <li>Se tomará muestra de sangre venosa para cuantificación de Alfa-1 antitripsina y, según resultado, genotipificación (Pi*Z, Pi*S).</li>
  <li>Los datos clínicos son fidedignos y provienen del expediente clínico.</li>
  <li>Información confidencial conforme a las normativas nacionales aplicables.</li>
</ul>'
),

('DUCHENNE', 'GT', 'MEDICO',
 'Consentimiento Informado del Médico — Distrofia Muscular de Duchenne (Guatemala)',
 'Código de Salud (Decreto 90-97); Acuerdo Gubernativo 529-2001; Código de Ética del Colegio de Médicos y Cirujanos de Guatemala.',
 '<h2>Consentimiento Informado del Médico</h2>
<p>Yo, el médico tratante, certifico que el paciente referido presenta criterios compatibles con sospecha de <strong>Distrofia Muscular de Duchenne (DMD)</strong> y que las pruebas diagnósticas del programa BTS Integral — DX están indicadas.</p>
<ul>
  <li>He informado al paciente/representante sobre la naturaleza de la DMD, su carácter X-linked y las implicaciones familiares del diagnóstico.</li>
  <li>Se realizará toma de muestra para CK sérica y, según resultado, estudio molecular del gen DMD (MLPA y/o secuenciación).</li>
  <li>Los datos clínicos provienen del expediente clínico y son verídicos.</li>
  <li>Información confidencial conforme a las normativas nacionales vigentes.</li>
</ul>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

INSERT INTO consentimientos (programa_id, pais_codigo, tipo, version, titulo, marco_legal, cuerpo_html, activo, vigente_desde)
SELECT p.id, c.pais_codigo, c.tipo, 1, c.titulo, c.marco_legal, c.cuerpo_html, TRUE, '2026-06-12'
FROM programas p
JOIN tenants t ON t.id = p.tenant_id AND t.slug = 'bts'
CROSS JOIN (VALUES

('WILSON', 'GT', 'PACIENTE',
 'Consentimiento Informado del Paciente — Enfermedad de Wilson (Guatemala)',
 'Código de Salud (Decreto 90-97), arts. 3, 19; Acuerdo Gubernativo 529-2001.',
 '<h2>¿Qué es la Enfermedad de Wilson?</h2>
<p>La Enfermedad de Wilson es un trastorno hereditario del metabolismo del cobre. Con diagnóstico y tratamiento oportunos, la mayoría de las personas lleva una vida normal.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Toma de muestra:</strong> Extracción de sangre venosa para ceruloplasmina y, si aplica, orina 24h para cobre urinario.</li>
  <li><strong>Análisis genético (si aplica):</strong> Secuenciación del gen ATP7B, relevante para familiares de primer grado.</li>
  <li><strong>Confidencialidad:</strong> Sus datos se manejan con estricta confidencialidad conforme al Código de Salud.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Su participación es completamente voluntaria y puede revocarse en cualquier momento sin afectar su atención médica.</p>
<p><strong>Al firmar, declara haber comprendido la información y autoriza voluntariamente el diagnóstico de Enfermedad de Wilson.</strong></p>'
),

('DAAT', 'GT', 'PACIENTE',
 'Consentimiento Informado del Paciente — Déficit de Alfa-1 Antitripsina (Guatemala)',
 'Código de Salud (Decreto 90-97); Acuerdo Gubernativo 529-2001.',
 '<h2>¿Qué es el Déficit de Alfa-1 Antitripsina?</h2>
<p>El Déficit de Alfa-1 Antitripsina (DAAT) es una enfermedad hereditaria en la que el organismo produce niveles insuficientes de una proteína protectora de los pulmones y el hígado. El diagnóstico temprano permite iniciar medidas de protección.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para cuantificación de Alfa-1 antitripsina.</li>
  <li><strong>Análisis genético (si aplica):</strong> Genotipificación Pi*Z y Pi*S, relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos manejados con estricta confidencialidad.</li>
</ul>
<h2>¿Es voluntario?</h2>
<p>Sí. Puede negarse sin consecuencias para su atención médica.</p>
<p><strong>Al firmar, autoriza voluntariamente el diagnóstico de Déficit de Alfa-1 Antitripsina.</strong></p>'
),

('DUCHENNE', 'GT', 'PACIENTE',
 'Consentimiento Informado del Paciente/Representante — Distrofia Muscular de Duchenne (Guatemala)',
 'Código de Salud (Decreto 90-97); Acuerdo Gubernativo 529-2001.',
 '<h2>¿Qué es la Distrofia Muscular de Duchenne?</h2>
<p>La Distrofia Muscular de Duchenne (DMD) es una enfermedad hereditaria ligada al cromosoma X. El diagnóstico temprano es fundamental para el manejo adecuado y el acceso a terapias.</p>
<h2>¿Qué implica participar?</h2>
<ul>
  <li><strong>Muestra de sangre:</strong> Extracción venosa para medición de CK sérica.</li>
  <li><strong>Análisis genético (si aplica):</strong> Estudio molecular del gen DMD, relevante para familiares.</li>
  <li><strong>Confidencialidad:</strong> Datos tratados con estricta confidencialidad conforme al Código de Salud.</li>
</ul>
<h2>¿Es voluntaria la participación?</h2>
<p>Sí. El representante legal puede negarse sin consecuencias para la atención del paciente.</p>
<p><strong>Al firmar, el paciente o su representante autoriza voluntariamente el proceso diagnóstico de Distrofia Muscular de Duchenne.</strong></p>'
)

) AS c(codigo_prog, pais_codigo, tipo, titulo, marco_legal, cuerpo_html)
WHERE p.codigo = c.codigo_prog
ON CONFLICT (programa_id, pais_codigo, tipo, version) DO NOTHING;

-- ============================================================================
-- RESUMEN DE COBERTURA
-- Después de ejecutar seed-bts.sql + este script:
--
-- País | Wilson MÉDICO | Wilson PAC | DAAT MÉDICO | DAAT PAC | DMD MÉDICO | DMD PAC
-- CO   |      ✓        |     ✓      |      ✓      |    ✓     |     ✓      |    ✓
-- EC   |      ✓        |     ✓      |      ✓      |    ✓     |     ✓      |    ✓
-- PA   |      ✓        |     ✓      |      ✓      |    ✓     |     ✓      |    ✓
-- CL   |      ✓        |     ✓      |      ✓      |    ✓     |     ✓      |    ✓
-- CR   |      ✓        |     ✓      |      ✓      |    ✓     |     ✓      |    ✓
-- SV   |      ✓        |     ✓      |      ✓      |    ✓     |     ✓      |    ✓
-- DO   |      ✓        |     ✓      |      ✓      |    ✓     |     ✓      |    ✓
-- GT   |      ✓        |     ✓      |      ✓      |    ✓     |     ✓      |    ✓
--
-- Total: 8 países × 3 programas × 2 tipos = 48 plantillas
-- ============================================================================
