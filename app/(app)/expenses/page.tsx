import { ExpenseForm, type Expense } from "./expense-form";
import { ExpenseRow } from "./expense-row";
import { rs, today } from "@/lib/format";
import { sql } from "@/lib/db";

export default async function Expenses() {
  const data = await sql<Expense[]>`select * from expenses order by date desc, id desc limit 300`;
  const t = today();

  const months = new Map<string, Expense[]>();
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
              <ExpenseRow key={`${e.id}-${e.title}-${e.amount}-${e.date}-${e.in_profit}`} e={e} />
            ))}
          </div>
        </section>
      ))}
      {!data.length && <p className="py-6 text-center text-sm text-muted">No expenses logged yet</p>}
    </div>
  );
}