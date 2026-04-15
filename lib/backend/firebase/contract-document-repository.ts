import type {
  ContractDocumentRepository,
  GenerateContractPdfResult,
} from "@/lib/backend/ports/contract-document-repository";
import { getFirebaseServices } from "@/lib/backend/firebase/client";
import { apiUrl } from "@/lib/backend/firebase/api-url";

function extractErrorMessage(body: unknown): string | undefined {
  if (body && typeof body === "object" && "ok" in body && (body as { ok: boolean }).ok === false) {
    return (body as { error?: string }).error;
  }
  return undefined;
}

export const firebaseContractDocumentRepository: ContractDocumentRepository = {
  async generateAgreementPdf(agreementId: string): Promise<GenerateContractPdfResult> {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to generate contract PDFs.");
    const idToken = await user.getIdToken();

    const response = await fetch(apiUrl("/api/contracts/pdf"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ agreementId }),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: true; result: GenerateContractPdfResult }
      | { ok: false; error?: string }
      | null;
    if (!response.ok || !body?.ok) {
      throw new Error(extractErrorMessage(body) ?? "Failed to generate contract PDF.");
    }

    return body.result;
  },
  async downloadContractPdf(downloadUrl: string, fallbackFileName?: string): Promise<void> {
    const { auth } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) throw new Error("You must be signed in to download contract PDFs.");
    const idToken = await user.getIdToken();

    const response = await fetch(apiUrl(downloadUrl), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Failed to download contract PDF.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const disposition = response.headers.get("content-disposition");
    const match = disposition?.match(/filename="([^"]+)"/i);
    const fileName = match?.[1] ?? fallbackFileName ?? "contract.pdf";

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  },
};
