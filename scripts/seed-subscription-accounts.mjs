import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import ws from "ws";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const requiredEnv = ["VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws,
    },
  },
);

const seedPassword = process.env.SUBSCRIPTION_SEED_PASSWORD || "ChangeMe123!";

const plans = {
  free: {
    name: "Free Demo",
    price: 0,
    maxBorrowers: 10,
    maxLoans: 20,
    borrowerCount: 3,
    loansPerBorrower: 1,
  },
  starter: {
    name: "Starter Demo",
    price: 19,
    maxBorrowers: 50,
    maxLoans: null,
    borrowerCount: 6,
    loansPerBorrower: 1,
  },
  professional: {
    name: "Professional Demo",
    price: 49,
    maxBorrowers: 200,
    maxLoans: null,
    borrowerCount: 8,
    loansPerBorrower: 2,
  },
  enterprise: {
    name: "Enterprise Demo",
    price: 99,
    maxBorrowers: null,
    maxLoans: null,
    borrowerCount: 10,
    loansPerBorrower: 2,
  },
};

const seedAccounts = Object.entries(plans).map(([plan, details]) => ({
  plan,
  email: `${plan}@lendsmart.test`,
  fullName: details.name,
  ...details,
}));

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

async function findUserByEmail(email) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );

    if (user) {
      return user;
    }

    if (data.users.length < 1000) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser(account) {
  const existingUser = await findUserByEmail(account.email);

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password: seedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: account.fullName,
          seed_account: true,
          subscription_plan: account.plan,
        },
      },
    );

    if (error) {
      throw error;
    }

    return existingUser.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: seedPassword,
    email_confirm: true,
    user_metadata: {
      full_name: account.fullName,
      seed_account: true,
      subscription_plan: account.plan,
    },
  });

  if (error || !data.user) {
    throw error || new Error(`Could not create ${account.email}.`);
  }

  return data.user.id;
}

async function seedProfileAndSubscription(userId, account) {
  const nowIso = new Date().toISOString();
  const endDate =
    account.plan === "free" ? null : addMonths(new Date(nowIso), 1).toISOString();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: account.email,
      full_name: account.fullName,
      role: "user",
      account_status: "active",
      plan: account.plan,
      currency: "USD",
      max_borrowers: account.maxBorrowers,
      max_loans: account.maxLoans,
      updated_at: nowIso,
    },
    {
      onConflict: "id",
    },
  );

  if (profileError) {
    throw profileError;
  }

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: account.plan,
        status: "active",
        billing_cycle: "monthly",
        price: account.price,
        start_date: nowIso,
        end_date: endDate,
        updated_at: nowIso,
      },
      {
        onConflict: "user_id",
      },
    );

  if (subscriptionError) {
    throw subscriptionError;
  }
}

async function resetLendingData(userId) {
  const { error: repaymentsError } = await supabase
    .from("repayments")
    .delete()
    .eq("user_id", userId);

  if (repaymentsError) {
    throw repaymentsError;
  }

  const { error: loansError } = await supabase
    .from("loans")
    .delete()
    .eq("user_id", userId);

  if (loansError) {
    throw loansError;
  }

  const { error: borrowersError } = await supabase
    .from("borrowers")
    .delete()
    .eq("user_id", userId);

  if (borrowersError) {
    throw borrowersError;
  }
}

async function seedLendingData(userId, account) {
  await resetLendingData(userId);

  const borrowers = Array.from({ length: account.borrowerCount }, (_, index) => {
    const borrowerNumber = index + 1;

    return {
      user_id: userId,
      name: `${account.plan[0].toUpperCase()}${account.plan.slice(
        1,
      )} Borrower ${borrowerNumber}`,
      email: `${account.plan}.borrower${borrowerNumber}@example.com`,
      phone: `+1555000${String(borrowerNumber).padStart(4, "0")}`,
      address: `${borrowerNumber} Market Street`,
      notes: `Seed borrower for the ${account.plan} subscription account.`,
    };
  });

  const { data: createdBorrowers, error: borrowersError } = await supabase
    .from("borrowers")
    .insert(borrowers)
    .select("id, name");

  if (borrowersError) {
    throw borrowersError;
  }

  const today = new Date();
  const loans = [];

  for (const [borrowerIndex, borrower] of createdBorrowers.entries()) {
    for (let loanIndex = 0; loanIndex < account.loansPerBorrower; loanIndex += 1) {
      const loanNumber = borrowerIndex * account.loansPerBorrower + loanIndex + 1;
      const startDate = addMonths(today, -loanIndex - 1);
      const dueDate = addMonths(today, loanIndex + 3);

      loans.push({
        user_id: userId,
        borrower_id: borrower.id,
        amount: 1000 + loanNumber * 250,
        interest_rate: 8 + loanIndex,
        term_months: 6 + loanIndex * 3,
        start_date: toDateInput(startDate),
        due_date: toDateInput(dueDate),
        status: loanNumber % 5 === 0 ? "paid" : "active",
        notes: `Seed loan for ${borrower.name}.`,
      });
    }
  }

  const { data: createdLoans, error: loansError } = await supabase
    .from("loans")
    .insert(loans)
    .select("id, amount, status");

  if (loansError) {
    throw loansError;
  }

  const repayments = createdLoans.slice(0, Math.min(6, createdLoans.length)).map(
    (loan, index) => ({
      user_id: userId,
      loan_id: loan.id,
      amount: loan.status === "paid" ? loan.amount : Math.round(loan.amount * 0.25),
      date: toDateInput(addMonths(today, -index)),
      method: index % 2 === 0 ? "bank_transfer" : "cash",
      notes: "Seed repayment.",
    }),
  );

  if (repayments.length > 0) {
    const { error: repaymentsError } = await supabase
      .from("repayments")
      .insert(repayments);

    if (repaymentsError) {
      throw repaymentsError;
    }
  }
}

async function seedPayment(userId, account) {
  if (account.plan === "free") {
    return;
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("payments").upsert(
    {
      user_id: userId,
      provider: "paypal",
      provider_order_id: `seed-order-${account.plan}`,
      provider_capture_id: `seed-capture-${account.plan}`,
      subscription_plan: account.plan,
      amount: account.price,
      currency: "USD",
      status: "completed",
      paid_at: nowIso,
      updated_at: nowIso,
    },
    {
      onConflict: "provider_capture_id",
    },
  );

  if (error) {
    throw error;
  }
}

function formatSeedError(error) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "PGRST204"
  ) {
    return [
      "Database schema is missing one or more columns used by the seed.",
      "Apply `supabase-schema.sql` and all files in `supabase/migrations`, then rerun `npm run seed:subscriptions`.",
    ].join(" ");
  }

  return error;
}

try {
  const results = [];

  for (const account of seedAccounts) {
    const userId = await ensureAuthUser(account);
    await seedProfileAndSubscription(userId, account);
    await seedLendingData(userId, account);
    await seedPayment(userId, account);

    results.push({
      plan: account.plan,
      email: account.email,
      borrowers: account.borrowerCount,
      loans: account.borrowerCount * account.loansPerBorrower,
    });
  }

  console.log("Subscription demo accounts ready.");
  console.table(results);
  console.log(`Password for all demo accounts: ${seedPassword}`);
} catch (error) {
  console.error("Failed to seed subscription demo accounts.");
  console.error(formatSeedError(error));
  process.exitCode = 1;
}
