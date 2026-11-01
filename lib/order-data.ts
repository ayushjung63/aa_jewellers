import { sql } from "@/lib/db";
import type { P, Customer } from "@/app/(app)/orders/new/order-form";

export async function loadOrderFormData() {
  const [products, customers] = await Promise.all([
    sql<P[]>`select id, name, sku, sell_price, stock_qty, image_url from products order by name`,
    // Customers = latest details per name+phone from past orders.
    // ponytail: sends every customer to the phone; fine for a few thousand, search server-side if it grows past that
    sql<Customer[]>`
      select * from (
        select distinct on (lower(customer_name), coalesce(phone, '')) customer_name, phone, address, id
        from orders order by lower(customer_name), coalesce(phone, ''), id desc
      ) c order by id desc`,
  ]);
  return { products, customers };
}