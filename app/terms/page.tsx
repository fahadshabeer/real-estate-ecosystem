export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-12 text-slate-100">
      <h1 className="font-display text-4xl font-semibold">Terms of Service</h1>
      <p className="text-sm text-slate-300">Effective date: March 14, 2026</p>

      <section className="rounded-2xl border border-slate-500/25 bg-slate-900/70 p-5">
        <h2 className="font-display text-xl text-white">Platform Use</h2>
        <p className="mt-2 text-sm text-slate-300">
          Accounts must use lawful business data and maintain confidentiality of credentials and signatures.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-500/25 bg-slate-900/70 p-5">
        <h2 className="font-display text-xl text-white">Digital Contracts</h2>
        <p className="mt-2 text-sm text-slate-300">
          Contract acceptance actions and signatures are recorded for operational and audit purposes.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-500/25 bg-slate-900/70 p-5">
        <h2 className="font-display text-xl text-white">Service Changes</h2>
        <p className="mt-2 text-sm text-slate-300">
          We may update product features, limits, and plans. Continued usage indicates acceptance of updated terms.
        </p>
      </section>
    </main>
  );
}
