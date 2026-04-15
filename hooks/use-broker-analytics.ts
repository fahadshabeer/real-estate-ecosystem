"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AgentRecord,
  AgreementRecord,
  BrokerPropertyAssignmentRecord,
  PropertyRecord,
  SaleRequestRecord,
} from "@/lib/backend/types/entities";
import { apiUrl } from "@/lib/backend/firebase/api-url";
import { getFirebaseServices } from "@/lib/backend/firebase/client";

type BrokerVisibleProperty = PropertyRecord & {
  agreementId: string;
  sharedDate: string;
};

type BrokerAnalyticsPayload = {
  sales: SaleRequestRecord[];
  properties: BrokerVisibleProperty[];
  agreements: AgreementRecord[];
  agents: AgentRecord[];
  assignments: BrokerPropertyAssignmentRecord[];
  kpis: {
    submitted: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  monthlySales: Array<{
    month: string;
    submitted: number;
    approved: number;
    rejected: number;
    pending: number;
    approvalRate: number;
  }>;
  developerRows: Array<{
    developerId: string;
    unitsVisible: number;
    salesClosed: number;
    revenue: number;
    responseHours: number;
    responseCount: number;
    revenueContribution: number;
    approvalSpeed: "Fast" | "Normal" | "Slow" | "No Data";
  }>;
  agentRows: Array<{
    agentId: string;
    name: string;
    assignedUnits: number;
    submittedSales: number;
    approvedSales: number;
    rejectedSales: number;
    conversion: number;
    status: "Active" | "Inactive" | "Disabled";
  }>;
  projectRows: Array<{
    projectName: string;
    developerId: string;
    unitsVisible: number;
    submittedSales: number;
    approvedSales: number;
    demandLevel: "Low" | "Medium" | "High";
  }>;
  conversion: {
    overall: number;
    byAgent: Array<{
      label: string;
      id: string;
      value: number;
      approvedSales: number;
      assignedUnits: number;
    }>;
    byDeveloper: Array<{
      id: string;
      value: number;
      approvedSales: number;
      assignedUnits: number;
    }>;
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

const EMPTY_ANALYTICS: BrokerAnalyticsPayload = {
  sales: [],
  properties: [],
  agreements: [],
  agents: [],
  assignments: [],
  kpis: {
    submitted: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  },
  monthlySales: [],
  developerRows: [],
  agentRows: [],
  projectRows: [],
  conversion: {
    overall: 0,
    byAgent: [],
    byDeveloper: [],
  },
  executiveInsights: [],
};

export function useBrokerAnalytics(brokerId?: string) {
  const query = useQuery({
    queryKey: ["analytics", "broker", brokerId ?? ""],
    enabled: Boolean(brokerId),
    queryFn: async () => {
      const body = await authJsonFetch<{ ok: true; analytics: BrokerAnalyticsPayload }>(
        `/api/analytics/broker?brokerId=${encodeURIComponent(brokerId ?? "")}`,
      );
      return body.analytics;
    },
    staleTime: 20_000,
    refetchInterval: brokerId ? 30_000 : false,
    refetchIntervalInBackground: false,
  });

  return {
    ...(query.data ?? EMPTY_ANALYTICS),
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    isError: query.isError,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
