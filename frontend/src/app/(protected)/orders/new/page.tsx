'use client';

import { useRouter } from 'next/navigation';
import { OrderForm } from '@/modules/orders/OrderForm';
import { useCreateOrder, type CreateOrderPayload } from '@/modules/orders/useOrders';

export default function NewOrderPage() {
  const router = useRouter();
  const mutation = useCreateOrder((id) => router.push(`/orders/${id}`));

  return (
    <div className="h-full">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-black text-on-surface tracking-tight"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          Nueva Orden Médica
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Complete los datos del paciente y seleccione los exámenes requeridos para generar la orden clínica.
        </p>
      </div>

      <OrderForm
        onSubmit={(values) =>
          mutation.mutate(values as CreateOrderPayload)
        }
        isLoading={mutation.isPending}
        onCancel={() => router.push('/orders')}
      />
    </div>
  );
}
