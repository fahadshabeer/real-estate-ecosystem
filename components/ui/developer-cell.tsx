"use client";

import { Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { companyRepository } from "@/lib/backend/factory";

export function DeveloperCell({ developerId }: { developerId: string }) {
  const developerQuery = useQuery({
    queryKey: ["company", "developer", developerId],
    queryFn: () => companyRepository.getCompanyById(developerId),
    enabled: Boolean(developerId),
    staleTime: 60_000,
  });

  const developer = developerQuery.data;
  const name = developer?.name ?? developerId;
  const logoUrl = developer?.logoUrl;

  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md border border-[#dbe4eb] bg-[#f8fafc] text-[#607187]">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Building2 className="h-3.5 w-3.5" />
        )}
      </span>
      <div>
        <p className="text-sm font-medium text-[#1f2a44]">{name}</p>
        <p className="text-[11px] text-[#7f8a99]">{developerId}</p>
      </div>
    </div>
  );
}

