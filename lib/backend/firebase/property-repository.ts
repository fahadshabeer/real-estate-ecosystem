import type { CreatePropertyInput, PropertyRepository } from "@/lib/backend/ports/property-repository";
import type { AgreementPropertyMapRecord, PaginatedResult, PropertyRecord } from "@/lib/backend/types/entities";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";

function extractErrorMessage(body: unknown): string | undefined {
  if (body && typeof body === "object" && "ok" in body && (body as { ok: boolean }).ok === false) {
    return (body as { error?: string }).error;
  }
  return undefined;
}

export const firebasePropertyRepository: PropertyRepository = {
  async createProperty(input: CreatePropertyInput) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to create properties.");
    const idToken = await user.getIdToken();

    const response = await fetch(apiUrl("/api/properties"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; property: PropertyRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to create property.");
    }
    return body.property;
  },

  async updateProperty(propertyId, input) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to update properties.");
    const idToken = await user.getIdToken();

    const response = await fetch(apiUrl(`/api/properties/${encodeURIComponent(propertyId)}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; property: PropertyRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to update property.");
    }
    return body.property;
  },

  async listPropertiesPageByDeveloper(developerId, pageSize, cursor) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to view properties.");
    const idToken = await user.getIdToken();

    const query = new URLSearchParams({
      developerId,
      limit: String(pageSize),
    });
    if (cursor) query.set("cursor", cursor);

    const response = await fetch(apiUrl(`/api/properties?${query.toString()}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: PropertyRecord[]; nextCursor: string | null }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to load properties.");
    }
    return { items: body.items, nextCursor: body.nextCursor ?? null } satisfies PaginatedResult<PropertyRecord>;
  },

  async shareProperty(agreementId, propertyId) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to share properties.");
    const idToken = await user.getIdToken();

    const response = await fetch(apiUrl("/api/properties/share"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ agreementId, propertyId }),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; agreementProperty: AgreementPropertyMapRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to share property.");
    }
    return body.agreementProperty;
  },

  async listAgreementPropertyMapsByAgreementIds(agreementIds) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to view agreement maps.");
    if (agreementIds.length === 0) return [];
    const idToken = await user.getIdToken();

    const response = await fetch(
      apiUrl(`/api/properties/agreement-maps?agreementIds=${encodeURIComponent(agreementIds.join(","))}`),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    );

    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: AgreementPropertyMapRecord[] }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to load agreement maps.");
    }
    return body.items;
  },

  async listVisiblePropertiesByBroker(brokerId) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to view broker inventory.");
    const idToken = await user.getIdToken();

    const response = await fetch(apiUrl(`/api/properties/visible?brokerId=${encodeURIComponent(brokerId)}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: Array<PropertyRecord & { agreementId: string; sharedDate: string }> }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to load visible inventory.");
    }
    return body.items;
  },
};
