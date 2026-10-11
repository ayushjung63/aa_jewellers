"use client";

import { useState, useTransition } from "react";
import { setOrderField } from "@/app/actions";
import { PAYMENTS, VOID } from "@/lib/format";

export function OrderControls({ id, status, payment }: { id: number; status: string; payment: string }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const set = (field: "status" | "payment", value: string) => {
    if (field === "status" && VOID.includes(value) && !VOID.includes(status) && !confirm(`Mark as ${value}? Items go back into stock.`)) return;
    start(async () => setError((await setOrderField(id, field, value))?.error));
  };

  return (
    <section className={`space-y-3 ${pending ? "opacity-60" : ""}`}>
      <Group label="Status" options={[...new Set([status, "Delivered", "Returned"])]} value={status} onPick={(v) => set("status", v)} />
      <Group label="Payment" options={PAYMENTS} value={payment} onPick={(v) => set("payment", v)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

function Group({ label, options, value, onPick }: { label: string; options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" className={`chip ${o === value ? "chip-on" : ""}`} onClick={() => o !== value && onPick(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}
