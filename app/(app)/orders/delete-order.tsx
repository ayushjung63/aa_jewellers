"use client";

import { useState, useTransition } from "react";
import { deleteOrder } from "@/app/actions";

export function DeleteOrder({ id }: { id: number }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
  <div className="relative">
    <button
      type="button"
      disabled={pending}
      className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white active:scale-[0.98] disabled:opacity-50"
      onClick={() => {
        if (!confirm(`Delete order #${id}? Stock will be returned.`)) return;
        start(async () => setError((await deleteOrder(id))?.error));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
    {error && <p className="absolute right-0 top-full mt-1 whitespace-nowrap text-sm text-red-600">{error}</p>}
  </div>
);
}