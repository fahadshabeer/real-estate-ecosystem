"use client";

import { useMutation } from "@tanstack/react-query";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const { auth } = getFirebaseServices();
      const user = auth.currentUser;
      if (!user) throw new Error("You must be signed in.");
      const idToken = await user.getIdToken();

      const response = await fetch(apiUrl("/api/auth/change-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error?: string }
        | null;
      if (!response.ok || !body?.ok) {
        const message = body && "ok" in body && body.ok === false ? body.error : undefined;
        throw new Error(message ?? "Unable to change password.");
      }
      return true;
    },
  });
}
