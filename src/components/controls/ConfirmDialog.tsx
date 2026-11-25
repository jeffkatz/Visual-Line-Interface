import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded border border-[#48525E] bg-[#1D2126] p-5 shadow-2xl"
      >
        <h2 id="confirm-dialog-title" className="text-[16px] font-semibold text-[#F1F3F5]">{title}</h2>
        <p id="confirm-dialog-description" className="mt-2 text-[13px] leading-relaxed text-[#929BA5]">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded border border-[#343B43] px-3.5 py-2 text-[12px] text-[#F1F3F5] hover:bg-[#252A30]">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded px-3.5 py-2 text-[12px] font-semibold ${
              destructive ? 'bg-[#A64F4A] text-white hover:bg-[#BC5D56]' : 'bg-[#C7A46A] text-[#101214] hover:bg-[#D2B27C]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};
