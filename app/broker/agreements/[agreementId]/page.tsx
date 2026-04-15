"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, QrCode, ArrowUpRight } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useAgreementById } from "@/hooks/use-agreements";
import { useActivityLogsPagination } from "@/hooks/use-activity";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { useDownloadContractPdf, useGenerateContractPdf } from "@/hooks/use-contract-documents";
import { runWithToast } from "@/lib/ui/toast";
import { AgreementStatusPill } from "@/components/broker/agreement-status-pill";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

const tabs = ["Overview", "Projects", "Shared Inventory", "PDF Contract", "History", "Activity"] as const;

export default function BrokerAgreementDetailPage() {
  const params = useParams<{ agreementId: string }>();
  const agreementId = decodeURIComponent(params?.agreementId ?? "");
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [generatedPdf, setGeneratedPdf] = useState<{ downloadUrl: string; contractId: string; verificationUrl: string } | null>(null);

  const agreementQuery = useAgreementById(agreementId);
  const propertiesQuery = useVisibleBrokerProperties(brokerId);
  const logsQuery = useActivityLogsPagination({ role: "broker", actorLabel: brokerId, limit: 100 });
  const generatePdf = useGenerateContractPdf();
  const downloadContract = useDownloadContractPdf();

  const agreement = agreementQuery.data;
  const sharedInventoryRows = (propertiesQuery.data ?? []).filter((row) => row.agreementId === agreementId);
  const historyRows = useMemo(() => {
    if (!agreement) return [];
    const logs = logsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    const base = [
      {
        id: `${agreement.id}-created`,
        action: "Agreement Created",
        actor: "System",
        details: `Agreement ${agreement.id} created with status ${agreement.status}.`,
        createdAt: agreement.createdAt,
      },
      ...(agreement.updatedAt !== agreement.createdAt
        ? [
            {
              id: `${agreement.id}-updated`,
              action: "Agreement Updated",
              actor: "System",
              details: `Agreement ${agreement.id} updated to status ${agreement.status}.`,
              createdAt: agreement.updatedAt,
            },
          ]
        : []),
    ];
    const fromLogs = logs
      .filter((log) => log.details.includes(agreement.id))
      .map((log) => ({
        id: `log-${log.id}`,
        action: log.action,
        actor: log.actorLabel,
        details: log.details,
        createdAt: log.createdAt,
      }));
    return [...base, ...fromLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [agreement, logsQuery.data?.pages]);
  const projects = useMemo(() => {
    if (agreement?.projectsCovered?.length) {
      return agreement.projectsCovered.map((project) => ({
        project,
        scope: agreement.projectScope || "Selected",
        units: sharedInventoryRows.filter((row) => row.projectName === project).length,
      }));
    }
    const grouped = new Map<string, number>();
    for (const row of sharedInventoryRows) {
      const key = row.projectName || "N/A";
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    return Array.from(grouped.entries()).map(([project, units]) => ({ project, scope: "Shared", units }));
  }, [agreement?.projectScope, agreement?.projectsCovered, sharedInventoryRows]);

  const daysRemaining = agreement ? Math.ceil((new Date(agreement.validityEnd).getTime() - Date.now()) / 86400000) : 0;

  if (agreementQuery.isLoading) {
    return (
      <div className="space-y-4 pb-6">
        <div className="h-28 animate-pulse rounded-xl border border-[#dbe4eb] bg-[#eef3f6]" />
        <div className="h-14 animate-pulse rounded-md border border-[#dbe4eb] bg-[#eef3f6]" />
        <div className="overflow-hidden rounded-xl border border-[#dbe4eb] bg-white p-5">
          <TableSkeletonRows cols={4} rows={6} />
        </div>
      </div>
    );
  }

  if (agreementQuery.error) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {agreementQuery.error instanceof Error ? agreementQuery.error.message : "Unable to load agreement."}
        </p>
        <Link href="/broker/agreements" className="inline-flex rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#355069]">
          Back to Agreements
        </Link>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-[#dbe4eb] bg-white p-4 text-sm text-[#607187]">Agreement not found.</p>
        <Link href="/broker/agreements" className="inline-flex rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#355069]">
          Back to Agreements
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">{agreement.id}</h1>
            <p className="mt-1 text-sm text-[#607187]">Broker-side legal detail view and rights summary</p>
          </div>
          <AgreementStatusPill status={agreement.status} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Projects Covered" value={projects.length} />
          <Stat label="Linked Properties" value={sharedInventoryRows.length} />
          <Stat label="Days Remaining" value={daysRemaining} />
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-2 text-sm ${
                activeTab === tab
                  ? "bg-[#3aa4a8] font-semibold text-white"
                  : "border border-[#dbe4eb] bg-white text-[#607187] hover:bg-[#f5f9fb]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        {activeTab === "Overview" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Meta label="Contract ID" value={agreement.id} />
            <Meta label="Developer" value={<DeveloperCell developerId={agreement.developerId} />} />
            <Meta label="Agreement Type" value={agreement.agreementType ?? "Non-Exclusive"} />
            <Meta label="Effective Date" value={agreement.validityStart} />
            <Meta label="Expiry Date" value={agreement.validityEnd} />
            <Meta label="Commission Terms" value={agreement.commissionRules} />
            <Meta label="Rights Summary" value={agreement.projectScope ?? "Inventory visibility rights are controlled by active mapping."} />
          </div>
        )}

        {activeTab === "Projects" && (
          <div className="overflow-hidden rounded-md border border-[#dbe4eb]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Scope</th>
                    <th className="px-4 py-3">Units Included</th>
                    <th className="px-4 py-3">Sharing Type</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((row) => (
                    <tr key={row.project} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{row.project}</td>
                      <td className="px-4 py-3">{row.scope}</td>
                      <td className="px-4 py-3">{row.units}</td>
                      <td className="px-4 py-3">{agreement.agreementType ?? "Non-Exclusive"}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/broker/properties?project=${encodeURIComponent(row.project)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                        No project scope available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Shared Inventory" && (
          <div className="overflow-hidden rounded-md border border-[#dbe4eb]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">Property Code</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Shared Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedInventoryRows.map((row) => (
                    <tr key={`${row.id}-${row.sharedDate}`} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{row.id}</td>
                      <td className="px-4 py-3">{row.projectName}</td>
                      <td className="px-4 py-3">{new Date(row.sharedDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/broker/properties/${encodeURIComponent(row.id)}?agreementId=${encodeURIComponent(agreement.id)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {sharedInventoryRows.length === 0 && (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                        No shared inventory linked yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "PDF Contract" && (
          <div className="space-y-3">
            <p className="text-sm text-[#607187]">
              Generate and verify legal PDF with watermark, signatures, and QR verification.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const result = await runWithToast({
                      loading: "Generating contract PDF...",
                      success: "Contract PDF generated.",
                      action: () => generatePdf.mutateAsync(agreement.id),
                    });
                    setGeneratedPdf({
                      downloadUrl: result.downloadUrl,
                      contractId: result.contractId,
                      verificationUrl: result.verificationUrl,
                    });
                    await runWithToast({
                      loading: "Downloading PDF...",
                      success: "Contract PDF downloaded.",
                      action: () => downloadContract.mutateAsync({ downloadUrl: result.downloadUrl, fallbackFileName: `${result.contractId}.pdf` }),
                    });
                  } catch {}
                }}
                className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-2 text-sm text-[#355069]"
              >
                <Download className="h-4 w-4" />
                Generate & Download
              </button>
              {generatedPdf && (
                <Link href={generatedPdf.verificationUrl} className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-3 py-2 text-sm text-[#355069]">
                  <QrCode className="h-4 w-4" />
                  Verify QR
                </Link>
              )}
            </div>
          </div>
        )}

        {activeTab === "History" && (
          <SimpleTable
            headers={["Action", "Actor", "Details", "Date"]}
            rows={historyRows.map((row) => [row.action, row.actor, row.details, new Date(row.createdAt).toLocaleString()])}
            empty="No version history yet."
          />
        )}

        {activeTab === "Activity" && (
          <SimpleTable
            headers={["Event", "Date"]}
            rows={[
              [`Agreement received with status ${agreement.status}`, new Date(agreement.createdAt).toLocaleString()],
              [`Agreement updated to ${agreement.status}`, new Date(agreement.updatedAt).toLocaleString()],
              ...historyRows.map((row) => [row.details, new Date(row.createdAt).toLocaleString()]),
            ]}
            empty="No activity entries."
          />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3">
      <p className="text-xs text-[#7f8a99]">{label}</p>
      <p className="font-display text-xl text-[#1f2a44]">{value}</p>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3">
      <p className="text-xs text-[#7f8a99]">{label}</p>
      <div className="mt-1 text-sm text-[#1f2a44]">{value}</div>
    </div>
  );
}

function SimpleTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-[#dbe4eb]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-[#4f6078]">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${row.join("-")}-${rowIndex}`} className="border-t border-[#ecf1f5]">
                {row.map((item, colIndex) => <td key={`${item}-${colIndex}`} className="px-4 py-3">{item}</td>)}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t border-[#ecf1f5]">
                <td className="px-4 py-6 text-[#7f8a99]" colSpan={headers.length}>
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
