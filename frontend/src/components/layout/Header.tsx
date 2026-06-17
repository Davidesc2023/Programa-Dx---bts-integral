'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';
import { NotificationBell } from '@/components/ui/NotificationBell';

const PAGE_TITLES: Record<string, string> = {
  '/dx/dashboard':  'Panel DX — Analytics',
  '/dx/casos':      'Casos DX',
  '/dx/importar':   'Importar casos',
  '/users':         'Usuarios del sistema',
  '/dashboard':     'Panel de Control',
  '/patients':      'Pacientes',
  '/orders':        'Órdenes Médicas',
  '/consents':      'Consentimientos',
  '/results':       'Resultados',
  '/appointments':  'Citas',
};

function getPageTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;
  // Match prefix (e.g. /dx/casos/[id])
  const match = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k + '/'));
  return match ? match[1] : 'BTS Integral';
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const initial = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 shrink-0 border-b"
      style={{
        height: 60,
        background: '#ffffff',
        borderColor: '#dde8e5',
        boxShadow: '0 1px 0 #dde8e5',
      }}
    >
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl transition-colors"
          style={{ color: '#6e7976' }}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <div>
          <span
            className="font-bold text-base"
            style={{ fontFamily: 'Manrope, sans-serif', color: '#101c19' }}
          >
            {getPageTitle(pathname)}
          </span>
        </div>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2">
        <NotificationBell theme="light" />

        <div className="h-5 w-px mx-1 hidden sm:block" style={{ background: '#e0e8e5' }} />

        <div
          className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0"
          style={{ background: 'rgba(49,99,88,0.14)', color: '#316358' }}
          title={user?.email ?? ''}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
