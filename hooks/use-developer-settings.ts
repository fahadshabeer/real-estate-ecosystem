"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";

type UserRole = "Super Admin" | "Sales Director" | "Inventory Manager" | "Legal Manager" | "Analyst";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  status: "Active" | "Invited" | "Disabled";
  createdAt: string;
};

export type LoginHistoryItem = {
  id: string;
  date: string;
  device: string;
  ip: string;
  location: string;
};

export type DeveloperSettingsState = {
  profileExtra: {
    taxOrLicenseNumber: string;
    country: string;
    city: string;
    sealDataUrl?: string;
    coverImageDataUrl?: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    watermarkDataUrl?: string;
    footerBranding: string;
    signatureDataUrl?: string;
    stampDataUrl?: string;
  };
  users: TeamMember[];
  security: {
    emailVerified: boolean;
    twoFaEnabled: boolean;
    otpLoginEnabled: boolean;
    newLoginAlert: boolean;
    loginHistory: LoginHistoryItem[];
  };
  legal: {
    jurisdiction: string;
    legalFooterText: string;
    signatureAuthority: string;
    brokerLicenseReference?: string;
    defaultAgreementDurationMonths: number;
    defaultCommissionPercent: number;
    expiryReminderDays: number;
  };
  preferences: {
    language: "English" | "Arabic";
    timezone: string;
    currency: "QAR" | "USD";
    emailAlerts: boolean;
    dashboardAlerts: boolean;
  };
};

async function getToken() {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in.");
  }
  return user.getIdToken();
}

export function useDeveloperSettings(companyId?: string) {
  return useQuery({
    queryKey: ["developer-settings", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const idToken = await getToken();
      const response = await fetch(apiUrl("/api/company/settings"), {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; settings: DeveloperSettingsState }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        const message = body && "ok" in body && body.ok === false ? body.error : undefined;
        throw new Error(message ?? "Failed to load settings.");
      }
      return body.settings;
    },
  });
}

export function useUpdateDeveloperSettings(companyId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updater: (prev: DeveloperSettingsState) => DeveloperSettingsState) => {
      if (!companyId) throw new Error("Company ID missing");
      const prev = queryClient.getQueryData<DeveloperSettingsState>(["developer-settings", companyId]);
      if (!prev) throw new Error("Settings are not loaded yet.");
      const next = updater(prev);
      const idToken = await getToken();
      const response = await fetch(apiUrl("/api/company/settings"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ companyId, settings: next }),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; settings: DeveloperSettingsState }
        | { ok: false; error?: string }
        | null;
      if (!response.ok || !body?.ok) {
        const message = body && "ok" in body && body.ok === false ? body.error : undefined;
        throw new Error(message ?? "Failed to update settings.");
      }
      return body.settings;
    },
    onSuccess: async (_settings) => {
      if (!companyId) return;
      await queryClient.invalidateQueries({ queryKey: ["developer-settings", companyId] });
    },
  });
}

export function nextUserId(existing: TeamMember[]) {
  const year = new Date().getFullYear();
  const max = existing
    .map((row) => row.id)
    .filter((id) => id.startsWith(`USR-${year}-`))
    .map((id) => Number(id.split("-").pop() || "0"))
    .reduce((a, b) => Math.max(a, b), 0);
  return `USR-${year}-${String(max + 1).padStart(4, "0")}`;
}
