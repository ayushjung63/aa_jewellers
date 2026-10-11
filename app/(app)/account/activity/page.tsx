import Link from "next/link";
import { Pager } from "@/components/pager";
import { niceTime } from "@/lib/format";
import { sql } from "@/lib/db";

const PER_PAGE = 50;

export default async function Activity({ searchParams }: PageProps<"/account/activity">) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const rows = await sql<{ id: number; at: Date; username: string; action: string; total_count: number }[]>`
    select id, at, username, action, (count(*) over ())::int as total_count
    from activity order by id desc limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`;
  const pages = Math.max(1, Math.ceil((rows[0]?.total_count ?? 0) / PER_PAGE));

  return (
    <div className="space-y-4">
      <header>
        <Link href="/account" className="text-sm text-muted">← Account</Link>
        <h1 className="h1 mt-1">Activity</h1>
      </header>
      <div className="card divide-y divide-line">
        {rows.map((a) => (
          <div key={a.id} className="px-4 py-3">
            <p className="text-sm">{a.action}</p>
            <p className="text-xs text-muted"><span className="font-medium text-ink">{a.username}</span> · {niceTime(a.at)}</p>
          </div>
        ))}
        {!rows.length && <p className="px-4 py-8 text-center text-sm text-muted">Nothing yet</p>}
      </div>
      <Pager page={page} pages={pages} href={(p) => `/account/activity?page=${p}`} />
    </div>
  );
}
