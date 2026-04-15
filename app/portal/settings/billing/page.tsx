"use client";

import { House } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useCompanyProfile } from "@/hooks/use-company-profile";

export default function BillingSettingsPage() {
  const { currentUser } = useAppContext();
  const companyId = currentUser?.companyId;
  const companyQuery = useCompanyProfile(companyId);
  const company = companyQuery.data;

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Billing</span>
        </div>
      </section>

      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="rounded-md border border-[#cce9db] bg-[#effbf4] px-3 py-2 text-xs font-semibold text-[#2b7a4f]">
          Limited Time Offer: All premium modules are unlocked on the Free Plan.
        </div>
        <div className="mt-4 rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4">
          <p className="text-sm font-semibold text-[#1f2a44]">Current Subscription</p>
          <p className="mt-1 text-xl font-semibold text-[#1f2a44]">{company?.planName ?? "Free Plan"}</p>
          <p className="mt-1 text-sm text-[#607187]">
            Every signup user is assigned the Free Plan by default. Billing automation will be enabled in the next
            release.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <div className="rounded-md border border-[#dbe4eb] bg-white p-3 text-sm">
              <p className="text-xs text-[#7f8a99]">Billing Status</p>
              <p className="font-semibold text-[#1f2a44]">{company?.billingStatus ?? "active"}</p>
            </div>
            <div className="rounded-md border border-[#dbe4eb] bg-white p-3 text-sm">
              <p className="text-xs text-[#7f8a99]">Plan Code</p>
              <p className="font-semibold text-[#1f2a44]">{company?.planCode ?? "FREE-2026"}</p>
            </div>
            <div className="rounded-md border border-[#dbe4eb] bg-white p-3 text-sm">
              <p className="text-xs text-[#7f8a99]">Started</p>
              <p className="font-semibold text-[#1f2a44]">
                {company?.billingStartedAt ? new Date(company.billingStartedAt).toLocaleDateString() : "Today"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

