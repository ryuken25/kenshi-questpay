"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { CreatorService, CreatorServiceStatus } from "@/lib/studio/types";

const inputClass =
  "mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 text-base outline-none focus:border-[var(--qp-violet-500)]";

const STATUS_OPTIONS: CreatorServiceStatus[] = ["draft", "active", "paused", "archived"];

function statusBadge(status: CreatorServiceStatus) {
  const tones: Record<CreatorServiceStatus, string> = {
    draft: "bg-white/10 text-white",
    active: "bg-green-400/15 text-green-200",
    paused: "bg-amber-400/15 text-amber-100",
    archived: "bg-red-400/15 text-red-100",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${tones[status]}`}>
      {status}
    </span>
  );
}

export default function CreatorProductsPanel({
  initialProducts,
}: {
  initialProducts: CreatorService[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("");
  const [usdPrice, setUsdPrice] = useState("10");
  const [delivery, setDelivery] = useState("24-48 hours");
  const [revisions, setRevisions] = useState("One revision");
  const [status, setStatus] = useState<CreatorServiceStatus>("draft");
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setOutcome("");
    setUsdPrice("10");
    setDelivery("24-48 hours");
    setRevisions("One revision");
    setStatus("draft");
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/studio/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          outcome: outcome.trim(),
          usdPrice: Number(usdPrice),
          delivery: delivery.trim(),
          revisions: revisions.trim(),
          status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create product.");
        return;
      }
      setProducts((prev) => [data.product as CreatorService, ...prev]);
      setMessage("Product created.");
      resetForm();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const setProductStatus = async (id: string, next: CreatorServiceStatus) => {
    setRowBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/studio/products/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not update status.");
        return;
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? (data.product as CreatorService) : p)));
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRowBusy(null);
    }
  };

  const archiveProduct = async (id: string) => {
    setRowBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/studio/products/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not archive product.");
        return;
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? (data.product as CreatorService) : p)));
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-6">
        <h2 className="font-sora text-xl font-black">Your products</h2>
        <p className="mt-2 text-sm text-muted">
          Per-creator packages stored in <code className="text-[var(--qp-violet-300)]">creator_services</code>.
          Public catalog packages remain separate until listing publish lands.
        </p>

        <div className="mt-5 space-y-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-white/10 bg-[rgba(8,8,14,.55)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-sora text-lg font-black">{product.title}</h3>
                    {statusBadge(product.status)}
                  </div>
                  <p className="mt-1 font-mono text-xs text-[var(--qp-violet-300)]">{product.slug}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--qp-text-muted)]">
                    {product.description}
                  </p>
                  <dl className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--qp-text-secondary)]">
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <dt className="uppercase tracking-wider text-muted">Price</dt>
                      <dd className="mt-0.5 font-semibold text-white">${product.usdPrice}</dd>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <dt className="uppercase tracking-wider text-muted">Delivery</dt>
                      <dd className="mt-0.5 font-semibold text-white">{product.delivery}</dd>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <dt className="uppercase tracking-wider text-muted">Revisions</dt>
                      <dd className="mt-0.5 font-semibold text-white">{product.revisions}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-col gap-2 sm:min-w-[10rem]">
                  <select
                    className="min-h-10 rounded-xl border border-white/10 bg-[rgba(8,8,14,.85)] px-3 text-sm"
                    value={product.status}
                    disabled={rowBusy === product.id}
                    onChange={(e) =>
                      setProductStatus(product.id, e.target.value as CreatorServiceStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {product.status !== "archived" && (
                    <button
                      type="button"
                      disabled={rowBusy === product.id}
                      onClick={() => archiveProduct(product.id)}
                      className="min-h-10 rounded-xl border border-white/10 px-3 text-sm font-bold text-[var(--qp-text-secondary)] hover:bg-white/5 disabled:opacity-50"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!products.length && (
            <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-muted">
              No custom products yet. Create your first package below.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-6">
        <h2 className="font-sora text-xl font-black">Create product</h2>
        <form onSubmit={createProduct} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Title</span>
            <input
              required
              minLength={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Landing polish sprint"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Slug (optional)
            </span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputClass}
              placeholder="landing-polish-sprint"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Description</span>
            <textarea
              required
              minLength={10}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 py-3 text-base outline-none focus:border-[var(--qp-violet-500)]"
              placeholder="What the buyer gets and what is out of scope."
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Outcome</span>
            <input
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className={inputClass}
              placeholder="Deliverable summary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">USD price</span>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={usdPrice}
              onChange={(e) => setUsdPrice(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CreatorServiceStatus)}
              className={inputClass}
            >
              {STATUS_OPTIONS.filter((s) => s !== "archived").map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Delivery</span>
            <input
              required
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Revisions</span>
            <input
              required
              value={revisions}
              onChange={(e) => setRevisions(e.target.value)}
              className={inputClass}
            />
          </label>

          {error && (
            <p className="sm:col-span-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}
          {message && (
            <p className="sm:col-span-2 rounded-xl border border-green-400/30 bg-green-400/10 px-4 py-3 text-sm text-green-100">
              {message}
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-verse-purple px-6 font-black disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Create product
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
