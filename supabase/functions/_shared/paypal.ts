import { HttpError } from "./cors.ts";
import { PaidSubscriptionPlanId, PLAN_DETAILS } from "./plans.ts";

type PayPalEnvironment = "live" | "sandbox";

interface PayPalConfig {
  paypalBaseUrl: string;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalEnvironment: PayPalEnvironment;
}

interface PayPalAuthContext {
  accessToken: string;
  paypalBaseUrl: string;
  paypalEnvironment: PayPalEnvironment;
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
      custom_id?: string;
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
  links?: Array<{
    href?: string;
    rel?: string;
    method?: string;
  }>;
  purchase_units?: PayPalPurchaseUnit[];
}

function getRequiredEnv(name: string, aliases: string[] = []) {
  const envNames = [name, ...aliases];

  for (const envName of envNames) {
    const value = Deno.env.get(envName)?.trim();

    if (value) {
      return value;
    }
  }

  const aliasText = aliases.length > 0 ? ` (or ${aliases.join(", ")})` : "";
  throw new HttpError(
    500,
    `Missing required PayPal secret: ${name}${aliasText}.`,
  );
}

function getConfiguredPayPalEnvironment(): PayPalEnvironment {
  const configuredEnvironment =
    Deno.env.get("PAYPAL_ENV")?.trim().toLowerCase() ??
    Deno.env.get("PAYPAL_MODE")?.trim().toLowerCase() ??
    "sandbox";

  return configuredEnvironment === "live" ? "live" : "sandbox";
}

function createPayPalConfig(
  paypalEnvironment: PayPalEnvironment,
): PayPalConfig {
  const paypalClientId = getRequiredEnv("PAYPAL_CLIENT_ID");
  const paypalClientSecret = getRequiredEnv("PAYPAL_CLIENT_SECRET", [
    "PAYPAL_SECRET",
  ]);
  const paypalBaseUrl =
    paypalEnvironment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  return {
    paypalBaseUrl,
    paypalClientId,
    paypalClientSecret,
    paypalEnvironment,
  };
}

async function requestPayPalAccessToken(config: PayPalConfig) {
  const { paypalBaseUrl, paypalClientId, paypalClientSecret } = config;
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  return {
    body: await response.text(),
    ok: response.ok,
    status: response.status,
  };
}

async function getPayPalAuthContext(): Promise<PayPalAuthContext> {
  const configuredEnvironment = getConfiguredPayPalEnvironment();
  const configuredConfig = createPayPalConfig(configuredEnvironment);
  const configuredResponse = await requestPayPalAccessToken(configuredConfig);

  if (configuredResponse.ok) {
    const payload = JSON.parse(configuredResponse.body);

    if (!payload.access_token) {
      throw new HttpError(502, "PayPal access token was not returned.");
    }

    return {
      accessToken: payload.access_token as string,
      paypalBaseUrl: configuredConfig.paypalBaseUrl,
      paypalEnvironment: configuredConfig.paypalEnvironment,
    };
  }

  const configuredBody =
    configuredResponse.body || "Unknown PayPal authentication error.";
  const shouldTryAlternateEnvironment =
    configuredResponse.status === 401 &&
    configuredBody.includes('"invalid_client"');

  if (shouldTryAlternateEnvironment) {
    const alternateEnvironment: PayPalEnvironment =
      configuredEnvironment === "live" ? "sandbox" : "live";
    const alternateConfig = createPayPalConfig(alternateEnvironment);
    const alternateResponse = await requestPayPalAccessToken(alternateConfig);

    if (alternateResponse.ok) {
      const payload = JSON.parse(alternateResponse.body);

      if (!payload.access_token) {
        throw new HttpError(502, "PayPal access token was not returned.");
      }

      return {
        accessToken: payload.access_token as string,
        paypalBaseUrl: alternateConfig.paypalBaseUrl,
        paypalEnvironment: alternateConfig.paypalEnvironment,
      };
    }
  }

  throw new HttpError(
    502,
    `Unable to authenticate with PayPal: ${configuredBody}`,
  );
}

async function getPayPalOrderDetails(
  orderId: string,
  accessToken: string,
  paypalBaseUrl: string,
) {
  const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json()) as PayPalOrderResponse;

  if (!response.ok || !payload.id) {
    const details = JSON.stringify(payload);
    throw new HttpError(
      502,
      `PayPal order verification details could not be loaded.${details ? ` Details: ${details}` : ""}`,
    );
  }

  return payload;
}

export async function createPayPalOrder(
  userId: string,
  planId: PaidSubscriptionPlanId,
  returnUrl: string,
  cancelUrl: string,
) {
  const plan = PLAN_DETAILS[planId];
  const { accessToken, paypalBaseUrl } = await getPayPalAuthContext();

  const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      payment_source: {
        paypal: {
          experience_context: {
            cancel_url: cancelUrl,
            return_url: returnUrl,
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
      },
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

  const approvalUrl = payload.links?.find((link) => link.rel === "approve")
    ?.href;

  if (!approvalUrl) {
    throw new HttpError(
      502,
      "PayPal created the order but did not return an approval URL.",
    );
  }

  return {
    approvalUrl,
    orderId: payload.id,
  };
}

export async function capturePayPalOrder(
  orderId: string,
  userId: string,
  planId: PaidSubscriptionPlanId,
) {
  const plan = PLAN_DETAILS[planId];
  const { accessToken, paypalBaseUrl } = await getPayPalAuthContext();

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

  let verifiedPurchaseUnit = purchaseUnit;
  if (!verifiedPurchaseUnit?.custom_id || !verifiedPurchaseUnit?.reference_id) {
    const verifiedOrder = await getPayPalOrderDetails(
      orderId,
      accessToken,
      paypalBaseUrl,
    );
    verifiedPurchaseUnit = verifiedOrder.purchase_units?.[0] ??
      verifiedPurchaseUnit;
  }

  if (
    (verifiedPurchaseUnit?.custom_id ?? capture?.custom_id) !== userId ||
    verifiedPurchaseUnit?.reference_id !== planId
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
