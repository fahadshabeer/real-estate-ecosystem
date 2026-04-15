import type { AuthRepository, SignInInput, SignUpInput } from "@/lib/backend/ports/auth-repository";
import type { AuthSession } from "@/lib/backend/types/entities";
import { clearBackendAuthSession, getStoredBackendSession, setBackendAuthSession } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";
import { normalizeAccountRole, toWorkspaceRole } from "@/lib/auth/roles";

export const firebaseAuthRepository: AuthRepository = {
  async signUp(_input: SignUpInput) {
    throw new Error("Direct client signup is disabled. Use onboarding API.");
  },

  async signIn(input: SignInInput) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let response: Response;
    try {
      response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: input.identifier,
          password: input.password,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Login request timed out. Ensure backend is running (`npm run dev:all`).");
      }
      throw new Error("Unable to reach login service. Ensure backend is running (`npm run dev:all`).");
    } finally {
      clearTimeout(timeout);
    }

    const body = (await response.json().catch(() => null)) as
      | {
          ok: true;
          idToken: string;
          profile: {
            uid: string;
            email: string;
            role?: string | null;
            companyId?: string | null;
            agentId?: string | null;
            permissions?: string[];
          };
        }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      const errorMessage =
        body && "ok" in body && body.ok === false ? body.error : undefined;
      throw new Error(errorMessage ?? "Unable to sign in.");
    }

    const role = normalizeAccountRole(body.profile.role ?? undefined);
    const session: AuthSession = {
      uid: body.profile.uid,
      email: body.profile.email ?? null,
      role,
      companyId: body.profile.companyId ?? undefined,
      agentId: body.profile.agentId ?? undefined,
      workspaceRole: toWorkspaceRole(role),
      permissions: Array.isArray(body.profile.permissions)
        ? body.profile.permissions
        : role.endsWith("_admin")
          ? ["*"]
          : [],
    };

    setBackendAuthSession(body.idToken, session);
    return session;
  },

  async signOut() {
    clearBackendAuthSession();
  },

  async getCurrentSession() {
    return getStoredBackendSession();
  },
};
