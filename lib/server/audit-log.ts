import { FieldValue } from "firebase-admin/firestore";
import type { WorkspaceRole } from "@/lib/backend/types/entities";
import type { AuthContext } from "@/lib/server/request-auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { nextServerDeterministicId } from "@/lib/server/id-generator";

export async function writeAuditLog(input: {
  actorRole: WorkspaceRole;
  actorLabel: string;
  action: string;
  details: string;
}) {
  const id = await nextServerDeterministicId("LOG", "activity_log");
  await adminDb.collection("activity_logs").doc(id).set({
    id,
    actorRole: input.actorRole,
    actorLabel: input.actorLabel,
    action: input.action,
    details: input.details,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function writeAuditFromAuth(
  auth: AuthContext,
  action: string,
  details: string,
  actorLabel?: string,
) {
  await writeAuditLog({
    actorRole: auth.workspaceRole,
    actorLabel: actorLabel ?? auth.companyId,
    action,
    details,
  });
}
