"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { House, Search, Trash2 } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useNotificationCenter } from "@/hooks/use-notification-center";
import { priorityChipClasses } from "@/lib/ui/activity-classification";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

type BrokerNotificationType = "developer" | "agreement" | "inventory" | "sales" | "agent" | "system";

const titleMap: Record<BrokerNotificationType | "all", string> = {
  all: "All Notifications",
  developer: "Developer Alerts",
  agreement: "Agreement Alerts",
  inventory: "Inventory Alerts",
  sales: "Sales Alerts",
  agent: "Agent Alerts",
  system: "System Alerts",
};

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function classifyBrokerNotification(message: string): {
  type: BrokerNotificationType;
  relatedModule: string;
  priority: "urgent" | "warning" | "info";
} {
  const text = message.toLowerCase();
  const priority = hasAny(text, ["expire", "urgent", "suspend", "rejected", "failed", "risk", "dispute"])
    ? "urgent"
    : hasAny(text, ["pending", "inactive", "warning", "review"])
      ? "warning"
      : "info";

  if (hasAny(text, ["developer", "invitation", "connection", "partner"])) {
    return { type: "developer", relatedModule: "Developers", priority };
  }
  if (hasAny(text, ["agreement", "contract", "renew", "expiry"])) {
    return { type: "agreement", relatedModule: "Agreements", priority };
  }
  if (hasAny(text, ["property", "inventory", "unit", "shared", "project"])) {
    return { type: "inventory", relatedModule: "Inventory", priority };
  }
  if (hasAny(text, ["sale", "sold", "approval", "request"])) {
    return { type: "sales", relatedModule: "Sales", priority };
  }
  if (hasAny(text, ["agent", "assignment", "assigned"])) {
    return { type: "agent", relatedModule: "Agents", priority };
  }
  return { type: "system", relatedModule: "System", priority };
}

function quickActionForType(type: BrokerNotificationType) {
  if (type === "developer") return "Open Developers";
  if (type === "agreement") return "Open Agreements";
  if (type === "inventory") return "Open Inventory";
  if (type === "sales") return "Open Sales";
  if (type === "agent") return "Open Agents";
  return "Open Settings";
}

export function BrokerNotificationCenterView({ filter = "all" }: { filter?: BrokerNotificationType | "all" }) {
  const { currentUser } = useAppContext();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const center = useNotificationCenter({
    role: "broker",
    companyId: currentUser?.companyId,
    userId: currentUser?.id,
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return center.notifications
      .map((item) => ({ item, meta: classifyBrokerNotification(item.message) }))
      .filter((row) => {
        if (filter !== "all" && row.meta.type !== filter) return false;
        if (!q) return true;
        return `${row.item.message} ${row.meta.relatedModule}`.toLowerCase().includes(q);
      });
  }, [center.notifications, filter, search]);
  const isInitialLoading = center.isLoading && rows.length === 0;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, rows]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const urgentCount = rows.filter((row) => row.meta.priority === "urgent").length;
  const warningCount = rows.filter((row) => row.meta.priority === "warning").length;

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
              placeholder="Search notifications"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-[#f3c9c9] bg-[#fff2f2] px-3 py-2 text-xs font-semibold text-[#b64646]">
              Urgent: {urgentCount}
            </span>
            <span className="rounded-md border border-[#f1dfb0] bg-[#fff9ec] px-3 py-2 text-xs font-semibold text-[#9a6a00]">
              Warnings: {warningCount}
            </span>
            <button
              type="button"
              onClick={center.markAllAsRead}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs font-medium text-[#3aa4a8]"
            >
              Mark All Read
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Unread Notifications</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{center.unreadCount}</p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Total Alerts</p>
          <p className="mt-2 text-xl font-semibold text-[#1f2a44]">{rows.length}</p>
        </article>
        <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
          <p className="text-xs text-[#7f8a99]">Smart Summary</p>
          <p className="mt-2 text-sm font-medium text-[#1f2a44]">
            {urgentCount > 0
              ? `${urgentCount} urgent actions require attention.`
              : warningCount > 0
                ? `${warningCount} warnings are pending review.`
                : "No critical alert right now."}
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
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Related Module</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading && <TableSkeletonRows cols={6} rows={8} />}
              {!isInitialLoading &&
                pageRows.map(({ item, meta }) => (
                  <tr
                    key={item.id}
                    className={`border-t border-[#ecf1f5] ${center.isRead(item) ? "bg-white" : "bg-[#f8fcff]"}`}
                  >
                    <td className="px-4 py-3 capitalize">{meta.type}</td>
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{item.message}</td>
                    <td className="px-4 py-3">{meta.relatedModule}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md border px-2 py-1 text-xs font-semibold capitalize ${priorityChipClasses(meta.priority)}`}>
                        {meta.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!center.isRead(item) ? (
                          <button
                            type="button"
                            className="rounded-md border border-[#dbe4eb] bg-white px-2 py-1 text-xs text-[#3aa4a8]"
                            onClick={() => center.markAsRead(item.id)}
                          >
                            Mark Read
                          </button>
                        ) : null}
                        <Link
                          href={quickActionForType(meta.type)}
                          className="rounded-md border border-[#dbe4eb] bg-white px-2 py-1 text-xs text-[#4f6078]"
                        >
                          {quickActionForType(meta.type)}
                        </Link>
                        <button
                          type="button"
                          className="inline-flex rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500"
                          title="Dismiss notification"
                          aria-label="Dismiss notification"
                          onClick={() => center.dismissNotification(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isInitialLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No notifications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isInitialLoading && rows.length > 0 && (
          <div className="flex items-center justify-end gap-4 border-t border-[#ecf1f5] px-4 py-3 text-sm text-[#7f8a99]">
            <span>
              Currently at Page: {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-[#1f2a44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-[#1f2a44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
