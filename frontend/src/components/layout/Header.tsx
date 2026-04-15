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
    <header
      className="flex items-center justify-between h-14 px-6 shrink-0 border-b"
      style={{ background: '#0A1410', borderColor: 'rgba(176,252,206,0.08)' }}
    >
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-1.5 rounded transition-colors lg:hidden"
            style={{ color: 'rgba(176,252,206,0.5)' }}
            aria-label="Menú"
          >
            <Menu size={18} />
          </button>
        )}
        <h1 className="text-base font-semibold" style={{ color: '#B0FCCE' }}>
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm hidden sm:block" style={{ color: 'rgba(176,252,206,0.5)' }}>
          {user?.email}
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded transition-colors"
          style={{ color: 'rgba(176,252,206,0.5)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(176,252,206,0.5)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
