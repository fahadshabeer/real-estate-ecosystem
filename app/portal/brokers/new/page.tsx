"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Send } from "lucide-react";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useBrokerCompaniesPagination, useCreateBrokerCompany } from "@/hooks/use-broker-companies";
import { useAppContext } from "@/components/state/app-context";
import { useCreateContractRequest } from "@/hooks/use-agreements";
import { runWithToast } from "@/lib/ui/toast";

export default function NewBrokerPage() {
  const router = useRouter();
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const createMutation = useCreateBrokerCompany();
  const createRequest = useCreateContractRequest({ developerId });
  const existingBrokersQuery = useBrokerCompaniesPagination();

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"registered" | "email">("registered");
  const [selectedBrokerId, setSelectedBrokerId] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    registrationNumber: "",
    contactPerson: "",
  });

  const brokers = useMemo(
    () => existingBrokersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [existingBrokersQuery.data?.pages],
  );
  const searchResult = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return brokers.filter((broker) =>
      [broker.id, broker.name, broker.email].join(" ").toLowerCase().includes(q),
    );
  }, [brokers, search]);

  const save = async () => {
    try {
      if (mode === "registered") {
        const selected = searchResult.find((row) => row.id === selectedBrokerId);
        if (!selected) throw new Error("No registered broker selected.");
        await runWithToast({
          loading: "Sending invitation...",
          success: "Invitation sent to registered broker.",
          action: async () => {
            await createRequest.mutateAsync({
              brokerId: selected.id,
              developerId,
              note: `Developer ${developerId} invited broker ${selected.id} to connect.`,
              initiatedBy: "developer",
            });
          },
        });
      } else {
        await runWithToast({
          loading: "Inviting broker...",
          success: "Broker invited successfully.",
          action: async () => {
            const created = await createMutation.mutateAsync({
              name: form.name,
              email: form.email,
              phone: form.phone,
              registrationNumber: form.registrationNumber,
            });
            await createRequest.mutateAsync({
              brokerId: created.id,
              developerId,
              note: `Developer ${developerId} invited broker ${created.id} to connect.`,
              initiatedBy: "developer",
            });
          },
        });
      }
      router.push("/portal/brokers");
    } catch {}
  };

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Broker Network" title="Invite Broker" backHref="/portal/brokers" />

      <section className="ui-form-shell space-y-5">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode("registered")}
            className={`rounded-md px-3 py-2 text-sm ${
              mode === "registered"
                ? "bg-[#3aa4a8] text-white"
                : "border border-[#dbe4eb] bg-white text-[#607187]"
            }`}
          >
            Broker Already Registered
          </button>
          <button
            onClick={() => setMode("email")}
            className={`rounded-md px-3 py-2 text-sm ${
              mode === "email"
                ? "bg-[#3aa4a8] text-white"
                : "border border-[#dbe4eb] bg-white text-[#607187]"
            }`}
          >
            Invite by Email
          </button>
        </div>

        {mode === "registered" ? (
          <div className="space-y-3">
            <label className="ui-label">
              Search Broker (ID, Company Name, Email)
              <div className="mt-2 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-[#46a4a8]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
                  placeholder="BRK-2026-0148 or company name"
                />
              </div>
            </label>
            <div className="rounded-md border border-[#ecf1f5] p-3">
              {searchResult.slice(0, 5).map((broker) => (
                <button
                  key={broker.id}
                  type="button"
                  onClick={() => setSelectedBrokerId(broker.id)}
                  className={`mb-2 w-full rounded-md border p-3 text-left last:mb-0 ${
                    selectedBrokerId === broker.id
                      ? "border-[#3aa4a8] bg-[#eef8f8]"
                      : "border-[#dbe4eb] bg-[#f9fbfc]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#1f2a44]">{broker.name}</p>
                  <p className="text-xs text-[#607187]">
                    {broker.id} · {broker.email} · Status {broker.status}
                  </p>
                </button>
              ))}
              {search.trim() && searchResult.length === 0 && (
                <p className="text-sm text-[#7f8a99]">No registered broker found.</p>
              )}
              {!search.trim() && <p className="text-sm text-[#7f8a99]">Search and select a registered broker.</p>}
            </div>
          </div>
        ) : (
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            {[
              ["name", "Company Name", "i-e Al Noor Brokers"],
              ["contactPerson", "Contact Person", "i-e Muhammad Ali"],
              ["email", "Broker Email", "i-e broker@company.com"],
              ["phone", "Phone", "i-e +974..."],
              ["registrationNumber", "Registration Number", "i-e BRK-REG-9921"],
            ].map(([field, label, placeholder]) => (
              <label key={field} className="ui-label">
                {label}
                <input
                  value={form[field as keyof typeof form]}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
                  className="ui-input"
                  placeholder={placeholder}
                />
              </label>
            ))}
          </form>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => router.push("/portal/brokers")} className="ui-btn-secondary">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={
              createMutation.isPending ||
              (mode === "registered" && !selectedBrokerId) ||
              (mode === "email" && (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.registrationNumber.trim()))
            }
            className="ui-btn-primary disabled:opacity-60"
          >
            <Send className="mr-2 inline-block h-4 w-4" />
            {createMutation.isPending ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </section>
    </div>
  );
}
