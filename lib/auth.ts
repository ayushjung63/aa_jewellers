import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const COOKIE = "session";
export type User = { id: number; username: string };

const sign = (v: string) => createHmac("sha256", process.env.AUTH_SECRET!).update(v).digest("hex");

// Cookie = "<id>.<session_version>.<hmac>". The version check means a password change logs out every other device.
export const token = (u: { id: number; session_version: number }) => {
  const v = `${u.id}.${u.session_version}`;
  return `${v}.${sign(v)}`;
};

export async function userFromToken(t?: string): Promise<User | null> {
  const [id, ver, mac] = t?.split(".") ?? [];
  if (!mac) return null;
  const good = sign(`${id}.${ver}`);
  if (mac.length !== good.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
  const [u] = await sql<User[]>`select id, username from users where id = ${id} and session_version = ${ver}`;
  return u ?? null;
}

export const currentUser = async () => userFromToken((await cookies()).get(COOKIE)?.value);
