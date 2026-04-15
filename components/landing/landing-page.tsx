import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Users, Workflow } from "lucide-react";
import { MarketingShell } from "@/components/landing/marketing-shell";

const quickPoints = [
  "Developer ↔ Broker digital collaboration",
  "Contract lifecycle with verification",
  "Role-based access and activity logs",
];

const miniStats = [
  { label: "Live Modules", value: "10+" },
  { label: "Core Roles", value: "3" },
  { label: "Unified Platform", value: "1" },
];

export function LandingPage() {
  return (
    <MarketingShell>
      <section className="grid gap-6 md:grid-cols-[1.25fr,0.95fr]">
        <div className="rounded-md border border-[#dbe4eb] bg-white p-6 md:p-8">
          <span className="inline-flex rounded-md border border-[#d7ecec] bg-[#edf8f7] px-3 py-1 text-xs font-semibold tracking-wide text-[#1f7d79]">
            Enterprise Property Collaboration
          </span>
          <h1 className="mt-4 font-display text-3xl leading-tight font-semibold text-[#1f2a44] md:text-4xl">
            One digital ecosystem for Developers, Broker Companies, and Broker Agents
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66788f] md:text-base">
            Minimal, clear, and production-focused. Manage agreements, inventory sharing, and sales approvals from a
            single command center.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="marketing-btn-primary inline-flex items-center gap-2 rounded-md bg-[#3aa3a8] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#2d8f93]"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
            <Link
              href="/features"
              className="rounded-md border border-[#d6dfe7] px-4 py-2.5 text-sm font-medium text-[#5f7187] transition hover:border-[#3aa3a8]/40 hover:text-[#1f7d79]"
            >
              Explore Features
            </Link>
          </div>

          <div className="mt-6 grid gap-2">
            {quickPoints.map((point) => (
              <div key={point} className="flex items-start gap-2 text-sm text-[#51647b]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#3aa3a8]" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-md border border-[#dbe4eb] bg-white p-6">
          <p className="text-xs font-semibold tracking-wide text-[#7d8ea2] uppercase">At A Glance</p>
          <div className="mt-4 grid gap-3">
            {miniStats.map((item) => (
              <div key={item.label} className="rounded-md border border-[#e8eef4] bg-[#f8fafd] p-4">
                <p className="font-display text-2xl font-semibold text-[#1f2a44]">{item.value}</p>
                <p className="mt-1 text-xs text-[#74869c]">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-[#d7ecec] bg-[#edf8f7] p-4 text-sm text-[#356870]">
            All detailed information is now available in dedicated pages: Features, Solutions, Pricing, and Contact.
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <QuickTile
          icon={<ShieldCheck className="h-4 w-4 text-[#3aa3a8]" />}
          title="Secure Agreement Flow"
          desc="Role checks, signatures, and status-based lifecycle controls."
        />
        <QuickTile
          icon={<Users className="h-4 w-4 text-[#3aa3a8]" />}
          title="Broker Network Management"
          desc="Structured partner management with ranking and trust visibility."
        />
        <QuickTile
          icon={<Workflow className="h-4 w-4 text-[#3aa3a8]" />}
          title="Operational Workflow"
          desc="Inventory sharing and sales approvals in one controlled flow."
        />
      </section>
    </MarketingShell>
  );
}

function QuickTile({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <article className="rounded-md border border-[#dbe4eb] bg-white p-4">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d8ebeb] bg-[#edf8f7]">
        {icon}
      </div>
      <h2 className="mt-3 font-display text-base font-semibold text-[#1f2a44]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#66788f]">{desc}</p>
    </article>
  );
}
