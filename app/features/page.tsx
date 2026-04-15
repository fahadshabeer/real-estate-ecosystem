import { Building2, FileText, ShieldCheck, Users, Workflow, BarChart3 } from "lucide-react";
import { MarketingShell } from "@/components/landing/marketing-shell";

const features = [
  {
    title: "Project & Inventory Control",
    desc: "Create projects, manage phase-wise inventory, and keep unit availability accurate.",
    icon: Building2,
  },
  {
    title: "Digital Agreements",
    desc: "Structured agreement lifecycle: draft, pending, active, renewal, suspension, expiry.",
    icon: FileText,
  },
  {
    title: "Sales Approval Engine",
    desc: "Approve, reject, or dispute sales requests with complete activity traceability.",
    icon: Workflow,
  },
  {
    title: "Agent Layer",
    desc: "Broker companies can create and manage agents for assignment-based operations.",
    icon: Users,
  },
  {
    title: "Analytics & Reports",
    desc: "Decision-ready insights for broker performance, project movement, and sales conversion.",
    icon: BarChart3,
  },
  {
    title: "Audit & Notification",
    desc: "Action-level logs and alerts across developer and broker workflows.",
    icon: ShieldCheck,
  },
];

export default function FeaturesPage() {
  return (
    <MarketingShell
      title="Platform Features"
      subtitle="Purpose-built modules for enterprise property collaboration, legal control, and operational transparency."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-md border border-[#dbe4eb] bg-white p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d8ebeb] bg-[#edf8f7]">
                <Icon className="h-5 w-5 text-[#3aa3a8]" />
              </span>
              <h2 className="mt-3 font-display text-lg font-semibold text-[#1f2a44]">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#66788f]">{item.desc}</p>
            </article>
          );
        })}
      </section>
    </MarketingShell>
  );
}

