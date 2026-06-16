'use client';

import { useParams } from 'next/navigation';
import { CasoDetail } from '@/modules/dx/CasoDetail';

export default function DxCasoDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <CasoDetail casoId={id} />;
}
