import type {
  CompanyRepository,
  CreateCompanyInput,
  UpdateCompanyProfileInput,
} from "@/lib/backend/ports/company-repository";
import type { CompanyRecord, CompanyType, PaginatedResult, PageCursor } from "@/lib/backend/types/entities";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";

function extractErrorMessage(body: unknown): string | undefined {
  if (body && typeof body === "object" && "ok" in body && (body as { ok: boolean }).ok === false) {
    return (body as { error?: string }).error;
  }
  return undefined;
}

async function authFetch(path: string, init?: RequestInit) {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  const idToken = await user.getIdToken();
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export const firebaseCompanyRepository: CompanyRepository = {
  async createCompany(input: CreateCompanyInput) {
    const response = await authFetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; company: CompanyRecord }
      | { ok: false; error?: string }
      | null;

    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to create company.");
    }

    return body.company;
  },

  async getCompanyById(id: string) {
    const response = await authFetch(`/api/companies/${encodeURIComponent(id)}`, { method: "GET" });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; company: CompanyRecord | null }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch company.");
    }
    return body.company;
  },

  async updateCompanyProfile(companyId: string, input: UpdateCompanyProfileInput) {
    const response = await authFetch("/api/company/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        ...input,
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; company: CompanyRecord }
      | { ok: false; error?: string }
      | null;

    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to update company profile.");
    }

    return body.company;
  },

  async updateCompanyLogo(companyId: string, logoUrl: string) {
    const response = await authFetch("/api/company/logo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, logoUrl }),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; company: CompanyRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to update company logo.");
    }
    return body.company;
  },

  async updateCompanyStatus(companyId, status, reason) {
    const response = await authFetch("/api/companies/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, status, reason }),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; company: CompanyRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to update company status.");
    }
    return body.company;
  },

  async searchCompanies(type: CompanyType, rawQuery: string, max = 20) {
    const query = rawQuery.trim();
    if (!query) return [];
    const params = new URLSearchParams({
      type,
      query,
      limit: String(max),
    });
    const response = await authFetch(`/api/companies?${params.toString()}`, { method: "GET" });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: CompanyRecord[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to search companies.");
    }
    return body.items;
  },

  async listCompaniesPage(type: CompanyType, pageSize: number, cursor?: PageCursor): Promise<PaginatedResult<CompanyRecord>> {
    const params = new URLSearchParams({
      type,
      limit: String(pageSize),
    });
    if (cursor) params.set("cursor", cursor);
    const response = await authFetch(`/api/companies?${params.toString()}`, { method: "GET" });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: CompanyRecord[]; nextCursor: string | null }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to list companies.");
    }
    return { items: body.items, nextCursor: body.nextCursor ?? null };
  },
};
