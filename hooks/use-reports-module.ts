"use client";

import { useMemo } from "react";
import { useAnalyticsModule } from "@/hooks/use-analytics-module";

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year || 2026, (month || 1) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function useReportsModule(developerId?: string) {
  const analytics = useAnalyticsModule(developerId);

  const monthlyRows = useMemo(() => {
    const rows = analytics.monthlySales.map((row, index, arr) => {
      const previous = arr[index - 1];
      const mom = previous?.revenue ? ((row.revenue - previous.revenue) / previous.revenue) * 100 : 0;
      return {
        month: row.month,
        monthLabel: formatMonth(row.month),
        soldUnits: row.sold,
        revenue: row.revenue,
        agreementsCreated: analytics.agreements.filter((agreement) => agreement.createdAt.startsWith(row.month)).length,
        brokerCount: new Set(
          analytics.salesRequests
            .filter((request) => request.submittedAt.startsWith(row.month))
            .map((request) => request.brokerId),
        ).size,
        mom,
      };
    });
    return rows.sort((a, b) => (a.month < b.month ? 1 : -1));
  }, [analytics.agreements, analytics.monthlySales, analytics.salesRequests]);

  const brokerRows = useMemo(() => {
    return analytics.brokerPerformanceRows
      .map((row) => {
        const revenueContribution = analytics.salesRequests
          .filter((request) => request.brokerId === row.brokerId && request.status === "Approved")
          .reduce((sum, request) => sum + request.propertyPrice, 0);

        return {
          brokerId: row.brokerId,
          propertiesShared: row.sharedProperties,
          dealsClosed: row.dealsClosed,
          approvalRate: row.approvalSuccess,
          revenueContribution,
          conversionRate: row.conversionRate,
        };
      })
      .sort((a, b) => b.revenueContribution - a.revenueContribution || b.dealsClosed - a.dealsClosed);
  }, [analytics.brokerPerformanceRows, analytics.salesRequests]);

  const projectRows = useMemo(() => {
    return analytics.projectRows.map((row) => ({
      projectId: row.id,
      projectName: row.name,
      availableUnits: row.available,
      soldUnits: row.sold,
      reservedUnits: row.reserved,
      blockedUnits: row.blocked,
      revenue: row.revenue,
      brokerParticipation: row.brokerCount,
    }));
  }, [analytics.projectRows]);

  const agreementRows = useMemo(() => {
    return analytics.agreements
      .map((agreement) => {
        const propertiesCovered = analytics.maps.filter((map) => map.agreementId === agreement.id).length;
        return {
          agreementId: agreement.id,
          brokerId: agreement.brokerId,
          status: agreement.status,
          propertiesCovered,
          expiryDate: agreement.validityEnd,
        };
      })
      .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1));
  }, [analytics.agreements, analytics.maps]);

  const inventoryRows = useMemo(() => {
    return analytics.projectRows.map((row) => ({
      projectId: row.id,
      projectName: row.name,
      available: row.available,
      reserved: row.reserved,
      sold: row.sold,
      blocked: row.blocked,
    }));
  }, [analytics.projectRows]);

  const bestProject = useMemo(
    () => [...analytics.projectRows].sort((a, b) => b.revenue - a.revenue)[0] ?? null,
    [analytics.projectRows],
  );

  const weakBroker = useMemo(
    () =>
      [...analytics.brokerPerformanceRows].sort((a, b) => a.dealsClosed - b.dealsClosed || a.trustScore - b.trustScore)[0] ??
      null,
    [analytics.brokerPerformanceRows],
  );

  return {
    loading: analytics.loading,
    error: analytics.error,
    isError: analytics.isError,
    monthlyRows,
    brokerRows,
    projectRows,
    agreementRows,
    inventoryRows,
    bestProject,
    weakBroker,
    raw: analytics,
  };
}
