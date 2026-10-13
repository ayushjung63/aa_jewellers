import Link from "next/link";
import { Pager } from "@/components/pager";
import { niceDate, rs, VOID } from "@/lib/format";
import { sql } from "@/lib/db";

const PER_PAGE = 30;

// A customer = past orders with the same name (any case) + phone.
export default async function Customers({ searchParams }: PageProps<"/orders/customers">) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const rows = await sql<{ customer_name: string; phone: string | null; orders: number; spent: number; last_order: string; total_count: number }[]>`
    select (array_agg(customer_name order by id desc))[1] as customer_name,
           nullif(coalesce(phone, ''), '') as phone,
           count(*)::int as orders,
           coalesce(sum(total) filter (where status not in ${sql(VOID)}), 0) as spent,
           max(order_date) as last_order,
           (count(*) over ())::int as total_count
    from orders
    group by lower(customer_name), coalesce(phone, '')
    order by max(id) desc
    limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`;
  const total = rows[0]?.total_count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-4">
      <header>
        <Link href="/orders" className="text-sm text-muted">← Orders</Link>
        <h1 className="h1 mt-1">Customers</h1>
        <p className="text-sm text-muted">{total} {total === 1 ? "customer" : "customers"}</p>
      </header>
      <div className="card divide-y divide-line">
        {rows.map((c) => (
          <Link
            key={c.customer_name + c.phone}
            href={`/orders/customers/view?${new URLSearchParams({ name: c.customer_name, phone: c.phone ?? "" })}`}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{c.customer_name}</p>
              <p className="num text-xs text-muted">{c.phone ? `${c.phone} · ` : ""}last {niceDate(c.last_order)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="num text-sm font-semibold">{rs(c.spent)}</p>
              <p className="text-xs text-muted">{c.orders} {c.orders === 1 ? "order" : "orders"}</p>
            </div>
          </Link>
        ))}
        {!rows.length && <p className="px-4 py-8 text-center text-sm text-muted">No customers yet</p>}
      </div>
      <Pager page={page} pages={pages} href={(p) => `/orders/customers?page=${p}`} />
    </div>
  );
}
