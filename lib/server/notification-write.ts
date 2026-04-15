import { FieldValue } from "firebase-admin/firestore";
import type { NotificationRecord } from "@/lib/backend/types/entities";
import { adminDb } from "@/lib/server/firebase-admin";
import { nextServerDeterministicId } from "@/lib/server/id-generator";

export async function createServerNotification(input: Omit<NotificationRecord, "id" | "createdAt">) {
  const id = await nextServerDeterministicId("NOT", "notification");
  await adminDb.collection("notifications").doc(id).set({
    id,
    ...input,
    createdAt: FieldValue.serverTimestamp(),
  });
}
