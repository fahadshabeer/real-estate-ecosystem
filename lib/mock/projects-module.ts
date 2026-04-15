"use client";

export type ProjectStatus = "active" | "completed" | "archived";
export type ProjectType = "Residential" | "Commercial" | "Mixed Use";
export type UnitStatus = "available" | "reserved" | "sold" | "blocked";
export type DocumentVisibility = "internal" | "broker";

export type ProjectUnit = {
  id: string;
  tower: string;
  floor: string;
  unitNumber: string;
  type: string;
  size: string;
  price: number;
  status: UnitStatus;
  shared: boolean;
};

export type ProjectPhase = {
  id: string;
  projectId: string;
  name: string;
  type: string;
  unitsCount: number;
  status: "active" | "planning" | "completed";
};

export type ProjectDocument = {
  id: string;
  projectId: string;
  fileName: string;
  fileType: "brochure" | "approval" | "payment-plan" | "floor-plan" | "other";
  visibility: DocumentVisibility;
  uploadedAt: string;
};

export type ProjectShare = {
  id: string;
  projectId: string;
  brokerId: string;
  mode: "full" | "partial" | "agreement-restricted";
  notes?: string;
  sharedAt: string;
};

export type ProjectRecord = {
  id: string;
  code: string;
  name: string;
  city: string;
  area: string;
  address: string;
  projectType: ProjectType;
  launchDate: string;
  expectedDeliveryDate: string;
  municipalityApprovalNumber: string;
  permitReference: string;
  logoUrl?: string;
  mainImageUrl?: string;
  brochureFileName?: string;
  masterplanFileName?: string;
  paymentPlanAvailable: boolean;
  bookingPercentage: number;
  handoverPercentage: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  units: ProjectUnit[];
  phases: ProjectPhase[];
  documents: ProjectDocument[];
  shares: ProjectShare[];
  notes?: string;
};

const STORAGE_KEY = "estateflow_projects_module_v1";

function nowIso() {
  return new Date().toISOString();
}

function yearNow() {
  return new Date().getFullYear();
}

function readRaw(): ProjectRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedProjects();
  try {
    const parsed = JSON.parse(raw) as ProjectRecord[];
    if (!Array.isArray(parsed)) return seedProjects();
    return parsed;
  } catch {
    return seedProjects();
  }
}

function writeRaw(items: ProjectRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function nextProjectCode(items: ProjectRecord[]) {
  const prefix = `PRJ-QA-${yearNow()}-`;
  const seq = items
    .map((project) => project.code)
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.split("-").pop() || "0"))
    .filter((num) => Number.isFinite(num));
  const next = (seq.length ? Math.max(...seq) : 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

function nextId(prefix: string, items: { id: string }[]) {
  const seq = items
    .map((item) => item.id)
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.split("-").pop() || "0"))
    .filter((num) => Number.isFinite(num));
  const next = (seq.length ? Math.max(...seq) : 0) + 1;
  return `${prefix}-${yearNow()}-${String(next).padStart(4, "0")}`;
}

function seedProjects(): ProjectRecord[] {
  const created = nowIso();
  const demo: ProjectRecord[] = [
    {
      id: "project-1",
      code: `PRJ-QA-${yearNow()}-001`,
      name: "Lusail Heights",
      city: "Doha",
      area: "Lusail",
      address: "Marina District, Lusail, Doha",
      projectType: "Mixed Use",
      launchDate: `${yearNow()}-01-15`,
      expectedDeliveryDate: `${yearNow() + 2}-12-30`,
      municipalityApprovalNumber: "MUN-LUS-12844",
      permitReference: "PRMT-DOH-99812",
      paymentPlanAvailable: true,
      bookingPercentage: 10,
      handoverPercentage: 30,
      status: "active",
      createdAt: created,
      updatedAt: created,
      notes: "Premium waterfront mixed-use project.",
      units: [
        {
          id: "unit-1",
          tower: "Tower A",
          floor: "12",
          unitNumber: "A-1204",
          type: "2 Bedroom",
          size: "1450 sqft",
          price: 2350000,
          status: "sold",
          shared: true,
        },
        {
          id: "unit-2",
          tower: "Tower A",
          floor: "14",
          unitNumber: "A-1410",
          type: "3 Bedroom",
          size: "1880 sqft",
          price: 2950000,
          status: "available",
          shared: false,
        },
      ],
      phases: [
        {
          id: "phase-1",
          projectId: "project-1",
          name: "Tower A",
          type: "Tower",
          unitsCount: 180,
          status: "active",
        },
      ],
      documents: [
        {
          id: "doc-1",
          projectId: "project-1",
          fileName: "Lusail-Brochure-EN.pdf",
          fileType: "brochure",
          visibility: "broker",
          uploadedAt: created,
        },
      ],
      shares: [],
    },
    {
      id: "project-2",
      code: `PRJ-QA-${yearNow()}-002`,
      name: "West Bay Residences",
      city: "Doha",
      area: "West Bay",
      address: "Diplomatic Area, West Bay, Doha",
      projectType: "Residential",
      launchDate: `${yearNow()}-03-01`,
      expectedDeliveryDate: `${yearNow() + 1}-09-20`,
      municipalityApprovalNumber: "MUN-WB-22911",
      permitReference: "PRMT-WB-55122",
      paymentPlanAvailable: true,
      bookingPercentage: 15,
      handoverPercentage: 25,
      status: "active",
      createdAt: created,
      updatedAt: created,
      units: [
        {
          id: "unit-3",
          tower: "Tower C",
          floor: "8",
          unitNumber: "C-807",
          type: "1 Bedroom",
          size: "980 sqft",
          price: 1650000,
          status: "reserved",
          shared: true,
        },
      ],
      phases: [],
      documents: [],
      shares: [],
    },
  ];
  writeRaw(demo);
  return demo;
}

export type CreateProjectInput = Omit<
  ProjectRecord,
  "id" | "code" | "createdAt" | "updatedAt" | "status" | "units" | "phases" | "documents" | "shares"
>;

export const projectsModule = {
  listProjects() {
    return readRaw();
  },

  getProjectById(projectId: string) {
    return readRaw().find((project) => project.id === projectId) ?? null;
  },

  createProject(input: CreateProjectInput) {
    const items = readRaw();
    const next: ProjectRecord = {
      id: crypto.randomUUID(),
      code: nextProjectCode(items),
      status: "active",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      units: [],
      phases: [],
      documents: [],
      shares: [],
      ...input,
    };
    writeRaw([next, ...items]);
    return next;
  },

  updateProject(projectId: string, data: Partial<ProjectRecord>) {
    const items = readRaw();
    const idx = items.findIndex((project) => project.id === projectId);
    if (idx < 0) throw new Error("Project not found.");
    const updated = {
      ...items[idx],
      ...data,
      updatedAt: nowIso(),
    };
    items[idx] = updated;
    writeRaw(items);
    return updated;
  },

  archiveProject(projectId: string) {
    return this.updateProject(projectId, { status: "archived" });
  },

  unarchiveProject(projectId: string) {
    return this.updateProject(projectId, { status: "active" });
  },

  addPhase(projectId: string, input: Omit<ProjectPhase, "id" | "projectId">) {
    const items = readRaw();
    const idx = items.findIndex((project) => project.id === projectId);
    if (idx < 0) throw new Error("Project not found.");
    const phase: ProjectPhase = {
      id: nextId("PHS", items[idx].phases),
      projectId,
      ...input,
    };
    items[idx].phases = [phase, ...items[idx].phases];
    items[idx].updatedAt = nowIso();
    writeRaw(items);
    return phase;
  },

  addDocument(
    projectId: string,
    input: Omit<ProjectDocument, "id" | "projectId" | "uploadedAt">,
  ) {
    const items = readRaw();
    const idx = items.findIndex((project) => project.id === projectId);
    if (idx < 0) throw new Error("Project not found.");
    const doc: ProjectDocument = {
      id: nextId("DOC", items[idx].documents),
      projectId,
      uploadedAt: nowIso(),
      ...input,
    };
    items[idx].documents = [doc, ...items[idx].documents];
    items[idx].updatedAt = nowIso();
    writeRaw(items);
    return doc;
  },

  addUnit(
    projectId: string,
    input: Omit<ProjectUnit, "id" | "shared">,
  ) {
    const items = readRaw();
    const idx = items.findIndex((project) => project.id === projectId);
    if (idx < 0) throw new Error("Project not found.");
    const unit: ProjectUnit = {
      id: nextId("UNT", items[idx].units),
      shared: false,
      ...input,
    };
    items[idx].units = [unit, ...items[idx].units];
    items[idx].updatedAt = nowIso();
    writeRaw(items);
    return unit;
  },

  updateUnit(projectId: string, unitId: string, data: Partial<ProjectUnit>) {
    const items = readRaw();
    const idx = items.findIndex((project) => project.id === projectId);
    if (idx < 0) throw new Error("Project not found.");
    const uidx = items[idx].units.findIndex((unit) => unit.id === unitId);
    if (uidx < 0) throw new Error("Unit not found.");
    items[idx].units[uidx] = { ...items[idx].units[uidx], ...data };
    items[idx].updatedAt = nowIso();
    writeRaw(items);
    return items[idx].units[uidx];
  },

  removeUnit(projectId: string, unitId: string) {
    const items = readRaw();
    const idx = items.findIndex((project) => project.id === projectId);
    if (idx < 0) throw new Error("Project not found.");
    items[idx].units = items[idx].units.filter((unit) => unit.id !== unitId);
    items[idx].updatedAt = nowIso();
    writeRaw(items);
  },

  shareProject(projectId: string, input: Omit<ProjectShare, "id" | "projectId" | "sharedAt">) {
    const items = readRaw();
    const idx = items.findIndex((project) => project.id === projectId);
    if (idx < 0) throw new Error("Project not found.");
    const share: ProjectShare = {
      id: nextId("SHR", items[idx].shares),
      projectId,
      sharedAt: nowIso(),
      ...input,
    };
    items[idx].shares = [share, ...items[idx].shares];
    items[idx].units = items[idx].units.map((unit) => ({ ...unit, shared: true }));
    items[idx].updatedAt = nowIso();
    writeRaw(items);
    return share;
  },
};

