import { ReactNode, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "../../hooks/use-theme";

interface MarketingLayoutProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

const NAV_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
];

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
  className?: string;
}

function ThemeToggle({ darkMode, onToggle, className = "" }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={darkMode}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white ${className}`}
    >
      {darkMode ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

export default function MarketingLayout({
  children,
  isAuthenticated,
}: MarketingLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  const ctaPath = isAuthenticated ? "/dashboard" : "/login";
  const ctaLabel = isAuthenticated ? "Open dashboard" : "Sign in";
  const primaryCtaPath = isAuthenticated ? "/dashboard" : "/login?mode=signup";
  const primaryCtaLabel = isAuthenticated ? "Open dashboard" : "Start for free";

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="theme-logo-surface inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow ring-1 ring-slate-200 dark:ring-slate-700">
              <img
                src="/images/logo.png"
                alt="LendSmart loan management software logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                loading="eager"
                decoding="async"
              />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              LendSmart
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
            <Link
              to={ctaPath}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              {ctaLabel}
            </Link>
            <Link
              to={primaryCtaPath}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700"
            >
              {primaryCtaLabel}
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 dark:text-slate-200"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            id="mobile-menu"
            className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:hidden"
          >
            <nav
              aria-label="Mobile"
              className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3"
            >
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {link.label}
                </NavLink>
              ))}
              <Link
                to={ctaPath}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {ctaLabel}
              </Link>
              <Link
                to={primaryCtaPath}
                onClick={() => setMobileOpen(false)}
                className="rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-center text-base font-semibold text-white"
              >
                {primaryCtaLabel}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="theme-logo-surface inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow ring-1 ring-slate-200 dark:ring-slate-700">
                <img
                  src="/images/logo.png"
                  alt="LendSmart logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                LendSmart
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Loan management software for individual lenders, microfinance
              organisations, and small lending businesses. Track borrowers,
              originate loans, record repayments, and review portfolio
              performance in one secure workspace.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Product
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  to="/features"
                  className="text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  to="/login?mode=signup"
                  className="text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300"
                >
                  Create account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Company
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  to="/terms"
                  className="text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contactus@lendsmart.me"
                  className="text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300"
                >
                  contactus@lendsmart.me
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:px-6 dark:text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} LendSmart. All rights reserved.
            </p>
            <p>Built for lenders who care about their borrowers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
