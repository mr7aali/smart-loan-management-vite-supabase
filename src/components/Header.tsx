import { Menu, Bell, Search, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
  user?: User | null;
}

export default function Header({ title, onToggleSidebar, user }: HeaderProps) {
  const getTitle = (section: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      borrowers: 'Borrowers',
      loans: 'Loans',
      repayments: 'Repayments',
      reports: 'Reports',
      settings: 'Settings',
      subscription: 'Subscription',
      help: 'Help',
    };
    return titles[section] || section.charAt(0).toUpperCase() + section.slice(1);
  };

  const getUserInitials = (email?: string) => {
    if (!email) return 'U';
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="truncate text-lg font-bold text-gray-800 sm:text-2xl">{getTitle(title)}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search borrowers, loans..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button className="relative rounded-lg p-2 transition-colors hover:bg-gray-100" aria-label="Notifications">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-2 sm:gap-3 sm:pl-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white sm:h-10 sm:w-10">
              {getUserInitials(user?.email)}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="font-medium text-gray-800">{user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-sm text-gray-500">LendSmart Account</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
