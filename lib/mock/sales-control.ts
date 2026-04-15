"use client";

export type SaleRequestStatus = "Pending" | "Approved" | "Rejected" | "Disputed";

export type SaleRequestRecord = {
  id: string;
  developerId: string;
  brokerId: string;
  agreementId: string;
  propertyId: string;
  propertyCode: string;
  projectName: string;
  unitNumber: string;
  propertyPrice: number;
  submittedAt: string;
  status: SaleRequestStatus;
  brokerAgentId?: string;
  requestNotes?: string;
  rejectReason?: "duplicate claim" | "incomplete data" | "invalid agreement" | "already sold";
  approvedAt?: string;
  rejectedAt?: string;
  disputedAt?: string;
  updatedAt: string;
};

export type SaleTimelineItem = {
  id: string;
  developerId: string;
  saleRequestId: string;
  action:
    | "Submitted"
    | "Reviewed"
    | "Approved"
    | "Rejected"
    | "Dispute Raised"
    | "Dispute Resolved";
  actorRole: "developer" | "broker";
  actorLabel: string;
  details: string;
  createdAt: string;
};

export type SaleAttributionRecord = {
  id: string;
  developerId: string;
  brokerId: string;
  agreementId: string;
  propertyId: string;
  saleRequestId: string;
  soldAt: string;
  soldBy: string;
};

export type SaleDisputeRecord = {
  id: string;
  developerId: string;
  propertyId: string;
  brokerA: string;
  brokerB: string;
  claimTime: string;
  status: "Open" | "Resolved" | "Rejected";
  sourceRequestIds: string[];
  resolvedAt?: string;
};

type SalesControlState = {
  requests: SaleRequestRecord[];
  timeline: SaleTimelineItem[];
  attribution: SaleAttributionRecord[];
  disputes: SaleDisputeRecord[];
};

const STORAGE_KEY = "estateflow_sales_control_v1";

function nowIso() {
  return new Date().toISOString();
}

function readState(): SalesControlState {
  if (typeof window === "undefined") return { requests: [], timeline: [], attribution: [], disputes: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { requests: [], timeline: [], attribution: [], disputes: [] };
    const parsed = JSON.parse(raw) as SalesControlState;
    return {
      requests: parsed.requests ?? [],
      timeline: parsed.timeline ?? [],
      attribution: parsed.attribution ?? [],
      disputes: parsed.disputes ?? [],
    };
  } catch {
    return { requests: [], timeline: [], attribution: [], disputes: [] };
  }
}

function writeState(state: SalesControlState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextId(prefix: string, current: { id: string }[]) {
  const year = new Date().getFullYear();
  const max = current
    .map((row) => row.id)
    .filter((id) => id.startsWith(`${prefix}-${year}-`))
    .map((id) => Number(id.split("-").pop() || "0"))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}

function appendTimeline(state: SalesControlState, row: Omit<SaleTimelineItem, "id" | "createdAt">) {
  state.timeline = [
    {
      id: nextId("TL", state.timeline),
      createdAt: nowIso(),
      ...row,
    },
    ...state.timeline,
  ];
}

export const salesControlMock = {
  listRequests(developerId: string) {
    return readState()
      .requests.filter((row) => row.developerId === developerId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  listBrokerRequests(brokerId: string) {
    return readState()
      .requests.filter((row) => row.brokerId === brokerId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  listTimeline(developerId: string) {
    return readState()
      .timeline.filter((row) => row.developerId === developerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  listAttribution(developerId: string) {
    return readState()
      .attribution.filter((row) => row.developerId === developerId)
      .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
  },

  listDisputes(developerId: string) {
    return readState()
      .disputes.filter((row) => row.developerId === developerId)
      .sort((a, b) => new Date(b.claimTime).getTime() - new Date(a.claimTime).getTime());
  },

  createRequest(input: Omit<SaleRequestRecord, "id" | "status" | "submittedAt" | "updatedAt">) {
    const state = readState();
    const next: SaleRequestRecord = {
      id: nextId("SAL", state.requests),
      status: "Pending",
      submittedAt: nowIso(),
      updatedAt: nowIso(),
      ...input,
    };
    state.requests = [next, ...state.requests];
    appendTimeline(state, {
      developerId: input.developerId,
      saleRequestId: next.id,
      action: "Submitted",
      actorRole: "broker",
      actorLabel: input.brokerId,
      details: `Sale request submitted for ${input.propertyCode}`,
    });
    writeState(state);
    return next;
  },

  bootstrapFromShared(
    developerId: string,
    rows: Array<{
      brokerId: string;
      agreementId: string;
      propertyId: string;
      propertyCode: string;
      projectName: string;
      unitNumber: string;
      propertyPrice: number;
    }>,
  ) {
    const state = readState();
    const existing = state.requests.filter((row) => row.developerId === developerId);
    if (existing.length > 0 || rows.length === 0) return;
    const sample = rows.slice(0, Math.min(rows.length, 3));
    for (const row of sample) {
      this.createRequest({
        developerId,
        brokerId: row.brokerId,
        agreementId: row.agreementId,
        propertyId: row.propertyId,
        propertyCode: row.propertyCode,
        projectName: row.projectName,
        unitNumber: row.unitNumber,
        propertyPrice: row.propertyPrice,
        brokerAgentId: "AGT-2026-0012",
        requestNotes: "Buyer documentation submitted for review.",
      });
    }
  },

  approveRequest(input: { saleRequestId: string; actorLabel: string }) {
    const state = readState();
    const idx = state.requests.findIndex((row) => row.id === input.saleRequestId);
    if (idx < 0) throw new Error("Sale request not found.");
    const current = state.requests[idx];
    state.requests[idx] = {
      ...current,
      status: "Approved",
      approvedAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.attribution = [
      {
        id: nextId("SAT", state.attribution),
        developerId: current.developerId,
        brokerId: current.brokerId,
        agreementId: current.agreementId,
        propertyId: current.propertyId,
        saleRequestId: current.id,
        soldAt: nowIso(),
        soldBy: current.brokerAgentId ?? current.brokerId,
      },
      ...state.attribution,
    ];
    appendTimeline(state, {
      developerId: current.developerId,
      saleRequestId: current.id,
      action: "Approved",
      actorRole: "developer",
      actorLabel: input.actorLabel,
      details: `Approved and locked ${current.propertyCode} as sold`,
    });
    writeState(state);
    return state.requests[idx];
  },

  rejectRequest(input: {
    saleRequestId: string;
    actorLabel: string;
    reason: "duplicate claim" | "incomplete data" | "invalid agreement" | "already sold";
  }) {
    const state = readState();
    const idx = state.requests.findIndex((row) => row.id === input.saleRequestId);
    if (idx < 0) throw new Error("Sale request not found.");
    const current = state.requests[idx];
    state.requests[idx] = {
      ...current,
      status: "Rejected",
      rejectReason: input.reason,
      rejectedAt: nowIso(),
      updatedAt: nowIso(),
    };
    appendTimeline(state, {
      developerId: current.developerId,
      saleRequestId: current.id,
      action: "Rejected",
      actorRole: "developer",
      actorLabel: input.actorLabel,
      details: `Rejected due to ${input.reason}`,
    });
    writeState(state);
    return state.requests[idx];
  },

  raiseDispute(input: { saleRequestId: string; actorLabel: string }) {
    const state = readState();
    const idx = state.requests.findIndex((row) => row.id === input.saleRequestId);
    if (idx < 0) throw new Error("Sale request not found.");
    const current = state.requests[idx];
    const competing = state.requests.find(
      (row) =>
        row.id !== current.id &&
        row.propertyId === current.propertyId &&
        row.developerId === current.developerId &&
        row.brokerId !== current.brokerId &&
        (row.status === "Pending" || row.status === "Disputed"),
    );
    if (!competing) throw new Error("No competing claim found for this property.");

    state.requests[idx] = {
      ...current,
      status: "Disputed",
      disputedAt: nowIso(),
      updatedAt: nowIso(),
    };

    state.disputes = [
      {
        id: nextId("DSP", state.disputes),
        developerId: current.developerId,
        propertyId: current.propertyId,
        brokerA: current.brokerId,
        brokerB: competing.brokerId,
        claimTime: nowIso(),
        status: "Open",
        sourceRequestIds: [current.id, competing.id],
      },
      ...state.disputes,
    ];

    appendTimeline(state, {
      developerId: current.developerId,
      saleRequestId: current.id,
      action: "Dispute Raised",
      actorRole: "developer",
      actorLabel: input.actorLabel,
      details: `Dispute opened for ${current.propertyCode}`,
    });
    writeState(state);
    return state.requests[idx];
  },

  resolveDispute(input: { disputeId: string; actorLabel: string; action: "Resolved" | "Rejected" }) {
    const state = readState();
    const idx = state.disputes.findIndex((row) => row.id === input.disputeId);
    if (idx < 0) throw new Error("Dispute not found.");
    const dispute = state.disputes[idx];
    state.disputes[idx] = {
      ...dispute,
      status: input.action === "Resolved" ? "Resolved" : "Rejected",
      resolvedAt: nowIso(),
    };
    appendTimeline(state, {
      developerId: dispute.developerId,
      saleRequestId: dispute.sourceRequestIds[0],
      action: "Dispute Resolved",
      actorRole: "developer",
      actorLabel: input.actorLabel,
      details: `${input.action} dispute ${dispute.id}`,
    });
    writeState(state);
    return state.disputes[idx];
  },
};

