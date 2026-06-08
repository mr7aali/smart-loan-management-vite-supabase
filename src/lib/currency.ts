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

const currencySymbols: Record<AppCurrency, string> = {
  USD: "$",
  EUR: "€",
  ZAR: "R",
  LSL: "M",
};

const currenciesWithoutSymbolSpacing = new Set<AppCurrency>(["USD", "EUR"]);

export function normalizeCurrency(value?: string | null): AppCurrency {
  if (value === "USD" || value === "EUR" || value === "ZAR" || value === "LSL") {
    return value;
  }

  return DEFAULT_CURRENCY;
}

function formatWithCurrencySymbol(
  amount: number,
  currency: AppCurrency,
  options: Intl.NumberFormatOptions,
) {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const absoluteAmount = Math.abs(normalizedAmount);
  const formattedAmount = new Intl.NumberFormat(
    currencyLocales[currency],
    options,
  ).format(absoluteAmount);
  const symbol = currencySymbols[currency];
  const separator = currenciesWithoutSymbolSpacing.has(currency) ? "" : " ";
  const sign = normalizedAmount < 0 ? "-" : "";

  return `${sign}${symbol}${separator}${formattedAmount}`;
}

export function formatCurrency(
  amount: number,
  currency: AppCurrency = DEFAULT_CURRENCY,
): string {
  const normalizedCurrency = normalizeCurrency(currency);

  return formatWithCurrencySymbol(amount, normalizedCurrency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatCompactCurrency(
  amount: number,
  currency: AppCurrency = DEFAULT_CURRENCY,
): string {
  const normalizedCurrency = normalizeCurrency(currency);

  return formatWithCurrencySymbol(amount, normalizedCurrency, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}
