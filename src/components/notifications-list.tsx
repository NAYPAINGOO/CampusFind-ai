"use client";

import Link from "next/link";
import { Bell, CheckCheck, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
};


function destinationFor(row: NotificationRecord): string | null {
  if (!row.related_entity_id) return null;
  if (row.notification_type.startsWith("search_alert")) return `/reports/${row.related_entity_id}`;
  if (row.notification_type.includes("match")) return `/matches/${row.related_entity_id}`;
  if (row.notification_type.includes("claim") || row.notification_type.includes("handover")) return "/claims";
  return null;
}

const demoNotifications: NotificationRecord[] = [
  { id: "demo-1", title: "Strong match found", message: "An 88% recommendation is available for your black backpack.", notification_type: "match", related_entity_id: null, is_read: false, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "demo-2", title: "Claim under review", message: "Campus security has started reviewing your ownership claim.", notification_type: "claim", related_entity_id: null, is_read: true, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: "demo-3", title: "Collection approved", message: "Your one-time collection credential is ready.", notification_type: "handover", related_entity_id: null, is_read: true, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
];

export function NotificationsList() {
  const [rows, setRows] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        const payload = await response.json() as { notifications?: NotificationRecord[]; mode?: string; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to load notifications.");
        setRows(payload.mode === "demo" ? demoNotifications : payload.notifications ?? []);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function markRead(id?: string) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to update notifications.");
      setRows((current) => current.map((row) => id && row.id !== id ? row : { ...row, is_read: true }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update notifications.");
    }
  }

  if (loading) return <div className="card flex items-center gap-2 p-6 muted"><Loader2 className="animate-spin" size={18} />Loading notifications…</div>;

  return <div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="muted">{rows.filter((row) => !row.is_read).length} unread notification(s)</p><button className="btn-secondary" type="button" onClick={() => void markRead()}><CheckCheck size={17} />Mark all read</button></div>
    {message && <p role="status" className="mb-4 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">{message}</p>}
    <div className="card divide-y divide-slate-200 dark:divide-slate-700">
      {rows.length === 0 ? <div className="p-10 text-center"><Bell className="mx-auto muted" /><h2 className="mt-3 font-black">No notifications yet</h2><p className="mt-1 text-sm muted">Saved alerts and match recommendations will appear here.</p></div> : rows.map((row) => {
        const content = <article className={`flex gap-4 p-5 ${row.is_read ? "" : "bg-blue-50/60 dark:bg-blue-950/30"}`}>
          {row.notification_type.includes("handover") ? <CheckCircle2 className="text-green-600" /> : <Bell className="text-blue-600" />}
          <div className="flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-black">{row.title}</h2><time className="text-xs muted" dateTime={row.created_at}>{new Date(row.created_at).toLocaleString()}</time></div><p className="mt-1 text-sm muted">{row.message}</p>{!row.is_read && <button className="mt-2 text-xs font-bold text-blue-600" type="button" onClick={(event) => { event.preventDefault(); void markRead(row.id); }}>Mark as read</button>}</div>
        </article>;
        const destination = destinationFor(row);
        return destination ? <Link href={destination} key={row.id}>{content}</Link> : <div key={row.id}>{content}</div>;
      })}
    </div>
  </div>;
}
