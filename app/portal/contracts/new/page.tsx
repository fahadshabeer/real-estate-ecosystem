"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/components/state/app-context";
import { AgreementLivePreview } from "@/components/contracts/agreement-live-preview";
import { FancyStepper } from "@/components/ui/fancy-stepper";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { SignatureDialog } from "@/components/ui/signature-dialog";
import { useAgreementById, useCreateAgreement } from "@/hooks/use-agreements";
import { companyRepository } from "@/lib/backend/factory";
import { runWithToast } from "@/lib/ui/toast";

const steps = [
  "Select Broker",
  "Basic Information",
  "Agreement Type",
  "Project Scope",
  "Commercial Terms",
  "Legal Conditions",
  "Signature Setup",
  "Generate Agreement",
];

const DEFAULT_TEMPLATES = [
  {
    id: "tpl-standard-non-exclusive",
    name: "Standard Non-Exclusive",
    agreementType: "Non-Exclusive" as const,
    commissionRules: "2.5%",
    legalClauses: "Standard cancellation and resale restrictions apply.",
    defaultProjectScope: "All shared units under mapped agreement scope",
  },
  {
    id: "tpl-premium-broker",
    name: "Premium Broker Agreement",
    agreementType: "Priority Access" as const,
    commissionRules: "3.0%",
    legalClauses: "Priority inventory release and accelerated settlement terms apply.",
    defaultProjectScope: "Priority towers and premium inventory only",
  },
  {
    id: "tpl-exclusive-project",
    name: "Exclusive Project Sales",
    agreementType: "Exclusive" as const,
    commissionRules: "3.5%",
    legalClauses: "Exclusive distribution rights with defined performance obligations.",
    defaultProjectScope: "Exclusive project scope defined by developer",
  },
];

export default function NewContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBrokerId = searchParams.get("brokerId") ?? "";
  const requestId = searchParams.get("requestId") ?? "";
  const renewFromAgreementId = searchParams.get("renewFrom") ?? "";
  const duplicateFromAgreementId = searchParams.get("duplicateFrom") ?? "";
  const sourceAgreementId = renewFromAgreementId || duplicateFromAgreementId;
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const sourceAgreementQuery = useAgreementById(sourceAgreementId);

  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [searchRows, setSearchRows] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState(preselectedBrokerId);
  const [searching, setSearching] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [form, setForm] = useState({
    agreementTitle: "Developer-Broker Collaboration Agreement",
    agreementType: "Non-Exclusive" as "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited",
    validityStart: "2026-01-01",
    validityEnd: "2026-12-31",
    selectedProjectsCsv: "Lusail Heights, West Bay Residences",
    projectScope: "Selected towers and units under approved mapping",
    commissionRules: "2.5%",
    paymentTrigger: "Buyer first installment",
    bonusConditions: "Quarterly volume bonus after 10 closed deals",
    legalClauses: "Standard cancellation and resale restrictions apply.",
    templateName: "",
  });

  const templates = DEFAULT_TEMPLATES;
  const createAgreement = useCreateAgreement(developerId, selectedBrokerId);
  const contractIdPreview = useMemo(() => `CON-QA-${new Date().getFullYear()}-XXXX`, []);
  const sourceAgreement = sourceAgreementQuery.data ?? null;

  useEffect(() => {
    if (!preselectedBrokerId) return;
    setSelectedBrokerId(preselectedBrokerId);
  }, [preselectedBrokerId]);

  useEffect(() => {
    if (!sourceAgreement) return;
    const isRenew = Boolean(renewFromAgreementId);
    const start = new Date().toISOString().slice(0, 10);
    const end = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
    setSelectedBrokerId(sourceAgreement.brokerId);
    setForm((prev) => ({
      ...prev,
      agreementTitle: isRenew
        ? `${sourceAgreement.agreementTitle ?? "Agreement"} (Renewed)`
        : `${sourceAgreement.agreementTitle ?? "Agreement"} (Copy)`,
      agreementType: sourceAgreement.agreementType ?? prev.agreementType,
      validityStart: isRenew ? start : sourceAgreement.validityStart,
      validityEnd: isRenew ? end : sourceAgreement.validityEnd,
      selectedProjectsCsv: (sourceAgreement.projectsCovered ?? []).join(", "),
      projectScope: sourceAgreement.projectScope ?? prev.projectScope,
      commissionRules: sourceAgreement.commissionRules || prev.commissionRules,
      paymentTrigger: sourceAgreement.paymentTrigger ?? prev.paymentTrigger,
      bonusConditions: sourceAgreement.bonusConditions ?? prev.bonusConditions,
      legalClauses: sourceAgreement.legalClauses ?? prev.legalClauses,
    }));
  }, [duplicateFromAgreementId, renewFromAgreementId, sourceAgreement]);

  const searchBroker = async () => {
    setSearching(true);
    try {
      const rows = await runWithToast({
        loading: "Searching broker companies...",
        success: (result) => `Found ${result.length} broker result(s).`,
        action: () => companyRepository.searchCompanies("broker", query, 20),
      });
      setSearchRows(rows.map((row) => ({ id: row.id, name: row.name, status: row.status })));
    } catch {
    } finally {
      setSearching(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((row) => row.id === templateId);
    if (!template) return;
    setForm((prev) => ({
      ...prev,
      templateName: template.name,
      agreementType: template.agreementType,
      commissionRules: template.commissionRules,
      legalClauses: template.legalClauses,
      projectScope: template.defaultProjectScope,
    }));
  };

  const next = () => setStep((prev) => Math.min(steps.length - 1, prev + 1));
  const back = () => setStep((prev) => Math.max(0, prev - 1));

  const startCreate = () => {
    if (!selectedBrokerId) {
      toast.error("Select a broker first.");
      return;
    }
    setSignatureOpen(true);
  };

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Agreements" title="Create Agreement" backHref="/portal/contracts" />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="ui-form-shell">
        <FancyStepper steps={steps} currentStep={step} onStepClick={setStep} />

        {step === 0 && (
          <div className="space-y-4">
            <label className="ui-label">
              Search Broker (ID / Company Name / Email)
              <div className="mt-2 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-[#46a4a8]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
                  placeholder="BRK-2026-0148"
                />
                <button onClick={searchBroker} disabled={searching} className="ui-btn-secondary !px-3 !py-2 !text-xs">
                  {searching ? "Searching..." : "Find"}
                </button>
              </div>
            </label>
            <div className="max-h-56 space-y-2 overflow-auto rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2">
              {searchRows.map((broker) => (
                <button
                  key={broker.id}
                  onClick={() => setSelectedBrokerId(broker.id)}
                  className={`w-full rounded-md p-2 text-left text-sm ${
                    selectedBrokerId === broker.id ? "bg-[#e6f5f5]" : "bg-white"
                  }`}
                >
                  <p className="font-semibold text-[#1f2a44]">{broker.name}</p>
                  <p className="text-xs text-[#7f8a99]">
                    {broker.id} · {broker.status}
                  </p>
                </button>
              ))}
              {searchRows.length === 0 && <p className="p-2 text-sm text-[#8a96a8]">No broker matches.</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="ui-label">
              Agreement Title
              <input className="ui-input" value={form.agreementTitle} onChange={(event) => setForm((prev) => ({ ...prev, agreementTitle: event.target.value }))} />
            </label>
            <label className="ui-label">
              Auto Contract ID
              <input className="ui-input" value={contractIdPreview} readOnly />
            </label>
            <label className="ui-label">
              Effective Date
              <input type="date" className="ui-input" value={form.validityStart} onChange={(event) => setForm((prev) => ({ ...prev, validityStart: event.target.value }))} />
            </label>
            <label className="ui-label">
              Expiry Date
              <input type="date" className="ui-input" value={form.validityEnd} onChange={(event) => setForm((prev) => ({ ...prev, validityEnd: event.target.value }))} />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="ui-label">
              Agreement Type
              <FancySelect
                className="ui-select"
                value={form.agreementType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    agreementType: event.target.value as typeof prev.agreementType,
                  }))
                }
              >
                <option>Exclusive</option>
                <option>Non-Exclusive</option>
                <option>Priority Access</option>
                <option>Project Limited</option>
              </FancySelect>
            </label>
            <label className="ui-label">
              Agreement Template
              <FancySelect
                className="ui-select"
                value={templates.find((t) => t.name === form.templateName)?.id ?? ""}
                onChange={(event) => applyTemplate(event.target.value)}
              >
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </FancySelect>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="ui-label sm:col-span-2">
              Projects Covered (comma separated)
              <input className="ui-input" value={form.selectedProjectsCsv} onChange={(event) => setForm((prev) => ({ ...prev, selectedProjectsCsv: event.target.value }))} />
            </label>
            <label className="ui-label sm:col-span-2">
              Scope Definition
              <textarea className="ui-textarea" value={form.projectScope} onChange={(event) => setForm((prev) => ({ ...prev, projectScope: event.target.value }))} />
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="ui-label">
              Commission Percentage / Rule
              <input className="ui-input" value={form.commissionRules} onChange={(event) => setForm((prev) => ({ ...prev, commissionRules: event.target.value }))} />
            </label>
            <label className="ui-label">
              Payment Trigger
              <input className="ui-input" value={form.paymentTrigger} onChange={(event) => setForm((prev) => ({ ...prev, paymentTrigger: event.target.value }))} />
            </label>
            <label className="ui-label sm:col-span-2">
              Bonus Conditions
              <textarea className="ui-textarea" value={form.bonusConditions} onChange={(event) => setForm((prev) => ({ ...prev, bonusConditions: event.target.value }))} />
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-3">
            <label className="ui-label">
              Legal Conditions
              <textarea className="ui-textarea" value={form.legalClauses} onChange={(event) => setForm((prev) => ({ ...prev, legalClauses: event.target.value }))} />
            </label>
          </div>
        )}

        {step === 6 && (
          <div className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4 text-sm text-[#4f6078]">
            <p className="font-semibold text-[#1f2a44]">Signature Setup</p>
            <p className="mt-1">Developer signature required to issue agreement.</p>
            <p className="mt-1">Broker signature placeholder will be attached until broker acceptance.</p>
          </div>
        )}

        {step === 7 && (
          <div className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4 text-sm text-[#4f6078]">
            <p>
              <strong>Broker:</strong> {selectedBrokerId || "Not selected"}
            </p>
            <p>
              <strong>Type:</strong> {form.agreementType}
            </p>
            <p>
              <strong>Validity:</strong> {form.validityStart} → {form.validityEnd}
            </p>
            <p>
              <strong>Projects:</strong> {form.selectedProjectsCsv}
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-between gap-2">
          <button onClick={() => (step === 0 ? router.push("/portal/contracts") : back())} className="ui-btn-secondary">
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < steps.length - 1 ? (
            <button onClick={next} className="ui-btn-primary">
              Next
            </button>
          ) : (
            <button onClick={startCreate} disabled={createAgreement.isPending} className="ui-btn-primary disabled:opacity-60">
              {createAgreement.isPending ? "Creating..." : "Generate Agreement"}
            </button>
          )}
        </div>
      </section>
        <div className="xl:sticky xl:top-20 xl:self-start">
          <AgreementLivePreview
            contractIdPreview={contractIdPreview}
            developerId={developerId}
            brokerId={selectedBrokerId}
            agreementTitle={form.agreementTitle}
            agreementType={form.agreementType}
            validityStart={form.validityStart}
            validityEnd={form.validityEnd}
            selectedProjectsCsv={form.selectedProjectsCsv}
            projectScope={form.projectScope}
            commissionRules={form.commissionRules}
            paymentTrigger={form.paymentTrigger}
            bonusConditions={form.bonusConditions}
            legalClauses={form.legalClauses}
          />
        </div>
      </div>

      <SignatureDialog
        open={signatureOpen}
        title="Developer Digital Signature Required"
        subtitle="Sign below to create and issue this agreement to the selected broker."
        confirmLabel="Sign & Generate Agreement"
        pending={createAgreement.isPending}
        onClose={() => setSignatureOpen(false)}
        onConfirm={async (signatureDataUrl) => {
          try {
            const termsPayload = [
              `Agreement Title: ${form.agreementTitle}`,
              `Agreement Type: ${form.agreementType}`,
              `Projects Covered: ${form.selectedProjectsCsv}`,
              `Project Scope: ${form.projectScope}`,
              `Legal Clauses: ${form.legalClauses}`,
            ].join("\n");
            const commissionPayload = [
              form.commissionRules,
              `Payment Trigger: ${form.paymentTrigger}`,
              `Bonus Conditions: ${form.bonusConditions}`,
            ].join(" | ");

            await runWithToast({
              loading: "Creating agreement...",
              success: "Agreement created.",
              action: () =>
                createAgreement.mutateAsync({
                  developerId,
                  brokerId: selectedBrokerId,
                  contractRequestId: requestId || undefined,
                  agreementTitle: form.agreementTitle,
                  agreementType: form.agreementType,
                  projectsCovered: form.selectedProjectsCsv
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  projectScope: form.projectScope,
                  terms: termsPayload,
                  validityStart: form.validityStart,
                  validityEnd: form.validityEnd,
                  commissionRules: commissionPayload,
                  paymentTrigger: form.paymentTrigger,
                  bonusConditions: form.bonusConditions,
                  legalClauses: form.legalClauses,
                  initiatedBy: "developer",
                  developerSignature: signatureDataUrl,
                  status: "Pending Approval",
                }),
            });

            setSignatureOpen(false);
            router.push("/portal/contracts");
          } catch {}
        }}
      />
    </div>
  );
}
