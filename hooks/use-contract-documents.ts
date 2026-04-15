"use client";

import { useMutation } from "@tanstack/react-query";
import { contractDocumentRepository } from "@/lib/backend/factory";

export function useGenerateContractPdf() {
  return useMutation({
    mutationFn: (agreementId: string) => contractDocumentRepository.generateAgreementPdf(agreementId),
  });
}

export function useDownloadContractPdf() {
  return useMutation({
    mutationFn: ({ downloadUrl, fallbackFileName }: { downloadUrl: string; fallbackFileName?: string }) =>
      contractDocumentRepository.downloadContractPdf(downloadUrl, fallbackFileName),
  });
}
