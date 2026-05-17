import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Building2, LayoutDashboard, MessageSquareText, PlusCircle, Smartphone } from "lucide-react";

import { BRAND_NAME } from "../brand";
import vartaMarkUrl from "../assets/varta-mark.svg?url";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/add-business", label: "Add Business", icon: PlusCircle },
  { to: "/chat-logs", label: "Chat Logs", icon: MessageSquareText },
  { to: "/live", label: "Live Simulation", icon: Smartphone },
];

function BrandRow(props: { compact?: boolean }) {
  const compact = Boolean(props.compact);
  return (
    <div className={["flex items-center gap-2", compact ? "gap-1.5" : "gap-2"].join(" ")}>
      <span className="sr-only">{BRAND_NAME}</span>
      <img
        src={vartaMarkUrl}
        alt=""
        width={compact ? 32 : 36}
        height={compact ? 32 : 36}
        className={compact ? "size-8 shrink-0 object-contain" : "size-9 shrink-0 object-contain"}
        draggable={false}
      />
      <div className="flex min-w-0 items-baseline gap-[0.04em] leading-none">
        <span
          className={[
            "truncate font-semibold tracking-tight text-whatsapp-text antialiased",
            compact ? "text-[1rem]" : "text-[1.0625rem]",
          ].join(" ")}
        >
          Varta
        </span>
        <span
          className={[
            "shrink-0 font-semibold tracking-tight text-[#25D366] antialiased",
            compact ? "text-[1rem]" : "text-[1.0625rem]",
          ].join(" ")}
        >
          AI
        </span>
      </div>
    </div>
  );
}

export function AppLayout(props: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-whatsapp-bg via-white to-whatsapp-green/10">
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3 p-3 md:flex-row md:gap-4 md:p-4">
        <header className="shrink-0 border-b border-whatsapp-border/80 bg-white/90 px-4 py-3 md:hidden">
          <BrandRow compact />
        </header>

        <aside className="hidden w-72 shrink-0 flex-col rounded-card border border-white/55 bg-white/80 shadow-card backdrop-blur-md md:flex">
          <div className="border-b border-whatsapp-border/80 px-4 py-5">
            <BrandRow />
          </div>

          <nav className="flex flex-col gap-1 px-3 pb-3 pt-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                      isActive
                        ? "bg-whatsapp-green/12 text-whatsapp-text ring-1 ring-whatsapp-green/30 shadow-sm"
                        : "text-whatsapp-muted hover:-translate-y-[1px] hover:bg-whatsapp-green/6 hover:text-whatsapp-text",
                    ].join(" ")
                  }
                >
                  <Icon size={18} className={["shrink-0", "text-whatsapp-green"].join(" ")} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-whatsapp-border px-5 py-4 text-xs text-whatsapp-muted">
            API: <span className="font-mono">{(import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000"}</span>
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pr-1 [scrollbar-gutter:stable]">{props.children}</div>
        </main>
      </div>
    </div>
  );
}
