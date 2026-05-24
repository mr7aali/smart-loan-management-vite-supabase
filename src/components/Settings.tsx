import { Settings, Bell, Shield, Database, Globe, LogOut } from 'lucide-react';
import { useState } from 'react';
import { User } from '@supabase/supabase-js';

interface SettingsProps {
  user?: User | null;
  onSignOut: () => void;
  subscription?: any;
}

export default function SettingsPage({ user, onSignOut, subscription }: SettingsProps) {
  const [notifications, setNotifications] = useState(true);
  const [autoReminders, setAutoReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-6 text-xl font-bold text-gray-800 sm:text-2xl">Account Settings</h2>

        {/* Account Info */}
        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Settings className="w-5 h-5 text-gray-500" />
            Account Information
          </h3>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white sm:h-16 sm:w-16 sm:text-2xl">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="break-all text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            {subscription && (
              <div className="mt-4 flex flex-col gap-3 rounded-lg bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-amber-800 capitalize">{subscription.plan} Plan</p>
                  <p className="text-xs text-amber-600">
                    {subscription.price === 0 ? 'Free forever' : `$${subscription.price}/month`}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-800">
                  {subscription.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* General Settings */}
        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Settings className="w-5 h-5 text-gray-500" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-800">Dark Mode</p>
                <p className="text-sm text-gray-500">Enable dark theme for the app</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle dark mode"
                className={`w-12 h-6 rounded-full transition-colors ${
                  darkMode ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Bell className="w-5 h-5 text-gray-500" />
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-800">Push Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications about payment reminders</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                aria-label="Toggle push notifications"
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                ></div>
              </button>
            </div>
            <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-800">Auto Reminders</p>
                <p className="text-sm text-gray-500">Automatically send payment reminders</p>
              </div>
              <button
                onClick={() => setAutoReminders(!autoReminders)}
                aria-label="Toggle automatic reminders"
                className={`w-12 h-6 rounded-full transition-colors ${
                  autoReminders ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    autoReminders ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Shield className="w-5 h-5 text-gray-500" />
            Data & Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-800">Export Data</p>
                <p className="text-sm text-gray-500">Download all your data in CSV format</p>
              </div>
              <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto">
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-6 py-3 font-medium text-red-600 transition-colors hover:bg-red-100 sm:w-auto"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* About */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Database className="w-5 h-5 text-gray-500" />
            About
          </h3>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="mb-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800">LendSmart</p>
                <p className="text-sm text-gray-500">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              LendSmart is a comprehensive loan management solution designed to help lenders
              manage their operations efficiently. Built with modern technology and a focus
              on user experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
