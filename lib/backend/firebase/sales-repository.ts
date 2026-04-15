import type {
  SaleAttributionRecord,
  SaleDisputeRecord,
  SaleRequestRecord,
  SaleTimelineItem,
} from "@/lib/backend/types/entities";
import type { CreateSaleRequestInput, SalesRepository } from "@/lib/backend/ports/sales-repository";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";

function extractErrorMessage(body: unknown): string | undefined {
  if (body && typeof body === "object" && "ok" in body && (body as { ok: boolean }).ok === false) {
    return (body as { error?: string }).error;
  }
  return undefined;
}

async function authedFetch(path: string, init?: RequestInit) {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  const idToken = await user.getIdToken();
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export const firebaseSalesRepository: SalesRepository = {
  async listDeveloperSaleRequests(developerId) {
    const response = await authedFetch(
      `/api/sales/requests?scope=developer&companyId=${encodeURIComponent(developerId)}`,
    );
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: SaleRequestRecord[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch sale requests.");
    }
    return body.items;
  },

  async listBrokerSaleRequests(brokerId) {
    const response = await authedFetch(
      `/api/sales/requests?scope=broker&companyId=${encodeURIComponent(brokerId)}`,
    );
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: SaleRequestRecord[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch broker sale requests.");
    }
    return body.items;
  },

  async createSaleRequest(input: CreateSaleRequestInput) {
    const response = await authedFetch("/api/sales/requests", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; saleRequest: SaleRequestRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to create sale request.");
    }
    return body.saleRequest;
  },

  async respondSaleRequest(input) {
    const response = await authedFetch("/api/sales/requests/respond", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; saleRequest: SaleRequestRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to update sale request.");
    }
    return body.saleRequest;
  },

  async listSalesTimeline(developerId) {
    const response = await authedFetch(
      `/api/sales/timeline?developerId=${encodeURIComponent(developerId)}`,
    );
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: SaleTimelineItem[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch sales timeline.");
    }
    return body.items;
  },

  async listSalesAttribution(developerId) {
    const response = await authedFetch(
      `/api/sales/attribution?developerId=${encodeURIComponent(developerId)}`,
    );
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: SaleAttributionRecord[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch sales attribution.");
    }
    return body.items;
  },

  async listSalesDisputes(developerId) {
    const response = await authedFetch(
      `/api/sales/disputes?developerId=${encodeURIComponent(developerId)}`,
    );
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: SaleDisputeRecord[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch sales disputes.");
    }
    return body.items;
  },

  async resolveSalesDispute(input) {
    const response = await authedFetch("/api/sales/disputes/resolve", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; dispute: SaleDisputeRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to resolve sales dispute.");
    }
    return body.dispute;
  },
};
