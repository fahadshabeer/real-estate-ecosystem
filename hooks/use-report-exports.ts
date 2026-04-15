"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/backend/firebase/api-url";
import { getFirebaseServices } from "@/lib/backend/firebase/client";

export type ReportExportFormat = "PDF" | "Excel" | "CSV";

export type ReportExportRecord = {
  id: string;
  reportType: string;
  format: ReportExportFormat;
  filtersSummary: string;
  generatedBy: string;
  generatedAt: string;
};

const KEY = ["report-exports"] as const;

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  const idToken = await user.getIdToken();

  return fetch(apiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

async function authJsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as
    | { ok: true; [key: string]: unknown }
    | { ok: false; error?: string }
    | null;

  if (!response.ok || !body?.ok) {
    const message = body && "ok" in body && body.ok === false ? body.error : undefined;
    throw new Error(message ?? "Request failed.");
  }

  return body as T;
}

async function downloadExportById(exportId: string) {
  const response = await authFetch(`/api/reports/exports/${encodeURIComponent(exportId)}/download`, {
    method: "GET",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    throw new Error(body?.error ?? "Download failed.");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") ?? "";
  const nameMatch = contentDisposition.match(/filename="(.+)"/i);
  const fallback = `${exportId}.bin`;
  const filename = nameMatch?.[1] ?? fallback;

  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export function useReportExportHistory(scopeKey?: string, limit = 250) {
  return useQuery({
    queryKey: [...KEY, scopeKey ?? "", limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      const body = await authJsonFetch<{ ok: true; items: ReportExportRecord[] }>(`/api/reports/exports?${params.toString()}`, {
        method: "GET",
      });
      return body.items ?? [];
    },
    staleTime: 15_000,
  });
}

export function useGenerateReportExport(scopeKey?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      reportType: string;
      format: ReportExportFormat;
      filtersSummary: string;
      generatedBy: string;
    }) =>
      authJsonFetch<{ ok: true; export: ReportExportRecord }>("/api/reports/exports", {
        method: "POST",
        body: JSON.stringify(input),
      }).then((body) => body.export),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...KEY, scopeKey ?? ""] });
    },
  });
}

export function useDownloadReportExport() {
  return useMutation({
    mutationFn: ({ exportId }: { exportId: string }) => downloadExportById(exportId),
  });
}
