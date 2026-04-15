"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, Eye, House, Pencil, Plus, Search, Share2, Trash2 } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useDeveloperAgreements } from "@/hooks/use-agreements";
import {
  useAgreementPropertyMaps,
  useCreateProperty,
  useDeveloperProperties,
  useUpdateProperty,
} from "@/hooks/use-properties";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { runWithToast } from "@/lib/ui/toast";

export default function PropertiesPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";

  const propertiesQuery = useDeveloperProperties(developerId);
  const agreementsQuery = useDeveloperAgreements(developerId);
  const updateProperty = useUpdateProperty(developerId);
  const createProperty = useCreateProperty(developerId);

  const agreements = useMemo(
    () => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agreementsQuery.data?.pages],
  );
  const agreementIds = agreements.map((agreement) => agreement.id);
  const mapsQuery = useAgreementPropertyMaps(agreementIds);
  const maps = mapsQuery.data ?? [];

  const properties = useMemo(
    () => propertiesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [propertiesQuery.data?.pages],
  );

  const [tableSearch, setTableSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const projectOptions = [...new Set(properties.map((property) => property.projectName))].filter(Boolean);
  const typeOptions = [...new Set(properties.map((property) => property.propertyType))].filter(Boolean);
  const minValue = Number(minPrice || 0);
  const maxValue = Number(maxPrice || Number.MAX_SAFE_INTEGER);

  const sharedCountByProperty = useMemo(() => {
    const bucket = new Map<string, number>();
    for (const row of maps) {
      bucket.set(row.propertyId, (bucket.get(row.propertyId) ?? 0) + 1);
    }
    return bucket;
  }, [maps]);

  const filteredProperties = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return properties.filter((property) => {
      const sharedCount = sharedCountByProperty.get(property.id) ?? 0;
      const matchesQuery =
        !q ||
        [
          property.id,
          property.title,
          property.projectName,
          property.block,
          property.unitNumber,
          property.propertyType,
          property.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesProject = projectFilter === "all" || property.projectName === projectFilter;
      const matchesType = typeFilter === "all" || property.propertyType === typeFilter;
      const matchesStatus = statusFilter === "all" || property.status === statusFilter;
      const matchesPrice = property.price >= minValue && property.price <= maxValue;
      const matchesShared = true;
      return matchesQuery && matchesProject && matchesType && matchesStatus && matchesPrice && matchesShared;
    });
  }, [maxValue, minValue, projectFilter, properties, sharedCountByProperty, statusFilter, tableSearch, typeFilter]);

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Inventory</span>
          <span>/</span>
          <span>All Properties</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={tableSearch}
              onChange={(event) => setTableSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search by code, unit, project, type"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/portal/properties/new"
              className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-5 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" /> Add Property
            </Link>
            <Link
              href="/portal/properties/share"
              className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-5 py-2.5 text-sm text-[#4f6078]"
            >
              <Share2 className="h-4 w-4" /> Share
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="grid gap-3 border-b border-[#ecf1f5] px-6 py-4 lg:grid-cols-6">
          <label className="text-xs text-[#8f9aaa]">
            Project
            <FancySelect
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            >
              <option value="all">All</option>
              {projectOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FancySelect>
          </label>
          <label className="text-xs text-[#8f9aaa]">
            Type
            <FancySelect
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            >
              <option value="all">All</option>
              {typeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FancySelect>
          </label>
          <label className="text-xs text-[#8f9aaa]">
            Status
            <FancySelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
            >
              <option value="all">All</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
              <option value="Hidden">Hidden</option>
            </FancySelect>
          </label>
          <label className="text-xs text-[#8f9aaa]">
            Min Price
            <input
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
              placeholder="0"
            />
          </label>
          <label className="text-xs text-[#8f9aaa]">
            Max Price
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]"
              placeholder="No max"
            />
          </label>
          <div className="flex items-end justify-end">
            <p className="text-[16px] font-medium text-[#38a0a6]">
              Total(<span className="font-bold">{filteredProperties.length}</span>)
            </p>
          </div>
        </div>

        <div className="min-h-[500px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Property Code</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Tower / Block</th>
                <th className="px-4 py-3">Unit Number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Shared With</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {propertiesQuery.isLoading && <TableSkeletonRows cols={10} rows={8} />}
              {filteredProperties.map((property) => {
                const shareCount = sharedCountByProperty.get(property.id) ?? 0;
                return (
                  <tr key={property.id} className="border-t border-[#ecf1f5]">
                    <td className="px-4 py-3 font-medium text-[#1f2a44]">{property.id}</td>
                    <td className="px-4 py-3">{property.projectName}</td>
                    <td className="px-4 py-3">{property.block || "-"}</td>
                    <td className="px-4 py-3">{property.unitNumber}</td>
                    <td className="px-4 py-3">{property.propertyType}</td>
                    <td className="px-4 py-3">{property.size}</td>
                    <td className="px-4 py-3">{property.price.toLocaleString()} QAR</td>
                    <td className="px-4 py-3">
                      <StatusPill status={property.status} />
                    </td>
                    <td className="px-4 py-3">{shareCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/portal/properties/${encodeURIComponent(property.id)}`}
                          title="View property"
                          aria-label="View property"
                          className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/portal/properties/${encodeURIComponent(property.id)}/edit`}
                          title="Edit property"
                          aria-label="Edit property"
                          className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-amber-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/portal/properties/share?propertyId=${encodeURIComponent(property.id)}`}
                          title="Share property"
                          aria-label="Share property"
                          className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-cyan-600"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          title="Duplicate property"
                          aria-label="Duplicate property"
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Duplicating property...",
                                success: "Property duplicated.",
                                action: () =>
                                  createProperty.mutateAsync({
                                    developerId,
                                    title: `${property.title} (Copy)`,
                                    projectName: property.projectName,
                                    block: property.block,
                                    unitNumber: `${property.unitNumber}-D`,
                                    propertyType: property.propertyType,
                                    price: property.price,
                                    size: property.size,
                                    location: property.location,
                                    description: property.description,
                                    status: "Available",
                                  }),
                              });
                            } catch {}
                          }}
                          className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Archive property"
                          aria-label="Archive property"
                          onClick={async () => {
                            try {
                              await runWithToast({
                                loading: "Archiving property...",
                                success: "Property moved to archived units.",
                                action: () =>
                                  updateProperty.mutateAsync({
                                    propertyId: property.id,
                                    data: { status: "Hidden" },
                                  }),
                              });
                            } catch {}
                          }}
                          className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!propertiesQuery.isLoading && filteredProperties.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={10}>
                    No properties found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#ecf1f5] px-6 py-4">
          <span className="text-sm text-[#9aa6b2]">
            Currently at Page: 1 of {propertiesQuery.hasNextPage ? 2 : 1}
          </span>
          <button className="rounded-full border border-[#dbe4eb] bg-white px-3 py-1.5 text-sm text-[#4f6078] opacity-50">
            Prev
          </button>
          <button
            disabled={!propertiesQuery.hasNextPage || propertiesQuery.isFetchingNextPage}
            onClick={() => propertiesQuery.fetchNextPage()}
            className="rounded-full border border-[#dbe4eb] bg-white px-3 py-1.5 text-sm text-[#4f6078] disabled:opacity-40"
          >
            {propertiesQuery.isFetchingNextPage ? "Loading..." : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: "Available" | "Reserved" | "Sold" | "Hidden" }) {
  const className =
    status === "Available"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Reserved"
        ? "bg-amber-100 text-amber-700"
        : status === "Sold"
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-200 text-slate-600";

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}
