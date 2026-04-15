import { MarketingShell } from "@/components/landing/marketing-shell";

const solutionGroups = [
  {
    title: "For Developer Companies",
    points: [
      "Broker governance and onboarding",
      "Agreement and legal lifecycle control",
      "Project-level inventory distribution",
      "Sales approval and dispute handling",
    ],
  },
  {
    title: "For Broker Companies",
    points: [
      "Multi-developer relationship management",
      "Agreement acceptance and inventory visibility",
      "Agent creation and assignment control",
      "Sales tracking with timeline clarity",
    ],
  },
  {
    title: "For Broker Agents (Mobile-ready)",
    points: [
      "Assigned property visibility",
      "Submission-ready sale flow",
      "Role-bound, secure access",
      "Future mobile extension on same data model",
    ],
  },
];

export default function SolutionsPage() {
  return (
    <MarketingShell
      title="Solutions"
      subtitle="A role-specific operating model for developers, brokers, and agents in one synchronized ecosystem."
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {solutionGroups.map((group) => (
          <article key={group.title} className="rounded-md border border-[#dbe4eb] bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-[#1f2a44]">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#66788f]">
              {group.points.map((point) => (
                <li key={point}>• {point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}

