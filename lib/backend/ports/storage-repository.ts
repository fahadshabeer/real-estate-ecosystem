export type StorageRepository = {
  uploadCompanyLogo(file: File, companyId: string): Promise<string>;
  uploadCompanyAsset(
    file: File,
    companyId: string,
    assetType: "seal" | "cover" | "watermark" | "signature" | "stamp",
  ): Promise<string>;
};
