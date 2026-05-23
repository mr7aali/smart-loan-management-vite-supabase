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
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user?: User | null;
  onSignOut?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'borrowers', label: 'Borrowers', icon: Users },
  { id: 'loans', label: 'Loans', icon: FileText },
  { id: 'repayments', label: 'Repayments', icon: DollarSign },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export default function Sidebar({ activeSection, setActiveSection, isOpen, setIsOpen, user, onSignOut }: SidebarProps) {
  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <aside
      className={`bg-gradient-to-b from-indigo-900 to-indigo-950 text-white transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="p-4 border-b border-indigo-800 flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">LendSmart</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-indigo-800 rounded-lg transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
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
                  ? 'bg-amber-500 text-indigo-950 font-semibold'
                  : 'hover:bg-indigo-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-indigo-800 space-y-2">
        <button
          onClick={() => setActiveSection('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeSection === 'settings'
              ? 'bg-amber-500 text-indigo-950 font-semibold'
              : 'hover:bg-indigo-800'
          }`}
        >
          <Settings className="w-5 h-5" />
          {isOpen && <span>Settings</span>}
        </button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/50 text-red-300 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-indigo-800">
          <div className="text-xs text-indigo-300 text-center">
            LendSmart v1.0.0
          </div>
        </div>
      )}
    </aside>
  );
}