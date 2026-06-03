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
  HelpCircle,
  LogOut,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { useIsMobile } from "../hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const showLabels = isMobile || isOpen;
  const asideClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform bg-gradient-to-b from-indigo-900 to-indigo-950 text-white transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`
    : `bg-gradient-to-b from-indigo-900 to-indigo-950 text-white transition-all duration-300 flex flex-col ${
        isOpen ? "w-64" : "w-20"
      }`;

  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`${asideClasses} ${isMobile ? "" : "flex flex-col"}`}>
        <div className="flex items-center justify-between p-4 border-b border-indigo-800">
          {showLabels && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 p-1 bg-white rounded-lg shadow-sm">
                <img
                  src="/images/logo.png"
                  alt="LendSmart logo"
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="text-xl font-bold">LendSmart</span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 transition-colors rounded-lg hover:bg-indigo-800"
            aria-label={isOpen ? "Collapse navigation" : "Expand navigation"}
          >
            {isOpen || isMobile ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-amber-500 font-semibold text-indigo-950"
                    : "hover:bg-indigo-800"
                } ${!showLabels ? "justify-center px-2" : ""}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {showLabels && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 space-y-2 border-t border-indigo-800">
          <button
            onClick={() => handleSectionChange("settings")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              activeSection === "settings"
                ? "bg-amber-500 font-semibold text-indigo-950"
                : "hover:bg-indigo-800"
            } ${!showLabels ? "justify-center px-2" : ""}`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {showLabels && <span>Settings</span>}
          </button>

          <button
            onClick={handleSignOut}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-300 transition-colors hover:bg-red-900/50 hover:text-red-200 ${
              !showLabels ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {showLabels && <span>Logout</span>}
          </button>
        </div>

        {showLabels && (
          <div className="p-4 border-t border-indigo-800">
            <div className="text-xs text-center text-indigo-300">
              LendSmart v1.0.0
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
