const TZ = process.env.APP_TIMEZONE || "UTC";

export const rs = (n: number | string) =>
  "Rs " + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// YYYY-MM-DD in the shop's timezone (server runs in UTC).
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

export const niceDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const niceTime = (t: Date) =>
  t.toLocaleString("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const CHANNELS = ["Instagram", "Facebook", "WhatsApp", "TikTok", "Website", "Other"];
export const PAYMENTS = ["COD", "Paid", "Unpaid"];
// VOID = order didn't go through; its items go back into stock (schema.sql restock_on_status).
// Cancelled: called off before delivery. Refused: customer didn't accept the parcel.
export const VOID = ["Returned", "Refused", "Cancelled"];
export const STATUSES = ["Pending", "Delivered", ...VOID];
