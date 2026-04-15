"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, House, Pencil, Plus, Search, ShieldAlert, ShieldX } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useDeveloperAgreements, useUpdateAgreement } from "@/hooks/use-agreements";
import { useDownloadContractPdf, useGenerateContractPdf } from "@/hooks/use-contract-documents";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { BrokerCell } from "@/components/ui/broker-cell";

export default function ContractsPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const agreementsQuery = useDeveloperAgreements(developerId);
  const updateAgreement = useUpdateAgreement(developerId);
  const generatePdf = useGenerateContractPdf();
  const downloadContract = useDownloadContractPdf();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const agreements = useMemo(
    () => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agreementsQuery.data?.pages],
  );

  const enriched = useMemo(() => {
    return agreements.map((agreement) => {
      const expiryDate = new Date(agreement.validityEnd);
      const daysRemaining = Number.isFinite(expiryDate.getTime())
        ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      const computedStatus =
        agreement.status === "Active" && daysRemaining < 0 ? "Expired" : agreement.status;
      return {
        ...agreement,
        uiStatus: computedStatus,
        agreementType: agreement.agreementType ?? "Non-Exclusive",
        projectsCovered: agreement.projectsCovered?.length ?? 0,
        daysRemaining,
      };
    });
  }, [agreements]);

  const filtered = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return enriched.filter((row) => {
      const matchesQuery =
        !q ||
        [
          row.id,
          row.brokerId,
          row.uiStatus,
          row.validityStart,
          row.validityEnd,
          row.agreementType,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus = statusFilter === "all" ? true : row.uiStatus.toLowerCase() === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [enriched, statusFilter, tableSearch]);

  const expiringSoon = enriched.filter((row) => row.uiStatus === "Active" && row.daysRemaining >= 0 && row.daysRemaining <= 15).length;

  const downloadPdf = async (agreementId: string) => {
    try {
      setDownloadingId(agreementId);
      const result = await runWithToast({
        loading: "Generating contract PDF...",
        success: (row) => `PDF ready for ${row.contractId}.`,
        description: (row) => `Verify: ${row.verificationUrl}`,
        action: () => generatePdf.mutateAsync(agreementId),
      });
      await runWithToast({
        loading: "Downloading PDF...",
        success: "Contract PDF downloaded.",
        action: () =>
          downloadContract.mutateAsync({
            downloadUrl: result.downloadUrl,
            fallbackFileName: `${result.contractId}.pdf`,
          }),
      });
    } catch {
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Agreements</span>
          <span>/</span>
          <span>All Agreements</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={tableSearch}
              onChange={(event) => setTableSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search agreements"
            />
          </div>
          <Link
            href="/portal/contracts/new"
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Create Agreement
          </Link>
        </div>
        {expiringSoon > 0 && (
          <div className="inline-flex items-center gap-2 rounded-md border border-[#f4d9a6] bg-[#fff8e8] px-3 py-2 text-sm text-[#9a6700]">
            <ShieldAlert className="h-4 w-4" />
            {expiringSoon} agreement(s) expiring within 15 days.
          </div>
        )}
      </section>

      {agreementsQuery.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {agreementsQuery.error instanceof Error ? agreementsQuery.error.message : "Unable to load agreements."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{filtered.length}</span>)
          </p>
          <div className="flex items-center gap-3 text-sm text-[#8f9aaa]">
            <span>Status</span>
            <FancySelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 min-w-[180px] rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="pending approval">Pending Approval</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="renewed">Renewed</option>
              <option value="rejected">Rejected</option>
            </FancySelect>
          </div>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Contract ID</th>
                <th className="px-4 py-3">Broker Company</th>
                <th className="px-4 py-3">Agreement Type</th>
                <th className="px-4 py-3">Projects Covered</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agreementsQuery.isLoading && agreements.length === 0 && <TableSkeletonRows cols={8} rows={8} />}
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{row.id}</td>
                  <td className="px-4 py-3">
                    <BrokerCell brokerId={row.brokerId} />
                  </td>
                  <td className="px-4 py-3">{row.agreementType}</td>
                  <td className="px-4 py-3">{row.projectsCovered}</td>
                  <td className="px-4 py-3">{row.validityStart}</td>
                  <td className="px-4 py-3">{row.validityEnd}</td>
                  <td className="px-4 py-3">
                    <AgreementStatusPill status={row.uiStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/portal/contracts/${encodeURIComponent(row.id)}`}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        title="Open agreement"
                        aria-label="Open agreement"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/portal/contracts/${encodeURIComponent(row.id)}/edit`}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-amber-500"
                        title="Edit agreement"
                        aria-label="Edit agreement"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        disabled={updateAgreement.isPending}
                        onClick={async () => {
                          try {
                            await runWithToast({
                              loading: "Suspending agreement...",
                              success: "Agreement suspended.",
                              action: () =>
                                updateAgreement.mutateAsync({
                                  agreementId: row.id,
                                  status: "Suspended",
                                }),
                            });
                          } catch {}
                        }}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500"
                        title="Suspend agreement"
                        aria-label="Suspend agreement"
                      >
                        <ShieldX className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPdf(row.id)}
                        disabled={(generatePdf.isPending || downloadContract.isPending) && downloadingId === row.id}
                        className="inline-flex items-center rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078] disabled:opacity-50"
                        title="Download PDF"
                        aria-label="Download PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!agreementsQuery.isLoading && filtered.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={8}>
                    No agreements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#ecf1f5] px-6 py-4">
          <span className="text-sm text-[#9aa6b2]">
            Currently at Page: 1 of {agreementsQuery.hasNextPage ? 2 : 1}
          </span>
          <button className="rounded-full border border-[#dbe4eb] bg-white px-3 py-1.5 text-sm text-[#4f6078] opacity-50">
            Prev
          </button>
          <button
            disabled={!agreementsQuery.hasNextPage || agreementsQuery.isFetchingNextPage}
            onClick={() => agreementsQuery.fetchNextPage()}
            className="rounded-full border border-[#dbe4eb] bg-white px-3 py-1.5 text-sm text-[#4f6078] disabled:opacity-40"
          >
            {agreementsQuery.isFetchingNextPage ? "Loading..." : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}

function AgreementStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "draft"
      ? "bg-slate-200 text-slate-700"
      : normalized === "pending approval"
        ? "bg-amber-100 text-amber-700"
        : normalized === "active"
          ? "bg-emerald-100 text-emerald-700"
          : normalized === "expired"
            ? "bg-rose-100 text-rose-700"
            : normalized === "suspended"
              ? "bg-red-200 text-red-800"
              : normalized === "renewed"
                ? "bg-sky-100 text-sky-700"
                : "bg-slate-200 text-slate-700";
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}
