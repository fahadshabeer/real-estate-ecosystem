"use client";

export function DeveloperConnectionStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Agreement Active": "bg-emerald-100 text-emerald-700",
    "Agreement Pending": "bg-amber-100 text-amber-700",
    Connected: "bg-cyan-100 text-cyan-700",
    "Invitation Sent": "bg-blue-100 text-blue-700",
    Suspended: "bg-rose-100 text-rose-700",
    Terminated: "bg-slate-100 text-slate-700",
    Pending: "bg-blue-100 text-blue-700",
    Rejected: "bg-rose-100 text-rose-700",
  };

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${map[status] ?? map.Terminated}`}>{status}</span>;
}

