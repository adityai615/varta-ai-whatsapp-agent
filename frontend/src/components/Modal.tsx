import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal(props: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={props.onClose} />

      <div className="relative w-full max-w-2xl animate-fadeIn rounded-card border border-whatsapp-border bg-white shadow-card">
        <div className="flex items-start justify-between gap-3 border-b border-whatsapp-border px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-whatsapp-text">{props.title}</div>
            {props.subtitle && <div className="mt-0.5 text-xs text-whatsapp-muted">{props.subtitle}</div>}
          </div>
          <button
            onClick={props.onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-whatsapp-border bg-white text-whatsapp-muted hover:bg-whatsapp-green/5 hover:text-whatsapp-text"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">{props.children}</div>

        {props.footer && <div className="border-t border-whatsapp-border px-5 py-4">{props.footer}</div>}
      </div>
    </div>
  );
}

