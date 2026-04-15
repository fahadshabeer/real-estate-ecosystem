"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Download, FileSearch, X } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useBrokerAgreements, useRespondAgreement } from "@/hooks/use-agreements";
import { SignatureDialog } from "@/components/ui/signature-dialog";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { AgreementStatusPill } from "@/components/broker/agreement-status-pill";
import { useDownloadContractPdf, useGenerateContractPdf } from "@/hooks/use-contract-documents";
import { runWithToast } from "@/lib/ui/toast";

export default function BrokerPendingAgreementsPage() {
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const agreementsQuery = useBrokerAgreements(brokerId);
  const respond = useRespondAgreement(brokerId);
  const generatePdf = useGenerateContractPdf();
  const downloadContract = useDownloadContractPdf();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [signatureAgreementId, setSignatureAgreementId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      (agreementsQuery.data?.pages.flatMap((page) => page.items) ?? []).filter(
        (agreement) => agreement.status === "Pending Approval" || agreement.status === "Draft",
      ),
    [agreementsQuery.data?.pages],
  );

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
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Pending Agreements</h1>
        <p className="mt-1 text-sm text-[#607187]">Review, accept, or reject legal agreements before inventory becomes visible.</p>
      </section>

      {agreementsQuery.error && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {agreementsQuery.error instanceof Error ? agreementsQuery.error.message : "Unable to load agreements."}
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
        </div>
        <div className="min-h-[520px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Contract ID</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Received Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agreementsQuery.isLoading && <TableSkeletonRows cols={5} rows={8} />}
              {!agreementsQuery.isLoading &&
                rows.map((agreement) => (
                  <tr key={agreement.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{agreement.id}</td>
                    <td className="px-4 py-3"><DeveloperCell developerId={agreement.developerId} /></td>
                    <td className="px-4 py-3">{new Date(agreement.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><AgreementStatusPill status={agreement.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/broker/agreements/${encodeURIComponent(agreement.id)}`} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069]" title="Review">
                          <FileSearch className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSignatureAgreementId(agreement.id)}
                          disabled={respond.isPending}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-emerald-600 disabled:opacity-60"
                          title="Accept"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Rejecting agreement...",
                                success: "Agreement rejected.",
                                action: () => respond.mutateAsync({ agreementId: agreement.id, action: "Reject" }),
                              });
                            } catch {}
                          }}
                          disabled={respond.isPending}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500 disabled:opacity-60"
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => downloadPdf(agreement.id)}
                          disabled={(generatePdf.isPending || downloadContract.isPending) && downloadingId === agreement.id}
                          className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#355069] disabled:opacity-50"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!agreementsQuery.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No pending agreements.
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

      <SignatureDialog
        open={Boolean(signatureAgreementId)}
        title="Broker Digital Signature Required"
        subtitle="Sign below to accept this agreement. Inventory will become visible only after acceptance."
        confirmLabel="Agree & Accept"
        pending={respond.isPending}
        onClose={() => setSignatureAgreementId(null)}
        onConfirm={async (signatureDataUrl) => {
          if (!signatureAgreementId) return;
          try {
            await runWithToast({
              loading: "Accepting agreement...",
              success: "Agreement accepted.",
              action: () =>
                respond.mutateAsync({
                  agreementId: signatureAgreementId,
                  action: "Accept",
                  brokerSignature: signatureDataUrl,
                }),
            });
            setSignatureAgreementId(null);
          } catch {}
        }}
      />
    </div>
  );
}
