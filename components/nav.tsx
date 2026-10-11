"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const paths = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  orders: "M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0",
  stock: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9",
  expenses: "M4 6h16v12H4zM4 10h16M8 15h3",
  plus: "M12 5v14M5 12h14",
};

export function Icon({ name, className = "size-6" }: { name: keyof typeof paths; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}

const tabs = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/orders", label: "Orders", icon: "orders" },
  { href: "/inventory", label: "Stock", icon: "stock" },
  { href: "/expenses", label: "Expenses", icon: "expenses" },
] as const;

export function BottomNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const tab = (t: (typeof tabs)[number]) => (
    <Link key={t.href} href={t.href} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${active(t.href) ? "text-ink" : "text-muted"}`}>
      <Icon name={t.icon} className={`size-6 ${active(t.href) ? "stroke-[2.2]" : ""}`} />
      {t.label}
    </Link>
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center px-2">
        {tabs.slice(0, 2).map(tab)}
        <Link href="/orders/new" aria-label="New order" className="mx-2 -mt-6 grid size-14 place-items-center rounded-full bg-gold text-white shadow-lg shadow-gold/30 active:scale-95">
          <Icon name="plus" className="size-7" />
        </Link>
        {tabs.slice(2).map(tab)}
      </div>
    </nav>
  );
}
