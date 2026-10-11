import assert from "node:assert/strict";
import { daysAgo, salesWindows } from "./stats.ts";

assert.equal(daysAgo("2026-03-01", 1), "2026-02-28");
assert.equal(daysAgo("2026-10-11", 29), "2026-09-12");

const w = salesWindows(
  [
    { order_date: "2026-10-11", total: "1000.50" },
    { order_date: "2026-10-05", total: 500 }, // 6 days ago → in 7-day window
    { order_date: "2026-10-04", total: 200 }, // 7 days ago → only 30-day
    { order_date: "2026-09-12", total: 100 }, // 29 days ago → 30-day edge
    { order_date: "2026-09-11", total: 999 }, // outside
  ],
  "2026-10-11",
);
assert.deepEqual(w.today, { sales: 1000.5, count: 1 });
assert.deepEqual(w.week, { sales: 1500.5, count: 2 });
assert.deepEqual(w.month, { sales: 1800.5, count: 4 });
console.log("stats ok");
