"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AgreementPropertyMapRecord,
  AgreementRecord,
  PropertyRecord,
  SaleAttributionRecord,
  SaleRequestRecord,
} from "@/lib/backend/types/entities";
import { apiUrl } from "@/lib/backend/firebase/api-url";
import { getFirebaseServices } from "@/lib/backend/firebase/client";

type DeveloperAnalyticsPayload = {
  agreements: AgreementRecord[];
  agreementIds: string[];
  maps: AgreementPropertyMapRecord[];
  properties: PropertyRecord[];
  projects: Array<{
    id: string;
    developerId: string;
    code: string;
    name: string;
    city: string;
  }>;
  salesRequests: SaleRequestRecord[];
  salesAttribution: SaleAttributionRecord[];
  brokerPerformanceRows: Array<{
    brokerId: string;
    dealsClosed: number;
    approvalSuccess: number;
    conversionRate: number;
    responseSpeed: "Fast" | "Normal" | "Slow" | "No Data";
    trustScore: number;
    projects: number;
    sharedProperties: number;
  }>;
  projectRows: Array<{
    id: string;
    code: string;
    name: string;
    city: string;
    totalUnits: number;
    sold: number;
    reserved: number;
    available: number;
    blocked: number;
    revenue: number;
    brokerCount: number;
    salesSpeed: "Fast" | "Normal" | "Slow";
    healthScore: number;
  }>;
  inventoryStatus: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    blocked: number;
  };
  typeRows: Array<{
    type: string;
    count: number;
    avgSaleDays: number;
    demandHits: number;
    demandLevel: "Low" | "Medium" | "High";
  }>;
  monthlySales: Array<{
    month: string;
    sold: number;
    pending: number;
    revenue: number;
  }>;
  forecast: {
    approvedRevenue: number;
    pendingRevenue: number;
    projected30d: number;
    approvalRate: number;
    topProject: {
      id: string;
      code: string;
      name: string;
      city: string;
      totalUnits: number;
      sold: number;
      reserved: number;
      available: number;
      blocked: number;
      revenue: number;
      brokerCount: number;
      salesSpeed: "Fast" | "Normal" | "Slow";
      healthScore: number;
    } | null;
  };
  executiveInsights: Array<{
    severity: "urgent" | "warning" | "info";
    text: string;
  }>;
};

async function authJsonFetch<T>(path: string): Promise<T> {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  const idToken = await user.getIdToken();

  const response = await fetch(apiUrl(path), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  const body = (await response.json().catch(() => null)) as
    | { ok: true; [key: string]: unknown }
    | { ok: false; error?: string }
    | null;
  if (!response.ok || !body?.ok) {
    const message = body && "ok" in body && body.ok === false ? body.error : undefined;
    throw new Error(message ?? "Failed to load analytics.");
  }
  return body as T;
}

const EMPTY_ANALYTICS: DeveloperAnalyticsPayload = {
  agreements: [],
  agreementIds: [],
  maps: [],
  properties: [],
  projects: [],
  salesRequests: [],
  salesAttribution: [],
  brokerPerformanceRows: [],
  projectRows: [],
  inventoryStatus: {
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    blocked: 0,
  },
  typeRows: [],
  monthlySales: [],
  forecast: {
    approvedRevenue: 0,
    pendingRevenue: 0,
    projected30d: 0,
    approvalRate: 0,
    topProject: null,
  },
  executiveInsights: [],
};

export function useAnalyticsModule(developerId?: string) {
  const query = useQuery({
    queryKey: ["analytics", "developer", developerId ?? ""],
    enabled: Boolean(developerId),
    queryFn: async () => {
      const body = await authJsonFetch<{ ok: true; analytics: DeveloperAnalyticsPayload }>(
        `/api/analytics/developer?developerId=${encodeURIComponent(developerId ?? "")}`,
      );
      return body.analytics;
    },
    staleTime: 20_000,
  });

  return {
    ...(query.data ?? EMPTY_ANALYTICS),
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    isError: query.isError,
  };
}
