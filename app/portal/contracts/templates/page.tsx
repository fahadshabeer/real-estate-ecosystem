"use client";

import { FancySelect } from "@/components/ui/fancy-select";
import { useState } from "react";
import { House, Plus } from "lucide-react";
import { runWithToast } from "@/lib/ui/toast";

type AgreementTemplate = {
  id: string;
  name: string;
  agreementType: "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited";
  commissionRules: string;
  legalClauses: string;
  defaultProjectScope: string;
  updatedAt: string;
};

const seedTemplates: AgreementTemplate[] = [
  {
    id: "tpl-standard-non-exclusive",
    name: "Standard Non-Exclusive",
    agreementType: "Non-Exclusive" as const,
    commissionRules: "2.5%",
    legalClauses: "Standard cancellation and resale restrictions apply.",
    defaultProjectScope: "All shared units under mapped agreement scope",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl-premium-broker",
    name: "Premium Broker Agreement",
    agreementType: "Priority Access" as const,
    commissionRules: "3.0%",
    legalClauses: "Priority inventory release and accelerated settlement terms apply.",
    defaultProjectScope: "Priority towers and premium inventory only",
    updatedAt: new Date().toISOString(),
  },
];

export default function AgreementTemplatesPage() {
  const [templates, setTemplates] = useState<AgreementTemplate[]>(seedTemplates);
  const [form, setForm] = useState({
    name: "",
    agreementType: "Non-Exclusive" as "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited",
    commissionRules: "",
    legalClauses: "",
    defaultProjectScope: "",
  });

  return (
    <div className="space-y-5 pb-6">
      <section className="flex items-center gap-2 text-sm text-[#7f8a99]">
        <House className="h-3.5 w-3.5" />
        <span>/</span>
        <span>Agreements</span>
        <span>/</span>
        <span>Agreement Templates</span>
      </section>

      <section className="ui-form-shell space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#1f2a44]">Create Template</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="ui-label">
            Template Name
            <input className="ui-input" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label className="ui-label">
            Agreement Type
            <FancySelect
              className="ui-select"
              value={form.agreementType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  agreementType: event.target.value as typeof prev.agreementType,
                }))
              }
            >
              <option>Exclusive</option>
              <option>Non-Exclusive</option>
              <option>Priority Access</option>
              <option>Project Limited</option>
            </FancySelect>
          </label>
          <label className="ui-label">
            Commission Rules
            <input className="ui-input" value={form.commissionRules} onChange={(event) => setForm((prev) => ({ ...prev, commissionRules: event.target.value }))} />
          </label>
          <label className="ui-label">
            Default Project Scope
            <input className="ui-input" value={form.defaultProjectScope} onChange={(event) => setForm((prev) => ({ ...prev, defaultProjectScope: event.target.value }))} />
          </label>
          <label className="ui-label sm:col-span-2">
            Legal Clauses
            <textarea className="ui-textarea" value={form.legalClauses} onChange={(event) => setForm((prev) => ({ ...prev, legalClauses: event.target.value }))} />
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="ui-btn-primary"
            onClick={async () => {
              try {
                await runWithToast({
                  loading: "Saving template...",
                  success: "Template saved.",
                  action: async () => {
                    setTemplates((prev) => [
                      {
                        id: `tpl-custom-${Date.now()}`,
                        name: form.name,
                        agreementType: form.agreementType,
                        commissionRules: form.commissionRules,
                        legalClauses: form.legalClauses,
                        defaultProjectScope: form.defaultProjectScope,
                        updatedAt: new Date().toISOString(),
                      },
                      ...prev,
                    ]);
                    setForm({
                      name: "",
                      agreementType: "Non-Exclusive",
                      commissionRules: "",
                      legalClauses: "",
                      defaultProjectScope: "",
                    });
                  },
                });
              } catch {}
            }}
          >
            <Plus className="mr-2 inline-block h-4 w-4" />
            Save Template
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#ecf1f5] px-6 py-4">
          <p className="text-[16px] font-medium text-[#38a0a6]">
            Total(<span className="font-bold">{templates.length}</span>)
          </p>
        </div>
        <div className="min-h-[360px] overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#4f6078]">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#7f8a99]">
              <tr>
                <th className="px-4 py-3">Template Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Project Scope</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-t border-[#ecf1f5]">
                  <td className="px-4 py-3 font-medium text-[#1f2a44]">{template.name}</td>
                  <td className="px-4 py-3">{template.agreementType}</td>
                  <td className="px-4 py-3">{template.commissionRules}</td>
                  <td className="px-4 py-3">{template.defaultProjectScope}</td>
                  <td className="px-4 py-3">{new Date(template.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
