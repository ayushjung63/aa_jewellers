import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderControls } from "./order-controls";
import { Thumb } from "../../inventory/product-list";
import { niceDate, rs } from "@/lib/format";
import { sql } from "@/lib/db";

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const [o] = await sql`select * from orders where id = ${id}`;
  if (!o) notFound();
  const items = await sql<{ qty: number; unit_price: number; id: number; name: string; image_url: string | null }[]>`
    select i.qty, i.unit_price, p.id, p.name, p.image_url from order_items i join products p on p.id = i.product_id where i.order_id = ${id}`;

  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);

  return (
    <div className="space-y-5">
      <header>
        <Link href="/orders" className="text-sm text-muted">← Orders</Link>
        <h1 className="h1 mt-1">
          <Link href={`/orders/customers/view?${new URLSearchParams({ name: o.customer_name, phone: o.phone ?? "" })}`}>{o.customer_name}</Link>
        </h1>
        <p className="text-sm text-muted">#{o.id} · {niceDate(o.order_date)} · {o.channel}</p>
      </header>

      <OrderControls id={o.id} status={o.status} payment={o.payment} />

      {(o.phone || o.address) && (
        <section className="card space-y-1 p-4 text-sm">
          {o.phone && <a href={`tel:${o.phone}`} className="block font-medium text-gold">{o.phone}</a>}
          {o.address && <p className="whitespace-pre-line text-muted">{o.address}</p>}
        </section>
      )}

      <section className="card divide-y divide-line">
        {items.map((i) => (
          <Link key={i.id} href={`/inventory/${i.id}`} className="flex items-center gap-3 px-3 py-2.5">
            <Thumb src={i.image_url} className="size-10" />
            <span className="min-w-0 flex-1 truncate text-sm">{i.name}</span>
            <span className="num text-sm text-muted">{i.qty} × {rs(i.unit_price)}</span>
          </Link>
        ))}
        <div className="space-y-1 p-4">
          {Number(o.discount) > 0 && (
            <>
              <p className="flex justify-between text-sm text-muted"><span>Subtotal</span><span className="num">{rs(subtotal)}</span></p>
              <p className="flex justify-between text-sm text-muted"><span>Discount</span><span className="num">− {rs(o.discount)}</span></p>
            </>
          )}
          <p className="flex items-baseline justify-between"><span className="font-medium">Total</span><span className="num font-serif text-2xl font-semibold">{rs(o.total)}</span></p>
        </div>
      </section>
    </div>
  );
}
