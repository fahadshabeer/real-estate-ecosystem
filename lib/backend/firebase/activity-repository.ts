import type { ActivityRepository } from "@/lib/backend/ports/activity-repository";
import type { ActivityLogRecord, NotificationRecord } from "@/lib/backend/types/entities";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";

export const firebaseActivityRepository: ActivityRepository = {
  async listNotifications(params) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to fetch notifications.");
    const max = params.limit ?? 20;
    const idToken = await user.getIdToken();
    const query = new URLSearchParams();
    query.set("role", params.role);
    if (params.companyId) query.set("companyId", params.companyId);
    query.set("limit", String(max));

    const response = await fetch(apiUrl(`/api/activity/notifications?${query.toString()}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: NotificationRecord[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      const errorMessage = body && "ok" in body && body.ok === false ? body.error : undefined;
      throw new Error(errorMessage ?? "Failed to fetch notifications.");
    }
    return body.items;
  },

  async listActivityLogs(params) {
    const page = await this.listActivityLogsPage(params);
    return page.items;
  },

  async listActivityLogsPage(params) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to fetch audit logs.");
    const idToken = await user.getIdToken();

    const query = new URLSearchParams();
    if (params.role) query.set("role", params.role);
    if (params.actorLabel) query.set("actorLabel", params.actorLabel);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);

    const response = await fetch(apiUrl(`/api/audit-logs?${query.toString()}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: ActivityLogRecord[]; nextCursor: string | null }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      const errorMessage =
        body && "ok" in body && body.ok === false ? body.error : undefined;
      throw new Error(errorMessage ?? "Failed to fetch audit logs.");
    }
    return { items: body.items, nextCursor: body.nextCursor ?? null };
  },

  async createNotification(input) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to create notifications.");
    const idToken = await user.getIdToken();

    const response = await fetch(apiUrl("/api/activity/notifications"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; notification: NotificationRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      const errorMessage =
        body && "ok" in body && body.ok === false ? body.error : undefined;
      throw new Error(errorMessage ?? "Failed to create notification.");
    }
    return body.notification;
  },

  async createActivityLog(input) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to create activity logs.");
    const idToken = await user.getIdToken();
    const response = await fetch(apiUrl("/api/activity/logs"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; activityLog: ActivityLogRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      const errorMessage =
        body && "ok" in body && body.ok === false ? body.error : undefined;
      throw new Error(errorMessage ?? "Failed to create activity log.");
    }
    return body.activityLog;
  },
};
