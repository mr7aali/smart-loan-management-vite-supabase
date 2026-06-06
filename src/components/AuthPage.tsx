import { useState } from "react";
import { Lock, Mail, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<any>;
  onSignUp: (email: string, password: string, name: string) => Promise<any>;
}

export default function AuthPage({ onSignIn, onSignUp }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        await onSignIn(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        await onSignUp(formData.email, formData.password, formData.name);
        setIsLogin(true);
        setFormData((current) => ({
          ...current,
          name: "",
          password: "",
          confirmPassword: "",
        }));
        setSuccessMessage(
          "Account created. If you receive a verification email, confirm it first, then sign in.",
        );
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <div className="inline-flex items-center justify-center mb-4 h-20 w-20 rounded-3xl bg-white p-1 shadow-2xl ring-1 ring-white/20 sm:h-24 sm:w-24">
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
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-1 text-gray-500">
              {isLogin ? "Sign in to continue" : "Start your 14-day free trial"}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-xl focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-xl focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-xl focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm your password"
                    required
                    className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-xl focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-b-2 border-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccessMessage("");
                }}
                className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-indigo-300">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="font-medium text-white underline underline-offset-4 hover:text-indigo-100">
            Terms
          </Link>{" "}
          &{" "}
          <Link to="/privacy" className="font-medium text-white underline underline-offset-4 hover:text-indigo-100">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
