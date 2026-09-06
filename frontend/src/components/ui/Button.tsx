import type { ButtonHTMLAttributes } from 'react';

const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-xs',
  outline: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs',
  danger: 'bg-white hover:bg-red-50 text-red-600 border-red-300 shadow-xs',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow-xs',
} as const;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
}

export function Button({ variant = 'outline', className = '', ...rest }: Props) {
  return (
    <button
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none active:scale-[0.98] ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
