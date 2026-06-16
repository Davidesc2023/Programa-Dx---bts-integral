import { notFound } from 'next/navigation';
import { FormularioMedico } from '@/modules/formulario/FormularioMedico';
import type { PublicFormData } from '@/types/dx.types';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000';

interface Props {
  params: { tenant: string; programa: string };
}

export default async function SolicitudPage({ params }: Props) {
  const { tenant, programa } = params;

  const res = await fetch(`${BACKEND}/public/${tenant}/${programa}`, {
    next: { revalidate: 3600 },
  }).catch(() => null);

  if (!res || res.status === 404) notFound();
  if (!res.ok) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: { data: PublicFormData } = await res.json().catch(() => null);
  if (!json?.data) notFound();

  return (
    <FormularioMedico
      formData={json.data}
      tenantSlug={tenant}
      programaSlug={programa}
    />
  );
}
