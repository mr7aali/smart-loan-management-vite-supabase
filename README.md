# LendSmart

LendSmart is a React, Vite, and Supabase app for managing borrowers, loans, repayments, reports, and subscription upgrades.

## Development

```powershell
npm install
npm run dev
```

The app serves locally on `http://localhost:5173`.

## Frontend Environment

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_PAYPAL_CLIENT_ID=...
VITE_PAYPAL_CURRENCY=USD
```

## Supabase Edge Function Secrets

```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENV=live
SUPABASE_SERVICE_ROLE_KEY=...
```

If you are using PayPal sandbox credentials, set `PAYPAL_ENV=sandbox` and make sure both the frontend `VITE_PAYPAL_CLIENT_ID` and the server-side PayPal secrets come from the same sandbox app. Do not mix live and sandbox credentials.

## PayPal Checkout Setup

1. Apply `supabase-schema.sql` on a fresh project, or run `supabase/migrations/20260525_paypal_subscription_security.sql` on an existing one.
2. Deploy the Supabase Edge Functions in `supabase/functions/`:
   `paypal-create-order`
   `paypal-capture-order`
   `subscription-manage`
3. Add the PayPal and Supabase secrets in your Supabase project.
4. Set `VITE_PAYPAL_CLIENT_ID` in the frontend environment and redeploy the app.

Paid plans now activate only after the server confirms a successful PayPal capture.

## Authentication Email Setup

Supabase's built-in email provider is intended for testing and has a very low
project-wide limit for signup, password-reset, and email-change messages. Before
using signup in production:

1. Open the Supabase dashboard and go to **Authentication > Emails > SMTP Settings**.
2. Enable custom SMTP and enter credentials from an email provider such as
   Resend, Postmark, Amazon SES, SendGrid, or Brevo.
3. Go to **Authentication > Rate Limits** and set an email limit appropriate for
   the provider and expected signup volume.
4. Keep email confirmation enabled and consider enabling CAPTCHA under
   **Authentication > Attack Protection**.
