"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, Building2, FileText, Pencil, Plus, Search, Share2 } from "lucide-react";
import { useArchiveProject, useProjects } from "@/hooks/use-projects-module";
import { runWithToast } from "@/lib/ui/toast";

export default function AllProjectsPage() {
  const projectsQuery = useProjects();
  const archiveProject = useArchiveProject();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "archived">("all");
  const [cityFilter, setCityFilter] = useState("all");

  const projects = projectsQuery.data ?? [];
  const cities = [...new Set(projects.map((project) => project.city))];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesQuery =
        !q ||
        [project.name, project.code, project.city, project.area]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus = statusFilter === "all" ? true : project.status === statusFilter;
      const matchesCity = cityFilter === "all" ? true : project.city === cityFilter;
      return matchesQuery && matchesStatus && matchesCity;
    });
  }, [projects, query, statusFilter, cityFilter]);

  const loadingCards = Array.from({ length: 4 });

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">All Projects</h1>
            <p className="mt-1 text-sm text-[#607187]">Project command center with visual stats and operational actions.</p>
          </div>
          <Link
            href="/portal/projects/new"
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Add Project
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_190px_190px]">
          <div className="flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-[#46a4a8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#a0aabb]"
              placeholder="Search by project name, code, or city"
            />
          </div>
          <FancySelect
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#1f2a44]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </FancySelect>
          <FancySelect
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
            className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#1f2a44]"
          >
            <option value="all">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </FancySelect>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {projectsQuery.isLoading &&
          loadingCards.map((_, index) => (
            <article key={`project-skeleton-${index}`} className="animate-pulse rounded-md border border-[#dbe4eb] bg-white p-5">
              <div className="h-3 w-28 rounded bg-[#e8edf3]" />
              <div className="mt-3 h-5 w-56 rounded bg-[#e8edf3]" />
              <div className="mt-2 h-3 w-40 rounded bg-[#eef3f7]" />
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
                <div className="h-12 rounded bg-[#eef3f7]" />
                <div className="h-12 rounded bg-[#eef3f7]" />
                <div className="h-12 rounded bg-[#eef3f7]" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-8 w-16 rounded bg-[#eef3f7]" />
                <div className="h-8 w-16 rounded bg-[#eef3f7]" />
                <div className="h-8 w-20 rounded bg-[#eef3f7]" />
              </div>
            </article>
          ))}
        {!projectsQuery.isLoading && filtered.length === 0 && (
          <article className="rounded-md border border-[#dbe4eb] bg-white p-6 text-sm text-[#607187]">
            No projects found. Start by creating your first project.
          </article>
        )}
        {filtered.map((project) => {
          const totalUnits = project.units.length;
          const soldUnits = project.units.filter((unit) => unit.status === "sold").length;
          const availableUnits = project.units.filter((unit) => unit.status === "available").length;
          return (
            <article key={project.id} className="rounded-md border border-[#dbe4eb] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-[#7f8a99]">{project.code}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-[#1f2a44]">{project.name}</h2>
                  <p className="mt-1 text-sm text-[#607187]">
                    {project.city}, {project.area}
                  </p>
                  <p className="mt-1 text-xs text-[#8fa0b2]">Delivery: {project.expectedDeliveryDate}</p>
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                    project.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : project.status === "completed"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-3">
                <div>
                  <p className="text-xs text-[#7f8a99]">Total Units</p>
                  <p className="text-lg font-semibold text-[#1f2a44]">{totalUnits}</p>
                </div>
                <div>
                  <p className="text-xs text-[#7f8a99]">Sold</p>
                  <p className="text-lg font-semibold text-[#1f2a44]">{soldUnits}</p>
                </div>
                <div>
                  <p className="text-xs text-[#7f8a99]">Available</p>
                  <p className="text-lg font-semibold text-[#1f2a44]">{availableUnits}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/portal/projects/${project.id}`} className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]">
                  View
                </Link>
                <Link
                  href={`/portal/projects/${project.id}/edit`}
                  className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <Link
                  href={`/portal/projects/${project.id}?tab=inventory`}
                  className="rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]"
                >
                  Manage Inventory
                </Link>
                <Link
                  href={`/portal/projects/${project.id}?tab=documents`}
                  className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]"
                >
                  <FileText className="h-3.5 w-3.5" /> Documents
                </Link>
                <Link
                  href={`/portal/projects/${project.id}?tab=brokers`}
                  className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </Link>
                {project.status !== "archived" && (
                  <button
                    onClick={async () => {
                      try {
                        await runWithToast({
                          loading: "Archiving project...",
                          success: "Project archived.",
                          action: () => archiveProject.mutateAsync(project.id),
                        });
                      } catch {}
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]"
                  >
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-4 text-xs text-[#607187]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Active projects: <strong>{projects.filter((project) => project.status === "active").length}</strong>
          </span>
          <span>
            Total units across portfolio:{" "}
            <strong>{projects.reduce((total, project) => total + project.units.length, 0)}</strong>
          </span>
          <span>
            Sold units:{" "}
            <strong>
              {projects.reduce((total, project) => total + project.units.filter((unit) => unit.status === "sold").length, 0)}
            </strong>
          </span>
        </div>
      </section>
    </div>
  );
}
