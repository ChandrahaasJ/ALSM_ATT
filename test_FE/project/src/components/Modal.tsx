import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl animate-slide-in-bottom flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
        </>
      }
    >
      <p className="text-sm text-gray-400">{message}</p>
    </Modal>
  );
}
