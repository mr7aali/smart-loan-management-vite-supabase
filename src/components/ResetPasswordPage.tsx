import { useMemo, useState } from "react";
import { ArrowRight, KeyRound, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface ResetPasswordPageProps {
  onUpdatePassword: (password: string) => Promise<any>;
}

function getResetLinkError() {
  if (typeof window === "undefined") {
    return "";
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorDescription =
    searchParams.get("error_description") ||
    hashParams.get("error_description") ||
    searchParams.get("error") ||
    hashParams.get("error");

  return errorDescription ? errorDescription.replace(/\+/g, " ") : "";
}

export default function ResetPasswordPage({
  onUpdatePassword,
}: ResetPasswordPageProps) {
  const navigate = useNavigate();
  const resetLinkError = useMemo(getResetLinkError, []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(resetLinkError);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await onUpdatePassword(password);
      setPassword("");
      setConfirmPassword("");
      setSuccessMessage("Your password has been updated successfully.");
    } catch (err: any) {
      const message = err.message || "Unable to update password";
      const needsNewLink =
        message.toLowerCase().includes("session") ||
        message.toLowerCase().includes("expired") ||
        message.toLowerCase().includes("invalid");

      setError(
        needsNewLink
          ? "This reset link is invalid or expired. Please request a new password reset link."
          : message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <div className="theme-logo-surface inline-flex items-center justify-center mb-4 h-20 w-20 rounded-3xl bg-white p-1 shadow-2xl ring-1 ring-white/20 sm:h-24 sm:w-24">
            <img
              src="/images/logo.png"
              alt="LendSmart logo"
              className="object-contain w-[92%] h-[92%]"
            />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
            LendSmart
          </h1>
          <p className="text-sm text-indigo-200 sm:text-base">
            Smart Loan Management for Modern Lenders
          </p>
        </div>

        <div className="p-6 bg-white shadow-2xl rounded-2xl sm:p-8">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-indigo-50">
              <KeyRound className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
              Set New Password
            </h2>
            <p className="mt-1 text-gray-500">
              Choose a secure password for your account
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-4 text-sm border rounded-lg bg-emerald-50 border-emerald-200 text-emerald-700">
              {successMessage}
            </div>
          )}

          {!successMessage ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter your new password"
                    required
                    className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-xl focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Confirm your new password"
                    required
                    className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-xl focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Boolean(resetLinkError)}
                className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-b-2 border-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Update Password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
