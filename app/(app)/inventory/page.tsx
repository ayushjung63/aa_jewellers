import Link from "next/link";
import { ProductList, type Product } from "./product-list";
import { sql } from "@/lib/db";

export default async function Inventory() {
  const products = await sql<Product[]>`select id, name, sku, sell_price, stock_qty, low_stock_at, image_url from products order by name`;
  const units = products.reduce((s, p) => s + p.stock_qty, 0);

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="h1">Stock</h1>
          <p className="text-sm text-muted">{products.length} products · {units} pieces</p>
        </div>
        <Link href="/inventory/new" className="btn-ghost py-2">+ Add</Link>
      </header>
      <ProductList products={products} />
    </div>
  );
}
