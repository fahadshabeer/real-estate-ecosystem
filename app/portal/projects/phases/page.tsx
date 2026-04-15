"use client";

import Link from "next/link";
import { House, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useProjects } from "@/hooks/use-projects-module";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function ProjectPhasesPage() {
  const projectsQuery = useProjects();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const items = projectsQuery.data ?? [];
    const flattened = items.flatMap((project) =>
      project.phases.map((phase) => ({
        projectId: project.id,
        projectCode: project.code,
        projectName: project.name,
        phase,
      })),
    );
    const q = query.trim().toLowerCase();
    if (!q) return flattened;
    return flattened.filter((row) =>
      [row.projectCode, row.projectName, row.phase.name, row.phase.type, row.phase.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [projectsQuery.data, query]);

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Projects</span>
          <span>/</span>
          <span>Project Phases</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search phases"
            />
          </div>
          <Link
            href="/portal/projects/new"
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Add Project
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
          <p className="text-sm text-[#7f8a99]">Project phase registry</p>
        </div>

        <div className="min-h-[460px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Project Code</th>
                <th className="px-4 py-3">Phase</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {projectsQuery.isLoading && <TableSkeletonRows cols={6} rows={6} />}
              {rows.map((row) => (
                <tr key={row.phase.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 text-[#1f2a44]">
                    <Link href={`/portal/projects/${row.projectId}`} className="hover:text-[#2f9ea3]">
                      {row.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.projectCode}</td>
                  <td className="px-4 py-3">{row.phase.name}</td>
                  <td className="px-4 py-3">{row.phase.type}</td>
                  <td className="px-4 py-3">{row.phase.unitsCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                        row.phase.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : row.phase.status === "planning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {row.phase.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!projectsQuery.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 text-[#7f8a99]" colSpan={6}>
                    No phases found. Add phases from the relevant project detail page.
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
