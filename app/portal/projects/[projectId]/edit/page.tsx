"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useProject, useUpdateProject } from "@/hooks/use-projects-module";
import { runWithToast } from "@/lib/ui/toast";

export default function EditProjectPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectQuery = useProject(params.projectId);
  const updateProject = useUpdateProject();

  const [form, setForm] = useState({
    name: "",
    city: "",
    area: "",
    address: "",
    notes: "",
    projectType: "Residential" as "Residential" | "Commercial" | "Mixed Use",
    launchDate: "",
    expectedDeliveryDate: "",
    municipalityApprovalNumber: "",
    permitReference: "",
    logoUrl: "",
    mainImageUrl: "",
    brochureFileName: "",
    masterplanFileName: "",
    paymentPlanAvailable: true,
    bookingPercentage: 0,
    handoverPercentage: 0,
    status: "active" as "active" | "completed" | "archived",
  });

  useEffect(() => {
    const project = projectQuery.project;
    if (!project) return;
    setForm({
      name: project.name,
      city: project.city,
      area: project.area,
      address: project.address,
      notes: project.notes ?? "",
      projectType: project.projectType,
      launchDate: project.launchDate,
      expectedDeliveryDate: project.expectedDeliveryDate,
      municipalityApprovalNumber: project.municipalityApprovalNumber,
      permitReference: project.permitReference,
      logoUrl: project.logoUrl ?? "",
      mainImageUrl: project.mainImageUrl ?? "",
      brochureFileName: project.brochureFileName ?? "",
      masterplanFileName: project.masterplanFileName ?? "",
      paymentPlanAvailable: project.paymentPlanAvailable,
      bookingPercentage: project.bookingPercentage,
      handoverPercentage: project.handoverPercentage,
      status: project.status,
    });
  }, [projectQuery.project]);

  if (projectQuery.isLoading) {
    return <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">Loading project...</div>;
  }

  if (!projectQuery.project) {
    return (
      <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">
        Project not found.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Projects" title="Edit Project" backHref={`/portal/projects/${projectQuery.project.id}`} />

      <section className="ui-form-shell">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="ui-label">
            Project Name
            <input className="ui-input" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label className="ui-label">
            Project Type
            <FancySelect
              className="ui-select"
              value={form.projectType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  projectType: event.target.value as "Residential" | "Commercial" | "Mixed Use",
                }))
              }
            >
              <option>Residential</option>
              <option>Commercial</option>
              <option>Mixed Use</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            City
            <input className="ui-input" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
          </label>
          <label className="ui-label">
            Area
            <input className="ui-input" value={form.area} onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))} />
          </label>
          <label className="ui-label sm:col-span-2">
            Address
            <input className="ui-input" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
          </label>
          <label className="ui-label">
            Launch Date
            <input type="date" className="ui-input" value={form.launchDate} onChange={(event) => setForm((prev) => ({ ...prev, launchDate: event.target.value }))} />
          </label>
          <label className="ui-label">
            Expected Delivery Date
            <input
              type="date"
              className="ui-input"
              value={form.expectedDeliveryDate}
              onChange={(event) => setForm((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))}
            />
          </label>
          <label className="ui-label">
            Municipality Approval Number
            <input
              className="ui-input"
              value={form.municipalityApprovalNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, municipalityApprovalNumber: event.target.value }))}
            />
          </label>
          <label className="ui-label">
            Permit Reference
            <input className="ui-input" value={form.permitReference} onChange={(event) => setForm((prev) => ({ ...prev, permitReference: event.target.value }))} />
          </label>
          <label className="ui-label">
            Booking Percentage
            <input
              type="number"
              className="ui-input"
              value={form.bookingPercentage}
              onChange={(event) => setForm((prev) => ({ ...prev, bookingPercentage: Number(event.target.value || 0) }))}
            />
          </label>
          <label className="ui-label">
            Handover Percentage
            <input
              type="number"
              className="ui-input"
              value={form.handoverPercentage}
              onChange={(event) => setForm((prev) => ({ ...prev, handoverPercentage: Number(event.target.value || 0) }))}
            />
          </label>
          <label className="ui-label">
            Status
            <FancySelect
              className="ui-select"
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as "active" | "completed" | "archived",
                }))
              }
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            Payment Plan Available
            <FancySelect
              className="ui-select"
              value={form.paymentPlanAvailable ? "yes" : "no"}
              onChange={(event) => setForm((prev) => ({ ...prev, paymentPlanAvailable: event.target.value === "yes" }))}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </FancySelect>
          </label>
          <label className="ui-label sm:col-span-2">
            Developer Notes
            <textarea className="ui-textarea" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="ui-btn-secondary"
            onClick={() => router.push(`/portal/projects/${projectQuery.project?.id}`)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ui-btn-primary disabled:opacity-60"
            disabled={updateProject.isPending}
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Saving project...",
                  success: "Project updated.",
                  action: () =>
                    updateProject.mutateAsync({
                      projectId: projectQuery.project!.id,
                      data: form,
                    }),
                });
                router.push(`/portal/projects/${projectQuery.project!.id}`);
              } catch {}
            }}
          >
            {updateProject.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
