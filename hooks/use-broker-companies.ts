"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyRepository } from "@/lib/backend/factory";

const PAGE_SIZE = 10;

export function useBrokerCompaniesPagination() {
  return useInfiniteQuery({
    queryKey: ["companies", "broker", "paginated"],
    queryFn: ({ pageParam }) => companyRepository.listCompaniesPage("broker", PAGE_SIZE, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useCreateBrokerCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      phone: string;
      registrationNumber: string;
    }) =>
      companyRepository.createCompany({
        type: "broker",
        ...input,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies", "broker", "paginated"] });
    },
  });
}

export function useUpdateBrokerCompanyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { companyId: string; status: "active" | "suspended"; reason?: string }) =>
      companyRepository.updateCompanyStatus(input.companyId, input.status, input.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies", "broker", "paginated"] });
    },
  });
}
