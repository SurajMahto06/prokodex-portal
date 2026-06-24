import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2 bg-red-500/10 rounded-full flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
            </div>
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-zinc-400 text-sm mb-6 pl-12">{description}</p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
            <Button 
              variant="danger"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
