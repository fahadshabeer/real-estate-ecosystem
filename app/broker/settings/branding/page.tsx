"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, House, Save, Upload } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { useDeveloperSettings, useUpdateDeveloperSettings } from "@/hooks/use-developer-settings";
import { storageRepository } from "@/lib/backend/factory";
import { runWithToast } from "@/lib/ui/toast";

export default function BrokerBrandingSettingsPage() {
  const { currentUser } = useAppContext();
  const companyId = currentUser?.companyId;
  const settingsQuery = useDeveloperSettings(companyId);
  const updateSettings = useUpdateDeveloperSettings(companyId);

  const settings = settingsQuery.data;
  const [primaryColor, setPrimaryColor] = useState(settings?.branding.primaryColor ?? "#1f2a44");
  const [secondaryColor, setSecondaryColor] = useState(settings?.branding.secondaryColor ?? "#3aa4a8");
  const [footerBranding, setFooterBranding] = useState(
    settings?.branding.footerBranding ?? "Confidential Broker Network",
  );
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);

  useEffect(() => {
    if (!settings) return;
    setPrimaryColor(settings.branding.primaryColor);
    setSecondaryColor(settings.branding.secondaryColor);
    setFooterBranding(settings.branding.footerBranding);
  }, [settings]);

  const save = async () => {
    if (!companyId) return;
    try {
      await runWithToast({
        loading: "Saving broker branding...",
        success: "Branding settings updated.",
        action: async () => {
          const watermarkDataUrl = watermarkFile
            ? await storageRepository.uploadCompanyAsset(watermarkFile, companyId, "watermark")
            : settings?.branding.watermarkDataUrl;
          const signatureDataUrl = signatureFile
            ? await storageRepository.uploadCompanyAsset(signatureFile, companyId, "signature")
            : settings?.branding.signatureDataUrl;
          const stampDataUrl = stampFile
            ? await storageRepository.uploadCompanyAsset(stampFile, companyId, "stamp")
            : settings?.branding.stampDataUrl;

          await updateSettings.mutateAsync((prev) => ({
            ...prev,
            branding: {
              ...prev.branding,
              primaryColor,
              secondaryColor,
              footerBranding,
              watermarkDataUrl,
              signatureDataUrl,
              stampDataUrl,
            },
          }));
        },
      });
      setWatermarkFile(null);
      setSignatureFile(null);
      setStampFile(null);
    } catch {}
  };

  const watermarkPreview = watermarkFile ? URL.createObjectURL(watermarkFile) : settings?.branding.watermarkDataUrl ?? null;
  const signaturePreview = signatureFile ? URL.createObjectURL(signatureFile) : settings?.branding.signatureDataUrl ?? null;
  const stampPreview = stampFile ? URL.createObjectURL(stampFile) : settings?.branding.stampDataUrl ?? null;

  return (
    <div className="space-y-5 pb-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#7f8a99]">
          <House className="h-3.5 w-3.5" />
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Branding</span>
        </div>
      </section>

      {settingsQuery.isLoading ? (
        <SettingsPageSkeleton rows={6} />
      ) : (
      <section className="rounded-md border border-[#dbe4eb] bg-white p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm text-[#4f6078]">
            Primary Color
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-2" />
          </label>
          <label className="text-sm text-[#4f6078]">
            Secondary Color
            <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-2" />
          </label>
          <label className="text-sm text-[#4f6078]">
            Footer Branding
            <input value={footerBranding} onChange={(e) => setFooterBranding(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-[#dbe4eb] bg-white px-3 text-sm text-[#1f2a44]" />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: "Report Watermark", preview: watermarkPreview, set: setWatermarkFile },
            { label: "Authorized Signature", preview: signaturePreview, set: setSignatureFile },
            { label: "Company Stamp / Seal", preview: stampPreview, set: setStampFile },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
              <p className="text-sm font-medium text-[#1f2a44]">{item.label}</p>
              <div className="mt-2 grid h-24 place-items-center overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
                {item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt={item.label} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-[#8a96a8]">No file</span>
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

        <div className="mt-5 rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4">
          <p className="text-sm font-semibold text-[#1f2a44]">Live Report Preview</p>
          <div className="mt-3 rounded-md border border-[#dbe4eb] bg-white p-4">
            <div className="relative overflow-hidden rounded-md border border-[#dbe4eb] p-4">
              {watermarkPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={watermarkPreview} alt="watermark" className="pointer-events-none absolute inset-0 m-auto h-24 w-24 opacity-10" />
              ) : null}
              <p className="text-sm font-semibold" style={{ color: primaryColor }}>
                BROKER PERFORMANCE REPORT
              </p>
              <p className="mt-2 text-xs text-[#607187]">
                Executive broker report preview with configured branding colors.
              </p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span style={{ color: secondaryColor }}>{footerBranding}</span>
                <span className="text-[#7f8a99]">QAR | EN/AR Ready</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={settingsQuery.isLoading || updateSettings.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#2f7f48]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Branding is applied to broker reports and exports.
        </p>
      </section>
      )}
    </div>
  );
}
