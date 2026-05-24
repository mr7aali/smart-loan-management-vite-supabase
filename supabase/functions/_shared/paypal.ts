import { HttpError } from "./cors.ts";
import { PaidSubscriptionPlanId, PLAN_DETAILS } from "./plans.ts";

function getRequiredEnv(name: string, aliases: string[] = []) {
  const envNames = [name, ...aliases];

  for (const envName of envNames) {
    const value = Deno.env.get(envName)?.trim();

    if (value) {
      return value;
    }
  }

  const aliasText = aliases.length > 0 ? ` (or ${aliases.join(', ')})` : '';
  throw new HttpError(
    500,
    `Missing required PayPal secret: ${name}${aliasText}.`,
  );
}

function getPayPalConfig() {
  const paypalClientId = getRequiredEnv("PAYPAL_CLIENT_ID");
  const paypalClientSecret = getRequiredEnv("PAYPAL_CLIENT_SECRET", [
    "PAYPAL_SECRET",
  ]);
  const paypalEnvironment =
    Deno.env.get("PAYPAL_ENV")?.trim().toLowerCase() ?? "sandbox";
  const paypalBaseUrl =
    paypalEnvironment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  return {
    paypalBaseUrl,
    paypalClientId,
    paypalClientSecret,
  };
}

interface PayPalPurchaseUnit {
  reference_id?: string;
  custom_id?: string;
  amount?: {
    currency_code?: string;
    value?: string;
  };
  payments?: {
    captures?: Array<{
      id?: string;
      status?: string;
      amount?: {
        currency_code?: string;
        value?: string;
      };
    }>;
  };
}

interface PayPalOrderResponse {
  id?: string;
  status?: string;
  purchase_units?: PayPalPurchaseUnit[];
}

async function getPayPalAccessToken() {
  const { paypalBaseUrl, paypalClientId, paypalClientSecret } =
    getPayPalConfig();
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new HttpError(
      502,
      `Unable to authenticate with PayPal: ${body || response.statusText}`,
    );
  }

  const payload = await response.json();

  if (!payload.access_token) {
    throw new HttpError(502, "PayPal access token was not returned.");
  }

  return payload.access_token as string;
}

export async function createPayPalOrder(
  userId: string,
  planId: PaidSubscriptionPlanId,
) {
  const plan = PLAN_DETAILS[planId];
  const { paypalBaseUrl } = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: planId,
          custom_id: userId,
          description: `LendSmart ${plan.name} plan`,
          amount: {
            currency_code: "USD",
            value: plan.price.toFixed(2),
          },
        },
      ],
    }),
  });

  const payload = (await response.json()) as PayPalOrderResponse;

  if (!response.ok || !payload.id) {
    const details = JSON.stringify(payload);
    throw new HttpError(
      502,
      `PayPal could not create the order for this subscription.${details ? ` Details: ${details}` : ""}`,
    );
  }

  return payload.id;
}

export async function capturePayPalOrder(
  orderId: string,
  userId: string,
  planId: PaidSubscriptionPlanId,
) {
  const plan = PLAN_DETAILS[planId];
  const { paypalBaseUrl } = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    },
  );

  const payload = (await response.json()) as PayPalOrderResponse;

  if (!response.ok) {
    const details = JSON.stringify(payload);
    throw new HttpError(
      502,
      `PayPal did not confirm the order capture for this payment.${details ? ` Details: ${details}` : ""}`,
    );
  }

  const purchaseUnit = payload.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  const capturedAmount = Number(capture?.amount?.value ?? 0);
  const capturedCurrency = capture?.amount?.currency_code;

  if (payload.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
    throw new HttpError(400, "PayPal payment capture did not complete.");
  }

  if (
    purchaseUnit?.custom_id !== userId ||
    purchaseUnit.reference_id !== planId
  ) {
    throw new HttpError(400, "PayPal order verification failed for this user.");
  }

  if (capturedCurrency !== "USD" || capturedAmount !== plan.price) {
    throw new HttpError(
      400,
      "PayPal captured an unexpected amount for this subscription.",
    );
  }

  return {
    captureId: capture?.id ?? orderId,
  };
}
