"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/state/app-context";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useCreateAgent } from "@/hooks/use-agents";
import { runWithToast } from "@/lib/ui/toast";

export default function NewAgentPage() {
  const router = useRouter();
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const createAgent = useCreateAgent(brokerId);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const save = async () => {
    try {
      await runWithToast({
        loading: "Adding agent...",
        success: "Agent added successfully.",
        action: () => createAgent.mutateAsync({ brokerId, ...form }),
      });
      router.push("/broker/agents");
    } catch {}
  };

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Agents" title="Add New Agent" backHref="/broker/agents" />

      <section className="ui-form-shell">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <label className="ui-label">
            Agent Name
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="ui-input"
              placeholder="i-e Ali Ahmad"
            />
          </label>
          <label className="ui-label">
            Contact Number
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="ui-input"
              placeholder="i-e +923001234567"
            />
          </label>
          <label className="ui-label sm:col-span-2">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="ui-input"
              placeholder="i-e abc@gmail.com"
            />
          </label>
          <label className="ui-label sm:col-span-2">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="ui-input"
              placeholder="Minimum 8 characters"
            />
          </label>
        </form>

        {createAgent.error && (
          <p className="mt-3 text-sm text-rose-600">{(createAgent.error as Error).message}</p>
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
            disabled={createAgent.isPending}
            className="ui-btn-primary disabled:opacity-60"
          >
            {createAgent.isPending ? "Adding..." : "Add Agent"}
          </button>
        </div>
      </section>
    </div>
  );
}
