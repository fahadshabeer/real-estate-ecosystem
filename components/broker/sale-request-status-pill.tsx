"use client";

export function SaleRequestStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    Disputed: "bg-cyan-100 text-cyan-700",
  };

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-700"}`}>{status}</span>;
}

