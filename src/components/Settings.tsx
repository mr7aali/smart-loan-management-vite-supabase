import {
  Settings,
  Bell,
  Shield,
  Database,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { AppCurrency, normalizeCurrency, SUPPORTED_CURRENCIES } from "../utils";
import { Borrower, Loan, Repayment, UserProfile } from "../types";
import { exportWorkspaceData } from "../lib/export";

interface SettingsProps {
  user?: User | null;
  onSignOut: () => void;
  onUpdateCurrency: (currency: AppCurrency) => Promise<void>;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  profile?: UserProfile | null;
  subscription?: any;
  borrowers: Borrower[];
  loans: Loan[];
  repayments: Repayment[];
}

export default function SettingsPage({
  user,
  onSignOut,
  onUpdateCurrency,
  darkMode,
  onToggleDarkMode,
  profile,
  subscription,
  borrowers,
  loans,
  repayments,
}: SettingsProps) {
  const [notifications, setNotifications] = useState(true);
  const [autoReminders, setAutoReminders] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<AppCurrency>(
    normalizeCurrency(profile?.currency),
  );
  const [currencySaving, setCurrencySaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSelectedCurrency(normalizeCurrency(profile?.currency));
  }, [profile?.currency]);

  const handleCurrencySave = async () => {
    setCurrencySaving(true);
    try {
      await onUpdateCurrency(selectedCurrency);
    } finally {
      setCurrencySaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      exportWorkspaceData(borrowers, loans, repayments);
    } finally {
      setTimeout(() => setExporting(false), 400);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl sm:p-6">
        <h2 className="mb-6 text-xl font-bold text-gray-800 sm:text-2xl">
          Account Settings
        </h2>

        {/* Account Info */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
            <Settings className="w-5 h-5 text-gray-500" />
            Account Information
          </h3>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex flex-col items-start gap-4 mb-4 sm:flex-row sm:items-center">
              <div className="flex items-center justify-center text-xl font-bold text-white rounded-full h-14 w-14 bg-gradient-to-br from-indigo-500 to-purple-600 sm:h-16 sm:w-16 sm:text-2xl">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800">
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-sm text-gray-500 break-all">{user?.email}</p>
              </div>
            </div>
            {subscription && (
              <div className="flex flex-col gap-3 p-3 mt-4 rounded-lg bg-amber-50 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium capitalize text-amber-800">
                    {subscription.plan} Plan
                  </p>
                  <p className="text-xs text-amber-600">
                    {subscription.price === 0
                      ? "Free forever"
                      : `$${subscription.price}/month`}
                  </p>
                </div>
                <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full w-fit bg-amber-200 text-amber-800">
                  {subscription.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* General Settings */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
            <Settings className="w-5 h-5 text-gray-500" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-800">Dark Mode</p>
                <p className="text-sm text-gray-500">
                  Enable dark theme for the app
                </p>
              </div>
              <button
                onClick={onToggleDarkMode}
                aria-label="Toggle dark mode"
                aria-pressed={darkMode}
                className={`w-12 h-6 rounded-full transition-colors ${
                  darkMode ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    darkMode ? "translate-x-6" : "translate-x-0.5"
                  }`}
                ></div>
              </button>
            </div>
            <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-800">Display Currency</p>
                <p className="text-sm text-gray-500">
                  Applies to dashboard, loans, and repayments only.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px]">
                <select
                  value={selectedCurrency}
                  onChange={(event) =>
                    setSelectedCurrency(
                      normalizeCurrency(event.target.value as AppCurrency),
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SUPPORTED_CURRENCIES.map((currencyOption) => (
                    <option key={currencyOption.code} value={currencyOption.code}>
                      {currencyOption.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleCurrencySave()}
                  disabled={
                    currencySaving ||
                    selectedCurrency === normalizeCurrency(profile?.currency)
                  }
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {currencySaving ? "Saving..." : "Save Currency"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
            <Bell className="w-5 h-5 text-gray-500" />
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-800">Push Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive notifications about payment reminders
                </p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                aria-label="Toggle push notifications"
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    notifications ? "translate-x-6" : "translate-x-0.5"
                  }`}
                ></div>
              </button>
            </div>
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-800">Auto Reminders</p>
                <p className="text-sm text-gray-500">
                  Automatically send payment reminders
                </p>
              </div>
              <button
                onClick={() => setAutoReminders(!autoReminders)}
                aria-label="Toggle automatic reminders"
                className={`w-12 h-6 rounded-full transition-colors ${
                  autoReminders ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    autoReminders ? "translate-x-6" : "translate-x-0.5"
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
            <Shield className="w-5 h-5 text-gray-500" />
            Data & Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-800">Export Data</p>
                <p className="text-sm text-gray-500">
                  Download all your data in CSV format
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleExportData()}
                disabled={exporting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="py-6 border-t border-gray-200">
          <button
            onClick={onSignOut}
            className="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-red-600 transition-colors rounded-xl bg-red-50 hover:bg-red-100 sm:w-auto"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* About */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
            <Database className="w-5 h-5 text-gray-500" />
            About
          </h3>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="theme-logo-surface flex items-center justify-center w-12 h-12 p-1 bg-white rounded-xl shadow-sm ring-1 ring-slate-200">
                <img
                  src="/images/logo.png"
                  alt="LendSmart logo"
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <p className="font-bold text-gray-800">LendSmart</p>
                <p className="text-sm text-gray-500">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              LendSmart is a comprehensive loan management solution designed to
              help lenders manage their operations efficiently. Built with
              modern technology and a focus on user experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
