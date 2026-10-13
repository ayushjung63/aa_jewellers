import Link from "next/link";
import { Pager } from "@/components/pager";
import { StatusBadge } from "@/components/status";
import { DateRange } from "./date-range";
import { niceDate, rs, STATUSES, today } from "@/lib/format";
import { daysAgo } from "@/lib/stats";
import { sql } from "@/lib/db";

const PER_PAGE = 30;
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

// Filters live in the URL: ?from&to (default today), ?q (name/phone, searches all dates), ?status, ?page.
export default async function Orders({ searchParams }: PageProps<"/orders">) {
  const sp = await searchParams;
  const t = today();
  const status = STATUSES.includes(sp.status as string) ? (sp.status as string) : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  let from = isDate(sp.from) ? sp.from : t;
  let to = isDate(sp.to) ? sp.to : t;
  if (from > to) [from, to] = [to, from];
  const page = Math.max(1, Number(sp.page) || 1);

  const like = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
  const data = await sql<{ id: number; customer_name: string; order_date: string; total: number; status: string; payment: string; channel: string; total_count: number }[]>`
    select id, customer_name, order_date, total, status, payment, channel, (count(*) over ())::int as total_count
    from orders
    where ${q ? sql`(customer_name ilike ${like} or phone ilike ${like})` : sql`order_date between ${from} and ${to}`}
    ${status ? sql`and status = ${status}` : sql``}
    order by order_date desc, id desc limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`;
  const total = data[0]?.total_count ?? 0;

  // Builds a link that keeps the current filters, overriding some. Changing a filter resets to page 1.
  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const all = { from: q ? undefined : from, to: q ? undefined : to, q: q || undefined, status, ...over };
    for (const [k, v] of Object.entries(all)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/orders?${s}` : "/orders";
  };
  const presets = [
    { label: "Today", from: t },
    { label: "7 days", from: daysAgo(t, 6) },
    { label: "30 days", from: daysAgo(t, 29) },
  ];
  const preset = presets.find((p) => !q && p.from === from && to === t);

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <h1 className="h1">Orders</h1>
        <Link href="/orders/customers" className="btn-ghost py-2">Customers</Link>
      </header>

      <form action="/orders" role="search" className="relative">
        {status && <input type="hidden" name="status" value={status} />}
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input className="input pl-10" type="search" name="q" defaultValue={q} placeholder="Search name or phone" enterKeyHint="search" aria-label="Search orders by customer name or phone" />
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {presets.map((p) => (
          <Link key={p.label} href={href({ q: undefined, from: p.from, to: t, page: undefined })} className={`chip ${preset === p ? "chip-on" : ""}`}>
            {p.label}
          </Link>
        ))}
        <DateRange from={from} to={to} today={t} active={!q && !preset} status={status} />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {[undefined, ...STATUSES].map((s) => (
          <Link key={s ?? "all"} href={href({ status: s, page: undefined })} className={`chip ${status === s ? "chip-on" : ""}`}>
            {s ?? "All"}
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted">
        {total} {total === 1 ? "order" : "orders"} ·{" "}
        {q ? <>matching “{q}”, all dates · <Link href={href({ q: undefined, page: undefined })} className="text-gold">Clear</Link></>
          : from === to ? niceDate(from) : `${niceDate(from)} – ${niceDate(to)}`}
      </p>

      <div className="card divide-y divide-line">
        {data.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{o.customer_name}</p>
              <p className="text-xs text-muted">#{o.id} · {niceDate(o.order_date)} · {o.channel} · {o.payment}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="num text-sm font-semibold">{rs(o.total)}</p>
              <StatusBadge status={o.status} />
            </div>
          </Link>
        ))}
        {!data.length && <p className="px-4 py-8 text-center text-sm text-muted">No orders here</p>}
      </div>
      <Pager page={page} pages={Math.max(1, Math.ceil(total / PER_PAGE))} href={(p) => href({ page: p > 1 ? String(p) : undefined })} />
    </div>
  );
}
