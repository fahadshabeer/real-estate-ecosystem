"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesRepository } from "@/lib/backend/factory";

function key(developerId?: string) {
  return ["sales-control", "developer", developerId ?? ""] as const;
}

function brokerKey(brokerId?: string) {
  return ["sales-control", "broker", brokerId ?? ""] as const;
}

export function useSalesRequests(developerId?: string) {
  return useQuery({
    queryKey: [...key(developerId), "requests"],
    enabled: Boolean(developerId),
    queryFn: () => salesRepository.listDeveloperSaleRequests(developerId ?? ""),
  });
}

export function useBrokerSalesRequests(brokerId?: string) {
  return useQuery({
    queryKey: [...brokerKey(brokerId), "requests"],
    enabled: Boolean(brokerId),
    queryFn: () => salesRepository.listBrokerSaleRequests(brokerId ?? ""),
  });
}

export function useSalesTimeline(developerId?: string) {
  return useQuery({
    queryKey: [...key(developerId), "timeline"],
    enabled: Boolean(developerId),
    queryFn: () => salesRepository.listSalesTimeline(developerId ?? ""),
  });
}

export function useSalesAttribution(developerId?: string) {
  return useQuery({
    queryKey: [...key(developerId), "attribution"],
    enabled: Boolean(developerId),
    queryFn: () => salesRepository.listSalesAttribution(developerId ?? ""),
  });
}

export function useSalesDisputes(developerId?: string) {
  return useQuery({
    queryKey: [...key(developerId), "disputes"],
    enabled: Boolean(developerId),
    queryFn: () => salesRepository.listSalesDisputes(developerId ?? ""),
  });
}

export function useBootstrapSalesRequests(_developerId?: string) {
  return useMutation({
    mutationFn: async (_rows: Array<unknown>) => undefined,
  });
}

export function useCreateSaleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      developerId: string;
      brokerId: string;
      agreementId: string;
      propertyId: string;
      propertyCode: string;
      projectName: string;
      unitNumber: string;
      propertyPrice: number;
      brokerAgentId?: string;
      requestNotes?: string;
    }) => salesRepository.createSaleRequest(input),
    onSuccess: async (_result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...key(input.developerId), "requests"] }),
        queryClient.invalidateQueries({ queryKey: [...brokerKey(input.brokerId), "requests"] }),
        queryClient.invalidateQueries({ queryKey: [...key(input.developerId), "timeline"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "developer", input.developerId] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "broker", input.brokerId] }),
      ]);
    },
  });
}

export function useApproveSaleRequest(developerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { saleRequestId: string }) =>
      salesRepository.respondSaleRequest({
        saleRequestId: input.saleRequestId,
        action: "Approve",
      }),
    onSuccess: async (row) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? row.developerId), "requests"] }),
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? row.developerId), "timeline"] }),
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? row.developerId), "attribution"] }),
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? row.developerId), "disputes"] }),
        queryClient.invalidateQueries({ queryKey: [...brokerKey(row.brokerId), "requests"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "developer", developerId ?? row.developerId] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "broker", row.brokerId] }),
      ]);
    },
  });
}

export function useRejectSaleRequest(developerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      saleRequestId: string;
      reason: "duplicate claim" | "incomplete data" | "invalid agreement" | "already sold";
    }) =>
      salesRepository.respondSaleRequest({
        saleRequestId: input.saleRequestId,
        action: "Reject",
        reason: input.reason,
      }),
    onSuccess: async (row) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? row.developerId), "requests"] }),
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? row.developerId), "timeline"] }),
        queryClient.invalidateQueries({ queryKey: [...brokerKey(row.brokerId), "requests"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "developer", developerId ?? row.developerId] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "broker", row.brokerId] }),
      ]);
    },
  });
}

export function useRaiseSaleDispute(developerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { saleRequestId: string }) =>
      salesRepository.respondSaleRequest({
        saleRequestId: input.saleRequestId,
        action: "Dispute",
      }),
    onSuccess: async (row) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? row.developerId), "requests"] }),
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? row.developerId), "timeline"] }),
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? row.developerId), "disputes"] }),
        queryClient.invalidateQueries({ queryKey: [...brokerKey(row.brokerId), "requests"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "developer", developerId ?? row.developerId] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "broker", row.brokerId] }),
      ]);
    },
  });
}

export function useResolveSaleDispute(developerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { disputeId: string; action: "Resolved" | "Rejected" }) =>
      salesRepository.resolveSalesDispute({
        disputeId: input.disputeId,
        action: input.action,
      }),
    onSuccess: async (dispute) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? dispute.developerId), "disputes"] }),
        queryClient.invalidateQueries({ queryKey: [...key(developerId ?? dispute.developerId), "timeline"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "developer", developerId ?? dispute.developerId] }),
        queryClient.invalidateQueries({ queryKey: ["analytics", "broker"] }),
      ]);
    },
  });
}
