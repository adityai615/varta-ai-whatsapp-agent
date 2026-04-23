import type { ReactNode } from "react";

export function PageHeader(props: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="rounded-card border border-white/40 bg-white/70 shadow-card backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-wide text-whatsapp-green">SAMVAAD AI</div>
          <div className="mt-1 text-2xl font-semibold text-whatsapp-text">{props.title}</div>
          {props.subtitle && <div className="mt-1 max-w-2xl text-sm text-whatsapp-muted">{props.subtitle}</div>}
        </div>
        {props.right}
      </div>
    </div>
  );
}

