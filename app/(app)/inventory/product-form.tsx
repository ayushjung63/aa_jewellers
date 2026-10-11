"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, useTransition } from "react";
import { deleteProduct, saveProduct, type State } from "@/app/actions";
import { Thumb } from "./product-list";

export type P = { id: number; name: string; sku: string | null; cost_price: number; sell_price: number; stock_qty: number; low_stock_at: number; image_url: string | null };

// Shrink phone photos (often 3–5 MB) to an ~800px JPEG before upload.
async function shrink(input: HTMLInputElement) {
  const file = input.files?.[0];
  if (!file) return null;
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 800 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.82));
  const dt = new DataTransfer();
  dt.items.add(new File([blob], "photo.jpg", { type: "image/jpeg" }));
  input.files = dt.files;
  return URL.createObjectURL(blob);
}

export function ProductForm({ product }: { product?: P }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const [preview, setPreview] = useState(product?.image_url ?? null);
  const [delState, setDelState] = useState<State>();
  const [deleting, startDelete] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        // Not action={...}: React resets the form after an action, which would wipe the inputs on error.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <label className="flex items-center gap-4">
        <Thumb src={preview} className="size-20" />
        <span className="btn-ghost py-2">{preview ? "Change photo" : "Add photo"}</span>
        <input type="file" name="photo" accept="image/*" className="sr-only" onChange={async (e) => setPreview(await shrink(e.currentTarget))} />
      </label>

      <Field label="Name" name="name" defaultValue={product?.name} required />
      <Field label="SKU / code (optional)" name="sku" defaultValue={product?.sku ?? ""} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Selling price (Rs)" name="sell_price" type="number" defaultValue={product?.sell_price} required />
        <Field label="Cost price (Rs)" name="cost_price" type="number" defaultValue={product?.cost_price ?? 0} />
        <Field label="In stock" name="stock_qty" type="number" defaultValue={product?.stock_qty ?? 1} required />
        <Field label="Warn when at or below" name="low_stock_at" type="number" defaultValue={product?.low_stock_at ?? 3} />
      </div>

      {(state?.error || delState?.error) && <p className="text-sm text-red-600">{state?.error || delState?.error}</p>}
      <button className="btn-gold w-full" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      <div className="flex gap-3">
        <Link href="/inventory" className="btn-ghost flex-1">Cancel</Link>
        {product && (
          <button
            type="button"
            className="btn-ghost flex-1 text-red-600"
            disabled={deleting}
            onClick={() => confirm(`Delete ${product.name}?`) && startDelete(async () => setDelState(await deleteProduct(product.id)))}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, type = "text", ...rest }: { label: string; name: string; type?: string; defaultValue?: string | number; required?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={rest.name}>{label}</label>
      <input className="input num" id={rest.name} type={type} inputMode={type === "number" ? "decimal" : undefined} min={type === "number" ? 0 : undefined} step="any" {...rest} />
    </div>
  );
}
