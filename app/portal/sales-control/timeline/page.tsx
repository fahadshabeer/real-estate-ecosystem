"use client";

import { House } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useSalesTimeline } from "@/hooks/use-sales-control";

export default function SalesTimelinePage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const timelineQuery = useSalesTimeline(developerId);
  const rows = timelineQuery.data ?? [];

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Sales Control</span>
        <span>/</span>
        <span>Sales Timeline</span>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-lg font-semibold text-[#1f2a44]">Chronological Sales Timeline</h1>
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
              <p className="text-xs text-[#7f8a99]">{new Date(row.createdAt).toLocaleString()}</p>
              <p className="mt-1 text-sm font-semibold text-[#1f2a44]">{row.action}</p>
              <p className="text-sm text-[#607187]">
                Request {row.saleRequestId} · {row.actorRole} ({row.actorLabel})
              </p>
              <p className="text-sm text-[#607187]">{row.details}</p>
            </article>
          ))}
          {rows.length === 0 && <p className="text-sm text-[#7f8a99]">No timeline activity yet.</p>}
        </div>
      </section>
    </div>
  );
}
