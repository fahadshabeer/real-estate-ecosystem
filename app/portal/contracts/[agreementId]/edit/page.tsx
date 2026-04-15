"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/components/state/app-context";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useAgreementById, useUpdateAgreement } from "@/hooks/use-agreements";
import { runWithToast } from "@/lib/ui/toast";

export default function EditAgreementPage() {
  const params = useParams<{ agreementId: string }>();
  const agreementIdRaw = params?.agreementId;
  const agreementId = decodeURIComponent(Array.isArray(agreementIdRaw) ? agreementIdRaw[0] : agreementIdRaw ?? "");
  const router = useRouter();
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";

  const agreementQuery = useAgreementById(agreementId);
  const updateAgreement = useUpdateAgreement(developerId);
  const agreement = agreementQuery.data ?? null;

  const [form, setForm] = useState({
    agreementTitle: "",
    agreementType: "Non-Exclusive" as "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited",
    selectedProjectsCsv: "",
    projectScope: "",
    legalClauses: "",
    paymentTrigger: "",
    bonusConditions: "",
  });

  useEffect(() => {
    if (!agreement) return;
    setForm({
      agreementTitle: agreement.agreementTitle ?? "Agreement",
      agreementType: agreement.agreementType ?? "Non-Exclusive",
      selectedProjectsCsv: (agreement.projectsCovered ?? []).join(", "),
      projectScope: agreement.projectScope ?? "",
      legalClauses: agreement.legalClauses ?? "",
      paymentTrigger: agreement.paymentTrigger ?? "",
      bonusConditions: agreement.bonusConditions ?? "",
    });
  }, [agreement]);

  if (agreementQuery.isLoading && !agreement) {
    return <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">Loading agreement...</div>;
  }

  if (agreementQuery.error) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {agreementQuery.error instanceof Error ? agreementQuery.error.message : "Unable to load agreement."}
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">
        Agreement not found.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Agreements" title="Edit Agreement" backHref={`/portal/contracts/${encodeURIComponent(agreement.id)}`} />

      <section className="ui-form-shell">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="ui-label">
            Agreement Title
            <input className="ui-input" value={form.agreementTitle} onChange={(event) => setForm((prev) => ({ ...prev, agreementTitle: event.target.value }))} />
          </label>
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
          <label className="ui-label sm:col-span-2">
            Projects Covered
            <input className="ui-input" value={form.selectedProjectsCsv} onChange={(event) => setForm((prev) => ({ ...prev, selectedProjectsCsv: event.target.value }))} />
          </label>
          <label className="ui-label sm:col-span-2">
            Project Scope
            <textarea className="ui-textarea" value={form.projectScope} onChange={(event) => setForm((prev) => ({ ...prev, projectScope: event.target.value }))} />
          </label>
          <label className="ui-label">
            Payment Trigger
            <input className="ui-input" value={form.paymentTrigger} onChange={(event) => setForm((prev) => ({ ...prev, paymentTrigger: event.target.value }))} />
          </label>
          <label className="ui-label">
            Bonus Conditions
            <input className="ui-input" value={form.bonusConditions} onChange={(event) => setForm((prev) => ({ ...prev, bonusConditions: event.target.value }))} />
          </label>
          <label className="ui-label sm:col-span-2">
            Legal Clauses
            <textarea className="ui-textarea" value={form.legalClauses} onChange={(event) => setForm((prev) => ({ ...prev, legalClauses: event.target.value }))} />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => router.push(`/portal/contracts/${encodeURIComponent(agreement.id)}`)} className="ui-btn-secondary">
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Saving agreement...",
                  success: "Agreement updated.",
                  action: () =>
                    updateAgreement.mutateAsync({
                      agreementId: agreement.id,
                      agreementTitle: form.agreementTitle,
                      agreementType: form.agreementType,
                      projectsCovered: form.selectedProjectsCsv
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                      projectScope: form.projectScope,
                      paymentTrigger: form.paymentTrigger,
                      bonusConditions: form.bonusConditions,
                      legalClauses: form.legalClauses,
                    }),
                });
                router.push(`/portal/contracts/${encodeURIComponent(agreement.id)}`);
              } catch {}
            }}
            className="ui-btn-primary"
          >
            Save Changes
          </button>
        </div>
      </section>
    </div>
  );
}
