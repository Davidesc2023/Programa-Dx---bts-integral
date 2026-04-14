'use client';

import { OrderDetail } from '@/modules/orders/OrderDetail';

interface Props {
  params: { id: string };
}

export default function OrderDetailPage({ params }: Props) {
  const { id } = params;
  return <OrderDetail orderId={id} />;
}
