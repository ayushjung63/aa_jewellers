"use client";

import { useActionState } from "react";
import { addExpense, updateExpense } from "@/app/actions";

export type Expense = { id: number; title: string; amount: number; date: string; in_profit: boolean };

export function ExpenseForm({ today, expense, onCancel }: { today?: string; expense?: Expense; onCancel?: () => void }) {
  const [state, action, pending] = useActionState(expense ? updateExpense : addExpense, undefined);
  return (
    <form action={action} className="card space-y-3 p-4">
      {expense && <input type="hidden" name="id" value={expense.id} />}
      <input className="input" name="title" defaultValue={expense?.title} placeholder="What for? e.g. Packaging boxes" required autoComplete="off" />
      <div className="grid grid-cols-2 gap-3">
        <input className="input num" name="amount" type="number" inputMode="decimal" min={0.01} step="any" defaultValue={expense?.amount} placeholder="Amount (Rs)" required />
        <input className="input" name="date" type="date" defaultValue={expense?.date ?? today} required />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="in_profit" defaultChecked={expense?.in_profit ?? true} className="size-4" />
        Use this expense for profit calculation
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button className="btn-gold w-full" disabled={pending}>
          {pending ? "Saving…" : expense ? "Save changes" : "Add expense"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="btn w-full">Cancel</button>}
      </div>
    </form>
  );
}