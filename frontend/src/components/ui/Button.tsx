'use client';

import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[#1B7A6B] text-white hover:bg-[#006053] disabled:opacity-40 focus-visible:ring-[#1B7A6B]/30 shadow-sm',
  secondary:
    'bg-[rgba(27,122,107,0.08)] text-[#1B7A6B] border border-[rgba(27,122,107,0.2)] hover:bg-[rgba(27,122,107,0.14)] disabled:opacity-40 focus-visible:ring-[#1B7A6B]/20',
  danger:
    'bg-[#ba1a1a] text-white hover:bg-[#93000a] disabled:opacity-40 focus-visible:ring-red-400',
  ghost:
    'bg-transparent text-[#3e4946] hover:bg-[#f2f4f4] hover:text-[#191c1d] disabled:opacity-40 focus-visible:ring-[#bec9c5]',
  outline:
    'border border-[#bec9c5] text-[#3e4946] hover:border-[#1B7A6B] hover:text-[#1B7A6B] bg-transparent disabled:opacity-40 focus-visible:ring-[#1B7A6B]/20',
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
