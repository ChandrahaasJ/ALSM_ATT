import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let addToastFn: ((message: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = 'success') {
  addToastFn?.(message, type);
}

const icons = {
  success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  error: <AlertCircle size={16} className="text-red-400 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
};

const colors = {
  success: 'border-emerald-500/30 bg-gray-900',
  error: 'border-red-500/30 bg-gray-900',
  warning: 'border-amber-500/30 bg-gray-900',
  info: 'border-blue-500/30 bg-gray-900',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    addToastFn = (message, type = 'success') => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => remove(id), 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  const remove = (id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl min-w-[280px] max-w-sm pointer-events-auto animate-slide-in-bottom ${colors[t.type]}`}
        >
          {icons[t.type]}
          <span className="text-sm text-gray-200 flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
