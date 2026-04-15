"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/components/state/app-context";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useDeveloperAgreements } from "@/hooks/use-agreements";
import { useDeveloperProperties, useShareProperty } from "@/hooks/use-properties";
import { companyRepository } from "@/lib/backend/factory";
import { runWithToast } from "@/lib/ui/toast";

export default function SharePropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId") ?? "";

  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";

  const agreementsQuery = useDeveloperAgreements(developerId);
  const propertiesQuery = useDeveloperProperties(developerId);
  const shareProperty = useShareProperty(developerId);

  const agreements = useMemo(
    () => agreementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [agreementsQuery.data?.pages],
  );
  const activeAgreements = agreements.filter((agreement) => agreement.status === "Active");

  const properties = useMemo(
    () => propertiesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [propertiesQuery.data?.pages],
  );
  const availableToShare = properties.filter((property) => property.status !== "Hidden");

  const [selectedAgreementIds, setSelectedAgreementIds] = useState<string[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>(initialPropertyId ? [initialPropertyId] : []);
  const [sharingType, setSharingType] = useState<"Exclusive" | "Non-Exclusive" | "Priority">("Non-Exclusive");
  const [brokerNames, setBrokerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const brokerIds = [...new Set(activeAgreements.map((agreement) => agreement.brokerId))];
    if (!brokerIds.length) return;
    void (async () => {
      const pairs = await Promise.all(
        brokerIds.map(async (brokerId) => {
          const company = await companyRepository.getCompanyById(brokerId);
          return [brokerId, company?.name ?? brokerId] as const;
        }),
      );
      setBrokerNames(Object.fromEntries(pairs));
    })();
  }, [activeAgreements]);

  const shareMatrixCount = selectedAgreementIds.length * selectedPropertyIds.length;

  const submit = async () => {
    try {
      await runWithToast({
        loading: "Sharing inventory...",
        success: "Properties shared successfully.",
        action: async () => {
          for (const agreementId of selectedAgreementIds) {
            for (const propertyId of selectedPropertyIds) {
              await shareProperty.mutateAsync({ agreementId, propertyId });
            }
          }
        },
      });
      router.push("/portal/properties/shared");
    } catch {}
  };

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Inventory" title="Share Property" backHref="/portal/properties" />

      <section className="ui-form-shell space-y-4">
        <div className="rounded-md border border-[#ecf1f5] bg-[#f9fbfc] p-4">
          <p className="text-sm font-semibold text-[#1f2a44]">Share Engine</p>
          <p className="mt-1 text-sm text-[#607187]">
            Selected properties: <strong>{selectedPropertyIds.length}</strong> · Selected agreements:{" "}
            <strong>{selectedAgreementIds.length}</strong> · Mapping operations: <strong>{shareMatrixCount}</strong>
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-[#ecf1f5] p-4">
            <p className="text-sm font-semibold text-[#1f2a44]">Step 1 - Select Agreements</p>
            <div className="mt-3 max-h-64 space-y-2 overflow-auto">
              {activeAgreements.map((agreement) => {
                const checked = selectedAgreementIds.includes(agreement.id);
                return (
                  <label key={agreement.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-[#dbe4eb] p-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedAgreementIds((prev) => [...prev, agreement.id]);
                        } else {
                          setSelectedAgreementIds((prev) => prev.filter((id) => id !== agreement.id));
                        }
                      }}
                    />
                    <span className="text-sm text-[#4f6078]">
                      <strong>{agreement.id}</strong> · {brokerNames[agreement.brokerId] ?? agreement.brokerId}
                    </span>
                  </label>
                );
              })}
              {activeAgreements.length === 0 && (
                <p className="text-sm text-[#7f8a99]">No active agreements available.</p>
              )}
            </div>
          </div>

          <div className="rounded-md border border-[#ecf1f5] p-4">
            <p className="text-sm font-semibold text-[#1f2a44]">Step 2 - Select Properties</p>
            <div className="mt-3 max-h-64 space-y-2 overflow-auto">
              {availableToShare.map((property) => {
                const checked = selectedPropertyIds.includes(property.id);
                return (
                  <label key={property.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-[#dbe4eb] p-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedPropertyIds((prev) => [...prev, property.id]);
                        } else {
                          setSelectedPropertyIds((prev) => prev.filter((id) => id !== property.id));
                        }
                      }}
                    />
                    <span className="text-sm text-[#4f6078]">
                      <strong>{property.id}</strong> · {property.projectName} {property.unitNumber}
                    </span>
                  </label>
                );
              })}
              {availableToShare.length === 0 && (
                <p className="text-sm text-[#7f8a99]">No shareable properties available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="ui-label">
            Sharing Type
            <FancySelect
              value={sharingType}
              onChange={(event) => setSharingType(event.target.value as typeof sharingType)}
              className="ui-select"
            >
              <option>Exclusive</option>
              <option>Non-Exclusive</option>
              <option>Priority</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            Notes
            <input className="ui-input" placeholder="Time-limited and priority rules are enabled in backend phase." />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => router.push("/portal/properties")} className="ui-btn-secondary">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={shareProperty.isPending || !selectedAgreementIds.length || !selectedPropertyIds.length}
            className="ui-btn-primary disabled:opacity-60"
          >
            {shareProperty.isPending ? "Sharing..." : `Share ${selectedPropertyIds.length} Properties`}
          </button>
        </div>
      </section>
    </div>
  );
}
