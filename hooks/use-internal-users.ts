"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/backend/firebase/api-url";
import { getFirebaseServices } from "@/lib/backend/firebase/client";

export type InternalUserRecord = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  role: string;
  status: "Active" | "Invited" | "Disabled";
  createdAt: string;
};

type CreateInternalUserInput = {
  companyId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  title: string;
};

export function useInternalUsers(companyId?: string) {
  return useQuery({
    queryKey: ["internal-users", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { auth } = getFirebaseServices();
      const user = auth.currentUser;
      if (!user) throw new Error("You must be signed in.");
      const idToken = await user.getIdToken();
      const response = await fetch(apiUrl(`/api/internal-users?companyId=${encodeURIComponent(companyId!)}`), {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; users: InternalUserRecord[] }
        | { ok: false; error?: string }
        | null;
      if (!response.ok || !body?.ok) {
        const errorMessage = body && "ok" in body && body.ok === false ? body.error : undefined;
        throw new Error(errorMessage ?? "Unable to fetch internal users.");
      }
      return body.users;
    },
  });
}

export function useCreateInternalUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInternalUserInput) => {
      const { auth } = getFirebaseServices();
      const user = auth.currentUser;
      if (!user) throw new Error("You must be signed in.");
      const idToken = await user.getIdToken();

      const response = await fetch(apiUrl("/api/internal-users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; user: { uid: string; name: string; email: string; phone: string; title: string } }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        const errorMessage = body && "ok" in body && body.ok === false ? body.error : undefined;
        throw new Error(errorMessage ?? "Unable to create internal user.");
      }

      return body.user;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["internal-users", variables.companyId] });
    },
  });
}
