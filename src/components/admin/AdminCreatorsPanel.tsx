"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { CreatorApplication, CreatorApplicationStatus } from "@/lib/studio/types";

function statusTone(status: CreatorApplicationStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-400/15 text-amber-100";
    case "approved":
      return "bg-green-400/15 text-green-100";
    case "rejected":
      return "bg-red-400/15 text-red-100";
    default:
      return "bg-white/10 text-white";
  }
}

export default function AdminCreatorsPanel({
  initialApplications,
}: {
  initialApplications: CreatorApplication[];
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | CreatorApplicationStatus>("pending");

  const filtered =
    filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const review = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/studio/applications/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          reviewNote: (notes[id] || "").trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Review failed.");
        return;
      }
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? (data.application as CreatorApplication) : a)),
      );
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${
              filter === key
                ? "bg-verse-purple text-white"
                : "border border-white/10 bg-[var(--qp-surface)] text-[var(--qp-text-secondary)]"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {filtered.map((app) => (
          <article
            key={app.id}
            className="rounded-[1.6rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-sora text-xl font-black">{app.displayName}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black capitalize ${statusTone(app.status)}`}
                  >
                    {app.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--qp-text-secondary)]">{app.craft}</p>
                <p className="mt-1 font-mono text-xs text-[var(--qp-violet-300)]">
                  {app.accountEmail || app.accountId.slice(0, 8) + "…"}
                </p>
              </div>
              <p className="text-xs text-muted">
                {new Date(app.createdAt).toLocaleString()}
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-[var(--qp-text-muted)]">{app.note}</p>
            {app.portfolioUrl && (
              <a
                href={app.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-[var(--qp-violet-300)] hover:underline"
              >
                Portfolio link
              </a>
            )}

            {app.status === "pending" && (
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Review note (optional)
                  </span>
                  <input
                    value={notes[app.id] || ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 text-sm outline-none focus:border-[var(--qp-violet-500)]"
                    placeholder="Why approve / reject"
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={busyId === app.id}
                    onClick={() => review(app.id, "approved")}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-green-500/90 px-4 text-sm font-black text-white disabled:opacity-50"
                  >
                    {busyId === app.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    Approve + grant creator
                  </button>
                  <button
                    type="button"
                    disabled={busyId === app.id}
                    onClick={() => review(app.id, "rejected")}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 text-sm font-black text-red-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {app.status !== "pending" && app.reviewNote && (
              <p className="mt-3 text-xs text-muted">Review note: {app.reviewNote}</p>
            )}
          </article>
        ))}

        {!filtered.length && (
          <div className="rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-8 text-center">
            <img
              src="/illustrations/questpay/dashboard-empty-state.svg"
              alt=""
              className="mx-auto h-32 w-32 opacity-50"
            />
            <p className="mt-4 text-base text-[var(--qp-text-muted)]">
              No {filter === "all" ? "" : filter + " "}applications yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
