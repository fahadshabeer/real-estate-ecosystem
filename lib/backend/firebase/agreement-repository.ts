import type { AgreementRepository, CreateAgreementInput } from "@/lib/backend/ports/agreement-repository";
import type { AgreementRecord, ContractRequestRecord, PaginatedResult, PageCursor } from "@/lib/backend/types/entities";
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

export const firebaseAgreementRepository: AgreementRepository = {
  async getAgreementById(agreementId: string) {
    const response = await authFetch(`/api/agreements/${encodeURIComponent(agreementId)}`, { method: "GET" });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; agreement: AgreementRecord | null }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch agreement.");
    }
    return body.agreement;
  },

  async createAgreement(input: CreateAgreementInput) {
    const response = await authFetch("/api/agreements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; agreement: AgreementRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to create agreement.");
    }
    return body.agreement;
  },

  async updateAgreement(input) {
    const response = await authFetch("/api/agreements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; agreement: AgreementRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to update agreement.");
    }
    return body.agreement;
  },

  async listAgreementsPageByDeveloper(developerId, pageSize, cursor) {
    const params = new URLSearchParams({
      scope: "developer",
      companyId: developerId,
      limit: String(pageSize),
    });
    if (cursor) params.set("cursor", cursor);
    const response = await authFetch(`/api/agreements?${params.toString()}`, { method: "GET" });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: AgreementRecord[]; nextCursor: string | null }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch agreements.");
    }
    return { items: body.items, nextCursor: body.nextCursor ?? null } as PaginatedResult<AgreementRecord>;
  },

  async listAgreementsPageByBroker(brokerId, pageSize, cursor) {
    const params = new URLSearchParams({
      scope: "broker",
      companyId: brokerId,
      limit: String(pageSize),
    });
    if (cursor) params.set("cursor", cursor);
    const response = await authFetch(`/api/agreements?${params.toString()}`, { method: "GET" });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: AgreementRecord[]; nextCursor: string | null }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch agreements.");
    }
    return { items: body.items, nextCursor: body.nextCursor ?? null } as PaginatedResult<AgreementRecord>;
  },

  async respondAgreement(input) {
    const response = await authFetch("/api/agreements/respond", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; agreement: AgreementRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to update agreement.");
    }
    return body.agreement;
  },

  async createContractRequest(input) {
    const response = await authFetch("/api/contract-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; contractRequest: ContractRequestRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to create contract request.");
    }
    return body.contractRequest;
  },

  async listContractRequestsByDeveloper(developerId) {
    const params = new URLSearchParams({ scope: "developer", companyId: developerId });
    const response = await authFetch(`/api/contract-requests?${params.toString()}`, { method: "GET" });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: ContractRequestRecord[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch contract requests.");
    }
    return body.items;
  },

  async listContractRequestsByBroker(brokerId) {
    const params = new URLSearchParams({ scope: "broker", companyId: brokerId });
    const response = await authFetch(`/api/contract-requests?${params.toString()}`, { method: "GET" });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: ContractRequestRecord[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch contract requests.");
    }
    return body.items;
  },

  async updateContractRequestStatus(requestId, action) {
    const response = await authFetch("/api/contract-requests/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; contractRequest: ContractRequestRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to update contract request status.");
    }
    return body.contractRequest;
  },
};
