"use client";

import { useState } from "react";
import { deleteExpense } from "@/app/actions";
import { niceDate, rs } from "@/lib/format";
import { ExpenseForm, type Expense } from "./expense-form";

export function ExpenseRow({ e }: { e: Expense }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="p-2">
        <ExpenseForm expense={e} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate">{e.title}</p>
        <p className="text-xs text-muted">
          {niceDate(e.date)}{!e.in_profit && " · not in profit"}
        </p>
      </div>
      <span className="num text-sm font-semibold">{rs(e.amount)}</span>
      <button aria-label={`Edit ${e.title}`} onClick={() => setEditing(true)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-bg">✎</button>
      <form action={deleteExpense.bind(null, e.id)}>
        <button aria-label={`Delete ${e.title}`} className="grid size-8 place-items-center rounded-full text-muted hover:bg-bg">✕</button>
      </form>
    </div>
  );
}