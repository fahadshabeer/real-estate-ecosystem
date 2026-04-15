"use client";

export type BrokerPropertyAssignmentRecord = {
  id: string;
  brokerId: string;
  propertyId: string;
  agreementId: string;
  agentId: string;
  assignedDate: string;
  status: "Assigned" | "Reassigned";
};

type BrokerInventoryState = {
  assignments: BrokerPropertyAssignmentRecord[];
};

const STORAGE_KEY = "estateflow_broker_inventory_v1";

function nowIso() {
  return new Date().toISOString();
}

function readState(): BrokerInventoryState {
  if (typeof window === "undefined") return { assignments: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { assignments: [] };
    const parsed = JSON.parse(raw) as BrokerInventoryState;
    return { assignments: parsed.assignments ?? [] };
  } catch {
    return { assignments: [] };
  }
}

function writeState(state: BrokerInventoryState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextId(records: { id: string }[]) {
  const year = new Date().getFullYear();
  const max = records
    .map((row) => row.id)
    .filter((id) => id.startsWith(`ASN-${year}-`))
    .map((id) => Number(id.split("-").pop() || "0"))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `ASN-${year}-${String(max + 1).padStart(4, "0")}`;
}

export const brokerInventoryMock = {
  listAssignmentsByBroker(brokerId: string) {
    return readState()
      .assignments.filter((row) => row.brokerId === brokerId)
      .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
  },

  assignProperty(input: {
    brokerId: string;
    propertyId: string;
    agreementId: string;
    agentId: string;
  }) {
    const state = readState();
    const existingIndex = state.assignments.findIndex(
      (row) => row.brokerId === input.brokerId && row.propertyId === input.propertyId,
    );
    if (existingIndex >= 0) {
      state.assignments[existingIndex] = {
        ...state.assignments[existingIndex],
        agreementId: input.agreementId,
        agentId: input.agentId,
        assignedDate: nowIso(),
        status: "Reassigned",
      };
      writeState(state);
      return state.assignments[existingIndex];
    }

    const next: BrokerPropertyAssignmentRecord = {
      id: nextId(state.assignments),
      brokerId: input.brokerId,
      propertyId: input.propertyId,
      agreementId: input.agreementId,
      agentId: input.agentId,
      assignedDate: nowIso(),
      status: "Assigned",
    };
    state.assignments = [next, ...state.assignments];
    writeState(state);
    return next;
  },

  removeAssignment(input: { brokerId: string; propertyId: string }) {
    const state = readState();
    state.assignments = state.assignments.filter(
      (row) => !(row.brokerId === input.brokerId && row.propertyId === input.propertyId),
    );
    writeState(state);
  },
};

