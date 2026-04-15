"use client";

export type AgreementType = "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited";

export type AgreementMeta = {
  agreementId: string;
  agreementTitle: string;
  agreementType: AgreementType;
  projectsCovered: string[];
  projectScope: string;
  legalClauses: string;
  paymentTrigger: string;
  bonusConditions: string;
  templateName?: string;
  createdAt: string;
  updatedAt: string;
};

export type AgreementTemplate = {
  id: string;
  name: string;
  agreementType: AgreementType;
  commissionRules: string;
  legalClauses: string;
  defaultProjectScope: string;
  createdAt: string;
  updatedAt: string;
};

export type AgreementHistoryItem = {
  id: string;
  agreementId: string;
  action: string;
  actor: string;
  details: string;
  createdAt: string;
};

type AgreementModuleState = {
  metaByAgreementId: Record<string, AgreementMeta>;
  statusOverrideByAgreementId: Record<string, string>;
  templates: AgreementTemplate[];
  history: AgreementHistoryItem[];
};

const STORAGE_KEY = "estateflow_agreement_module_v1";

function nowIso() {
  return new Date().toISOString();
}

function seedTemplates(): AgreementTemplate[] {
  const createdAt = nowIso();
  return [
    {
      id: "TPL-001",
      name: "Standard Non Exclusive",
      agreementType: "Non-Exclusive",
      commissionRules: "2.5% per sale, payable on buyer first installment",
      legalClauses: "Standard resale and cancellation clauses apply.",
      defaultProjectScope: "Selected projects",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "TPL-002",
      name: "Premium Broker Agreement",
      agreementType: "Priority Access",
      commissionRules: "3% with quarterly performance bonus",
      legalClauses: "Priority release window and dispute arbitration clause.",
      defaultProjectScope: "Project + selected towers",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "TPL-003",
      name: "Exclusive Tower Sales",
      agreementType: "Exclusive",
      commissionRules: "3.5% fixed commission",
      legalClauses: "Exclusive territory and sales lock clause enabled.",
      defaultProjectScope: "Single tower exclusive",
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

function readState(): AgreementModuleState {
  if (typeof window === "undefined") {
    return {
      metaByAgreementId: {},
      statusOverrideByAgreementId: {},
      templates: seedTemplates(),
      history: [],
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded: AgreementModuleState = {
        metaByAgreementId: {},
        statusOverrideByAgreementId: {},
        templates: seedTemplates(),
        history: [],
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as AgreementModuleState;
    return {
      metaByAgreementId: parsed.metaByAgreementId ?? {},
      statusOverrideByAgreementId: parsed.statusOverrideByAgreementId ?? {},
      templates: Array.isArray(parsed.templates) && parsed.templates.length ? parsed.templates : seedTemplates(),
      history: parsed.history ?? [],
    };
  } catch {
    return {
      metaByAgreementId: {},
      statusOverrideByAgreementId: {},
      templates: seedTemplates(),
      history: [],
    };
  }
}

function writeState(state: AgreementModuleState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextHistoryId(history: AgreementHistoryItem[]) {
  return `AGH-${new Date().getFullYear()}-${String(history.length + 1).padStart(5, "0")}`;
}

export const agreementModuleMock = {
  getState() {
    return readState();
  },

  getAgreementMeta(agreementId: string) {
    const state = readState();
    return state.metaByAgreementId[agreementId] ?? null;
  },

  saveAgreementMeta(meta: AgreementMeta) {
    const state = readState();
    state.metaByAgreementId[meta.agreementId] = {
      ...meta,
      updatedAt: nowIso(),
    };
    state.history = [
      {
        id: nextHistoryId(state.history),
        agreementId: meta.agreementId,
        action: "Meta Updated",
        actor: "Developer",
        details: `${meta.agreementType} · ${meta.projectsCovered.length} project(s)`,
        createdAt: nowIso(),
      },
      ...state.history,
    ];
    writeState(state);
  },

  setStatusOverride(agreementId: string, status: string, details: string) {
    const state = readState();
    state.statusOverrideByAgreementId[agreementId] = status;
    state.history = [
      {
        id: nextHistoryId(state.history),
        agreementId,
        action: "Status Changed",
        actor: "Developer",
        details,
        createdAt: nowIso(),
      },
      ...state.history,
    ];
    writeState(state);
  },

  getAgreementStatus(agreementId: string, fallbackStatus: string) {
    const state = readState();
    return state.statusOverrideByAgreementId[agreementId] ?? fallbackStatus;
  },

  listTemplates() {
    return readState().templates;
  },

  saveTemplate(input: Omit<AgreementTemplate, "id" | "createdAt" | "updatedAt">) {
    const state = readState();
    const next: AgreementTemplate = {
      id: `TPL-${String(state.templates.length + 1).padStart(3, "0")}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...input,
    };
    state.templates = [next, ...state.templates];
    writeState(state);
    return next;
  },

  listHistory(agreementId?: string) {
    const state = readState();
    return agreementId ? state.history.filter((row) => row.agreementId === agreementId) : state.history;
  },

  addHistory(input: Omit<AgreementHistoryItem, "id" | "createdAt">) {
    const state = readState();
    const next: AgreementHistoryItem = {
      id: nextHistoryId(state.history),
      createdAt: nowIso(),
      ...input,
    };
    state.history = [next, ...state.history];
    writeState(state);
    return next;
  },
};
