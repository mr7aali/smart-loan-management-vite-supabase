import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import MarketingLayout from "./MarketingLayout";
import { LANDING_FAQ } from "../../lib/seo";
import { SUBSCRIPTION_PLANS } from "../../lib/subscription-plans";

interface PricingPageProps {
  isAuthenticated: boolean;
}

const COMPARE_ROWS: Array<{
  label: string;
  values: Record<string, string>;
}> = [
  {
    label: "Borrowers",
    values: {
      free: "Up to 10",
      starter: "Up to 50",
      professional: "Up to 200",
      enterprise: "Unlimited",
    },
  },
  {
    label: "Loans",
    values: {
      free: "Up to 20",
      starter: "Unlimited",
      professional: "Unlimited",
      enterprise: "Unlimited",
    },
  },
  {
    label: "Team members",
    values: {
      free: "1",
      starter: "3",
      professional: "10",
      enterprise: "Unlimited",
    },
  },
  {
    label: "Reminders",
    values: {
      free: "Email",
      starter: "Email + SMS",
      professional: "Email + SMS + WhatsApp",
      enterprise: "All channels",
    },
  },
  {
    label: "Reporting",
    values: {
      free: "Basic",
      starter: "Advanced",
      professional: "Full analytics",
      enterprise: "Full analytics",
    },
  },
  {
    label: "Approvals workflow",
    values: {
      free: "—",
      starter: "Yes",
      professional: "Yes",
      enterprise: "Yes",
    },
  },
  {
    label: "Custom branding",
    values: {
      free: "—",
      starter: "—",
      professional: "Yes",
      enterprise: "Yes (white-label)",
    },
  },
  {
    label: "Support",
    values: {
      free: "Email",
      starter: "Priority",
      professional: "24/7",
      enterprise: "Dedicated",
    },
  },
];

export default function PricingPage({ isAuthenticated }: PricingPageProps) {
  const ctaPath = isAuthenticated ? "/dashboard" : "/login?mode=signup";
  const ctaLabel = isAuthenticated ? "Open dashboard" : "Get started";

  return (
    <MarketingLayout isAuthenticated={isAuthenticated}>
      <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Simple plans for every lending business
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Start free, then upgrade when your borrowers, loans, or team grow.
            All prices are in US dollars and billed monthly through PayPal.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <article
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
                <h2 className="text-xl font-semibold text-slate-900">
                  {plan.name}
                </h2>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  ${plan.price}
                  <span className="text-base font-medium text-slate-500">
                    /month
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-500">{plan.limits}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={ctaPath}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:from-indigo-700 hover:to-purple-700"
                      : "border border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {plan.id === "free" ? "Start free" : ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-16 overflow-x-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Compare plans side by side
            </h2>
            <table className="mt-6 w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Feature
                  </th>
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      className="px-4 py-3 font-semibold text-slate-700"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.label}
                    </td>
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <td key={plan.id} className="px-4 py-3 text-slate-700">
                        {row.values[plan.id]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Pricing questions
          </h2>
          <dl className="mt-8 space-y-4">
            {LANDING_FAQ.slice(1, 5).map((item) => (
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
          <div className="mt-10 text-center">
            <Link
              to={ctaPath}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
