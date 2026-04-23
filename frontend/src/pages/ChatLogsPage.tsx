import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Card } from "../components/Card";
import { ChatBubbles } from "../components/ChatUI";
import { PageHeader } from "../components/PageHeader";
import { listBusinesses, listMessages } from "../lib/api";
import type { Bubble, Business, ChatMessageRow } from "../lib/types";

function toBubbles(rows: ChatMessageRow[]): Bubble[] {
  const out: Bubble[] = [];
  for (const r of rows.slice().reverse()) {
    const ts = new Date(r.created_at).getTime() || Date.now();
    out.push({ id: `u-${r.id}`, side: "user", text: r.message, ts });
    out.push({ id: `a-${r.id}`, side: "ai", text: r.response, ts: ts + 1 });
  }
  return out;
}

export function ChatLogsPage() {
  const [params, setParams] = useSearchParams();
  const [biz, setBiz] = useState<Business[]>([]);
  const [rows, setRows] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const businessId = Number(params.get("businessId") || "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const b = await listBusinesses();
        if (!cancelled) setBiz(b);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!businessId || Number.isNaN(businessId)) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const msgs = await listMessages(businessId);
        if (!cancelled) setRows(msgs);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load chat logs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const bubbles = useMemo(() => toBubbles(rows), [rows]);
  const selected = biz.find((b) => b.id === businessId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Chat Logs"
        subtitle="WhatsApp-style view of stored conversations with timestamps."
        right={
          <select
            value={businessId || ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) setParams({});
              else setParams({ businessId: v });
            }}
            className="rounded-xl border border-whatsapp-border bg-white px-3 py-2 text-sm text-whatsapp-text outline-none focus:ring-2 focus:ring-whatsapp-green/25"
          >
            <option value="">Select business…</option>
            {biz.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (#{b.id})
              </option>
            ))}
          </select>
        }
      />

      <Card title="Conversation" subtitle="Scroll to explore messages.">
        {!businessId && <div className="text-sm text-whatsapp-muted">Select a business to view logs.</div>}
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        {businessId && (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-whatsapp-text">{selected?.name || `Business #${businessId}`}</div>
              <div className="text-xs text-whatsapp-muted">{loading ? "Loading…" : `${rows.length} messages`}</div>
            </div>
            <div className="h-[65vh]">
              <ChatBubbles bubbles={bubbles} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

