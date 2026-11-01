import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { today } from "@/lib/format";
import { loadOrderFormData } from "@/lib/order-data";
import { OrderForm } from "../../new/order-form";

export default async function EditOrder({ params }: PageProps<"/orders/[id]/edit">) {
  const { id } = await params;
  const [order] = await sql`select * from orders where id = ${Number(id)}`;
  if (!order) notFound();

  const [rows, { products, customers }] = await Promise.all([
    sql<{ product_id: number; qty: number }[]>`select product_id, qty from order_items where order_id = ${order.id}`,
    loadOrderFormData(),
  ]);
  const items = Object.fromEntries(rows.map((r) => [r.product_id, Number(r.qty)]));

  return (
    <div className="space-y-5">
      <h1 className="h1">Edit order #{order.id}</h1>
      <OrderForm
        products={products}
        customers={customers}
        today={today()}
        initial={{ id: order.id, order: order as any, items }}
      />
    </div>
  );
}