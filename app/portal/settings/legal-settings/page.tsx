"use client";

import { useEffect, useState } from "react";
import { House, Save } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { useDeveloperSettings, useUpdateDeveloperSettings } from "@/hooks/use-developer-settings";
import { runWithToast } from "@/lib/ui/toast";

export default function LegalSettingsPage() {
  const { currentUser } = useAppContext();
  const companyId = currentUser?.companyId;
  const settingsQuery = useDeveloperSettings(companyId);
  const updateSettings = useUpdateDeveloperSettings(companyId);

  const legal = settingsQuery.data?.legal;
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    jurisdiction: legal?.jurisdiction ?? "Qatar Legal Framework",
    legalFooterText: legal?.legalFooterText ?? "",
    signatureAuthority: legal?.signatureAuthority ?? "Authorized Signatory",
    defaultAgreementDurationMonths: legal?.defaultAgreementDurationMonths ?? 12,
    defaultCommissionPercent: legal?.defaultCommissionPercent ?? 5,
    expiryReminderDays: legal?.expiryReminderDays ?? 15,
  });

  useEffect(() => {
    if (!legal) return;
    setForm({
      jurisdiction: legal.jurisdiction,
      legalFooterText: legal.legalFooterText,
      signatureAuthority: legal.signatureAuthority,
      defaultAgreementDurationMonths: legal.defaultAgreementDurationMonths,
      defaultCommissionPercent: legal.defaultCommissionPercent,
      expiryReminderDays: legal.expiryReminderDays,
    });
  }, [legal]);

  const save = async () => {
    if (form.defaultAgreementDurationMonths < 1 || form.defaultAgreementDurationMonths > 120) {
      setError("Agreement duration must be between 1 and 120 months.");
      return;
    }
    if (form.defaultCommissionPercent < 0 || form.defaultCommissionPercent > 100) {
      setError("Default commission must be between 0 and 100.");
      return;
    }
    if (form.expiryReminderDays < 1 || form.expiryReminderDays > 180) {
      setError("Expiry reminder days must be between 1 and 180.");
      return;
    }
    setError(null);
    try {
      await runWithToast({
        loading: "Saving legal settings...",
        success: "Legal settings updated.",
        action: () =>
          updateSettings.mutateAsync((prev) => ({
            ...prev,
            legal: {
              ...prev.legal,
              ...form,
            },
          })),
      });
    } catch {}
  };

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Legal Settings</span>
        </div>
      </section>

      {settingsQuery.isLoading ? (
        <SettingsPageSkeleton rows={6} />
      ) : (
      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-[#4f6078]">
            Default Contract Jurisdiction
            <input
              value={form.jurisdiction}
              onChange={(e) => setForm((p) => ({ ...p, jurisdiction: e.target.value }))}
              className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            />
          </label>
          <label className="text-sm text-[#4f6078]">
            Signature Authority
            <input
              value={form.signatureAuthority}
              onChange={(e) => setForm((p) => ({ ...p, signatureAuthority: e.target.value }))}
              className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            />
          </label>
          <label className="text-sm text-[#4f6078]">
            Default Agreement Duration (Months)
            <input
              type="number"
              value={form.defaultAgreementDurationMonths}
              onChange={(e) => setForm((p) => ({ ...p, defaultAgreementDurationMonths: Number(e.target.value) }))}
              className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            />
          </label>
          <label className="text-sm text-[#4f6078]">
            Default Commission (%)
            <input
              type="number"
              value={form.defaultCommissionPercent}
              onChange={(e) => setForm((p) => ({ ...p, defaultCommissionPercent: Number(e.target.value) }))}
              className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            />
          </label>
          <label className="text-sm text-[#4f6078] md:col-span-2">
            Default Expiry Reminder Days
            <input
              type="number"
              value={form.expiryReminderDays}
              onChange={(e) => setForm((p) => ({ ...p, expiryReminderDays: Number(e.target.value) }))}
              className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            />
          </label>
          <label className="text-sm text-[#4f6078] md:col-span-2">
            Legal Footer Text
            <textarea
              value={form.legalFooterText}
              onChange={(e) => setForm((p) => ({ ...p, legalFooterText: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#1f2a44]"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={updateSettings.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-[#c24141]">{error}</p> : null}
      </section>
      )}
    </div>
  );
}
