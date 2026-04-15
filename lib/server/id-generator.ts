import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";

export async function nextServerDeterministicId(prefix: string, counterKey: string): Promise<string> {
  return adminDb.runTransaction(async (tx) => {
    const counterRef = adminDb.collection("meta").doc(counterKey);
    const counterSnap = await tx.get(counterRef);
    const currentSeq = Number(counterSnap.data()?.seq ?? 0);
    const nextSeq = currentSeq + 1;
    const year = new Date().getUTCFullYear();
    const id = `${prefix}-${year}-${String(nextSeq).padStart(4, "0")}`;

    tx.set(
      counterRef,
      {
        seq: nextSeq,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return id;
  });
}

