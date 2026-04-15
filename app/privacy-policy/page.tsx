export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-12 text-slate-100">
      <h1 className="font-display text-4xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-slate-300">Last updated: March 14, 2026</p>

      <section className="rounded-2xl border border-slate-500/25 bg-slate-900/70 p-5">
        <h2 className="font-display text-xl text-white">Data We Collect</h2>
        <p className="mt-2 text-sm text-slate-300">
          We collect account details, company profile information, agreements, properties, notifications, and activity logs required to operate the platform.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-500/25 bg-slate-900/70 p-5">
        <h2 className="font-display text-xl text-white">How We Use Data</h2>
        <p className="mt-2 text-sm text-slate-300">
          Data is used for authentication, contract workflows, audit trails, security monitoring, and product performance.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-500/25 bg-slate-900/70 p-5">
        <h2 className="font-display text-xl text-white">Security</h2>
        <p className="mt-2 text-sm text-slate-300">
          We apply role-based controls, authenticated APIs, and protected storage paths to reduce unauthorized data access.
        </p>
      </section>
    </main>
  );
}
