"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, currentUser, token, type User } from "@/lib/auth";
import { sql } from "@/lib/db";

export type State = { error?: string; ok?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(f.get(k) || 0);
const raw = (f: FormData, k: string) => String(f.get(k) ?? ""); // passwords: no trimming
const pgError = (e: unknown) => e as { code?: string; message: string };

async function me() {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}
const log = (u: User, action: string) => sql`insert into activity (username, action) values (${u.username}, ${action})`;

// "price Rs 250 → Rs 300, stock 3 → 5" for the activity log.
const FIELDS: Record<string, [string, boolean?]> = {
  name: ["name"], sku: ["SKU"], cost_price: ["cost", true], sell_price: ["price", true], stock_qty: ["stock"], low_stock_at: ["low-stock alert"],
};
function diff(prev: Record<string, unknown>, next: Record<string, unknown>) {
  const show = (v: unknown, money?: boolean) => (v == null || v === "" ? "–" : money ? `Rs ${v}` : String(v));
  return Object.entries(FIELDS)
    .filter(([k]) => show(prev[k]) !== show(next[k]))
    .map(([k, [label, money]]) => `${label} ${show(prev[k], money)} → ${show(next[k], money)}`);
}

async function setSession(u: { id: number; session_version: number }) {
  (await cookies()).set(COOKIE, token(u), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
}

// ---------- auth ----------
// 5 wrong passwords lock that user for 15 minutes.
export async function login(_: State, f: FormData): Promise<State> {
  const wrong = { error: "Wrong username or password" };
  const [u] = await sql<{ id: number; username: string; session_version: number; locked: boolean; ok: boolean }[]>`
    select id, username, session_version, coalesce(locked_until > now(), false) as locked,
           password_hash = crypt(${raw(f, "password")}, password_hash) as ok
    from users where username = ${str(f, "username").toLowerCase()}`;
  if (!u) return wrong;
  if (u.locked) return { error: "Too many wrong tries. Try again in 15 minutes." };
  if (!u.ok) {
    await sql`
      update users set failed_logins = case when failed_logins >= 4 then 0 else failed_logins + 1 end,
                       locked_until  = case when failed_logins >= 4 then now() + interval '15 minutes' end
      where id = ${u.id}`;
    return wrong;
  }
  await sql`update users set failed_logins = 0, locked_until = null where id = ${u.id}`;
  await setSession(u);
  await log(u, "Signed in");
  redirect("/");
}

export async function changePassword(_: State, f: FormData): Promise<State> {
  const u = await me();
  const next = raw(f, "new_password");
  if (next.length < 8) return { error: "New password needs at least 8 characters" };
  if (next !== raw(f, "confirm")) return { error: "New passwords don't match" };
  const [row] = await sql<{ id: number; session_version: number }[]>`
    update users set password_hash = crypt(${next}, gen_salt('bf', 10)), session_version = session_version + 1
    where id = ${u.id} and password_hash = crypt(${raw(f, "current_password")}, password_hash)
    returning id, session_version`;
  if (!row) return { error: "Current password is wrong" };
  await setSession(row);
  await log(u, "Changed password");
  return { ok: "Password changed. Other devices are signed out." };
}

export async function logout() {
  const u = await currentUser();
  if (u) await log(u, "Signed out");
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

// ---------- products ----------
export async function saveProduct(_: State, f: FormData): Promise<State> {
  const u = await me();
  const id = str(f, "id");
  const row: Record<string, unknown> = {
    name: str(f, "name"),
    sku: str(f, "sku") || null,
    cost_price: num(f, "cost_price"),
    sell_price: num(f, "sell_price"),
    stock_qty: num(f, "stock_qty"),
    low_stock_at: num(f, "low_stock_at"),
  };
  if (!row.name) return { error: "Name is required" };

  const photo = f.get("photo") as File | null;
  if (photo && photo.size > 0) {
    row.photo = Buffer.from(await photo.arrayBuffer());
    const thumb = f.get("thumb") as File | null;
    row.thumb = thumb && thumb.size > 0 ? Buffer.from(await thumb.arrayBuffer()) : null;
  }

  try {
    // Self-join on `prev` returns the pre-update values in the same statement.
    const [saved] = id
      ? await sql`update products set ${sql(row)} from products prev where prev.id = products.id and products.id = ${id}
                  returning products.id, prev.name, prev.sku, prev.cost_price, prev.sell_price, prev.stock_qty, prev.low_stock_at`
      : await sql`insert into products ${sql(row)} returning id`;
    if (row.photo) await sql`update products set image_url = ${`/photo/${saved.id}?v=${Date.now()}`} where id = ${saved.id}`;
    if (id) {
      const changes = [...diff(saved, row), ...(row.photo ? ["new photo"] : [])];
      await log(u, `Edited product ${saved.name}: ${changes.join(", ") || "no changes"}`);
    } else await log(u, `Added product ${row.name} (Rs ${row.sell_price}, stock ${row.stock_qty})`);
  } catch (e) {
    return { error: pgError(e).code === "23505" ? "That SKU is already used" : pgError(e).message };
  }
  revalidatePath("/", "layout");
  redirect("/inventory");
}

export async function deleteProduct(id: number): Promise<State> {
  const u = await me();
  try {
    const [p] = await sql`delete from products where id = ${id} returning name, sell_price, stock_qty`;
    if (p) await log(u, `Deleted product ${p.name} (Rs ${p.sell_price}, stock ${p.stock_qty})`);
  } catch (e) {
    return { error: pgError(e).code === "23503" ? "This product is in past orders, so it can't be deleted. Set stock to 0 instead." : pgError(e).message };
  }
  revalidatePath("/", "layout");
  redirect("/inventory");
}

// ---------- orders ----------
export async function createOrder(
  order: Record<string, string | number>,
  items: { product_id: number; qty: number }[],
): Promise<State> {
  const u = await me();
  if (!String(order.customer_name ?? "").trim()) return { error: "Customer name is required" };
  try {
    const [{ id }] = await sql`select create_order(${sql.json(order)}, ${sql.json(items)}) as id`;
    const [o] = await sql`
      select o.total, o.status, string_agg(i.qty || '× ' || p.name, ', ') as items
      from orders o join order_items i on i.order_id = o.id join products p on p.id = i.product_id
      where o.id = ${id} group by o.id`;
    await log(u, `Created order #${id} for ${order.customer_name}: ${o.items} · Rs ${o.total} (${o.status})`);
  } catch (e) {
    return { error: pgError(e).message };
  }
  revalidatePath("/", "layout");
  redirect("/orders");
}

export async function setOrderField(id: number, field: "status" | "payment", value: string): Promise<State> {
  const u = await me();
  if (field !== "status" && field !== "payment") return { error: "Bad field" };
  try {
    const [prev] = await sql`
      update orders set ${sql({ [field]: value })} from orders prev where prev.id = orders.id and orders.id = ${id}
      returning prev.${sql(field)} as old`;
    if (prev) await log(u, `Order #${id} ${field} ${prev.old} → ${value}`);
  } catch (e) {
    const { message } = pgError(e);
    return { error: message.includes("stock_qty") ? "Not enough stock to re-open this order" : message };
  }
  revalidatePath("/", "layout");
}

// ---------- expenses ----------
export async function addExpense(_: State, f: FormData): Promise<State> {
  const u = await me();
  const row = { title: str(f, "title"), amount: num(f, "amount"), date: str(f, "date") };
  if (!row.title || row.amount <= 0 || !row.date) return { error: "Fill title, amount and date" };
  try {
    await sql`insert into expenses ${sql(row)}`;
    await log(u, `Added expense ${row.title} (Rs ${row.amount})`);
  } catch (e) {
    return { error: pgError(e).message };
  }
  revalidatePath("/", "layout");
}

export async function deleteExpense(id: number) {
  const u = await me();
  const [e] = await sql`delete from expenses where id = ${id} returning title, amount`;
  if (e) await log(u, `Deleted expense ${e.title} (Rs ${e.amount})`);
  revalidatePath("/", "layout");
}
