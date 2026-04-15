"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FileText,
  House,
  Layers3,
  Plus,
  Save,
  Share2,
  SquarePen,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  useAddDocument,
  useAddPhase,
  useAddUnit,
  useArchiveProject,
  useProject,
  useShareProject,
  useUpdateUnit,
} from "@/hooks/use-projects-module";
import { runWithToast } from "@/lib/ui/toast";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "inventory", label: "Inventory" },
  { key: "documents", label: "Documents" },
  { key: "brokers", label: "Brokers" },
  { key: "agreements", label: "Agreements" },
  { key: "analytics", label: "Analytics" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTab = (searchParams.get("tab") as TabKey | null) ?? "overview";

  const projectQuery = useProject(params.projectId);
  const archiveProject = useArchiveProject();
  const addUnit = useAddUnit();
  const updateUnit = useUpdateUnit();
  const addPhase = useAddPhase();
  const addDocument = useAddDocument();
  const shareProject = useShareProject();

  const project = projectQuery.project;

  const [unitForm, setUnitForm] = useState({
    tower: "",
    floor: "",
    unitNumber: "",
    type: "2 Bedroom",
    size: "",
    price: 0,
    status: "available" as "available" | "reserved" | "sold" | "blocked",
  });

  const [phaseForm, setPhaseForm] = useState({
    name: "",
    type: "Tower",
    unitsCount: 0,
    status: "active" as "active" | "planning" | "completed",
  });

  const [documentForm, setDocumentForm] = useState({
    fileName: "",
    fileType: "brochure" as "brochure" | "approval" | "payment-plan" | "floor-plan" | "other",
    visibility: "internal" as "internal" | "broker",
  });

  const [shareForm, setShareForm] = useState({
    brokerId: "",
    mode: "full" as "full" | "partial" | "agreement-restricted",
    notes: "",
  });

  const statusMetrics = useMemo(() => {
    const units = project?.units ?? [];
    return {
      total: units.length,
      sold: units.filter((unit) => unit.status === "sold").length,
      reserved: units.filter((unit) => unit.status === "reserved").length,
      available: units.filter((unit) => unit.status === "available").length,
      blocked: units.filter((unit) => unit.status === "blocked").length,
    };
  }, [project?.units]);

  if (projectQuery.isLoading) {
    return (
      <div className="space-y-5 pb-6">
        <section className="animate-pulse rounded-md border border-[#dbe4eb] bg-white p-5">
          <div className="h-6 w-52 rounded bg-[#e8edf3]" />
          <div className="mt-3 h-4 w-72 rounded bg-[#eef3f7]" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`metric-skeleton-${index}`} className="h-16 rounded-md border border-[#ecf1f5] bg-[#f9fbfc]" />
            ))}
          </div>
        </section>
        <section className="animate-pulse rounded-md border border-[#dbe4eb] bg-white p-4">
          <div className="h-9 rounded bg-[#eef3f7]" />
          <div className="mt-4 h-80 rounded bg-[#f4f7fb]" />
        </section>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">
        Project not found.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Projects" title={project.name} backHref="/portal/projects" />

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2 py-1 text-xs text-[#607187]">
                {project.code}
              </span>
              <span
                className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                  project.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : project.status === "completed"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {project.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#607187]">
              {project.city}, {project.area} · Delivery {project.expectedDeliveryDate}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/portal/projects/${project.id}/edit`}
              className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#4f6078]"
            >
              <SquarePen className="h-4 w-4" />
              Edit
            </Link>
            {project.status !== "archived" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await runWithToast({
                      loading: "Archiving project...",
                      success: "Project archived.",
                      action: () => archiveProject.mutateAsync(project.id),
                    });
                    router.push("/portal/projects/archived");
                  } catch {}
                }}
                className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#4f6078]"
              >
                <Trash2 className="h-4 w-4" />
                Archive
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Total Units" value={statusMetrics.total} />
          <MetricCard label="Sold Units" value={statusMetrics.sold} />
          <MetricCard label="Reserved Units" value={statusMetrics.reserved} />
          <MetricCard label="Available Units" value={statusMetrics.available} />
          <MetricCard label="Blocked Units" value={statusMetrics.blocked} />
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = selectedTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/portal/projects/${project.id}?tab=${tab.key}`}
                className={`rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-[#3aa4a8] font-semibold text-white"
                    : "border border-[#dbe4eb] bg-white text-[#607187] hover:bg-[#f5f9fb]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </section>

      {selectedTab === "overview" && (
        <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Project Overview</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <OverviewRow label="Project Type" value={project.projectType} />
            <OverviewRow label="Launch Date" value={project.launchDate || "N/A"} />
            <OverviewRow label="Expected Delivery Date" value={project.expectedDeliveryDate || "N/A"} />
            <OverviewRow label="Municipality Approval" value={project.municipalityApprovalNumber || "N/A"} />
            <OverviewRow label="Permit Reference" value={project.permitReference || "N/A"} />
            <OverviewRow label="Address" value={project.address || "N/A"} />
          </div>
          <div className="mt-4 rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-4 text-sm text-[#4f6078]">
            <p className="font-semibold text-[#1f2a44]">Developer Notes</p>
            <p className="mt-1">{project.notes?.trim() ? project.notes : "No project notes added yet."}</p>
          </div>
        </section>
      )}

      {selectedTab === "inventory" && (
        <section className="space-y-4">
          <section className="ui-form-shell">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Add Unit</h2>
              <span className="text-xs text-[#7f8a99]">Unit-level inventory control</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="ui-label">
                Tower
                <input
                  className="ui-input"
                  value={unitForm.tower}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, tower: event.target.value }))}
                />
              </label>
              <label className="ui-label">
                Floor
                <input
                  className="ui-input"
                  value={unitForm.floor}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, floor: event.target.value }))}
                />
              </label>
              <label className="ui-label">
                Unit Number
                <input
                  className="ui-input"
                  value={unitForm.unitNumber}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, unitNumber: event.target.value }))}
                />
              </label>
              <label className="ui-label">
                Unit Type
                <input
                  className="ui-input"
                  value={unitForm.type}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, type: event.target.value }))}
                />
              </label>
              <label className="ui-label">
                Size
                <input
                  className="ui-input"
                  value={unitForm.size}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, size: event.target.value }))}
                />
              </label>
              <label className="ui-label">
                Price
                <input
                  type="number"
                  className="ui-input"
                  value={unitForm.price}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, price: Number(event.target.value || 0) }))}
                />
              </label>
              <label className="ui-label">
                Status
                <FancySelect
                  className="ui-select"
                  value={unitForm.status}
                  onChange={(event) =>
                    setUnitForm((prev) => ({
                      ...prev,
                      status: event.target.value as "available" | "reserved" | "sold" | "blocked",
                    }))
                  }
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                  <option value="blocked">Blocked</option>
                </FancySelect>
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="ui-btn-primary w-full"
                  onClick={async () => {
                    try {
                      await runWithToast({
                        loading: "Adding unit...",
                        success: "Unit added to inventory.",
                        action: () => addUnit.mutateAsync({ projectId: project.id, data: unitForm }),
                      });
                      setUnitForm({
                        tower: "",
                        floor: "",
                        unitNumber: "",
                        type: "2 Bedroom",
                        size: "",
                        price: 0,
                        status: "available",
                      });
                    } catch {}
                  }}
                >
                  <Plus className="mr-2 inline-block h-4 w-4" />
                  Add Unit
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
            <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
              <p className="text-[16px] font-medium text-[#38a0a6]">
                Total(<span className="font-bold">{project.units.length}</span>)
              </p>
              <p className="text-sm text-[#7f8a99]">Project inventory</p>
            </div>
            <div className="min-h-[420px] overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">Tower</th>
                    <th className="px-4 py-3">Floor</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.units.map((unit) => (
                    <tr key={unit.id} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{unit.tower}</td>
                      <td className="px-4 py-3">{unit.floor}</td>
                      <td className="px-4 py-3 text-[#1f2a44]">{unit.unitNumber}</td>
                      <td className="px-4 py-3">{unit.type}</td>
                      <td className="px-4 py-3">{unit.size}</td>
                      <td className="px-4 py-3">{unit.price.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-[#f1f5f9] px-2 py-1 text-xs capitalize text-[#51627a]">
                          {unit.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const nextStatus =
                                unit.status === "available"
                                  ? "reserved"
                                  : unit.status === "reserved"
                                    ? "sold"
                                    : unit.status === "sold"
                                      ? "blocked"
                                      : "available";
                              try {
                                await runWithToast({
                                  loading: "Updating unit...",
                                  success: "Unit updated.",
                                  action: () =>
                                    updateUnit.mutateAsync({
                                      projectId: project.id,
                                      unitId: unit.id,
                                      data: { status: nextStatus },
                                    }),
                                });
                              } catch {}
                            }}
                            className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                            title="Cycle status"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {project.units.length === 0 && (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3 text-[#7f8a99]" colSpan={8}>
                        No units added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {selectedTab === "documents" && (
        <section className="space-y-4">
          <section className="ui-form-shell">
            <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Add Project Document</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="ui-label">
                File Name
                <input
                  className="ui-input"
                  value={documentForm.fileName}
                  onChange={(event) => setDocumentForm((prev) => ({ ...prev, fileName: event.target.value }))}
                />
              </label>
              <label className="ui-label">
                File Type
                <FancySelect
                  className="ui-select"
                  value={documentForm.fileType}
                  onChange={(event) =>
                    setDocumentForm((prev) => ({
                      ...prev,
                      fileType: event.target.value as
                        | "brochure"
                        | "approval"
                        | "payment-plan"
                        | "floor-plan"
                        | "other",
                    }))
                  }
                >
                  <option value="brochure">Brochure</option>
                  <option value="approval">Approval</option>
                  <option value="payment-plan">Payment Plan</option>
                  <option value="floor-plan">Floor Plan</option>
                  <option value="other">Other</option>
                </FancySelect>
              </label>
              <label className="ui-label">
                Visibility
                <FancySelect
                  className="ui-select"
                  value={documentForm.visibility}
                  onChange={(event) =>
                    setDocumentForm((prev) => ({
                      ...prev,
                      visibility: event.target.value as "internal" | "broker",
                    }))
                  }
                >
                  <option value="internal">Internal</option>
                  <option value="broker">Broker Visible</option>
                </FancySelect>
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="ui-btn-primary w-full"
                  onClick={async () => {
                    try {
                      await runWithToast({
                        loading: "Adding document...",
                        success: "Document added.",
                        action: () => addDocument.mutateAsync({ projectId: project.id, data: documentForm }),
                      });
                      setDocumentForm({
                        fileName: "",
                        fileType: "brochure",
                        visibility: "internal",
                      });
                    } catch {}
                  }}
                >
                  <Save className="mr-2 inline-block h-4 w-4" />
                  Save Document
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#dbe4eb] bg-white">
            <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
              <p className="text-[16px] font-medium text-[#38a0a6]">
                Total(<span className="font-bold">{project.documents.length}</span>)
              </p>
              <p className="text-sm text-[#7f8a99]">Documents attached to this project</p>
            </div>
            <div className="min-h-[320px] overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {project.documents.map((doc) => (
                    <tr key={doc.id} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3 text-[#1f2a44]">{doc.fileName}</td>
                      <td className="px-4 py-3 capitalize">{doc.fileType}</td>
                      <td className="px-4 py-3 capitalize">{doc.visibility}</td>
                      <td className="px-4 py-3">{new Date(doc.uploadedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {project.documents.length === 0 && (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3 text-[#7f8a99]" colSpan={4}>
                        No documents uploaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {selectedTab === "brokers" && (
        <section className="space-y-4">
          <section className="ui-form-shell">
            <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Share Project With Broker</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="ui-label">
                Broker Company ID
                <input
                  className="ui-input"
                  value={shareForm.brokerId}
                  onChange={(event) => setShareForm((prev) => ({ ...prev, brokerId: event.target.value }))}
                  placeholder="BRK-2026-0001"
                />
              </label>
              <label className="ui-label">
                Sharing Mode
                <FancySelect
                  className="ui-select"
                  value={shareForm.mode}
                  onChange={(event) =>
                    setShareForm((prev) => ({
                      ...prev,
                      mode: event.target.value as "full" | "partial" | "agreement-restricted",
                    }))
                  }
                >
                  <option value="full">Full</option>
                  <option value="partial">Partial</option>
                  <option value="agreement-restricted">Agreement Restricted</option>
                </FancySelect>
              </label>
              <label className="ui-label sm:col-span-2">
                Notes
                <input
                  className="ui-input"
                  value={shareForm.notes}
                  onChange={(event) => setShareForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Scope and conditions"
                />
              </label>
              <div className="sm:col-span-2 lg:col-span-4">
                <button
                  type="button"
                  className="ui-btn-primary"
                  onClick={async () => {
                    try {
                      await runWithToast({
                        loading: "Sharing project...",
                        success: "Project shared with broker.",
                        action: () => shareProject.mutateAsync({ projectId: project.id, data: shareForm }),
                      });
                      setShareForm({ brokerId: "", mode: "full", notes: "" });
                    } catch {}
                  }}
                >
                  <Share2 className="mr-2 inline-block h-4 w-4" />
                  Share Project
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#dbe4eb] bg-white">
            <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
              <p className="text-[16px] font-medium text-[#38a0a6]">
                Total(<span className="font-bold">{project.shares.length}</span>)
              </p>
              <p className="text-sm text-[#7f8a99]">Broker share history</p>
            </div>
            <div className="min-h-[320px] overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">Broker ID</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3">Shared At</th>
                  </tr>
                </thead>
                <tbody>
                  {project.shares.map((share) => (
                    <tr key={share.id} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3 text-[#1f2a44]">{share.brokerId}</td>
                      <td className="px-4 py-3 capitalize">{share.mode}</td>
                      <td className="px-4 py-3">{share.notes || "N/A"}</td>
                      <td className="px-4 py-3">{new Date(share.sharedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {project.shares.length === 0 && (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3 text-[#7f8a99]" colSpan={4}>
                        This project has not been shared with any broker yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {selectedTab === "agreements" && (
        <section className="rounded-md border border-[#dbe4eb] bg-white p-5 text-sm text-[#4f6078]">
          <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Agreement Coverage</h2>
          <p className="mt-2">
            Agreement linkage for this project is ready for backend mapping. Use the Agreements module to create or
            renew contracts, then map project visibility through active agreements.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoChip icon={FileText} label="Active shares linked" value={project.shares.length} />
            <InfoChip icon={Layers3} label="Phases covered" value={project.phases.length} />
          </div>
        </section>
      )}

      {selectedTab === "analytics" && (
        <section className="rounded-md border border-[#dbe4eb] bg-white p-5 text-sm text-[#4f6078]">
          <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Project Analytics Snapshot</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Sold Rate" value={`${statusMetrics.total ? Math.round((statusMetrics.sold / statusMetrics.total) * 100) : 0}%`} />
            <MetricCard
              label="Reserved Rate"
              value={`${statusMetrics.total ? Math.round((statusMetrics.reserved / statusMetrics.total) * 100) : 0}%`}
            />
            <MetricCard label="Shared Units" value={project.units.filter((unit) => unit.shared).length} />
            <MetricCard label="Documents" value={project.documents.length} />
          </div>
          <p className="mt-4 text-xs text-[#7f8a99]">
            Full broker performance and demand trend charts will be bound from backend analytics in the next phase.
          </p>
        </section>
      )}

      {selectedTab === "overview" && (
        <section className="ui-form-shell">
          <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Add Project Phase</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="ui-label">
              Phase Name
              <input
                className="ui-input"
                value={phaseForm.name}
                onChange={(event) => setPhaseForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
            <label className="ui-label">
              Type
              <input
                className="ui-input"
                value={phaseForm.type}
                onChange={(event) => setPhaseForm((prev) => ({ ...prev, type: event.target.value }))}
              />
            </label>
            <label className="ui-label">
              Units Count
              <input
                type="number"
                className="ui-input"
                value={phaseForm.unitsCount}
                onChange={(event) => setPhaseForm((prev) => ({ ...prev, unitsCount: Number(event.target.value || 0) }))}
              />
            </label>
            <label className="ui-label">
              Status
              <FancySelect
                className="ui-select"
                value={phaseForm.status}
                onChange={(event) =>
                  setPhaseForm((prev) => ({
                    ...prev,
                    status: event.target.value as "active" | "planning" | "completed",
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="completed">Completed</option>
              </FancySelect>
            </label>
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                className="ui-btn-primary"
                onClick={async () => {
                  try {
                    await runWithToast({
                      loading: "Adding phase...",
                      success: "Phase added.",
                      action: () => addPhase.mutateAsync({ projectId: project.id, data: phaseForm }),
                    });
                    setPhaseForm({ name: "", type: "Tower", unitsCount: 0, status: "active" });
                  } catch {}
                }}
              >
                <Plus className="mr-2 inline-block h-4 w-4" />
                Add Phase
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
      <p className="text-xs text-[#7f8a99]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{value}</p>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
      <p className="text-xs text-[#7f8a99]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#1f2a44]">{value}</p>
    </div>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
      <div className="rounded-md bg-[#eaf5f5] p-2 text-[#2b9ea2]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-[#7f8a99]">{label}</p>
        <p className="text-base font-semibold text-[#1f2a44]">{value}</p>
      </div>
    </div>
  );
}
