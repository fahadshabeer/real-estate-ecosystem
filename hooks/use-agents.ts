"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentRepository } from "@/lib/backend/factory";

const PAGE_SIZE = 10;

export function useBrokerAgents(brokerId?: string) {
  return useInfiniteQuery({
    queryKey: ["agents", "broker", brokerId],
    enabled: Boolean(brokerId),
    queryFn: ({ pageParam }) =>
      agentRepository.listAgentsPageByBroker(brokerId ?? "", PAGE_SIZE, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useCreateAgent(brokerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      brokerId: string;
      name: string;
      phone: string;
      email: string;
      password: string;
    }) => agentRepository.createAgent(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agents", "broker", brokerId] });
    },
  });
}

export function useBrokerAgent(agentId?: string) {
  return useQuery({
    queryKey: ["agents", "by-id", agentId ?? ""],
    enabled: Boolean(agentId),
    queryFn: () => agentRepository.getAgentById(agentId ?? ""),
  });
}

export function useUpdateAgent(brokerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      agentId: string;
      data: Partial<{ name: string; phone: string; email: string; status: "Active" | "Disabled" }>;
    }) => agentRepository.updateAgent(input.agentId, input.data),
    onSuccess: async (_updated, input) => {
      await queryClient.invalidateQueries({ queryKey: ["agents", "broker", brokerId] });
      await queryClient.invalidateQueries({ queryKey: ["agents", "by-id", input.agentId] });
    },
  });
}

export function useDeleteAgent(brokerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => agentRepository.deleteAgent(agentId),
    onSuccess: async (_deleted, agentId) => {
      await queryClient.invalidateQueries({ queryKey: ["agents", "broker", brokerId] });
      queryClient.removeQueries({ queryKey: ["agents", "by-id", agentId] });
    },
  });
}
