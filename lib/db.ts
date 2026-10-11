import postgres from "postgres";

// Keep `date` as "YYYY-MM-DD" strings and `numeric` as numbers, like the pages expect.
export const sql = postgres(process.env.DATABASE_URL!, {
  types: {
    date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x },
    numeric: { to: 1700, from: [1700], serialize: (x: number) => String(x), parse: (x: string) => Number(x) },
  },
});
