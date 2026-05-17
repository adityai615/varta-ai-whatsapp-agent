import type { ReactNode } from "react";

import { BRAND_NAME } from "../brand";

export function PageHeader(props: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="rounded-card border border-white/50 bg-white/80 shadow-card backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-whatsapp-green">{BRAND_NAME}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-whatsapp-text">{props.title}</div>
          {props.subtitle && <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-whatsapp-muted">{props.subtitle}</div>}
        </div>
        {props.right}
      </div>
    </div>
  );
}
