import type { DecodedIdToken } from "firebase-admin/auth";
import type { AccountRole, WorkspaceRole } from "@/lib/backend/types/entities";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { normalizeAccountRole, toWorkspaceRole } from "@/lib/auth/roles";

export class ApiAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(header: string | null) {
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

export type AuthContext = {
  token: DecodedIdToken;
  uid: string;
  role: AccountRole;
  workspaceRole: WorkspaceRole;
  companyId: string;
  agentId?: string;
  email?: string;
  permissions: string[];
};

export async function requireAuthContext(request: Request): Promise<AuthContext> {
  const bearer = getBearerToken(request.headers.get("authorization"));
  if (!bearer) throw new ApiAuthError("Missing authorization token.", 401);

  const token = await adminAuth.verifyIdToken(bearer);
  const uid = token.uid;
  const profileRef = adminDb.collection("user_profiles").doc(uid);
  const profileSnap = await profileRef.get();

  if (!profileSnap.exists) {
    throw new ApiAuthError("User profile not found.", 403);
  }

  const data = profileSnap.data() as {
    role?: AccountRole | "developer" | "broker" | "agent";
    companyId?: string;
    agentId?: string;
    email?: string;
    permissions?: string[];
  };

  if (!data.role || !data.companyId) {
    throw new ApiAuthError("User profile missing role/company binding.", 403);
  }

  const normalizedRole = normalizeAccountRole(data.role);
  const permissions = Array.isArray(data.permissions) ? data.permissions : normalizedRole.endsWith("_admin") ? ["*"] : [];

  return {
    token,
    uid,
    role: normalizedRole,
    workspaceRole: toWorkspaceRole(normalizedRole),
    companyId: data.companyId,
    agentId: data.agentId,
    email: data.email,
    permissions,
  };
}
