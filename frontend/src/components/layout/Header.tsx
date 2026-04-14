'use client';

import { usePathname } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';
import { useAuth } from '@/modules/auth/useAuth';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients': 'Pacientes',
  '/orders': 'Órdenes',
  '/consents': 'Consentimientos',
  '/results': 'Resultados',
  '/appointments': 'Citas',
  '/users': 'Usuarios',
};

function getPageTitle(pathname: string): string {
  const exactMatch = PAGE_TITLES[pathname];
  if (exactMatch) return exactMatch;

  const segment = '/' + pathname.split('/')[1];
  return PAGE_TITLES[segment] ?? 'BTS Integral';
}

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Menú"
          >
            <Menu size={18} />
          </button>
        )}
        <h1 className="text-base font-semibold text-gray-800">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:block">
          {user?.email}
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded transition-colors"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
