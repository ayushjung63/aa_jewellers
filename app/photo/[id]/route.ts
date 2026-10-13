import { sql } from "@/lib/db";

// Every <img> in the app is ≤80px, so serve the small thumb; older products without one fall back to the full photo.
// URLs carry ?v=<timestamp>, so a changed photo gets a new URL and old ones can be cached forever.
export async function GET(_: Request, ctx: RouteContext<"/photo/[id]">) {
  const { id } = await ctx.params;
  const [row] = await sql`select coalesce(thumb, photo) as photo from products where id = ${id} and photo is not null`;
  if (!row) return new Response(null, { status: 404 });
  return new Response(row.photo, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable" } });
}
