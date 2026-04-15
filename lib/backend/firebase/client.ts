import type { AuthSession } from "@/lib/backend/types/entities";

const SESSION_STORAGE_TOKEN_KEY = "re.api.idToken";
const SESSION_STORAGE_SESSION_KEY = "re.auth.session";

type StoredUser = {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readToken() {
  if (!canUseStorage()) return null;
  const token = window.localStorage.getItem(SESSION_STORAGE_TOKEN_KEY);
  return token && token.trim() ? token : null;
}

function readSession(): AuthSession | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function createCurrentUser(): StoredUser | null {
  const token = readToken();
  if (!token) return null;
  const session = readSession();
  return {
    uid: session?.uid ?? "unknown",
    email: session?.email ?? null,
    getIdToken: async () => token,
  };
}

export function setBackendAuthSession(token: string, session: AuthSession) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SESSION_STORAGE_TOKEN_KEY, token);
  window.localStorage.setItem(SESSION_STORAGE_SESSION_KEY, JSON.stringify(session));
}

export function clearBackendAuthSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_STORAGE_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_STORAGE_SESSION_KEY);
}

export function getStoredBackendSession(): AuthSession | null {
  return readSession();
}

export function getFirebaseServices() {
  return {
    auth: {
      get currentUser() {
        return createCurrentUser();
      },
    },
    db: null,
    storage: null,
  };
}
