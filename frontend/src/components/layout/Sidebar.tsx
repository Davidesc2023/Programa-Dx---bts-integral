'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ScrollText,
  Upload,
  UserCog,
  LogOut,
  Link2,
  Copy,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/modules/auth/authStore';
import { useAuth } from '@/modules/auth/useAuth';
import { UserRole, ROLE_LABELS } from '@/types/enums';

// ─── Links públicos por programa ─────────────────────────────────────────────

const TENANT = 'bts-integral';

const LINKS_PUBLICOS = [
  { label: 'Wilson',    slug: 'wilson',   color: '#1B7A6B' },
  { label: 'DAAT',     slug: 'alfa1',    color: '#2563eb' },
  { label: 'Duchenne', slug: 'duchenne', color: '#7c3aed' },
];

function getPublicUrl(slug: string) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://programa-dx-bts-integral.vercel.app';
  return `${base}/solicitud/${TENANT}/${slug}`;
}

function CopyLinkRow({ label, slug, color }: { label: string; slug: string; color: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = getPublicUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(`Link de ${label} copiado`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl group hover:bg-[#f4f6f5] transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-xs font-medium truncate" style={{ color: '#3e4946' }}>{label}</span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        title={`Copiar link ${label}`}
        className="p-1.5 rounded-lg transition-colors shrink-0"
        style={{ color: '#9eaaa7' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = color)}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#9eaaa7')}
      >
        {copied ? <Check size={13} style={{ color }} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const [linksOpen, setLinksOpen] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isOperador = user?.role === UserRole.OPERADOR;
  const canAccess = isAdmin || isOperador;

  const initial = user?.email?.charAt(0).toUpperCase() ?? '?';
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : '';

  type NavItem = { label: string; href: string; icon: React.ElementType; desc: string };

  const DX_ITEMS: NavItem[] = [
    {
      label: 'Panel DX',
      href:  '/dx/dashboard',
      icon:  LayoutDashboard,
      desc:  'Analytics e indicadores del programa',
    },
    {
      label: 'Casos DX',
      href:  '/dx/casos',
      icon:  ScrollText,
      desc:  'Lista y gestión de casos activos',
    },
    ...(isAdmin ? [{
      label: 'Importar casos',
      href:  '/dx/importar',
      icon:  Upload,
      desc:  'Carga masiva desde Excel/CSV',
    }] : []),
  ];

  const SYS_ITEMS: NavItem[] = [
    ...(isAdmin ? [{
      label: 'Usuarios',
      href:  '/users',
      icon:  UserCog,
      desc:  'Gestionar administradores y operadores',
    }] : []),
  ];

  function NavLink({ item }: { item: NavItem }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
        )}
        style={
          isActive
            ? { background: 'rgba(27,122,107,0.10)', color: '#1B7A6B' }
            : { color: '#3e4946' }
        }
      >
        <Icon
          size={18}
          className="shrink-0"
          style={{ color: isActive ? '#1B7A6B' : '#6e7976' }}
        />
        <div className="flex-1 min-w-0">
          <span className="block leading-tight">{item.label}</span>
          <span
            className="block text-[10px] font-normal leading-tight mt-0.5 truncate"
            style={{ color: isActive ? 'rgba(27,122,107,0.7)' : '#9eaaa7' }}
          >
            {item.desc}
          </span>
        </div>
        {isActive && (
          <ChevronRight size={14} style={{ color: '#1B7A6B', opacity: 0.6 }} />
        )}
      </Link>
    );
  }

  return (
    <aside
      className="flex flex-col shrink-0 h-screen border-r"
      style={{
        width: 272,
        fontFamily: 'Manrope, sans-serif',
        background: '#ffffff',
        borderColor: '#e0e8e5',
        boxShadow: '4px 0 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: '#e0e8e5' }}>
        <Link href="/dx/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div
            className="relative flex items-center justify-center rounded-2xl shrink-0"
            style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #005c4e 0%, #1B7A6B 100%)',
              boxShadow: '0 4px 14px rgba(27,122,107,0.35)',
            }}
          >
            <Image src="/logo.png" alt="BTS Integral" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <p className="font-black text-base leading-tight" style={{ color: '#101c19' }}>
              BTS Integral
            </p>
            <p className="text-[11px] font-semibold" style={{ color: '#6e7976' }}>
              Programa DX · Diagnóstico
            </p>
          </div>
        </Link>

        {/* Close button — only visible on mobile (when rendered as drawer) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg"
            style={{ color: '#9eaaa7' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* Módulo DX */}
        {canAccess && (
          <>
            <div className="px-3 pb-1 pt-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#9eaaa7' }}
              >
                Programa DX
              </span>
            </div>
            {DX_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}

        {/* Sistema */}
        {SYS_ITEMS.length > 0 && (
          <>
            <div className="px-3 pb-1 pt-4">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#9eaaa7' }}
              >
                Sistema
              </span>
            </div>
            {SYS_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}

        {/* Links públicos para médicos */}
        {canAccess && (
          <div className="pt-4">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors hover:bg-[#f4f6f5]"
              onClick={() => setLinksOpen((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Link2 size={15} style={{ color: '#9eaaa7' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9eaaa7' }}>
                  Links para médicos
                </span>
              </div>
              <ChevronRight
                size={13}
                className="transition-transform duration-150"
                style={{ color: '#9eaaa7', transform: linksOpen ? 'rotate(90deg)' : 'none' }}
              />
            </button>
            {linksOpen && (
              <div className="mt-1 space-y-0.5">
                {LINKS_PUBLICOS.map((l) => (
                  <CopyLinkRow key={l.slug} {...l} />
                ))}
                <p className="px-3 pt-1 text-[10px]" style={{ color: '#b0bab7' }}>
                  Comparte este link con el médico para que pueda solicitar tamizajes sin crear cuenta.
                </p>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── User footer ── */}
      <div className="border-t px-4 py-4" style={{ borderColor: '#e0e8e5' }}>
        <div className="flex items-center gap-3 px-1 py-1">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0"
            style={{ background: 'rgba(27,122,107,0.12)', color: '#1B7A6B' }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#191c1d' }}>
              {user?.email ?? '—'}
            </p>
            <p className="text-[11px]" style={{ color: '#6e7976' }}>{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#9eaaa7' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ba1a1a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9eaaa7')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
