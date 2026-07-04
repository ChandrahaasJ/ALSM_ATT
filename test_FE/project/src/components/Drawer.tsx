import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  footer?: React.ReactNode;
}

export function Drawer({ open, onClose, title, children, width = 'w-[480px]', footer }: DrawerProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[90] flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className={`relative ${width} max-w-full bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col animate-slide-in-right`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 shrink-0">{footer}</div>}
          </div>
        </div>
      )}
    </>
  );
}
