"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/backend/firebase/api-url";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import type {
  CreateProjectInput,
  DocumentVisibility,
  ProjectDocument,
  ProjectPhase,
  ProjectRecord,
  ProjectShare,
  ProjectStatus,
  ProjectType,
  ProjectUnit,
  UnitStatus,
} from "@/lib/mock/projects-module";

const PROJECTS_QUERY_KEY = ["projects-module"] as const;

async function authJsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  const idToken = await user.getIdToken();

  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as
    | { ok: true; [key: string]: unknown }
    | { ok: false; error?: string }
    | null;

  if (!response.ok || !body?.ok) {
    const errorMessage = body && "ok" in body && body.ok === false ? body.error : undefined;
    throw new Error(errorMessage ?? "Request failed.");
  }

  return body as T;
}

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: async () => {
      const body = await authJsonFetch<{ ok: true; items: ProjectRecord[] }>("/api/projects", { method: "GET" });
      return body.items ?? [];
    },
    staleTime: 15_000,
  });
}

export function useProject(projectId?: string) {
  const projectsQuery = useProjects();
  const project = useMemo(
    () => projectsQuery.data?.find((item) => item.id === projectId) ?? null,
    [projectId, projectsQuery.data],
  );
  return { ...projectsQuery, project };
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const body = await authJsonFetch<{ ok: true; project: ProjectRecord }>("/api/projects", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return body.project;
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; data: Partial<ProjectRecord> }) => {
      const body = await authJsonFetch<{ ok: true; project: ProjectRecord }>(`/api/projects/${encodeURIComponent(input.projectId)}`, {
        method: "PATCH",
        body: JSON.stringify(input.data),
      });
      return body.project;
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const body = await authJsonFetch<{ ok: true; project: ProjectRecord }>(
        `/api/projects/${encodeURIComponent(projectId)}/archive`,
        { method: "PATCH" },
      );
      return body.project;
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export function useUnarchiveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const body = await authJsonFetch<{ ok: true; project: ProjectRecord }>(
        `/api/projects/${encodeURIComponent(projectId)}/unarchive`,
        { method: "PATCH" },
      );
      return body.project;
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export function useAddPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; data: Omit<ProjectPhase, "id" | "projectId"> }) => {
      const body = await authJsonFetch<{ ok: true; phase: ProjectPhase }>(
        `/api/projects/${encodeURIComponent(input.projectId)}/phases`,
        {
          method: "POST",
          body: JSON.stringify(input.data),
        },
      );
      return body.phase;
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export function useAddDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; data: Omit<ProjectDocument, "id" | "projectId" | "uploadedAt"> }) => {
      const body = await authJsonFetch<{ ok: true; document: ProjectDocument }>(
        `/api/projects/${encodeURIComponent(input.projectId)}/documents`,
        {
          method: "POST",
          body: JSON.stringify(input.data),
        },
      );
      return body.document;
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export function useAddUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; data: Omit<ProjectUnit, "id" | "shared"> }) => {
      const body = await authJsonFetch<{ ok: true; unit: ProjectUnit }>(
        `/api/projects/${encodeURIComponent(input.projectId)}/units`,
        {
          method: "POST",
          body: JSON.stringify(input.data),
        },
      );
      return body.unit;
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; unitId: string; data: Partial<ProjectUnit> }) => {
      const body = await authJsonFetch<{ ok: true; unit: ProjectUnit }>(
        `/api/projects/${encodeURIComponent(input.projectId)}/units/${encodeURIComponent(input.unitId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(input.data),
        },
      );
      return body.unit;
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export function useRemoveUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; unitId: string }) => {
      await authJsonFetch<{ ok: true }>(
        `/api/projects/${encodeURIComponent(input.projectId)}/units/${encodeURIComponent(input.unitId)}`,
        { method: "DELETE" },
      );
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export function useShareProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; data: Omit<ProjectShare, "id" | "projectId" | "sharedAt"> }) => {
      const body = await authJsonFetch<{ ok: true; share: ProjectShare }>(
        `/api/projects/${encodeURIComponent(input.projectId)}/shares`,
        {
          method: "POST",
          body: JSON.stringify(input.data),
        },
      );
      return body.share;
    },
    onSuccess: async () => invalidate(queryClient),
  });
}

export type {
  ProjectRecord,
  ProjectUnit,
  ProjectPhase,
  ProjectDocument,
  ProjectShare,
  ProjectStatus,
  ProjectType,
  UnitStatus,
  DocumentVisibility,
};
