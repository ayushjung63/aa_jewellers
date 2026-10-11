"use client";

import { useActionState } from "react";
import { addExpense } from "@/app/actions";

export function ExpenseForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(addExpense, undefined);
  return (
    <form action={action} className="card space-y-3 p-4">
      <input className="input" name="title" placeholder="What for? e.g. Packaging boxes" required autoComplete="off" />
      <div className="grid grid-cols-2 gap-3">
        <input className="input num" name="amount" type="number" inputMode="decimal" min={0.01} step="any" placeholder="Amount (Rs)" required />
        <input className="input" name="date" type="date" defaultValue={today} required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-gold w-full" disabled={pending}>{pending ? "Adding…" : "Add expense"}</button>
    </form>
  );
}
