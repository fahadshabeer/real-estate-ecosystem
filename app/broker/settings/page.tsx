"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, House, Loader2, Save, Upload } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { useCompanyProfile, useUpdateCompanyLogo, useUpdateCompanyProfile } from "@/hooks/use-company-profile";
import { useDeveloperSettings, useUpdateDeveloperSettings } from "@/hooks/use-developer-settings";
import { storageRepository } from "@/lib/backend/factory";
import { runWithToast } from "@/lib/ui/toast";

export default function BrokerCompanyProfileSettingsPage() {
  const { currentUser } = useAppContext();
  const companyId = currentUser?.companyId;

  const companyQuery = useCompanyProfile(companyId);
  const settingsQuery = useDeveloperSettings(companyId);
  const updateProfile = useUpdateCompanyProfile(companyId);
  const updateLogo = useUpdateCompanyLogo(companyId);
  const updateSettings = useUpdateDeveloperSettings(companyId);

  const [form, setForm] = useState({
    name: "",
    registrationNumber: "",
    taxOrLicenseNumber: "",
    phone: "",
    email: "",
    address: "",
    country: "Qatar",
    city: "Doha",
    contactPerson: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [sealFile, setSealFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const loading = companyQuery.isLoading || settingsQuery.isLoading;

  useEffect(() => {
    const company = companyQuery.data;
    const settings = settingsQuery.data;
    if (!company || !settings) return;
    setForm((prev) =>
      prev.name
        ? prev
        : {
            name: company.name,
            registrationNumber: company.registrationNumber,
            taxOrLicenseNumber: settings.profileExtra.taxOrLicenseNumber,
            phone: company.phone,
            email: company.email,
            address: company.address ?? "",
            country: settings.profileExtra.country,
            city: settings.profileExtra.city,
            contactPerson: company.contactPerson ?? "",
          },
    );
  }, [companyQuery.data, settingsQuery.data]);

  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : companyQuery.data?.logoUrl ?? null;
  const sealPreview = sealFile ? URL.createObjectURL(sealFile) : settingsQuery.data?.profileExtra.sealDataUrl ?? null;
  const coverPreview = coverFile
    ? URL.createObjectURL(coverFile)
    : settingsQuery.data?.profileExtra.coverImageDataUrl ?? null;

  const save = async () => {
    if (!companyId) return;
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) nextErrors.name = "Company name is required.";
    if (!form.registrationNumber.trim()) nextErrors.registrationNumber = "Registration number is required.";
    if (!form.phone.trim()) nextErrors.phone = "Official phone is required.";
    if (!form.country.trim()) nextErrors.country = "Country is required.";
    if (!form.city.trim()) nextErrors.city = "City is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    try {
      await runWithToast({
        loading: "Saving broker profile...",
        success: "Broker profile updated.",
        action: async () => {
          await updateProfile.mutateAsync({
            name: form.name,
            phone: form.phone,
            registrationNumber: form.registrationNumber,
            address: form.address || undefined,
            contactPerson: form.contactPerson || undefined,
          });

          if (logoFile) {
            await updateLogo.mutateAsync(logoFile);
          }

          const sealDataUrl = sealFile
            ? await storageRepository.uploadCompanyAsset(sealFile, companyId, "seal")
            : settingsQuery.data?.profileExtra.sealDataUrl;
          const coverImageDataUrl = coverFile
            ? await storageRepository.uploadCompanyAsset(coverFile, companyId, "cover")
            : settingsQuery.data?.profileExtra.coverImageDataUrl;

          await updateSettings.mutateAsync((prev) => ({
            ...prev,
            profileExtra: {
              ...prev.profileExtra,
              taxOrLicenseNumber: form.taxOrLicenseNumber,
              country: form.country,
              city: form.city,
              sealDataUrl,
              coverImageDataUrl,
            },
          }));
        },
      });
      setLogoFile(null);
      setSealFile(null);
      setCoverFile(null);
    } catch {}
  };

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Company Profile</span>
        </div>
      </section>

      {loading ? (
        <SettingsPageSkeleton rows={9} />
      ) : (
      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {[
            { label: "Company Logo", preview: logoPreview, set: setLogoFile },
            { label: "Company Seal", preview: sealPreview, set: setSealFile },
            { label: "Cover Image", preview: coverPreview, set: setCoverFile },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
              <p className="text-sm font-medium text-[#1f2a44]">{item.label}</p>
              <div className="mt-2 grid h-24 w-full place-items-center overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
                {item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt={item.label} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-[#8a96a8]">No asset</span>
                )}
              </div>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-xs text-[#4f6078]">
                <Upload className="h-3.5 w-3.5" />
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => item.set(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-[#4f6078]">
            Company Name
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
            {errors.name ? <span className="mt-1 block text-xs text-[#c24141]">{errors.name}</span> : null}
          </label>
          <label className="text-sm text-[#4f6078]">
            Broker Company Unique ID (Immutable)
            <input value={companyId ?? ""} disabled className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-[#f5f8fb] px-3 text-sm text-[#7f8a99]" />
          </label>
          <label className="text-sm text-[#4f6078]">
            Registration Number
            <input value={form.registrationNumber} onChange={(e) => setForm((p) => ({ ...p, registrationNumber: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
            {errors.registrationNumber ? <span className="mt-1 block text-xs text-[#c24141]">{errors.registrationNumber}</span> : null}
          </label>
          <label className="text-sm text-[#4f6078]">
            Tax / License Number
            <input value={form.taxOrLicenseNumber} onChange={(e) => setForm((p) => ({ ...p, taxOrLicenseNumber: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
          </label>
          <label className="text-sm text-[#4f6078]">
            Official Email
            <input value={form.email} disabled className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-[#f5f8fb] px-3 text-sm text-[#7f8a99]" />
          </label>
          <label className="text-sm text-[#4f6078]">
            Official Phone
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
            {errors.phone ? <span className="mt-1 block text-xs text-[#c24141]">{errors.phone}</span> : null}
          </label>
          <label className="text-sm text-[#4f6078]">
            Country
            <input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
            {errors.country ? <span className="mt-1 block text-xs text-[#c24141]">{errors.country}</span> : null}
          </label>
          <label className="text-sm text-[#4f6078]">
            City
            <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
            {errors.city ? <span className="mt-1 block text-xs text-[#c24141]">{errors.city}</span> : null}
          </label>
          <label className="text-sm text-[#4f6078] md:col-span-2">
            Address
            <textarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm text-[#1f2a44]" />
          </label>
          <label className="text-sm text-[#4f6078] md:col-span-2">
            Contact Person
            <input value={form.contactPerson} onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#607187]" /> : null}
          <button
            type="button"
            onClick={save}
            disabled={loading || updateProfile.isPending || updateLogo.isPending || updateSettings.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>

        {!loading && companyId ? (
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-[#2f7f48]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Broker identity synced for agreements, reports, and legal references.
          </p>
        ) : null}
      </section>
      )}
    </div>
  );
}
