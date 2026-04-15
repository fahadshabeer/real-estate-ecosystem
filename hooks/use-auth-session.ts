"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authRepository } from "@/lib/backend/factory";

export const AUTH_SESSION_QUERY_KEY = ["auth", "session"] as const;

export function useAuthSessionQuery() {
  return useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: () => authRepository.getCurrentSession(),
    staleTime: 1000 * 15,
  });
}

export function useRefreshAuthSession() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
    await queryClient.refetchQueries({ queryKey: AUTH_SESSION_QUERY_KEY, type: "active" });
  };
}

export function useSignOutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authRepository.signOut(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
    },
  });
}
