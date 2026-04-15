"use client";

import {
  Bell,
  BarChart3,
  Building2,
  FileText,
  Home,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { AppShell } from "@/components/shell/app-shell";
import { PERMISSIONS } from "@/lib/auth/roles";

const navItems = [
  { label: "Dashboard", href: "/broker", icon: LayoutDashboard, permission: PERMISSIONS.VIEW_DASHBOARD },
  { label: "Developers", href: "/broker/developers", icon: Building2, permission: PERMISSIONS.VIEW_BROKERS },
  { label: "Agreements", href: "/broker/agreements", icon: FileText, permission: PERMISSIONS.VIEW_AGREEMENTS },
  { label: "Inventory", href: "/broker/properties", icon: Home, permission: PERMISSIONS.VIEW_INVENTORY },
  { label: "Sales", href: "/broker/sales", icon: ListChecks, permission: PERMISSIONS.VIEW_SALES },
  { label: "Agents", href: "/broker/agents", icon: Users, permission: PERMISSIONS.VIEW_AGENTS },
  { label: "Analytics", href: "/broker/statistics", icon: BarChart3, permission: PERMISSIONS.VIEW_ANALYTICS },
  { label: "Reports", href: "/broker/reports", icon: ScrollText, permission: PERMISSIONS.VIEW_REPORTS },
  { label: "Notifications", href: "/broker/notifications", icon: Bell, permission: PERMISSIONS.VIEW_NOTIFICATIONS },
  { label: "Settings", href: "/broker/settings", icon: Settings, permission: PERMISSIONS.MANAGE_SETTINGS },
];

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="broker">
      <AppShell role="broker" brand="EstateFlow Broker" navItems={navItems}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
