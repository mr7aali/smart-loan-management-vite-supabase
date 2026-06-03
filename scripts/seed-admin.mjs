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

const requiredEnv = [
  "VITE_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

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

const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME?.trim() || "Platform Admin";

async function ensureAdminUser() {
  const { data: existingUsers, error: listError } =
    await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (listError) {
    throw listError;
  }

  const existingUser = existingUsers.users.find(
    (user) => user.email?.toLowerCase() === adminEmail,
  );

  if (existingUser) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password: adminPassword,
        user_metadata: {
          full_name: adminName,
        },
        email_confirm: true,
      },
    );

    if (updateError) {
      throw updateError;
    }

    return existingUser.id;
  }

  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
      },
    });

  if (createError || !createdUser.user) {
    throw createError || new Error("Admin user could not be created.");
  }

  return createdUser.user.id;
}

async function promoteAdmin(userId) {
  const nowIso = new Date().toISOString();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: adminEmail,
      full_name: adminName,
      role: "admin",
      account_status: "active",
      plan: "enterprise",
      max_borrowers: null,
      max_loans: null,
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
        plan: "enterprise",
        status: "active",
        billing_cycle: "monthly",
        price: 99,
        start_date: nowIso,
        end_date: new Date(
          new Date(nowIso).setMonth(new Date(nowIso).getMonth() + 1),
        ).toISOString(),
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

function formatSeedError(error) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "PGRST204" &&
    typeof error.message === "string" &&
    error.message.includes("account_status")
  ) {
    return [
      "Database schema is missing the new admin columns.",
      "Apply the migration file `supabase/migrations/20260603_admin_roles_and_payments.sql` to your Supabase database, then run `npm run seed:admin` again.",
    ].join(" ");
  }

  return error;
}

try {
  const userId = await ensureAdminUser();
  await promoteAdmin(userId);
  console.log(`Admin account ready: ${adminEmail}`);
} catch (error) {
  console.error("Failed to seed admin account.");
  console.error(formatSeedError(error));
  process.exitCode = 1;
}
