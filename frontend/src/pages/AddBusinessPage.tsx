import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { createBusiness } from "../lib/api";

export function AddBusinessPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setOk(false);
    try {
      await createBusiness({ name, phone });
      setOk(true);
      setName("");
      setPhone("");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Add Business"
        subtitle="Create a new business workspace for your WhatsApp AI assistant."
      />

      <Card title="Business details" subtitle="Add the name and WhatsApp phone number.">
        {err && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
        )}
        {ok && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            <CheckCircle2 size={16} />
            Business created.
          </div>
        )}

        <form onSubmit={onSubmit} className="grid max-w-xl grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-semibold text-whatsapp-muted">Business name</label>
            <input
              className="mt-1 w-full rounded-xl border border-whatsapp-border bg-white px-3 py-2 text-sm text-whatsapp-text outline-none placeholder:text-whatsapp-muted/70 focus:ring-2 focus:ring-whatsapp-green/25"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="FitZone Gym"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-whatsapp-muted">Phone (unique)</label>
            <input
              className="mt-1 w-full rounded-xl border border-whatsapp-border bg-white px-3 py-2 text-sm text-whatsapp-text outline-none placeholder:text-whatsapp-muted/70 focus:ring-2 focus:ring-whatsapp-green/25"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="whatsapp:+14155238886"
              required
            />
          </div>

          <Button
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating…" : "Create Business"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

