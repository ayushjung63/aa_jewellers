import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status";
import { niceDate, rs } from "@/lib/format";
import { sql } from "@/lib/db";

export default async function Customer({ searchParams }: PageProps<"/orders/customers/view">) {
  const sp = await searchParams;
  const name = String(sp.name ?? "");
  const phone = String(sp.phone ?? "");
  // ponytail: all of one customer's orders, unpaged; page it if someone passes a few hundred orders
  const orders = await sql<{ id: number; customer_name: string; phone: string | null; address: string | null; order_date: string; total: number; status: string }[]>`
    select id, customer_name, phone, address, order_date, total, status from orders
    where lower(customer_name) = lower(${name}) and coalesce(phone, '') = ${phone}
    order by order_date desc, id desc`;
  if (!orders.length) notFound();

  const latest = orders.reduce((a, b) => (b.id > a.id ? b : a));
  const spent = orders.filter((o) => o.status !== "Returned").reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-5">
      <header>
        <Link href="/orders/customers" className="text-sm text-muted">← Customers</Link>
        <h1 className="h1 mt-1">{latest.customer_name}</h1>
        <p className="text-sm text-muted">{orders.length} {orders.length === 1 ? "order" : "orders"} · {rs(spent)} spent</p>
      </header>

      {(latest.phone || latest.address) && (
        <section className="card space-y-1 p-4 text-sm">
          {latest.phone && <a href={`tel:${latest.phone}`} className="block font-medium text-gold">{latest.phone}</a>}
          {latest.address && <p className="whitespace-pre-line text-muted">{latest.address}</p>}
        </section>
      )}

      <section className="card divide-y divide-line">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm">#{o.id} · {niceDate(o.order_date)}</p>
            <div className="shrink-0 text-right">
              <p className="num text-sm font-semibold">{rs(o.total)}</p>
              <StatusBadge status={o.status} />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
