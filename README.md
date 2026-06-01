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
