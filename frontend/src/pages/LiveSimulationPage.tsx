import { useEffect, useMemo, useState } from "react";
import { Paperclip, SendHorizontal, ShieldCheck, Smile } from "lucide-react";

import { BRAND_NAME } from "../brand";
import { Card } from "../components/Card";
import { ChatBubbles } from "../components/ChatUI";
import { PageHeader } from "../components/PageHeader";
import { listBusinesses } from "../lib/api";
import { sendToWebhook } from "../lib/twiml";
import type { Bubble, Business } from "../lib/types";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function LiveSimulationPage() {
  const [biz, setBiz] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState<number | "">("");
  const selected = useMemo(() => biz.find((b) => b.id === businessId), [biz, businessId]);

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const b = await listBusinesses();
        if (cancelled) return;
        setBiz(b);
        if (!businessId && b.length) setBusinessId(b[0].id);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSend = async () => {
    const text = input.trim();
    if (!text || !businessId) return;

    setErr(null);
    setInput("");
    const now = Date.now();
    setBubbles((prev) => [...prev, { id: uid(), side: "user", text, ts: now }]);

    setTyping(true);
    try {
      const ai = await sendToWebhook({
        body: text,
        from: "web:user",
        to: String(businessId),
      });
      setBubbles((prev) => [...prev, { id: uid(), side: "ai", text: ai, ts: Date.now() }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send");
      setBubbles((prev) => [
        ...prev,
        { id: uid(), side: "ai", text: "Sorry, something went wrong. Please try again.", ts: Date.now() },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <PageHeader
        title="Live Simulation"
        subtitle="A premium WhatsApp-style simulator — messages hit your FastAPI webhook and the Varta AI agent replies in real time."
      />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[13fr_7fr]">
            <div className="min-h-0 overflow-hidden">
              <Card
                title="WhatsApp"
                subtitle="Live chat"
                className="h-full flex flex-col"
                bodyClassName="flex-1 min-h-0 flex flex-col"
                right={
                  <select
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value ? Number(e.target.value) : "")}
                    className="rounded-xl border border-whatsapp-border bg-white/80 px-3 py-2 text-sm text-whatsapp-text outline-none focus:ring-2 focus:ring-whatsapp-green/25"
                  >
                    <option value="">Select business…</option>
                    {biz.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (#{b.id})
                      </option>
                    ))}
                  </select>
                }
              >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-black/5">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src="/favicon.svg"
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full bg-white object-cover ring-1 ring-whatsapp-green/30"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-whatsapp-text">
                          {selected?.name || "Select a business"}
                        </div>
                        <div className="text-xs text-whatsapp-green">Online</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-whatsapp-muted">
                      <ShieldCheck size={16} className="text-whatsapp-green" />
                      {BRAND_NAME}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1">
                    <ChatBubbles bubbles={bubbles} isTyping={typing} className="h-full" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="min-h-0 overflow-hidden">
              <Card
                title="Compose Message"
                subtitle="Write a message and send it to the AI."
                className="h-full flex flex-col"
                bodyClassName="flex-1 min-h-0 flex flex-col"
              >
                {err && (
                  <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {err}
                  </div>
                )}

                <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-whatsapp-muted">Message</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-xl border border-whatsapp-border bg-white/80 text-whatsapp-muted hover:bg-whatsapp-green/5 hover:text-whatsapp-text"
                        title="Emoji"
                      >
                        <Smile size={18} />
                      </button>
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-xl border border-whatsapp-border bg-white/80 text-whatsapp-muted hover:bg-whatsapp-green/5 hover:text-whatsapp-text"
                        title="Attachment"
                      >
                        <Paperclip size={18} />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void onSend();
                      }
                    }}
                    placeholder="Type a WhatsApp message…"
                    className="min-h-[240px] w-full flex-1 resize-none rounded-2xl border border-whatsapp-border bg-white/80 px-4 py-3 text-sm text-whatsapp-text outline-none placeholder:text-whatsapp-muted/70 focus:ring-2 focus:ring-whatsapp-green/25"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-whatsapp-muted">
                      Press <span className="font-mono">Enter</span> to send,{" "}
                      <span className="font-mono">Shift+Enter</span> for new line.
                    </div>
                    <button
                      disabled={!input.trim() || !businessId || typing}
                      onClick={() => void onSend()}
                      className="inline-flex items-center gap-2 rounded-xl bg-whatsapp-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-[1px] hover:shadow-md hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
                      title="Send"
                    >
                      <SendHorizontal size={18} />
                      {typing ? "Sending…" : "Send"}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

