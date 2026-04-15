import type {
  AgreementPropertyMapRecord,
  PaginatedResult,
  PageCursor,
  PropertyRecord,
  PropertyStatus,
} from "@/lib/backend/types/entities";

export type CreatePropertyInput = {
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
  status: PropertyStatus;
};

export type PropertyRepository = {
  createProperty(input: CreatePropertyInput): Promise<PropertyRecord>;
  updateProperty(
    propertyId: string,
    input: Partial<
      Pick<
        CreatePropertyInput,
        "title" | "projectName" | "block" | "unitNumber" | "propertyType" | "price" | "size" | "location" | "description" | "status"
      >
    >,
  ): Promise<PropertyRecord>;
  listPropertiesPageByDeveloper(
    developerId: string,
    pageSize: number,
    cursor?: PageCursor,
  ): Promise<PaginatedResult<PropertyRecord>>;
  shareProperty(agreementId: string, propertyId: string): Promise<AgreementPropertyMapRecord>;
  listAgreementPropertyMapsByAgreementIds(agreementIds: string[]): Promise<AgreementPropertyMapRecord[]>;
  listVisiblePropertiesByBroker(brokerId: string): Promise<Array<PropertyRecord & { agreementId: string; sharedDate: string }>>;
};
