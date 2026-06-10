import { useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

type ConfirmTone = "danger" | "warning" | "primary";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const toneClasses: Record<ConfirmTone, { icon: string; button: string }> = {
  danger: {
    icon: "bg-rose-50 text-rose-600",
    button: "bg-rose-600 text-white hover:bg-rose-700",
  },
  warning: {
    icon: "bg-amber-50 text-amber-600",
    button: "bg-amber-600 text-white hover:bg-amber-700",
  },
  primary: {
    icon: "bg-brand-primary/10 text-brand-primary",
    button: "bg-brand-primary text-white hover:bg-brand-secondary",
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) {
    return null;
  }

  const classes = toneClasses[tone];

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-brand-primary">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={16} />
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${classes.button}`}
          >
            <Check size={16} />
            {isSubmitting ? "Traitement..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
