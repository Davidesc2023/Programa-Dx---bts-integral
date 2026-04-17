'use client';

import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: '#3e4946', fontFamily: 'Inter, sans-serif' }}
          >
            {label}
            {props.required && <span className="ml-1" style={{ color: '#ba1a1a' }}>*</span>}
          </label>
        )}

        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150',
            'focus:outline-none focus:ring-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'focus:ring-[rgba(186,26,26,0.25)] focus:border-[#ba1a1a]'
              : 'focus:ring-[rgba(27,122,107,0.20)] focus:border-[#1B7A6B]',
            className,
          )}
          style={{
            background: '#f2f4f4',
            border: `1px solid ${error ? '#ba1a1a' : '#bec9c5'}`,
            color: '#191c1d',
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs" style={{ color: '#ba1a1a' }}>
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs" style={{ color: '#6e7976' }}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
