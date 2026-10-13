import { useEffect } from 'react';
import { TAG_STYLES } from '../lib/tags.js';

const STATUS_STYLES = {
  'In Stock': 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  Sold: 'bg-slate-800 text-white ring-slate-800',
  Damaged: 'bg-red-100 text-red-800 ring-red-300',
  Lost: 'bg-amber-100 text-amber-900 ring-amber-300',
};

const STATUS_DOT = {
  'In Stock': 'bg-emerald-500',
  Sold: 'bg-white',
  Damaged: 'bg-red-500',
  Lost: 'bg-amber-500',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${STATUS_STYLES[status]}`}>
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
      {status}
    </span>
  );
}

export function TagBadge({ color, size = 'md' }) {
  const s = TAG_STYLES[color];
  if (!s) return null;
  const pad = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-bold uppercase tracking-wide ${pad} ${s.solid} ${s.text} shadow-sm`}>
      <TagIcon className="h-3.5 w-3.5" />
      {color}
    </span>
  );
}

export function TagSwatch({ color, className = 'h-4 w-4' }) {
  return <span className={`inline-block rounded-full ring-2 ring-white shadow ${className}`} style={{ background: TAG_STYLES[color]?.hex }} />;
}

export function TagIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className} aria-hidden>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" strokeLinejoin="round" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

const BUTTON_VARIANTS = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 shadow-sm',
  secondary: 'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-4 text-lg',
  xl: 'px-6 py-5 text-xl',
};

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    />
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'block w-full rounded-lg border-0 bg-white px-3.5 py-3 text-base text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500';

export function Select({ options, placeholder, ...props }) {
  return (
    <select className={inputClass} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Segmented({ options, value, onChange, size = 'md' }) {
  const pad = size === 'lg' ? 'px-5 py-3 text-base' : 'px-3 py-2 text-sm';
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-200/70 p-1">
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const active = val === value;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`rounded-lg font-semibold transition ${pad} ${active ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Card({ className = '', children }) {
  return <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>{children}</div>;
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[95vh] w-full ${width} overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {onClose && (
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
