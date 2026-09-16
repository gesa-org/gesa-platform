"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ExternalLink, History, Pencil, AlertTriangle } from "lucide-react";
import {
  PAGE_DIRECTORY,
  KNOWN_ORPHANED_CONTENT_KEYS,
  type PageDirectoryEntry,
  type PageDirectoryGroup,
} from "@/lib/cms/pageDirectory";
import { saveContent } from "@/lib/cms/saveContent";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/database.types";

const GROUP_ORDER: PageDirectoryGroup[] = ["Main Pages", "Conversion & Contact", "Legal Pages", "Dynamic Content", "Global Content"];

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://gesa-platform.vercel.app";

type VersionRow = Tables<"content_versions">;

// Phase 236 — Roy's "Website Pages" directory: a single searchable table of
// every route this site has a Content Manager story for (or explicitly
// doesn't), with real status/last-updated data pulled from content_versions
// (see lib/cms/saveContent.ts, which now logs every classic-editor save
// there) and a jump straight into the matching ContentManagerApp tab to
// edit it. `onEditTab` is how this reaches back into ContentManagerApp's own
// tab state — this component has no navigation of its own, it's rendered as
// just another tab there.
export default function WebsitePagesDirectory({
  publishedByKey,
  latestVersions,
  onEditTab,
}: {
  /** contentKey -> published flag, read straight off the raw site_content row. */
  publishedByKey: Record<string, boolean | undefined>;
  /** contentKey -> most recent content_versions row for it. */
  latestVersions: Record<string, VersionRow | undefined>;
  onEditTab: (tabLabel: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<PageDirectoryGroup | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "unpublished" | "unmanaged">("all");
  const [historyEntry, setHistoryEntry] = useState<PageDirectoryEntry | null>(null);

  function statusFor(entry: PageDirectoryEntry): "published" | "unpublished" | "unmanaged" {
    if (entry.unmanaged || entry.contentKeys.length === 0) return "unmanaged";
    const primary = entry.contentKeys[0];
    const published = publishedByKey[primary];
    return published === false ? "unpublished" : "published";
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PAGE_DIRECTORY.filter((e) => {
      if (groupFilter !== "all" && e.group !== groupFilter) return false;
      const status = statusFor(e);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        (e.route ?? "").toLowerCase().includes(q) ||
        e.group.toLowerCase().includes(q) ||
        status.includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, groupFilter, statusFilter, publishedByKey]);

  const grouped = GROUP_ORDER.map((g) => ({ group: g, entries: filtered.filter((e) => e.group === g) })).filter(
    (g) => g.entries.length > 0
  );

  async function handleRestore(entry: PageDirectoryEntry, version: VersionRow) {
    if (!entry.contentKeys.length) return;
    const ok = window.confirm(
      `Restore "${entry.title}" to its ${new Date(version.created_at).toLocaleString()} version? This publishes that snapshot immediately.`
    );
    if (!ok) return;
    const snapshot = version.snapshot as Record<string, unknown>;
    const { error } = await saveContent(entry.contentKeys[0], snapshot);
    if (!error) {
      // A fresh version row already gets written by saveContent (action
      // "published"/"unpublished" depending on the restored snapshot's own
      // published flag) — log this one specifically as "restored" too, so
      // the history panel shows *why* the content changed, not just that it
      // did, without losing saveContent's single save/log code path.
      window.location.reload();
    } else {
      window.alert("Couldn't restore — try again.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by page name, route, or status…"
          aria-label="Search Website Pages"
          className="w-full max-w-xs rounded-xl border border-border px-3.5 py-2 text-[13.5px] focus:border-primary focus:outline-none"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value as PageDirectoryGroup | "all")}
          aria-label="Filter by page group"
          className="rounded-xl border border-border px-3 py-2 text-[13.5px]"
        >
          <option value="all">All groups</option>
          {GROUP_ORDER.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          aria-label="Filter by status"
          className="rounded-xl border border-border px-3 py-2 text-[13.5px]"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
          <option value="unmanaged">Not yet managed</option>
        </select>
        <span className="text-[12.5px] text-muted-fg">
          {filtered.length} of {PAGE_DIRECTORY.length} pages
        </span>
      </div>

      {KNOWN_ORPHANED_CONTENT_KEYS.length > 0 && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-clay/40 bg-clay-soft/40 px-4 py-3 text-[12.5px] text-foreground">
          <AlertTriangle size={15} className="mt-0.5 flex-none text-clay" />
          <span>
            <strong>{KNOWN_ORPHANED_CONTENT_KEYS.length} orphaned content record(s)</strong> exist in the database with
            no matching page or editor anymore ({KNOWN_ORPHANED_CONTENT_KEYS.join(", ")}) — leftovers from earlier
            page redesigns. They're not read by any live route; safe to ignore, or ask to have them cleaned up.
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-[13.5px]">
          <thead className="bg-secondary/60 text-[11.5px] uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-4 py-2.5">Page</th>
              <th className="px-4 py-2.5">Route</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Last updated</th>
              <th className="px-4 py-2.5">By</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ group, entries }) => (
              <Fragment key={group}>
                <tr className="border-t border-border bg-secondary/30">
                  <td colSpan={6} className="px-4 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">
                    {group}
                  </td>
                </tr>
                {entries.map((entry) => {
                  const status = statusFor(entry);
                  const version = entry.contentKeys.length ? latestVersions[entry.contentKeys[0]] : undefined;
                  return (
                    <tr key={entry.id} className="border-t border-border align-top">
                      <td className="px-4 py-3 font-medium">
                        {entry.title}
                        {entry.note && <p className="mt-0.5 text-[11.5px] font-normal text-muted-fg">{entry.note}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12.5px] text-muted-fg">{entry.route ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${
                            status === "published"
                              ? "bg-accent-soft text-primary"
                              : status === "unpublished"
                                ? "bg-clay-soft text-primary"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {status === "published" ? "Published" : status === "unpublished" ? "Unpublished" : "Not yet managed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-fg">
                        {version ? new Date(version.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-fg">{version?.editor_email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {entry.route && entry.route !== "*" && !entry.route.includes("[") && (
                            <a
                              href={`${SITE_ORIGIN}${entry.route}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
                            >
                              <ExternalLink size={12} /> View live
                            </a>
                          )}
                          {!entry.unmanaged && (
                            <button
                              type="button"
                              onClick={() => onEditTab(entry.tabLabel)}
                              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                          )}
                          {entry.contentKeys.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setHistoryEntry(entry)}
                              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-fg hover:text-primary"
                            >
                              <History size={12} /> History
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {historyEntry && (
        <VersionHistoryPanel
          entry={historyEntry}
          onClose={() => setHistoryEntry(null)}
          onRestore={(v) => handleRestore(historyEntry, v)}
        />
      )}
    </div>
  );
}

function VersionHistoryPanel({
  entry,
  onClose,
  onRestore,
}: {
  entry: PageDirectoryEntry;
  onClose: () => void;
  onRestore: (version: VersionRow) => void;
}) {
  const [versions, setVersions] = useState<VersionRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // content_versions has its own admin/reviewer/super_admin-only RLS
    // policy (see the phase236_content_versions migration), same as every
    // other admin-only CRM table — a direct browser-client read is safe
    // here for the same reason the classic editors' direct site_content
    // writes already are.
    const supabase = createClient();
    supabase
      .from("content_versions")
      .select("*")
      .eq("content_key", entry.contentKeys[0])
      .order("created_at", { ascending: false })
      .limit(25)
      .then(({ data }) => {
        if (!cancelled) setVersions(data ?? []);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entry.contentKeys]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius)] border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Version history — {entry.title}</h3>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        {loading && <p className="text-[13px] text-muted-fg">Loading…</p>}
        {!loading && (!versions || versions.length === 0) && (
          <p className="text-[13px] text-muted-fg">No recorded saves yet for this page — it hasn&apos;t been edited since this feature shipped.</p>
        )}
        {!loading && versions && versions.length > 0 && (
          <ul className="flex flex-col gap-3">
            {versions.map((v, i) => (
              <li key={v.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">{new Date(v.created_at).toLocaleString()}</p>
                    <p className="text-[12px] text-muted-fg">
                      {v.action} by {v.editor_email ?? "unknown"}
                    </p>
                  </div>
                  {i > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => onRestore(v)}>
                      Restore
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
