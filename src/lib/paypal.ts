const PAYPAL_SDK_ID = 'paypal-js-sdk';
let paypalSdkPromise: Promise<void> | null = null;

interface LoadPayPalSdkOptions {
  clientId: string;
  currency?: string;
}

export function loadPayPalSdk({
  clientId,
  currency = 'USD',
}: LoadPayPalSdkOptions): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PayPal SDK can only load in the browser.'));
  }

  if (window.paypal) {
    return Promise.resolve();
  }

  if (paypalSdkPromise) {
    return paypalSdkPromise;
  }

  paypalSdkPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      PAYPAL_SDK_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(undefined), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load the PayPal SDK.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    const params = new URLSearchParams({
      'client-id': clientId,
      currency,
      intent: 'capture',
      components: 'buttons',
    });

    script.id = PAYPAL_SDK_ID;
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.onload = () => resolve(undefined);
    script.onerror = () => reject(new Error('Failed to load the PayPal SDK.'));

    document.head.appendChild(script);
  }).catch((error) => {
    paypalSdkPromise = null;
    throw error;
  });

  return paypalSdkPromise;
}
