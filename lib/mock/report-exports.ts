"use client";

export type ReportExportFormat = "PDF" | "Excel" | "CSV";

export type ReportExportRecord = {
  id: string;
  reportType: string;
  format: ReportExportFormat;
  filtersSummary: string;
  generatedBy: string;
  generatedAt: string;
};

type ReportExportState = {
  history: ReportExportRecord[];
};

const STORAGE_KEY = "estateflow_report_exports_v1";

function nowIso() {
  return new Date().toISOString();
}

function readState(): ReportExportState {
  if (typeof window === "undefined") return { history: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { history: [] };
    const parsed = JSON.parse(raw) as ReportExportState;
    return { history: parsed.history ?? [] };
  } catch {
    return { history: [] };
  }
}

function writeState(state: ReportExportState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextId(items: { id: string }[]) {
  const year = new Date().getFullYear();
  const max = items
    .map((item) => item.id)
    .filter((id) => id.startsWith(`RPT-${year}-`))
    .map((id) => Number(id.split("-").pop() || "0"))
    .reduce((a, b) => Math.max(a, b), 0);
  return `RPT-${year}-${String(max + 1).padStart(4, "0")}`;
}

export const reportExportsMock = {
  listHistory() {
    return readState().history.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  },

  generateExport(input: {
    reportType: string;
    format: ReportExportFormat;
    filtersSummary: string;
    generatedBy: string;
  }) {
    const state = readState();
    const row: ReportExportRecord = {
      id: nextId(state.history),
      generatedAt: nowIso(),
      ...input,
    };
    state.history = [row, ...state.history].slice(0, 200);
    writeState(state);
    return row;
  },
};
