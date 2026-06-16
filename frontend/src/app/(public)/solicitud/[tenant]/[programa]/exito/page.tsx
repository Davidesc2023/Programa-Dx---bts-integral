import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: { tenant: string; programa: string };
  searchParams: { consecutivo?: string; paciente?: string };
}

export default function ExitoPage({ params, searchParams }: Props) {
  const { consecutivo, paciente } = searchParams;
  const { tenant, programa } = params;

  return (
    <div className="bg-white rounded-2xl border border-[#e0e8e5] p-8 text-center shadow-sm">
      <div className="flex justify-center mb-4">
        <CheckCircle size={56} style={{ color: '#1B7A6B' }} strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-bold mb-2" style={{ color: '#191c1d' }}>
        ¡Solicitud enviada!
      </h1>
      <p className="mb-6" style={{ color: '#3e4946' }}>
        La solicitud del paciente{' '}
        <strong>{paciente ?? 'desconocido'}</strong> fue registrada exitosamente.
      </p>

      {consecutivo && (
        <div
          className="inline-block rounded-xl px-6 py-3 mb-6 font-mono text-lg font-bold"
          style={{ background: 'rgba(27,122,107,0.08)', color: '#1B7A6B' }}
        >
          {consecutivo}
        </div>
      )}

      <p className="text-sm mb-8" style={{ color: '#6e7976' }}>
        El equipo de BTS Integral revisará la solicitud y se pondrá en contacto con usted para
        coordinar los siguientes pasos del programa.
      </p>

      <Link
        href={`/solicitud/${tenant}/${programa}`}
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#006053]"
        style={{ background: '#1B7A6B' }}
      >
        Registrar otro paciente
      </Link>
    </div>
  );
}
