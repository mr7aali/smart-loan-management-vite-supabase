import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileBarChart,
  ShieldCheck,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import MarketingLayout from "./MarketingLayout";
import { LANDING_FAQ } from "../../lib/seo";
import { SUBSCRIPTION_PLANS } from "../../lib/subscription-plans";

interface LandingPageProps {
  isAuthenticated: boolean;
}

const FEATURES = [
  {
    icon: Users,
    title: "Borrower management",
    description:
      "Keep every borrower profile, contact detail, and note in one place so any team member can pick up where the last one left off.",
  },
  {
    icon: Wallet,
    title: "Loan origination",
    description:
      "Create loans with interest rates, terms, and due dates in seconds. Approval workflows protect your portfolio when more than one person is involved.",
  },
  {
    icon: CreditCard,
    title: "Repayment tracking",
    description:
      "Record every payment by date and method, automatically update loan status, and stay on top of overdue balances.",
  },
  {
    icon: BarChart3,
    title: "Lending reports",
    description:
      "See active loans, repayment trends, outstanding balances, and portfolio health on a dashboard built for fast decisions.",
  },
  {
    icon: Workflow,
    title: "Multi-user workspace",
    description:
      "Invite teammates, assign roles, and review pending borrower or loan changes from a single approvals queue.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description:
      "Data is encrypted in transit, stored on Supabase with row-level security, and protected by per-workspace access controls.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create your workspace",
    description:
      "Sign up in under a minute. The Free plan supports up to 10 borrowers and 20 loans, no card required.",
  },
  {
    number: "02",
    title: "Add borrowers and loans",
    description:
      "Capture borrower details, create loans with custom interest and terms, and start tracking repayments straight away.",
  },
  {
    number: "03",
    title: "Stay on top of repayments",
    description:
      "Record payments as they come in, send reminders on paid plans, and watch your portfolio health update in real time.",
  },
];

const STATS = [
  { value: "100%", label: "Cloud-based, no install" },
  { value: "<60s", label: "From signup to first loan" },
  { value: "24/7", label: "Access from any device" },
];

export default function LandingPage({ isAuthenticated }: LandingPageProps) {
  const primaryCtaPath = isAuthenticated ? "/dashboard" : "/login?mode=signup";
  const primaryCtaLabel = isAuthenticated
    ? "Open dashboard"
    : "Start free, no card required";

  return (
    <MarketingLayout isAuthenticated={isAuthenticated}>
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 shadow-sm dark:border-indigo-800 dark:bg-slate-900/60 dark:text-indigo-300">
                Loan management software
              </p>
              <h1
                id="hero-heading"
                className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
              >
                Run your lending business without the spreadsheets.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                LendSmart helps individual lenders, microfinance teams, and
                small lending businesses track borrowers, originate loans,
                record repayments, and review reports in one secure workspace.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to={primaryCtaPath}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700"
                >
                  {primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                >
                  Explore features
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Free plan available
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  No credit card required
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Cancel anytime
                </li>
              </ul>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-indigo-200/60 to-purple-200/60 blur-2xl"
              />
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Active portfolio
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      $124,500
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    +12.4% this month
                  </span>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-indigo-50 p-3">
                    <dt className="text-xs text-indigo-600">Borrowers</dt>
                    <dd className="text-lg font-bold text-indigo-900">42</dd>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-3">
                    <dt className="text-xs text-violet-600">Active loans</dt>
                    <dd className="text-lg font-bold text-violet-900">58</dd>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <dt className="text-xs text-emerald-600">On-time rate</dt>
                    <dd className="text-lg font-bold text-emerald-900">96%</dd>
                  </div>
                </dl>
                <div className="mt-6 space-y-3">
                  {[
                    {
                      name: "Aisha N.",
                      detail: "Personal loan / 6 months",
                      amount: "$1,200",
                      status: "On track",
                      tone: "emerald",
                    },
                    {
                      name: "Daniel K.",
                      detail: "Business loan / 12 months",
                      amount: "$8,400",
                      status: "Repayment due",
                      tone: "amber",
                    },
                    {
                      name: "Mosa T.",
                      detail: "SME loan / 9 months",
                      amount: "$3,600",
                      status: "Paid in full",
                      tone: "indigo",
                    },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {row.name}
                        </p>
                        <p className="text-xs text-slate-500">{row.detail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {row.amount}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            row.tone === "emerald"
                              ? "text-emerald-600"
                              : row.tone === "amber"
                                ? "text-amber-600"
                                : "text-indigo-600"
                          }`}
                        >
                          {row.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        aria-label="Highlights"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-10 text-center sm:grid-cols-3 sm:px-6">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-slate-900 sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features-heading" className="bg-white py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Everything you need
            </p>
            <h2
              id="features-heading"
              className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              A complete loan management toolkit
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Built for the realities of lending. From the first borrower record
              to the last repayment, LendSmart keeps every detail organised and
              auditable.
            </p>
          </div>

          <ul
            role="list"
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 text-center">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              See every feature in detail
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="bg-slate-50 py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              How it works
            </p>
            <h2
              id="how-heading"
              className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Three steps to a cleaner loan book
            </h2>
          </div>
          <ol
            role="list"
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <p className="text-sm font-bold text-indigo-600">
                  {step.number}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing teaser */}
      <section
        aria-labelledby="pricing-teaser-heading"
        className="bg-white py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Pricing
            </p>
            <h2
              id="pricing-teaser-heading"
              className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Start free. Scale when your portfolio does.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Every plan includes the core loan management toolkit. Upgrade when
              you need more borrowers, more team members, or richer automation.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
                  plan.popular
                    ? "border-indigo-500 ring-2 ring-indigo-500"
                    : "border-slate-200"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  ${plan.price}
                  <span className="text-base font-medium text-slate-500">
                    /mo
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-500">{plan.limits}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/pricing"
                  className="mt-6 inline-flex justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                >
                  Compare plans
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        aria-labelledby="faq-heading"
        className="border-t border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              FAQ
            </p>
            <h2
              id="faq-heading"
              className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Frequently asked questions
            </h2>
          </div>
          <dl className="mt-10 space-y-4">
            {LANDING_FAQ.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-indigo-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <dt className="text-base font-semibold text-slate-900">
                    {item.question}
                  </dt>
                  <span
                    aria-hidden="true"
                    className="ml-2 text-indigo-600 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <dd className="mt-3 text-sm leading-relaxed text-slate-600">
                  {item.answer}
                </dd>
              </details>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section
        aria-labelledby="cta-heading"
        className="bg-gradient-to-br from-indigo-700 via-violet-700 to-indigo-900 py-16 text-white"
      >
        <div className="mx-auto w-full max-w-4xl px-4 text-center sm:px-6">
          <FileBarChart
            className="mx-auto h-10 w-10 text-indigo-200"
            aria-hidden="true"
          />
          <h2
            id="cta-heading"
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Ready to simplify your lending?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Set up your workspace, add your first borrower, and record your
            first repayment in less than five minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to={primaryCtaPath}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-50"
            >
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
