import type { ActivityLogRecord, NotificationRecord, PaginatedResult, PageCursor } from "@/lib/backend/types/entities";

export type ActivityRepository = {
  listNotifications(params: {
    role: "developer" | "broker" | "agent";
    companyId?: string;
    limit?: number;
  }): Promise<NotificationRecord[]>;
  listActivityLogs(params: {
    role?: "developer" | "broker" | "agent";
    actorLabel?: string;
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<ActivityLogRecord[]>;
  listActivityLogsPage(params: {
    role?: "developer" | "broker" | "agent";
    actorLabel?: string;
    limit?: number;
    cursor?: PageCursor;
    from?: string;
    to?: string;
  }): Promise<PaginatedResult<ActivityLogRecord>>;
  createNotification(input: Omit<NotificationRecord, "id" | "createdAt">): Promise<NotificationRecord>;
  createActivityLog(input: Omit<ActivityLogRecord, "id" | "createdAt">): Promise<ActivityLogRecord>;
};
