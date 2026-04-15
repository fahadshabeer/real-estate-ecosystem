"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { companyRepository } from "@/lib/backend/factory";

const PAGE_SIZE = 10;

export function useDeveloperCompaniesPagination() {
  return useInfiniteQuery({
    queryKey: ["companies", "developer", "paginated"],
    queryFn: ({ pageParam }) => companyRepository.listCompaniesPage("developer", PAGE_SIZE, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

