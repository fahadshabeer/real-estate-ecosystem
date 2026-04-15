"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BrokerPropertyAssignmentRecord } from "@/lib/backend/types/entities";
import { apiUrl } from "@/lib/backend/firebase/api-url";
import { getFirebaseServices } from "@/lib/backend/firebase/client";

async function authJsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  const idToken = await user.getIdToken();

  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as
    | { ok: true; [key: string]: unknown }
    | { ok: false; error?: string }
    | null;

  if (!response.ok || !body?.ok) {
    const message = body && "ok" in body && body.ok === false ? body.error : undefined;
    throw new Error(message ?? "Request failed.");
  }

  return body as T;
}

export function useBrokerPropertyAssignments(brokerId?: string) {
  return useQuery({
    queryKey: ["broker-inventory", "assignments", brokerId ?? ""],
    enabled: Boolean(brokerId),
    queryFn: async () => {
      const body = await authJsonFetch<{ ok: true; items: BrokerPropertyAssignmentRecord[] }>(
        `/api/broker-property-assignments?brokerId=${encodeURIComponent(brokerId ?? "")}`,
        { method: "GET" },
      );
      return body.items ?? [];
    },
  });
}

export function useAssignBrokerProperty(brokerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { brokerId: string; propertyId: string; agreementId: string; agentId: string }) =>
      authJsonFetch<{ ok: true; assignment: BrokerPropertyAssignmentRecord }>("/api/broker-property-assignments", {
        method: "POST",
        body: JSON.stringify(input),
      }).then((body) => body.assignment),
    onSuccess: async (_result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["broker-inventory", "assignments", brokerId ?? input.brokerId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["analytics", "broker", brokerId ?? input.brokerId],
        }),
      ]);
    },
  });
}

export function useRemoveBrokerPropertyAssignment(brokerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { brokerId: string; propertyId: string }) => {
      const query = new URLSearchParams({ brokerId: input.brokerId });
      return authJsonFetch<{ ok: true }>(
        `/api/broker-property-assignments/${encodeURIComponent(input.propertyId)}?${query.toString()}`,
        { method: "DELETE" },
      );
    },
    onSuccess: async (_result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["broker-inventory", "assignments", brokerId ?? input.brokerId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["analytics", "broker", brokerId ?? input.brokerId],
        }),
      ]);
    },
  });
}
