"use client";

import type { ActivityLogRecord, NotificationRecord } from "@/lib/backend/types/entities";

export type NotificationType = "contract" | "broker" | "inventory" | "sales" | "system";
export type AlertPriority = "urgent" | "warning" | "info";
export type LogModule = "agreements" | "brokers" | "inventory" | "sales" | "system";

type ClassifiedNotification = {
  type: NotificationType;
  priority: AlertPriority;
  relatedModule: string;
};

type ClassifiedLog = {
  module: LogModule;
  priority: AlertPriority;
  reference: string | null;
};

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function classifyPriorityFromText(text: string): AlertPriority {
  if (
    hasAny(text, [
      "expire",
      "expiring",
      "urgent",
      "dispute",
      "suspend",
      "rejected",
      "failed",
      "duplicate",
      "risk",
      "security",
    ])
  ) {
    return "urgent";
  }

  if (hasAny(text, ["pending", "inactive", "warning", "review", "reserved"])) {
    return "warning";
  }

  return "info";
}

export function classifyNotification(notification: NotificationRecord): ClassifiedNotification {
  const text = notification.message.toLowerCase();
  const priority = classifyPriorityFromText(text);

  if (hasAny(text, ["agreement", "contract", "renew", "expiry"])) {
    return { type: "contract", priority, relatedModule: "Agreements" };
  }
  if (hasAny(text, ["broker", "invite", "partner"])) {
    return { type: "broker", priority, relatedModule: "Broker Network" };
  }
  if (hasAny(text, ["property", "inventory", "unit", "shared", "unsold", "aging"])) {
    return { type: "inventory", priority, relatedModule: "Inventory" };
  }
  if (hasAny(text, ["sale", "sold", "approval", "request"])) {
    return { type: "sales", priority, relatedModule: "Sales Control" };
  }
  return { type: "system", priority, relatedModule: "System" };
}

function extractReference(input: string): string | null {
  const patterns = [
    /\b(?:CON|SAL|BRK|DEV|AGT|PDF)-\d{4}-\d{3,4}\b/i,
    /\b[A-Z]{2,5}-[A-Z0-9]{1,5}-[A-Z0-9]{1,6}\b/i,
    /\b[A-Z]{2,5}-\d{3,6}\b/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[0]) return match[0];
  }
  return null;
}

export function classifyActivityLog(log: ActivityLogRecord): ClassifiedLog {
  const text = `${log.action} ${log.details}`.toLowerCase();
  const priority = classifyPriorityFromText(text);

  let module: LogModule = "system";
  if (hasAny(text, ["agreement", "contract", "renew"])) module = "agreements";
  else if (hasAny(text, ["broker", "invite", "suspend"])) module = "brokers";
  else if (hasAny(text, ["property", "inventory", "unit", "share"])) module = "inventory";
  else if (hasAny(text, ["sale", "sold", "approval", "dispute"])) module = "sales";

  return {
    module,
    priority,
    reference: extractReference(`${log.action} ${log.details}`),
  };
}

export function priorityChipClasses(priority: AlertPriority) {
  if (priority === "urgent") return "bg-[#fff2f2] text-[#b64646] border-[#f3c9c9]";
  if (priority === "warning") return "bg-[#fff9ec] text-[#9a6a00] border-[#f1dfb0]";
  return "bg-[#eff6ff] text-[#2f6399] border-[#cfe2ff]";
}

