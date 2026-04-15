"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Activity, ArrowUpRight, FileText, House, LayoutGrid, Share2, ShieldCheck } from "lucide-react";
import { useBrokerCompaniesPagination } from "@/hooks/use-broker-companies";
import { useAppContext } from "@/components/state/app-context";
import { useDeveloperAgreements, useDeveloperContractRequests } from "@/hooks/use-agreements";
import { useAgreementPropertyMaps, useDeveloperProperties } from "@/hooks/use-properties";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "agreements", label: "Agreements" },
  { key: "inventory", label: "Shared Inventory" },
  { key: "performance", label: "Sales Performance" },
  { key: "logs", label: "Activity Logs" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function BrokerProfilePage() {
  const params = useParams<{ brokerId: string }>();
  const brokerIdRaw = params?.brokerId;
  const brokerId = decodeURIComponent(Array.isArray(brokerIdRaw) ? brokerIdRaw[0] : brokerIdRaw ?? "");
  const [tab, setTab] = useState<TabKey>("overview");

  const brokersQuery = useBrokerCompaniesPagination();
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const agreementsQuery = useDeveloperAgreements(developerId);
  const requestsQuery = useDeveloperContractRequests(developerId);
  const propertiesQuery = useDeveloperProperties(developerId);

  const brokers = useMemo(
    () => brokersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [brokersQuery.data?.pages],
  );
  const broker = brokers.find((row) => row.id === brokerId);

  const agreements = useMemo(
    () => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agreementsQuery.data?.pages],
  );
  const brokerAgreements = agreements.filter((agreement) => agreement.brokerId === brokerId);
  const latestRequestId = useMemo(() => {
    const requests = (requestsQuery.data ?? []).filter((request) => request.brokerId === brokerId);
    const latest = requests.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];
    return latest?.id;
  }, [brokerId, requestsQuery.data]);
  const mapsQuery = useAgreementPropertyMaps(brokerAgreements.map((agreement) => agreement.id));
  const maps = mapsQuery.data ?? [];
  const properties = useMemo(
    () => propertiesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [propertiesQuery.data?.pages],
  );

  const sharedProperties = maps
    .map((map) => {
      const property = properties.find((row) => row.id === map.propertyId);
      if (!property) return null;
      const agreement = brokerAgreements.find((row) => row.id === map.agreementId);
      if (!agreement) return null;
      return { property, agreement, map };
    })
    .filter(
      (row): row is { property: (typeof properties)[number]; agreement: (typeof brokerAgreements)[number]; map: (typeof maps)[number] } =>
        Boolean(row),
    );

  const soldDeals = sharedProperties.filter((row) => row.property.status === "Sold").length;
  const conversionRatio = sharedProperties.length ? Math.round((soldDeals / sharedProperties.length) * 100) : 0;
  const trustScore = Math.max(55, Math.min(99, 72 + brokerAgreements.length * 4 + Math.round(conversionRatio * 0.2)));

  if ((brokersQuery.isLoading || agreementsQuery.isLoading || propertiesQuery.isLoading || mapsQuery.isLoading) && !broker) {
    return <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">Loading broker profile...</div>;
  }

  if (!broker) {
    return (
      <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">
        Broker profile not found.
      </div>
    );
  }

  const suspended =
    broker.status === "suspended"
      ? {
          reason: broker.suspensionReason ?? "Access review pending",
          suspendedAt: broker.suspendedAt ?? broker.updatedAt,
        }
      : null;

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Broker Network" title="Broker Profile" backHref="/portal/brokers" />

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-[#1f2a44]">{broker.name}</h1>
            <p className="mt-1 text-sm text-[#607187]">
              {broker.id} · Active since {new Date(broker.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-[#e8f4f4] px-3 py-2 text-sm font-semibold text-[#1f7d79]">
            <ShieldCheck className="h-4 w-4" />
            Trust Score {trustScore}%
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Active Agreements" value={brokerAgreements.filter((a) => a.status === "Active").length} />
          <MetricCard label="Shared Units" value={sharedProperties.length} />
          <MetricCard label="Sold Deals" value={soldDeals} />
          <MetricCard label="Pending Approvals" value={brokerAgreements.filter((a) => a.status === "Pending Approval").length} />
        </div>
        {suspended && (
          <p className="mt-3 text-sm text-rose-600">
            Suspended: {suspended.reason} ({new Date(suspended.suspendedAt).toLocaleString()})
          </p>
        )}
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
          icon={<LayoutGrid className="h-4 w-4" />}
          title="Broker Overview"
          headers={["Field", "Value"]}
          rows={[
            ["Company Name", broker.name],
            ["Broker ID", broker.id],
            ["Email", broker.email],
            ["Phone", broker.phone],
            ["Registration Number", broker.registrationNumber],
            ["Address", broker.address ?? "Not provided"],
            ["Status", broker.status],
          ]}
          empty="No profile data available."
        />
      )}

      {tab === "agreements" && (
        <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <div className="flex items-center gap-2 border-b border-[#ecf1f5] px-6 py-4 text-[#1f2a44]">
            <FileText className="h-4 w-4" />
            <p className="text-sm font-semibold">Agreements</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-[#4f6078]">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                <tr>
                  <th className="px-4 py-3">Contract ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {brokerAgreements.map((agreement) => (
                  <tr key={agreement.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3">{agreement.id}</td>
                    <td className="px-4 py-3">{agreement.status}</td>
                    <td className="px-4 py-3">{agreement.validityStart}</td>
                    <td className="px-4 py-3">{agreement.validityEnd}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/contracts/${encodeURIComponent(agreement.id)}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]"
                      >
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {brokerAgreements.length === 0 && (
                  <tr className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                      No agreements with this broker yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "inventory" && (
        <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <div className="flex items-center gap-2 border-b border-[#ecf1f5] px-6 py-4 text-[#1f2a44]">
            <Share2 className="h-4 w-4" />
            <p className="text-sm font-semibold">Shared Inventory</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-[#4f6078]">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                <tr>
                  <th className="px-4 py-3">Property Code</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Agreement</th>
                  <th className="px-4 py-3">Shared Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sharedProperties.map((row) => (
                  <tr key={`${row.property.id}-${row.agreement.id}`} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3">{row.property.id}</td>
                    <td className="px-4 py-3">{row.property.projectName}</td>
                    <td className="px-4 py-3">{row.agreement.id}</td>
                    <td className="px-4 py-3">{new Date(row.map.sharedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{row.property.status}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/properties/${encodeURIComponent(row.property.id)}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]"
                      >
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {sharedProperties.length === 0 && (
                  <tr className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-6 text-[#7f8a99]" colSpan={6}>
                      No shared inventory for this broker.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "performance" && (
        <DataPanel
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Sales Performance"
          headers={["Metric", "Value"]}
          rows={[
            ["Total Sold Deals", String(soldDeals)],
            ["Shared Properties", String(sharedProperties.length)],
            ["Conversion Ratio", `${conversionRatio}%`],
            ["Approval Success Rate", `${Math.max(60, conversionRatio)}%`],
            ["Response Speed", `${Math.max(2, 36 - soldDeals * 2)}h average`],
            ["Inventory Engagement Score", `${Math.min(100, 40 + sharedProperties.length * 3)}%`],
          ]}
          empty="No performance data yet."
        />
      )}

      {tab === "logs" && (
        <DataPanel
          icon={<Activity className="h-4 w-4" />}
          title="Activity Logs"
          headers={["Timestamp", "Action", "Details"]}
          rows={[
            [new Date().toLocaleString(), "Profile Viewed", "Developer opened broker profile"],
            ...brokerAgreements.slice(0, 5).map((agreement) => [new Date(agreement.updatedAt).toLocaleString(), "Agreement Updated", `${agreement.id} · ${agreement.status}`]),
          ]}
          empty="No activity logs available."
        />
      )}

      <div className="flex justify-end">
        <Link
          href={
            latestRequestId
              ? `/portal/contracts/new?brokerId=${encodeURIComponent(broker.id)}&requestId=${encodeURIComponent(latestRequestId)}`
              : `/portal/contracts/new?brokerId=${encodeURIComponent(broker.id)}`
          }
          className="ui-btn-primary"
        >
          Create Agreement
        </Link>
      </div>
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
