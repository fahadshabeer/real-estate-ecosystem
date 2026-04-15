"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, FileSearch, Search } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAgreements } from "@/hooks/use-agreements";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { AgreementStatusPill } from "@/components/broker/agreement-status-pill";
import { useDownloadContractPdf, useGenerateContractPdf } from "@/hooks/use-contract-documents";
import { runWithToast } from "@/lib/ui/toast";

export default function BrokerAgreementsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const agreementsQuery = useBrokerAgreements(brokerId);
  const generatePdf = useGenerateContractPdf();
  const downloadContract = useDownloadContractPdf();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const rows = useMemo(() => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [], [agreementsQuery.data?.pages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const agreementType = row.agreementType ?? "Non-Exclusive";
      const projectsCovered = row.projectsCovered?.length ?? 0;
      const matchesSearch =
        !q || [row.id, row.developerId, row.status, agreementType, String(projectsCovered)].join(" ").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" ? true : row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const downloadPdf = async (agreementId: string) => {
    try {
      setDownloadingId(agreementId);
      const result = await runWithToast({
        loading: "Generating contract PDF...",
        success: "Contract PDF ready.",
        action: () => generatePdf.mutateAsync(agreementId),
      });
      await runWithToast({
        loading: "Downloading PDF...",
        success: "Contract PDF downloaded.",
        action: () => downloadContract.mutateAsync({ downloadUrl: result.downloadUrl, fallbackFileName: `${result.contractId}.pdf` }),
      });
    } catch {
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">All Agreements</h1>
        <p className="mt-1 text-sm text-[#607187]">Legal control center for all broker-side agreements and rights.</p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search contract ID or developer"
            />
          </div>
          <FancySelect
            className="h-10 min-w-[190px] rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
            <option value="Rejected">Rejected</option>
            <option value="Renewed">Renewed</option>
          </FancySelect>
        </div>
      </section>

      {agreementsQuery.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {agreementsQuery.error instanceof Error ? agreementsQuery.error.message : "Unable to load agreements."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{filtered.length}</span>)
          </p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Contract ID</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Agreement Type</th>
                <th className="px-4 py-3">Projects Covered</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agreementsQuery.isLoading && <TableSkeletonRows cols={7} rows={8} />}
              {!agreementsQuery.isLoading &&
                filtered.map((agreement) => {
                  const agreementType = agreement.agreementType ?? "Non-Exclusive";
                  const projectsCovered = agreement.projectsCovered?.length ?? 0;
                  return (
                    <tr key={agreement.id} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3 font-medium text-[#1f2a44]">{agreement.id}</td>
                      <td className="px-4 py-3"><DeveloperCell developerId={agreement.developerId} /></td>
                      <td className="px-4 py-3">{agreementType}</td>
                      <td className="px-4 py-3">{projectsCovered}</td>
                      <td className="px-4 py-3">{agreement.validityEnd}</td>
                      <td className="px-4 py-3"><AgreementStatusPill status={agreement.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/broker/agreements/${encodeURIComponent(agreement.id)}`} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]" title="Open">
                            <FileSearch className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => downloadPdf(agreement.id)}
                            disabled={(generatePdf.isPending || downloadContract.isPending) && downloadingId === agreement.id}
                            className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069] disabled:opacity-50"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!agreementsQuery.isLoading && filtered.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={7}>
                    No agreements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!agreementsQuery.isLoading && agreementsQuery.hasNextPage && (
          <div className="border-t border-[#ecf1f5] px-6 py-4">
            <button
              type="button"
              onClick={() => agreementsQuery.fetchNextPage()}
              disabled={agreementsQuery.isFetchingNextPage}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#355069] disabled:opacity-60"
            >
              {agreementsQuery.isFetchingNextPage ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
