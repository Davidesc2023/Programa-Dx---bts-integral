'use client';

import { useDashboard } from '@/modules/dashboard/useDashboard';
import { DashboardHero } from '@/modules/dashboard/DashboardHero';
import { DashboardMetrics } from '@/modules/dashboard/DashboardMetrics';
import { RecentOrders } from '@/modules/dashboard/RecentOrders';
import { OrdersInProgress } from '@/modules/dashboard/OrdersInProgress';

export default function DashboardPage() {
  const {
    totalPatients,
    pendingOrders,
    activeOrders,
    completedOrders,
    recentOrders,
    isLoading,
    isError,
  } = useDashboard();

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-error">
          Error al cargar el dashboard. Verifique la conexión con el servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHero
        pendingOrders={pendingOrders}
        totalPatients={totalPatients}
        isLoading={isLoading}
      />
      <DashboardMetrics
        totalPatients={totalPatients}
        pendingOrders={pendingOrders}
        activeOrders={activeOrders}
        completedOrders={completedOrders}
        isLoading={isLoading}
      />
      <OrdersInProgress />
      <RecentOrders orders={recentOrders} isLoading={isLoading} />
    </div>
  );
}
