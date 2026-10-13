import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-3.5 mb-6">
        <div
          className={`p-2.5 rounded-xl border ${
            variant === 'danger'
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-[#596D5F] leading-relaxed pt-1">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DFE7DD]">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-[#596D5F] hover:bg-[#FEFAF3] hover:text-[#26352B] border border-[#DFE7DD] transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs ${
            variant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-[#84A282] hover:bg-[#698767] text-white'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
