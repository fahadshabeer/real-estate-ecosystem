"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/backend/firebase/api-url";

type VerifyState =
  | { loading: true; valid: false; message: string }
  | { loading: false; valid: boolean; message: string; metadata?: Record<string, string | null> };

export default function ContractVerifyPage() {
  const params = useParams<{ documentId: string }>();
  const search = useSearchParams();
  const token = search.get("token");
  const documentId = params.documentId;
  const [state, setState] = useState<VerifyState>({
    loading: true,
    valid: false,
    message: "Verifying contract...",
  });

  useEffect(() => {
    async function run() {
      if (!documentId || !token) {
        setState({ loading: false, valid: false, message: "Missing verification token or document ID." });
        return;
      }

      const response = await fetch(
        apiUrl(`/api/contracts/pdf/${encodeURIComponent(documentId)}/verify?token=${encodeURIComponent(token)}`),
      );
      const body = (await response.json().catch(() => null)) as
        | {
            ok: boolean;
            valid: boolean;
            error?: string;
            contractId?: string;
            agreementId?: string;
            developerId?: string;
            brokerId?: string;
            createdAt?: string | null;
          }
        | null;

      if (!response.ok || !body) {
        setState({ loading: false, valid: false, message: "Unable to verify document right now." });
        return;
      }

      if (!body.valid) {
        setState({
          loading: false,
          valid: false,
          message: body.error ?? "Document verification failed.",
        });
        return;
      }

      setState({
        loading: false,
        valid: true,
        message: "Document is valid and verified.",
        metadata: {
          contractId: body.contractId ?? null,
          agreementId: body.agreementId ?? null,
          developerId: body.developerId ?? null,
          brokerId: body.brokerId ?? null,
          createdAt: body.createdAt ?? null,
        },
      });
    }

    run();
  }, [documentId, token]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-2xl border border-slate-500/30 bg-slate-950/70 p-6 text-slate-100 shadow-2xl">
        <h1 className="font-display text-2xl font-semibold">Contract Verification</h1>
        <p className={`mt-3 text-sm ${state.valid ? "text-emerald-300" : "text-rose-300"}`}>
          {state.loading ? "Verifying..." : state.message}
        </p>

        {!state.loading && state.metadata && (
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            {Object.entries(state.metadata).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-slate-500/25 bg-slate-900/60 p-3">
                <dt className="text-xs uppercase tracking-wide text-slate-400">{key}</dt>
                <dd className="mt-1 text-slate-100">{value || "-"}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </main>
  );
}
