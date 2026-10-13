// Pure so it can be checked without a database: node lib/stats.test.ts
export function daysAgo(today: string, n: number) {
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

type Row = { order_date: string; total: number | string };

export function salesWindows(orders: Row[], today: string) {
  const windows = { today: 0, week: 6, month: 29 };
  return Object.fromEntries(
    Object.entries(windows).map(([k, n]) => {
      const from = daysAgo(today, n);
      const rows = orders.filter((o) => o.order_date >= from && o.order_date <= today);
      return [k, { sales: rows.reduce((s, o) => s + Number(o.total), 0), count: rows.length }];
    }),
  ) as Record<keyof typeof windows, { sales: number; count: number }>;
}

// Calendar cells for "YYYY-MM", weeks starting Sunday; nulls pad the first week.
export function monthGrid(ym: string): (string | null)[] {
  const first = new Date(ym + "-01T00:00:00Z");
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: days }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`)];
}

export function addMonths(ym: string, n: number) {
  const d = new Date(ym + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}
