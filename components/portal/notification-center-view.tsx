"use client";

import { useMemo, useState } from "react";
import { House, Search, Trash2 } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useNotificationCenter } from "@/hooks/use-notification-center";
import {
  classifyNotification,
  priorityChipClasses,
  type NotificationType,
} from "@/lib/ui/activity-classification";

const titleMap: Record<NotificationType | "all", string> = {
  all: "All Notifications",
  contract: "Contract Alerts",
  broker: "Broker Alerts",
  inventory: "Inventory Alerts",
  sales: "Sales Alerts",
  system: "System Alerts",
};

export function NotificationCenterView({ filter = "all" }: { filter?: NotificationType | "all" }) {
  const { currentUser } = useAppContext();
  const [search, setSearch] = useState("");

  const center = useNotificationCenter({
    role: "developer",
    companyId: currentUser?.companyId,
    userId: currentUser?.id,
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return center.notifications
      .map((item) => ({ item, meta: classifyNotification(item) }))
      .filter((row) => {
        if (filter !== "all" && row.meta.type !== filter) return false;
        if (!q) return true;
        const text = `${row.item.message} ${row.meta.relatedModule}`.toLowerCase();
        return text.includes(q);
      });
  }, [center.notifications, filter, search]);

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
              ? `${urgentCount} urgent items require immediate action.`
              : warningCount > 0
                ? `${warningCount} warning items are pending review.`
                : "No urgent risks detected in notifications."}
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
              {center.isLoading && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    Loading notifications...
                  </td>
                </tr>
              )}
              {!center.isLoading &&
                rows.map(({ item, meta }) => (
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
                        <button
                          type="button"
                          className="rounded-md border border-[#dbe4eb] bg-white px-2 py-1 text-xs text-[#3aa4a8]"
                          onClick={() => center.markAsRead(item.id)}
                        >
                          Mark Read
                        </button>
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
              {!center.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                    No notifications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

