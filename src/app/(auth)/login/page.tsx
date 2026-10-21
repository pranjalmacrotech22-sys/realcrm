"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Clock,
  ArrowLeft,
  Layers,
  TrendingUp,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/dashboard";

  // Flow states: credentials (email + password) -> otp (6-digit 2FA)
  const initialMode = searchParams.get("mode") === "register";
  const [isSignUp, setIsSignUp] = useState(initialMode);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  // Credential inputs
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP inputs
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Auto focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === "otp" && otpInputsRef.current[0]) {
      otpInputsRef.current[0]?.focus();
    }
  }, [step]);

  // Handle Step 1: Submit Credentials & Request 2FA OTP
  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAccountNotFound(false);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!orgName.trim()) {
        setError("Please enter your company or brokerage name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter.");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          isSignUp,
          fullName: isSignUp ? fullName.trim() : undefined,
          organizationName: isSignUp ? orgName.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404 || data.code === "ACCOUNT_NOT_FOUND") {
          setAccountNotFound(true);
        }
        throw new Error(data.error || "Authentication failed.");
      }

      setStep("otp");
      setSuccessMsg("Credentials verified! Please enter your 6-digit 2FA verification code.");
      setResendCooldown(45);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify credentials");
    } finally {
      setLoading(false);
    }
  }

  // Handle Resending OTP
  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          isSignUp,
          fullName: isSignUp ? fullName.trim() : undefined,
          organizationName: isSignUp ? orgName.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setSuccessMsg("A fresh 6-digit verification code has been dispatched.");
      setResendCooldown(45);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend verification code");
    } finally {
      setLoading(false);
    }
  }

  // Handle Submitting & Verifying 2FA OTP
  async function handleVerifyOtp(codeToVerify?: string) {
    setError(null);
    setLoading(true);

    const submittedCode = codeToVerify || otp.join("");
    if (submittedCode.length !== 6) {
      setError("Please enter all 6 digits of your verification code.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: submittedCode,
          password,
          fullName: isSignUp ? fullName.trim() : undefined,
          organizationName: isSignUp ? orgName.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid verification code.");
      }

      // Successful 2FA verification! Redirect to destination
      router.push(redirectedFrom);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
      setLoading(false);
    }
  }

  // Handle single digit OTP input change
  function handleDigitChange(index: number, val: string) {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val !== "") return;

    const newOtp = [...otp];

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 6).split("");
      pasted.forEach((char, idx) => {
        if (index + idx < 6) {
          newOtp[index + idx] = char;
        }
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + pasted.length, 5);
      otpInputsRef.current[nextIdx]?.focus();

      if (newOtp.join("").length === 6) {
        handleVerifyOtp(newOtp.join(""));
      }
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    if (newOtp.join("").length === 6) {
      handleVerifyOtp(newOtp.join(""));
    }
  }

  // Handle Backspace navigation across OTP boxes
  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    }
  }


  return (
    <div className="w-full max-w-md mx-auto">
      {/* Clean Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-7 sm:p-9">
        {/* Card Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Two-Factor Authentication</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {step === "credentials"
              ? isSignUp
                ? "Create Workspace"
                : "Sign In to RealCRM"
              : "2FA Verification Code"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {step === "credentials"
              ? "Enter your work email and password to begin secure 2FA sign in."
              : `Enter the single-use 6-digit access code sent to ${email}`}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="leading-snug block">{error}</span>
              {accountNotFound && !isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                    setAccountNotFound(false);
                  }}
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                >
                  <span>Click here to register your workspace now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Success Banner */}
        {successMsg && !error && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: EMAIL & PASSWORD INPUTS */}
        {step === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {/* Mode switch tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  !isSignUp ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  isSignUp ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Register Workspace
              </button>
            </div>

            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Brokerage Name
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Horizon Realty Group"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Min 6 characters</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs tracking-wide transition shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? "Validating & Sending Code..." : isSignUp ? "Create Workspace & Send 2FA Code" : "Verify Password & Send 2FA Code"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* STEP 2: 6-DIGIT OTP VERIFICATION */
          <div className="space-y-5">
            {/* Active Email Identity Pill */}
            <div className="flex items-center justify-between text-xs bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium truncate max-w-[220px]">
                {email}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>

            {/* 6 Digit Input Grid */}
            <div>
              <label className="block text-center text-xs font-semibold text-slate-700 mb-3">
                Enter 6-Digit Verification Code
              </label>

              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-500/20 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              disabled={loading || otp.join("").length !== 6}
              onClick={() => handleVerifyOtp()}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs tracking-wide transition shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? "Verifying Code..." : "Verify Code & Enter Workspace"}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>

            {/* Resend Cooldown Link */}
            <div className="text-center pt-1">
              {resendCooldown > 0 ? (
                <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resend new code in {resendCooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resend verification code</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row relative overflow-hidden">
      {/* LEFT COLUMN: Enterprise Hero Showcase */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border-b lg:border-b-0 lg:border-r border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight block text-white">
              RealCRM
            </span>
            <span className="text-[11px] text-blue-400 font-medium uppercase tracking-wider block">
              Enterprise Real Estate SaaS
            </span>
          </div>
        </div>

        {/* Center Pitch */}
        <div className="relative z-10 my-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-medium text-blue-300 mb-6 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Deterministic Customer Requirement Matching</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Institutional Real Estate Inventory & Matching Engine.
          </h1>

          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Eliminate manual registers and WhatsApp spreadsheets. Manage residential floors, apartments, luxury villas, commercial retail, and plots with complete private tenant isolation.
          </p>

          {/* Feature Highlights Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Instant Rule Matching</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Matches requirements against inventory in milliseconds with variance tags.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Tenant Leakage</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                PostgreSQL RLS ensures complete isolation between competitor brokerages.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof / Trust Badge */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Multi-Tenant Architecture Ready</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">v1.0 Production MVP</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-50">
        <Suspense
          fallback={
            <div className="w-full max-w-md p-10 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              Loading authentication...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
