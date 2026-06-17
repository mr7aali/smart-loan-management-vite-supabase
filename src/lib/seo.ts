import { SUBSCRIPTION_PLANS } from "./subscription-plans";

export const SITE_NAME = "LendSmart";
export const DEFAULT_SITE_URL = "https://www.lendsmart.me";
export const DEFAULT_IMAGE = "/images/og-cover.png";
export const FALLBACK_IMAGE = "/images/logo.png";

// A short, focused description used as the global default.
export const DEFAULT_DESCRIPTION =
  "LendSmart is loan management software for tracking borrowers, originating loans, recording repayments, and reviewing lending reports in one secure workspace.";

// Kept compact and topic-focused; modern Google ignores meta keywords, but
// a small, honest list does no harm and helps a few smaller search engines.
export const DEFAULT_KEYWORDS = [
  "loan management software",
  "borrower management",
  "repayment tracking",
  "microfinance software",
  "lending platform",
].join(", ");

export interface SeoConfig {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function getSiteUrl() {
  const envUrl = (import.meta as ImportMeta).env?.VITE_SITE_URL?.trim();
  return (envUrl || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;

  return `${getSiteUrl()}${normalizedPath}`;
}

// ---------------------------------------------------------------------------
// JSON-LD builders
// ---------------------------------------------------------------------------

export function buildOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl(FALLBACK_IMAGE),
    email: "contactus@lendsmart.me",
    sameAs: [
      // Replace these with real profiles when you create them.
      "https://www.linkedin.com/company/lendsmart",
      "https://x.com/lendsmart",
      "https://www.youtube.com/@lendsmart",
    ],
  };
}

export function buildWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}

export function buildSoftwareStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: getSiteUrl(),
    image: absoluteUrl(FALLBACK_IMAGE),
    description: DEFAULT_DESCRIPTION,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: SUBSCRIPTION_PLANS.reduce(
        (max, plan) => (plan.price > max ? plan.price : max),
        0,
      ).toFixed(2),
      priceCurrency: "USD",
      offerCount: SUBSCRIPTION_PLANS.length.toString(),
    },
    featureList: [
      "Borrower management",
      "Loan origination",
      "Repayment tracking",
      "Lending reports and analytics",
      "Multi-user workspace with approvals",
      "Subscription billing",
    ].join(", "),
  };
}

export function buildBreadcrumbsStructuredData(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function buildFaqStructuredData(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildPricingProductsStructuredData() {
  return SUBSCRIPTION_PLANS.map((plan) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${SITE_NAME} ${plan.name}`,
    description: plan.features.join(", "),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: plan.price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/pricing"),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: plan.price.toFixed(2),
        priceCurrency: "USD",
        billingIncrement: 1,
        unitCode: "MON",
      },
    },
  }));
}

// ---------------------------------------------------------------------------
// Page-level SEO config
// ---------------------------------------------------------------------------

export const LANDING_FAQ: FaqItem[] = [
  {
    question: "What is LendSmart?",
    answer:
      "LendSmart is a cloud-based loan management platform for individual lenders, microfinance organisations, and small lending businesses. It helps you onboard borrowers, originate loans, record repayments, and review portfolio performance from one secure workspace.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The Free plan supports up to 10 borrowers and 20 loans with basic reporting and email support. You can upgrade to a paid plan at any time as your portfolio grows.",
  },
  {
    question: "Can I add team members and approval workflows?",
    answer:
      "Paid plans include multi-user workspaces with role-based permissions and an approval queue, so initiated borrowers and loans can be reviewed by an owner or admin before they go active.",
  },
  {
    question: "How secure is my data?",
    answer:
      "Data is transmitted over HTTPS/TLS and stored on Supabase, which uses encryption at rest, role-based access, and regular security reviews. You can export or delete your data at any time.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "Subscriptions are billed in USD through PayPal and activate after a successful capture. You can switch plans or cancel from the in-app subscription page.",
  },
  {
    question: "Do you support reminders for borrowers?",
    answer:
      "Starter plans include SMS reminders, Professional adds WhatsApp reminders, and Enterprise unlocks all reminder types so you can stay on top of upcoming and overdue repayments.",
  },
];

export function buildSeoConfig(pathname: string, isAuthenticated: boolean) {
  const homeStructuredData = [
    buildSoftwareStructuredData(),
    buildOrganizationStructuredData(),
    buildWebsiteStructuredData(),
    buildFaqStructuredData(LANDING_FAQ),
  ];

  const publicRoutes: Record<string, SeoConfig> = {
    "/": {
      title:
        "LendSmart - Loan Management Software for Lenders and Microfinance",
      description:
        "Manage borrowers, originate loans, record repayments, and review lending reports in LendSmart, the secure loan management software built for modern lenders.",
      path: "/",
      structuredData: homeStructuredData,
    },
    "/features": {
      title: "Features - LendSmart Loan Management Software",
      description:
        "See how LendSmart simplifies borrower management, loan origination, repayment tracking, lending reports, multi-user approvals, and subscription billing.",
      path: "/features",
      structuredData: [
        buildSoftwareStructuredData(),
        buildBreadcrumbsStructuredData([
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
        ]),
      ],
    },
    "/pricing": {
      title: "Pricing - LendSmart Plans for Every Lending Business",
      description:
        "Compare LendSmart plans. Start free, then scale to Starter, Professional, or Enterprise as your borrowers, loans, and team grow.",
      path: "/pricing",
      structuredData: [
        ...buildPricingProductsStructuredData(),
        buildBreadcrumbsStructuredData([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]),
      ],
    },
    "/terms": {
      title: "Terms of Service - LendSmart",
      description:
        "Review the terms and conditions for using the LendSmart loan management platform.",
      path: "/terms",
      type: "article",
      structuredData: buildBreadcrumbsStructuredData([
        { name: "Home", path: "/" },
        { name: "Terms of Service", path: "/terms" },
      ]),
    },
    "/privacy": {
      title: "Privacy Policy - LendSmart",
      description:
        "Learn how LendSmart collects, protects, and manages personal and financial information.",
      path: "/privacy",
      type: "article",
      structuredData: buildBreadcrumbsStructuredData([
        { name: "Home", path: "/" },
        { name: "Privacy Policy", path: "/privacy" },
      ]),
    },
  };

  if (pathname === "/login") {
    return {
      title: "Sign In - LendSmart",
      description:
        "Sign in to your LendSmart workspace to manage borrowers, loans, repayments, and reports.",
      path: "/login",
      noindex: true,
    };
  }

  if (pathname === "/reset-password") {
    return {
      title: "Reset Password - LendSmart",
      description: "Reset your LendSmart account password securely.",
      path: "/reset-password",
      noindex: true,
    };
  }

  if (publicRoutes[pathname]) {
    return publicRoutes[pathname];
  }

  // Authenticated app pages: never indexable.
  if (!isAuthenticated) {
    return publicRoutes["/"];
  }

  return {
    title: "LendSmart App",
    description:
      "Secure LendSmart workspace for managing borrowers, loans, repayments, reports, teams, and subscriptions.",
    path: pathname,
    noindex: true,
  };
}

// Public route paths, used for prerendering and sitemap generation.
export const PUBLIC_ROUTE_PATHS = [
  "/",
  "/features",
  "/pricing",
  "/terms",
  "/privacy",
] as const;

export type PublicRoutePath = (typeof PUBLIC_ROUTE_PATHS)[number];
