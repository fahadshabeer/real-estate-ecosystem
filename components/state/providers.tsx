"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthSessionProvider } from "@/components/auth/auth-session-provider";
import { AppContextProvider } from "@/components/state/app-context";
import { createQueryClient } from "@/lib/query/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <AppContextProvider>{children}</AppContextProvider>
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
