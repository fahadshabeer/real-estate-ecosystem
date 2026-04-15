"use client";

import { useMemo } from "react";
import { useDeveloperCompaniesPagination } from "@/hooks/use-developer-companies";
import { useBrokerAgreements, useBrokerContractRequests } from "@/hooks/use-agreements";
import { useVisibleBrokerProperties } from "@/hooks/use-properties";
import { deriveConnectionLifecycleStatus } from "@/lib/ui/connection-lifecycle";

export function useBrokerDeveloperRelations(brokerId?: string) {
  const developersQuery = useDeveloperCompaniesPagination();
  const agreementsQuery = useBrokerAgreements(brokerId);
  const requestsQuery = useBrokerContractRequests(brokerId);
  const propertiesQuery = useVisibleBrokerProperties(brokerId);

  const developers = useMemo(
    () => developersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [developersQuery.data?.pages],
  );
  const agreements = useMemo(
    () => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agreementsQuery.data?.pages],
  );
  const requests = requestsQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];

  const rows = useMemo(() => {
    const agreementById = new Map(agreements.map((agreement) => [agreement.id, agreement]));

    return developers.map((developer) => {
      const developerAgreements = agreements.filter((agreement) => agreement.developerId === developer.id);
      const developerRequests = requests.filter((request) => request.developerId === developer.id);
      const propertiesForDeveloper = properties.filter((property) => {
        const agreement = agreementById.get(property.agreementId);
        return agreement?.developerId === developer.id;
      });
      const projectsAvailable = new Set(propertiesForDeveloper.map((property) => property.projectName).filter(Boolean)).size;
      const activeAgreements = developerAgreements.filter(
        (agreement) => agreement.status === "Active" || agreement.status === "Renewed",
      ).length;
      const suspended =
        developer.status === "suspended" ||
        developerAgreements.some((agreement) => agreement.status === "Suspended");

      return {
        developer,
        agreements: developerAgreements,
        requests: developerRequests,
        projectsAvailable,
        visibleUnits: propertiesForDeveloper.length,
        activeAgreements,
        status: deriveConnectionLifecycleStatus({
          agreements: developerAgreements,
          requests: developerRequests,
          suspended,
        }),
      };
    });
  }, [agreements, developers, properties, requests]);

  return {
    rows,
    agreements,
    requests,
    properties,
    loading:
      developersQuery.isLoading || agreementsQuery.isLoading || requestsQuery.isLoading || propertiesQuery.isLoading,
    developersQuery,
    agreementsQuery,
    requestsQuery,
  };
}
