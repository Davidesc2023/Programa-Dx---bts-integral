'use client';

import { use } from 'react';
import { ResultDetail } from '@/modules/results/ResultDetail';

export default function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ResultDetail resultId={id} />;
}
