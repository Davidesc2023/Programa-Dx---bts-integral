'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ResultForm } from '@/modules/results/ResultForm';
import { useCreateResult } from '@/modules/results/useResults';
import type { ResultInput } from '@/lib/validators';

export default function NewResultPage() {
  const router = useRouter();
  const mutation = useCreateResult();

  function handleSubmit(data: ResultInput) {
    mutation.mutate(
      {
        orderId: data.orderId,
        examType: data.examType,
        value: data.value,
        unit: data.unit || undefined,
        referenceRange: data.referenceRange || undefined,
        notes: data.notes || undefined,
      },
      { onSuccess: () => router.push('/results') },
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/results">
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <FlaskConical className="text-primary-600" size={20} />
          <h1 className="text-lg font-semibold text-gray-900">Nuevo resultado</h1>
        </div>
      </div>
      <Card padding="lg">
        <ResultForm
          onSubmit={handleSubmit}
          loading={mutation.isPending}
          onCancel={() => router.push('/results')}
        />
      </Card>
    </div>
  );
}
