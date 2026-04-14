'use client';

import { use } from 'react';
import { OrderDetail } from '@/modules/orders/OrderDetail';

interface Props {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: Props) {
  const { id } = use(params);
  return <OrderDetail orderId={id} />;
}
