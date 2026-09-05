'use client';

import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder = 'Select…',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const openMenu = () => {
    setHighlight(selectedIndex);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, highlight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
      }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm outline-none transition-shadow hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      >
        <span className={`truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>{selected?.label ?? placeholder}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className="absolute z-20 mt-1.5 max-h-60 w-full min-w-max overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-200/70 focus:outline-none"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : i === highlight
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {o.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
