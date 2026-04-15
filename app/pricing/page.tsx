import Link from "next/link";
import { MarketingShell } from "@/components/landing/marketing-shell";

const freeFeatures = [
  "Developer dashboard modules",
  "Broker dashboard modules",
  "Agreements and contract requests",
  "Inventory sharing and sales workflows",
  "Agent management",
  "Notifications and activity logs",
  "Analytics and reports",
];

export default function PricingPage() {
  return (
    <MarketingShell
      title="Pricing"
      subtitle="Single launch package. Every signup gets the Free Plan by default."
    >
      <section className="mx-auto max-w-3xl rounded-md border border-[#cfe5e4] bg-white p-6 md:p-8">
        <div className="inline-flex rounded-md border border-[#d7ecec] bg-[#edf8f7] px-3 py-1 text-xs font-semibold tracking-wide text-[#1f7d79] uppercase">
          Limited Time Offer
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-[#1f2a44]">Free Plan</h2>
            <p className="mt-1 text-sm text-[#66788f]">Full access with launch-phase limits.</p>
          </div>
          <p className="font-display text-4xl font-semibold text-[#1f7d79]">$0</p>
        </div>

        <ul className="mt-5 grid gap-2 text-sm text-[#5f7187] md:grid-cols-2">
          {freeFeatures.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="marketing-btn-primary rounded-md bg-[#3aa3a8] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#2d8f93]"
          >
            Start Free
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-[#d6dfe7] px-4 py-2.5 text-sm font-medium text-[#5f7187] transition hover:border-[#3aa3a8]/40 hover:text-[#1f7d79]"
          >
            Talk To Sales
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
