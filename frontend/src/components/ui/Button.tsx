'use client';

import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[#007342] text-white hover:bg-[#005c34] disabled:opacity-40 focus-visible:ring-[#2BFFF8]',
  secondary:
    'bg-[rgba(43,255,248,0.12)] text-[#2BFFF8] border border-[rgba(43,255,248,0.25)] hover:bg-[rgba(43,255,248,0.2)] disabled:opacity-40 focus-visible:ring-[#2BFFF8]',
  danger:
    'bg-red-700 text-white hover:bg-red-800 disabled:opacity-40 focus-visible:ring-red-500',
  ghost:
    'bg-transparent hover:bg-[rgba(176,252,206,0.08)] disabled:opacity-40 focus-visible:ring-[#B0FCCE]'
    + ' text-[rgba(176,252,206,0.7)] hover:text-[#B0FCCE]',
  outline:
    'border border-[rgba(176,252,206,0.2)] hover:border-[#2BFFF8] text-[rgba(176,252,206,0.7)] hover:text-[#2BFFF8] bg-transparent disabled:opacity-40 focus-visible:ring-[#2BFFF8]',
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
