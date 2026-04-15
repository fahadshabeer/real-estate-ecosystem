"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/state/app-context";
import { InnerShellHeader } from "@/components/ui/inner-shell-header";
import { useCreateProperty } from "@/hooks/use-properties";
import { runWithToast } from "@/lib/ui/toast";

export default function NewPropertyPage() {
  const router = useRouter();
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const createProperty = useCreateProperty(developerId);

  const [form, setForm] = useState({
    projectName: "",
    block: "",
    floor: "",
    unitNumber: "",
    title: "",
    propertyType: "Apartment",
    bedrooms: "",
    bathrooms: "",
    size: "",
    balcony: "No",
    parking: "No",
    basePrice: "",
    discountedPrice: "",
    bookingPercentage: "",
    constructionPercentage: "",
    handoverPercentage: "",
    status: "Available" as "Available" | "Reserved" | "Sold" | "Hidden",
    availableFromDate: "",
    reservationAllowed: "Yes",
    location: "",
    description: "",
  });

  const propertyCode = useMemo(() => {
    const project = form.projectName.trim() || "PRJ";
    const block = form.block.trim() || "B";
    const unit = form.unitNumber.trim() || "0000";
    return `PR-${project.substring(0, 3).toUpperCase()}-${block.toUpperCase()}-${unit}`;
  }, [form.block, form.projectName, form.unitNumber]);

  const save = async () => {
    try {
      await runWithToast({
        loading: "Adding property...",
        success: "Property added successfully.",
        action: () =>
          createProperty.mutateAsync({
            developerId,
            title: form.title || `${form.propertyType} ${form.unitNumber}`,
            projectName: form.projectName,
            block: form.block || form.floor,
            unitNumber: form.unitNumber,
            propertyType: form.propertyType,
            price: Number(form.discountedPrice || form.basePrice || 0),
            size: form.size,
            location: form.location,
            description: [
              form.description,
              `Code: ${propertyCode}`,
              `Bedrooms: ${form.bedrooms}`,
              `Bathrooms: ${form.bathrooms}`,
              `Balcony: ${form.balcony}`,
              `Parking: ${form.parking}`,
              `Booking%: ${form.bookingPercentage || "N/A"}`,
              `Construction%: ${form.constructionPercentage || "N/A"}`,
              `Handover%: ${form.handoverPercentage || "N/A"}`,
              `Available From: ${form.availableFromDate || "N/A"}`,
              `Reservation Allowed: ${form.reservationAllowed}`,
            ]
              .filter(Boolean)
              .join("\n"),
            status: form.status,
          }),
      });
      router.push("/portal/properties");
    } catch {}
  };

  return (
    <div className="space-y-5 pb-6">
      <InnerShellHeader sectionLabel="Inventory" title="Add Property" backHref="/portal/properties" />

      <section className="ui-form-shell space-y-5">
        <div className="grid gap-3 rounded-md border border-[#ecf1f5] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <h2 className="sm:col-span-2 lg:col-span-4 font-display text-base font-semibold text-[#1f2a44]">
            Section A - Basic Unit Information
          </h2>
          <label className="ui-label">
            Project
            <input className="ui-input" value={form.projectName} onChange={(event) => setForm((prev) => ({ ...prev, projectName: event.target.value }))} />
          </label>
          <label className="ui-label">
            Tower / Block
            <input className="ui-input" value={form.block} onChange={(event) => setForm((prev) => ({ ...prev, block: event.target.value }))} />
          </label>
          <label className="ui-label">
            Floor
            <input className="ui-input" value={form.floor} onChange={(event) => setForm((prev) => ({ ...prev, floor: event.target.value }))} />
          </label>
          <label className="ui-label">
            Unit Number
            <input className="ui-input" value={form.unitNumber} onChange={(event) => setForm((prev) => ({ ...prev, unitNumber: event.target.value }))} />
          </label>
          <label className="ui-label sm:col-span-2 lg:col-span-4">
            Auto Property Code
            <input className="ui-input" value={propertyCode} readOnly />
          </label>
        </div>

        <div className="grid gap-3 rounded-md border border-[#ecf1f5] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <h2 className="sm:col-span-2 lg:col-span-4 font-display text-base font-semibold text-[#1f2a44]">
            Section B - Property Specifications
          </h2>
          <label className="ui-label">
            Property Title
            <input className="ui-input" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          </label>
          <label className="ui-label">
            Property Type
            <FancySelect className="ui-select" value={form.propertyType} onChange={(event) => setForm((prev) => ({ ...prev, propertyType: event.target.value }))}>
              <option>Apartment</option>
              <option>Villa</option>
              <option>Townhouse</option>
              <option>Office</option>
              <option>Retail</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            Bedrooms
            <input className="ui-input" value={form.bedrooms} onChange={(event) => setForm((prev) => ({ ...prev, bedrooms: event.target.value }))} />
          </label>
          <label className="ui-label">
            Bathrooms
            <input className="ui-input" value={form.bathrooms} onChange={(event) => setForm((prev) => ({ ...prev, bathrooms: event.target.value }))} />
          </label>
          <label className="ui-label">
            Size (sqm / sqft)
            <input className="ui-input" value={form.size} onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))} />
          </label>
          <label className="ui-label">
            Balcony
            <FancySelect className="ui-select" value={form.balcony} onChange={(event) => setForm((prev) => ({ ...prev, balcony: event.target.value }))}>
              <option>Yes</option>
              <option>No</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            Parking
            <FancySelect className="ui-select" value={form.parking} onChange={(event) => setForm((prev) => ({ ...prev, parking: event.target.value }))}>
              <option>Yes</option>
              <option>No</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            Location
            <input className="ui-input" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
          </label>
        </div>

        <div className="grid gap-3 rounded-md border border-[#ecf1f5] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <h2 className="sm:col-span-2 lg:col-span-4 font-display text-base font-semibold text-[#1f2a44]">
            Section C - Pricing Information
          </h2>
          <label className="ui-label">
            Base Price (QAR)
            <input className="ui-input" value={form.basePrice} onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))} />
          </label>
          <label className="ui-label">
            Discounted Price (QAR)
            <input className="ui-input" value={form.discountedPrice} onChange={(event) => setForm((prev) => ({ ...prev, discountedPrice: event.target.value }))} />
          </label>
          <label className="ui-label">
            Booking Percentage
            <input className="ui-input" value={form.bookingPercentage} onChange={(event) => setForm((prev) => ({ ...prev, bookingPercentage: event.target.value }))} />
          </label>
          <label className="ui-label">
            During Construction %
            <input className="ui-input" value={form.constructionPercentage} onChange={(event) => setForm((prev) => ({ ...prev, constructionPercentage: event.target.value }))} />
          </label>
          <label className="ui-label">
            Handover Percentage
            <input className="ui-input" value={form.handoverPercentage} onChange={(event) => setForm((prev) => ({ ...prev, handoverPercentage: event.target.value }))} />
          </label>
        </div>

        <div className="grid gap-3 rounded-md border border-[#ecf1f5] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <h2 className="sm:col-span-2 lg:col-span-4 font-display text-base font-semibold text-[#1f2a44]">
            Section D - Sales Configuration
          </h2>
          <label className="ui-label">
            Current Status
            <FancySelect className="ui-select" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as typeof form.status }))}>
              <option>Available</option>
              <option>Reserved</option>
              <option>Sold</option>
              <option>Hidden</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            Available From Date
            <input type="date" className="ui-input" value={form.availableFromDate} onChange={(event) => setForm((prev) => ({ ...prev, availableFromDate: event.target.value }))} />
          </label>
          <label className="ui-label">
            Reservation Allowed
            <FancySelect className="ui-select" value={form.reservationAllowed} onChange={(event) => setForm((prev) => ({ ...prev, reservationAllowed: event.target.value }))}>
              <option>Yes</option>
              <option>No</option>
            </FancySelect>
          </label>
        </div>

        <div className="grid gap-3 rounded-md border border-[#ecf1f5] p-4 sm:grid-cols-2">
          <h2 className="sm:col-span-2 font-display text-base font-semibold text-[#1f2a44]">Section E - Media Upload</h2>
          <label className="ui-label">
            Property Images (URL or reference)
            <input className="ui-input" placeholder="Add image URLs in next backend phase" />
          </label>
          <label className="ui-label">
            Floor Plan (URL or reference)
            <input className="ui-input" placeholder="Add floor plan in next backend phase" />
          </label>
          <label className="ui-label sm:col-span-2">
            Description
            <textarea className="ui-textarea" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => router.push("/portal/properties")} className="ui-btn-secondary">
            Cancel
          </button>
          <button onClick={save} disabled={createProperty.isPending} className="ui-btn-primary disabled:opacity-60">
            {createProperty.isPending ? "Adding..." : "Save Property"}
          </button>
        </div>
      </section>
    </div>
  );
}
