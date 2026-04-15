"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Eye, EyeOff, Globe, KeyRound, Mail } from "lucide-react";
import { useAppContext } from "@/components/state/app-context";
import { useRefreshAuthSession } from "@/hooks/use-auth-session";
import { getErrorMessage, runWithToast } from "@/lib/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppContext();
  const refreshSession = useRefreshAuthSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const result = await runWithToast({
        loading: "Signing you in...",
        success: "Login successful.",
        action: () => login(identifier, password),
      });

      if (!result.ok) throw new Error(result.error);

      await refreshSession();
      if (result.workspaceRole === "developer") router.replace("/portal");
      else if (result.workspaceRole === "broker") router.replace("/broker");
      else if (result.role === "broker_agent") router.replace("/agent");
      else router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-5 py-8 text-[#1f2a44] md:px-8">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex items-center justify-between">
          <button className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm font-semibold text-[#36434f]">
            <Globe className="h-4 w-4 text-[#3aa4a8]" /> ENG
          </button>
          <div className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md border border-[#cfe3e5] bg-[#e9f6f7] text-[#2fa5a6]">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-[0.12em] text-[#36434f]">YOUFIRST</span>
          </div>
          <span className="w-[72px]" />
        </header>

        <main className="mt-10 grid items-center gap-10 lg:grid-cols-[430px_1fr]">
          <section className="rounded-md border border-[#dbe4eb] bg-white p-7 shadow-[0_10px_28px_rgba(31,42,68,0.06)]">
            <h1 className="text-3xl font-bold text-[#171f39]">Log In</h1>
            <p className="mt-1 text-sm text-[#6e7e91]">
              Sign in with your official email or company ID and continue to your workspace.
            </p>

            <label className="mt-5 block text-sm font-medium text-[#7f8a99]">
              Email or Company ID
              <div className="mt-2 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-3 focus-within:border-[#3aa4a8]">
                <Mail className="h-4 w-4 text-[#7f8a99]" />
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  type="text"
                  className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                  placeholder="you@company.com or DEV-2026-0001"
                />
              </div>
            </label>

            <label className="mt-4 block text-sm font-medium text-[#7f8a99]">
              Password
              <div className="mt-2 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-3 focus-within:border-[#3aa4a8]">
                <KeyRound className="h-4 w-4 text-[#7f8a99]" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-[#7bbbc0]">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <div className="mt-3 flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm font-semibold text-[#2e979d] underline underline-offset-2">
                Forgot Password?
              </Link>
            </div>

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1f7d79] px-4 py-3 text-sm font-semibold text-white hover:bg-[#186b67] disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Log In"} <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-4 text-center text-sm text-[#718197]">
              New company?{" "}
              <Link href="/signup" className="font-semibold text-[#2e979d] underline underline-offset-2">
                Create account
              </Link>
            </p>
          </section>

          <section className="max-w-2xl">
            <h2 className="text-4xl font-semibold leading-tight text-[#171f39]">Unified Developer and Broker Access</h2>
            <p className="mt-4 text-lg font-medium text-[#1f2a44]">
              One secure entry point for Developer Companies, Broker Companies, and future agent operations.
            </p>
            <p className="mt-6 text-base leading-8 text-[#3b4962]">
              Your login automatically routes to the correct workspace based on account role. Use official email or
              company ID, manage agreements and inventory visibility, and keep every operation traceable through logs
              and approvals.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
