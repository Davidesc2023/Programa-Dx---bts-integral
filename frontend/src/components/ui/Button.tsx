'use client';

import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-40 focus-visible:ring-[#4ade80]',
  secondary:
    'bg-[rgba(74,222,128,0.1)] text-[#4ade80] border border-[rgba(74,222,128,0.2)] hover:bg-[rgba(74,222,128,0.18)] disabled:opacity-40 focus-visible:ring-[#4ade80]',
  danger:
    'bg-red-700 text-white hover:bg-red-800 disabled:opacity-40 focus-visible:ring-red-500',
  ghost:
    'bg-transparent text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#e2e8f0] disabled:opacity-40 focus-visible:ring-[rgba(255,255,255,0.3)]',
  outline:
    'border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.6)] hover:border-[rgba(255,255,255,0.25)] hover:text-[#e2e8f0] bg-transparent disabled:opacity-40 focus-visible:ring-[rgba(255,255,255,0.3)]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" aria-hidden />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
