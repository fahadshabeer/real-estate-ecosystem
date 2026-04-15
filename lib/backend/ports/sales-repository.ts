import type {
  SaleAttributionRecord,
  SaleDisputeRecord,
  SaleRequestRecord,
  SaleTimelineItem,
} from "@/lib/backend/types/entities";

export type CreateSaleRequestInput = {
  developerId: string;
  brokerId: string;
  agreementId: string;
  propertyId: string;
  propertyCode: string;
  projectName: string;
  unitNumber: string;
  propertyPrice: number;
  brokerAgentId?: string;
  requestNotes?: string;
};

export type SalesRepository = {
  listDeveloperSaleRequests(developerId: string): Promise<SaleRequestRecord[]>;
  listBrokerSaleRequests(brokerId: string): Promise<SaleRequestRecord[]>;
  createSaleRequest(input: CreateSaleRequestInput): Promise<SaleRequestRecord>;
  respondSaleRequest(input: {
    saleRequestId: string;
    action: "Approve" | "Reject" | "Dispute";
    reason?: "duplicate claim" | "incomplete data" | "invalid agreement" | "already sold";
  }): Promise<SaleRequestRecord>;
  listSalesTimeline(developerId: string): Promise<SaleTimelineItem[]>;
  listSalesAttribution(developerId: string): Promise<SaleAttributionRecord[]>;
  listSalesDisputes(developerId: string): Promise<SaleDisputeRecord[]>;
  resolveSalesDispute(input: {
    disputeId: string;
    action: "Resolved" | "Rejected";
  }): Promise<SaleDisputeRecord>;
};
