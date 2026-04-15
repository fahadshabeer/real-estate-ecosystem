import type { CompanyRecord, CompanyType, PaginatedResult, PageCursor } from "@/lib/backend/types/entities";

export type CreateCompanyInput = {
  type: CompanyType;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  logoUrl?: string;
};

export type UpdateCompanyProfileInput = {
  name: string;
  phone: string;
  registrationNumber: string;
  address?: string;
  contactPerson?: string;
};

export type CompanyRepository = {
  createCompany(input: CreateCompanyInput): Promise<CompanyRecord>;
  updateCompanyProfile(companyId: string, input: UpdateCompanyProfileInput): Promise<CompanyRecord | null>;
  updateCompanyLogo(companyId: string, logoUrl: string): Promise<CompanyRecord | null>;
  updateCompanyStatus(
    companyId: string,
    status: "active" | "suspended",
    reason?: string,
  ): Promise<CompanyRecord | null>;
  getCompanyById(id: string): Promise<CompanyRecord | null>;
  searchCompanies(type: CompanyType, query: string, limit?: number): Promise<CompanyRecord[]>;
  listCompaniesPage(type: CompanyType, pageSize: number, cursor?: PageCursor): Promise<PaginatedResult<CompanyRecord>>;
};
