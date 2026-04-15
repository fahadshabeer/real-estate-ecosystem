"use client";

import { useMutation } from "@tanstack/react-query";
import { authRepository } from "@/lib/backend/factory";

export function useSignIn() {
  return useMutation({
    mutationFn: (input: { identifier: string; password: string }) => authRepository.signIn(input),
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: () => authRepository.signOut(),
  });
}
