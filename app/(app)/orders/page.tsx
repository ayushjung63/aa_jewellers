import Link from "next/link";
import { StatusBadge } from "@/components/status";
import { niceDate, rs, STATUSES } from "@/lib/format";
import { sql } from "@/lib/db";

export default async function Orders({ searchParams }: PageProps<"/orders">) {
  const status = (await searchParams).status as string | undefined;
  // ponytail: newest 200 only; add paging when older orders are needed here
  const data = await sql<{ id: number; customer_name: string; order_date: string; total: number; status: string; payment: string; channel: string }[]>`
    select id, customer_name, order_date, total, status, payment, channel from orders
    ${status ? sql`where status = ${status}` : sql``}
    order by order_date desc, id desc limit 200`;

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <h1 className="h1">Orders</h1>
        <Link href="/orders/customers" className="btn-ghost py-2">Customers</Link>
      </header>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {[undefined, ...STATUSES].map((s) => (
          <Link key={s ?? "all"} href={s ? `/orders?status=${s}` : "/orders"} className={`chip ${status === s ? "chip-on" : ""}`}>
            {s ?? "All"}
          </Link>
        ))}
      </div>
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
    </div>
  );
}
