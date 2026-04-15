"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Copy, FileBadge2, Globe, Lock, Mail, MapPin, Phone, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppContext } from "@/components/state/app-context";
import { useRefreshAuthSession } from "@/hooks/use-auth-session";
import { getErrorMessage, runWithToast } from "@/lib/ui/toast";

const accountOptions = [
  {
    id: "developer" as const,
    label: "Developer Company",
    note: "Register as property developer company",
  },
  {
    id: "broker" as const,
    label: "Broker Company",
    note: "Register as broker company",
  },
];

type SignupFormState = {
  companyName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  password: string;
  confirmPassword: string;
  registrationNumber: string;
};

const initialForm: SignupFormState = {
  companyName: "",
  email: "",
  phone: "",
  country: "Qatar",
  city: "Doha",
  password: "",
  confirmPassword: "",
  registrationNumber: "",
};

function getPasswordStrength(password: string) {
  const checks = [/[a-z]/, /[A-Z]/, /[0-9]/, /.{8,}/].filter((rule) => rule.test(password)).length;
  if (checks <= 1) return { label: "Weak", color: "bg-rose-500", width: "w-1/4" };
  if (checks <= 3) return { label: "Medium", color: "bg-amber-500", width: "w-2/4" };
  return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
}

export default function SignupPage() {
  const router = useRouter();
  const { signupCompany, login } = useAppContext();
  const refreshSession = useRefreshAuthSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<"developer" | "broker">("developer");
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SignupFormState>(initialForm);
  const [createdCompanyId, setCreatedCompanyId] = useState("");

  const previewId = useMemo(() => {
    const year = new Date().getFullYear();
    return `${accountType === "developer" ? "DEV" : "BRK"}-${year}-XXXX`;
  }, [accountType]);

  const passwordStrength = getPasswordStrength(form.password);

  const validateForm = () => {
    if (
      !form.companyName ||
      !form.email ||
      !form.phone ||
      !form.country ||
      !form.city ||
      !form.password ||
      !form.confirmPassword ||
      !form.registrationNumber
    ) {
      return "Fill all required fields.";
    }

    if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password) || form.password.length < 8) {
      return "Password must include uppercase, lowercase, number, and minimum 8 characters.";
    }

    if (form.password !== form.confirmPassword) {
      return "Password and Confirm Password do not match.";
    }

    return null;
  };

  const submit = async () => {
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const result = await runWithToast({
        loading: "Creating your account...",
        success: "Account created successfully.",
        action: () =>
          signupCompany({
            accountType,
            companyName: form.companyName,
            email: form.email,
            phone: form.phone,
            country: form.country,
            city: form.city,
            password: form.password,
            registrationNumber: form.registrationNumber,
            logoFile,
          }),
      });

      if (!result.ok) throw new Error(result.error);
      setCreatedCompanyId(result.id);
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err, "Signup failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const goToDashboard = async () => {
    const loginResult = await login(form.email, form.password);
    if (!loginResult.ok) {
      toast.error(loginResult.error);
      return;
    }
    await refreshSession();
    if (loginResult.workspaceRole === "developer") router.replace("/portal");
    else router.replace("/broker");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-5 py-4 text-[#1f2a44] md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1180px] flex-col justify-center">
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

        <main className="mt-5 grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-md border border-[#dbe4eb] bg-white p-5 shadow-[0_10px_28px_rgba(31,42,68,0.06)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#171f39]">Create Account</h1>
                <p className="mt-1 text-sm text-[#6e7e91]">
                  {step === 1 && "Select your account type to begin onboarding."}
                  {step === 2 && "Enter official company details to activate your workspace."}
                  {step === 3 && "Your account is active and ready."}
                </p>
              </div>
              <div className="rounded-md border border-[#cde6e6] bg-[#eff9f9] px-3 py-2">
                <p className="text-[11px] text-[#5e7b89]">Generated ID</p>
                <p className="mt-0.5 text-sm font-bold text-[#1f2a44]">{createdCompanyId || previewId}</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className={`h-1 rounded-full ${step >= 1 ? "bg-[#3aa4a8]" : "bg-[#dbe4eb]"}`} />
              <div className={`h-1 rounded-full ${step >= 2 ? "bg-[#3aa4a8]" : "bg-[#dbe4eb]"}`} />
              <div className={`h-1 rounded-full ${step >= 3 ? "bg-[#3aa4a8]" : "bg-[#dbe4eb]"}`} />
            </div>

            {step === 1 && (
              <div className="grid grid-cols-2 gap-2">
                {accountOptions.map((option) => {
                  const active = option.id === accountType;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAccountType(option.id)}
                      className={`w-full rounded-md border px-3 py-3 text-left text-sm ${
                        active
                          ? "border-[#3aa4a8] bg-[#eaf8f8] text-[#1f2a44]"
                          : "border-[#dbe4eb] bg-white text-[#6f7e90]"
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="mt-1 text-xs">{option.note}</p>
                    </button>
                  );
                })}
                <div className="col-span-2 mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1f7d79] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#186b67]"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <form className="grid grid-cols-2 gap-3" onSubmit={(e) => e.preventDefault()}>
                <label className="block text-sm font-medium text-[#7f8a99]">
                  Company Name
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                    <Building2 className="h-4 w-4 text-[#7f8a99]" />
                    <input
                      value={form.companyName}
                      onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                      className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                      placeholder="Company name"
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-[#7f8a99]">
                  Official Email
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                    <Mail className="h-4 w-4 text-[#7f8a99]" />
                    <input
                      value={form.email}
                      type="email"
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                      placeholder="you@company.com"
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-[#7f8a99]">
                  Phone Number
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                    <Phone className="h-4 w-4 text-[#7f8a99]" />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                      placeholder="+974..."
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-[#7f8a99]">
                  Registration Number
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                    <FileBadge2 className="h-4 w-4 text-[#7f8a99]" />
                    <input
                      value={form.registrationNumber}
                      onChange={(e) => setForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                      className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                      placeholder="Company registration number"
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-[#7f8a99]">
                  Country
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                    <MapPin className="h-4 w-4 text-[#7f8a99]" />
                    <input
                      value={form.country}
                      onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                      placeholder="Country"
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-[#7f8a99]">
                  City
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                    <MapPin className="h-4 w-4 text-[#7f8a99]" />
                    <input
                      value={form.city}
                      onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                      placeholder="City"
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-[#7f8a99]">
                  Password
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                    <Lock className="h-4 w-4 text-[#7f8a99]" />
                    <input
                      value={form.password}
                      type="password"
                      onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[#e6eef4]">
                    <div className={`h-1.5 rounded-full ${passwordStrength.color} ${passwordStrength.width}`} />
                  </div>
                  <p className="mt-1 text-xs text-[#6e7e91]">Strength: {passwordStrength.label}</p>
                </label>

                <label className="block text-sm font-medium text-[#7f8a99]">
                  Confirm Password
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-3 py-2.5">
                    <Lock className="h-4 w-4 text-[#7f8a99]" />
                    <input
                      value={form.confirmPassword}
                      type="password"
                      onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                      placeholder="Confirm password"
                    />
                  </div>
                </label>

                <label className="col-span-2 block text-sm font-medium text-[#7f8a99]">
                  Company Logo (Optional)
                  <div className="mt-1 rounded-md border border-dashed border-[#c7d5e2] bg-[#f9fbfc] px-3 py-2.5 text-sm text-[#6f7e90]">
                    <label className="flex cursor-pointer items-center gap-2">
                      <Upload className="h-4 w-4 text-[#3aa4a8]" />
                      {logoFile ? logoFile.name : "Select logo file"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </label>

                {error && <p className="col-span-2 text-sm text-rose-600">{error}</p>}

                <div className="col-span-2 flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-md border border-[#dbe4eb] px-4 py-2 text-sm text-[#607187]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1f7d79] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#186b67] disabled:opacity-60"
                  >
                    {submitting ? "Creating..." : "Create Account"} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="rounded-md border border-[#cbe8d8] bg-[#f4fbf7] p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div className="w-full">
                    <p className="text-lg font-semibold text-[#143127]">Account created successfully</p>
                    <p className="mt-1 text-sm text-[#2b4a3f]">Your company is auto-approved and active.</p>
                    <div className="mt-3 flex items-center justify-between rounded-md border border-[#d7ece2] bg-white px-3 py-2">
                      <div>
                        <p className="text-xs text-[#637a70]">Your Company ID</p>
                        <p className="text-sm font-bold text-[#1f2a44]">{createdCompanyId}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(createdCompanyId);
                          toast.success("Company ID copied.");
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-white px-2 py-1 text-xs font-semibold text-[#516174]"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Link href="/login" className="rounded-md border border-[#dbe4eb] px-4 py-2 text-sm text-[#607187]">
                        Back to Login
                      </Link>
                      <button
                        type="button"
                        onClick={goToDashboard}
                        className="inline-flex items-center gap-2 rounded-md bg-[#1f7d79] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#186b67]"
                      >
                        Go to Dashboard <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="max-w-xl pt-2">
            <h2 className="text-3xl font-semibold leading-tight text-[#171f39]">Enterprise Onboarding for Property Networks</h2>
            <p className="mt-4 text-base font-medium text-[#1f2a44]">
              Register your company, receive a unique ID, and launch developer-broker collaboration in one flow.
            </p>
            <p className="mt-5 text-sm leading-7 text-[#3b4962]">
              This onboarding is designed for production expansion: role-aware routing, approval-ready lifecycle,
              unique company identity, and future security layers including OTP and advanced verification.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
