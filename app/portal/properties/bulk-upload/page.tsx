"use client";

import { useMemo, useState } from "react";
import { Download, House, Upload } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useCreateProperty } from "@/hooks/use-properties";
import { runWithToast } from "@/lib/ui/toast";

type ParsedRow = {
  title: string;
  projectName: string;
  block: string;
  unitNumber: string;
  propertyType: string;
  price: number;
  size: string;
  location: string;
  description: string;
  status: "Available" | "Reserved" | "Sold" | "Hidden";
  error?: string;
};

const TEMPLATE_HEADERS = [
  "title",
  "projectName",
  "block",
  "unitNumber",
  "propertyType",
  "price",
  "size",
  "location",
  "description",
  "status",
].join(",");

export default function BulkUploadPropertiesPage() {
  const { currentUser } = useAppContext();
  const developerId = currentUser?.companyId ?? "";
  const createProperty = useCreateProperty(developerId);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);

  const hasErrors = useMemo(() => rows.some((row) => row.error), [rows]);

  const handleDownloadTemplate = () => {
    const example = [
      TEMPLATE_HEADERS,
      "Studio Apartment,Lusail Heights,Tower A,1204,Apartment,1850000,145 sqm,Lusail Doha,High floor sea view,Available",
    ].join("\n");
    const blob = new Blob([example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "inventory_bulk_template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const parseCsv = (raw: string) => {
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length <= 1) {
      setRows([]);
      return;
    }

    const [, ...dataLines] = lines;
    const nextRows = dataLines.map((line) => {
      const [title, projectName, block, unitNumber, propertyType, priceRaw, size, location, description, statusRaw] =
        line.split(",").map((col) => col.trim());
      const parsedPrice = Number(priceRaw || 0);
      const status = (statusRaw || "Available") as ParsedRow["status"];
      const duplicate = dataLines.filter((candidate) => candidate.split(",")[3]?.trim() === unitNumber).length > 1;

      let error: string | undefined;
      if (!title || !projectName || !unitNumber || !propertyType || !size || !location) {
        error = "Missing required fields";
      } else if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        error = "Invalid price";
      } else if (!["Available", "Reserved", "Sold", "Hidden"].includes(status)) {
        error = "Invalid status";
      } else if (duplicate) {
        error = "Duplicate unit number in file";
      }

      return {
        title,
        projectName,
        block,
        unitNumber,
        propertyType,
        price: parsedPrice,
        size,
        location,
        description: description || "",
        status,
        error,
      };
    });

    setRows(nextRows);
  };

  const handleFile = async (file: File) => {
    const content = await file.text();
    parseCsv(content);
  };

  const importRows = async () => {
    if (!rows.length || hasErrors) return;
    setUploading(true);
    try {
      await runWithToast({
        loading: "Importing properties...",
        success: "Bulk inventory imported.",
        action: async () => {
          for (const row of rows) {
            await createProperty.mutateAsync({
              developerId,
              title: row.title,
              projectName: row.projectName,
              block: row.block,
              unitNumber: row.unitNumber,
              propertyType: row.propertyType,
              price: row.price,
              size: row.size,
              location: row.location,
              description: row.description,
              status: row.status,
            });
          }
        },
      });
      setRows([]);
    } catch {
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Inventory</span>
        <span>/</span>
        <span>Bulk Upload</span>
      </section>

      <section className="ui-form-shell space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-lg font-semibold text-[#1f2a44]">Bulk Upload Properties</h1>
            <p className="text-sm text-[#607187]">CSV import with validation and preview.</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-2 text-sm text-[#4f6078]"
          >
            <Download className="h-4 w-4" />
            Download Template
          </button>
        </div>

        <label className="block rounded-md border border-dashed border-[#9ed5d8] bg-[#f8fcfc] p-5 text-center">
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <span className="inline-flex items-center gap-2 rounded-md bg-[#3aa4a8] px-4 py-2 text-sm text-white">
            <Upload className="h-4 w-4" />
            Upload CSV
          </span>
          <p className="mt-2 text-xs text-[#7f8a99]">Step 1: Upload file. Step 2: Review. Step 3: Confirm import.</p>
        </label>

        <div className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
          <div className="flex items-center justify-between border-b border-[#ecf1f5] px-4 py-3">
            <p className="text-sm font-medium text-[#38a0a6]">
              Preview (<span className="font-bold">{rows.length}</span>)
            </p>
            {hasErrors && <p className="text-xs font-medium text-rose-600">Resolve highlighted errors before import.</p>}
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="min-w-full text-left text-sm text-[#4f6078]">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
                <tr>
                  <th className="px-3 py-2">Project</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Validation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={`${row.unitNumber}-${idx}`} className="border-t border-[#ecf1f5]">
                    <td className="px-3 py-2">{row.projectName}</td>
                    <td className="px-3 py-2">{row.unitNumber}</td>
                    <td className="px-3 py-2">{row.propertyType}</td>
                    <td className="px-3 py-2">{row.price.toLocaleString()} QAR</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className={`px-3 py-2 text-xs ${row.error ? "text-rose-600" : "text-emerald-700"}`}>
                      {row.error ?? "Valid"}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr className="border-t border-[#ecf1f5]">
                    <td className="px-3 py-4 text-[#7f8a99]" colSpan={6}>
                      No rows uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="ui-btn-secondary" onClick={() => setRows([])}>
            Reset
          </button>
          <button
            type="button"
            className="ui-btn-primary disabled:opacity-60"
            disabled={!rows.length || hasErrors || uploading}
            onClick={importRows}
          >
            {uploading ? "Importing..." : "Confirm Import"}
          </button>
        </div>
      </section>
    </div>
  );
}
