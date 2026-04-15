"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, History, House, Share2, SquarePen } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useDeveloperAgreements } from "@/hooks/use-agreements";
import { useAgreementPropertyMaps, useDeveloperProperties } from "@/hooks/use-properties";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "sharing", label: "Sharing History" },
  { key: "documents", label: "Documents" },
  { key: "visibility", label: "Broker Visibility" },
  { key: "activity", label: "Activity Logs" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function PropertyDetailPage() {
  const params = useParams<{ propertyId: string }>();
  const propertyIdRaw = params?.propertyId;
  const propertyId = decodeURIComponent(Array.isArray(propertyIdRaw) ? propertyIdRaw[0] : propertyIdRaw ?? "");
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const [tab, setTab] = useState<TabKey>("overview");

  const propertiesQuery = useDeveloperProperties(developerId);
  const agreementsQuery = useDeveloperAgreements(developerId);

  const properties = useMemo(
    () => propertiesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [propertiesQuery.data?.pages],
  );
  const agreements = useMemo(
    () => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agreementsQuery.data?.pages],
  );
  const mapsQuery = useAgreementPropertyMaps(agreements.map((agreement) => agreement.id));
  const maps = mapsQuery.data ?? [];

  const property = properties.find((row) => row.id === propertyId);
  const propertyMaps = maps.filter((row) => row.propertyId === propertyId);
  const visibilityRows = propertyMaps
    .map((map) => ({
      map,
      agreement: agreements.find((agreement) => agreement.id === map.agreementId),
    }))
    .filter((row): row is { map: (typeof propertyMaps)[number]; agreement: (typeof agreements)[number] } => Boolean(row.agreement));

  if ((propertiesQuery.isLoading || agreementsQuery.isLoading || mapsQuery.isLoading) && !property) {
    return <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">Loading property...</div>;
  }

  if (!property) {
    return (
      <div className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">
        Property not found.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Properties" title={property.id} backHref="/portal/properties" />

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-[#1f2a44]">{property.title}</h1>
            <p className="mt-1 text-sm text-[#607187]">
              {property.projectName} · {property.block} · {property.unitNumber}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/portal/properties/${encodeURIComponent(property.id)}/edit`}
              className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#4f6078]"
            >
              <SquarePen className="h-4 w-4" />
              Edit
            </Link>
            <Link
              href={`/portal/properties/share?propertyId=${encodeURIComponent(property.id)}`}
              className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#4f6078]"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetaCard label="Property Type" value={property.propertyType} />
          <MetaCard label="Size" value={property.size} />
          <MetaCard label="Price" value={`${property.price.toLocaleString()} QAR`} />
          <MetaCard label="Status" value={property.status} />
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
        <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetaCard label="Project" value={property.projectName} />
            <MetaCard label="Location" value={property.location} />
            <MetaCard label="Block" value={property.block || "—"} />
            <MetaCard label="Unit Number" value={property.unitNumber} />
          </div>
          <div className="mt-4 rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-4 text-sm text-[#4f6078]">
            <p className="font-semibold text-[#1f2a44]">Description</p>
            <p className="mt-1">{property.description || "No description added yet."}</p>
          </div>
        </section>
      )}

      {tab === "sharing" && (
        <DataTable
          icon={<History className="h-4 w-4" />}
          title="Sharing History"
          empty="This property has not been shared yet."
          headers={["Agreement", "Broker", "Shared Date"]}
          rows={visibilityRows.map((row) => [
            row.agreement.id,
            row.agreement.brokerId,
            new Date(row.map.sharedDate).toLocaleString(),
          ])}
        />
      )}

      {tab === "documents" && (
        <DataTable
          icon={<FileText className="h-4 w-4" />}
          title="Documents"
          empty="No documents are linked to this property yet."
          headers={["Type", "Name", "Status"]}
          rows={[["Floor Plan", "Coming from media upload flow", "Pending"], ["Brochure", "Coming from media upload flow", "Pending"]]}
        />
      )}

      {tab === "visibility" && (
        <DataTable
          icon={<Share2 className="h-4 w-4" />}
          title="Broker Visibility"
          empty="No brokers can currently view this property."
          headers={["Broker ID", "Agreement", "Visibility"]}
          rows={visibilityRows.map((row) => [row.agreement.brokerId, row.agreement.id, row.agreement.status])}
        />
      )}

      {tab === "activity" && (
        <DataTable
          icon={<House className="h-4 w-4" />}
          title="Activity Logs"
          empty="No activity logs for this property yet."
          headers={["Timestamp", "Action", "Actor"]}
          rows={[
            [new Date(property.updatedAt).toLocaleString(), "Property updated", "Developer"],
            [new Date(property.createdAt).toLocaleString(), "Property created", "Developer"],
          ]}
        />
      )}
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
      <p className="text-xs text-[#7f8a99]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1f2a44]">{value}</p>
    </article>
  );
}

function DataTable({
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
