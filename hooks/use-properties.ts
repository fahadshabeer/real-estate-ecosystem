"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { propertyRepository } from "@/lib/backend/factory";

const PAGE_SIZE = 10;

export function useDeveloperProperties(developerId?: string) {
  return useInfiniteQuery({
    queryKey: ["properties", "developer", developerId],
    enabled: Boolean(developerId),
    queryFn: ({ pageParam }) =>
      propertyRepository.listPropertiesPageByDeveloper(developerId ?? "", PAGE_SIZE, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useVisibleBrokerProperties(brokerId?: string) {
  return useQuery({
    queryKey: ["properties", "broker-visible", brokerId],
    enabled: Boolean(brokerId),
    queryFn: () => propertyRepository.listVisiblePropertiesByBroker(brokerId ?? ""),
  });
}

export function useAgreementPropertyMaps(agreementIds: string[]) {
  return useQuery({
    queryKey: ["properties", "agreement-maps", [...agreementIds].sort().join("|")],
    enabled: agreementIds.length > 0,
    queryFn: () => propertyRepository.listAgreementPropertyMapsByAgreementIds(agreementIds),
  });
}

export function useCreateProperty(developerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      developerId: string;
      title: string;
      projectName: string;
      block: string;
      unitNumber: string;
      propertyType: string;
      price: number;
      size: string;
      location: string;
      description: string;
      status: "Available" | "Reserved" | "Sold" | "Hidden";
    }) => propertyRepository.createProperty(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["properties", "developer", developerId] });
    },
  });
}

export function useUpdateProperty(developerId?: string, brokerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      propertyId: string;
      data: Partial<{
        title: string;
        projectName: string;
        block: string;
        unitNumber: string;
        propertyType: string;
        price: number;
        size: string;
        location: string;
        description: string;
        status: "Available" | "Reserved" | "Sold" | "Hidden";
      }>;
    }) => propertyRepository.updateProperty(input.propertyId, input.data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["properties", "developer", developerId] }),
        queryClient.invalidateQueries({ queryKey: ["properties", "broker-visible", brokerId] }),
      ]);
    },
  });
}

export function useShareProperty(developerId?: string, brokerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { agreementId: string; propertyId: string }) =>
      propertyRepository.shareProperty(input.agreementId, input.propertyId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["properties", "developer", developerId] }),
        queryClient.invalidateQueries({ queryKey: ["properties", "broker-visible", brokerId] }),
      ]);
    },
  });
}
