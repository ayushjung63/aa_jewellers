import { ExpenseForm } from "./expense-form";
import { deleteExpense } from "@/app/actions";
import { niceDate, rs, today } from "@/lib/format";
import { sql } from "@/lib/db";

export default async function Expenses() {
  // ponytail: recent 300 only; add paging if older months are needed here
  const data = await sql<{ id: number; title: string; amount: number; date: string }[]>`select * from expenses order by date desc, id desc limit 300`;
  const t = today();

  const months = new Map<string, { id: number; title: string; amount: number; date: string }[]>();
  for (const e of data) {
    const key = new Date(e.date + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    months.set(key, [...(months.get(key) ?? []), e]);
  }

  return (
    <div className="space-y-5">
      <h1 className="h1">Expenses</h1>
      <ExpenseForm today={t} />

      {[...months].map(([month, rows]) => (
        <section key={month}>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold">{month}</h2>
            <span className="num text-sm font-semibold">{rs(rows.reduce((s, e) => s + Number(e.amount), 0))}</span>
          </div>
          <div className="card divide-y divide-line">
            {rows.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{e.title}</p>
                  <p className="text-xs text-muted">{niceDate(e.date)}</p>
                </div>
                <span className="num text-sm font-semibold">{rs(e.amount)}</span>
                <form action={deleteExpense.bind(null, e.id)}>
                  <button aria-label={`Delete ${e.title}`} className="grid size-8 place-items-center rounded-full text-muted hover:bg-bg">✕</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      ))}
      {!data.length && <p className="py-6 text-center text-sm text-muted">No expenses logged yet</p>}
    </div>
  );
}
