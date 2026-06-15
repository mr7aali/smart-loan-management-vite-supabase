export const SITE_NAME = "LendSmart";
export const DEFAULT_SITE_URL = "https://www.lendsmart.me";
export const DEFAULT_IMAGE = "/images/logo.png";
export const DEFAULT_KEYWORDS = [
  "loan management software",
  "loan tracking software",
  "borrower management",
  "repayment tracking",
  "lending software",
  "microfinance software",
  "credit management",
  "loan management system",
].join(", ");

export interface SeoConfig {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  structuredData?: Record<string, unknown>;
}

export function getSiteUrl() {
  const envUrl = import.meta.env.VITE_SITE_URL?.trim();
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

export function buildSoftwareStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: getSiteUrl(),
    image: absoluteUrl(DEFAULT_IMAGE),
    description:
      "Loan management software for tracking borrowers, loans, repayments, subscriptions, and financial reports.",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "99",
      priceCurrency: "USD",
    },
  };
}

export function buildSeoConfig(pathname: string, isAuthenticated: boolean) {
  const publicRoutes: Record<string, SeoConfig> = {
    "/": {
      title: "LendSmart - Smart Loan Management Software",
      description:
        "Manage borrowers, track loans, record repayments, and view lending reports in one secure loan management platform.",
      path: "/",
      structuredData: buildSoftwareStructuredData(),
    },
    "/terms": {
      title: "Terms of Service - LendSmart",
      description:
        "Review the terms and conditions for using the LendSmart loan management platform.",
      path: "/terms",
      type: "article",
    },
    "/privacy": {
      title: "Privacy Policy - LendSmart",
      description:
        "Learn how LendSmart collects, protects, and manages personal and financial information.",
      path: "/privacy",
      type: "article",
    },
  };

  if (pathname === "/reset-password") {
    return {
      title: "Reset Password - LendSmart",
      description: "Reset your LendSmart account password securely.",
      path: "/reset-password",
      noindex: true,
    };
  }

  if (publicRoutes[pathname] && (pathname !== "/" || !isAuthenticated)) {
    return publicRoutes[pathname];
  }

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
