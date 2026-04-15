"use client";

import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  FolderKanban,
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
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard, permission: PERMISSIONS.VIEW_DASHBOARD },
  { label: "Projects", href: "/portal/projects", icon: FolderKanban, permission: PERMISSIONS.VIEW_PROJECTS },
  { label: "Inventory", href: "/portal/properties", icon: Home, permission: PERMISSIONS.VIEW_INVENTORY },
  { label: "Broker Network", href: "/portal/brokers", icon: Users, permission: PERMISSIONS.VIEW_BROKERS },
  { label: "Agreements", href: "/portal/contracts", icon: FileText, permission: PERMISSIONS.VIEW_AGREEMENTS },
  { label: "Sales Control", href: "/portal/sales-control", icon: ListChecks, permission: PERMISSIONS.VIEW_SALES },
  { label: "Analytics", href: "/portal/statistics", icon: BarChart3, permission: PERMISSIONS.VIEW_ANALYTICS },
  { label: "Reports", href: "/portal/reports", icon: ScrollText, permission: PERMISSIONS.VIEW_REPORTS },
  { label: "Notifications", href: "/portal/notifications", icon: Bell, permission: PERMISSIONS.VIEW_NOTIFICATIONS },
  { label: "Settings", href: "/portal/settings", icon: Settings, permission: PERMISSIONS.MANAGE_SETTINGS },
];

export default function DeveloperPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="developer">
      <AppShell role="developer" brand="EstateFlow Developer" navItems={navItems}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
