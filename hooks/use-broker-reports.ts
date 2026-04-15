"use client";

import { useMemo } from "react";
import { useBrokerAnalytics } from "@/hooks/use-broker-analytics";

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year || 2026, (month || 1) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function useBrokerReports(brokerId?: string) {
  const analytics = useBrokerAnalytics(brokerId);

  const monthlyRows = useMemo(() => {
    return analytics.monthlySales.map((row) => {
      const salesInMonth = analytics.sales.filter((sale) => sale.submittedAt.startsWith(row.month));
      const developerApproved = new Map<string, number>();
      const agentApproved = new Map<string, number>();

      for (const sale of salesInMonth) {
        if (sale.status !== "Approved") continue;
        developerApproved.set(sale.developerId, (developerApproved.get(sale.developerId) ?? 0) + 1);
        if (sale.brokerAgentId) {
          agentApproved.set(sale.brokerAgentId, (agentApproved.get(sale.brokerAgentId) ?? 0) + 1);
        }
      }

      const topDeveloperEntry = [...developerApproved.entries()].sort((a, b) => b[1] - a[1])[0];
      const topAgentEntry = [...agentApproved.entries()].sort((a, b) => b[1] - a[1])[0];
      const topAgentName =
        analytics.agentRows.find((agent) => agent.agentId === topAgentEntry?.[0])?.name ?? "-";

      return {
        month: row.month,
        monthLabel: formatMonth(row.month),
        submitted: row.submitted,
        approved: row.approved,
        rejected: row.rejected,
        revenueEstimate: salesInMonth
          .filter((sale) => sale.status === "Approved")
          .reduce((sum, sale) => sum + sale.propertyPrice, 0),
        topDeveloper: topDeveloperEntry?.[0] ?? "-",
        topAgent: topAgentName,
      };
    });
  }, [analytics.agentRows, analytics.monthlySales, analytics.sales]);

  const developerRows = useMemo(() => {
    return analytics.developerRows.map((row) => ({
      developerId: row.developerId,
      unitsVisible: row.unitsVisible,
      submittedSales: analytics.sales.filter((sale) => sale.developerId === row.developerId).length,
      approvedSales: row.salesClosed,
      contribution: row.revenueContribution,
      approvalSpeed: row.approvalSpeed,
    }));
  }, [analytics.developerRows, analytics.sales]);

  const agentRows = useMemo(() => {
    return analytics.agentRows.map((row) => ({
      agentId: row.agentId,
      name: row.name,
      assignedUnits: row.assignedUnits,
      submittedSales: row.submittedSales,
      approvedSales: row.approvedSales,
      conversion: row.conversion,
      status: row.status,
    }));
  }, [analytics.agentRows]);

  const projectRows = useMemo(() => {
    return analytics.projectRows.map((row) => ({
      projectName: row.projectName,
      developerId: row.developerId,
      unitsVisible: row.unitsVisible,
      approvedSales: row.approvedSales,
      demandLevel: row.demandLevel,
      submittedSales: row.submittedSales,
    }));
  }, [analytics.projectRows]);

  const executiveSummary = useMemo(() => {
    const topDev = developerRows[0];
    const topAgent = agentRows[0];
    const topProject = projectRows[0];
    const monthlyDesc = [...monthlyRows].sort((a, b) => (a.month < b.month ? 1 : -1));
    const latest = monthlyDesc[0];
    const previous = monthlyDesc[1];
    const growthSignal =
      latest && previous ? latest.approved - previous.approved : 0;
    return {
      paragraph: `Sales ${growthSignal >= 0 ? "improved" : "declined"} by ${Math.abs(growthSignal)} approved deals compared to last cycle.`,
      topDeveloper: topDev?.developerId ?? "-",
      topAgent: topAgent?.name ?? "-",
      topProject: topProject?.projectName ?? "-",
    };
  }, [agentRows, developerRows, monthlyRows, projectRows]);

  return {
    loading: analytics.loading,
    error: analytics.error,
    isError: analytics.isError,
    monthlyRows,
    developerRows,
    agentRows,
    projectRows,
    executiveSummary,
    analytics,
  };
}
