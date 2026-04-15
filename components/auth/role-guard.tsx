"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AccountRole, WorkspaceRole } from "@/lib/backend/types/entities";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { toWorkspaceRole } from "@/lib/auth/roles";

function fallbackPath(role: AccountRole | undefined) {
  const workspaceRole = role ? toWorkspaceRole(role) : undefined;
  if (workspaceRole === "developer") return "/portal";
  if (workspaceRole === "broker") return "/broker";
  if (role === "broker_agent") return "/agent";
  return "/login";
}

export function RoleGuard({
  role,
  children,
}: {
  role: Extract<WorkspaceRole, "developer" | "broker">;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading } = useAuthSession();

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (toWorkspaceRole(session.role) !== role) {
      router.replace(fallbackPath(session.role));
    }
  }, [isLoading, pathname, role, router, session]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="rounded-xl border border-slate-500/30 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
          Checking session...
        </div>
      </div>
    );
  }

  if (!session || toWorkspaceRole(session.role) !== role) return null;

  return <>{children}</>;
}
