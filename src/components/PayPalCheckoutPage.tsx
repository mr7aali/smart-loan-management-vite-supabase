import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
} from "lucide-react";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { loadPayPalSdk } from "../lib/paypal";
import {
  PaidSubscriptionPlanId,
  SUBSCRIPTION_PLANS_BY_ID,
} from "../lib/subscription-plans";
import { Subscription } from "../types";

interface PayPalCheckoutPageProps {
  planId: PaidSubscriptionPlanId;
  onBack: () => void;
  onSuccess: (subscription: Subscription) => void;
}

type CheckoutStage =
  | "idle"
  | "creating_order"
  | "awaiting_approval"
  | "capturing_payment";

async function getFunctionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json();
      if (typeof payload?.error === "string" && payload.error.trim()) {
        return payload.error;
      }
    } catch {
      try {
        const text = await error.context.text();
        if (text.trim()) {
          return text;
        }
      } catch {
        return fallback;
      }
    }
  }

  if (error instanceof FunctionsRelayError) {
    return "Supabase relay could not process the payment request. Check the deployed Edge Function logs.";
  }

  if (error instanceof FunctionsFetchError) {
    return "Could not reach the payment service. Redeploy the Edge Functions and verify the PayPal secrets.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function normalizeFundingSource(
  fundingSource?: string | null,
): PayPalFundingSource {
  switch (fundingSource) {
    case "card":
    case "credit":
    case "paylater":
    case "paypal":
    case "venmo":
      return fundingSource;
    default:
      return "paypal";
  }
}

function getFundingSourceLabel(fundingSource?: string | null) {
  switch (normalizeFundingSource(fundingSource)) {
    case "card":
      return "Debit or credit card";
    case "credit":
      return "PayPal Credit";
    case "paylater":
      return "Pay Later";
    case "venmo":
      return "Venmo";
    default:
      return "PayPal";
  }
}

function getCheckoutStatusMessage(
  stage: Exclude<CheckoutStage, "idle">,
  fundingSource?: string | null,
) {
  const normalizedFundingSource = normalizeFundingSource(fundingSource);

  if (stage === "creating_order") {
    return normalizedFundingSource === "card"
      ? "Preparing the secure debit or credit card checkout window..."
      : "Preparing the secure PayPal checkout window...";
  }

  if (stage === "awaiting_approval") {
    return normalizedFundingSource === "card"
      ? "Complete your debit or credit card details in the PayPal window to finish the payment."
      : "Approve the payment in the PayPal window to continue.";
  }

  return normalizedFundingSource === "card"
    ? "Finalizing your card payment and activating your subscription..."
    : "Finalizing your PayPal payment and activating your subscription...";
}

function enablePayPalIframePermissions(container: HTMLElement) {
  const iframes = container.querySelectorAll("iframe");

  for (const iframe of iframes) {
    const existingTokens = (iframe.getAttribute("allow") ?? "")
      .split(";")
      .map((token) => token.trim())
      .filter(Boolean);
    const nextTokens = new Set(existingTokens);

    nextTokens.add("payment *");
    nextTokens.add("unload *");

    iframe.setAttribute("allow", Array.from(nextTokens).join("; "));
  }
}

export default function PayPalCheckoutPage({
  planId,
  onBack,
  onSuccess,
}: PayPalCheckoutPageProps) {
  const paypalCurrency = import.meta.env.VITE_PAYPAL_CURRENCY || "USD";
  const hasHandledReturnRef = useRef(false);
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedFundingSourceRef = useRef<PayPalFundingSource | null>(null);
  const [checkoutStage, setCheckoutStage] = useState<CheckoutStage>("idle");
  const [selectedFundingSource, setSelectedFundingSource] =
    useState<PayPalFundingSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS_BY_ID[planId];
  const isBusy =
    checkoutStage === "creating_order" || checkoutStage === "capturing_payment";
  const isWaitingForApproval = checkoutStage === "awaiting_approval";
  const isCheckoutLocked = checkoutStage !== "idle";
  const loadingOverlayTitle =
    checkoutStage === "capturing_payment"
      ? selectedFundingSource === "card"
        ? "Finalizing card payment"
        : "Finalizing PayPal payment"
      : selectedFundingSource === "card"
        ? "Preparing card checkout"
        : "Preparing PayPal checkout";
  const loadingOverlayDescription =
    checkoutStage === "capturing_payment"
      ? "Please wait while we verify the payment and update your subscription."
      : "Please wait while we create your secure order.";

  function setActiveFundingSource(fundingSource?: string | null) {
    const normalizedFundingSource = normalizeFundingSource(
      fundingSource ?? selectedFundingSourceRef.current,
    );
    selectedFundingSourceRef.current = normalizedFundingSource;
    setSelectedFundingSource(normalizedFundingSource);
    return normalizedFundingSource;
  }

  function setCheckoutProgress(
    stage: Exclude<CheckoutStage, "idle">,
    fundingSource?: string | null,
    customMessage?: string,
  ) {
    const normalizedFundingSource = setActiveFundingSource(fundingSource);
    setCheckoutStage(stage);
    setStatusMessage(
      customMessage ?? getCheckoutStatusMessage(stage, normalizedFundingSource),
    );
  }

  function resetCheckoutProgress(preserveFundingSource = false) {
    setCheckoutStage("idle");
    setStatusMessage(null);

    if (!preserveFundingSource) {
      selectedFundingSourceRef.current = null;
      setSelectedFundingSource(null);
    }
  }

  function buildCheckoutUrl(cancelled = false) {
    const url = new URL(window.location.href);
    const checkoutParams = ["token", "PayerID", "ba_token", "cancelled"];

    for (const param of checkoutParams) {
      url.searchParams.delete(param);
    }

    if (cancelled) {
      url.searchParams.set("cancelled", "1");
    }

    return url.toString();
  }

  function clearCheckoutStateFromUrl() {
    const url = new URL(window.location.href);
    const checkoutParams = ["token", "PayerID", "ba_token", "cancelled"];

    for (const param of checkoutParams) {
      url.searchParams.delete(param);
    }

    window.history.replaceState({}, document.title, url.toString());
  }

  useEffect(() => {
    let active = true;

    loadPayPalSdk({
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
      currency: paypalCurrency,
      disableFunding: ["paylater", "credit", "venmo"],
    })
      .then(() => {
        if (active) {
          setSdkReady(true);
        }
      })
      .catch((sdkError) => {
        console.error("Failed to load PayPal SDK:", sdkError);
        if (active) {
          setError(
            "Unable to load PayPal checkout right now. Please try again.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [paypalCurrency]);

  useEffect(() => {
    if (!sdkReady || !buttonContainerRef.current || !window.paypal) {
      return undefined;
    }

    const container = buttonContainerRef.current;
    container.innerHTML = "";
    const iframeObserver = new MutationObserver(() => {
      enablePayPalIframePermissions(container);
    });
    iframeObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    const buttons = window.paypal.Buttons({
      style: {
        color: "gold",
        height: 48,
        label: "pay",
        layout: "vertical",
        shape: "rect",
        tagline: false,
      },
      createOrder: async () => {
        setError(null);
        const fundingSource = setActiveFundingSource();
        setCheckoutProgress("creating_order", fundingSource);

        const { data, error: invokeError } = await supabase.functions.invoke(
          "paypal-create-order",
          {
            body: {
              cancelUrl: buildCheckoutUrl(true),
              plan: plan.id,
              returnUrl: buildCheckoutUrl(false),
            },
          },
        );

        if (invokeError || !data?.orderId) {
          console.error("Failed to create PayPal order:", invokeError);
          const message = await getFunctionErrorMessage(
            invokeError,
            "Could not start the PayPal checkout. Please try again.",
          );
          setError(message);
          resetCheckoutProgress(true);
          throw new Error("PayPal order creation failed.");
        }

        setCheckoutProgress("awaiting_approval", fundingSource);
        return data.orderId as string;
      },
      onClick: (data) => {
        setError(null);
        setCheckoutProgress("creating_order", data.fundingSource);
      },
      onApprove: async (data) => {
        setCheckoutProgress("capturing_payment");
        setError(null);

        const { data: captureData, error: captureError } =
          await supabase.functions.invoke("paypal-capture-order", {
            body: {
              orderId: data.orderID,
              plan: plan.id,
            },
          });

        if (captureError || !captureData?.subscription) {
          console.error("Failed to capture PayPal order:", captureError);
          const message = await getFunctionErrorMessage(
            captureError,
            "Payment approval succeeded, but final confirmation failed.",
          );
          setError(message);
          resetCheckoutProgress(true);
          return;
        }

        onSuccess(captureData.subscription as Subscription);
      },
      onCancel: () => {
        const fundingSourceLabel = getFundingSourceLabel(
          selectedFundingSourceRef.current,
        );
        resetCheckoutProgress();
        setError(
          `${fundingSourceLabel} checkout was cancelled before payment approval.`,
        );
      },
      onError: (paypalError) => {
        console.error("PayPal checkout error:", paypalError);
        const fundingSourceLabel = getFundingSourceLabel(
          selectedFundingSourceRef.current,
        );
        resetCheckoutProgress(true);
        const fallback =
          paypalError instanceof Error && paypalError.message.trim()
            ? paypalError.message
            : `${fundingSourceLabel} was unable to complete this payment. Please try again.`;
        setError((currentError) => currentError ?? fallback);
      },
    });

    if (buttons.isEligible && !buttons.isEligible()) {
      setError(
        "This PayPal button is not eligible for the current browser or account configuration.",
      );
      return undefined;
    }

    void buttons.render(container).catch((renderError) => {
      console.error("Failed to render PayPal buttons:", renderError);
      setError(
        "Unable to display payment methods right now. Please refresh and try again.",
      );
    });
    enablePayPalIframePermissions(container);

    return () => {
      iframeObserver.disconnect();
      container.innerHTML = "";
      void buttons.close?.();
    };
  }, [onSuccess, plan.id, sdkReady]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const orderId = searchParams.get("token");
    const checkoutCancelled = searchParams.get("cancelled") === "1";

    if (checkoutCancelled) {
      resetCheckoutProgress();
      setError("The payment window was cancelled before approval.");
      clearCheckoutStateFromUrl();
      return;
    }

    if (!orderId || hasHandledReturnRef.current) {
      return;
    }

    hasHandledReturnRef.current = true;
    setCheckoutProgress(
      "capturing_payment",
      selectedFundingSourceRef.current,
      "Confirming your payment and updating your subscription...",
    );
    setError(null);

    void supabase.functions
      .invoke("paypal-capture-order", {
        body: {
          orderId,
          plan: plan.id,
        },
      })
      .then(async ({ data, error: captureError }) => {
        if (captureError || !data?.subscription) {
          console.error("Failed to capture PayPal order:", captureError);
          const message = await getFunctionErrorMessage(
            captureError,
            "Payment approval succeeded, but final confirmation failed.",
          );
          setError(message);
          resetCheckoutProgress(true);
          clearCheckoutStateFromUrl();
          return;
        }

        clearCheckoutStateFromUrl();
        onSuccess(data.subscription as Subscription);
      });
  }, [onSuccess, plan.id]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button
        type="button"
        onClick={onBack}
        disabled={isCheckoutLocked}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to plans
      </button>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Secure payment
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {plan.name} plan
            </div>
          </div>

          <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-[2rem]">
            Complete your subscription payment
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Choose PayPal or an eligible debit or credit card option. Your
            subscription activates only after the payment is verified on the
            server.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <Lock className="h-4 w-4 text-emerald-600" />
              Encrypted checkout
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <CreditCard className="h-4 w-4 text-amber-600" />
              PayPal and eligible cards
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {statusMessage && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {isWaitingForApproval ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                ) : (
                  <div className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
                )}
                <div>
                  <p className="font-semibold">
                    {isWaitingForApproval
                      ? "Continue in the PayPal window"
                      : "Payment in progress"}
                  </p>
                  <p className="mt-1">{statusMessage}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">
                  Pay with PayPal or card
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Clicking a button opens PayPal&apos;s secure checkout for this
                  payment.
                </p>
              </div>

              <div
                className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4"
                aria-busy={isCheckoutLocked || !sdkReady}
              >
                <div
                  ref={buttonContainerRef}
                  className={`min-h-[110px] transition-opacity ${
                    isCheckoutLocked ? "pointer-events-none opacity-60" : ""
                  } ${!sdkReady ? "opacity-0" : "opacity-100"}`}
                />

                {!sdkReady && !error && (
                  <div className="absolute inset-4 flex flex-col justify-center gap-3 rounded-2xl bg-slate-50">
                    <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
                    <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
                    <p className="text-sm text-slate-500">
                      Loading available payment methods...
                    </p>
                  </div>
                )}

                {isBusy && (
                  <div className="absolute inset-4 flex items-center justify-center rounded-2xl bg-white/85 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {loadingOverlayTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {loadingOverlayDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Order summary
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Monthly subscription billed in {paypalCurrency}.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Due today
              </p>
              <p className="mt-3 text-4xl font-semibold text-slate-900">
                ${plan.price}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {paypalCurrency} / month
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm">
                <span className="text-slate-500">Plan</span>
                <span className="font-medium text-slate-900">{plan.name}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm">
                <span className="text-slate-500">Billing cycle</span>
                <span className="font-medium text-slate-900">Monthly</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-3 text-sm">
                <span className="text-slate-500">Activation</span>
                <span className="font-medium text-slate-900">
                  After payment confirmation
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
