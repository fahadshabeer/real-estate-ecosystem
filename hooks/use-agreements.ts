"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agreementRepository } from "@/lib/backend/factory";

const PAGE_SIZE = 10;

export function useDeveloperAgreements(developerId?: string) {
  return useInfiniteQuery({
    queryKey: ["agreements", "developer", developerId],
    enabled: Boolean(developerId),
    queryFn: ({ pageParam }) =>
      agreementRepository.listAgreementsPageByDeveloper(developerId ?? "", PAGE_SIZE, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useBrokerAgreements(brokerId?: string) {
  return useInfiniteQuery({
    queryKey: ["agreements", "broker", brokerId],
    enabled: Boolean(brokerId),
    queryFn: ({ pageParam }) =>
      agreementRepository.listAgreementsPageByBroker(brokerId ?? "", PAGE_SIZE, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useAgreementById(agreementId?: string) {
  return useQuery({
    queryKey: ["agreements", "by-id", agreementId],
    enabled: Boolean(agreementId),
    queryFn: () => agreementRepository.getAgreementById(agreementId ?? ""),
  });
}

export function useDeveloperContractRequests(developerId?: string) {
  return useQuery({
    queryKey: ["contract-requests", "developer", developerId],
    enabled: Boolean(developerId),
    queryFn: () => agreementRepository.listContractRequestsByDeveloper(developerId ?? ""),
  });
}

export function useBrokerContractRequests(brokerId?: string) {
  return useQuery({
    queryKey: ["contract-requests", "broker", brokerId],
    enabled: Boolean(brokerId),
    queryFn: () => agreementRepository.listContractRequestsByBroker(brokerId ?? ""),
  });
}

export function useCreateAgreement(developerId?: string, brokerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      developerId: string;
      brokerId: string;
      contractRequestId?: string;
      agreementTitle?: string;
      agreementType?: "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited";
      projectsCovered?: string[];
      projectScope?: string;
      terms: string;
      validityStart: string;
      validityEnd: string;
      commissionRules: string;
      paymentTrigger?: string;
      bonusConditions?: string;
      legalClauses?: string;
      initiatedBy: "developer" | "broker";
      developerSignature?: string;
      status?: "Draft" | "Pending Approval" | "Active" | "Rejected" | "Expired" | "Suspended" | "Renewed";
    }) => agreementRepository.createAgreement(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agreements", "developer", developerId] }),
        queryClient.invalidateQueries({ queryKey: ["agreements", "broker", brokerId] }),
      ]);
    },
  });
}

export function useUpdateAgreement(developerId?: string, brokerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      agreementId: string;
      agreementTitle?: string;
      agreementType?: "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited";
      projectsCovered?: string[];
      projectScope?: string;
      terms?: string;
      validityStart?: string;
      validityEnd?: string;
      commissionRules?: string;
      paymentTrigger?: string;
      bonusConditions?: string;
      legalClauses?: string;
      status?: "Draft" | "Pending Approval" | "Active" | "Rejected" | "Expired" | "Suspended" | "Renewed";
    }) => agreementRepository.updateAgreement(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agreements", "developer", developerId] }),
        queryClient.invalidateQueries({ queryKey: ["agreements", "broker", brokerId] }),
      ]);
    },
  });
}

export function useCreateContractRequest(scope?: { developerId?: string; brokerId?: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      brokerId: string;
      developerId: string;
      note: string;
      initiatedBy?: "developer" | "broker";
    }) =>
      agreementRepository.createContractRequest(input),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["contract-requests", "developer", scope?.developerId ?? variables.developerId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["contract-requests", "broker", scope?.brokerId ?? variables.brokerId],
        }),
      ]);
    },
  });
}

export function useUpdateContractRequestStatus(developerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { requestId: string; action: "Approve" | "Reject" | "Draft Contract" | "Accept" }) =>
      agreementRepository.updateContractRequestStatus(input.requestId, input.action),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["contract-requests", "developer", developerId ?? result.developerId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["contract-requests", "broker", result.brokerId],
        }),
      ]);
    },
  });
}

export function useRespondAgreement(brokerId?: string, developerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { agreementId: string; action: "Accept" | "Reject"; brokerSignature?: string }) =>
      agreementRepository.respondAgreement(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agreements", "broker", brokerId] }),
        queryClient.invalidateQueries({ queryKey: ["agreements", "developer", developerId] }),
      ]);
    },
  });
}
