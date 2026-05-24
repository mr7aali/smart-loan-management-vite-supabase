import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, X } from 'lucide-react';
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { loadPayPalSdk } from '../lib/paypal';
import { PaidSubscriptionPlanId, SUBSCRIPTION_PLANS_BY_ID } from '../lib/subscription-plans';
import { Subscription } from '../types';

interface PayPalCheckoutModalProps {
  planId: PaidSubscriptionPlanId;
  onClose: () => void;
  onSuccess: (subscription: Subscription) => void;
}

async function getFunctionErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json();
      if (typeof payload?.error === 'string' && payload.error.trim()) {
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
    return 'Supabase relay could not process the payment request. Check the deployed Edge Function logs.';
  }

  if (error instanceof FunctionsFetchError) {
    return 'Could not reach the Supabase Edge Function. Redeploy the function and make sure its secrets are set.';
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function PayPalCheckoutModal({
  planId,
  onClose,
  onSuccess,
}: PayPalCheckoutModalProps) {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const paypalCurrency = import.meta.env.VITE_PAYPAL_CURRENCY || 'USD';
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS_BY_ID[planId];

  useEffect(() => {
    let active = true;

    if (!paypalClientId) {
      setError('Missing VITE_PAYPAL_CLIENT_ID. Add it before using PayPal checkout.');
      return undefined;
    }

    loadPayPalSdk({
      clientId: paypalClientId,
      currency: paypalCurrency,
    })
      .then(() => {
        if (active) {
          setSdkReady(true);
        }
      })
      .catch((sdkError) => {
        console.error('Failed to load PayPal SDK:', sdkError);
        if (active) {
          setError('Unable to load PayPal checkout right now. Please try again.');
        }
      });

    return () => {
      active = false;
    };
  }, [paypalClientId, paypalCurrency]);

  useEffect(() => {
    if (!sdkReady || !buttonContainerRef.current || !window.paypal) {
      return undefined;
    }

    const container = buttonContainerRef.current;
    container.innerHTML = '';

    const buttons = window.paypal.Buttons({
      style: {
        color: 'blue',
        height: 46,
        label: 'pay',
        layout: 'vertical',
        shape: 'rect',
      },
      createOrder: async () => {
        setError(null);

        const { data, error: invokeError } = await supabase.functions.invoke(
          'paypal-create-order',
          {
            body: { plan: plan.id },
          },
        );

        if (invokeError || !data?.orderId) {
          console.error('Failed to create PayPal order:', invokeError);
          const message = await getFunctionErrorMessage(
            invokeError,
            'Could not start the PayPal checkout. Please try again.',
          );
          setError(message);
          throw new Error('PayPal order creation failed.');
        }

        return data.orderId as string;
      },
      onApprove: async (data) => {
        setProcessing(true);
        setError(null);

        const { data: captureData, error: captureError } =
          await supabase.functions.invoke('paypal-capture-order', {
            body: {
              orderId: data.orderID,
              plan: plan.id,
            },
          });

        if (captureError || !captureData?.subscription) {
          console.error('Failed to capture PayPal order:', captureError);
          const message = await getFunctionErrorMessage(
            captureError,
            'Payment approval succeeded, but final confirmation failed.',
          );
          setError(message);
          setProcessing(false);
          return;
        }

        setProcessing(false);
        onSuccess(captureData.subscription as Subscription);
      },
      onCancel: () => {
        setProcessing(false);
      },
      onError: (paypalError) => {
        console.error('PayPal checkout error:', paypalError);
        setProcessing(false);
        const fallback =
          paypalError instanceof Error && paypalError.message.trim()
            ? paypalError.message
            : 'PayPal was unable to complete this payment. Please try again.';
        setError((currentError) => currentError ?? fallback);
      },
    });

    void buttons.render(container);

    return () => {
      container.innerHTML = '';
      void buttons.close?.();
    };
  }, [onSuccess, plan.id, sdkReady]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">
          <div>
            <p className="text-sm font-medium text-indigo-600">Secure PayPal Checkout</p>
            <h2 className="text-xl font-bold text-gray-900">Upgrade to {plan.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-indigo-700">Selected plan</p>
                <p className="text-lg font-semibold text-indigo-950">{plan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-indigo-700">Amount</p>
                <p className="text-2xl font-bold text-indigo-950">
                  ${plan.price}
                  <span className="ml-1 text-sm font-medium text-indigo-700">
                    {paypalCurrency}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p>
              Your subscription is activated only after PayPal confirms the payment on the
              server.
            </p>
          </div>

          {processing && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>Finalizing your payment and updating your subscription...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!sdkReady && !error && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Loading PayPal checkout...
            </div>
          )}

          <div ref={buttonContainerRef} className="min-h-[46px]" />
        </div>
      </div>
    </div>
  );
}
