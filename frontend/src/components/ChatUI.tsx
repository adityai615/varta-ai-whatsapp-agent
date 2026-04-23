import { useEffect, useMemo, useRef } from "react";

import type { Bubble } from "../lib/types";

const WHATSAPP_BG =
  "radial-gradient(circle at 20px 20px, rgba(0,0,0,0.05) 2px, transparent 2px), radial-gradient(circle at 0 0, rgba(0,0,0,0.03) 1px, transparent 1px)";

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs text-whatsapp-muted shadow-sm ring-1 ring-black/5">
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-whatsapp-muted/80 animate-typing1" />
        <span className="h-1.5 w-1.5 rounded-full bg-whatsapp-muted/80 animate-typing2" />
        <span className="h-1.5 w-1.5 rounded-full bg-whatsapp-muted/80 animate-typing3" />
      </span>
      <span>typing…</span>
    </div>
  );
}

export function ChatBubbles(props: { bubbles: Bubble[]; isTyping?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastId = useMemo(() => props.bubbles.at(-1)?.id, [props.bubbles]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lastId, props.isTyping]);

  return (
    <div
      ref={ref}
      className={[
        "h-full overflow-y-auto rounded-card border border-whatsapp-border bg-[#EFEAE2] p-4 scroll-smooth",
        props.className || "",
      ].join(" ")}
      style={{
        backgroundImage: WHATSAPP_BG,
        backgroundSize: "44px 44px",
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {props.bubbles.map((b) => {
          const isUser = b.side === "user";
          return (
            <div key={b.id} className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
              <div
                className={[
                  "max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm animate-popIn ring-1 ring-black/5",
                  isUser
                    ? "bg-whatsapp-bubble text-whatsapp-text shadow-[0_1px_2px_rgba(0,0,0,0.10)]"
                    : "bg-white text-whatsapp-text shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
                ].join(" ")}
              >
                <div>{b.text}</div>
                <div className="mt-1 text-[11px] text-whatsapp-muted">{fmt(b.ts)}</div>
              </div>
            </div>
          );
        })}

        {props.isTyping && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}
      </div>
    </div>
  );
}

