import type { AccountRole, WorkspaceRole } from "@/lib/backend/types/entities";

export function toWorkspaceRole(role: AccountRole | string): WorkspaceRole {
  if (role.startsWith("developer")) return "developer";
  if (role.startsWith("broker_agent")) return "agent";
  if (role.startsWith("broker")) return "broker";
  return "agent";
}

export function normalizeAccountRole(raw: string | undefined): AccountRole {
  if (!raw) return "broker_agent";
  if (raw === "developer") return "developer_admin";
  if (raw === "broker") return "broker_admin";
  if (raw === "agent") return "broker_agent";
  return raw as AccountRole;
}

export function isDeveloperRole(role: AccountRole | string) {
  return toWorkspaceRole(role) === "developer";
}

export function isBrokerRole(role: AccountRole | string) {
  return toWorkspaceRole(role) === "broker";
}

export function isAgentRole(role: AccountRole | string) {
  return toWorkspaceRole(role) === "agent";
}

export const PERMISSIONS = {
  VIEW_DASHBOARD: "can_view_dashboard",
  VIEW_PROJECTS: "can_view_projects",
  EDIT_PROJECTS: "can_edit_projects",
  VIEW_INVENTORY: "can_view_inventory",
  EDIT_INVENTORY: "can_edit_inventory",
  VIEW_BROKERS: "can_view_brokers",
  MANAGE_BROKERS: "can_manage_brokers",
  VIEW_AGREEMENTS: "can_view_agreements",
  MANAGE_AGREEMENTS: "can_manage_agreements",
  VIEW_SALES: "can_view_sales",
  APPROVE_SALES: "can_approve_sales",
  VIEW_ANALYTICS: "can_view_analytics",
  VIEW_REPORTS: "can_view_reports",
  VIEW_NOTIFICATIONS: "can_view_notifications",
  MANAGE_SETTINGS: "can_manage_settings",
  MANAGE_USERS: "can_manage_users",
  VIEW_AGENTS: "can_view_agents",
  MANAGE_AGENTS: "can_manage_agents",
  SUBMIT_SALES: "can_submit_sales",
} as const;

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export function developerPermissionsByTitle(title: string): string[] {
  if (title === "Super Admin") return ["*"];
  if (title === "Sales Director") {
    return [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_SALES, PERMISSIONS.APPROVE_SALES, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_NOTIFICATIONS];
  }
  if (title === "Inventory Manager") {
    return [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_PROJECTS, PERMISSIONS.EDIT_PROJECTS, PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.EDIT_INVENTORY, PERMISSIONS.VIEW_BROKERS, PERMISSIONS.MANAGE_BROKERS, PERMISSIONS.VIEW_NOTIFICATIONS];
  }
  if (title === "Legal Manager") {
    return [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_AGREEMENTS, PERMISSIONS.MANAGE_AGREEMENTS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_NOTIFICATIONS];
  }
  return [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_NOTIFICATIONS];
}

export function brokerPermissionsByTitle(title: string): string[] {
  if (title === "Super Admin") return ["*"];
  if (title === "Sales Manager") {
    return [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_BROKERS, PERMISSIONS.MANAGE_BROKERS, PERMISSIONS.VIEW_AGREEMENTS, PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.VIEW_SALES, PERMISSIONS.SUBMIT_SALES, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_NOTIFICATIONS];
  }
  if (title === "Agent Coordinator") {
    return [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_BROKERS, PERMISSIONS.VIEW_AGREEMENTS, PERMISSIONS.VIEW_AGENTS, PERMISSIONS.MANAGE_AGENTS, PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.VIEW_NOTIFICATIONS];
  }
  return [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_BROKERS, PERMISSIONS.VIEW_AGREEMENTS, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_NOTIFICATIONS];
}

export function agentDefaultPermissions(): string[] {
  return [PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.SUBMIT_SALES, PERMISSIONS.VIEW_NOTIFICATIONS];
}

export function hasPermission(permissions: string[] | undefined, permission: string) {
  if (!permissions) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

export function clampPermissions(permissions: string[] | undefined) {
  if (!permissions?.length) return [];
  if (permissions.includes("*")) return ["*"];
  return permissions.filter((permission) => ALL_PERMISSIONS.includes(permission as (typeof ALL_PERMISSIONS)[number]));
}
