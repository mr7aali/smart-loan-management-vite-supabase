const PAYPAL_SDK_ID = "paypal-js-sdk";
let paypalSdkPromise: Promise<void> | null = null;

interface LoadPayPalSdkOptions {
  clientId: string;
  currency?: string;
  disableFunding?: string[];
}

function buildPayPalSdkSrc({
  clientId,
  currency = "USD",
  disableFunding = [],
}: LoadPayPalSdkOptions) {
  const params = new URLSearchParams({
    "client-id": clientId,
    currency,
    intent: "capture",
    components: "buttons",
  });

  if (disableFunding.length > 0) {
    params.set("disable-funding", disableFunding.join(","));
  }

  return `https://www.paypal.com/sdk/js?${params.toString()}`;
}

export function loadPayPalSdk(options: LoadPayPalSdkOptions): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PayPal SDK can only load in the browser."));
  }

  const scriptSrc = buildPayPalSdkSrc(options);
  const existingScript = document.getElementById(
    PAYPAL_SDK_ID,
  ) as HTMLScriptElement | null;

  if (window.paypal && existingScript?.src === scriptSrc) {
    return Promise.resolve();
  }

  if (paypalSdkPromise && existingScript?.src === scriptSrc) {
    return paypalSdkPromise;
  }

  if (existingScript && existingScript.src !== scriptSrc) {
    existingScript.remove();
    delete window.paypal;
    paypalSdkPromise = null;
  }

  paypalSdkPromise = new Promise<void>((resolve, reject) => {
    const currentScript = document.getElementById(
      PAYPAL_SDK_ID,
    ) as HTMLScriptElement | null;

    if (window.paypal && currentScript?.src === scriptSrc) {
      resolve();
      return;
    }

    if (currentScript) {
      currentScript.addEventListener("load", () => resolve(), { once: true });
      currentScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load the PayPal SDK.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = PAYPAL_SDK_ID;
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the PayPal SDK."));

    document.head.appendChild(script);
  }).catch((error) => {
    paypalSdkPromise = null;
    throw error;
  });

  return paypalSdkPromise;
}
