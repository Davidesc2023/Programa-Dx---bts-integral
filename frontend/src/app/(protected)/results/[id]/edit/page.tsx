'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ResultForm } from '@/modules/results/ResultForm';
import { useResult, useUpdateResult } from '@/modules/results/useResults';
import type { ResultInput } from '@/lib/validators';

export default function EditResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: result, isLoading } = useResult(id);
  const mutation = useUpdateResult(id);

  function handleSubmit(data: ResultInput) {
    mutation.mutate(
      {
        examType: data.examType,
        value: data.value,
        unit: data.unit || undefined,
        referenceRange: data.referenceRange || undefined,
        notes: data.notes || undefined,
      },
      { onSuccess: () => router.push(`/results/${id}`) },
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/results/${id}`}>
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Editar resultado</h1>
      </div>
      <Card padding="lg">
        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : result ? (
          <ResultForm
            isEdit
            defaultValues={{
              orderId: result.orderId,
              examType: result.examType,
              value: result.value,
              unit: result.unit ?? '',
              referenceRange: result.referenceRange ?? '',
              notes: result.notes ?? '',
            }}
            onSubmit={handleSubmit}
            loading={mutation.isPending}
            onCancel={() => router.push(`/results/${id}`)}
          />
        ) : (
          <p className="text-sm text-red-500">No se encontró el resultado.</p>
        )}
      </Card>
    </div>
  );
}
