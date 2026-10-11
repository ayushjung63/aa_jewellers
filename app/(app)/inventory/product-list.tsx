"use client";

import Link from "next/link";
import { useState } from "react";
import { rs } from "@/lib/format";

export type Product = { id: number; name: string; sku: string | null; sell_price: number; stock_qty: number; low_stock_at: number; image_url: string | null };

export function Thumb({ src, className = "size-12" }: { src: string | null; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${className} shrink-0 rounded-xl bg-gold-soft object-cover`} loading="lazy" />
  ) : (
    <div className={`${className} grid shrink-0 place-items-center rounded-xl bg-gold-soft font-serif text-gold`}>✦</div>
  );
}

export function ProductList({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle ? products.filter((p) => p.name.toLowerCase().includes(needle) || p.sku?.toLowerCase().includes(needle)) : products;

  return (
    <>
      <input className="input sticky top-2 z-10" type="search" placeholder="Search by name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card divide-y divide-line">
        {shown.map((p) => {
          const tone = p.stock_qty === 0 ? "bg-red-50 text-red-600" : p.stock_qty <= p.low_stock_at ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-600";
          return (
            <Link key={p.id} href={`/inventory/${p.id}`} className="flex items-center gap-3 px-3 py-3">
              <Thumb src={p.image_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="num text-sm text-muted">{rs(p.sell_price)}{p.sku && ` · ${p.sku}`}</p>
              </div>
              <span className={`num rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{p.stock_qty === 0 ? "Out" : p.stock_qty}</span>
            </Link>
          );
        })}
        {!shown.length && <p className="px-4 py-8 text-center text-sm text-muted">{q ? "No match" : "No products yet"}</p>}
      </div>
    </>
  );
}
