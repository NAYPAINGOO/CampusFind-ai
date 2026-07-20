"use client";

import { BellRing, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { categories, locations } from "@/lib/demo-data";

type AlertRecord = {
  id: string;
  keywords: string | null;
  report_type: "lost" | "found" | null;
  email_enabled: boolean;
  is_active: boolean;
  created_at: string;
  category: { name: string } | { name: string }[] | null;
  location: { name: string } | { name: string }[] | null;
};

type Defaults = { keywords?: string; reportType?: string; category?: string; location?: string };

function relatedName(value: AlertRecord["category"]): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0]?.name ?? "" : value.name;
}

export function SearchAlertsManager({ defaults }: { defaults: Defaults }) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    keywords: defaults.keywords ?? "",
    reportType: defaults.reportType === "lost" || defaults.reportType === "found" ? defaults.reportType : "",
    category: defaults.category ?? "",
    location: defaults.location ?? "",
    emailEnabled: false
  });

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/alerts", { cache: "no-store" });
        const payload = await response.json() as { alerts?: AlertRecord[]; mode?: string; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to load alerts.");
        if (payload.mode === "demo") {
          const saved = localStorage.getItem("campusfind-demo-alerts");
          setAlerts(saved ? JSON.parse(saved) as AlertRecord[] : []);
        } else {
          setAlerts(payload.alerts ?? []);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load alerts.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function createAlert(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json() as { alert?: AlertRecord; mode?: string; error?: string };
      if (!response.ok || !payload.alert) throw new Error(payload.error ?? "Unable to create alert.");
      const next = [payload.alert, ...alerts];
      setAlerts(next);
      if (payload.mode === "demo") localStorage.setItem("campusfind-demo-alerts", JSON.stringify(next));
      setMessage(payload.mode === "demo" ? "Demo alert saved on this device." : "Alert created. You will receive an in-app notification when a matching report is posted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create alert.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAlert(id: string) {
    setMessage("");
    try {
      const response = await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await response.json() as { mode?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete alert.");
      const next = alerts.filter((alert) => alert.id !== id);
      setAlerts(next);
      if (payload.mode === "demo") localStorage.setItem("campusfind-demo-alerts", JSON.stringify(next));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete alert.");
    }
  }

  return <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
    <form className="card p-6" onSubmit={createAlert}>
      <div className="flex items-start gap-3">
        <BellRing className="mt-1 text-blue-600" />
        <div><h2 className="text-xl font-black">Create a saved alert</h2><p className="mt-1 text-sm muted">Stop scrolling through Telegram messages. Choose the item details you want CampusFind to monitor.</p></div>
      </div>
      <label className="mt-6 block"><span className="label">Keywords</span><input className="input" value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="e.g. Lenovo backpack blue tag" maxLength={100} /></label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label><span className="label">Notify me about</span><select className="input" value={form.reportType} onChange={(event) => setForm({ ...form, reportType: event.target.value })}><option value="">Lost or found items</option><option value="found">Found items</option><option value="lost">Lost items</option></select></label>
        <label><span className="label">Category</span><select className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">Any category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="label">Campus location</span><select className="input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}><option value="">Any location</option>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><input className="mt-1" type="checkbox" checked={form.emailEnabled} onChange={(event) => setForm({ ...form, emailEnabled: event.target.checked })} /><span><strong>Email delivery preference</strong><small className="block muted">The in-app alert is created immediately. Email is sent when the university notification worker is configured.</small></span></label>
      <button className="btn-primary mt-5 w-full" disabled={saving}>{saving ? <><Loader2 className="animate-spin" size={17} />Saving…</> : <><BellRing size={17} />Create alert</>}</button>
      {message && <p role="status" className="mt-4 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">{message}</p>}
    </form>

    <section className="card p-6">
      <h2 className="text-xl font-black">Your active alerts</h2>
      <p className="mt-1 text-sm muted">Alerts match new structured reports automatically, so important posts do not disappear in chat history.</p>
      {loading ? <p className="mt-6 flex items-center gap-2 muted"><Loader2 className="animate-spin" size={18} />Loading alerts…</p> : alerts.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><BellRing className="mx-auto muted" /><p className="mt-3 font-bold">No saved alerts yet</p><p className="mt-1 text-sm muted">Create one for an item you are looking for.</p></div> : <div className="mt-5 grid gap-3">{alerts.map((alert) => <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700" key={alert.id}>
        <div className="flex items-start justify-between gap-4"><div><strong className="block">{alert.keywords || "Any matching item"}</strong><p className="mt-1 text-sm muted">{[alert.report_type ? `${alert.report_type} items` : "lost or found", relatedName(alert.category), relatedName(alert.location)].filter(Boolean).join(" · ")}</p><small className="mt-2 block muted">Created {new Date(alert.created_at).toLocaleDateString()}</small></div><button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Delete alert" onClick={() => void removeAlert(alert.id)}><Trash2 size={18} /></button></div>
      </article>)}</div>}
    </section>
  </div>;
}
