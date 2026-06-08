import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";

interface LegalPageLayoutProps {
  title: string;
  pageTitle: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalPageLayout({
  title,
  pageTitle,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  useEffect(() => {
    document.title = pageTitle;

    return () => {
      document.title = "LendSmart";
    };
  }, [pageTitle]);

  return (
    <div className="max-h-screen bg-slate-50 text-slate-700">
      <header className="text-white bg-gradient-to-r from-indigo-700 via-violet-700 to-indigo-900">
        <div className="flex items-center justify-between w-full max-w-5xl gap-4 px-4 py-4 mx-auto sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="theme-logo-surface flex items-center justify-center w-12 h-12 p-1 shadow-lg rounded-2xl bg-white/95">
              <img
                src="/images/logo.png"
                alt="LendSmart logo"
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <p className="text-lg font-bold">LendSmart</p>
              <p className="text-xs text-indigo-100">Legal information</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            <Link
              to="/terms"
              className="px-3 py-2 text-center transition border rounded-full border-white/20 text-indigo-50 hover:bg-white/10"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="px-3 py-2 text-center transition border rounded-full border-white/20 text-indigo-50 hover:bg-white/10"
            >
              Privacy
            </Link>
            <Link
              to="/"
              className="px-3 py-2 font-medium text-center text-indigo-700 transition bg-white rounded-full hover:bg-indigo-50"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="w-full max-h-screen px-4 py-8 mx-auto mb-2 overflow-x-hidden sm:px-6 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 transition bg-white border border-indigo-200 rounded-full shadow-sm hover:border-indigo-300 hover:bg-indigo-50"
        >
          Back to sign in
        </Link>

        <section className="p-5 mt-6 bg-white border shadow-sm rounded-3xl border-slate-200 sm:mt-8 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          <p className="pb-6 mt-3 text-sm border-b border-slate-200 text-slate-500">
            Last updated: {lastUpdated}
          </p>

          <div className="mt-6 prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-a:text-indigo-700 prose-strong:text-slate-900">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
