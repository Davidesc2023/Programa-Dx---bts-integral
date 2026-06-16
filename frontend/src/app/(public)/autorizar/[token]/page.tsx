import { AlertCircle, Clock, ShieldOff, CheckCircle2 } from 'lucide-react';
import type { AutorizacionData } from '@/types/dx.types';
import { PacienteAutorizacion } from '@/modules/autorizacion/PacienteAutorizacion';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000';

interface Props {
  params: { token: string };
}

interface ErrorCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function ErrorCard({ icon, title, desc }: ErrorCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e0e8e5] p-8 text-center shadow-sm">
      <div className="flex justify-center mb-4">{icon}</div>
      <h1 className="text-xl font-bold mb-2" style={{ color: '#191c1d' }}>{title}</h1>
      <p className="text-sm" style={{ color: '#6e7976' }}>{desc}</p>
    </div>
  );
}

export default async function AutorizarPage({ params }: Props) {
  const { token } = params;

  const res = await fetch(`${BACKEND}/autorizar/${token}`, {
    cache: 'no-store',
  }).catch(() => null);

  if (!res) {
    return (
      <ErrorCard
        icon={<AlertCircle size={48} style={{ color: '#ba1a1a' }} strokeWidth={1.5} />}
        title="Error de conexión"
        desc="No fue posible contactar el servidor. Por favor intente de nuevo en unos minutos."
      />
    );
  }

  if (res.status === 404) {
    return (
      <ErrorCard
        icon={<ShieldOff size={48} style={{ color: '#ba1a1a' }} strokeWidth={1.5} />}
        title="Enlace no válido"
        desc="Este enlace de autorización no existe o no es válido. Verifique que copió el enlace completo."
      />
    );
  }

  if (res.status === 410) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    const msg  = body.error ?? 'Este enlace ya no está disponible.';
    const esExpirado   = msg.includes('expirado');
    const esRevocado   = msg.includes('revocado');

    return (
      <ErrorCard
        icon={
          esExpirado
            ? <Clock size={48} style={{ color: '#d97706' }} strokeWidth={1.5} />
            : esRevocado
              ? <ShieldOff size={48} style={{ color: '#ba1a1a' }} strokeWidth={1.5} />
              : <CheckCircle2 size={48} style={{ color: '#1B7A6B' }} strokeWidth={1.5} />
        }
        title={
          esExpirado  ? 'Enlace expirado'
          : esRevocado ? 'Enlace revocado'
          : 'Enlace ya utilizado'
        }
        desc={msg}
      />
    );
  }

  if (!res.ok) {
    return (
      <ErrorCard
        icon={<AlertCircle size={48} style={{ color: '#ba1a1a' }} strokeWidth={1.5} />}
        title="Error inesperado"
        desc="Ocurrió un error al procesar su solicitud. Por favor contáctenos."
      />
    );
  }

  const json = await res.json().catch(() => null) as { data: AutorizacionData } | null;
  if (!json?.data) {
    return (
      <ErrorCard
        icon={<AlertCircle size={48} style={{ color: '#ba1a1a' }} strokeWidth={1.5} />}
        title="Datos no disponibles"
        desc="No fue posible cargar la información del caso. Por favor intente de nuevo."
      />
    );
  }

  return <PacienteAutorizacion data={json.data} token={token} />;
}
