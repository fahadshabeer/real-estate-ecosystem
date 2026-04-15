"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/components/state/app-context";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useBrokerAgent, useUpdateAgent } from "@/hooks/use-agents";
import { runWithToast } from "@/lib/ui/toast";

export default function EditAgentPage() {
  const params = useParams<{ agentId: string }>();
  const router = useRouter();
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";

  const agentIdRaw = params?.agentId;
  const agentId = decodeURIComponent(Array.isArray(agentIdRaw) ? agentIdRaw[0] : agentIdRaw ?? "");

  const agentQuery = useBrokerAgent(agentId);
  const updateAgent = useUpdateAgent(brokerId);
  const agent = useMemo(() => agentQuery.data ?? null, [agentQuery.data]);

  const initialized = useRef(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", status: "Active" as "Active" | "Disabled" });

  useEffect(() => {
    if (!agent || initialized.current) return;
    setForm({
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      status: agent.status,
    });
    initialized.current = true;
  }, [agent]);

  const save = async () => {
    try {
      await runWithToast({
        loading: "Saving agent changes...",
        success: "Agent updated successfully.",
        action: () => updateAgent.mutateAsync({ agentId, data: form }),
      });
      router.push("/broker/agents");
    } catch {}
  };

  const stillLoading = agentQuery.isLoading;

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Agents" title="Edit Agent" backHref="/broker/agents" />

      <section className="ui-form-shell">
        {stillLoading ? (
          <p className="text-sm text-[#607187]">Loading agent details...</p>
        ) : !agent ? (
          <div className="space-y-3">
            <p className="text-sm text-rose-600">Agent not found.</p>
            <button
              onClick={() => router.push("/broker/agents")}
              className="ui-btn-secondary"
            >
              Back to Agents
            </button>
          </div>
        ) : (
          <>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
              <label className="ui-label">
                Agent Name
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="ui-input"
                />
              </label>
              <label className="ui-label">
                Contact Number
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="ui-input"
                />
              </label>
              <label className="ui-label sm:col-span-2">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="ui-input"
                />
              </label>
              <label className="ui-label sm:col-span-2">
                Active Status
                <FancySelect
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "Active" | "Disabled" }))}
                  className="ui-select"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </FancySelect>
              </label>
            </form>

            {updateAgent.error && (
              <p className="mt-3 text-sm text-rose-600">{(updateAgent.error as Error).message}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => router.push("/broker/agents")}
                className="ui-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={updateAgent.isPending}
                className="ui-btn-primary disabled:opacity-60"
              >
                {updateAgent.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
