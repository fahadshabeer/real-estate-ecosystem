"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, House, Search } from "lucide-react";
import { useBrokerCompaniesPagination } from "@/hooks/use-broker-companies";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function BrokerProfilesIndexPage() {
  const listQuery = useBrokerCompaniesPagination();
  const [query, setQuery] = useState("");

  const brokers = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data?.pages],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brokers;
    return brokers.filter((broker) =>
      [broker.id, broker.name, broker.email, broker.phone].join(" ").toLowerCase().includes(q),
    );
  }, [brokers, query]);
  const showInitialSkeleton = listQuery.isLoading && brokers.length === 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Broker Network</span>
          <span>/</span>
          <span>Broker Profiles</span>
        </div>
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search broker profiles"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="min-h-[500px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Broker Name</th>
                <th className="px-4 py-3">Broker ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton && <TableSkeletonRows cols={5} rows={8} />}
              {filtered.map((broker) => (
                <tr key={broker.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{broker.name}</td>
                  <td className="px-4 py-3">{broker.id}</td>
                  <td className="px-4 py-3">{broker.email}</td>
                  <td className="px-4 py-3">{broker.phone}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/portal/brokers/${broker.id}`}
                      className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                      title="Open profile"
                      aria-label="Open profile"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!showInitialSkeleton && filtered.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                    No broker profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
