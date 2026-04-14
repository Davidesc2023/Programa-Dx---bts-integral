'use client';

import { useDashboard } from '@/modules/dashboard/useDashboard';
import { DashboardMetrics } from '@/modules/dashboard/DashboardMetrics';
import { RecentOrders } from '@/modules/dashboard/RecentOrders';

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
        <p className="text-sm text-red-500">
          Error al cargar el dashboard. Verifique la conexión con el servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardMetrics
        totalPatients={totalPatients}
        pendingOrders={pendingOrders}
        activeOrders={activeOrders}
        completedOrders={completedOrders}
        isLoading={isLoading}
      />
      <RecentOrders orders={recentOrders} isLoading={isLoading} />
    </div>
  );
}
