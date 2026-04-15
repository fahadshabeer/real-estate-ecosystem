"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useMemo, useState } from "react";
import { House, Save, UserPlus } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { useCreateInternalUser, useInternalUsers } from "@/hooks/use-internal-users";
import { runWithToast } from "@/lib/ui/toast";

const roles = ["Super Admin", "Sales Director", "Inventory Manager", "Legal Manager", "Analyst"] as const;

export default function UsersRolesSettingsPage() {
  const { currentUser } = useAppContext();
  const companyId = currentUser?.companyId;
  const usersQuery = useInternalUsers(companyId);
  const createInternalUser = useCreateInternalUser();

  const users = usersQuery.data ?? [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: roles[1] as (typeof roles)[number],
    phone: "",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const roleMatrix = useMemo(
    () => [
      { role: "Super Admin", access: "Full access across all modules" },
      { role: "Sales Director", access: "Sales control, analytics, reports" },
      { role: "Inventory Manager", access: "Projects, inventory and sharing controls" },
      { role: "Legal Manager", access: "Agreements, legal settings, contract templates" },
      { role: "Analyst", access: "Analytics, reports, notifications read-only" },
    ],
    [],
  );

  const addUser = async () => {
    if (!companyId) return;
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError("Name, email and temporary password are required.");
      return;
    }
    if (!form.email.includes("@")) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Temporary password must be at least 8 characters.");
      return;
    }
    setFormError(null);
    try {
      await runWithToast({
        loading: "Creating internal user...",
        success: "Internal user created and invited.",
        action: async () => {
          await createInternalUser.mutateAsync({
            companyId,
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            title: form.role,
          });
        },
      });
      setForm({ name: "", email: "", role: roles[1], phone: "", password: "" });
      setShowForm(false);
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
          <span>Users & Roles</span>
        </div>
      </section>

      {usersQuery.isLoading ? (
        <SettingsPageSkeleton rows={7} />
      ) : (
      <>
      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold text-[#1f2a44]">Internal Team Access</p>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {showForm && (
          <div className="mb-4 grid gap-3 rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4 md:grid-cols-2">
            <label className="text-sm text-[#4f6078]">
              Name
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
            </label>
            <label className="text-sm text-[#4f6078]">
              Email
              <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
            </label>
            <label className="text-sm text-[#4f6078]">
              Role
              <FancySelect value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as typeof form.role }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]">
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </FancySelect>
            </label>
            <label className="text-sm text-[#4f6078]">
              Phone
              <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
            </label>
            <label className="text-sm text-[#4f6078]">
              Temporary Password
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
            </label>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={addUser}
                disabled={createInternalUser.isPending}
                className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-2 text-sm font-medium text-[#1f2a44]"
              >
                <Save className="h-4 w-4" />
                Save User
              </button>
              {formError ? <p className="mt-2 text-xs text-[#c24141]">{formError}</p> : null}
            </div>
          </div>
        )}

        <div className="min-h-[340px] overflow-x-auto rounded-md border border-[#dbe4eb]">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1f2a44]">{user.name}</p>
                    <p className="text-xs text-[#7f8a99]">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">{user.title}</td>
                  <td className="px-4 py-3">{user.phone}</td>
                  <td className="px-4 py-3">{user.status}</td>
                  <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No users added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <p className="text-base font-semibold text-[#1f2a44]">Role Permission Matrix</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {roleMatrix.map((item) => (
            <div key={item.role} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
              <p className="text-sm font-semibold text-[#1f2a44]">{item.role}</p>
              <p className="mt-1 text-xs text-[#607187]">{item.access}</p>
            </div>
          ))}
        </div>
      </section>
      </>
      )}
    </div>
  );
}
