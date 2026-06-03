import { useEffect, useRef, useState } from "react";
import { Menu, Bell, Search, LogOut, ChevronDown, Settings } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
  user?: User | null;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
}

export default function Header({
  title,
  onToggleSidebar,
  user,
  onOpenSettings,
  onSignOut,
}: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const getTitle = (section: string) => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      borrowers: "Borrowers",
      loans: "Loans",
      repayments: "Repayments",
      reports: "Reports",
      settings: "Settings",
      subscription: "Subscription",
      help: "Help",
    };
    return (
      titles[section] || section.charAt(0).toUpperCase() + section.slice(1)
    );
  };

  const getUserInitials = (email?: string) => {
    if (!email) return "U";
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const userName = user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="px-4 py-3 bg-white border-b border-gray-200 shadow-sm sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center min-w-0 gap-2 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 truncate sm:text-2xl">
            {getTitle(title)}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search borrowers, loans..."
              className="w-64 py-2 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            className="relative p-2 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1"></span>
          </button>

          <div
            ref={profileMenuRef}
            className="relative pl-2 border-l border-gray-200 sm:pl-4"
          >
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-2xl border border-transparent bg-white px-2 py-1.5 text-left transition-all hover:border-indigo-100 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:gap-3 sm:px-3"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              aria-label="Open account menu"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm sm:h-10 sm:w-10">
                {getUserInitials(user?.email)}
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="truncate font-medium text-gray-800">{userName}</p>
                <p className="text-sm text-gray-500">LendSmart Account</p>
              </div>
              <ChevronDown
                className={`hidden h-4 w-4 text-gray-400 transition-transform md:block ${
                  isProfileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 z-20 mt-3 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-sm font-bold backdrop-blur-sm">
                      {getUserInitials(user?.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{userName}</p>
                      <p className="truncate text-sm text-indigo-100">
                        {user?.email || "No email available"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenSettings?.();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 text-indigo-500" />
                    Account settings
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onSignOut?.();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
