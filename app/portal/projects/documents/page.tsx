"use client";

import Link from "next/link";
import { Download, Eye, FileText, House, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useProjects } from "@/hooks/use-projects-module";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

export default function ProjectDocumentsPage() {
  const projectsQuery = useProjects();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const items = projectsQuery.data ?? [];
    const flattened = items.flatMap((project) =>
      project.documents.map((document) => ({
        projectId: project.id,
        projectName: project.name,
        projectCode: project.code,
        document,
      })),
    );
    const q = query.trim().toLowerCase();
    if (!q) return flattened;
    return flattened.filter((row) =>
      [
        row.projectCode,
        row.projectName,
        row.document.fileName,
        row.document.fileType,
        row.document.visibility,
      ]
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
          <span>Project Documents</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full max-w-[340px] items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search documents"
            />
          </div>
          <Link
            href="/portal/projects"
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Open Project
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{rows.length}</span>)
          </p>
          <p className="text-sm text-[#7f8a99]">All uploaded project documents</p>
        </div>

        <div className="min-h-[460px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projectsQuery.isLoading && <TableSkeletonRows cols={7} rows={6} />}
              {rows.map((row) => (
                <tr key={row.document.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 text-[#1f2a44]">
                    <Link href={`/portal/projects/${row.projectId}?tab=documents`} className="hover:text-[#2f9ea3]">
                      {row.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.projectCode}</td>
                  <td className="px-4 py-3">{row.document.fileName}</td>
                  <td className="px-4 py-3 capitalize">{row.document.fileType}</td>
                  <td className="px-4 py-3 capitalize">{row.document.visibility}</td>
                  <td className="px-4 py-3">{new Date(row.document.uploadedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/portal/projects/${row.projectId}?tab=documents`}
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        title="View in project"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        className="rounded-lg border border-[#dbe4eb] bg-[#f8fafc] p-2 text-[#4f6078]"
                        title="Download"
                        type="button"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!projectsQuery.isLoading && rows.length === 0 && (
                <tr className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 text-[#7f8a99]" colSpan={7}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      No project documents yet. Add documents from a project detail page.
                    </div>
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
