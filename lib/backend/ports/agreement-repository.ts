import type {
  AgreementRecord,
  ContractRequestRecord,
  PaginatedResult,
  PageCursor,
} from "@/lib/backend/types/entities";

export type CreateAgreementInput = {
  developerId: string;
  brokerId: string;
  contractRequestId?: string;
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
  initiatedBy: "developer" | "broker";
  developerSignature?: string;
  status?: AgreementRecord["status"];
};

export type AgreementRepository = {
  getAgreementById(agreementId: string): Promise<AgreementRecord | null>;
  createAgreement(input: CreateAgreementInput): Promise<AgreementRecord>;
  updateAgreement(input: {
    agreementId: string;
    agreementTitle?: string;
    agreementType?: "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited";
    projectsCovered?: string[];
    projectScope?: string;
    terms?: string;
    validityStart?: string;
    validityEnd?: string;
    commissionRules?: string;
    paymentTrigger?: string;
    bonusConditions?: string;
    legalClauses?: string;
    status?: AgreementRecord["status"];
  }): Promise<AgreementRecord>;
  listAgreementsPageByDeveloper(developerId: string, pageSize: number, cursor?: PageCursor): Promise<PaginatedResult<AgreementRecord>>;
  listAgreementsPageByBroker(brokerId: string, pageSize: number, cursor?: PageCursor): Promise<PaginatedResult<AgreementRecord>>;
  respondAgreement(input: {
    agreementId: string;
    action: "Accept" | "Reject";
    brokerSignature?: string;
  }): Promise<AgreementRecord>;

  createContractRequest(input: {
    brokerId: string;
    developerId: string;
    note: string;
    initiatedBy?: "developer" | "broker";
  }): Promise<ContractRequestRecord>;
  listContractRequestsByDeveloper(developerId: string): Promise<ContractRequestRecord[]>;
  listContractRequestsByBroker(brokerId: string): Promise<ContractRequestRecord[]>;
  updateContractRequestStatus(
    requestId: string,
    action: "Approve" | "Reject" | "Draft Contract" | "Accept",
  ): Promise<ContractRequestRecord>;
};
