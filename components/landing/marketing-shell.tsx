 "use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Solutions", href: "/solutions" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export function MarketingShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7fb] text-[#1f2a44]">
      <header className="sticky top-0 z-40 border-b border-[#e4ebf2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#3aa3a8] text-white">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold tracking-wide">ESTATEFLOW</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[#66788f] md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2 py-1 transition ${
                  pathname === item.href
                    ? "bg-[#edf8f7] text-[#1f7d79]"
                    : "text-[#66788f] hover:text-[#1f7d79]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md border border-[#d6dfe7] px-3 py-2 text-sm text-[#5f7187] transition hover:border-[#3aa3a8]/40 hover:text-[#1f7d79]"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="marketing-btn-primary rounded-md bg-[#3aa3a8] px-3 py-2 text-sm font-semibold transition hover:bg-[#2d8f93]"
            >
              Signup
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">
        {(title || subtitle) && (
          <section className="mb-8 rounded-md border border-[#dbe4eb] bg-white p-6">
            {title ? <h1 className="font-display text-2xl font-semibold text-[#1f2a44]">{title}</h1> : null}
            {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66788f]">{subtitle}</p> : null}
          </section>
        )}
        {children}
      </main>

      <footer className="border-t border-[#e4ebf2] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-[#6f8197] md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} EstateFlow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="transition hover:text-[#1f7d79]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-[#1f7d79]">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
