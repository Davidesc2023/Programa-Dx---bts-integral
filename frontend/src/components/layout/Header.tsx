'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/modules/auth/authStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Panel de Control',
  '/patients':     'Pacientes',
  '/orders':       'Órdenes Médicas',
  '/consents':     'Consentimientos',
  '/results':      'Resultados',
  '/appointments': 'Citas',
  '/users':        'Usuarios',
};

function getPageTitle(pathname: string): string {
  const exactMatch = PAGE_TITLES[pathname];
  if (exactMatch) return exactMatch;
  const segment = '/' + pathname.split('/')[1];
  return PAGE_TITLES[segment] ?? 'BTS Integral';
}

export function Header() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const initial = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between w-full px-4 py-3 sm:px-6 sm:py-4 lg:px-8 shrink-0 border-b"
      style={{
        background: 'rgba(248,250,250,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: '#e6e8e9',
        boxShadow: '0px 4px 20px rgba(25,28,29,0.04)',
      }}
    >
      {/* Mobile: avatar + brand | Desktop: page title */}
      <div className="flex items-center gap-3">
        {/* Avatar — visible on mobile only */}
        <div
          className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white"
          style={{ background: 'rgba(27,122,107,0.15)', color: '#1B7A6B' }}
        >
          {initial}
        </div>

        {/* Brand on mobile / Page title on desktop */}
        <span
          className="font-extrabold tracking-tight lg:hidden text-xl"
          style={{ fontFamily: 'Manrope, sans-serif', color: '#1B7A6B' }}
        >
          BTS Integral
        </span>
        <span
          className="hidden lg:block font-semibold tracking-tight text-xl"
          style={{ fontFamily: 'Manrope, sans-serif', color: '#191c1d' }}
        >
          {getPageTitle(pathname)}
        </span>
      </div>

      {/* Right — notifications + desktop user info */}
      <div className="flex items-center gap-3 lg:gap-5">
        {/* Bell */}
        <button
          className="p-2 rounded-full transition-colors hover:bg-teal-50 material-symbols-outlined text-slate-500"
          style={{ color: '#3e4946', fontSize: '1.25rem' }}
          aria-label="Notificaciones"
        >
          notifications
        </button>

        {/* Desktop: divider + user info */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="h-6 w-px" style={{ background: '#e6e8e9' }} />
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-tight" style={{ color: '#191c1d', fontFamily: 'Manrope, sans-serif' }}>
              {user?.email ?? '—'}
            </p>
            <p className="text-xs" style={{ color: '#6e7976' }}>Portal Clínico</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white"
            style={{ background: 'rgba(27,122,107,0.15)', color: '#1B7A6B' }}
          >
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
