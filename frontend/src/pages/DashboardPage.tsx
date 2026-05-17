import { useEffect, useMemo, useState } from "react";
import { Users, Building2, MessageSquare } from "lucide-react";

import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { listBusinesses, listMessages } from "../lib/api";
import type { Business, ChatMessageRow } from "../lib/types";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function DashboardPage() {
  const [biz, setBiz] = useState<Business[]>([]);
  const [rows, setRows] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const businesses = await listBusinesses();
        if (cancelled) return;
        setBiz(businesses);

        const all: ChatMessageRow[] = [];
        for (const b of businesses.slice(0, 20)) {
          try {
            const msgs = await listMessages(b.id);
            all.push(...msgs);
          } catch {
            // ignore per business
          }
        }
        if (cancelled) return;
        setRows(all);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const messagesToday = useMemo(() => rows.filter((r) => isToday(r.created_at)).length, [rows]);
  const activeUsers = useMemo(() => {
    const set = new Set(rows.filter((r) => isToday(r.created_at)).map((r) => r.user));
    return set.size;
  }, [rows]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Dashboard"
        subtitle="A quick snapshot of your Varta AI workspace — AI-powered WhatsApp automation for every business you connect."
      />

      {err && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          title="Total Businesses"
          subtitle={loading ? "Loading…" : "Connected WhatsApp businesses"}
          right={<Building2 className="text-whatsapp-green" size={18} />}
        >
          <div className="text-3xl font-semibold text-whatsapp-text">{biz.length}</div>
        </Card>

        <Card
          title="Messages Today"
          subtitle={loading ? "Loading…" : "Across all businesses"}
          right={<MessageSquare className="text-whatsapp-green" size={18} />}
        >
          <div className="text-3xl font-semibold text-whatsapp-text">{messagesToday}</div>
        </Card>

        <Card
          title="Active Users"
          subtitle={loading ? "Loading…" : "Unique senders today"}
          right={<Users className="text-whatsapp-green" size={18} />}
        >
          <div className="text-3xl font-semibold text-whatsapp-text">{activeUsers}</div>
        </Card>
      </div>
    </div>
  );
}

