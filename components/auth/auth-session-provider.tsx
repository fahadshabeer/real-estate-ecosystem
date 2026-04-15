"use client";

import { createContext, useContext, useMemo } from "react";
import type { AuthSession } from "@/lib/backend/types/entities";
import { useAuthSessionQuery } from "@/hooks/use-auth-session";

type AuthSessionContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const query = useAuthSessionQuery();

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      session: query.data ?? null,
      isLoading: query.isLoading,
      isAuthenticated: Boolean(query.data),
    }),
    [query.data, query.isLoading],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return ctx;
}
