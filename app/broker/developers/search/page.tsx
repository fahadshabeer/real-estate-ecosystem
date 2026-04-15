"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { companyRepository } from "@/lib/backend/factory";
import { useCreateContractRequest } from "@/hooks/use-agreements";
import { runWithToast } from "@/lib/ui/toast";

export default function BrokerDeveloperSearchPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const createRequest = useCreateContractRequest({ brokerId });

  const [query, setQuery] = useState("");
  const [note, setNote] = useState("Interested in premium residential inventory.");
  const [searching, setSearching] = useState(false);
  const [rows, setRows] = useState<Array<{ id: string; name: string; status: string; logoUrl?: string }>>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  const searchDevelopers = async () => {
    if (!hasQuery) return;
    setSearching(true);
    try {
      const result = await runWithToast({
        loading: "Searching developers...",
        success: (data) => `Found ${data.length} developer result(s).`,
        action: () => companyRepository.searchCompanies("developer", query, 30),
      });
      setRows(result.map((row) => ({ id: row.id, name: row.name, status: row.status, logoUrl: row.logoUrl })));
    } catch {
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Developer Search</h1>
        <p className="mt-1 text-sm text-[#607187]">Search developers by company name or unique ID and send connection requests.</p>
      </section>

      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <div className="flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="DEV-QA-2026-0034 or company name"
          />
          <button onClick={searchDevelopers} disabled={!hasQuery || searching} className="rounded-md bg-[#3aa4a8] px-3 py-2 text-xs font-medium text-white disabled:opacity-60">
            {searching ? "Searching..." : "Find"}
          </button>
        </div>
        <label className="mt-3 block text-sm text-[#4f6078]">
          Request Message
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-2 text-sm text-[#1f2a44] outline-none" />
        </label>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-[#dbe4eb] bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-[#dbe4eb] bg-[#f8fafc]">
                {row.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.logoUrl} alt={row.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-[#8a96a8]">DEV</span>
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1f2a44]">{row.name}</p>
                <p className="text-xs text-[#7f8a99]">{row.id} · {row.status}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={submittingId === row.id}
              onClick={async () => {
                setSubmittingId(row.id);
                try {
                  await runWithToast({
                    loading: "Sending request...",
                    success: "Connection request sent.",
                    action: () =>
                      createRequest.mutateAsync({
                        brokerId,
                        developerId: row.id,
                        note,
                        initiatedBy: "broker",
                      }),
                  });
                } catch {
                } finally {
                  setSubmittingId(null);
                }
              }}
              className="mt-3 rounded-md bg-[#3aa4a8] px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
            >
              {submittingId === row.id ? "Sending..." : "Request Connection"}
            </button>
          </article>
        ))}
        {!searching && rows.length === 0 && (
          <p className="rounded-xl border border-[#dbe4eb] bg-white p-4 text-sm text-[#7f8a99]">
            Search developers to see results.
          </p>
        )}
      </section>
    </div>
  );
}

