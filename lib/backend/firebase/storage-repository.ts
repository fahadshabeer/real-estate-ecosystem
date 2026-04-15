import type { StorageRepository } from "@/lib/backend/ports/storage-repository";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";

function extractErrorMessage(body: unknown): string | undefined {
  if (body && typeof body === "object" && "ok" in body && (body as { ok: boolean }).ok === false) {
    return (body as { error?: string }).error;
  }
  return undefined;
}

export const firebaseStorageRepository: StorageRepository = {
  async uploadCompanyLogo(file, companyId) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to upload logos.");
    const idToken = await user.getIdToken();

    const body = new FormData();
    body.append("companyId", companyId);
    body.append("file", file);

    const response = await fetch(apiUrl("/api/storage/company-logo"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body,
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok: true; url: string }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !payload?.ok) {
      throw new Error(extractErrorMessage(payload) ?? "Failed to upload company logo.");
    }

    return payload.url;
  },

  async uploadCompanyAsset(file, companyId, assetType) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to upload settings assets.");
    const idToken = await user.getIdToken();

    const body = new FormData();
    body.append("companyId", companyId);
    body.append("assetType", assetType);
    body.append("file", file);

    const response = await fetch(apiUrl("/api/storage/company-asset"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body,
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok: true; url: string }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !payload?.ok) {
      throw new Error(extractErrorMessage(payload) ?? "Failed to upload company asset.");
    }

    return payload.url;
  },
};
