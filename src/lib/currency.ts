export type AppCurrency = "USD" | "EUR" | "ZAR" | "LSL";

export const DEFAULT_CURRENCY: AppCurrency = "USD";

export const SUPPORTED_CURRENCIES: Array<{
  code: AppCurrency;
  label: string;
}> = [
  { code: "ZAR", label: "Rand (ZAR)" },
  { code: "LSL", label: "Maluti (M)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "USD", label: "Dollar ($)" },
];

const currencyLocales: Record<AppCurrency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  ZAR: "en-ZA",
  LSL: "en-LS",
};

export function normalizeCurrency(value?: string | null): AppCurrency {
  if (value === "USD" || value === "EUR" || value === "ZAR" || value === "LSL") {
    return value;
  }

  return DEFAULT_CURRENCY;
}

export function formatCurrency(
  amount: number,
  currency: AppCurrency = DEFAULT_CURRENCY,
): string {
  const normalizedCurrency = normalizeCurrency(currency);

  return new Intl.NumberFormat(currencyLocales[normalizedCurrency], {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(
  amount: number,
  currency: AppCurrency = DEFAULT_CURRENCY,
): string {
  const normalizedCurrency = normalizeCurrency(currency);

  return new Intl.NumberFormat(currencyLocales[normalizedCurrency], {
    style: "currency",
    currency: normalizedCurrency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
