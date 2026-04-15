"use client";

import { useState } from "react";
import { House, Save } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { useDeveloperSettings, useUpdateDeveloperSettings } from "@/hooks/use-developer-settings";
import { useChangePassword } from "@/hooks/use-security";
import { runWithToast } from "@/lib/ui/toast";

export default function SecuritySettingsPage() {
  const { currentUser } = useAppContext();
  const companyId = currentUser?.companyId;
  const settingsQuery = useDeveloperSettings(companyId);
  const updateSettings = useUpdateDeveloperSettings(companyId);
  const changePasswordMutation = useChangePassword();

  const security = settingsQuery.data?.security;
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const toggle = async (field: "twoFaEnabled" | "otpLoginEnabled" | "newLoginAlert") => {
    await runWithToast({
      loading: "Saving security setting...",
      success: "Security setting updated.",
      action: () =>
        updateSettings.mutateAsync((prev) => ({
          ...prev,
          security: { ...prev.security, [field]: !prev.security[field] },
        })),
    });
  };

  const changePassword = async () => {
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("Password confirmation does not match.");
      return;
    }
    setPasswordError(null);
    await runWithToast({
      loading: "Updating password...",
      success: "Password updated successfully.",
      action: () =>
        changePasswordMutation.mutateAsync({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
        }),
    });
    setPasswordForm({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Security</span>
        </div>
      </section>

      {settingsQuery.isLoading ? (
        <SettingsPageSkeleton rows={6} />
      ) : (
      <>
      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4">
            <p className="text-sm font-semibold text-[#1f2a44]">Security Controls</p>
            <div className="mt-3 space-y-2 text-sm">
              <button type="button" className="flex w-full items-center justify-between rounded-md border border-[#dbe4eb] bg-white px-3 py-2" onClick={() => toggle("twoFaEnabled")}>
                <span>Enable 2FA (future ready)</span>
                <span>{security?.twoFaEnabled ? "On" : "Off"}</span>
              </button>
              <button type="button" className="flex w-full items-center justify-between rounded-md border border-[#dbe4eb] bg-white px-3 py-2" onClick={() => toggle("otpLoginEnabled")}>
                <span>Enable OTP Login (future ready)</span>
                <span>{security?.otpLoginEnabled ? "On" : "Off"}</span>
              </button>
              <button type="button" className="flex w-full items-center justify-between rounded-md border border-[#dbe4eb] bg-white px-3 py-2" onClick={() => toggle("newLoginAlert")}>
                <span>New Login Alerts</span>
                <span>{security?.newLoginAlert ? "On" : "Off"}</span>
              </button>
            </div>
          </div>

          <div className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4">
            <p className="text-sm font-semibold text-[#1f2a44]">Change Password</p>
            <div className="mt-3 space-y-2">
              <input
                type="password"
                placeholder="Current password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                className="h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm"
              />
              <input
                type="password"
                placeholder="New password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
                className="h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                className="h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm"
              />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => void changePassword()}
              >
                <Save className="h-4 w-4" />
                Update Password
              </button>
              {passwordError ? <p className="text-xs text-[#c24141]">{passwordError}</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <p className="text-base font-semibold text-[#1f2a44]">Login History</p>
        <div className="mt-3 overflow-x-auto rounded-md border border-[#dbe4eb]">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Location</th>
              </tr>
            </thead>
            <tbody>
              {(security?.loginHistory ?? []).map((item) => (
                <tr key={item.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3">{new Date(item.date).toLocaleString()}</td>
                  <td className="px-4 py-3">{item.device}</td>
                  <td className="px-4 py-3">{item.ip}</td>
                  <td className="px-4 py-3">{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}
    </div>
  );
}
