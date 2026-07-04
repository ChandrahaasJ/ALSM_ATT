import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, options, onSelect, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)} className="cursor-pointer">{trigger}</div>
      {open && (
        <div className={`absolute z-50 mt-1 min-w-[160px] bg-gray-850 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1 ${align === 'right' ? 'right-0' : 'left-0'} animate-slide-in-bottom`}>
          {options.map((opt, i) => (
            <React.Fragment key={opt.value}>
              {opt.divider && <div className="my-1 border-t border-gray-800" />}
              <div
                className={`dropdown-item ${opt.danger ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : ''}`}
                onClick={() => { onSelect(opt.value); setOpen(false); }}
              >
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                {opt.label}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}

export function Select({ value, onChange, options, className = '' }: SelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`input appearance-none pr-8 cursor-pointer ${className}`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
