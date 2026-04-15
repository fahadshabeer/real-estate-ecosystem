"use client";

type BrokerInvitation = {
  id: string;
  brokerId?: string;
  companyName: string;
  email: string;
  contactPerson: string;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: string;
};

type SuspendedBroker = {
  reason: string;
  suspendedAt: string;
};

type BrokerNetworkState = {
  invitations: BrokerInvitation[];
  suspended: Record<string, SuspendedBroker>;
};

const STORAGE_KEY = "estateflow_broker_network_v1";

function readState(): BrokerNetworkState {
  if (typeof window === "undefined") return { invitations: [], suspended: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { invitations: [], suspended: {} };
    const parsed = JSON.parse(raw) as BrokerNetworkState;
    return {
      invitations: Array.isArray(parsed.invitations) ? parsed.invitations : [],
      suspended: parsed.suspended ?? {},
    };
  } catch {
    return { invitations: [], suspended: {} };
  }
}

function writeState(state: BrokerNetworkState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const brokerNetworkMock = {
  getState() {
    return readState();
  },

  suspendBroker(brokerId: string, reason: string) {
    const state = readState();
    state.suspended[brokerId] = {
      reason: reason || "Policy compliance review",
      suspendedAt: new Date().toISOString(),
    };
    writeState(state);
  },

  reactivateBroker(brokerId: string) {
    const state = readState();
    delete state.suspended[brokerId];
    writeState(state);
  },

  addInvitation(input: {
    brokerId?: string;
    companyName: string;
    email: string;
    contactPerson: string;
  }) {
    const state = readState();
    const next: BrokerInvitation = {
      id: `INV-${new Date().getFullYear()}-${String(state.invitations.length + 1).padStart(4, "0")}`,
      brokerId: input.brokerId,
      companyName: input.companyName,
      email: input.email,
      contactPerson: input.contactPerson,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    state.invitations = [next, ...state.invitations];
    writeState(state);
    return next;
  },
};

export type { BrokerInvitation, SuspendedBroker };
