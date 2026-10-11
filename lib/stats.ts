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
