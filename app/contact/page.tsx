import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { MarketingShell } from "@/components/landing/marketing-shell";

export default function ContactPage() {
  return (
    <MarketingShell
      title="Contact"
      subtitle="Reach our product and onboarding team for demos, partnerships, and implementation planning."
    >
      <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <article className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h2 className="font-display text-xl font-semibold text-[#1f2a44]">Business Inquiries</h2>
          <p className="mt-2 text-sm leading-6 text-[#66788f]">
            For onboarding, solution walkthroughs, and enterprise deployment planning.
          </p>

          <div className="mt-5 grid gap-3 text-sm text-[#5f7187]">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#3aa3a8]" />
              <a href="mailto:sales@estateflow.com" className="hover:text-[#1f7d79]">
                sales@estateflow.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#3aa3a8]" />
              <span>+92 300 0000000</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#3aa3a8]" />
              <span>Islamabad, Pakistan</span>
            </div>
          </div>
        </article>

        <aside className="rounded-md border border-[#dbe4eb] bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-[#1f2a44]">Quick Actions</h3>
          <div className="mt-4 grid gap-2">
            <Link href="/signup" className="marketing-btn-primary rounded-md bg-[#3aa3a8] px-4 py-2.5 text-sm font-semibold">
              Create Account
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-[#d6dfe7] px-4 py-2.5 text-sm font-medium text-[#5f7187]"
            >
              View Pricing
            </Link>
            <Link
              href="/features"
              className="rounded-md border border-[#d6dfe7] px-4 py-2.5 text-sm font-medium text-[#5f7187]"
            >
              Explore Features
            </Link>
          </div>
        </aside>
      </section>
    </MarketingShell>
  );
}
