import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, MessageSquareText, Pencil, RefreshCw, Upload } from "lucide-react";

import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { getBusinessData, listBusinesses, updateBusinessData, uploadBusinessData } from "../lib/api";
import type { Business } from "../lib/types";

export function BusinessesPage() {
  const [biz, setBiz] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [dataText, setDataText] = useState<string>("");
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setErr(null);
    setSuccess(null);
    try {
      setBiz(await listBusinesses());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load businesses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => biz, [biz]);

  const onUpload = async (b: Business, file: File) => {
    setUploadingId(b.id);
    setErr(null);
    setSuccess(null);
    try {
      await uploadBusinessData(b.id, file);
      setSuccess(`Uploaded data for "${b.name}".`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const openDataModal = async (b: Business, mode: "view" | "edit") => {
    setActiveBiz(b);
    setModalMode(mode);
    setModalOpen(true);
    setErr(null);
    setSuccess(null);
    setDataLoading(true);
    try {
      const res = await getBusinessData(b.id);
      setDataText(res.text || "");
    } catch (e) {
      setDataText("");
      setErr(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setDataLoading(false);
    }
  };

  const onSave = async () => {
    if (!activeBiz) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      await updateBusinessData(activeBiz.id, dataText);
      setSuccess(`Updated data for "${activeBiz.name}". Embeddings recreated.`);
      setModalOpen(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Businesses"
        subtitle="Manage businesses, knowledge bases, and conversations from your Varta AI console."
        right={
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        }
      />

      <Card title="Business list" subtitle="Upload, view, and edit your AI knowledge base per business.">
        {err && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
        )}
        {success && (
          <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        {loading && <div className="py-6 text-center text-sm text-whatsapp-muted">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="py-8 text-center text-sm text-whatsapp-muted">
            No businesses yet.{" "}
            <Link to="/add-business" className="text-whatsapp-green underline-offset-2 hover:underline">
              Add one
            </Link>
            .
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map((b) => {
            const hasData = Boolean(b.has_data);
            return (
              <div
                key={b.id}
                className="rounded-card border border-white/40 bg-white/70 p-5 shadow-sm backdrop-blur ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-whatsapp-text">{b.name}</div>
                    <div className="mt-1 truncate font-mono text-xs text-whatsapp-muted">{b.phone}</div>
                  </div>
                  <div
                    className={[
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                      hasData
                        ? "bg-whatsapp-green/10 text-whatsapp-text ring-whatsapp-green/25"
                        : "bg-amber-50 text-amber-900 ring-amber-200",
                    ].join(" ")}
                  >
                    {hasData ? "Uploaded" : "Not Uploaded"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-whatsapp-green px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-[1px] hover:shadow-md hover:brightness-95">
                    <Upload size={16} />
                    {uploadingId === b.id ? "Uploading…" : hasData ? "Upload Again" : "Upload Data"}
                    <input
                      type="file"
                      accept=".txt"
                      className="hidden"
                      disabled={uploadingId === b.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void onUpload(b, f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <Button variant="secondary" size="sm" onClick={() => void openDataModal(b, "view")} disabled={!hasData}>
                    <FileText size={16} />
                    View Data
                  </Button>

                  <Button variant="secondary" size="sm" onClick={() => void openDataModal(b, "edit")} disabled={!hasData}>
                    <Pencil size={16} />
                    Edit Data
                  </Button>

                  <Button variant="secondary" size="sm" onClick={() => navigate(`/chat-logs?businessId=${b.id}`)}>
                    <MessageSquareText size={16} />
                    View Logs
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title={modalMode === "view" ? "Business data" : "Edit business data"}
        subtitle={activeBiz ? `${activeBiz.name} (ID #${activeBiz.id})` : undefined}
        onClose={() => setModalOpen(false)}
        footer={
          modalMode === "edit" ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void onSave()} disabled={saving || dataLoading}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </div>
          )
        }
      >
        {dataLoading ? (
          <div className="text-sm text-whatsapp-muted">Loading…</div>
        ) : modalMode === "view" ? (
          <pre className="whitespace-pre-wrap break-words rounded-2xl border border-whatsapp-border bg-[#F8FAFC] p-4 text-sm text-whatsapp-text">
            {dataText || "(empty)"}
          </pre>
        ) : (
          <textarea
            value={dataText}
            onChange={(e) => setDataText(e.target.value)}
            className="h-[52vh] w-full resize-none rounded-2xl border border-whatsapp-border bg-white p-4 text-sm text-whatsapp-text outline-none focus:ring-2 focus:ring-whatsapp-green/25"
            placeholder="Paste your business knowledge base text here…"
          />
        )}
      </Modal>
    </div>
  );
}

