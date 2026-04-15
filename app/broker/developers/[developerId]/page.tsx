"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { DeveloperCell } from "@/components/ui/developer-cell";
import { useBrokerDeveloperRelations } from "@/hooks/use-broker-developer-relations";
import { DeveloperConnectionStatusPill } from "@/components/broker/developer-connection-status-pill";

const tabs = ["Overview", "Projects", "Agreements", "Inventory", "Activity"] as const;

export default function BrokerDeveloperProfilePage() {
  const params = useParams<{ developerId: string }>();
  const developerId = decodeURIComponent(params?.developerId ?? "");
  const { currentUser } = useAppContext();
  const brokerId = currentUser?.companyId ?? "";
  const { rows, properties } = useBrokerDeveloperRelations(brokerId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  const row = rows.find((item) => item.developer.id === developerId);
  const agreementIdSet = new Set((row?.agreements ?? []).map((agreement) => agreement.id));
  const inventoryRows = properties.filter((property) => agreementIdSet.has(property.agreementId));

  const projectRows = useMemo(() => {
    const grouped = new Map<string, { units: number; status: string }>();
    for (const item of inventoryRows) {
      const key = item.projectName || "N/A";
      grouped.set(key, { units: (grouped.get(key)?.units ?? 0) + 1, status: "Active" });
    }
    return Array.from(grouped.entries()).map(([project, value]) => ({ project, ...value }));
  }, [inventoryRows]);

  if (!row) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-[#dbe4eb] bg-white p-4 text-sm text-[#607187]">Developer profile not found.</p>
        <Link href="/broker/developers" className="inline-flex rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#355069]">
          Back to Developers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-xl border border-[#dbe4eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">Developer Profile</h1>
            <div className="mt-2"><DeveloperCell developerId={developerId} /></div>
          </div>
          <DeveloperConnectionStatusPill status={row.status} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Active Agreements" value={row.activeAgreements} />
          <Stat label="Visible Projects" value={row.projectsAvailable} />
          <Stat label="Visible Units" value={row.visibleUnits} />
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
            <Meta label="Company Name" value={row.developer.name} />
            <Meta label="Developer ID" value={row.developer.id} />
            <Meta label="Email" value={row.developer.email} />
            <Meta label="Phone" value={row.developer.phone} />
            <Meta label="Address" value={row.developer.address ?? "-"} />
            <Meta label="Status" value={row.status} />
          </div>
        )}

        {activeTab === "Projects" && (
          <div className="overflow-hidden rounded-md border border-[#dbe4eb]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Units Visible</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projectRows.map((project) => (
                    <tr key={project.project} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{project.project}</td>
                      <td className="px-4 py-3">{project.units}</td>
                      <td className="px-4 py-3">{project.status}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/broker/properties?developer=${encodeURIComponent(developerId)}&project=${encodeURIComponent(project.project)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {projectRows.length === 0 && (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>
                        No visible projects.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Agreements" && (
          <div className="overflow-hidden rounded-md border border-[#dbe4eb]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">Contract ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {row.agreements.map((agreement) => (
                    <tr key={agreement.id} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{agreement.id}</td>
                      <td className="px-4 py-3">{agreement.status}</td>
                      <td className="px-4 py-3">{agreement.validityEnd}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/broker/agreements/${encodeURIComponent(agreement.id)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {row.agreements.length === 0 && (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-6 text-[#7f8a99]" colSpan={4}>
                        No agreements.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Inventory" && (
          <div className="overflow-hidden rounded-md border border-[#dbe4eb]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[#4f6078]">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                  <tr>
                    <th className="px-4 py-3">Property Code</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Agreement</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryRows.map((property) => (
                    <tr key={`${property.id}-${property.agreementId}`} className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-3">{property.id}</td>
                      <td className="px-4 py-3">{property.projectName}</td>
                      <td className="px-4 py-3">{property.agreementId}</td>
                      <td className="px-4 py-3">{property.status}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/broker/properties/${encodeURIComponent(property.id)}?agreementId=${encodeURIComponent(property.agreementId)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-[#f8fafc] px-2.5 py-1.5 text-xs text-[#355069]"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {inventoryRows.length === 0 && (
                    <tr className="border-t border-[#ecf1f5]">
                      <td className="px-4 py-6 text-[#7f8a99]" colSpan={5}>
                        No inventory visible from this developer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Activity" && (
          <SimpleTable
            headers={["Event", "Date"]}
            rows={row.requests.map((request) => [`Request ${request.id} marked ${request.status}`, new Date(request.updatedAt).toLocaleString()])}
            empty="No activity history."
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#ecf1f5] bg-[#f8fafc] p-3">
      <p className="text-xs text-[#7f8a99]">{label}</p>
      <p className="mt-1 text-sm text-[#1f2a44]">{value}</p>
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
