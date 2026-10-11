import { notFound } from "next/navigation";
import { ProductForm, type P } from "../product-form";
import { sql } from "@/lib/db";

export default async function EditProduct({ params }: PageProps<"/inventory/[id]">) {
  const { id } = await params;
  const [data] = await sql<P[]>`select id, name, sku, cost_price, sell_price, stock_qty, low_stock_at, image_url from products where id = ${id}`;
  if (!data) notFound();
  return (
    <div className="space-y-5">
      <h1 className="h1">Edit product</h1>
      <ProductForm product={data} />
    </div>
  );
}
