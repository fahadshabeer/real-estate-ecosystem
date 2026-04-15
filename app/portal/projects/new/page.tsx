"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FancyStepper } from "@/components/ui/fancy-stepper";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useCreateProject } from "@/hooks/use-projects-module";
import { runWithToast } from "@/lib/ui/toast";

const steps = ["Basic Information", "Project Details", "Visual Assets", "Sales Configuration", "Review & Save"];

export default function AddProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    city: "Doha",
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
    bookingPercentage: 10,
    handoverPercentage: 30,
  });

  const previewCode = useMemo(() => `PRJ-QA-${new Date().getFullYear()}-XXX`, []);

  const save = async () => {
    try {
      await runWithToast({
        loading: "Creating project...",
        success: "Project created successfully.",
        action: () => createProject.mutateAsync(form),
      });
      router.push("/portal/projects");
    } catch {}
  };

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Projects" title="Add New Project" backHref="/portal/projects" />

      <section className="ui-form-shell">
        <FancyStepper steps={steps} currentStep={step} onStepClick={setStep} />

        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="ui-label">
              Project Name
              <input className="ui-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label className="ui-label">
              Project Code (Auto)
              <input className="ui-input" value={previewCode} readOnly />
            </label>
            <label className="ui-label">
              City
              <input className="ui-input" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
            </label>
            <label className="ui-label">
              Area
              <input className="ui-input" value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} />
            </label>
            <label className="ui-label sm:col-span-2">
              Full Address
              <input className="ui-input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </label>
            <label className="ui-label sm:col-span-2">
              Developer Notes
              <textarea className="ui-textarea" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="ui-label">
              Project Type
              <FancySelect
                className="ui-select"
                value={form.projectType}
                onChange={(e) => setForm((p) => ({ ...p, projectType: e.target.value as typeof form.projectType }))}
              >
                <option>Residential</option>
                <option>Commercial</option>
                <option>Mixed Use</option>
              </FancySelect>
            </label>
            <label className="ui-label">
              Launch Date
              <input type="date" className="ui-input" value={form.launchDate} onChange={(e) => setForm((p) => ({ ...p, launchDate: e.target.value }))} />
            </label>
            <label className="ui-label">
              Expected Delivery Date
              <input type="date" className="ui-input" value={form.expectedDeliveryDate} onChange={(e) => setForm((p) => ({ ...p, expectedDeliveryDate: e.target.value }))} />
            </label>
            <label className="ui-label">
              Municipality Approval Number
              <input className="ui-input" value={form.municipalityApprovalNumber} onChange={(e) => setForm((p) => ({ ...p, municipalityApprovalNumber: e.target.value }))} />
            </label>
            <label className="ui-label sm:col-span-2">
              Permit Reference
              <input className="ui-input" value={form.permitReference} onChange={(e) => setForm((p) => ({ ...p, permitReference: e.target.value }))} />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="ui-label">
              Project Logo URL
              <input className="ui-input" value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} />
            </label>
            <label className="ui-label">
              Main Image URL
              <input className="ui-input" value={form.mainImageUrl} onChange={(e) => setForm((p) => ({ ...p, mainImageUrl: e.target.value }))} />
            </label>
            <label className="ui-label">
              Brochure File Name
              <input className="ui-input" value={form.brochureFileName} onChange={(e) => setForm((p) => ({ ...p, brochureFileName: e.target.value }))} />
            </label>
            <label className="ui-label">
              Masterplan File Name
              <input className="ui-input" value={form.masterplanFileName} onChange={(e) => setForm((p) => ({ ...p, masterplanFileName: e.target.value }))} />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="ui-label">
              Payment Plan Available
              <FancySelect
                className="ui-select"
                value={form.paymentPlanAvailable ? "yes" : "no"}
                onChange={(e) => setForm((p) => ({ ...p, paymentPlanAvailable: e.target.value === "yes" }))}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </FancySelect>
            </label>
            <label className="ui-label">
              Booking Percentage
              <input
                type="number"
                className="ui-input"
                value={form.bookingPercentage}
                onChange={(e) => setForm((p) => ({ ...p, bookingPercentage: Number(e.target.value || 0) }))}
              />
            </label>
            <label className="ui-label">
              Handover Percentage
              <input
                type="number"
                className="ui-input"
                value={form.handoverPercentage}
                onChange={(e) => setForm((p) => ({ ...p, handoverPercentage: Number(e.target.value || 0) }))}
              />
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4 text-sm text-[#4f6078]">
            <p>
              <strong>Project:</strong> {form.name || "Not set"}
            </p>
            <p>
              <strong>Location:</strong> {form.city}, {form.area}
            </p>
            <p>
              <strong>Type:</strong> {form.projectType}
            </p>
            <p>
              <strong>Timeline:</strong> {form.launchDate || "N/A"} → {form.expectedDeliveryDate || "N/A"}
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-between gap-2">
          <button
            onClick={() => (step === 0 ? router.push("/portal/projects") : setStep((s) => Math.max(0, s - 1)))}
            className="ui-btn-secondary"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 4 ? (
            <button onClick={() => setStep((s) => Math.min(4, s + 1))} className="ui-btn-primary">
              Next
            </button>
          ) : (
            <button onClick={save} disabled={createProject.isPending} className="ui-btn-primary disabled:opacity-60">
              {createProject.isPending ? "Saving..." : "Save Project"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
