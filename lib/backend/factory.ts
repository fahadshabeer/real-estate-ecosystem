import type { AuthRepository } from "@/lib/backend/ports/auth-repository";
import type { CompanyRepository } from "@/lib/backend/ports/company-repository";
import type { StorageRepository } from "@/lib/backend/ports/storage-repository";
import type { AgreementRepository } from "@/lib/backend/ports/agreement-repository";
import type { PropertyRepository } from "@/lib/backend/ports/property-repository";
import type { AgentRepository } from "@/lib/backend/ports/agent-repository";
import type { ActivityRepository } from "@/lib/backend/ports/activity-repository";
import type { ContractDocumentRepository } from "@/lib/backend/ports/contract-document-repository";
import type { SalesRepository } from "@/lib/backend/ports/sales-repository";
import { firebaseAuthRepository } from "@/lib/backend/firebase/auth-repository";
import { firebaseCompanyRepository } from "@/lib/backend/firebase/company-repository";
import { firebaseStorageRepository } from "@/lib/backend/firebase/storage-repository";
import { firebaseAgreementRepository } from "@/lib/backend/firebase/agreement-repository";
import { firebasePropertyRepository } from "@/lib/backend/firebase/property-repository";
import { firebaseAgentRepository } from "@/lib/backend/firebase/agent-repository";
import { firebaseActivityRepository } from "@/lib/backend/firebase/activity-repository";
import { firebaseContractDocumentRepository } from "@/lib/backend/firebase/contract-document-repository";
import { firebaseSalesRepository } from "@/lib/backend/firebase/sales-repository";

export const authRepository: AuthRepository = firebaseAuthRepository;
export const companyRepository: CompanyRepository = firebaseCompanyRepository;
export const storageRepository: StorageRepository = firebaseStorageRepository;
export const agreementRepository: AgreementRepository = firebaseAgreementRepository;
export const propertyRepository: PropertyRepository = firebasePropertyRepository;
export const agentRepository: AgentRepository = firebaseAgentRepository;
export const activityRepository: ActivityRepository = firebaseActivityRepository;
export const contractDocumentRepository: ContractDocumentRepository = firebaseContractDocumentRepository;
export const salesRepository: SalesRepository = firebaseSalesRepository;

export function activeBackendProvider() {
  return "firebase" as const;
}
