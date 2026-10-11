import Link from "next/link";
import { StatusBadge } from "@/components/status";
import { niceDate, rs, today, VOID } from "@/lib/format";
import { daysAgo, salesWindows } from "@/lib/stats";
import { currentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function Dashboard() {
  const t = today();
  const from = daysAgo(t, 29);

  const [user, orders, expenses, products, recent] = await Promise.all([
    currentUser(),
    sql<{ order_date: string; total: number }[]>`select order_date, total from orders where order_date >= ${from} and status not in ${sql(VOID)}`,
    sql<{ amount: number }[]>`select amount from expenses where date between ${from} and ${t}`,
    // ponytail: loads every product to find low stock; fine for a few thousand items, use a view if it grows past that
    sql<{ id: number; name: string; stock_qty: number; low_stock_at: number }[]>`select id, name, stock_qty, low_stock_at from products order by stock_qty`,
    sql<{ id: number; customer_name: string; order_date: string; total: number; status: string }[]>`select id, customer_name, order_date, total, status from orders order by id desc limit 5`,
  ]);

  const w = salesWindows(orders, t);
  const spent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const low = products.filter((p) => p.stock_qty <= p.low_stock_at);

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{new Date(t + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="h1">AA Jewellers</h1>
        </div>
        <Link href="/account" aria-label="Account" className="grid size-10 place-items-center rounded-full border border-line bg-card font-medium uppercase">
          {user?.username[0]}
        </Link>
      </header>

      <section className="rounded-3xl bg-ink p-5 text-white">
        <p className="text-sm text-white/60">Today&apos;s sales</p>
        <p className="num mt-1 font-serif text-4xl font-semibold text-[#e2c48d]">{rs(w.today.sales)}</p>
        <p className="mt-1 text-sm text-white/60">{w.today.count} {w.today.count === 1 ? "order" : "orders"}</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Last 7 days" value={rs(w.week.sales)} sub={`${w.week.count} orders`} />
        <Stat label="Last 30 days" value={rs(w.month.sales)} sub={`${w.month.count} orders`} />
        <Stat label="Expenses · 30d" value={rs(spent)} />
        <Stat label="Net · 30d" value={rs(w.month.sales - spent)} tone={w.month.sales - spent < 0 ? "text-red-600" : "text-emerald-700"} />
      </section>

      {low.length > 0 && (
        <section>
          <SectionTitle title="Low stock" href="/inventory" />
          <div className="card divide-y divide-line">
            {low.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/inventory/${p.id}`} className="flex items-center justify-between px-4 py-3">
                <span className="truncate">{p.name}</span>
                <span className={`num text-sm font-semibold ${p.stock_qty === 0 ? "text-red-600" : "text-amber-700"}`}>
                  {p.stock_qty === 0 ? "Out" : `${p.stock_qty} left`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="Recent orders" href="/orders" />
        <div className="card divide-y divide-line">
          {recent.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{o.customer_name}</p>
                <p className="text-xs text-muted">{niceDate(o.order_date)} · #{o.id}</p>
              </div>
              <div className="text-right">
                <p className="num text-sm font-semibold">{rs(o.total)}</p>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
          {!recent.length && <p className="px-4 py-6 text-center text-sm text-muted">No orders yet. Tap + to add one.</p>}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub, tone = "" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`num mt-1 text-lg font-semibold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      <Link href={href} className="text-sm text-gold">See all</Link>
    </div>
  );
}
