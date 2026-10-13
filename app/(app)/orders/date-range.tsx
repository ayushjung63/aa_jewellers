"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { niceDate } from "@/lib/format";
import { addMonths, monthGrid } from "@/lib/stats";

const monthName = (ym: string) => new Date(ym + "-01T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });

// "Custom" chip → bottom sheet calendar. Tap a start day, then an end day, then Apply.
export function DateRange({ from, to, today, active, status }: { from: string; to: string; today: string; active: boolean; status?: string }) {
  const router = useRouter();
  const sheet = useRef<HTMLDialogElement>(null);
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState<string | null>(to);
  const [month, setMonth] = useState(to.slice(0, 7));

  const open = () => {
    setStart(from);
    setEnd(to);
    setMonth(to.slice(0, 7));
    sheet.current?.showModal();
  };
  const pick = (d: string) => {
    if (end || d < start) {
      setStart(d);
      setEnd(null);
    } else setEnd(d);
  };
  const apply = () => {
    sheet.current?.close();
    router.push(`/orders?${new URLSearchParams({ from: start, to: end ?? start, ...(status && { status }) })}`);
  };

  return (
    <>
      <button type="button" onClick={open} className={`chip inline-flex items-center gap-1.5 ${active ? "chip-on" : ""}`}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        {active ? (from === to ? niceDate(from) : `${niceDate(from)} – ${niceDate(to)}`) : "Custom"}
      </button>

      <dialog
        ref={sheet}
        aria-label="Pick dates"
        onClick={(e) => e.target === sheet.current && sheet.current.close()}
        className="mx-auto mt-auto mb-0 w-full max-w-md rounded-t-3xl bg-card p-0 text-ink transition-transform duration-200 backdrop:bg-black/40 starting:open:translate-y-full"
      >
        <div className="space-y-4 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto h-1 w-10 rounded-full bg-line" />

          <div className="flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className="grid size-10 place-items-center rounded-full hover:bg-bg">‹</button>
            <p className="font-serif text-lg font-semibold">{monthName(month)}</p>
            <button type="button" aria-label="Next month" disabled={month >= today.slice(0, 7)} onClick={() => setMonth(addMonths(month, 1))} className="grid size-10 place-items-center rounded-full hover:bg-bg disabled:opacity-30">›</button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs text-muted">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {monthGrid(month).map((d, i) => {
              if (!d) return <span key={i} />;
              const last = end ?? start;
              const edge = d === start || d === last;
              const band = end && end !== start && d >= start && d <= end;
              return (
                <div key={d} className={`${band ? "bg-gold-soft" : ""} ${d === start ? "rounded-l-full" : ""} ${d === last ? "rounded-r-full" : ""}`}>
                  <button
                    type="button"
                    disabled={d > today}
                    onClick={() => pick(d)}
                    aria-pressed={edge}
                    className={`num mx-auto grid size-10 place-items-center rounded-full text-sm disabled:opacity-25 ${edge ? "bg-ink font-semibold text-white" : d === today ? "font-semibold text-gold" : ""}`}
                  >
                    {Number(d.slice(8))}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted">
            {niceDate(start)} – {end ? niceDate(end) : <span className="text-gold">tap end date</span>}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-ghost" onClick={() => sheet.current?.close()}>Cancel</button>
            <button type="button" className="btn-gold" onClick={apply}>Apply</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
