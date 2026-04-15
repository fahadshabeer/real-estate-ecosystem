"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useEffect, useState } from "react";
import { House, Save } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { useDeveloperSettings, useUpdateDeveloperSettings } from "@/hooks/use-developer-settings";
import { runWithToast } from "@/lib/ui/toast";

export default function BrokerPreferencesSettingsPage() {
  const { currentUser } = useAppContext();
  const companyId = currentUser?.companyId;
  const settingsQuery = useDeveloperSettings(companyId);
  const updateSettings = useUpdateDeveloperSettings(companyId);
  const preferences = settingsQuery.data?.preferences;
  const [form, setForm] = useState({
    language: "English" as "English" | "Arabic",
    timezone: "Asia/Qatar",
    currency: "QAR" as "QAR" | "USD",
    emailAlerts: true,
    dashboardAlerts: true,
  });

  useEffect(() => {
    if (!preferences) return;
    setForm(preferences);
  }, [preferences]);

  const setField = <T extends keyof typeof form>(key: T, value: (typeof form)[T]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    try {
      await runWithToast({
        loading: "Saving preferences...",
        success: "Preferences updated.",
        action: () =>
          updateSettings.mutateAsync((prev) => ({
            ...prev,
            preferences: form,
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
          <span>Preferences</span>
        </div>
      </section>

      {settingsQuery.isLoading ? (
        <SettingsPageSkeleton rows={5} />
      ) : (
      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-[#4f6078]">
            Language
            <FancySelect value={form.language} onChange={(e) => setField("language", e.target.value as "English" | "Arabic")} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]">
              <option value="English">English</option>
              <option value="Arabic">Arabic</option>
            </FancySelect>
          </label>
          <label className="text-sm text-[#4f6078]">
            Timezone
            <input value={form.timezone} onChange={(e) => setField("timezone", e.target.value)} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
          </label>
          <label className="text-sm text-[#4f6078]">
            Currency
            <FancySelect value={form.currency} onChange={(e) => setField("currency", e.target.value as "QAR" | "USD")} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]">
              <option value="QAR">QAR</option>
              <option value="USD">USD</option>
            </FancySelect>
          </label>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <button type="button" className="flex items-center justify-between rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-2" onClick={() => setField("emailAlerts", !form.emailAlerts)}>
            <span>Email Alerts</span>
            <span>{form.emailAlerts ? "Enabled" : "Disabled"}</span>
          </button>
          <button type="button" className="flex items-center justify-between rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-2" onClick={() => setField("dashboardAlerts", !form.dashboardAlerts)}>
            <span>Dashboard Alerts</span>
            <span>{form.dashboardAlerts ? "Enabled" : "Disabled"}</span>
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={save} disabled={updateSettings.isPending} className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Save className="h-4 w-4" /> Save Changes
          </button>
        </div>
      </section>
      )}
    </div>
  );
}
