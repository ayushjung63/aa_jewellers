"use client";

import { useState, useTransition } from "react";
import { createOrder } from "@/app/actions";
import { CHANNELS, PAYMENTS, rs } from "@/lib/format";
import { Thumb } from "../../inventory/product-list";

export type P = { id: number; name: string; sku: string | null; sell_price: number; stock_qty: number; image_url: string | null };

export type Customer = { customer_name: string; phone: string | null; address: string | null };

export function OrderForm({ products, customers, today }: { products: P[]; customers: Customer[]; today: string }) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [q, setQ] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [cust, setCust] = useState({ customer_name: "", phone: "", address: "" });
  const [picked, setPicked] = useState(false);
  const typeCust = (k: keyof typeof cust) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCust({ ...cust, [k]: e.target.value });
    setPicked(false);
  };
  const cn = cust.customer_name.trim().toLowerCase();
  const ph = cust.phone.replace(/\D/g, "");
  const known = picked || (cn.length < 2 && ph.length < 3) ? [] : customers
    .filter((c) => (cn.length >= 2 && c.customer_name.toLowerCase().includes(cn)) || (ph.length >= 3 && c.phone?.replace(/\D/g, "").includes(ph)))
    .slice(0, 5);

  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const lines = Object.entries(cart).map(([id, qty]) => ({ p: byId[id], qty }));
  const subtotal = lines.reduce((s, l) => s + l.qty * l.p.sell_price, 0);
  const needle = q.trim().toLowerCase();
  const matches = needle ? products.filter((p) => p.name.toLowerCase().includes(needle) || p.sku?.toLowerCase().includes(needle)).slice(0, 8) : [];

  const setQty = (id: number, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty > 0) next[id] = Math.min(qty, byId[id].stock_qty);
      else delete next[id];
      return next;
    });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lines.length) return setError("Add at least one item");
    const order = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    start(async () => {
      const res = await createOrder(order, lines.map((l) => ({ product_id: l.p.id, qty: l.qty })));
      setError(res?.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="space-y-2">
        <h2 className="label">Items</h2>
        <input className="input" type="search" placeholder="Search product to add…" value={q} onChange={(e) => setQ(e.target.value)} />
        {matches.length > 0 && (
          <div className="card divide-y divide-line">
            {matches.map((p) => (
              <button key={p.id} type="button" className="flex w-full items-center gap-3 px-3 py-2.5 text-left" onClick={() => { setQty(p.id, (cart[p.id] ?? 0) + 1); setQ(""); }}>
                <Thumb src={p.image_url} className="size-10" />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="num text-sm text-muted">{rs(p.sell_price)} · {p.stock_qty} left</span>
              </button>
            ))}
          </div>
        )}
        {needle && !matches.length && <p className="text-sm text-muted">No in-stock product matches “{q}”</p>}
        {lines.length > 0 && (
          <div className="card divide-y divide-line">
            {lines.map(({ p, qty }) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <Thumb src={p.image_url} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="num text-xs text-muted">{rs(p.sell_price)} × {qty} = {rs(p.sell_price * qty)}</p>
                </div>
                <div className="flex items-center rounded-full border border-line">
                  <button type="button" aria-label="Less" className="size-9 text-lg" onClick={() => setQty(p.id, qty - 1)}>−</button>
                  <span className="num w-6 text-center text-sm font-semibold">{qty}</span>
                  <button type="button" aria-label="More" className="size-9 text-lg disabled:opacity-30" disabled={qty >= p.stock_qty} onClick={() => setQty(p.id, qty + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="label">Customer</h2>
        <input className="input" name="customer_name" placeholder="Name" required autoComplete="off" value={cust.customer_name} onChange={typeCust("customer_name")} />
        <input className="input" name="phone" type="tel" placeholder="Phone" autoComplete="off" value={cust.phone} onChange={typeCust("phone")} />
        {known.length > 0 && (
          <div className="card divide-y divide-line">
            <p className="px-3 py-2 text-xs text-muted">Existing customer? Tap to fill</p>
            {known.map((c) => (
              <button
                key={c.customer_name + c.phone}
                type="button"
                className="block w-full px-3 py-2.5 text-left"
                onClick={() => { setCust({ customer_name: c.customer_name, phone: c.phone ?? "", address: c.address ?? "" }); setPicked(true); }}
              >
                <p className="truncate text-sm font-medium">{c.customer_name}{c.phone && <span className="num font-normal text-muted"> · {c.phone}</span>}</p>
                {c.address && <p className="truncate text-xs text-muted">{c.address}</p>}
              </button>
            ))}
          </div>
        )}
        <textarea className="input" name="address" placeholder="Address" rows={2} value={cust.address} onChange={typeCust("address")} />
      </section>

      <Chips label="Status" name="status" options={["Pending", "Delivered"]} />
      <Chips label="Channel" name="channel" options={CHANNELS} />
      <Chips label="Payment" name="payment" options={PAYMENTS} />

      <section className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="order_date">Date</label>
          <input className="input" id="order_date" name="order_date" type="date" defaultValue={today} required />
        </div>
        <div>
          <label className="label" htmlFor="discount">Discount (Rs)</label>
          <input className="input num" id="discount" name="discount" type="number" inputMode="decimal" min={0} step="any" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} />
        </div>
      </section>

      <section className="card space-y-1 p-4">
        <Row label="Subtotal" value={rs(subtotal)} />
        {discount > 0 && <Row label="Discount" value={"− " + rs(discount)} />}
        <div className="flex items-baseline justify-between pt-1">
          <span className="font-medium">Total</span>
          <span className="num font-serif text-2xl font-semibold">{rs(Math.max(subtotal - discount, 0))}</span>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-gold w-full py-4 text-base" disabled={pending}>{pending ? "Placing…" : "Place order"}</button>
    </form>
  );
}

function Chips({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <label key={o} className="chip cursor-pointer has-checked:border-ink has-checked:bg-ink has-checked:text-white">
            <input type="radio" name={name} value={o} defaultChecked={i === 0} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-muted">
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}
