import { OrderForm, type Customer, type P } from "./order-form";
import { today } from "@/lib/format";
import { sql } from "@/lib/db";

export default async function NewOrder() {
  const [data, customers] = await Promise.all([
    sql<P[]>`select id, name, sku, sell_price, stock_qty, image_url from products where stock_qty > 0 order by name`,
    // Customers = latest details per name+phone from past orders.
    // ponytail: sends every customer to the phone; fine for a few thousand, search server-side if it grows past that
    sql<Customer[]>`
      select * from (
        select distinct on (lower(customer_name), coalesce(phone, '')) customer_name, phone, address, id
        from orders order by lower(customer_name), coalesce(phone, ''), id desc
      ) c order by id desc`,
  ]);
  return (
    <div className="space-y-5">
      <h1 className="h1">New order</h1>
      <OrderForm products={data} customers={customers} today={today()} />
    </div>
  );
}
