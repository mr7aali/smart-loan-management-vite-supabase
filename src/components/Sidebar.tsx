import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Sparkles,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { User } from "@supabase/supabase-js";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user?: User | null;
  onSignOut?: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "borrowers", label: "Borrowers", icon: Users },
  { id: "loans", label: "Loans", icon: FileText },
  { id: "repayments", label: "Repayments", icon: DollarSign },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "help", label: "Help", icon: HelpCircle },
];

export default function Sidebar({
  activeSection,
  setActiveSection,
  isOpen,
  setIsOpen,
  user,
  onSignOut,
}: SidebarProps) {
  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <aside
      className={`bg-gradient-to-b from-indigo-900 to-indigo-950 text-white transition-all duration-300 flex flex-col  ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex items-center justify-between border-b border-indigo-800 p-4">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">LendSmart</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 transition-colors hover:bg-indigo-800"
        >
          {isOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeSection === item.id
                  ? "bg-amber-500 text-indigo-950 font-semibold"
                  : "hover:bg-indigo-800"
              }`}
            >
              <Icon className="h-5 w-5" />
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-indigo-800 p-4">
        <button
          onClick={() => setActiveSection("settings")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeSection === "settings"
              ? "bg-amber-500 text-indigo-950 font-semibold"
              : "hover:bg-indigo-800"
          }`}
        >
          <Settings className="h-5 w-5" />
          {isOpen && <span>Settings</span>}
        </button>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-300 transition-colors hover:bg-red-900/50 hover:text-red-200"
        >
          <LogOut className="h-5 w-5" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-indigo-800 p-4">
          <div className="text-center text-xs text-indigo-300">
            LendSmart v1.0.0
          </div>
        </div>
      )}
    </aside>
  );
}
