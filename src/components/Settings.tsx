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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Account Settings</h2>

        {/* Account Info */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            Account Information
          </h3>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-bold text-gray-800">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            {subscription && (
              <div className="flex items-center justify-between mt-4 p-3 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium text-amber-800 capitalize">{subscription.plan} Plan</p>
                  <p className="text-xs text-amber-600">
                    {subscription.price === 0 ? 'Free forever' : `$${subscription.price}/month`}
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-medium">
                  {subscription.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* General Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Dark Mode</p>
                <p className="text-sm text-gray-500">Enable dark theme for the app</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-500" />
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Push Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications about payment reminders</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Auto Reminders</p>
                <p className="text-sm text-gray-500">Automatically send payment reminders</p>
              </div>
              <button
                onClick={() => setAutoReminders(!autoReminders)}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" />
            Data & Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Export Data</p>
                <p className="text-sm text-gray-500">Download all your data in CSV format</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* About */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-500" />
            About
          </h3>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
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