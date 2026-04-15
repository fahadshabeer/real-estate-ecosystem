import type { AgentRepository, CreateAgentInput } from "@/lib/backend/ports/agent-repository";
import type { AgentRecord, PageCursor, PaginatedResult } from "@/lib/backend/types/entities";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";

function extractErrorMessage(body: unknown): string | undefined {
  if (body && typeof body === "object" && "ok" in body && (body as { ok: boolean }).ok === false) {
    return (body as { error?: string }).error;
  }
  return undefined;
}

export const firebaseAgentRepository: AgentRepository = {
  async createAgent(input: CreateAgentInput) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to create agents.");
    const idToken = await user.getIdToken();
    const response = await fetch(apiUrl("/api/agents"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; agent: AgentRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to create agent.");
    }
    return body.agent;
  },

  async listAgentsPageByBroker(brokerId: string, pageSize: number, cursor?: PageCursor): Promise<PaginatedResult<AgentRecord>> {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to view agents.");
    const idToken = await user.getIdToken();
    const query = new URLSearchParams({
      brokerId,
      limit: String(pageSize),
    });
    if (cursor) query.set("cursor", cursor);

    const response = await fetch(apiUrl(`/api/agents?${query.toString()}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; items: AgentRecord[]; nextCursor: string | null }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch agents.");
    }
    return { items: body.items ?? [], nextCursor: body.nextCursor ?? null };
  },

  async getAgentById(agentId: string) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to view this agent.");
    const idToken = await user.getIdToken();

    const response = await fetch(apiUrl(`/api/agents/${agentId}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; agent: AgentRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to fetch agent.");
    }
    return body.agent;
  },

  async updateAgent(agentId, data) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to update agents.");
    const idToken = await user.getIdToken();

    const response = await fetch(apiUrl(`/api/agents/${agentId}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(data),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; agent: AgentRecord }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to update agent.");
    }
    return body.agent;
  },

  async deleteAgent(agentId) {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to delete agents.");
    const idToken = await user.getIdToken();
    const response = await fetch(apiUrl(`/api/agents/${agentId}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? body?.error ?? "Failed to delete agent.");
    }
  },
};
