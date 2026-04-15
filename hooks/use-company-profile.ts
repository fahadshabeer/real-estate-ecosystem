"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { companyRepository, storageRepository } from "@/lib/backend/factory";
import type { UpdateCompanyProfileInput } from "@/lib/backend/ports/company-repository";

export function useCompanyProfile(companyId?: string) {
  return useQuery({
    queryKey: ["company", "profile", companyId],
    queryFn: () => companyRepository.getCompanyById(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useUpdateCompanyProfile(companyId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCompanyProfileInput) => {
      if (!companyId) throw new Error("Company ID missing");
      return companyRepository.updateCompanyProfile(companyId, input);
    },
    onSuccess: async () => {
      if (!companyId) return;
      await queryClient.invalidateQueries({ queryKey: ["company", "profile", companyId] });
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}

export function useUpdateCompanyLogo(companyId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!companyId) throw new Error("Company ID missing");
      const logoUrl = await storageRepository.uploadCompanyLogo(file, companyId);
      const company = await companyRepository.updateCompanyLogo(companyId, logoUrl);
      if (!company) throw new Error("Failed to update company logo.");
      return company;
    },
    onSuccess: async () => {
      if (!companyId) return;
      await queryClient.invalidateQueries({ queryKey: ["company", "profile", companyId] });
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
