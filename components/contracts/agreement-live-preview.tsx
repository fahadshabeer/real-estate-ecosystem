"use client";

import { QrCode, ShieldCheck } from "lucide-react";

type AgreementPreviewProps = {
  contractIdPreview: string;
  developerId: string;
  brokerId: string;
  agreementTitle: string;
  agreementType: "Exclusive" | "Non-Exclusive" | "Priority Access" | "Project Limited";
  validityStart: string;
  validityEnd: string;
  selectedProjectsCsv: string;
  projectScope: string;
  commissionRules: string;
  paymentTrigger: string;
  bonusConditions: string;
  legalClauses: string;
};

const previewRows = [
  { code: "PR-LH-A-1204", project: "Lusail Heights", unit: "A-1204", type: "2BR", price: "1.85M QAR" },
  { code: "PR-WB-B-0911", project: "West Bay Residences", unit: "B-0911", type: "3BR", price: "2.42M QAR" },
];

export function AgreementLivePreview(props: AgreementPreviewProps) {
  const {
    contractIdPreview,
    developerId,
    brokerId,
    agreementTitle,
    agreementType,
    validityStart,
    validityEnd,
    selectedProjectsCsv,
    projectScope,
    commissionRules,
    paymentTrigger,
    bonusConditions,
    legalClauses,
  } = props;

  return (
    <aside className="rounded-md border border-[#dbe4eb] bg-white p-4 shadow-[0_10px_28px_rgba(31,42,68,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#1f2a44]">Agreement PDF Live Preview</p>
        <span className="rounded-md bg-[#edf7f8] px-2 py-1 text-[11px] font-semibold text-[#2e7e98]">Legal Draft</span>
      </div>

      <div className="max-h-[78vh] space-y-3 overflow-auto pr-1">
        <section className="rounded-md border border-[#e6d8b6] bg-[#fbf8f1] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#8f7542]">PAGE 1 - COVER</p>
          <p className="mt-2 text-base font-semibold text-[#1f2a44]">{agreementTitle || "PROPERTY SALES AGREEMENT"}</p>
          <p className="mt-1 text-xs text-[#607187]">
            Contract ID: {contractIdPreview} · Effective: {validityStart || "N/A"}
          </p>
          <p className="mt-1 text-xs text-[#607187]">Developer: {developerId || "DEV-XXXX"} · Broker: {brokerId || "BRK-XXXX"}</p>
        </section>

        <section className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#607187]">PAGE 2 - PARTIES & DEFINITIONS</p>
          <p className="mt-2 text-xs text-[#4f6078]">Parties are identified by official company IDs with immutable legal references.</p>
          <p className="mt-1 text-xs text-[#4f6078]">Defined terms: Property, Agreement, Effective Date, Commission, Broker Agent.</p>
        </section>

        <section className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#607187]">PAGE 3 - SCOPE</p>
          <p className="mt-2 text-xs text-[#4f6078]">
            Type: <span className="font-semibold text-[#1f2a44]">{agreementType}</span>
          </p>
          <p className="mt-1 text-xs text-[#4f6078]">Projects: {selectedProjectsCsv || "No projects selected yet."}</p>
          <p className="mt-1 text-xs text-[#4f6078]">Scope: {projectScope || "Scope definition pending."}</p>
        </section>

        <section className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#607187]">PAGE 4 - COMMERCIAL TERMS</p>
          <p className="mt-2 text-xs text-[#4f6078]">Commission: {commissionRules || "N/A"}</p>
          <p className="mt-1 text-xs text-[#4f6078]">Payment Trigger: {paymentTrigger || "N/A"}</p>
          <p className="mt-1 text-xs text-[#4f6078]">Bonus: {bonusConditions || "N/A"}</p>
        </section>

        <section className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#607187]">PAGE 5 - PROPERTY ANNEX</p>
          <div className="mt-2 overflow-hidden rounded-md border border-[#dbe4eb]">
            <table className="min-w-full text-left text-[11px] text-[#4f6078]">
              <thead className="bg-white text-[#7f8a99]">
                <tr>
                  <th className="px-2 py-1.5">Code</th>
                  <th className="px-2 py-1.5">Project</th>
                  <th className="px-2 py-1.5">Unit</th>
                  <th className="px-2 py-1.5">Type</th>
                  <th className="px-2 py-1.5">Price</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.code} className="border-t border-[#edf2f6]">
                    <td className="px-2 py-1.5">{row.code}</td>
                    <td className="px-2 py-1.5">{row.project}</td>
                    <td className="px-2 py-1.5">{row.unit}</td>
                    <td className="px-2 py-1.5">{row.type}</td>
                    <td className="px-2 py-1.5">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#607187]">PAGES 6-7 - COMPLIANCE & LEGAL</p>
          <p className="mt-2 text-xs text-[#4f6078]">Validity: {validityStart || "N/A"} to {validityEnd || "N/A"}</p>
          <p className="mt-1 text-xs text-[#4f6078]">{legalClauses || "Qatar jurisdiction, termination, confidentiality and compliance clauses."}</p>
        </section>

        <section className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#607187]">PAGE 8 - SIGNATURES</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#4f6078]">
            <div className="rounded-md border border-[#dbe4eb] bg-white p-2">
              <p className="font-semibold text-[#1f2a44]">Developer Signature</p>
              <p className="mt-1">Name / Stamp / Date</p>
            </div>
            <div className="rounded-md border border-[#dbe4eb] bg-white p-2">
              <p className="font-semibold text-[#1f2a44]">Broker Signature</p>
              <p className="mt-1">Name / Stamp / Date</p>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#607187]">PAGE 9 - QR VERIFICATION</p>
          <div className="mt-2 flex items-center gap-3 rounded-md border border-[#dbe4eb] bg-white p-2">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-[#eef5f8] text-[#2e7e98]">
              <QrCode className="h-6 w-6" />
            </div>
            <div className="text-[11px] text-[#4f6078]">
              <p>Encoded: contract_id + developer_id + broker_id + secure_hash</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[#2e7e98]">
                <ShieldCheck className="h-3.5 w-3.5" /> Tamper verification enabled
              </p>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
