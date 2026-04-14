'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { OrderForm } from '@/modules/orders/OrderForm';
import { useCreateOrder } from '@/modules/orders/useOrders';
import type { OrderFormValues } from '@/lib/validators';

export default function NewOrderPage() {
  const router = useRouter();
  const mutation = useCreateOrder((id) => router.push(`/orders/${id}`));

  return (
    <div className="max-w-2xl mx-auto">
      <Card padding="lg">
        <CardHeader
          title="Nueva orden"
          description="Ingresa los datos de la solicitud de laboratorio"
        />
        <div className="mt-6">
          <OrderForm
            onSubmit={(values: OrderFormValues) => mutation.mutate(values)}
            isLoading={mutation.isPending}
            onCancel={() => router.push('/orders')}
          />
        </div>
      </Card>
    </div>
  );
}
