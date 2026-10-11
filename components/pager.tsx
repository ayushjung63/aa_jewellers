import Link from "next/link";

export function Pager({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-between">
      {page > 1 ? <Link href={href(page - 1)} className="btn-ghost py-2">← Prev</Link> : <span />}
      <span className="num text-sm text-muted">Page {page} of {pages}</span>
      {page < pages ? <Link href={href(page + 1)} className="btn-ghost py-2">Next →</Link> : <span />}
    </nav>
  );
}
