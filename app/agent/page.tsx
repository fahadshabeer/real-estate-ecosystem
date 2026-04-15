"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, ShieldCheck } from "lucide-react";
import { useAuthSession } from "@/components/auth/auth-session-provider";

export default function AgentPortalPlaceholderPage() {
  const router = useRouter();
  const { session, isLoading } = useAuthSession();

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role !== "broker_agent") {
      router.replace(session.workspaceRole === "developer" ? "/portal" : "/broker");
    }
  }, [isLoading, router, session]);

  if (isLoading || !session) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">
      <div className="mx-auto max-w-2xl rounded-md border border-[#dbe4eb] bg-white p-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md border border-[#dbe4eb] bg-[#eff9f9] text-[#2f9fa4]">
          <Smartphone className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-[#1f2a44]">Agent Mobile Access Ready</h1>
        <p className="mt-2 text-sm text-[#607187]">
          Your broker agent account is authenticated successfully. Mobile app workspace screens will connect to this
          identity layer in the next phase.
        </p>
        <div className="mt-4 rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4 text-sm text-[#1f2a44]">
          <p className="font-semibold">Role: broker_agent</p>
          <p className="mt-1">Company ID: {session.companyId ?? "-"}</p>
          <p className="mt-1">Agent ID: {session.agentId ?? "-"}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[#2f9fa4]">
            <ShieldCheck className="h-4 w-4" /> Mobile-ready secure identity
          </p>
        </div>
        <Link href="/login" className="mt-4 inline-flex rounded-md border border-[#dbe4eb] px-4 py-2 text-sm font-medium text-[#1f2a44]">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
