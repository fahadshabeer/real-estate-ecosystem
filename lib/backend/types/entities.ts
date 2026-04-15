export type AccountRole =
  | "developer_admin"
  | "broker_admin"
  | "developer_staff"
  | "broker_staff"
  | "broker_agent";

export type WorkspaceRole = "developer" | "broker" | "agent";

export type CompanyType = "developer" | "broker";

export type CompanyStatus = "active" | "review" | "suspended";

export type AgreementStatus =
  | "Draft"
  | "Pending Approval"
  | "Active"
  | "Rejected"
  | "Expired"
  | "Suspended"
  | "Renewed";

export type PropertyStatus = "Available" | "Reserved" | "Sold" | "Hidden";

export type CompanyRecord = {
  id: string;
  type: CompanyType;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  logoUrl?: string;
  address?: string;
  contactPerson?: string;
  planCode?: string;
  planName?: string;
  billingStatus?: "active" | "trial" | "past_due" | "canceled";
  billingStartedAt?: string;
  offerLabel?: string;
  status: CompanyStatus;
  suspensionReason?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  uid: string;
  email: string | null;
  role: AccountRole;
  companyId?: string;
  agentId?: string;
  workspaceRole: WorkspaceRole;
  permissions: string[];
};

export type ContractRequestRecord = {
  id: string;
  brokerId: string;
  developerId: string;
  initiatedBy?: "developer" | "broker";
  status:
    | "Invitation Sent"
    | "Pending"
    | "Connected"
    | "Agreement Pending"
    | "Agreement Active"
    | "Rejected"
    | "Drafted";
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type AgreementRecord = {
  id: string;
  developerId: string;
  brokerId: string;
  agreementTitle?: string;
  agreementType?: "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited";
  projectsCovered?: string[];
  projectScope?: string;
  terms: string;
  validityStart: string;
  validityEnd: string;
  commissionRules: string;
  paymentTrigger?: string;
  bonusConditions?: string;
  legalClauses?: string;
  status: AgreementStatus;
  initiatedBy: "developer" | "broker";
  developerSignature?: string;
  brokerSignature?: string;
  developerSignedAt?: string;
  brokerSignedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PropertyRecord = {
  id: string;
  developerId: string;
  title: string;
  projectName: string;
  block: string;
  unitNumber: string;
  propertyType: string;
  price: number;
  size: string;
  location: string;
  description: string;
  images: string[];
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
};

export type AgreementPropertyMapRecord = {
  id: string;
  agreementId: string;
  propertyId: string;
  sharedDate: string;
};

export type AgentRecord = {
  id: string;
  brokerId: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  status: "Active" | "Disabled";
  assignedPropertiesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BrokerPropertyAssignmentRecord = {
  id: string;
  brokerId: string;
  propertyId: string;
  agreementId: string;
  agentId: string;
  assignedDate: string;
  status: "Assigned" | "Reassigned";
};

export type NotificationRecord = {
  id: string;
  message: string;
  targetRole: "developer" | "broker" | "agent" | "all";
  targetCompanyId?: string;
  createdAt: string;
};

export type ActivityLogRecord = {
  id: string;
  actorRole: WorkspaceRole;
  actorLabel: string;
  action: string;
  details: string;
  createdAt: string;
};

export type ContractDocumentRecord = {
  id: string;
  agreementId: string;
  contractId: string;
  developerId: string;
  brokerId: string;
  fileName: string;
  verificationTokenHash: string;
  createdByUid: string;
  createdAt: string;
};

export type SaleRequestStatus = "Pending" | "Approved" | "Rejected" | "Disputed";

export type SaleRequestRecord = {
  id: string;
  developerId: string;
  brokerId: string;
  agreementId: string;
  propertyId: string;
  propertyCode: string;
  projectName: string;
  unitNumber: string;
  propertyPrice: number;
  submittedAt: string;
  status: SaleRequestStatus;
  brokerAgentId?: string;
  requestNotes?: string;
  rejectReason?: "duplicate claim" | "incomplete data" | "invalid agreement" | "already sold";
  approvedAt?: string;
  rejectedAt?: string;
  disputedAt?: string;
  updatedAt: string;
};

export type SaleTimelineItem = {
  id: string;
  developerId: string;
  saleRequestId: string;
  action:
    | "Submitted"
    | "Reviewed"
    | "Approved"
    | "Rejected"
    | "Dispute Raised"
    | "Dispute Resolved";
  actorRole: "developer" | "broker";
  actorLabel: string;
  details: string;
  createdAt: string;
};

export type SaleAttributionRecord = {
  id: string;
  developerId: string;
  brokerId: string;
  agreementId: string;
  propertyId: string;
  saleRequestId: string;
  soldAt: string;
  soldBy: string;
};

export type SaleDisputeRecord = {
  id: string;
  developerId: string;
  propertyId: string;
  brokerA: string;
  brokerB: string;
  claimTime: string;
  status: "Open" | "Resolved" | "Rejected";
  sourceRequestIds: string[];
  resolvedAt?: string;
};

export type PageCursor = string | null;

export type PaginatedResult<T> = {
  items: T[];
  nextCursor: PageCursor;
};
