import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Building2, LayoutDashboard, MessageSquareText, PlusCircle, Smartphone } from "lucide-react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/add-business", label: "Add Business", icon: PlusCircle },
  { to: "/chat-logs", label: "Chat Logs", icon: MessageSquareText },
  { to: "/live", label: "Live Simulation", icon: Smartphone },
];

export function AppLayout(props: { children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-whatsapp-bg via-white to-whatsapp-green/10">
      <div className="mx-auto flex h-screen w-full max-w-[1600px] gap-4 p-4">
        <aside className="hidden w-72 shrink-0 flex-col rounded-card border border-white/40 bg-white/70 shadow-card backdrop-blur md:flex">
          <div className="flex items-center gap-2 border-b border-whatsapp-border px-5 py-4">
            <div className="h-9 w-9 rounded-xl bg-whatsapp-green ring-1 ring-whatsapp-green/30 shadow-sm" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-whatsapp-text">Samvaad AI</div>
              <div className="text-xs text-whatsapp-muted">WhatsApp AI Assistant</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150",
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

        <main className="min-w-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pr-1 [scrollbar-gutter:stable]">{props.children}</div>
        </main>
      </div>
    </div>
  );
}

