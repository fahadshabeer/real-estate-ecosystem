"use client";

import type { AgreementRecord, ContractRequestRecord } from "@/lib/backend/types/entities";

export type ConnectionLifecycleStatus =
  | "Invitation Sent"
  | "Connected"
  | "Agreement Pending"
  | "Agreement Active"
  | "Suspended"
  | "Terminated";

export function deriveConnectionLifecycleStatus(input: {
  agreements: AgreementRecord[];
  requests: ContractRequestRecord[];
  suspended?: boolean;
}): ConnectionLifecycleStatus {
  if (input.suspended) return "Suspended";

  const hasActiveAgreement = input.agreements.some(
    (agreement) => agreement.status === "Active" || agreement.status === "Renewed",
  );
  if (hasActiveAgreement) return "Agreement Active";

  const hasPendingAgreement = input.agreements.some(
    (agreement) => agreement.status === "Draft" || agreement.status === "Pending Approval",
  );
  if (hasPendingAgreement) return "Agreement Pending";

  const statuses = new Set(input.requests.map((row) => row.status));
  if (statuses.has("Agreement Pending")) return "Agreement Pending";
  if (statuses.has("Agreement Active")) return "Agreement Active";
  if (statuses.has("Connected") || statuses.has("Drafted")) return "Connected";
  if (statuses.has("Invitation Sent") || statuses.has("Pending")) return "Invitation Sent";

  return "Terminated";
}

