"use client";

import Link from "next/link";
import { ArchiveRestore, House, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useProjects, useUnarchiveProject } from "@/hooks/use-projects-module";
import { runWithToast } from "@/lib/ui/toast";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function ArchivedProjectsPage() {
  const projectsQuery = useProjects();
  const unarchiveProject = useUnarchiveProject();
  const [query, setQuery] = useState("");

  const archivedProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = (projectsQuery.data ?? []).filter((project) => project.status === "archived");
    if (!q) return items;
    return items.filter((project) =>
      [project.name, project.code, project.city, project.area].join(" ").toLowerCase().includes(q),
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
          <span>Archived Projects</span>
        </div>
        <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-[#46a4a8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
            placeholder="Search archived projects"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{archivedProjects.length}</span>)
          </p>
          <p className="text-sm text-[#7f8a99]">Archived portfolio projects</p>
        </div>
        <div className="min-h-[460px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Expected Delivery</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {projectsQuery.isLoading && <TableSkeletonRows cols={6} rows={6} />}
              {archivedProjects.map((project) => (
                <tr key={project.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 text-[#1f2a44]">
                    <Link href={`/portal/projects/${project.id}`} className="hover:text-[#2f9ea3]">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{project.code}</td>
                  <td className="px-4 py-3">{project.city}, {project.area}</td>
                  <td className="px-4 py-3">{project.expectedDeliveryDate}</td>
                  <td className="px-4 py-3">{project.units.length}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await runWithToast({
                            loading: "Restoring project...",
                            success: "Project restored to active.",
                            action: () => unarchiveProject.mutateAsync(project.id),
                          });
                        } catch {}
                      }}
                      className="inline-flex items-center rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                      title="Restore project"
                      aria-label="Restore project"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!projectsQuery.isLoading && archivedProjects.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 text-[#7f8a99]" colSpan={6}>
                    No archived projects found.
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
