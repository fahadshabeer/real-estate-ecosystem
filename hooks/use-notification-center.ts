"use client";

import { useEffect, useMemo, useState } from "react";
import type { NotificationRecord } from "@/lib/backend/types/entities";
import { useNotifications } from "@/hooks/use-activity";

function getStorageKey(role: "developer" | "broker" | "agent", userId?: string, suffix?: string) {
  if (!userId) return null;
  return suffix
    ? `estateflow_notifications_${suffix}_${role}_${userId}`
    : `estateflow_notifications_read_${role}_${userId}`;
}

export function useNotificationCenter(params: {
  role: "developer" | "broker" | "agent";
  companyId?: string;
  userId?: string;
}) {
  const query = useNotifications(params.role, params.companyId);
  const notifications = query.data ?? [];

  const readIdsKey = getStorageKey(params.role, params.userId, "read_ids");
  const dismissedIdsKey = getStorageKey(params.role, params.userId, "dismissed_ids");
  const lastReadAtKey = getStorageKey(params.role, params.userId);

  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (readIdsKey) {
      const raw = window.localStorage.getItem(readIdsKey);
      if (raw) {
        try {
          setReadIds(JSON.parse(raw) as string[]);
        } catch {}
      }
    }
    if (dismissedIdsKey) {
      const raw = window.localStorage.getItem(dismissedIdsKey);
      if (raw) {
        try {
          setDismissedIds(JSON.parse(raw) as string[]);
        } catch {}
      }
    }
    if (lastReadAtKey) {
      const raw = window.localStorage.getItem(lastReadAtKey);
      setLastReadAt(raw);
    }
  }, [dismissedIdsKey, lastReadAtKey, readIdsKey]);

  const persistReadIds = (next: string[]) => {
    setReadIds(next);
    if (readIdsKey && typeof window !== "undefined") {
      window.localStorage.setItem(readIdsKey, JSON.stringify(next));
    }
  };

  const persistDismissedIds = (next: string[]) => {
    setDismissedIds(next);
    if (dismissedIdsKey && typeof window !== "undefined") {
      window.localStorage.setItem(dismissedIdsKey, JSON.stringify(next));
    }
  };

  const visibleNotifications = useMemo(
    () => notifications.filter((row) => !dismissedIds.includes(row.id)),
    [dismissedIds, notifications],
  );

  const unreadCount = useMemo(() => {
    return visibleNotifications.filter((row) => {
      if (readIds.includes(row.id)) return false;
      if (!lastReadAt) return true;
      return new Date(row.createdAt).getTime() > new Date(lastReadAt).getTime();
    }).length;
  }, [lastReadAt, readIds, visibleNotifications]);

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    persistReadIds([...readIds, id]);
  };

  const markAllAsRead = () => {
    const nowIso = new Date().toISOString();
    setLastReadAt(nowIso);
    if (lastReadAtKey && typeof window !== "undefined") {
      window.localStorage.setItem(lastReadAtKey, nowIso);
    }
    const allVisibleIds = visibleNotifications.map((row) => row.id);
    persistReadIds(Array.from(new Set([...readIds, ...allVisibleIds])));
  };

  const dismissNotification = (id: string) => {
    if (dismissedIds.includes(id)) return;
    persistDismissedIds([...dismissedIds, id]);
  };

  const isRead = (notification: NotificationRecord) => {
    if (readIds.includes(notification.id)) return true;
    if (!lastReadAt) return false;
    return new Date(notification.createdAt).getTime() <= new Date(lastReadAt).getTime();
  };

  return {
    ...query,
    notifications: visibleNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    isRead,
  };
}

