"use client";

import { useMemo, useState } from "react";
import { House, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useActivityLogsPagination } from "@/hooks/use-activity";
import {
  classifyActivityLog,
  priorityChipClasses,
  type LogModule,
} from "@/lib/ui/activity-classification";

const titleMap: Record<LogModule | "all", string> = {
  all: "All Logs",
  agreements: "Agreement Logs",
  brokers: "Broker Logs",
  inventory: "Inventory Logs",
  sales: "Sales Logs",
  system: "System Logs",
};

export function ActivityLogCenterView({ filter = "all" }: { filter?: LogModule | "all" }) {
  const { currentUser } = useAppContext();
  const [search, setSearch] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const logsQuery = useActivityLogsPagination({
    role: "developer",
    actorLabel: currentUser?.companyId,
    limit: 30,
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  });

  const logs = useMemo(
    () => logsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [logsQuery.data?.pages],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs
      .map((log) => ({ log, meta: classifyActivityLog(log) }))
      .filter((row) => {
        if (filter !== "all" && row.meta.module !== filter) return false;
        if (!q) return true;
        return `${row.log.action} ${row.log.details} ${row.meta.reference ?? ""}`.toLowerCase().includes(q);
      });
  }, [filter, logs, search]);

  const selected = rows.find((row) => row.log.id === selectedLogId);

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Notifications</span>
          <span>/</span>
          <span>{titleMap[filter]}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search by action, details or reference"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-10 rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            />
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-10 rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Total Logs</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{rows.length}</p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Urgent Risk Logs</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">
            {rows.filter((row) => row.meta.priority === "urgent").length}
          </p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Executive Alert</p>
          <p className="mt-2 text-sm font-medium text-[#1f2a44]">
            {rows.some((row) => row.meta.module === "sales" && row.meta.priority === "urgent")
              ? "Sales risk detected: urgent sales events require review."
              : "No urgent sales/legal risks in current activity logs."}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logsQuery.isLoading && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    Loading activity logs...
                  </td>
                </tr>
              )}
              {!logsQuery.isLoading &&
                rows.map(({ log, meta }) => (
                  <tr
                    key={log.id}
                    className="cursor-pointer border-t border-[#ecf1f5] hover:bg-[#f8fcff]"
                    onClick={() => setSelectedLogId(log.id)}
                  >
                    <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{log.actorLabel}</td>
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{log.action}</td>
                    <td className="px-4 py-3 capitalize">{meta.module}</td>
                    <td className="px-4 py-3">{meta.reference ?? "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md border px-2 py-1 text-xs font-semibold capitalize ${priorityChipClasses(meta.priority)}`}>
                        {meta.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              {!logsQuery.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-[#ecf1f5] px-4 py-3">
          <button
            type="button"
            disabled={!logsQuery.hasNextPage || logsQuery.isFetchingNextPage}
            onClick={() => logsQuery.fetchNextPage()}
            className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078] disabled:opacity-40"
          >
            {logsQuery.isFetchingNextPage ? "Loading..." : logsQuery.hasNextPage ? "Load More Logs" : "No More Logs"}
          </button>
        </div>
      </section>

      {selected && (
        <section className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1f2a44]">Log Detail</h3>
            <button
              type="button"
              onClick={() => setSelectedLogId(null)}
              className="rounded-md border border-[#dbe4eb] bg-white px-2 py-1 text-xs text-[#4f6078]"
            >
              Close
            </button>
          </div>
          <div className="mt-3 space-y-1 text-sm text-[#4f6078]">
            <p>
              <span className="font-semibold text-[#1f2a44]">Timestamp:</span>{" "}
              {new Date(selected.log.createdAt).toLocaleString()}
            </p>
            <p>
              <span className="font-semibold text-[#1f2a44]">User:</span> {selected.log.actorLabel}
            </p>
            <p>
              <span className="font-semibold text-[#1f2a44]">Action:</span> {selected.log.action}
            </p>
            <p>
              <span className="font-semibold text-[#1f2a44]">Module:</span> {selected.meta.module}
            </p>
            <p>
              <span className="font-semibold text-[#1f2a44]">Reference:</span>{" "}
              {selected.meta.reference ?? "N/A"}
            </p>
            <p>
              <span className="font-semibold text-[#1f2a44]">Details:</span> {selected.log.details}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

