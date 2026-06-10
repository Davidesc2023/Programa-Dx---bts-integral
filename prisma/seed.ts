import { PrismaClient, UserRole, LabTestType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Catálogo de exámenes clínicos ────────────────────────────────────────────

const LAB_TESTS: Array<{
  code: string;
  name: string;
  type: LabTestType;
  category: string;
  description: string;
  instructions?: string;
  estimatedHours: number;
  requiresCode?: string; // código del prerrequisito
}> = [
  // ── Proteínas Plasmáticas ──────────────────────────────────────────────────
  {
    code: 'A1A-S',
    name: 'Alfa-1 Antitripsina Sérica',
    type: 'NIVEL_SERICO',
    category: 'Proteínas Plasmáticas',
    description: 'Medición del nivel sérico de Alfa-1 Antitripsina',
    instructions: 'Ayuno de 4 horas previo a la toma',
    estimatedHours: 24,
  },
  {
    code: 'A1A-G',
    name: 'Alfa-1 Antitripsina Genética',
    type: 'GENETICO',
    category: 'Proteínas Plasmáticas',
    description: 'Genotipificación de variantes PI*S y PI*Z del gen SERPINA1',
    instructions: 'No requiere ayuno. Se requiere resultado sérico previo.',
    estimatedHours: 72,
    requiresCode: 'A1A-S', // prerrequisito
  },
  {
    code: 'SRP1',
    name: 'Serpina 1',
    type: 'NIVEL_SERICO',
    category: 'Proteínas Plasmáticas',
    description: 'Inhibidor de proteasa — marcador inflamatorio',
    estimatedHours: 24,
  },

  // ── Lípidos y Metabolismo ─────────────────────────────────────────────────
  {
    code: 'LIPID',
    name: 'Perfil Lipídico Completo',
    type: 'PANEL',
    category: 'Lípidos y Metabolismo',
    description: 'Colesterol total, HDL, LDL, triglicéridos',
    instructions: 'Requiere 12 horas de ayuno',
    estimatedHours: 24,
  },
  {
    code: 'HBA1C',
    name: 'Hemoglobina Glicosilada (HbA1c)',
    type: 'NIVEL_SERICO',
    category: 'Lípidos y Metabolismo',
    description: 'Promedio de glucosa en sangre de los últimos 3 meses',
    instructions: 'No requiere ayuno',
    estimatedHours: 24,
  },
  {
    code: 'GLUC',
    name: 'Glucemia en Ayunas',
    type: 'NIVEL_SERICO',
    category: 'Lípidos y Metabolismo',
    description: 'Nivel de glucosa en sangre en ayunas',
    instructions: 'Requiere 8 horas de ayuno mínimo',
    estimatedHours: 12,
  },

  // ── Función Renal ─────────────────────────────────────────────────────────
  {
    code: 'CREAT',
    name: 'Creatinina en Suero',
    type: 'NIVEL_SERICO',
    category: 'Función Renal',
    description: 'Marcador de función renal — filtrado glomerular',
    estimatedHours: 12,
  },
  {
    code: 'UREA',
    name: 'Urea en Sangre (BUN)',
    type: 'NIVEL_SERICO',
    category: 'Función Renal',
    description: 'Nitrógeno ureico en sangre',
    estimatedHours: 12,
  },
  {
    code: 'URINC',
    name: 'Análisis de Orina Completo',
    type: 'OTRO',
    category: 'Función Renal',
    description: 'Uroanálisis físico, químico y microscópico',
    instructions: 'Recoger primera orina de la mañana en frasco estéril',
    estimatedHours: 8,
  },

  // ── Tiroides ──────────────────────────────────────────────────────────────
  {
    code: 'TSH',
    name: 'TSH Ultra Sensible',
    type: 'NIVEL_SERICO',
    category: 'Tiroides',
    description: 'Hormona estimulante de la tiroides — función tiroidea',
    instructions: 'No requiere ayuno',
    estimatedHours: 24,
  },
  {
    code: 'T4L',
    name: 'T4 Libre',
    type: 'NIVEL_SERICO',
    category: 'Tiroides',
    description: 'Tiroxina libre — complemento de TSH',
    estimatedHours: 24,
  },

  // ── Hemostasia ────────────────────────────────────────────────────────────
  {
    code: 'COAG',
    name: 'Perfil de Coagulación',
    type: 'PANEL',
    category: 'Hemostasia',
    description: 'PT, PTT, INR — evaluación de coagulación',
    estimatedHours: 12,
  },
  {
    code: 'HEMO',
    name: 'Hemograma Completo',
    type: 'PANEL',
    category: 'Hemostasia',
    description: 'Conteo de células sanguíneas, hemoglobina, hematocrito',
    estimatedHours: 8,
  },

  // ── Genética Especializada ────────────────────────────────────────────────
  {
    code: 'BRCA',
    name: 'BRCA1/BRCA2 (Panel Genético)',
    type: 'GENETICO',
    category: 'Genética Especializada',
    description: 'Detección de variantes en genes de susceptibilidad a cáncer',
    instructions: 'No requiere ayuno. Requiere consentimiento informado firmado.',
    estimatedHours: 168,
  },
  {
    code: 'CFTR',
    name: 'Panel CFTR (Fibrosis Quística)',
    type: 'GENETICO',
    category: 'Genética Especializada',
    description: 'Análisis del gen CFTR para diagnóstico de fibrosis quística',
    estimatedHours: 120,
  },
];

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  // Admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@lab.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Usuario admin ya existe: ${adminEmail}`);
  } else {
    const hashed = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: { email: adminEmail, password: hashed, role: UserRole.ADMIN },
    });
    console.log(`✅ Usuario admin creado: ${admin.email}`);
  }

  // Lab test catalog — upsert por code
  console.log('\n📋 Sincronizando catálogo de exámenes...');

  // Primera pasada: crear los que NO tienen prerrequisito
  const withoutPrereq = LAB_TESTS.filter((t) => !t.requiresCode);
  for (const t of withoutPrereq) {
    await prisma.labTest.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        type: t.type,
        category: t.category,
        description: t.description,
        instructions: t.instructions ?? null,
        estimatedHours: t.estimatedHours,
      },
      create: {
        code: t.code,
        name: t.name,
        type: t.type,
        category: t.category,
        description: t.description,
        instructions: t.instructions ?? null,
        estimatedHours: t.estimatedHours,
      },
    });
    console.log(`  ✓ ${t.code} — ${t.name}`);
  }

  // Segunda pasada: crear los que SÍ tienen prerrequisito (FK ya existe)
  const withPrereq = LAB_TESTS.filter((t) => t.requiresCode);
  for (const t of withPrereq) {
    const prereq = await prisma.labTest.findUnique({ where: { code: t.requiresCode! } });
    if (!prereq) {
      console.warn(`  ⚠ Prerrequisito "${t.requiresCode}" no encontrado para "${t.code}" — omitiendo`);
      continue;
    }

    await prisma.labTest.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        type: t.type,
        category: t.category,
        description: t.description,
        instructions: t.instructions ?? null,
        estimatedHours: t.estimatedHours,
        requiresResultFromId: prereq.id,
      },
      create: {
        code: t.code,
        name: t.name,
        type: t.type,
        category: t.category,
        description: t.description,
        instructions: t.instructions ?? null,
        estimatedHours: t.estimatedHours,
        requiresResultFromId: prereq.id,
      },
    });
    console.log(`  ✓ ${t.code} — ${t.name} (requiere: ${t.requiresCode})`);
  }

  console.log('\n✅ Seed completado.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
