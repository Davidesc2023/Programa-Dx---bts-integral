'use client';

import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 disabled:bg-primary-300 focus-visible:ring-primary-400',
  secondary:
    'bg-secondary-400 text-white hover:bg-secondary-500 disabled:bg-secondary-200 focus-visible:ring-secondary-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 focus-visible:ring-red-400',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400 focus-visible:ring-gray-300',
  outline:
    'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400 focus-visible:ring-gray-300',
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
