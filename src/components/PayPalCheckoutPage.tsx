import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
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

async function getFunctionErrorMessage(
  error: unknown,
  fallback: string,
) {
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

export default function PayPalCheckoutPage({
  planId,
  onBack,
  onSuccess,
}: PayPalCheckoutPageProps) {
  const paypalCurrency = import.meta.env.VITE_PAYPAL_CURRENCY || "USD";
  const hasHandledReturnRef = useRef(false);
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS_BY_ID[planId];

  function buildCheckoutUrl(cancelled = false) {
    const url = new URL(window.location.href);
    const checkoutParams = [
      "paypalCheckout",
      "plan",
      "token",
      "PayerID",
      "ba_token",
      "cancelled",
    ];

    for (const param of checkoutParams) {
      url.searchParams.delete(param);
    }

    url.searchParams.set("paypalCheckout", "1");
    url.searchParams.set("plan", plan.id);

    if (cancelled) {
      url.searchParams.set("cancelled", "1");
    }

    return url.toString();
  }

  function clearCheckoutStateFromUrl() {
    const url = new URL(window.location.href);
    const checkoutParams = [
      "paypalCheckout",
      "plan",
      "token",
      "PayerID",
      "ba_token",
      "cancelled",
    ];

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
          setError("Unable to load PayPal checkout right now. Please try again.");
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

    const buttons = window.paypal.Buttons({
      style: {
        color: "blue",
        height: 48,
        label: "pay",
        layout: "vertical",
        shape: "rect",
        tagline: false,
      },
      createOrder: async () => {
        setError(null);
        setStatusMessage(null);

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
          throw new Error("PayPal order creation failed.");
        }

        return data.orderId as string;
      },
      onApprove: async (data) => {
        setProcessing(true);
        setStatusMessage("Finalizing your payment and updating your subscription...");
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
          setProcessing(false);
          setStatusMessage(null);
          return;
        }

        onSuccess(captureData.subscription as Subscription);
      },
      onCancel: () => {
        setProcessing(false);
        setStatusMessage(null);
      },
      onError: (paypalError) => {
        console.error("PayPal checkout error:", paypalError);
        setProcessing(false);
        setStatusMessage(null);
        const fallback =
          paypalError instanceof Error && paypalError.message.trim()
            ? paypalError.message
            : "PayPal was unable to complete this payment. Please try again.";
        setError((currentError) => currentError ?? fallback);
      },
    });

    if (buttons.isEligible && !buttons.isEligible()) {
      setError("This PayPal button is not eligible for the current browser or account configuration.");
      return undefined;
    }

    void buttons.render(container);

    return () => {
      container.innerHTML = "";
      void buttons.close?.();
    };
  }, [onSuccess, plan.id, sdkReady]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const returnedPlan = searchParams.get("plan");
    const orderId = searchParams.get("token");
    const checkoutCancelled = searchParams.get("cancelled") === "1";

    if (returnedPlan !== plan.id) {
      return;
    }

    if (checkoutCancelled) {
      setError("PayPal checkout was cancelled before payment approval.");
      clearCheckoutStateFromUrl();
      return;
    }

    if (!orderId || hasHandledReturnRef.current) {
      return;
    }

    hasHandledReturnRef.current = true;
    setProcessing(true);
    setStatusMessage("Confirming your PayPal payment...");
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
          setProcessing(false);
          setStatusMessage(null);
          clearCheckoutStateFromUrl();
          return;
        }

        clearCheckoutStateFromUrl();
        onSuccess(data.subscription as Subscription);
      });
  }, [onSuccess, plan.id]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        disabled={processing}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to plans
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl">
          <div className="space-y-6 p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">
              <ShieldCheck className="h-4 w-4" />
              Secure Checkout
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Complete your upgrade to {plan.name}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Your subscription is upgraded only after PayPal confirms the payment
                on the server. No plan change is applied before capture succeeds.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
                  Plan
                </p>
                <p className="mt-2 text-2xl font-semibold">{plan.name}</p>
                <p className="mt-1 text-sm text-slate-300">
                  Monthly subscription
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
                  Amount
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  ${plan.price}
                  <span className="ml-2 text-sm font-medium text-slate-300">
                    {paypalCurrency}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Billed today
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />
                <div>
                  <p className="font-semibold">Production-safe payment flow</p>
                  <p className="mt-1 text-emerald-100/90">
                    The order is created server-side, captured server-side, and your
                    subscription is written only after PayPal confirms the payment.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
              <p className="font-semibold">Testing tip</p>
              <p className="mt-1 text-amber-100/90">
                Use a buyer PayPal account for checkout. PayPal will block payments if
                you log in with the same merchant account that receives the money.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
              <p className="font-semibold">Funding sources on this checkout</p>
              <p className="mt-1 text-slate-300">
                Pay Later, Venmo, and PayPal Credit are disabled. If your PayPal
                merchant account is eligible, the debit or credit card option can
                still appear alongside the regular PayPal button.
              </p>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-indigo-600">Pay with PayPal</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                Finish payment
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Use PayPal or an eligible debit or credit card option shown by
                PayPal for this checkout.
              </p>
            </div>

            {statusMessage && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!sdkReady && !error && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Loading PayPal checkout...
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div ref={buttonContainerRef} className="min-h-[48px]" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs leading-6 text-gray-500">
              By continuing, you authorize this payment for the selected plan. Your
              account will update only after the server verifies the capture amount,
              user, and plan.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
