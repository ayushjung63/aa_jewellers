const tone: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Delivered: "bg-emerald-50 text-emerald-700",
  Returned: "bg-red-50 text-red-600",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone[status]}`}>{status}</span>;
}
