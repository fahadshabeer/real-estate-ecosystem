import type { AgentRecord, PaginatedResult, PageCursor } from "@/lib/backend/types/entities";

export type CreateAgentInput = {
  brokerId: string;
  name: string;
  phone: string;
  email: string;
  password: string;
};

export type AgentRepository = {
  createAgent(input: CreateAgentInput): Promise<AgentRecord>;
  listAgentsPageByBroker(brokerId: string, pageSize: number, cursor?: PageCursor): Promise<PaginatedResult<AgentRecord>>;
  getAgentById(agentId: string): Promise<AgentRecord>;
  updateAgent(agentId: string, data: Partial<Pick<AgentRecord, "name" | "phone" | "email" | "status">>): Promise<AgentRecord>;
  deleteAgent(agentId: string): Promise<void>;
};
