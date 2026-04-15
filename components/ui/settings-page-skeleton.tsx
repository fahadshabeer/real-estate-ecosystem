"use client";

export function SettingsPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-md bg-[#edf2f7]" />
        <div className="h-28 animate-pulse rounded-md bg-[#edf2f7]" />
        <div className="h-28 animate-pulse rounded-md bg-[#edf2f7]" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-11 animate-pulse rounded-md bg-[#edf2f7]" />
        ))}
      </div>
    </section>
  );
}
