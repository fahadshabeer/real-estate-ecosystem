export type GenerateContractPdfResult = {
  documentId: string;
  contractId: string;
  downloadUrl: string;
  verificationUrl: string;
};

export type ContractDocumentRepository = {
  generateAgreementPdf(agreementId: string): Promise<GenerateContractPdfResult>;
  downloadContractPdf(downloadUrl: string, fallbackFileName?: string): Promise<void>;
};
