import Link from "next/link";
import { ArrowLeft, House } from "lucide-react";

type InnerShellHeaderProps = {
  sectionLabel: string;
  title: string;
  backHref: string;
};

export function InnerShellHeader({ sectionLabel, title, backHref }: InnerShellHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>{sectionLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center justify-center rounded-full p-1.5 text-[#1f7d79] transition hover:bg-[#e8f4f4]"
          aria-label="Go back"
          title="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl leading-none text-[#1f2a44]">{title}</h1>
      </div>
    </header>
  );
}
