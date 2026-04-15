"use client";

import type { AgreementStatus } from "@/lib/backend/types/entities";

export function AgreementStatusPill({ status }: { status: AgreementStatus | string }) {
  const map: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-700",
    "Pending Approval": "bg-amber-100 text-amber-700",
    Active: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    Expired: "bg-rose-100 text-rose-700",
    Suspended: "bg-red-100 text-red-700",
    Renewed: "bg-cyan-100 text-cyan-700",
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-700"}`}>{status}</span>;
}

