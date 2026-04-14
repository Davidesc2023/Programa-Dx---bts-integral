'use client';

import { ResultDetail } from '@/modules/results/ResultDetail';

export default function ResultDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return <ResultDetail resultId={id} />;
}
