"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Globe, KeyRound, Mail, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

function otpSeed() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function validatePassword(password: string) {
  return /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 8;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(60);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const startTimer = () => {
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const maskIdentifier = useMemo(() => {
    if (!identifier) return "";
    if (identifier.includes("@")) {
      const [name, domain] = identifier.split("@");
      return `${name.slice(0, 2)}***@${domain}`;
    }
    return `${identifier.slice(0, 4)}***`;
  }, [identifier]);

  const sendOtp = () => {
    setError("");
    if (!identifier.trim()) {
      setError("Enter your registered email or company ID.");
      return;
    }
    const generated = otpSeed();
    setOtpCode(generated);
    setOtp(["", "", "", "", "", ""]);
    setStep(2);
    startTimer();
    toast.success("OTP sent successfully.");
  };

  const verifyOtp = () => {
    setError("");
    const entered = otp.join("");
    if (entered.length !== 6) {
      setError("Enter a 6-digit OTP.");
      return;
    }
    if (entered !== otpCode) {
      setError("Invalid OTP. Please try again.");
      return;
    }
    setStep(3);
  };

  const resetPassword = () => {
    setError("");
    if (!validatePassword(password)) {
      setError("Password must include uppercase, lowercase, number, and minimum 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }
    setStep(4);
    toast.success("Password reset completed.");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-5 py-8 text-[#1f2a44] md:px-8">
      <div className="mx-auto max-w-[760px]">
        <header className="mb-8 flex items-center justify-between">
          <button className="inline-flex items-center gap-1 rounded-md border border-[#dbe4eb] bg-white px-3 py-2 text-sm font-semibold text-[#36434f]">
            <Globe className="h-4 w-4 text-[#3aa4a8]" /> ENG
          </button>
          <Link href="/login" className="rounded-md border border-[#dbe4eb] px-3 py-2 text-sm font-semibold text-[#36434f]">
            Back to Login
          </Link>
        </header>

        <section className="rounded-md border border-[#dbe4eb] bg-white p-7 shadow-[0_10px_28px_rgba(31,42,68,0.06)]">
          <h1 className="text-2xl font-bold text-[#171f39]">Forgot Password</h1>
          <p className="mt-1 text-sm text-[#6e7e91]">Recover your account with OTP verification.</p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className={`h-1 rounded-full ${step >= 1 ? "bg-[#3aa4a8]" : "bg-[#dbe4eb]"}`} />
            <div className={`h-1 rounded-full ${step >= 2 ? "bg-[#3aa4a8]" : "bg-[#dbe4eb]"}`} />
            <div className={`h-1 rounded-full ${step >= 3 ? "bg-[#3aa4a8]" : "bg-[#dbe4eb]"}`} />
            <div className={`h-1 rounded-full ${step >= 4 ? "bg-[#3aa4a8]" : "bg-[#dbe4eb]"}`} />
          </div>

          {step === 1 && (
            <div className="mt-5">
              <label className="block text-sm font-medium text-[#7f8a99]">
                Registered Email or Company ID
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
              <button
                type="button"
                onClick={sendOtp}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1f7d79] px-4 py-3 text-sm font-semibold text-white hover:bg-[#186b67]"
              >
                Send OTP <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="mt-5">
              <p className="mb-3 text-sm text-[#6e7e91]">
                Enter the 6-digit OTP sent to <span className="font-semibold text-[#1f2a44]">{maskIdentifier}</span>
              </p>
              <div className="flex gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    value={digit}
                    maxLength={1}
                    inputMode="numeric"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setOtp((prev) => prev.map((item, i) => (i === index ? value : item)));
                    }}
                    className="h-12 w-12 rounded-md border border-[#dbe4eb] text-center text-lg font-semibold outline-none focus:border-[#3aa4a8]"
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-[#6e7e91]">Resend OTP in {timer}s</p>
                <button
                  type="button"
                  disabled={timer > 0}
                  onClick={() => {
                    const generated = otpSeed();
                    setOtpCode(generated);
                    setOtp(["", "", "", "", "", ""]);
                    startTimer();
                    toast.success("OTP resent.");
                  }}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#2e979d] disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" /> Resend
                </button>
              </div>
              <button
                type="button"
                onClick={verifyOtp}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1f7d79] px-4 py-3 text-sm font-semibold text-white hover:bg-[#186b67]"
              >
                Verify OTP <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="mt-5 grid gap-3">
              <label className="block text-sm font-medium text-[#7f8a99]">
                New Password
                <div className="mt-2 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-3 focus-within:border-[#3aa4a8]">
                  <KeyRound className="h-4 w-4 text-[#7f8a99]" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                    placeholder="Minimum 8 chars, uppercase, lowercase, number"
                  />
                </div>
              </label>

              <label className="block text-sm font-medium text-[#7f8a99]">
                Confirm Password
                <div className="mt-2 flex items-center gap-2 rounded-md border border-[#dbe4eb] bg-white px-4 py-3 focus-within:border-[#3aa4a8]">
                  <KeyRound className="h-4 w-4 text-[#7f8a99]" />
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    className="w-full bg-transparent text-sm text-[#1f2a44] outline-none"
                    placeholder="Confirm new password"
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={resetPassword}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1f7d79] px-4 py-3 text-sm font-semibold text-white hover:bg-[#186b67]"
              >
                Reset Password <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="mt-5 rounded-md border border-[#cbe8d8] bg-[#f4fbf7] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-lg font-semibold text-[#143127]">Password updated successfully</p>
                  <p className="mt-1 text-sm text-[#2b4a3f]">
                    You can now log in with your new password. Previous sessions should be re-authenticated.
                  </p>
                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#1f7d79] px-4 py-2 text-sm font-semibold text-white hover:bg-[#186b67]"
                  >
                    Back to Login <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          {process.env.NODE_ENV !== "production" && step === 2 && otpCode && (
            <p className="mt-3 text-xs text-[#6e7e91]">Dev OTP: {otpCode}</p>
          )}
        </section>
      </div>
    </div>
  );
}
