"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Clock3, FileText, History, House, Layers3, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/components/state/app-context";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useAgreementById, useUpdateAgreement } from "@/hooks/use-agreements";
import { useAgreementPropertyMaps, useDeveloperProperties } from "@/hooks/use-properties";
import { useDownloadContractPdf, useGenerateContractPdf } from "@/hooks/use-contract-documents";
import { runWithToast } from "@/lib/ui/toast";
import { companyRepository } from "@/lib/backend/factory";
import { BrokerCell } from "@/components/ui/broker-cell";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "projects", label: "Projects" },
  { key: "inventory", label: "Shared Inventory" },
  { key: "pdf", label: "PDF Contract" },
  { key: "history", label: "History" },
  { key: "logs", label: "Activity Logs" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function AgreementDetailPage() {
  const params = useParams<{ agreementId: string }>();
  const agreementIdRaw = params?.agreementId;
  const agreementId = decodeURIComponent(Array.isArray(agreementIdRaw) ? agreementIdRaw[0] : agreementIdRaw ?? "");
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const [tab, setTab] = useState<TabKey>("overview");

  const agreementQuery = useAgreementById(agreementId);
  const updateAgreement = useUpdateAgreement(developerId);
  const propertiesQuery = useDeveloperProperties(developerId);
  const generatePdf = useGenerateContractPdf();
  const downloadPdf = useDownloadContractPdf();

  const agreement = agreementQuery.data ?? null;
  const mapsQuery = useAgreementPropertyMaps(agreement ? [agreement.id] : []);
  const maps = mapsQuery.data ?? [];
  const properties = useMemo(
    () => propertiesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [propertiesQuery.data?.pages],
  );
  const uiStatus = agreement ? agreement.status : "";
  const brokerQuery = useQuery({
    queryKey: ["company", "broker", agreement?.brokerId],
    enabled: Boolean(agreement?.brokerId),
    queryFn: () => companyRepository.getCompanyById(agreement?.brokerId ?? ""),
    staleTime: 60_000,
  });
  const sharedRows = maps
    .map((map) => {
      const property = properties.find((row) => row.id === map.propertyId);
      if (!property) return null;
      return { map, property };
    })
    .filter((row): row is { map: (typeof maps)[number]; property: (typeof properties)[number] } => Boolean(row));

  const daysRemaining = agreement
    ? Math.ceil((new Date(agreement.validityEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if ((agreementQuery.isLoading || propertiesQuery.isLoading || mapsQuery.isLoading) && !agreement) {
    return <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">Loading agreement...</div>;
  }

  if (agreementQuery.error) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {agreementQuery.error instanceof Error ? agreementQuery.error.message : "Unable to load agreement."}
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">
        Agreement not found.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Agreements" title={agreement.id} backHref="/portal/contracts" />

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-[#1f2a44]">{agreement.agreementTitle ?? "Agreement Detail"}</h1>
            <p className="mt-1 text-sm text-[#607187]">
              Broker {agreement.brokerId} · {agreement.validityStart} → {agreement.validityEnd}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#f1f5f9] px-2 py-1 text-xs font-semibold text-[#51627a]">{uiStatus}</span>
            <Link href={`/portal/contracts/${encodeURIComponent(agreement.id)}/edit`} className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]">
              Edit
            </Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await runWithToast({
                    loading: "Updating status...",
                    success: "Agreement suspended.",
                    action: () =>
                      updateAgreement.mutateAsync({
                        agreementId: agreement.id,
                        status: "Suspended",
                      }),
                  });
                } catch {}
              }}
              className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]"
            >
              Suspend
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Linked Projects" value={agreement.projectsCovered?.length ?? 0} />
          <MetricCard label="Linked Properties" value={sharedRows.length} />
          <MetricCard label="Days Remaining" value={daysRemaining} />
          <MetricCard label="Agreement Type" value={agreement.agreementType ?? "Non-Exclusive"} />
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-md px-3 py-2 text-sm ${
                tab === item.key
                  ? "bg-[#3aa4a8] font-semibold text-white"
                  : "border border-[#dbe4eb] bg-white text-[#607187] hover:bg-[#f5f9fb]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === "overview" && (
        <DataPanel
          icon={<FileText className="h-4 w-4" />}
          title="Agreement Overview"
          headers={["Field", "Value"]}
          rows={[
            ["Broker Company", brokerQuery.data?.name ?? agreement.brokerId],
            ["Agreement Type", agreement.agreementType ?? "Non-Exclusive"],
            ["Effective Date", agreement.validityStart],
            ["Expiry Date", agreement.validityEnd],
            ["Commission", agreement.commissionRules],
            ["Payment Trigger", agreement.paymentTrigger ?? "Not specified"],
            ["Bonus Conditions", agreement.bonusConditions ?? "Not specified"],
            ["Legal Clauses", agreement.legalClauses ?? "Not specified"],
          ]}
          empty="No overview data."
        />
      )}

      {tab === "projects" && (
        <DataPanel
          icon={<Layers3 className="h-4 w-4" />}
          title="Projects Covered"
          headers={["Project", "Scope", "Units Included", "Sharing Type"]}
          rows={(agreement.projectsCovered ?? []).map((project) => [
            project,
            agreement.projectScope ?? "Selected units",
            "Mapped via sharing",
            agreement.agreementType ?? "Non-Exclusive",
          ])}
          empty="No projects mapped yet."
        />
      )}

      {tab === "inventory" && (
        <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <div className="flex items-center gap-2 border-b border-[#ecf1f5] px-6 py-4 text-[#1f2a44]">
            <House className="h-4 w-4" />
            <p className="text-sm font-semibold">Shared Inventory</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-[#4f6078]">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                <tr>
                  <th className="px-4 py-3">Property Code</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Broker Visibility</th>
                  <th className="px-4 py-3">Shared Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sharedRows.map((row) => (
                  <tr key={row.map.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3">{row.property.id}</td>
                    <td className="px-4 py-3">{row.property.projectName}</td>
                    <td className="px-4 py-3">
                      <BrokerCell brokerId={agreement.brokerId} />
                    </td>
                    <td className="px-4 py-3">{new Date(row.map.sharedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{row.property.status}</td>
                  </tr>
                ))}
                {sharedRows.length === 0 && (
                  <tr className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                      No shared inventory under this agreement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "pdf" && (
        <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <div className="rounded-md border border-[#e2d2ac] bg-[linear-gradient(145deg,#fffdf8_0%,#fbf3df_100%)] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a6b2e]">Premium Legal PDF Preview</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[#1f2a44]">Contract Agreement</h3>
            <p className="mt-1 text-sm text-[#5b6472]">
              {agreement.id} · QR Verification enabled · Watermark and signature placeholders included
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await runWithToast({
                      loading: "Generating contract PDF...",
                      success: "PDF generated and downloaded.",
                      action: async () => {
                        const payload = await generatePdf.mutateAsync(agreement.id);
                        await downloadPdf.mutateAsync({
                          downloadUrl: payload.downloadUrl,
                          fallbackFileName: `${payload.contractId}.pdf`,
                        });
                      },
                    });
                  } catch {}
                }}
                className="ui-btn-primary"
              >
                Download PDF
              </button>
              <a href={`/verify/contract/${encodeURIComponent(agreement.id)}`} className="ui-btn-secondary text-center">
                Open Verification
              </a>
            </div>
          </div>
        </section>
      )}

      {tab === "history" && (
        <DataPanel
          icon={<History className="h-4 w-4" />}
          title="Agreement Version History"
          headers={["Timestamp", "Action", "Actor", "Details"]}
          rows={[
            [new Date(agreement.createdAt).toLocaleString(), "Created", "Developer", "Agreement issued"],
            [new Date(agreement.updatedAt).toLocaleString(), "Last Updated", "System", `Status: ${agreement.status}`],
          ]}
          empty="No history for this agreement."
        />
      )}

      {tab === "logs" && (
        <DataPanel
          icon={<Clock3 className="h-4 w-4" />}
          title="Activity Logs"
          headers={["Timestamp", "Event", "Details"]}
          rows={[
            [new Date(agreement.createdAt).toLocaleString(), "Created", "Agreement issued by developer"],
            [new Date(agreement.updatedAt).toLocaleString(), "Updated", `Current status: ${agreement.status}`],
          ]}
          empty="No activity logs."
        />
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
      <p className="text-xs text-[#7f8a99]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{value}</p>
    </article>
  );
}

function DataPanel({
  icon,
  title,
  headers,
  rows,
  empty,
}: {
  icon: React.ReactNode;
  title: string;
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
      <div className="flex items-center gap-2 border-b border-[#ecf1f5] px-6 py-4 text-[#1f2a44]">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-[#4f6078]">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, idx) => (
              <tr key={`${title}-${idx}`} className="border-t border-[#ecf1f5]">
                {cells.map((cell, cellIndex) => (
                  <td key={`${title}-${idx}-${cellIndex}`} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
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
    </section>
  );
}
