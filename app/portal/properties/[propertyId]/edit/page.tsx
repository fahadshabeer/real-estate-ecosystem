"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/components/state/app-context";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useDeveloperProperties, useUpdateProperty } from "@/hooks/use-properties";
import { runWithToast } from "@/lib/ui/toast";

type PropertyForm = {
  title: string;
  projectName: string;
  block: string;
  unitNumber: string;
  propertyType: string;
  price: string;
  size: string;
  location: string;
  description: string;
  status: "Available" | "Reserved" | "Sold" | "Hidden";
};

export default function EditPropertyPage() {
  const params = useParams<{ propertyId: string }>();
  const router = useRouter();
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";

  const propertyIdRaw = params?.propertyId;
  const propertyId = decodeURIComponent(Array.isArray(propertyIdRaw) ? propertyIdRaw[0] : propertyIdRaw ?? "");

  const propertiesQuery = useDeveloperProperties(developerId);
  const updateProperty = useUpdateProperty(developerId);

  const properties = useMemo(
    () => propertiesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [propertiesQuery.data?.pages],
  );
  const property = properties.find((item) => item.id === propertyId);

  const initialized = useRef(false);
  const [form, setForm] = useState<PropertyForm>({
    title: "",
    projectName: "",
    block: "",
    unitNumber: "",
    propertyType: "",
    price: "",
    size: "",
    location: "",
    description: "",
    status: "Available",
  });

  useEffect(() => {
    if (!property && propertiesQuery.hasNextPage && !propertiesQuery.isFetchingNextPage) {
      void propertiesQuery.fetchNextPage();
    }
  }, [property, propertiesQuery]);

  useEffect(() => {
    if (!property || initialized.current) return;
    setForm({
      title: property.title,
      projectName: property.projectName,
      block: property.block,
      unitNumber: property.unitNumber,
      propertyType: property.propertyType,
      price: String(property.price ?? ""),
      size: property.size,
      location: property.location,
      description: property.description,
      status: property.status,
    });
    initialized.current = true;
  }, [property]);

  const save = async () => {
    try {
      await runWithToast({
        loading: "Updating property...",
        success: "Property updated successfully.",
        action: () =>
          updateProperty.mutateAsync({
            propertyId,
            data: {
              ...form,
              price: Number(form.price || 0),
            },
          }),
      });
      router.push(`/portal/properties/${encodeURIComponent(propertyId)}`);
    } catch {}
  };

  const stillLoading = (propertiesQuery.isLoading || propertiesQuery.isFetchingNextPage) && !property;

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Inventory" title="Edit Property" backHref="/portal/properties" />

      <section className="ui-form-shell">
        {stillLoading ? (
          <p className="text-sm text-[#607187]">Loading property details...</p>
        ) : !property ? (
          <div className="space-y-3">
            <p className="text-sm text-rose-600">Property not found.</p>
            <button onClick={() => router.push("/portal/properties")} className="ui-btn-secondary">
              Back to Inventory
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 rounded-md border border-[#ecf1f5] p-4 sm:grid-cols-2 lg:grid-cols-4">
              <h2 className="sm:col-span-2 lg:col-span-4 font-display text-base font-semibold text-[#1f2a44]">
                Unit Information
              </h2>
              <label className="ui-label">
                Project
                <input value={form.projectName} onChange={(event) => setForm((prev) => ({ ...prev, projectName: event.target.value }))} className="ui-input" />
              </label>
              <label className="ui-label">
                Block
                <input value={form.block} onChange={(event) => setForm((prev) => ({ ...prev, block: event.target.value }))} className="ui-input" />
              </label>
              <label className="ui-label">
                Unit Number
                <input value={form.unitNumber} onChange={(event) => setForm((prev) => ({ ...prev, unitNumber: event.target.value }))} className="ui-input" />
              </label>
              <label className="ui-label">
                Property Title
                <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="ui-input" />
              </label>
              <label className="ui-label">
                Type
                <input value={form.propertyType} onChange={(event) => setForm((prev) => ({ ...prev, propertyType: event.target.value }))} className="ui-input" />
              </label>
              <label className="ui-label">
                Size
                <input value={form.size} onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))} className="ui-input" />
              </label>
              <label className="ui-label">
                Price
                <input value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} className="ui-input" />
              </label>
              <label className="ui-label">
                Status
                <FancySelect value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as PropertyForm["status"] }))} className="ui-select">
                  <option>Available</option>
                  <option>Reserved</option>
                  <option>Sold</option>
                  <option>Hidden</option>
                </FancySelect>
              </label>
              <label className="ui-label sm:col-span-2 lg:col-span-4">
                Location
                <input value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} className="ui-input" />
              </label>
              <label className="ui-label sm:col-span-2 lg:col-span-4">
                Description
                <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} className="ui-textarea" />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => router.push(`/portal/properties/${encodeURIComponent(propertyId)}`)} className="ui-btn-secondary">
                Cancel
              </button>
              <button onClick={save} disabled={updateProperty.isPending} className="ui-btn-primary disabled:opacity-60">
                {updateProperty.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
