import type { ReactNode } from "react";

export function Card(props: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={[
        "rounded-card border border-white/40 bg-white/70 shadow-card backdrop-blur",
        props.className || "",
      ].join(" ")}
    >
      {(props.title || props.right) && (
        <div className="flex items-start justify-between gap-3 border-b border-whatsapp-border/70 px-5 py-4">
          <div>
            {props.title && <div className="text-sm font-semibold text-whatsapp-text">{props.title}</div>}
            {props.subtitle && <div className="mt-0.5 text-xs text-whatsapp-muted">{props.subtitle}</div>}
          </div>
          {props.right}
        </div>
      )}
      <div className={["p-5", props.bodyClassName || ""].join(" ")}>{props.children}</div>
    </div>
  );
}

