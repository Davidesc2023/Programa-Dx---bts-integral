import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'teal'
  | 'orange';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-[#eceeee] text-[#3e4946]',
  success: 'bg-[rgba(27,122,107,0.10)] text-[#006053]',
  warning: 'bg-[rgba(208,166,0,0.12)] text-[#584400]',
  danger:  'bg-[rgba(186,26,26,0.10)] text-[#ba1a1a]',
  info:    'bg-[rgba(0,97,163,0.10)] text-[#0061a3]',
  purple:  'bg-purple-100 text-purple-700',
  teal:    'bg-[rgba(27,122,107,0.08)] text-[#1B7A6B]',
  orange:  'bg-orange-100 text-orange-700',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
