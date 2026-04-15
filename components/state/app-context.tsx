"use client";

import { createContext, useContext } from "react";
import { authRepository, companyRepository, storageRepository } from "@/lib/backend/factory";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { useCompanyProfile } from "@/hooks/use-company-profile";
import { apiUrl } from "@/lib/backend/firebase/api-url";
import type { AccountRole } from "@/lib/backend/types/entities";
import { toWorkspaceRole } from "@/lib/auth/roles";

export type Role = AccountRole;

export type AppUser = {
  id: string;
  role: Role;
  workspaceRole: "developer" | "broker" | "agent";
  permissions: string[];
  email: string;
  companyId?: string;
  agentId?: string;
  name: string;
};

type SignupPayload = {
  accountType: "developer" | "broker";
  companyName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  password: string;
  registrationNumber: string;
  logo?: string;
  logoFile?: File | null;
};

type AppContextValue = {
  currentUser: AppUser | null;
  isLoadingUser: boolean;
  signupCompany: (payload: SignupPayload) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;
  login: (
    identifier: string,
    password: string,
  ) => Promise<{ ok: true; role: Role; workspaceRole: "developer" | "broker" | "agent"; companyId?: string } | { ok: false; error: string }>;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthSession();
  const companyQuery = useCompanyProfile(session?.companyId);

  const currentUser: AppUser | null = session
    ? {
        id: session.uid,
        role: session.role,
        workspaceRole: session.workspaceRole,
        permissions: session.permissions ?? [],
        email: session.email ?? "",
        companyId: session.companyId,
        agentId: session.agentId,
        name: companyQuery.data?.name ? `${companyQuery.data.name} Admin` : `${session.role.toUpperCase()} User`,
      }
    : null;

  const signupCompany: AppContextValue["signupCompany"] = async (payload) => {
    try {
      const response = await fetch(apiUrl("/api/onboarding/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: payload.accountType,
          companyName: payload.companyName,
          email: payload.email,
          phone: payload.phone,
          country: payload.country,
          city: payload.city,
          password: payload.password,
          registrationNumber: payload.registrationNumber,
          logoUrl: payload.logo || undefined,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok: true; id: string }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        const errorMessage =
          body && "ok" in body && body.ok === false ? body.error : undefined;
        return { ok: false, error: errorMessage ?? "Signup failed" };
      }

      if (payload.logoFile) {
        try {
          const uploadedLogoUrl = await storageRepository.uploadCompanyLogo(payload.logoFile, body.id);
          await companyRepository.updateCompanyLogo(body.id, uploadedLogoUrl);
        } catch {
          // Optional logo upload should not block signup.
        }
      }

      return { ok: true, id: body.id };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Signup failed" };
    }
  };

  const login: AppContextValue["login"] = async (identifier, password) => {
    try {
      const normalizedIdentifier = identifier.trim();
      if (!normalizedIdentifier) {
        return { ok: false, error: "Email or Company ID is required." };
      }

      const session = await authRepository.signIn({ identifier: normalizedIdentifier, password });
      return { ok: true, role: session.role, workspaceRole: toWorkspaceRole(session.role), companyId: session.companyId };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  };

  const logout: AppContextValue["logout"] = async () => {
    await authRepository.signOut();
  };

  const value: AppContextValue = {
    currentUser,
    isLoadingUser: isLoading || (Boolean(session?.companyId) && companyQuery.isLoading),
    signupCompany,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return ctx;
}
