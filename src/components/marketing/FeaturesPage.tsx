import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CreditCard,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import MarketingLayout from "./MarketingLayout";

interface FeaturesPageProps {
  isAuthenticated: boolean;
}

const FEATURE_GROUPS = [
  {
    icon: Users,
    title: "Borrower management",
    description:
      "A single source of truth for every person you lend to. Capture contact details, notes, and a full history of every loan and repayment they have ever made with you.",
    bullets: [
      "Searchable borrower directory",
      "Contact details, notes, and tags",
      "Full loan and repayment history per borrower",
      "Approval status visible at a glance",
    ],
  },
  {
    icon: Wallet,
    title: "Loan origination",
    description:
      "Create loans with the terms that fit your business. Custom interest rates, custom durations, and clear due dates with no hidden assumptions.",
    bullets: [
      "Custom interest rates and term lengths",
      "Configurable start and due dates",
      "Status tracking from active to paid",
      "Initiate, review, and authorise from one queue",
    ],
  },
  {
    icon: CreditCard,
    title: "Repayment tracking",
    description:
      "Record every repayment by amount, date, and method. Loan status updates automatically so you always know what is outstanding.",
    bullets: [
      "Record cash, bank transfer, mobile money, and more",
      "Automatic loan status updates",
      "Clear view of outstanding balances",
      "Searchable repayment history",
    ],
  },
  {
    icon: BarChart3,
    title: "Lending reports",
    description:
      "Reports built around the questions lenders actually ask. How is the portfolio performing? Who is overdue? What is collected this month?",
    bullets: [
      "Portfolio overview and trends",
      "Repayment performance breakdowns",
      "Overdue and at-risk views",
      "Export to share with stakeholders",
    ],
  },
  {
    icon: Workflow,
    title: "Multi-user workspace and approvals",
    description:
      "Bring your team into the same workspace with clear roles. Member-initiated changes flow into an approval queue for owners and admins.",
    bullets: [
      "Owner, admin, and member roles",
      "Approval queue for new borrowers and loans",
      "Audit log of who did what and when",
      "Available on Starter and above",
    ],
  },
  {
    icon: Bell,
    title: "Reminders that scale with your plan",
    description:
      "Stop chasing borrowers manually. Reminder channels unlock as you grow, from SMS on Starter to WhatsApp on Professional and beyond.",
    bullets: [
      "Email reminders on every plan",
      "SMS reminders on Starter",
      "WhatsApp reminders on Professional",
      "Full reminder mix on Enterprise",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security and privacy",
    description:
      "Built on Supabase with row-level security so each workspace only sees its own data. Encrypted in transit and at rest, with role-based access controls.",
    bullets: [
      "HTTPS/TLS for all traffic",
      "Encryption at rest on Supabase",
      "Row-level security per workspace",
      "Export and delete your data on request",
    ],
  },
  {
    icon: UserCheck,
    title: "Subscriptions you control",
    description:
      "Switch plans whenever your business changes. PayPal handles the payment, your data stays with you, and limits are enforced fairly.",
    bullets: [
      "Free plan with no card required",
      "Monthly billing through PayPal",
      "Switch or cancel from inside the app",
      "Plan limits surfaced before they bite",
    ],
  },
];

export default function FeaturesPage({ isAuthenticated }: FeaturesPageProps) {
  const primaryCtaPath = isAuthenticated ? "/dashboard" : "/login?mode=signup";
  const primaryCtaLabel = isAuthenticated ? "Open dashboard" : "Start free";

  return (
    <MarketingLayout isAuthenticated={isAuthenticated}>
      <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
            Features
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Every tool a lender needs in one place
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            LendSmart bundles borrower management, loan origination, repayment
            tracking, lending reports, multi-user approvals, and reminders into
            one secure workspace.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to={primaryCtaPath}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700"
            >
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-4 sm:px-6">
          {FEATURE_GROUPS.map((group, index) => {
            const Icon = group.icon;
            const reversed = index % 2 === 1;
            return (
              <article
                key={group.title}
                className={`grid items-center gap-8 lg:grid-cols-2 ${
                  reversed ? "lg:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {group.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    {group.description}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-700">
                    {group.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-indigo-500"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                  <FileSpreadsheet
                    className="h-10 w-10 text-indigo-300"
                    aria-hidden="true"
                  />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Why it matters
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">
                    {group.bullets.slice(0, 2).join(". ")}.
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto w-full max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Built for the way lenders actually work
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            From a one-person personal lending business to a microfinance team
            of ten, LendSmart adapts as you grow. No spreadsheets, no missed
            repayments, no late-night reconciliation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to={primaryCtaPath}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700"
            >
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50"
            >
              View plans
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
