"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { activityRepository } from "@/lib/backend/factory";

export function useNotifications(role: "developer" | "broker" | "agent", companyId?: string) {
  return useQuery({
    queryKey: ["notifications", role, companyId],
    enabled: Boolean(companyId),
    queryFn: () => activityRepository.listNotifications({ role, companyId, limit: 30 }),
    refetchInterval: 5000,
  });
}

export function useActivityLogs(params: {
  role?: "developer" | "broker" | "agent";
  actorLabel?: string;
  limit?: number;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ["activity-logs", params.role, params.actorLabel, params.limit, params.from, params.to],
    queryFn: () => activityRepository.listActivityLogs(params),
  });
}

export function useActivityLogsPagination(params: {
  role?: "developer" | "broker" | "agent";
  actorLabel?: string;
  limit?: number;
  from?: string;
  to?: string;
}) {
  const pageSize = params.limit ?? 20;
  return useInfiniteQuery({
    queryKey: ["activity-logs", "paginated", params.role, params.actorLabel, pageSize, params.from, params.to],
    queryFn: ({ pageParam }) =>
      activityRepository.listActivityLogsPage({
        role: params.role,
        actorLabel: params.actorLabel,
        limit: pageSize,
        cursor: pageParam ?? null,
        from: params.from,
        to: params.to,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
