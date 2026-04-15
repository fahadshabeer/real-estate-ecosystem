function escapePdfText(input: string) {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function clampAscii(input: string) {
  return input.replace(/[^\x20-\x7E]/g, " ");
}

function widthEstimate(text: string, fontSize: number) {
  return text.length * fontSize * 0.52;
}

function splitWrappedLines(text: string, maxWidth: number, fontSize: number) {
  const normalized = clampAscii(text).replace(/\s+/g, " ").trim();
  if (!normalized) return [""];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (widthEstimate(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildPseudoQr(seedText: string, x: number, y: number, size: number) {
  const modules = 29;
  const cell = size / modules;
  const seed = hashString(seedText);
  const commands: string[] = [];

  const isFinder = (r: number, c: number) => {
    const topLeft = r < 7 && c < 7;
    const topRight = r < 7 && c > modules - 8;
    const bottomLeft = r > modules - 8 && c < 7;
    return topLeft || topRight || bottomLeft;
  };

  const finderPixel = (r: number, c: number) => {
    const rr = r % 7;
    const cc = c % 7;
    const border = rr === 0 || rr === 6 || cc === 0 || cc === 6;
    const center = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
    return border || center;
  };

  commands.push("0 0 0 rg");
  commands.push(`${x} ${y} ${size} ${size} re S`);
  for (let r = 0; r < modules; r += 1) {
    for (let c = 0; c < modules; c += 1) {
      let fill = false;
      if (isFinder(r, c)) {
        fill = finderPixel(r, c);
      } else {
        const v = (seed ^ (r * 92821) ^ (c * 68917) ^ (r * c * 31337)) >>> 0;
        fill = (v & 0b11) !== 0;
      }
      if (!fill) continue;
      const px = x + c * cell;
      const py = y + (modules - 1 - r) * cell;
      commands.push(`${px.toFixed(2)} ${py.toFixed(2)} ${cell.toFixed(2)} ${cell.toFixed(2)} re f`);
    }
  }
  return commands;
}

export function buildSimplePdf(lines: string[]) {
  let y = 790;
  const lineCommands: string[] = [];
  for (const line of lines) {
    lineCommands.push(`BT /F1 11 Tf 48 ${y} Td (${escapePdfText(line)}) Tj ET`);
    y -= 16;
  }

  const stream = lineCommands.join("\n");
  const objects: string[] = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj\n",
    `4 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

type PdfFont = "/F1" | "/F2" | "/F3" | "/F4" | "/F5";

type AnnexRow = {
  propertyCode: string;
  project: string;
  unit: string;
  type: string;
  price: string;
};

export type ContractPdfInput = {
  contractId: string;
  documentId: string;
  agreementTitle?: string;
  agreementType?: string;
  effectiveDate: string;
  developer: {
    name: string;
    id: string;
    address: string;
    email: string;
    registrationNumber?: string;
  };
  broker: {
    name: string;
    id: string;
    address: string;
    email: string;
    registrationNumber?: string;
  };
  projectsCovered?: string[];
  projectScope?: string;
  terms: string;
  commissionRules: string;
  paymentTrigger?: string;
  bonusConditions?: string;
  legalClauses?: string;
  propertySharingRights: string;
  startDate: string;
  endDate: string;
  annexRows?: AnnexRow[];
  verificationUrl: string;
  documentHash?: string;
};

const PAGE_W = 595;
const PAGE_H = 842;

function drawText(
  cmds: string[],
  text: string,
  x: number,
  y: number,
  font: PdfFont,
  size: number,
  color = "0.13 0.17 0.24 rg",
) {
  cmds.push(color);
  cmds.push(`BT ${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(clampAscii(text))}) Tj ET`);
}

function drawCenterText(
  cmds: string[],
  text: string,
  y: number,
  font: PdfFont,
  size: number,
  color = "0.13 0.17 0.24 rg",
) {
  const safe = clampAscii(text);
  const x = (PAGE_W - widthEstimate(safe, size)) / 2;
  drawText(cmds, safe, x, y, font, size, color);
}

function drawWrappedText(
  cmds: string[],
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  font: PdfFont,
  size: number,
  lineHeight: number,
  color = "0.23 0.27 0.33 rg",
) {
  let y = startY;
  for (const line of splitWrappedLines(text, maxWidth, size)) {
    drawText(cmds, line, x, y, font, size, color);
    y -= lineHeight;
  }
  return y;
}

function drawPageChrome(cmds: string[], input: ContractPdfInput, pageNumber: number, totalPages: number, title: string) {
  cmds.push("0.97 0.96 0.94 rg");
  cmds.push(`0 0 ${PAGE_W} ${PAGE_H} re f`);

  cmds.push("0.78 0.66 0.42 RG 1.4 w");
  cmds.push("18 18 559 806 re S");
  cmds.push("0.86 0.78 0.58 RG 0.7 w");
  cmds.push("26 26 543 790 re S");

  cmds.push("0.92 0.90 0.86 rg");
  for (let i = 0; i < 12; i += 1) {
    const y = 54 + i * 60;
    cmds.push(`31 ${y} 533 0.8 re f`);
  }

  drawText(cmds, input.developer.name.toUpperCase(), 42, 790, "/F3", 9, "0.64 0.50 0.24 rg");
  drawText(cmds, input.broker.name.toUpperCase(), 406, 790, "/F3", 9, "0.20 0.30 0.50 rg");
  drawCenterText(cmds, title, 790, "/F3", 12, "0.14 0.18 0.26 rg");

  cmds.push("0.83 0.74 0.56 RG 0.8 w");
  cmds.push("40 774 m 555 774 l S");

  drawText(cmds, `Contract ID: ${input.contractId}`, 42, 34, "/F2", 8, "0.34 0.34 0.34 rg");
  drawCenterText(cmds, `Page ${pageNumber} of ${totalPages}`, 34, "/F1", 8, "0.34 0.34 0.34 rg");
  drawText(cmds, `Doc Hash: ${(input.documentHash ?? "").slice(0, 24) || "N/A"}`, 360, 34, "/F5", 7, "0.34 0.34 0.34 rg");

  cmds.push("0.83 0.74 0.56 RG 0.8 w");
  cmds.push("40 48 m 555 48 l S");
}

function buildCoverPage(input: ContractPdfInput, pageNumber: number, totalPages: number) {
  const cmds: string[] = [];
  drawPageChrome(cmds, input, pageNumber, totalPages, "CONTRACT AGREEMENT");

  drawCenterText(
    cmds,
    (input.agreementTitle || "PROPERTY SALES AGREEMENT").toUpperCase(),
    698,
    "/F3",
    28,
    "0.12 0.16 0.24 rg",
  );
  drawCenterText(cmds, `Contract ID: ${input.contractId}`, 664, "/F3", 14);
  drawCenterText(cmds, `Issue Date: ${input.effectiveDate}`, 642, "/F4", 12, "0.28 0.31 0.38 rg");
  drawCenterText(cmds, `Effective Date: ${input.startDate}  |  Expiry Date: ${input.endDate}`, 624, "/F4", 11, "0.28 0.31 0.38 rg");

  cmds.push("0.82 0.85 0.90 rg");
  drawText(cmds, "DEVELOPER", 70, 415, "/F2", 44, "0.82 0.85 0.90 rg");
  drawText(cmds, "BROKER", 382, 415, "/F2", 44, "0.84 0.87 0.92 rg");

  cmds.push("0.99 0.99 0.99 rg");
  cmds.push("70 460 455 128 re f");
  cmds.push("0.84 0.74 0.54 RG 0.8 w");
  cmds.push("70 460 455 128 re S");

  drawText(cmds, "Developer Company", 86, 562, "/F3", 12);
  drawText(cmds, input.developer.name, 86, 542, "/F1", 11);
  drawText(cmds, input.developer.id, 86, 525, "/F1", 10, "0.35 0.40 0.49 rg");

  drawText(cmds, "Broker Company", 330, 562, "/F3", 12);
  drawText(cmds, input.broker.name, 330, 542, "/F1", 11);
  drawText(cmds, input.broker.id, 330, 525, "/F1", 10, "0.35 0.40 0.49 rg");

  drawText(cmds, `Agreement Type: ${input.agreementType ?? "Non-Exclusive"}`, 86, 500, "/F1", 10);
  drawText(cmds, `Projects Covered: ${(input.projectsCovered ?? []).join(", ") || "As listed in annex"}`, 86, 482, "/F1", 10);

  drawCenterText(cmds, "CONFIDENTIAL & LEGALLY BINDING DOCUMENT", 76, "/F2", 9, "0.66 0.54 0.28 rg");
  return cmds;
}

function buildPartiesDefinitionsPage(input: ContractPdfInput, pageNumber: number, totalPages: number) {
  const cmds: string[] = [];
  drawPageChrome(cmds, input, pageNumber, totalPages, "PARTIES & DEFINITIONS");

  drawText(cmds, "1. Parties", 52, 742, "/F3", 14);
  drawText(cmds, "Developer Company", 52, 716, "/F2", 11, "0.18 0.24 0.36 rg");
  drawWrappedText(
    cmds,
    `${input.developer.name} (${input.developer.id}) | Reg: ${input.developer.registrationNumber ?? "N/A"} | Address: ${input.developer.address} | Email: ${input.developer.email}`,
    52,
    698,
    490,
    "/F1",
    10,
    15,
  );

  drawText(cmds, "Broker Company", 52, 650, "/F2", 11, "0.18 0.24 0.36 rg");
  drawWrappedText(
    cmds,
    `${input.broker.name} (${input.broker.id}) | Reg: ${input.broker.registrationNumber ?? "N/A"} | Address: ${input.broker.address} | Email: ${input.broker.email}`,
    52,
    632,
    490,
    "/F1",
    10,
    15,
  );

  drawText(cmds, "2. Definitions", 52, 580, "/F3", 14);
  const definitions = [
    '"Property" means any inventory unit shared under this agreement.',
    '"Agreement" means this legal sales collaboration contract.',
    '"Effective Date" means the start date stated in this document.',
    '"Commission" means broker compensation governed by commercial terms.',
    '"Broker Agent" means broker internal user assigned to a property.',
  ];
  let y = 556;
  for (const item of definitions) {
    drawText(cmds, "-", 58, y, "/F2", 10, "0.24 0.28 0.36 rg");
    y = drawWrappedText(cmds, item, 70, y, 472, "/F1", 10, 15);
    y -= 2;
  }

  return cmds;
}

function buildScopePage(input: ContractPdfInput, pageNumber: number, totalPages: number) {
  const cmds: string[] = [];
  drawPageChrome(cmds, input, pageNumber, totalPages, "SCOPE OF AGREEMENT");

  drawText(cmds, "3. Agreement Scope", 52, 742, "/F3", 14);
  drawText(cmds, `Agreement Type: ${input.agreementType ?? "Non-Exclusive"}`, 52, 718, "/F1", 11);

  drawText(cmds, "Projects Covered", 52, 686, "/F2", 11, "0.18 0.24 0.36 rg");
  const projects = input.projectsCovered?.length ? input.projectsCovered : ["As approved by both parties in annex mappings."];
  let y = 666;
  for (const project of projects) {
    drawText(cmds, "-", 58, y, "/F2", 10, "0.24 0.28 0.36 rg");
    y = drawWrappedText(cmds, project, 70, y, 472, "/F1", 10, 15);
    y -= 2;
  }

  drawText(cmds, "Project Scope", 52, 610, "/F2", 11, "0.18 0.24 0.36 rg");
  y = drawWrappedText(
    cmds,
    input.projectScope ||
      "This agreement grants controlled visibility rights only. Ownership is not transferred and sales rights remain subject to developer approval.",
    52,
    590,
    490,
    "/F1",
    10,
    15,
  );

  drawText(cmds, "Property Sharing Rights", 52, y - 20, "/F2", 11, "0.18 0.24 0.36 rg");
  drawWrappedText(cmds, input.propertySharingRights, 52, y - 40, 490, "/F1", 10, 15);

  return cmds;
}

function buildCommercialPage(input: ContractPdfInput, pageNumber: number, totalPages: number) {
  const cmds: string[] = [];
  drawPageChrome(cmds, input, pageNumber, totalPages, "COMMERCIAL TERMS");

  drawText(cmds, "4. Commercial Terms", 52, 742, "/F3", 14);
  drawText(cmds, "Commission Structure", 52, 714, "/F2", 11, "0.18 0.24 0.36 rg");
  let y = drawWrappedText(cmds, input.commissionRules, 52, 694, 490, "/F1", 10, 15);

  drawText(cmds, "Payment Trigger", 52, y - 18, "/F2", 11, "0.18 0.24 0.36 rg");
  y = drawWrappedText(cmds, input.paymentTrigger || "Upon buyer first installment confirmation.", 52, y - 38, 490, "/F1", 10, 15);

  drawText(cmds, "Bonus Conditions", 52, y - 18, "/F2", 11, "0.18 0.24 0.36 rg");
  y = drawWrappedText(cmds, input.bonusConditions || "As mutually agreed in writing.", 52, y - 38, 490, "/F1", 10, 15);

  drawText(cmds, "Agreement Duration", 52, y - 18, "/F2", 11, "0.18 0.24 0.36 rg");
  drawText(cmds, `Start Date: ${input.startDate}`, 52, y - 40, "/F1", 10);
  drawText(cmds, `End Date: ${input.endDate}`, 52, y - 56, "/F1", 10);

  return cmds;
}

function buildAnnexPage(
  input: ContractPdfInput,
  rows: AnnexRow[],
  pageNumber: number,
  totalPages: number,
  chunkIndex: number,
  chunkCount: number,
) {
  const cmds: string[] = [];
  drawPageChrome(
    cmds,
    input,
    pageNumber,
    totalPages,
    `PROPERTY ANNEX${chunkCount > 1 ? ` (${chunkIndex + 1}/${chunkCount})` : ""}`,
  );

  drawText(cmds, "5. Property Annex", 52, 742, "/F3", 14);

  cmds.push("0.95 0.97 0.99 rg");
  cmds.push("52 706 491 24 re f");
  cmds.push("0.83 0.88 0.92 RG 0.8 w");
  cmds.push("52 706 491 24 re S");

  const columns = [
    { title: "Property Code", x: 56 },
    { title: "Project", x: 150 },
    { title: "Unit", x: 300 },
    { title: "Type", x: 370 },
    { title: "Price", x: 450 },
  ];
  for (const col of columns) {
    drawText(cmds, col.title, col.x, 714, "/F2", 9, "0.28 0.33 0.41 rg");
  }

  let y = 694;
  for (const row of rows) {
    cmds.push("0.89 0.92 0.95 RG 0.5 w");
    cmds.push(`52 ${y - 4} 491 20 re S`);
    drawText(cmds, row.propertyCode, 56, y, "/F1", 9);
    drawText(cmds, row.project, 150, y, "/F1", 9);
    drawText(cmds, row.unit, 300, y, "/F1", 9);
    drawText(cmds, row.type, 370, y, "/F1", 9);
    drawText(cmds, row.price, 450, y, "/F1", 9);
    y -= 22;
  }

  if (rows.length === 0) {
    drawText(cmds, "No mapped properties yet under this agreement.", 56, 680, "/F1", 10, "0.41 0.46 0.55 rg");
  }

  return cmds;
}

function buildCompliancePage(input: ContractPdfInput, pageNumber: number, totalPages: number) {
  const cmds: string[] = [];
  drawPageChrome(cmds, input, pageNumber, totalPages, "OBLIGATIONS & COMPLIANCE");

  drawText(cmds, "6. Obligations & Compliance", 52, 742, "/F3", 14);

  drawText(cmds, "Developer Obligations", 52, 712, "/F2", 11, "0.18 0.24 0.36 rg");
  let y = drawWrappedText(
    cmds,
    "Developer shall provide accurate inventory, maintain legal project documentation, and process broker sales approvals in accordance with agreement terms.",
    52,
    692,
    490,
    "/F1",
    10,
    15,
  );

  drawText(cmds, "Broker Obligations", 52, y - 18, "/F2", 11, "0.18 0.24 0.36 rg");
  y = drawWrappedText(
    cmds,
    "Broker shall market only authorized properties, avoid any price misrepresentation, and submit complete sales documentation for approval.",
    52,
    y - 38,
    490,
    "/F1",
    10,
    15,
  );

  drawText(cmds, "Compliance Statement", 52, y - 18, "/F2", 11, "0.18 0.24 0.36 rg");
  drawWrappedText(
    cmds,
    "This agreement shall comply with applicable laws and regulations of the State of Qatar.",
    52,
    y - 38,
    490,
    "/F1",
    10,
    15,
  );

  return cmds;
}

function buildLegalPage(input: ContractPdfInput, pageNumber: number, totalPages: number) {
  const cmds: string[] = [];
  drawPageChrome(cmds, input, pageNumber, totalPages, "TERMINATION & LEGAL CLAUSES");

  drawText(cmds, "7. Termination & Legal Clauses", 52, 742, "/F3", 14);
  let y = drawWrappedText(
    cmds,
    input.legalClauses ||
      "Either party may terminate this agreement upon material breach, expiry, or mutual written consent. Disputes shall be resolved under Qatar jurisdiction. Confidentiality obligations survive termination.",
    52,
    712,
    490,
    "/F1",
    10,
    15,
  );

  drawText(cmds, "Dispute Resolution", 52, y - 20, "/F2", 11, "0.18 0.24 0.36 rg");
  y = drawWrappedText(
    cmds,
    "Any dispute arising from this agreement shall be handled through lawful processes in the competent courts of Qatar.",
    52,
    y - 40,
    490,
    "/F1",
    10,
    15,
  );

  drawText(cmds, "Confidentiality", 52, y - 20, "/F2", 11, "0.18 0.24 0.36 rg");
  drawWrappedText(
    cmds,
    "All contractual and commercial information exchanged under this agreement is confidential and shall not be disclosed without written consent.",
    52,
    y - 40,
    490,
    "/F1",
    10,
    15,
  );

  return cmds;
}

function buildSignaturePage(input: ContractPdfInput, pageNumber: number, totalPages: number) {
  const cmds: string[] = [];
  drawPageChrome(cmds, input, pageNumber, totalPages, "SIGNATURES");

  drawText(cmds, "8. Signature Authorization", 52, 742, "/F3", 14);

  cmds.push("0.99 0.99 0.99 rg");
  cmds.push("52 470 231 220 re f");
  cmds.push("312 470 231 220 re f");
  cmds.push("0.84 0.88 0.92 RG 0.8 w");
  cmds.push("52 470 231 220 re S");
  cmds.push("312 470 231 220 re S");

  drawText(cmds, "Developer Company", 66, 668, "/F2", 11);
  drawText(cmds, input.developer.name, 66, 650, "/F1", 10);
  drawText(cmds, `ID: ${input.developer.id}`, 66, 634, "/F1", 10, "0.35 0.40 0.49 rg");
  drawText(cmds, "Authorized Signatory", 66, 594, "/F1", 10);
  cmds.push("0.24 0.24 0.24 RG 1 w");
  cmds.push("66 560 m 250 560 l S");
  drawText(cmds, "Signature / Stamp", 66, 544, "/F4", 10, "0.35 0.40 0.49 rg");
  drawText(cmds, `Date: ${input.effectiveDate}`, 66, 520, "/F1", 10);

  drawText(cmds, "Broker Company", 326, 668, "/F2", 11);
  drawText(cmds, input.broker.name, 326, 650, "/F1", 10);
  drawText(cmds, `ID: ${input.broker.id}`, 326, 634, "/F1", 10, "0.35 0.40 0.49 rg");
  drawText(cmds, "Authorized Signatory", 326, 594, "/F1", 10);
  cmds.push("0.24 0.24 0.24 RG 1 w");
  cmds.push("326 560 m 510 560 l S");
  drawText(cmds, "Signature / Stamp", 326, 544, "/F4", 10, "0.35 0.40 0.49 rg");
  drawText(cmds, `Date: ${input.effectiveDate}`, 326, 520, "/F1", 10);

  drawCenterText(cmds, "CONFIDENTIAL AGREEMENT | This is a legally binding contract.", 90, "/F2", 9, "0.66 0.54 0.28 rg");
  return cmds;
}

function buildVerificationPage(input: ContractPdfInput, pageNumber: number, totalPages: number) {
  const cmds: string[] = [];
  drawPageChrome(cmds, input, pageNumber, totalPages, "QR VERIFICATION");

  drawText(cmds, "9. Contract Verification", 52, 742, "/F3", 14);
  drawWrappedText(
    cmds,
    "Scan the QR code below to verify authenticity of this agreement document and check current status.",
    52,
    716,
    490,
    "/F1",
    10,
    15,
  );

  const payload = [
    `contract_id=${input.contractId}`,
    `document_id=${input.documentId}`,
    `developer_id=${input.developer.id}`,
    `broker_id=${input.broker.id}`,
    `doc_hash=${input.documentHash ?? "N/A"}`,
    `verify_url=${input.verificationUrl}`,
  ].join("|");

  const qrSize = 132;
  const qrX = (PAGE_W - qrSize) / 2;
  const qrY = 430;
  cmds.push(...buildPseudoQr(payload, qrX, qrY, qrSize));
  drawCenterText(cmds, "Scan to Verify", qrY - 22, "/F4", 13);

  drawWrappedText(cmds, `Verification URL: ${input.verificationUrl}`, 52, 372, 490, "/F1", 9, 14);
  drawWrappedText(cmds, `Secure Hash: ${input.documentHash ?? "N/A"}`, 52, 344, 490, "/F5", 8, 12, "0.33 0.37 0.45 rg");

  return cmds;
}

function chunkRows<T>(rows: T[], chunkSize: number) {
  if (rows.length === 0) return [[] as T[]];
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }
  return chunks;
}

export function buildPremiumContractPdf(input: ContractPdfInput) {
  const hashSource = JSON.stringify({
    contractId: input.contractId,
    documentId: input.documentId,
    developerId: input.developer.id,
    brokerId: input.broker.id,
    startDate: input.startDate,
    endDate: input.endDate,
    verificationUrl: input.verificationUrl,
  });
  const documentHash = input.documentHash ?? `HASH-${hashString(hashSource).toString(16).padStart(8, "0").toUpperCase()}`;
  const normalizedInput: ContractPdfInput = {
    ...input,
    documentHash,
    annexRows: (input.annexRows ?? []).map((row) => ({
      propertyCode: row.propertyCode || "N/A",
      project: row.project || "N/A",
      unit: row.unit || "N/A",
      type: row.type || "N/A",
      price: row.price || "N/A",
    })),
  };

  const annexChunks = chunkRows(normalizedInput.annexRows ?? [], 24);

  const pageStreams: string[] = [];
  const totalPages = 8 + annexChunks.length;
  let pageNumber = 1;

  pageStreams.push(buildCoverPage(normalizedInput, pageNumber, totalPages).join("\n"));
  pageNumber += 1;
  pageStreams.push(buildPartiesDefinitionsPage(normalizedInput, pageNumber, totalPages).join("\n"));
  pageNumber += 1;
  pageStreams.push(buildScopePage(normalizedInput, pageNumber, totalPages).join("\n"));
  pageNumber += 1;
  pageStreams.push(buildCommercialPage(normalizedInput, pageNumber, totalPages).join("\n"));
  pageNumber += 1;

  annexChunks.forEach((rows, chunkIndex) => {
    pageStreams.push(
      buildAnnexPage(normalizedInput, rows, pageNumber, totalPages, chunkIndex, annexChunks.length).join("\n"),
    );
    pageNumber += 1;
  });

  pageStreams.push(buildCompliancePage(normalizedInput, pageNumber, totalPages).join("\n"));
  pageNumber += 1;
  pageStreams.push(buildLegalPage(normalizedInput, pageNumber, totalPages).join("\n"));
  pageNumber += 1;
  pageStreams.push(buildSignaturePage(normalizedInput, pageNumber, totalPages).join("\n"));
  pageNumber += 1;
  pageStreams.push(buildVerificationPage(normalizedInput, pageNumber, totalPages).join("\n"));

  const pageCount = pageStreams.length;
  const pageObjectStart = 3;
  const pageObjectIds = Array.from({ length: pageCount }, (_, index) => pageObjectStart + index * 2);
  const streamObjectIds = pageObjectIds.map((id) => id + 1);

  const firstFontObjectId = pageObjectStart + pageCount * 2;
  const objects: string[] = [];

  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n");
  objects.push(
    `2 0 obj << /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >> endobj\n`,
  );

  for (let i = 0; i < pageCount; i += 1) {
    const pageObjId = pageObjectIds[i];
    const streamObjId = streamObjectIds[i];
    objects.push(
      `${pageObjId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${firstFontObjectId} 0 R /F2 ${firstFontObjectId + 1} 0 R /F3 ${firstFontObjectId + 2} 0 R /F4 ${firstFontObjectId + 3} 0 R /F5 ${firstFontObjectId + 4} 0 R >> >> /Contents ${streamObjId} 0 R >> endobj\n`,
    );
    const stream = pageStreams[i];
    objects.push(
      `${streamObjId} 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj\n`,
    );
  }

  objects.push(`${firstFontObjectId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n`);
  objects.push(`${firstFontObjectId + 1} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n`);
  objects.push(`${firstFontObjectId + 2} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >> endobj\n`);
  objects.push(`${firstFontObjectId + 3} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >> endobj\n`);
  objects.push(`${firstFontObjectId + 4} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj\n`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
